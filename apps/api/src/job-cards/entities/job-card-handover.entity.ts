import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { JobCard } from './job-card.entity';
import { Employee } from '../../employees/entities/employee.entity';

@Entity('job_card_handovers')
export class JobCardHandover {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'job_card_id' })
  jobCardId: string;

  @ManyToOne(() => JobCard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_card_id' })
  jobCard: JobCard;

  @Column({ name: 'from_section' })
  fromSection: string; // e.g., 'Denting & Painting'

  @Column({ name: 'to_section' })
  toSection: string; // e.g., 'Electrical'

  @Column({ name: 'from_labor_id', type: 'varchar', nullable: true })
  fromLaborId: string | null;

  @Column({ name: 'to_labor_id', type: 'varchar', nullable: true })
  toLaborId: string | null;

  @Column({ name: 'handed_over_by_id', type: 'varchar', nullable: true })
  handedOverById: string | null;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'handed_over_by_id' })
  handedOverBy: Employee;

  @Column({ name: 'received_by_id', type: 'varchar', nullable: true })
  receivedById: string | null;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'received_by_id' })
  receivedBy: Employee;

  @Column({ type: 'simple-json', nullable: true })
  checklist: Array<{ item: string; passed: boolean; note?: string }>;

  @Column({ default: 'PASSED' }) // PASSED, FLAGGED, REJECTED
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
