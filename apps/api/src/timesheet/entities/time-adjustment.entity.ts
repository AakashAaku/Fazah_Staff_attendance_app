import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { Punch } from '../../punches/entities/punch.entity';
import { WorkSession } from './work-session.entity';
import { User } from '../../users/entities/user.entity';

@Entity('time_adjustments')
export class TimeAdjustment {
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

  @Column({ type: 'uuid', name: 'original_punch_id', nullable: true })
  originalPunchId: string | null;

  @ManyToOne(() => Punch, { nullable: true })
  @JoinColumn({ name: 'original_punch_id' })
  originalPunch: Punch | null;

  @Column({ type: 'uuid', name: 'session_id', nullable: true })
  sessionId: string | null;

  @ManyToOne(() => WorkSession, { nullable: true })
  @JoinColumn({ name: 'session_id' })
  session: WorkSession | null;

  @Column()
  type: string; // 'add' | 'modify' | 'void'

  @Column({ type: 'timestamptz', name: 'new_ts', nullable: true })
  newTs: Date | null;

  @Column({ type: 'varchar', name: 'new_type', nullable: true })
  newType: string | null; // 'IN' | 'OUT' | 'BREAK_START' | 'BREAK_END'

  @Column({ type: 'text' })
  reason: string;

  @Column({ name: 'requested_by' })
  requestedBy: string; // User ID

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requested_by' })
  requester: User;

  @Column({ type: 'uuid', name: 'approved_by', nullable: true })
  approvedBy: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approver: User | null;

  @Column({ default: 'pending' })
  status: string; // 'pending' | 'approved' | 'rejected'

  @Column({ type: 'timestamptz', name: 'approved_at', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'varchar', name: 'evidence_key', nullable: true })
  evidenceKey: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
