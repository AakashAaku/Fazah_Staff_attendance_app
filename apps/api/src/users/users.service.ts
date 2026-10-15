import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { argon2id } from 'hash-wasm';
import { randomBytes } from 'crypto';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  private sanitize(user: User) {
    const { passwordHash, totpSecretEnc, ...safeUser } = user;
    return safeUser;
  }

  async findAll(tenantId: string) {
    const users = await this.userRepo.find({
      where: { tenantId },
      order: { createdAt: 'ASC' },
    });
    return users.map(u => this.sanitize(u));
  }

  async findOne(tenantId: string, id: string) {
    const user = await this.userRepo.findOne({
      where: { id, tenantId },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(tenantId: string, dto: CreateUserDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase().trim() } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const salt = randomBytes(16);
    const passwordHash = await argon2id({
      password: dto.password,
      salt,
      parallelism: 1,
      iterations: 3,
      memorySize: 4096,
      hashLength: 32,
      outputType: 'encoded',
    });

    const user = this.userRepo.create({
      tenantId,
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      role: dto.role || 'admin',
      status: dto.status || 'active',
    });

    const saved = await this.userRepo.save(user);
    return this.sanitize(saved);
  }

  async update(tenantId: string, id: string, dto: UpdateUserDto) {
    const user = await this.findOne(tenantId, id);

    if (dto.email && dto.email.toLowerCase().trim() !== user.email) {
      const emailTaken = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase().trim() } });
      if (emailTaken && emailTaken.id !== id) {
        throw new ConflictException('A user with this email already exists');
      }
      user.email = dto.email.toLowerCase().trim();
    }

    if (dto.role) user.role = dto.role;
    if (dto.status) user.status = dto.status;

    if (dto.password && dto.password.trim().length >= 6) {
      const salt = randomBytes(16);
      user.passwordHash = await argon2id({
        password: dto.password.trim(),
        salt,
        parallelism: 1,
        iterations: 3,
        memorySize: 4096,
        hashLength: 32,
        outputType: 'encoded',
      });
    }

    const saved = await this.userRepo.save(user);
    return this.sanitize(saved);
  }

  async remove(tenantId: string, id: string, currentUserId?: string) {
    const user = await this.findOne(tenantId, id);

    if (currentUserId && user.id === currentUserId) {
      throw new BadRequestException('Cannot delete your own logged-in user account. Please log in with another admin account to delete this user.');
    }

    const activeAdmins = await this.userRepo.count({
      where: { tenantId, status: 'active' },
    });
    if (activeAdmins <= 1 && user.status === 'active') {
      throw new BadRequestException('Cannot delete the last active administrator account. Please create another active admin first.');
    }

    await this.userRepo.remove(user);
    return { success: true, message: `User account ${user.email} was permanently deleted.` };
  }

  async clearDefaults(tenantId: string, currentUserId?: string) {
    const defaultEmails = ['admin@fazahgarage.com', 'admin@garage.com'];
    const users = await this.userRepo.find({ where: { tenantId } });
    
    // Check if there is at least one non-default active user
    const customUsers = users.filter(u => !defaultEmails.includes(u.email.toLowerCase()) && u.status === 'active');
    if (customUsers.length === 0) {
      throw new BadRequestException('Please create at least one new real admin account before clearing the default accounts, so you do not get locked out!');
    }

    let deletedCount = 0;
    for (const u of users) {
      if (defaultEmails.includes(u.email.toLowerCase())) {
        if (currentUserId && u.id === currentUserId) {
          continue; // skip currently active session user if logged in with it
        }
        await this.userRepo.remove(u);
        deletedCount++;
      }
    }

    return {
      success: true,
      count: deletedCount,
      message: `Cleared ${deletedCount} default user accounts.`,
    };
  }
}
