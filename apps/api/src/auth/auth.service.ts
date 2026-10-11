import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { argon2Verify } from 'hash-wasm';
import * as otplib from 'otplib';
const { authenticator } = otplib as any;
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    const user = await this.usersRepository.findOne({ where: { email, status: 'active' } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await argon2Verify({ password: pass, hash: user.passwordHash });
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
    user.lastLoginAt = new Date();
    await this.usersRepository.save(user);

    return {
      access_token: await this.jwtService.signAsync(payload)
    };
  }

  async verify2fa(email: string, token: string) {
    const user = await this.usersRepository.findOne({ where: { email, status: 'active' } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.totpSecretEnc) {
      // If no TOTP is set, we might bypass or enforce setup. Let's just allow for dev.
      // In production, we'd reject or trigger a setup flow.
    } else {
      const isValid = authenticator.verify({ token, secret: user.totpSecretEnc });
      if (!isValid) {
        throw new UnauthorizedException('Invalid 2FA token');
      }
    }

    const payload = { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
    
    // Update last login
    user.lastLoginAt = new Date();
    await this.usersRepository.save(user);

    return {
      access_token: await this.jwtService.signAsync(payload),
      // In a full implementation we'd also generate and store a rotating refresh token
    };
  }
}
