import { Controller, Post, Get, Patch, Body, Req, UseGuards, Ip, Headers, Param, Query, UnauthorizedException } from '@nestjs/common';
import { PunchesService } from './punches.service';
import { KioskPunchDto, MobilePunchDto } from './dto/punch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmployeesService } from '../employees/employees.service';
import { TasksService } from '../tasks/tasks.service';
import { TimesheetService } from '../timesheet/timesheet.service';

@Controller('kiosk')
export class PunchesController {
  constructor(
    private readonly punchesService: PunchesService,
    private readonly employeesService: EmployeesService,
    private readonly tasksService: TasksService,
    private readonly timesheetService: TimesheetService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('punch/challenge')
  async getChallenge(@Req() req: any) {
    const deviceId = req.user.sub;
    return this.punchesService.generateChallenge(deviceId);
  }

  @Post('me/punch')
  async mobilePunch(
    @Body() dto: MobilePunchDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    return await this.punchesService.punchMobile(tenantId, dto, ip, userAgent);
  }

  @Post('punch')
  async punch(@Body() dto: KioskPunchDto, @Ip() ip: string, @Headers('user-agent') userAgent: string) {
    const isValid = await this.employeesService.verifyPin(dto.employeeId, dto.pin);
    if (!isValid) {
      throw new UnauthorizedException('Invalid PIN');
    }
    const tenantId = '11111111-1111-1111-1111-111111111111';
    return await this.punchesService.simplePunch(tenantId, dto.employeeId, dto.type, ip, userAgent);
  }

  @Get('employees')
  async getKioskEmployees() {
    const employees = await this.employeesService.findAll('11111111-1111-1111-1111-111111111111');
    return employees.map((emp) => ({
      id: emp.id,
      name: emp.fullName,
      role: emp.jobTitle || 'Staff',
      status: emp.status,
    }));
  }

  // --- STAFF PORTAL ENDPOINTS --- //

  @Post('staff-login')
  async staffLogin(@Body() body: { employeeCode: string; pin: string }) {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    try {
      const employee = await this.employeesService.findByCode(tenantId, body.employeeCode);
      const isValid = await this.employeesService.verifyPin(employee.id, body.pin);
      if (!isValid) throw new UnauthorizedException('Invalid PIN');
      
      return { success: true, employee };
    } catch (err) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Get('staff-punches/:employeeId')
  async getStaffPunches(@Param('employeeId') employeeId: string) {
    return this.punchesService.getEmployeePunches(employeeId);
  }

  @Get('staff-tasks/:employeeId')
  async getStaffTasks(@Param('employeeId') employeeId: string) {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    return this.tasksService.findAll(tenantId, undefined, employeeId);
  }

  @Patch('staff-tasks/:taskId/status')
  async updateStaffTaskStatus(
    @Param('taskId') taskId: string,
    @Body() body: { status: string; pauseReason?: string; employeeId?: string; note?: string },
  ) {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    return this.tasksService.updateStatus(tenantId, taskId, body);
  }

  @Get('staff-tasks/:taskId/logs')
  async getStaffTaskLogs(@Param('taskId') taskId: string) {
    return this.tasksService.getTaskLogs(taskId);
  }

  // --- WORK TIMELINE & TIME TRACKING ENDPOINTS --- //

  @Get('admin/work-timeline')
  async getAdminWorkTimeline(@Query('date') date?: string) {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    return this.timesheetService.getDailyWorkTimeline(tenantId, date);
  }

  @Get('staff-work-timeline/:employeeId')
  async getStaffWorkTimeline(@Param('employeeId') employeeId: string, @Query('date') date?: string) {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const all = await this.timesheetService.getDailyWorkTimeline(tenantId, date);
    return all.find((item) => item.employee.id === employeeId) || null;
  }

  @Get('admin/punches')
  async getAllPunches(@Query('date') date?: string) {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    return this.punchesService.getAllPunches(tenantId, date);
  }

  @Post('admin/tasks/:taskId/reopen')
  async reopenTask(
    @Param('taskId') taskId: string,
    @Body() body: { reason: string; employeeId?: string },
  ) {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    return this.tasksService.reopenTask(tenantId, taskId, body);
  }

  @Get('admin/reopened-tasks-report')
  async getReopenedReport(@Query('date') date?: string) {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    return this.tasksService.getReopenedReport(tenantId, date);
  }
}
