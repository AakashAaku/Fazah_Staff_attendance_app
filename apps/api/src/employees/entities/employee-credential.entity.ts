import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Employee } from './employee.entity';

@Entity('employee_credentials')
export class EmployeeCredential {
  @PrimaryColumn({ name: 'employee_id' })
  employeeId: string;

  @OneToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'pin_hash' })
  pinHash: string;

  @Column({ name: 'pin_set_at', type: 'timestamptz', nullable: true })
  pinSetAt: Date;

  @Column({ name: 'failed_attempts', default: 0 })
  failedAttempts: number;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  @Column({ name: 'must_reset', default: true })
  mustReset: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
