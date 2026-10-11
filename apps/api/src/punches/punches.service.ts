import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Punch, PunchMethod, PunchType } from './entities/punch.entity';
import { WorkSession } from '../timesheet/entities/work-session.entity';
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

    if (!openSession) return null;

    const now = new Date();
    const inTime = openSession.startedAt ? new Date(openSession.startedAt) : now;
    const inDateStr = inTime.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    const defaultOutTime = new Date(inTime);
    defaultOutTime.setHours(21, 0, 0, 0); // 9:00 PM default cutoff

    if (inTime >= defaultOutTime) {
      defaultOutTime.setTime(inTime.getTime() + 60 * 60 * 1000);
    }

    // If session started on an earlier date OR (started today and current time is past 9:00 PM)
    if (inDateStr < todayStr || (inDateStr === todayStr && now > defaultOutTime)) {
      const autoPunch = this.punchRepo.create({
        tenantId,
        employeeId,
        branchId: openSession.branchId || '22222222-2222-2222-2222-222222222222',
        type: PunchType.OUT,
        serverTs: defaultOutTime,
        method: PunchMethod.AUTO_CLOSE,
        flags: ['DEFAULT_PUNCHOUT'],
        clientMeta: { remarks: 'Default Punchout (Auto 9:00 PM)' },
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

  async simplePunch(tenantId: string, employeeId: string, type: PunchType, ip: string, userAgent: string, method: PunchMethod = PunchMethod.KIOSK_PIN) {
    const employee = await this.employeesService.findOne(tenantId, employeeId);
    if (!employee) throw new NotFoundException('Employee not found');

    // Auto-close any stale or unclosed session from previous dates / past 9:00 PM
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

  async getAllPunches(tenantId: string, dateStr?: string) {
    const qb = this.punchRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.employee', 'employee')
      .where('p.tenantId = :tenantId', { tenantId })
      .orderBy('p.serverTs', 'DESC');

    if (dateStr) {
      const start = new Date(`${dateStr}T00:00:00.000Z`);
      const end = new Date(`${dateStr}T23:59:59.999Z`);
      qb.andWhere('p.serverTs >= :start AND p.serverTs <= :end', { start, end });
    }

    const punches = await qb.getMany();

    // Standard Shift Check-in Expectation: 09:00 AM with 10 mins Grace (09:10 AM cutoff)
    return punches.map((p) => {
      let isLate = false;
      let lateMinutes = 0;
      let isDefaultPunchout = false;

      if (p.type === 'IN' && p.serverTs) {
        const punchDate = new Date(p.serverTs);
        const expectedTime = new Date(punchDate);
        expectedTime.setHours(9, 10, 0, 0); // 9:10 AM grace cutoff

        if (punchDate > expectedTime) {
          isLate = true;
          const shiftStart = new Date(punchDate);
          shiftStart.setHours(9, 0, 0, 0); // 9:00 AM standard shift start
          lateMinutes = Math.floor((punchDate.getTime() - shiftStart.getTime()) / (1000 * 60));
        }
      }

      if (p.type === 'OUT') {
        if (p.method === PunchMethod.AUTO_CLOSE || (p.flags && p.flags.includes('DEFAULT_PUNCHOUT')) || (p.clientMeta?.remarks?.includes('Default Punchout'))) {
          isDefaultPunchout = true;
        }
      }

      return {
        ...p,
        isLate,
        lateMinutes,
        isDefaultPunchout,
      };
    });
  }
}
