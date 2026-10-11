import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { User } from '../../users/entities/user.entity';

@Entity('devices')
export class Device {
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

  @Column() // kiosk or phone
  type: string;

  @Column({ name: 'employee_id', nullable: true })
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column()
  name: string;

  @Column({ name: 'public_key', nullable: true })
  publicKey: string;

  @Column({ name: 'credential_hash' })
  credentialHash: string;

  @Column({ default: 'pending' }) // pending, active, revoked
  status: string;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt: Date;

  @Column({ name: 'last_ip', type: 'inet', nullable: true })
  lastIp: string;

  @Column({ name: 'approved_by', nullable: true })
  approvedByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approvedByUser: User;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
