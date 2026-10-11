import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { JobCard } from './job-card.entity';
import { Employee } from '../../employees/entities/employee.entity';

@Entity('job_card_parts')
export class JobCardPart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'job_card_id' })
  jobCardId: string;

  @ManyToOne(() => JobCard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_card_id' })
  jobCard: JobCard;

  @Column({ name: 'part_number', nullable: true })
  partNumber: string;

  @Column({ name: 'part_name' })
  partName: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'float', default: 0, name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'float', default: 0, name: 'total_price' })
  totalPrice: number;

  @Column({ default: false, name: 'is_vendor_purchase' })
  isVendorPurchase: boolean;

  @Column({ name: 'vendor_name', nullable: true })
  vendorName: string;

  @Column({ name: 'vendor_invoice_number', nullable: true })
  vendorInvoiceNumber: string;

  @Column({ type: 'float', default: 0, name: 'purchase_cost', nullable: true })
  purchaseCost: number;

  @Column({ default: 'ISSUED' }) // REQUESTED, ISSUED, INSTALLED, RETURNED
  status: string;

  @Column({ name: 'requested_by_id', nullable: true })
  requestedById: string;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'requested_by_id' })
  requestedBy: Employee;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
