import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import * as nodemailer from 'nodemailer';
import { Punch, PunchMethod, PunchType } from './entities/punch.entity';
import { WorkSession } from '../timesheet/entities/work-session.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { EmployeesService } from '../employees/employees.service';
import { DevicesService } from '../devices/devices.service';
import { QrService } from '../qr/qr.service';
import { KioskPunchDto, ChallengeResponseDto, MobilePunchDto } from './dto/punch.dto';

@Injectable()
export class PunchesService {
  // In-memory challenge store for now (M2). Should use Redis in prod.
  private challenges = new Map<string, { expiresAt: Date, deviceId: string }>();

  constructor(
    @InjectRepository(Punch)
    private punchRepo: Repository<Punch>,
    @InjectRepository(WorkSession)
    private sessionRepo: Repository<WorkSession>,
    @InjectRepository(LeaveRequest)
    private leaveRepo: Repository<LeaveRequest>,
    private employeesService: EmployeesService,
    private devicesService: DevicesService,
    private qrService: QrService,
  ) {}

  async punchMobile(tenantId: string, dto: MobilePunchDto, ip: string, userAgent: string) {
    // Verify QR signature and nonce
    const payload = this.qrService.verifyQr(dto.qrPayload, dto.qrSignature);
    
    // Validate lat/lng with branch (geofence). For M3, just save it.
    // In future, check distance to payload.branchId coords.

    // Then process like a simple punch, but marked as mobile
    return this.simplePunch(tenantId, dto.employeeId, dto.type, ip, userAgent, PunchMethod.PHONE_QR);
  }

  async generateChallenge(deviceId: string): Promise<ChallengeResponseDto> {
    const challengeId = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 1000); // 60s
    this.challenges.set(challengeId, { expiresAt, deviceId });
    return { challengeId, expiresAt };
  }

  async punchKiosk(tenantId: string, deviceId: string, dto: KioskPunchDto, ip: string, userAgent: string) {
    // 1. Authenticate device
    const device = await this.devicesService.findOne(tenantId, deviceId);
    if (!device || device.status !== 'active' || device.type !== 'kiosk') {
      throw new UnauthorizedException('Invalid or unapproved kiosk device');
    }

    // 2. Validate challenge
    if (dto.challengeId) {
      const challenge = this.challenges.get(dto.challengeId);
      if (!challenge) {
        throw new BadRequestException('Challenge not found or expired');
      }
      if (challenge.deviceId !== deviceId) {
        throw new BadRequestException('Challenge bound to another device');
      }
      if (challenge.expiresAt < new Date()) {
        this.challenges.delete(dto.challengeId);
        throw new BadRequestException('Challenge expired');
      }
      this.challenges.delete(dto.challengeId); // atomic consume
    }

    // 3. Check idempotency key
    if (dto.idempotencyKey) {
      const existingPunch = await this.punchRepo.findOne({ where: { idempotencyKey: dto.idempotencyKey } });
      if (existingPunch) {
        return existingPunch;
      }
    }

    // 4. Identify employee
    const employee = await this.employeesService.findOne(tenantId, dto.employeeId);
    if (employee.status !== 'active') {
      throw new ForbiddenException('Employee is not active');
    }

    // 5. Verify PIN
    const pinValid = await this.employeesService.verifyPin(employee.id, dto.pin);
    if (!pinValid) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    // 6. Handle Photo
    let photoKey: string | undefined;
    let photoSha256: string | undefined;
    if (dto.photoBase64) {
      // Mocking S3 upload logic
      photoKey = `mock-s3-key-${randomUUID()}.jpg`;
      photoSha256 = 'mock-sha256';
    }

    // Auto-close any stale or unclosed session from previous dates / past 9:00 PM
    await this.autoCloseStaleSessions(tenantId, employee.id);

    const workDate = new Date().toISOString().split('T')[0];
    let session = await this.sessionRepo.findOne({ 
      where: { employeeId: employee.id, status: 'open' } 
    });

    if (dto.type === PunchType.IN) {
      if (session) throw new BadRequestException('ALREADY_IN');
    } else if (dto.type === PunchType.OUT) {
      if (!session) throw new BadRequestException('NOT_IN');
      if (session.inPunchId === null) throw new BadRequestException('NOT_IN'); // Should not happen
    } else if (dto.type === PunchType.BREAK_START) {
      if (!session) throw new BadRequestException('NOT_IN');
      // If already on break, maybe reject, but let's assume they are not for now.
    } else if (dto.type === PunchType.BREAK_END) {
      if (!session) throw new BadRequestException('NOT_IN');
    }

    // Create the punch
    const punch = this.punchRepo.create({
      tenantId,
      employeeId: employee.id,
      branchId: employee.branch?.id || device.branchId,
      deviceId: device.id,
      type: dto.type,
      serverTs: new Date(),
      method: PunchMethod.KIOSK_PIN,
      ip,
      userAgent,
      challengeId: dto.challengeId,
      idempotencyKey: dto.idempotencyKey,
      clientMeta: dto.clientMeta,
      photoKey,
      photoSha256,
      sessionId: session?.id,
    });

    await this.punchRepo.save(punch);

    // Update session
    if (dto.type === PunchType.IN) {
      session = this.sessionRepo.create({
        tenant: { id: tenantId },
        employee: { id: employee.id },
        branch: { id: punch.branchId },
        workDate,
        inPunch: { id: punch.id },
        startedAt: punch.serverTs,
        status: 'open',
      });
      await this.sessionRepo.save(session);
      
      punch.sessionId = session.id;
      await this.punchRepo.save(punch);
    } else if (dto.type === PunchType.OUT && session) {
      session.outPunch = punch;
      session.endedAt = punch.serverTs;
      session.status = 'closed';
      session.workedMinutes = Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 60000) - session.breakMinutes;
      await this.sessionRepo.save(session);
    } else if (dto.type === PunchType.BREAK_START && session) {
      // Just record punch, time calculation handled on break end
    } else if (dto.type === PunchType.BREAK_END && session) {
      // Get the last BREAK_START
      const lastBreakStart = await this.punchRepo.findOne({
        where: { sessionId: session.id, type: PunchType.BREAK_START },
        order: { serverTs: 'DESC' }
      });
      if (lastBreakStart) {
        const breakDuration = Math.floor((punch.serverTs.getTime() - lastBreakStart.serverTs.getTime()) / 60000);
        session.breakMinutes += breakDuration;
        await this.sessionRepo.save(session);
      }
    }

    return {
      success: true,
      punchId: punch.id,
      type: punch.type,
      time: punch.serverTs,
      employeeName: employee.fullName,
    };
  }
  async autoCloseStaleSessions(tenantId: string, employeeId: string) {
    const openSession = await this.sessionRepo.findOne({
      where: { employeeId, status: 'open' },
    });

    if (!openSession) {
      // If employee currently has status === 'IN', but no open session exists, reset to 'OUT'
      const emp = await this.employeesService.findOne(tenantId, employeeId);
      if (emp && emp.status === 'IN') {
        await this.employeesService.update(tenantId, employeeId, { status: 'OUT' });
      }
      return null;
    }

    const now = new Date();
    const inTime = openSession.startedAt ? new Date(openSession.startedAt) : now;

    // Format dates in Asia/Dubai timezone (GST, UTC+4)
    const inDateStr = inTime.toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' });
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' });

    // 8:00 PM (20:00:00) GST on the punch-in date
    const defaultOutTime = new Date(`${inDateStr}T20:00:00+04:00`);

    if (inTime.getTime() >= defaultOutTime.getTime()) {
      defaultOutTime.setTime(inTime.getTime() + 60 * 60 * 1000);
    }

    // ONLY auto-close if the session started on a PREVIOUS DATE!
    // (i.e. After 12 at night when the clock has started a new day).
    // NEVER auto-close on the same day! Staff can punch out at any time when they finish and leave the garage.
    if (inDateStr < todayStr) {
      const autoPunch = this.punchRepo.create({
        tenantId,
        employeeId,
        branchId: openSession.branchId || '22222222-2222-2222-2222-222222222222',
        type: PunchType.OUT,
        serverTs: defaultOutTime,
        method: PunchMethod.AUTO_CLOSE,
        flags: ['DEFAULT_PUNCHOUT'],
        clientMeta: { remarks: 'Default Punchout (Auto 8:00 PM)' },
        sessionId: openSession.id,
      });

      await this.punchRepo.save(autoPunch);

      openSession.outPunch = autoPunch;
      openSession.endedAt = defaultOutTime;
      openSession.status = 'closed';
      openSession.workedMinutes = Math.max(0, Math.floor((defaultOutTime.getTime() - inTime.getTime()) / 60000) - (openSession.breakMinutes || 0));
      await this.sessionRepo.save(openSession);

      await this.employeesService.update(tenantId, employeeId, { status: 'OUT' });
      return autoPunch;
    }

    return null;
  }

  /**
   * Auto-close ALL open stale sessions for ALL employees.
   * Called on kiosk load / midnight rollover to ensure next-day kiosk shows OUT for everyone.
   * Only auto-closes if session started on a PREVIOUS day (past 12 midnight).
   */
  async autoCloseAllStaleSessions(tenantId: string) {
    const openSessions = await this.sessionRepo.find({
      where: { status: 'open' },
    });

    const results: any[] = [];
    for (const session of openSessions) {
      const empId = session.employeeId;
      const result = await this.autoCloseStaleSessions(tenantId, empId);
      if (result) {
        results.push({ employeeId: empId, punchId: result.id });
      }
    }

    // Double check all employees with status === 'IN'
    const employees = await this.employeesService.findAll(tenantId);
    const now = new Date();
    const todayDubai = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' });

    for (const emp of employees) {
      if (emp.status === 'IN') {
        const activeSession = await this.sessionRepo.findOne({
          where: { employeeId: emp.id, status: 'open' },
        });
        if (!activeSession) {
          await this.employeesService.update(tenantId, emp.id, { status: 'OUT' });
        } else {
          const sTime = activeSession.startedAt ? new Date(activeSession.startedAt) : now;
          const sDateDubai = sTime.toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' });
          // ONLY if session started on a previous day (past 12 midnight)
          if (sDateDubai < todayDubai) {
            await this.autoCloseStaleSessions(tenantId, emp.id);
          }
        }
      }
    }

    return { closedCount: results.length, closed: results };
  }

  async simplePunch(tenantId: string, employeeId: string, type: PunchType, ip: string, userAgent: string, method: PunchMethod = PunchMethod.KIOSK_PIN) {
    const employee = await this.employeesService.findOne(tenantId, employeeId);
    if (!employee) throw new NotFoundException('Employee not found');

    // Auto-close any stale or unclosed session from previous dates (if past midnight)
    await this.autoCloseStaleSessions(tenantId, employee.id);

    const workDate = new Date().toISOString().split('T')[0];
    let session = await this.sessionRepo.findOne({ 
      where: { employeeId: employee.id, status: 'open' } 
    });

    // Create the punch
    const punch = this.punchRepo.create({
      tenantId,
      employeeId: employee.id,
      branchId: employee.branch?.id || '22222222-2222-2222-2222-222222222222',
      type: type,
      serverTs: new Date(),
      method,
      ip,
      userAgent,
      sessionId: session?.id,
    });

    await this.punchRepo.save(punch);

    // Update session
    if (type === PunchType.IN) {
      session = this.sessionRepo.create({
        tenant: { id: tenantId },
        employee: { id: employee.id },
        branch: { id: punch.branchId },
        workDate,
        inPunch: { id: punch.id },
        startedAt: punch.serverTs,
        status: 'open',
      });
      await this.sessionRepo.save(session);
      
      punch.sessionId = session.id;
      await this.punchRepo.save(punch);
    } else if (type === PunchType.OUT && session) {
      session.outPunch = punch;
      session.endedAt = punch.serverTs;
      session.status = 'closed';
      session.workedMinutes = Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 60000) - (session.breakMinutes || 0);
      await this.sessionRepo.save(session);
    }

    // Update Employee Status
    employee.status = type === PunchType.IN ? 'IN' : 'OUT';
    await this.employeesService.update(tenantId, employee.id, { status: employee.status });

    return {
      success: true,
      punchId: punch.id,
      type: punch.type,
      time: punch.serverTs,
      employeeName: employee.fullName,
    };
  }

  async getEmployeePunches(employeeId: string) {
    return this.punchRepo.find({
      where: { employeeId },
      relations: { employee: true },
      order: { serverTs: 'DESC' },
      take: 50 // limit to recent 50 punches for demo
    });
  }

  /**
   * Unified Attendance Records — Returns ONE ROW per employee shift session (Punch In + Punch Out paired).
   * Supports specific date or date range.
   */
  async getAllPunches(tenantId: string, dateStr?: string, startDate?: string, endDate?: string) {
    // 1. Fetch sessions
    const sessionQb = this.sessionRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.employee', 'employee')
      .leftJoinAndSelect('s.inPunch', 'inPunch')
      .leftJoinAndSelect('s.outPunch', 'outPunch')
      .where('s.tenantId = :tenantId', { tenantId })
      .orderBy('s.startedAt', 'DESC');

    if (startDate && endDate) {
      sessionQb.andWhere('s.workDate >= :startDate AND s.workDate <= :endDate', { startDate, endDate });
    } else if (dateStr) {
      sessionQb.andWhere('s.workDate = :dateStr', { dateStr });
    }

    const sessions = await sessionQb.getMany();

    // 2. Also check if there are standalone punches for the date not linked to a session
    const punchQb = this.punchRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.employee', 'employee')
      .where('p.tenantId = :tenantId', { tenantId })
      .orderBy('p.serverTs', 'DESC');

    if (startDate && endDate) {
      const sDate = new Date(`${startDate}T00:00:00.000Z`);
      const eDate = new Date(`${endDate}T23:59:59.999Z`);
      punchQb.andWhere('p.serverTs >= :sDate AND p.serverTs <= :eDate', { sDate, eDate });
    } else if (dateStr) {
      const sDate = new Date(`${dateStr}T00:00:00.000Z`);
      const eDate = new Date(`${dateStr}T23:59:59.999Z`);
      punchQb.andWhere('p.serverTs >= :sDate AND p.serverTs <= :eDate', { sDate, eDate });
    }

    const rawPunches = await punchQb.getMany();

    const sessionInPunchIds = new Set(sessions.map(s => s.inPunchId).filter(Boolean));
    const sessionOutPunchIds = new Set(sessions.map(s => s.outPunchId).filter(Boolean));

    const records: any[] = [];

    // Format all sessions into single attendance rows
    for (const s of sessions) {
      const inTime = s.startedAt ? new Date(s.startedAt) : (s.inPunch?.serverTs ? new Date(s.inPunch.serverTs) : null);
      const outTime = s.endedAt ? new Date(s.endedAt) : (s.outPunch?.serverTs ? new Date(s.outPunch.serverTs) : null);

      let isLate = false;
      let lateMinutes = 0;
      let graceStatus = 'On Time';

      if (inTime) {
        const inDubaiTime = new Date(inTime.toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
        const hour = inDubaiTime.getHours();
        const min = inDubaiTime.getMinutes();
        if (hour > 9 || (hour === 9 && min > 10)) {
          isLate = true;
          lateMinutes = (hour - 9) * 60 + min;
          graceStatus = `Late (+${lateMinutes}m)`;
        }
      }

      const isDefaultPunchout = s.outPunch?.method === PunchMethod.AUTO_CLOSE ||
        Boolean(s.outPunch?.flags && s.outPunch.flags.includes('DEFAULT_PUNCHOUT')) ||
        Boolean(s.outPunch?.clientMeta?.remarks?.includes('Default Punchout'));

      let punchOutRemarks = 'Regular Punchout';
      let status: 'OPEN' | 'COMPLETED' | 'AUTO_CLOSED' = 'COMPLETED';

      if (!outTime) {
        punchOutRemarks = 'Active (Currently Working)';
        status = 'OPEN';
      } else if (isDefaultPunchout) {
        punchOutRemarks = 'Default Punchout (Auto 8:00 PM)';
        status = 'AUTO_CLOSED';
      }

      let durationMins = s.workedMinutes || 0;
      if (!durationMins && inTime && outTime) {
        durationMins = Math.max(0, Math.floor((outTime.getTime() - inTime.getTime()) / 60000));
      }

      const durationFormatted = outTime
        ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`
        : 'In Progress';

      records.push({
        id: s.id,
        sessionId: s.id,
        inPunchId: s.inPunchId || s.inPunch?.id,
        outPunchId: s.outPunchId || s.outPunch?.id,
        employeeId: s.employeeId,
        employee: s.employee ? {
          id: s.employee.id,
          fullName: s.employee.fullName,
          employeeCode: s.employee.employeeCode,
          jobTitle: s.employee.jobTitle || 'Staff',
        } : null,
        workDate: s.workDate || (inTime ? inTime.toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' }) : dateStr),
        inTime,
        outTime,
        workedMinutes: durationMins,
        durationFormatted,
        isLate,
        lateMinutes,
        graceStatus,
        isDefaultPunchout,
        punchOutRemarks,
        status,
      });
    }

    // Handle any orphaned raw punches that didn't have a WorkSession
    const unlinkedPunches = rawPunches.filter(p => !sessionInPunchIds.has(p.id) && !sessionOutPunchIds.has(p.id));
    const unlinkedGroups = new Map<string, typeof rawPunches>();
    for (const p of unlinkedPunches) {
      const pDate = new Date(p.serverTs).toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' });
      const key = `${p.employeeId}_${pDate}`;
      if (!unlinkedGroups.has(key)) unlinkedGroups.set(key, []);
      unlinkedGroups.get(key)!.push(p);
    }

    for (const [key, pList] of unlinkedGroups.entries()) {
      const inP = pList.find(p => p.type === PunchType.IN);
      const outP = pList.find(p => p.type === PunchType.OUT);
      if (inP || outP) {
        const emp = (inP?.employee || outP?.employee);
        const inTime = inP ? new Date(inP.serverTs) : null;
        const outTime = outP ? new Date(outP.serverTs) : null;
        let isLate = false;
        let lateMinutes = 0;
        let graceStatus = 'On Time';
        if (inTime) {
          const inDubaiTime = new Date(inTime.toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
          const hour = inDubaiTime.getHours();
          const min = inDubaiTime.getMinutes();
          if (hour > 9 || (hour === 9 && min > 10)) {
            isLate = true;
            lateMinutes = (hour - 9) * 60 + min;
            graceStatus = `Late (+${lateMinutes}m)`;
          }
        }
        const isDefaultPunchout = outP?.method === PunchMethod.AUTO_CLOSE ||
          Boolean(outP?.flags && outP.flags.includes('DEFAULT_PUNCHOUT')) ||
          Boolean(outP?.clientMeta?.remarks?.includes('Default Punchout'));

        let durationMins = 0;
        if (inTime && outTime) {
          durationMins = Math.max(0, Math.floor((outTime.getTime() - inTime.getTime()) / 60000));
        }

        records.push({
          id: inP?.id || outP?.id,
          inPunchId: inP?.id,
          outPunchId: outP?.id,
          employeeId: emp?.id,
          employee: emp ? {
            id: emp.id,
            fullName: emp.fullName,
            employeeCode: emp.employeeCode,
            jobTitle: emp.jobTitle || 'Staff',
          } : null,
          workDate: key.split('_')[1],
          inTime,
          outTime,
          workedMinutes: durationMins,
          durationFormatted: outTime ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m` : 'In Progress',
          isLate,
          lateMinutes,
          graceStatus,
          isDefaultPunchout,
          punchOutRemarks: !outTime ? 'Active (Currently Working)' : isDefaultPunchout ? 'Default Punchout (Auto 8:00 PM)' : 'Regular Punchout',
          status: !outTime ? 'OPEN' : isDefaultPunchout ? 'AUTO_CLOSED' : 'COMPLETED',
        });
      }
    }

    // Sort records descending by inTime / date
    records.sort((a, b) => {
      const timeA = a.inTime ? new Date(a.inTime).getTime() : 0;
      const timeB = b.inTime ? new Date(b.inTime).getTime() : 0;
      return timeB - timeA;
    });

    return records;
  }

  async deletePunch(tenantId: string, id: string) {
    // Check if it's a WorkSession
    const session = await this.sessionRepo.findOne({ where: { id, tenantId } });
    if (session) {
      if (session.inPunchId) {
        await this.punchRepo.delete({ id: session.inPunchId }).catch(() => {});
      }
      if (session.outPunchId) {
        await this.punchRepo.delete({ id: session.outPunchId }).catch(() => {});
      }
      await this.sessionRepo.remove(session);
      return { success: true, message: 'Attendance session deleted successfully.' };
    }

    // Check if it's a Punch
    const punch = await this.punchRepo.findOne({ where: { id, tenantId } });
    if (punch) {
      const linkedSession = await this.sessionRepo.findOne({
        where: [
          { inPunchId: id, tenantId },
          { outPunchId: id, tenantId },
        ],
      });
      if (linkedSession) {
        if (linkedSession.outPunchId === id) {
          linkedSession.outPunchId = null;
          linkedSession.endedAt = null;
          linkedSession.status = 'open';
          await this.sessionRepo.save(linkedSession);
        } else {
          await this.sessionRepo.remove(linkedSession);
        }
      }
      await this.punchRepo.remove(punch);
      return { success: true, message: 'Punch record deleted successfully.' };
    }

    throw new NotFoundException('Attendance record not found');
  }

  /**
   * Submit a leave request and send email notification to fazahautogarage@gmail.com
   */
  async submitLeaveRequest(tenantId: string, employeeId: string, dto: { leaveDate: string; leaveEndDate?: string; reason: string }) {
    const employee = await this.employeesService.findOne(tenantId, employeeId);
    if (!employee) throw new NotFoundException('Employee not found');

    if (!dto.leaveDate || !dto.reason) {
      throw new BadRequestException('Leave date and reason are required');
    }

    const leaveRequest = this.leaveRepo.create({
      tenantId,
      employeeId: employee.id,
      leaveDate: dto.leaveDate,
      leaveEndDate: dto.leaveEndDate || dto.leaveDate,
      reason: dto.reason,
      status: 'pending',
      emailSent: false,
    });

    await this.leaveRepo.save(leaveRequest);

    // Format date range for email
    const dateRange = dto.leaveEndDate && dto.leaveEndDate !== dto.leaveDate
      ? `${dto.leaveDate} to ${dto.leaveEndDate}`
      : dto.leaveDate;

    // Send email notification
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER || 'fazahautogarage@gmail.com',
          pass: process.env.SMTP_PASS || '',
        },
      });

      const mailOptions = {
        from: `"Fazah Auto Garage - Staff Portal" <${process.env.SMTP_USER || 'fazahautogarage@gmail.com'}>`,
        to: 'fazahautogarage@gmail.com',
        subject: `📋 Leave Request — ${employee.fullName} (${employee.employeeCode})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px;">FAZAH AUTO GARAGE</h1>
              <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Staff Leave Request Notification</p>
            </div>
            <div style="padding: 24px;">
              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 18px;">📋 New Leave Application</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px 0; font-weight: bold; color: #64748b; font-size: 13px; width: 140px;">Employee Name</td>
                    <td style="padding: 10px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${employee.fullName}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px 0; font-weight: bold; color: #64748b; font-size: 13px;">Employee Code</td>
                    <td style="padding: 10px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${employee.employeeCode}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px 0; font-weight: bold; color: #64748b; font-size: 13px;">Job Title</td>
                    <td style="padding: 10px 0; color: #1e293b; font-size: 14px;">${employee.jobTitle || 'Staff'}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px 0; font-weight: bold; color: #64748b; font-size: 13px;">Leave Date(s)</td>
                    <td style="padding: 10px 0; color: #2563eb; font-size: 14px; font-weight: 700;">${dateRange}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #64748b; font-size: 13px; vertical-align: top;">Reason</td>
                    <td style="padding: 10px 0; color: #1e293b; font-size: 14px;">${dto.reason}</td>
                  </tr>
                </table>
              </div>
              <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 12px; text-align: center;">
                <p style="margin: 0; color: #92400e; font-size: 12px; font-weight: 600;">
                  ⚠️ This leave request requires your review and approval.
                </p>
              </div>
              <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">
                Submitted on ${new Date().toLocaleString('en-AE', { timeZone: 'Asia/Dubai' })} via Fazah Staff Portal
              </p>
            </div>
          </div>
        `,
      };

      if (process.env.SMTP_PASS) {
        await transporter.sendMail(mailOptions);
        leaveRequest.emailSent = true;
        await this.leaveRepo.save(leaveRequest);
      }
    } catch (emailError) {
      console.error('Failed to send leave request email:', emailError);
      // Don't fail the request if email fails — the leave is still recorded
    }

    return {
      success: true,
      leaveRequestId: leaveRequest.id,
      emailSent: leaveRequest.emailSent,
      message: leaveRequest.emailSent
        ? 'Leave request submitted and email sent to management.'
        : 'Leave request submitted successfully. Email notification will be sent when SMTP is configured.',
    };
  }

  /**
   * Get leave requests for an employee
   */
  async getLeaveRequests(employeeId: string) {
    return this.leaveRepo.find({
      where: { employeeId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}

