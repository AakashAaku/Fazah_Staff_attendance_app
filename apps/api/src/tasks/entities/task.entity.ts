import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { User } from '../../users/entities/user.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'assigned_to_id' })
  assignedToId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo: Employee;

  @Column({ name: 'assigned_by_id', nullable: true })
  assignedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_by_id' })
  assignedBy: User;

  @Column({ default: 'pending' }) // pending, in_progress, paused, completed, cancelled
  status: string;

  @Column({ name: 'pause_reason', nullable: true })
  pauseReason: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'due_date' })
  dueDate: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
