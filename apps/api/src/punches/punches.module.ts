import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PunchesService } from './punches.service';
import { PunchesController } from './punches.controller';
import { Punch } from './entities/punch.entity';
import { WorkSession } from '../timesheet/entities/work-session.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { EmployeesModule } from '../employees/employees.module';
import { DevicesModule } from '../devices/devices.module';
import { QrModule } from '../qr/qr.module';
import { TasksModule } from '../tasks/tasks.module';
import { TimesheetModule } from '../timesheet/timesheet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Punch, WorkSession, LeaveRequest]),
    EmployeesModule,
    DevicesModule,
    QrModule,
    TasksModule,
    TimesheetModule,
  ],
  controllers: [PunchesController],
  providers: [PunchesService],
})
export class PunchesModule {}
