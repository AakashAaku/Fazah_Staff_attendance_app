import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { JobCard } from './job-card.entity';
import { Employee } from '../../employees/entities/employee.entity';

@Entity('job_card_logs')
export class JobCardLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'job_card_id' })
  jobCardId: string;

  @ManyToOne(() => JobCard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_card_id' })
  jobCard: JobCard;

  @Column({ name: 'employee_id', nullable: true })
  employeeId: string;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column() // WORK_STARTED, PAUSED, RESUMED, WORK_COMPLETED, STATUS_CHANGE, PART_ADDED, PART_ISSUED
  action: string;

  @Column({ nullable: true }) // WAITING_FOR_PARTS, WAITING_FOR_APPROVAL, LUNCH_BREAK, SHIFT_END
  reason: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
