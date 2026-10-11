import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';
import { Branch } from '../branches/entities/branch.entity';
import { RegisterDeviceDto, ApproveDeviceDto } from './dto/device.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private deviceRepo: Repository<Device>,
    @InjectRepository(Branch)
    private branchRepo: Repository<Branch>,
  ) {}

  async registerDevice(tenantId: string, dto: RegisterDeviceDto, ip?: string) {
    const branch = await this.branchRepo.findOne({ where: { id: dto.branchId, tenantId } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const device = this.deviceRepo.create({
      tenantId,
      branchId: dto.branchId,
      name: dto.name,
      type: dto.type,
      publicKey: dto.publicKey,
      credentialHash: dto.credentialHash,
      status: 'pending',
      lastIp: ip,
      lastSeenAt: new Date(),
    });

    return this.deviceRepo.save(device);
  }

  async findAll(tenantId: string) {
    return this.deviceRepo.find({
      where: { tenantId },
      relations: { branch: true },
    });
  }

  async findOne(tenantId: string, id: string) {
    const device = await this.deviceRepo.findOne({
      where: { id, tenantId },
      relations: { branch: true },
    });
    if (!device) throw new NotFoundException('Device not found');
    return device;
  }

  async approveDevice(tenantId: string, id: string, userId: string, dto: ApproveDeviceDto) {
    const device = await this.findOne(tenantId, id);
    device.status = dto.status;
    if (dto.status === 'active') {
      device.approvedByUserId = userId;
      device.approvedAt = new Date();
    }
    return this.deviceRepo.save(device);
  }

  async remove(tenantId: string, id: string) {
    const device = await this.findOne(tenantId, id);
    device.status = 'revoked';
    return this.deviceRepo.save(device);
  }
}
