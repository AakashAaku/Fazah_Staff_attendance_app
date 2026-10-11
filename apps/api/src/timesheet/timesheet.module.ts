import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimesheetService } from './timesheet.service';
import { TimesheetController } from './timesheet.controller';
import { WorkSession } from './entities/work-session.entity';
import { DailySummary } from './entities/daily-summary.entity';
import { TimeAdjustment } from './entities/time-adjustment.entity';
import { Punch } from '../punches/entities/punch.entity';
import { Employee } from '../employees/entities/employee.entity';
import { JobCard } from '../job-cards/entities/job-card.entity';
import { JobCardLog } from '../job-cards/entities/job-card-log.entity';
import { Task } from '../tasks/entities/task.entity';
import { TaskLog } from '../tasks/entities/task-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkSession,
      DailySummary,
      TimeAdjustment,
      Punch,
      Employee,
      JobCard,
      JobCardLog,
      Task,
      TaskLog,
    ]),
  ],
  controllers: [TimesheetController],
  providers: [TimesheetService],
  exports: [TimesheetService],
})
export class TimesheetModule {}
