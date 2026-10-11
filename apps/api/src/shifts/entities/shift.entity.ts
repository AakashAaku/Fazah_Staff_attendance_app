import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { ShiftAssignment } from './shift-assignment.entity';

@Entity('shifts')
export class Shift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column()
  name: string;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string; // e.g. "09:00:00"

  @Column({ type: 'time', name: 'end_time' })
  endTime: string; // e.g. "21:00:00"

  @Column({ name: 'break_minutes', default: 60 })
  breakMinutes: number;

  @Column({ name: 'grace_minutes', default: 10 })
  graceMinutes: number;

  @Column({ name: 'crosses_midnight', default: false })
  crossesMidnight: boolean;

  @Column({ nullable: true })
  color: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ShiftAssignment, assignment => assignment.shift)
  assignments: ShiftAssignment[];
}
