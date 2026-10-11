import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, Verify2FaDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  async verify2fa(@Body() verifyDto: Verify2FaDto) {
    return this.authService.verify2fa(verifyDto.email, verifyDto.token);
  }
}
