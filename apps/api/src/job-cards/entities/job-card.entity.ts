import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Employee } from '../../employees/entities/employee.entity';

@Entity('job_cards')
export class JobCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'job_number', unique: true })
  jobNumber: string;

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

  @Column({ name: 'customer_name' })
  customerName: string;

  @Column({ name: 'customer_phone' })
  customerPhone: string;

  @Column({ name: 'vehicle_plate_number' })
  vehiclePlateNumber: string;

  @Column({ name: 'vehicle_make' })
  vehicleMake: string;

  @Column({ name: 'vehicle_model' })
  vehicleModel: string;

  @Column({ name: 'vehicle_year', type: 'varchar', nullable: true })
  vehicleYear: string | null;

  @Column({ type: 'varchar', nullable: true })
  vin: string | null;

  @Column({ type: 'int', default: 0 })
  mileage: number;

  @Column({ name: 'fuel_level', default: 'half' }) // empty, quarter, half, three_quarter, full
  fuelLevel: string;

  @Column({ type: 'simple-array', nullable: true })
  complaints: string[];

  @Column({ default: 'RECEIVED' })
  // RECEIVED, DIAGNOSIS, ESTIMATE_PENDING, APPROVED, IN_PROGRESS, PAUSED, QUALITY_CHECK, READY, COMPLETED, CANCELLED
  status: string;

  @Column({ name: 'pause_reason', type: 'varchar', nullable: true })
  // WAITING_FOR_PARTS, WAITING_FOR_APPROVAL, LUNCH_BREAK, SHIFT_END
  pauseReason: string | null;

  @Column({ default: 'NORMAL' }) // LOW, NORMAL, HIGH, URGENT
  priority: string;

  @Column({ name: 'assigned_section', default: 'General' })
  // Mechanical, Denting, Painting, Tinting, Electrical, Floor Cleaning, Advisor, General
  assignedSection: string;

  @Column({ name: 'assigned_mechanic_id', type: 'varchar', nullable: true })
  assignedMechanicId: string | null;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'assigned_mechanic_id' })
  assignedMechanic: Employee;

  @Column({ type: 'float', default: 0, name: 'parts_total' })
  partsTotal: number;

  @Column({ type: 'float', default: 0, name: 'labor_total' })
  laborTotal: number;

  @Column({ type: 'float', default: 0, name: 'tax_amount' })
  taxAmount: number;

  @Column({ type: 'float', default: 0, name: 'grand_total' })
  grandTotal: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'started_at' })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'completed_at' })
  completedAt: Date | null;

  @Column({ name: 'external_erp_id', type: 'varchar', nullable: true })
  externalErpId: string | null;

  @Column({ name: 'external_erp_status', default: 'LOCAL' }) // LOCAL, SYNCED_MANUAL, API_CONNECTED
  externalErpStatus: string;

  @Column({ name: 'is_synced_from_erp', default: false })
  isSyncedFromErp: boolean;

  @Column({ name: 'is_rework', default: false })
  isRework: boolean;

  @Column({ name: 'reopen_reason', type: 'text', nullable: true })
  reopenReason: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'reopened_at' })
  reopenedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
