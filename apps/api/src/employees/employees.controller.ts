import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @Roles('admin', 'super_admin')
  create(@Request() req: any, @Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(req.user.tenantId, createEmployeeDto);
  }

  @Get()
  @Roles('admin', 'super_admin', 'auditor')
  findAll(@Request() req: any) {
    return this.employeesService.findAll(req.user.tenantId);
  }

  @Post('clear-defaults')
  @Roles('admin', 'super_admin')
  clearDefaults(@Request() req: any) {
    return this.employeesService.clearDefaults(req.user.tenantId);
  }

  @Get(':id')
  @Roles('admin', 'super_admin', 'auditor')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.employeesService.findOne(req.user.tenantId, id);
  }

  @Patch(':id')
  @Roles('admin', 'super_admin')
  update(@Request() req: any, @Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeesService.update(req.user.tenantId, id, updateEmployeeDto);
  }

  @Delete(':id')
  @Roles('admin', 'super_admin')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.employeesService.remove(req.user.tenantId, id);
  }
}
