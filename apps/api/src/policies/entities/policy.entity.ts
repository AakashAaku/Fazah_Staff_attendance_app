import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Branch } from '../../branches/entities/branch.entity';

@Entity('policies')
export class Policy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ default: 'tenant' })
  scope: string; // 'tenant' or 'branch'

  @Column({ type: 'uuid', name: 'branch_id', nullable: true })
  branchId: string | null;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch | null;

  @Column({ name: 'grace_minutes', default: 10 })
  graceMinutes: number;

  @Column({ name: 'late_threshold_min', default: 15 })
  lateThresholdMin: number;

  @Column({ name: 'early_leave_threshold_min', default: 15 })
  earlyLeaveThresholdMin: number;

  @Column({ name: 'rounding_mode', default: 'none' })
  roundingMode: string;

  @Column({ name: 'rounding_minutes', default: 0 })
  roundingMinutes: number;

  @Column({ type: 'numeric', name: 'overtime_daily_hours', default: 0 })
  overtimeDailyHours: number;

  @Column({ type: 'numeric', name: 'overtime_weekly_hours', default: 0 })
  overtimeWeeklyHours: number;

  @Column({ type: 'jsonb', name: 'overtime_multiplier', nullable: true })
  overtimeMultiplier: any;

  @Column({ type: 'numeric', name: 'max_daily_hours', default: 14 })
  maxDailyHours: number;

  @Column({ type: 'numeric', name: 'min_rest_hours', default: 8 })
  minRestHours: number;

  @Column({ name: 'auto_close_after_min', default: 120 })
  autoCloseAfterMin: number;

  @Column({ name: 'photo_required', default: true })
  photoRequired: boolean;

  @Column({ name: 'face_match_mode', default: 'off' })
  faceMatchMode: string;

  @Column({ name: 'min_punch_interval_sec', default: 60 })
  minPunchIntervalSec: number;

  @Column({ name: 'photo_retention_days', default: 90 })
  photoRetentionDays: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
