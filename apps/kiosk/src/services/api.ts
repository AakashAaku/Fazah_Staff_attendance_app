/**
 * Fazah Auto Garage - Centralized API Service
 * Fixed production backend: https://fazah-staff-attendance-app.onrender.com
 * No manual browser entry required.
 */

const DEFAULT_API_URL = 'https://fazah-staff-attendance-app.onrender.com';

// Clean up legacy manual storage key if previously set in user's browser
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('fazah_custom_api_url');
  } catch (_) {}
}

export function getApiBaseUrl(): string {
  // 1. Explicit Vite Environment Variable (if set)
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 2. Local development: use relative '' so Vite proxy forwards to local backend
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return '';
    }
  }

  // 3. Production: automatically use the live Render backend
  return DEFAULT_API_URL;
}

export function buildApiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (base) {
    if (base.endsWith('/api') && cleanPath.startsWith('/api/')) {
      return `${base}${cleanPath.substring(4)}`;
    }
    return `${base}${cleanPath}`;
  }

  return cleanPath;
}

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = buildApiUrl(endpoint);
  
  // Auto-inject Authorization header if adminToken exists in sessionStorage or localStorage
  const token = typeof window !== 'undefined'
    ? (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken'))
    : null;
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });

  // Handle 401 Unauthorized for authenticated endpoints (auto sign-out expired sessions)
  if (
    response.status === 401 &&
    !endpoint.includes('/api/auth/login') &&
    !endpoint.includes('/api/kiosk/staff-login')
  ) {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('adminToken');
      localStorage.removeItem('adminToken');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
  }

  return response;
}

export interface HealthCheckResult {
  connected: boolean;
  latencyMs: number;
  message?: string;
  url: string;
}

export async function checkApiHealth(): Promise<HealthCheckResult> {
  const start = Date.now();
  const endpoint = buildApiUrl('/api/health');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    
    let res = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok && res.status === 404) {
      const fallbackUrl = buildApiUrl('/api/kiosk/employees');
      res = await fetch(fallbackUrl);
    }

    const latencyMs = Date.now() - start;
    if (res.ok) {
      return { connected: true, latencyMs, url: endpoint };
    }
    return { connected: false, latencyMs, message: `HTTP ${res.status}`, url: endpoint };
  } catch (err: any) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
      message: err.name === 'AbortError' ? 'Connection timed out' : (err.message || 'Network error'),
      url: endpoint,
    };
  }
}
