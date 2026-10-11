import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Ip } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto, ApproveDeviceDto } from './dto/device.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @Post()
  registerAdminDevice(@Request() req: any, @Body() registerDto: RegisterDeviceDto, @Ip() ip: string) {
    return this.devicesService.registerDevice(req.user.tenantId, registerDto, ip);
  }

  // Device registration from untrusted source (app booting up)
  @Post('register')
  registerDevicePublic(@Body() registerDto: RegisterDeviceDto, @Ip() ip: string) {
    return this.devicesService.registerDevice(registerDto.tenantId, registerDto, ip);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @Roles('admin', 'super_admin', 'auditor')
  findAll(@Request() req: any) {
    return this.devicesService.findAll(req.user.tenantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  @Roles('admin', 'super_admin', 'auditor')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.devicesService.findOne(req.user.tenantId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/approve')
  @Roles('admin', 'super_admin')
  approve(@Request() req: any, @Param('id') id: string, @Body() approveDto: ApproveDeviceDto) {
    return this.devicesService.approveDevice(req.user.tenantId, id, req.user.id, approveDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @Roles('admin', 'super_admin')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.devicesService.remove(req.user.tenantId, id);
  }
}
