import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

@Entity('leave_requests')
export class LeaveRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'leave_date', type: 'date' })
  leaveDate: string;

  @Column({ name: 'leave_end_date', type: 'date', nullable: true })
  leaveEndDate: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ default: 'pending' }) // pending, approved, rejected
  status: string;

  @Column({ name: 'email_sent', default: false })
  emailSent: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
