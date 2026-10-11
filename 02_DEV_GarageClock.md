# Development Document: Garage Attendance & Time-Tracking System ("GarageClock")

Version 1.0 | Read together with `01_PRD_Garage_Attendance_System.md`
Audience: developers and AI coding agents. Follow this document as the build specification. Where a choice is marked **(default)**, use it unless the product owner says otherwise.

---

## 1. Instructions for the Implementing Agent

1. Build in the milestone order of section 17. Do not skip security items.
2. Write tests with every feature. Do not mark a milestone done until its Definition of Done (section 18) passes.
3. Never trust the client for time, identity, or location decisions. The server decides.
4. Punch data is append-only. Never write UPDATE or DELETE paths for the `punches` table.
5. Do not log PINs, tokens, or photos' raw bytes. Never return password/PIN hashes in any API.
6. Every state-changing admin action must create an audit log entry.
7. Ask for clarification only on items in PRD section 14; otherwise use the defaults here.

## 2. Recommended Technology Stack (default)

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | React + TypeScript + Vite, PWA | Tailwind CSS, i18n (en, ar with RTL), TanStack Query |
| Backend | Node.js + TypeScript with NestJS (or Fastify) | Modular monolith, REST + WebSocket |
| Database | PostgreSQL 15+ | Row-level tenant scoping, `pgcrypto`, partitioned punches table |
| Cache / queues | Redis | Rate limiting, QR nonces, BullMQ job queue |
| Object storage | S3-compatible (AWS S3, MinIO) | Punch photos, exports; private buckets, signed URLs |
| Auth | Argon2id, JWT access (15 min) + rotating refresh, TOTP 2FA, WebAuthn | |
| Realtime | WebSocket (Socket.IO) with polling fallback | Live board |
| Email | SES / SendGrid / SMTP | Templates |
| Face (R2) | Pluggable provider (AWS Rekognition, or on-prem library) | Behind an interface |
| Infra | Docker, docker-compose for dev, Kubernetes or ECS for prod | Terraform optional |
| CI/CD | GitHub Actions | Lint, test, build, scan, deploy |
| Observability | OpenTelemetry, Prometheus/Grafana, Sentry | |

Any equivalent stack (for example Django, Laravel, .NET) is acceptable if every requirement is met.

## 3. Architecture

```
 [Kiosk Tablet PWA] [Employee Phone PWA] [Admin/Supervisor Web]
          \                |                  /
           +-------- HTTPS (TLS) -------------+
                         |
                    [API Gateway / WAF / Rate limit]
                         |
          +--------------+---------------+
          |      Application (modular monolith)      |
          |  auth | punch | shifts | timesheet | fraud |
          |  reports | notifications | admin | audit   |
          +----+-----------+-----------+------------+
               |           |           |
          PostgreSQL     Redis     Object Storage
               |
          Worker (BullMQ): auto-close, risk jobs, reports, emails, face match
```

**Modules:** `auth`, `tenants`, `employees`, `devices`, `punch`, `qr`, `shifts`, `policies`, `timesheet`, `corrections`, `leave`, `fraud`, `liveboard`, `reports`, `notifications`, `audit`, `settings`.

**Multi-tenancy:** shared database, `tenant_id` on every business table. Enforce with PostgreSQL Row-Level Security plus a request-scoped tenant context. Branch scoping is applied on top for supervisors.

## 4. Security Design (Core of the Product)

### 4.1 Identity and credentials
- Employee PIN: 6 digits, Argon2id hash (memory 64 MB, iterations 3), per-user salt, server pepper from secret store.
- Reject weak PINs (sequences, repeats, common lists, date-like patterns).
- Lockout: 5 failures in 15 minutes → lock 15 minutes, escalate on repeats (30 min, 1 hour, admin unlock). Count per employee **and** per IP/device.
- PIN change: requires supervisor-issued one-time reset token (expires in 24 h) or verified reset flow. Employees never see or choose through admin.
- Admin/supervisor: email + password (min 12 chars, breached-password check), mandatory TOTP 2FA, recovery codes.
- Sessions: access token 15 min, refresh token rotation with reuse detection, revoke on password/PIN reset, device revoke, logout.

### 4.2 Device trust
- **Kiosk enrollment:** admin generates a single-use enrollment code (10 min). The tablet enters it and receives a long-lived device credential (random 256-bit secret, stored hashed server side, kept in IndexedDB/secure storage on the tablet). Every kiosk API call sends the device credential and is rate limited. Revocation is immediate.
- **Employee phone binding:** first login on a phone creates a pending device (WebAuthn passkey preferred, otherwise a generated device key pair with the public key stored on server). A supervisor approves it. Only one active phone per employee (configurable, max 2). Every phone punch request is signed with the device key (challenge-response), so a copied password or token cannot punch from another phone.
- Fingerprinting (user agent, screen, timezone) is stored as a secondary signal only.

### 4.3 Presence proof
- **Network:** per-branch allowed CIDR list; check `X-Forwarded-For` only from the trusted proxy chain.
- **Rotating QR:** the kiosk requests `GET /kiosk/qr` every 20 s. Payload: `{branch_id, kiosk_id, nonce, issued_at, exp}` signed with HMAC-SHA256 using a per-kiosk secret. The server stores the nonce in Redis with TTL 45 s. Phone submits the payload in the punch request. The server verifies signature, expiry (30 s), single use (delete nonce atomically), and that the phone's branch matches. Screenshots become worthless within seconds.
- **Geofence (P1):** compare the phone's GPS with the branch center and radius; treat as a risk signal, since GPS can be spoofed.

### 4.4 Evidence
- Kiosk punches capture a photo through `getUserMedia` with no file picker (prevents uploading a stored image). Photo is sent with a server-issued punch challenge ID.
- Server validates image type/size, strips EXIF, stores in a private bucket under `tenant/branch/date/punch_id.jpg`, encrypts at rest, and keeps a SHA-256 hash in the DB.
- Basic server-side checks: at least one face detected, not multiple faces, not blurry/black frame. Failures create flags (or block, per policy).
- Confirmation screen displays the captured photo and name for 3 seconds.
- Retention default 90 days for photos (configurable), punch metadata retained per legal requirement.

### 4.5 Anti-replay and integrity
- Every punch request has a server-issued, single-use, short-lived `challenge_id` (60 s) tied to device and employee candidate.
- Idempotency key per request to survive retries without duplicates.
- Server timestamps only. Offline kiosk punches store a monotonic delta and are timestamped on sync with a flagged "reconstructed time" and a bounded maximum offline window.
- Audit log hash chain: each entry stores `prev_hash` and `hash = SHA256(prev_hash || canonical_json(entry))`. A nightly job verifies the chain and alerts on a break.
- Punch table is append-only enforced by DB trigger rejecting UPDATE/DELETE and by revoking those privileges from the app role.

### 4.6 Application security checklist
- OWASP ASVS L2; protect against injection (parameterized queries/ORM), XSS (output encoding, CSP), CSRF (SameSite cookies + tokens), SSRF, IDOR (tenant and branch checks in every query), mass assignment.
- Security headers: HSTS, CSP, X-Content-Type-Options, frame-ancestors, referrer policy.
- Rate limiting: login, PIN attempts, punch, QR, password reset, API per key.
- Input validation with schemas (zod / class-validator) on all endpoints.
- Secrets in a secret manager; no secrets in the repo; rotate keys; separate keys per environment.
- Encrypt PII columns where practical; database encryption at rest; TLS everywhere.
- Dependency scanning (npm audit/Snyk/Dependabot), container scanning, SAST (CodeQL), secret scanning in CI.
- Daily encrypted backups, tested restores.
- Pen-test before production.

## 5. Data Model (PostgreSQL)

All tables have `id UUID PK`, `tenant_id UUID NOT NULL`, `created_at`, `updated_at` unless noted. All times `timestamptz` (UTC).

**tenants**: name, country, default_timezone, locale, status, plan, settings JSONB.
**branches**: tenant_id, name, address, timezone, lat, lng, geofence_radius_m, allowed_cidrs text[], status.
**users**: tenant_id, email, password_hash, totp_secret_enc, role (`super_admin|admin|supervisor|auditor|employee`), status, last_login_at.
**employees**: tenant_id, branch_id, user_id (nullable), employee_code (unique per tenant), full_name, job_title (mechanic, electrician, a/c technician, helper, advisor, etc.), phone, email, hire_date, status (`active|suspended|terminated`), profile_photo_key, photo_consent_at, supervisor_id.
**employee_credentials**: employee_id, pin_hash, pin_set_at, failed_attempts, locked_until, must_reset.
**devices**: tenant_id, branch_id, type (`kiosk|phone`), employee_id (for phone), name, public_key, credential_hash, status (`pending|active|revoked`), last_seen_at, last_ip, approved_by, approved_at.
**shifts**: name, start_time, end_time, break_minutes, grace_minutes, crosses_midnight, color.
**shift_assignments**: employee_id, shift_id, valid_from, valid_to, weekdays smallint[].
**holidays**: branch_id or tenant_id, date, name.
**policies**: scope (tenant/branch), grace_minutes, late_threshold_min, early_leave_threshold_min, rounding_mode, rounding_minutes, overtime_daily_hours, overtime_weekly_hours, overtime_multiplier JSONB, max_daily_hours, min_rest_hours, auto_close_after_min, photo_required, face_match_mode, min_punch_interval_sec, photo_retention_days.
**punches** (append-only, partitioned monthly): employee_id, branch_id, device_id, type (`IN|OUT|BREAK_START|BREAK_END`), server_ts, method (`kiosk_pin|phone_qr|admin_manual|auto_close|offline_sync`), ip inet, user_agent, lat, lng, photo_key, photo_sha256, face_score, challenge_id, idempotency_key (unique), risk_score, flags text[], session_id (links IN/OUT), client_meta JSONB.
**work_sessions** (derived): employee_id, branch_id, work_date, in_punch_id, out_punch_id, started_at, ended_at, break_minutes, worked_minutes, status (`open|closed|auto_closed|adjusted`).
**time_adjustments**: employee_id, original_punch_id (nullable), session_id, type (`add|modify|void`), new_ts, new_type, reason, requested_by, approved_by, status, approved_at, evidence_key.
**daily_summaries**: employee_id, work_date, shift_id, scheduled_minutes, worked_minutes, late_minutes, early_leave_minutes, overtime_minutes, absent bool, status, locked bool.
**leave_types**, **leave_balances**, **leave_requests**: standard structure with status, approver, dates, days.
**fraud_flags**: punch_id, employee_id, code, severity, details JSONB, status (`open|valid|fraud|discuss`), reviewed_by, reviewed_at, comment.
**qr_nonces**: stored in Redis (not Postgres).
**notifications**: user_id, channel, template, payload, status, sent_at.
**audit_logs** (append-only): actor_user_id, actor_type, action, entity_type, entity_id, before JSONB, after JSONB, ip, user_agent, prev_hash, hash, created_at.
**payroll_periods**: start, end, status (`open|closed`), closed_by.

**Indexes:** `(tenant_id, employee_id, server_ts desc)` on punches; `(tenant_id, branch_id, server_ts)`; unique `(idempotency_key)`; `(employee_id, work_date)` on sessions and summaries; GIN on flags.

## 6. API Specification (REST, JSON, `/api/v1`)

Standard error format: `{ "error": { "code": "STRING", "message": "text", "details": {} } }`. Pagination: `?page=&page_size=` or cursor. All endpoints require auth unless marked public.

### Auth
- `POST /auth/login` (admin/supervisor: email, password) → requires `POST /auth/2fa/verify`
- `POST /auth/refresh`, `POST /auth/logout`
- `POST /auth/employee/activate` (activation token, set PIN, consent)
- `POST /auth/pin/reset-request`, `POST /auth/pin/reset-confirm`

### Kiosk
- `POST /kiosk/enroll` (enrollment code) → device credential
- `GET /kiosk/employees?branch=` (minimal: id, name, photo thumb)
- `GET /kiosk/qr` → signed rotating QR payload
- `POST /kiosk/punch/challenge` → `challenge_id`
- `POST /kiosk/punch` multipart: employee_id/code, pin, type, photo, challenge_id, idempotency key → punch result with confirmation data
- `POST /kiosk/sync` batch for offline punches

### Employee (phone)
- `POST /me/device/register`, `GET /me/status`
- `POST /me/punch/challenge`, `POST /me/punch` (signed with device key, QR payload, optional location)
- `GET /me/timelog?from=&to=`, `GET /me/summary`
- `POST /me/corrections`, `GET /me/corrections`
- `POST /me/leave`, `GET /me/leave`

### Supervisor / Admin
- `GET /liveboard?branch=` and WebSocket `/ws/liveboard`
- `GET /punches`, `GET /punches/:id` (with signed photo URL)
- `GET /flags`, `PATCH /flags/:id` (decision + comment)
- `GET /corrections`, `PATCH /corrections/:id` (approve/reject)
- `GET/POST/PATCH /employees`, `POST /employees/import`, `POST /employees/:id/pin-reset`
- `GET/POST/PATCH /devices`, `POST /devices/:id/approve`, `POST /devices/:id/revoke`, `POST /kiosk/enrollment-codes`
- `GET/POST/PATCH /shifts`, `/shift-assignments`, `/holidays`, `/policies`
- `GET /reports/{daily|timesheet|late|absence|overtime|flags|manual-edits|devices}` with `format=json|csv|xlsx|pdf`
- `POST /payroll-periods/:id/close`
- `GET /audit-logs`

### Super Admin
- `GET/POST/PATCH /tenants`, `/branches`

## 7. Punch Processing Algorithm

```
punch(request):
 1. Authenticate device (kiosk credential or phone signature). Reject if revoked/pending.
 2. Resolve tenant, branch from the device. Verify allowed IP/CIDR (policy).
 3. Validate challenge_id: exists, unused, not expired, bound to device. Mark used.
 4. Check idempotency_key; return stored result if duplicate.
 5. Identify employee:
      kiosk: employee_code + PIN (check lock status first, then verify hash, update attempts)
      phone: authenticated session + device signature + valid QR nonce (atomic consume)
 6. Check employee active, not on approved full-day leave without override rule.
 7. Enforce min interval since last punch.
 8. Load open session; apply state machine:
      IN       allowed if no open session
      OUT      allowed if open session and not on break
      BR_START allowed if open session and not on break
      BR_END   allowed if on break
 9. Photo handling (kiosk): validate, strip EXIF, store, hash, run face-count check
    (and face match if enabled).
10. server_ts = now() from database/NTP-synced server.
11. Insert punch row (append-only) in a transaction with session update.
12. Run risk engine (section 8) synchronously for cheap rules, enqueue heavy ones.
13. Write audit log. Publish live-board event. Return confirmation data.
```

State machine errors return codes: `ALREADY_IN`, `NOT_IN`, `ON_BREAK`, `NOT_ON_BREAK`, `TOO_SOON`, `LOCKED`, `DEVICE_NOT_APPROVED`, `OUTSIDE_NETWORK`, `QR_EXPIRED`, `QR_REUSED`, `PHOTO_REQUIRED`, `INVALID_CREDENTIALS`.

## 8. Fraud / Risk Engine

Implement as a rules pipeline: each rule returns `{code, severity (1-5), details}`. Risk score = weighted sum; thresholds (default): 0-2 normal, 3-5 review, 6+ high (requires supervisor review before the day is approved).

| Rule | Condition |
|------|-----------|
| R1 NEW_DEVICE | First use of a device by this employee |
| R2 SHARED_DEVICE | A phone device used by 2+ employees in 24 h |
| R3 RAPID_SEQUENCE | Different employees punched from one phone within 2 minutes |
| R4 PHOTO_ISSUE | No face, multiple faces, black/blurry, duplicate photo hash seen before |
| R5 FACE_MISMATCH | Face score below threshold (R2 feature) |
| R6 PIN_FAILURES | 3+ failures before success in 10 min |
| R7 OUTSIDE_NETWORK / GEO_OUTSIDE | Policy violations that were allowed with a warning |
| R8 ROUND_TIME_PATTERN | Same minute-of-hour over 8+ days (statistical check) |
| R9 NO_JOB_ACTIVITY | Present 4+ hours but no job card/task activity (when integration exists) |
| R10 OFFLINE_SYNC | Punch came via offline sync |
| R11 AUTO_CLOSED / MANUAL_ENTRY | Not a real-time punch |
| R12 IMPOSSIBLE_TRAVEL | Phone location far from the branch minutes after another punch |
| R13 SIMULTANEOUS_PRESENCE | Same employee punches at two branches |
| R14 LONG_SESSION | Worked time above max_daily_hours |

Nightly job: aggregate patterns per employee and create an integrity report. Flags never delete evidence.

## 9. Timekeeping Calculation

- Convert punches to `work_sessions`; apply approved `time_adjustments` on top (original retained).
- `worked = sum(session durations) - unpaid break minutes` (policy decides auto-deduct vs recorded breaks).
- Rounding per policy (none, nearest N minutes, round in favor of company/employee) applied at summary level only; raw times stay unchanged.
- Late = `first_in - (shift_start + grace)` if positive; early leave likewise.
- Overtime = worked above threshold (daily and/or weekly), then multiplier categories (normal, weekend, holiday).
- Cross-midnight shifts attach to the shift start date.
- Absent = scheduled working day without punch and without approved leave or holiday.
- Auto-close job runs every 5 minutes: opens sessions past `shift_end + auto_close_after_min` get closed at shift end, flagged `AUTO_CLOSED`, and notify supervisor.
- Payroll period close sets `daily_summaries.locked = true`; changes then require admin unlock with audit.

## 10. Frontend Requirements

**Kiosk screen (tablet, landscape, kiosk mode):**
- Large clock, branch name, who-is-in count; employee grid with photos plus a code keypad
- Tap name → PIN keypad (large digits, masked) → camera auto-capture with countdown → confirmation card (photo, name, IN/OUT, time) for 3 seconds with a color cue
- Rotating QR panel for phone punching
- Auto-return to home after 20 s idle; screen lock prevents leaving the app; fullscreen API; wake lock
- Offline banner and queued-punch indicator

**Employee PWA:** status card, big Punch button, QR scanner, today's log, weekly summary, correction and leave requests, device status.

**Supervisor/Admin:** live board with filters (in, out, break, late, absent); review queue (photo, device, history); approvals inbox; timesheet grid with inline adjustment requests; shift roster calendar; reports with filters and exports; device manager; employee manager; policy settings; audit viewer.

**General:** English and Arabic (RTL), light/dark, responsive, accessible, i18n of all strings, timezone aware.

## 11. Notifications and Jobs

Queue jobs: `auto-close-sessions`, `missed-punch-reminder`, `late-alert`, `fraud-rules-nightly`, `daily-summary-build`, `weekly-integrity-report`, `photo-retention-purge`, `audit-chain-verify`, `report-export`, `email-send`, `face-match` (R2). All jobs idempotent with retries and dead-letter queue.

## 12. Privacy and Compliance

- Collect consent for photo (and biometrics) at activation; store consent timestamp and version.
- Provide a privacy notice, purpose limitation, retention schedule, access/erasure workflow.
- Face templates (R2) stored encrypted, separate from the main DB, deletable on request or termination.
- Role-based access to photos; every photo view is audited.
- Verify local legal requirements for each client country (for example UAE PDPL and labor law) before enabling biometrics or setting overtime rules. Make these configurable, not hard-coded.

## 13. Testing Strategy

| Type | Scope |
|------|-------|
| Unit | State machine, risk rules, time calculations (include midnight, DST-free UTC math, rounding, overtime edge cases) |
| Integration | Punch flow with DB/Redis/S3, RLS tenant isolation, lockouts |
| E2E (Playwright) | Kiosk punch, phone punch with QR, correction approval, review queue, report export |
| Security | Authz tests for IDOR and cross-tenant access, replay of QR and challenge, token reuse, brute-force limits, file upload tests |
| Load | 500 concurrent punches in a 60-second burst at shift start; target p95 under 500 ms |
| Chaos | Network drop on kiosk, Redis outage, S3 outage (punch must still succeed with FLAG_PHOTO_MISSING if policy allows) |
| Accessibility | Axe checks, RTL review |
| UAT | Real garage pilot for 2 weeks before rollout |

Coverage target: 80% on backend business logic; 100% on the punch state machine and time calculations.

## 14. Deployment and Operations

- Environments: dev, staging, production, separate secrets and databases.
- Containers built in CI, scanned, deployed with blue/green or rolling updates.
- Database migrations versioned (Prisma/TypeORM/Flyway); backward compatible.
- Health endpoints `/healthz`, `/readyz`; autoscaling on CPU and queue depth.
- Backups: daily full + WAL (point-in-time), 30-day retention; quarterly restore drill.
- Monitoring: error rate, punch latency, queue backlog, failed logins, flag volume, clock drift, kiosk heartbeat (alert if a kiosk is silent for 10 minutes).
- Runbooks: kiosk replacement, device revoke, tenant restore, key rotation, incident response.

## 15. Environment Variables (example)

```
APP_ENV, APP_URL, API_URL
DATABASE_URL, REDIS_URL
S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY, S3_REGION
JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, PIN_PEPPER, QR_SIGNING_MASTER_KEY, ENCRYPTION_KEY
SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_FROM
FACE_PROVIDER, FACE_API_KEY (R2)
SENTRY_DSN, OTEL_EXPORTER_ENDPOINT
TRUSTED_PROXY_CIDRS
```

## 16. Suggested Repository Structure

```
/apps
  /api            # NestJS modules: auth, punch, qr, fraud, ...
  /web            # React: admin, supervisor, employee PWA
  /kiosk          # React kiosk app (can share packages with web)
  /worker         # BullMQ processors
/packages
  /shared         # types, zod schemas, constants
  /ui             # shared components
  /config
/infra            # docker, k8s/terraform, CI
/docs             # PRD, this doc, ADRs, runbooks, API (OpenAPI)
/tests            # e2e, load
```

Generate an OpenAPI spec from the code and publish it. Keep Architecture Decision Records in `/docs/adr`.

## 17. Milestones and Task Breakdown

**M0 Foundation (week 1)**: repo, CI, lint, Docker, DB migrations, tenancy with RLS, RBAC, audit log with hash chain, base UI shell, i18n.

**M1 Identity (week 2)**: admin login with 2FA, employee CRUD and import, activation and PIN set, lockout, device model, kiosk enrollment, phone device registration and approval.

**M2 Punch core (weeks 3-4)**: challenge endpoint, kiosk punch with PIN and photo, state machine, append-only punches, sessions, confirmation screen, IP restriction, idempotency, rate limits, integration and E2E tests.

**M3 Presence proof (week 5)**: rotating QR service, phone punch flow with device signature, geofence option, offline queue and sync.

**M4 Time engine (week 6)**: shifts, policies, holidays, summary calculation, overtime, lateness, auto-close job, adjustments and corrections workflow, leave basics.

**M5 Fraud and review (week 7)**: risk engine R1-R14 (subset first), flag queue UI, decisions, notifications, integrity report.

**M6 Live board and reports (week 8)**: WebSocket board, dashboards, reports with CSV/Excel/PDF, scheduled emails, payroll period close and lock.

**M7 Hardening (weeks 9-10)**: security tests and pen-test fixes, load test, backup and restore drill, observability, accessibility, documentation, pilot in one garage.

**R2 backlog**: face match and liveness, random re-verification, job-card integration, WhatsApp/SMS, RFID/biometric terminal adapter.

## 18. Definition of Done (per feature and for release)

- Code reviewed, tests passing (unit, integration, E2E), no critical or high security findings
- Audit log entries exist for all state-changing actions
- Tenant isolation test passes (user from tenant A cannot read or write tenant B data)
- Punch table cannot be modified or deleted by the app role (verified by test)
- Replay tests fail as expected (reused QR, reused challenge, stolen token on another device)
- Performance targets met; no N+1 queries on live board and reports
- Accessibility and RTL checks pass
- Documentation updated (API spec, runbooks, admin guide, employee quick guide in English and Arabic)
- Pilot garage signs off on UAT checklist

## 19. Seed Data and Demo

Seed one tenant with two branches, five roles, ten employees (mechanic, electrician, A/C technician, helper, advisor), three shifts (morning, evening, night crossing midnight), sample holidays, one kiosk device, one phone device, and 30 days of sample punches including flagged ones for demo and testing.

## 20. Future Integration with the Garage Management System

Expose events and APIs so job cards and tasks can reference employees and punch status: `employee.punched_in`, `employee.punched_out`, `timesheet.closed`. A job card can only be started by an employee currently punched in. Total job time can be compared with attendance time to find unproductive hours and feed payroll, costing, and accounting modules.
