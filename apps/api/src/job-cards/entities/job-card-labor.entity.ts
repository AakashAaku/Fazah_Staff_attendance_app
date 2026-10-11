import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { JobCard } from './job-card.entity';
import { Employee } from '../../employees/entities/employee.entity';

@Entity('job_card_labors')
export class JobCardLabor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'job_card_id' })
  jobCardId: string;

  @ManyToOne(() => JobCard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_card_id' })
  jobCard: JobCard;

  @Column({ name: 'operation_name' })
  operationName: string;

  @Column({ default: 'General' }) // Mechanical, Denting, Painting, Tinting, Electrical, Cleaning
  section: string;

  @Column({ name: 'assigned_mechanic_id', type: 'varchar', nullable: true })
  assignedMechanicId: string | null;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'assigned_mechanic_id' })
  assignedMechanic: Employee;

  @Column({ type: 'float', default: 1, name: 'estimated_hours' })
  estimatedHours: number;

  @Column({ type: 'float', default: 0, name: 'actual_hours' })
  actualHours: number;

  @Column({ type: 'float', default: 0, name: 'hourly_rate' })
  hourlyRate: number;

  @Column({ type: 'float', default: 0, name: 'total_price' })
  totalPrice: number;

  @Column({ type: 'int', default: 1, name: 'step_order' })
  stepOrder: number;

  @Column({ default: 'PENDING' }) // PENDING, IN_PROGRESS, PAUSED, QA_PENDING, HANDOVER_PENDING, COMPLETED, REWORK_NEEDED
  status: string;

  @Column({ name: 'pause_reason', type: 'varchar', nullable: true })
  // WAITING_FOR_PARTS, WAITING_FOR_APPROVAL, LUNCH_BREAK, SHIFT_END, WAITING_PREVIOUS_DEPT
  pauseReason: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'started_at' })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'completed_at' })
  completedAt: Date | null;

  @Column({ type: 'int', default: 0, name: 'actual_minutes' })
  actualMinutes: number;

  @Column({ default: false, name: 'qa_passed' })
  qaPassed: boolean;

  @Column({ type: 'text', nullable: true, name: 'qa_notes' })
  qaNotes: string | null;

  @Column({ name: 'qa_verified_by_id', type: 'varchar', nullable: true })
  qaVerifiedById: string | null;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'qa_verified_by_id' })
  qaVerifiedBy: Employee;

  @Column({ type: 'timestamptz', nullable: true, name: 'qa_verified_at' })
  qaVerifiedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
