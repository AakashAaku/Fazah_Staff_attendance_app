import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    employee.status = 'terminated';
    return this.employeeRepo.save(employee);
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
