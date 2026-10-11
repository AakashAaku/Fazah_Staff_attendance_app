import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || 'default_secret',
    });
  }

  async validate(payload: any) {
    // The payload represents the decoded JWT.
    // We attach it to the Request object as req.user
    return { userId: payload.sub, email: payload.email, role: payload.role, tenantId: payload.tenantId };
  }
}
