import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from '../../users/entities/user.entity';

@Entity('employees')
export class Employee {
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

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'employee_code' })
  employeeCode: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'job_title', default: 'Staff' })
  jobTitle: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ name: 'hire_date', type: 'date', nullable: true })
  hireDate: Date;

  @Column({ default: 'active' }) // active, suspended, terminated
  status: string;

  @Column({ name: 'profile_photo_key', nullable: true })
  profilePhotoKey: string;

  @Column({ name: 'photo_consent_at', type: 'timestamptz', nullable: true })
  photoConsentAt: Date;

  @Column({ name: 'supervisor_id', nullable: true })
  supervisorId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'supervisor_id' })
  supervisor: Employee;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
