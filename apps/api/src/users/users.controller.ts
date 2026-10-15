import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('admin', 'super_admin')
  findAll(@Request() req: any) {
    return this.usersService.findAll(req.user.tenantId);
  }

  @Post()
  @Roles('admin', 'super_admin')
  create(@Request() req: any, @Body() createUserDto: CreateUserDto) {
    return this.usersService.create(req.user.tenantId, createUserDto);
  }

  @Post('clear-defaults')
  @Roles('admin', 'super_admin')
  clearDefaults(@Request() req: any) {
    return this.usersService.clearDefaults(req.user.tenantId, req.user.sub);
  }

  @Get(':id')
  @Roles('admin', 'super_admin')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.usersService.findOne(req.user.tenantId, id);
  }

  @Patch(':id')
  @Roles('admin', 'super_admin')
  update(@Request() req: any, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.tenantId, id, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin', 'super_admin')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.usersService.remove(req.user.tenantId, id, req.user.sub);
  }
}
