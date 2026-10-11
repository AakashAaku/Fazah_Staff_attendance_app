import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { TimesheetService } from './timesheet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('timesheet')
export class TimesheetController {
  constructor(private readonly timesheetService: TimesheetService) {}

  @UseGuards(JwtAuthGuard)
  @Get('daily-work-timeline')
  async getDailyWorkTimeline(@Req() req: any, @Query('date') date?: string) {
    const tenantId = req.user?.tenantId || '11111111-1111-1111-1111-111111111111';
    return this.timesheetService.getDailyWorkTimeline(tenantId, date);
  }
}
