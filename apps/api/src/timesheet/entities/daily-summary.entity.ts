import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { Shift } from '../../shifts/entities/shift.entity';

@Entity('daily_summaries')
export class DailySummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'date', name: 'work_date' })
  workDate: string; // YYYY-MM-DD

  @Column({ type: 'uuid', name: 'shift_id', nullable: true })
  shiftId: string | null;

  @ManyToOne(() => Shift, { nullable: true })
  @JoinColumn({ name: 'shift_id' })
  shift: Shift | null;

  @Column({ name: 'scheduled_minutes', default: 0 })
  scheduledMinutes: number;

  @Column({ name: 'worked_minutes', default: 0 })
  workedMinutes: number;

  @Column({ name: 'late_minutes', default: 0 })
  lateMinutes: number;

  @Column({ name: 'early_leave_minutes', default: 0 })
  earlyLeaveMinutes: number;

  @Column({ name: 'overtime_minutes', default: 0 })
  overtimeMinutes: number;

  @Column({ default: false })
  absent: boolean;

  @Column({ default: 'open' })
  status: string;

  @Column({ default: false })
  locked: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
