import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { Punch } from '../../punches/entities/punch.entity';

@Entity('work_sessions')
export class WorkSession {
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

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ type: 'date', name: 'work_date' })
  workDate: string; // YYYY-MM-DD

  @Column({ name: 'in_punch_id' })
  inPunchId: string;

  @ManyToOne(() => Punch)
  @JoinColumn({ name: 'in_punch_id' })
  inPunch: Punch;

  @Column({ type: 'uuid', name: 'out_punch_id', nullable: true })
  outPunchId: string | null;

  @ManyToOne(() => Punch, { nullable: true })
  @JoinColumn({ name: 'out_punch_id' })
  outPunch: Punch | null;

  @Column({ type: 'timestamptz', name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamptz', name: 'ended_at', nullable: true })
  endedAt: Date | null;

  @Column({ name: 'break_minutes', default: 0 })
  breakMinutes: number;

  @Column({ name: 'worked_minutes', default: 0 })
  workedMinutes: number;

  @Column({ default: 'open' })
  status: string; // 'open' | 'closed' | 'auto_closed' | 'adjusted'

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
