import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { dataSourceOptions } from './data-source';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { DevicesModule } from './devices/devices.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PunchesModule } from './punches/punches.module';

import { Tenant } from './tenants/entities/tenant.entity';
import { ShiftsModule } from './shifts/shifts.module';
import { PoliciesModule } from './policies/policies.module';
import { HolidaysModule } from './holidays/holidays.module';
import { TimesheetModule } from './timesheet/timesheet.module';
import { QrModule } from './qr/qr.module';
import { TasksModule } from './tasks/tasks.module';
import { JobCardsModule } from './job-cards/job-cards.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      autoLoadEntities: true,
    }),
    TypeOrmModule.forFeature([Tenant]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'kiosk', 'dist'),
    }),
    AuthModule,
    EmployeesModule,
    DevicesModule,
    PunchesModule,
    ShiftsModule,
    PoliciesModule,
    HolidaysModule,
    TimesheetModule,
    QrModule,
    TasksModule,
    JobCardsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
