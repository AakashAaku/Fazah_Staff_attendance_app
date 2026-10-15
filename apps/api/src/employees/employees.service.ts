import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { argon2id } from 'hash-wasm';
import { randomBytes } from 'crypto';
import { Employee } from './entities/employee.entity';
import { EmployeeCredential } from './entities/employee-credential.entity';
import { Branch } from '../branches/entities/branch.entity';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
    @InjectRepository(EmployeeCredential)
    private credentialRepo: Repository<EmployeeCredential>,
    @InjectRepository(Branch)
    private branchRepo: Repository<Branch>,
    private dataSource: DataSource,
  ) {}

  async create(tenantId: string, dto: CreateEmployeeDto) {
    const existing = await this.employeeRepo.findOne({ where: { employeeCode: dto.employeeCode, tenantId } });
    if (existing) {
      throw new ConflictException('Employee with this Employee Code already exists');
    }

    const branch = await this.branchRepo.findOne({ where: { id: dto.branchId, tenantId } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Hash PIN
    const salt = randomBytes(16);
    const pinHash = await argon2id({
      password: dto.pin,
      salt: salt,
      parallelism: 1,
      iterations: 3,
      memorySize: 4096,
      hashLength: 32,
      outputType: 'encoded'
    });

    const employee = this.employeeRepo.create({
      tenantId,
      branchId: dto.branchId,
      employeeCode: dto.employeeCode,
      fullName: dto.fullName,
      jobTitle: dto.jobTitle || 'Staff',
      status: 'active',
    });

    await this.employeeRepo.save(employee);

    const credential = this.credentialRepo.create({
      employee: { id: employee.id },
      pinHash,
    });
    await this.credentialRepo.save(credential);

    return employee;
  }

  async findAll(tenantId: string) {
    return this.employeeRepo.find({
      where: { tenantId },
      relations: { branch: true },
    });
  }

  async findOne(tenantId: string, id: string) {
    const employee = await this.employeeRepo.findOne({
      where: { id, tenantId },
      relations: { branch: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async update(tenantId: string, id: string, dto: UpdateEmployeeDto) {
    const employee = await this.findOne(tenantId, id);
    
    if (dto.branchId) {
      const branch = await this.branchRepo.findOne({ where: { id: dto.branchId, tenantId } });
      if (!branch) throw new NotFoundException('Branch not found');
      employee.branch = branch;
    }

    if (dto.employeeCode !== undefined && dto.employeeCode !== employee.employeeCode) {
      const existing = await this.employeeRepo.findOne({ where: { employeeCode: dto.employeeCode, tenantId } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Another staff member with this Employee Code already exists');
      }
      employee.employeeCode = dto.employeeCode;
    }

    if (dto.fullName !== undefined) employee.fullName = dto.fullName;
    if (dto.status !== undefined) employee.status = dto.status;
    if (dto.jobTitle !== undefined) employee.jobTitle = dto.jobTitle;

    if (dto.pin) {
      const salt = randomBytes(16);
      const pinHash = await argon2id({
        password: dto.pin,
        salt: salt,
        parallelism: 1,
        iterations: 3,
        memorySize: 4096,
        hashLength: 32,
        outputType: 'encoded'
      });
      let credential = await this.credentialRepo.findOne({ where: { employee: { id: employee.id } } });
      if (!credential) {
        credential = this.credentialRepo.create({ employee: { id: employee.id } });
      }
      credential.pinHash = pinHash;
      credential.failedAttempts = 0;
      credential.lockedUntil = null;
      await this.credentialRepo.save(credential);
    }

    return this.employeeRepo.save(employee);
  }

  async remove(tenantId: string, id: string) {
    const employee = await this.findOne(tenantId, id);
    const empId = employee.id;

    await this.dataSource.transaction(async (manager) => {
      // 1. Unlink foreign keys from records that should remain intact
      await manager.query(`UPDATE job_cards SET assigned_mechanic_id = NULL WHERE assigned_mechanic_id = $1`, [empId]).catch(() => {});
      await manager.query(`UPDATE job_card_labors SET assigned_mechanic_id = NULL WHERE assigned_mechanic_id = $1`, [empId]).catch(() => {});
      await manager.query(`UPDATE job_card_labors SET qa_verified_by_id = NULL WHERE qa_verified_by_id = $1`, [empId]).catch(() => {});
      await manager.query(`UPDATE job_card_logs SET employee_id = NULL WHERE employee_id = $1`, [empId]).catch(() => {});
      await manager.query(`UPDATE job_card_handovers SET handed_over_by_id = NULL WHERE handed_over_by_id = $1`, [empId]).catch(() => {});
      await manager.query(`UPDATE job_card_handovers SET received_by_id = NULL WHERE received_by_id = $1`, [empId]).catch(() => {});
      await manager.query(`UPDATE devices SET employee_id = NULL WHERE employee_id = $1`, [empId]).catch(() => {});
      await manager.query(`UPDATE employees SET supervisor_id = NULL WHERE supervisor_id = $1`, [empId]).catch(() => {});
      await manager.query(`UPDATE tasks SET assigned_to = NULL WHERE assigned_to = $1`, [empId]).catch(() => {});

      // 2. Delete employee specific credentials and logs
      await manager.query(`DELETE FROM employee_credentials WHERE employee_id = $1`, [empId]).catch(() => {});
      await manager.query(`DELETE FROM shift_assignments WHERE employee_id = $1`, [empId]).catch(() => {});
      await manager.query(`DELETE FROM work_sessions WHERE employee_id = $1`, [empId]).catch(() => {});
      await manager.query(`DELETE FROM daily_summaries WHERE employee_id = $1`, [empId]).catch(() => {});
      await manager.query(`DELETE FROM time_adjustments WHERE employee_id = $1`, [empId]).catch(() => {});
      await manager.query(`DELETE FROM task_logs WHERE employee_id = $1`, [empId]).catch(() => {});
      await manager.query(`DELETE FROM punches WHERE "employeeId" = $1`, [empId]).catch(() => {});

      // 3. Delete the employee
      await manager.query(`DELETE FROM employees WHERE id = $1 AND tenant_id = $2`, [empId, tenantId]);
    });

    return { success: true, message: `Staff member ${employee.fullName} (${employee.employeeCode}) was permanently deleted.` };
  }

  async clearDefaults(tenantId: string) {
    const defaultCodes = ['ADMIN01', 'MCH01', 'ELE01', 'DNP01', 'ADV01', 'MGR01'];
    const all = await this.employeeRepo.find({ where: { tenantId } });
    const targets = all.filter(e => defaultCodes.includes(e.employeeCode));
    for (const emp of targets) {
      await this.remove(tenantId, emp.id);
    }
    return { success: true, count: targets.length, message: `Cleared ${targets.length} default staff members.` };
  }

  async findByCode(tenantId: string, employeeCode: string) {
    const employee = await this.employeeRepo.findOne({
      where: { employeeCode, tenantId },
      relations: { branch: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async verifyPin(employeeId: string, pin: string): Promise<boolean> {
    const credential = await this.credentialRepo.findOne({ where: { employee: { id: employeeId } } });
    if (!credential) return false;

    // Check lockouts here if needed...
    
    // Using hash-wasm argon2Verify
    try {
      const { argon2Verify } = await import('hash-wasm');
      const isValid = await argon2Verify({
        password: pin,
        hash: credential.pinHash,
      });

      if (!isValid) {
        // Increment failed_attempts, check lock
        credential.failedAttempts += 1;
        if (credential.failedAttempts >= 5) {
          credential.lockedUntil = new Date(Date.now() + 15 * 60000); // 15 mins lock
        }
        await this.credentialRepo.save(credential);
        return false;
      }

      // Reset attempts on success
      if (credential.failedAttempts > 0) {
        credential.failedAttempts = 0;
        credential.lockedUntil = null;
        await this.credentialRepo.save(credential);
      }

      return true;
    } catch (e) {
      return false;
    }
  }
}
