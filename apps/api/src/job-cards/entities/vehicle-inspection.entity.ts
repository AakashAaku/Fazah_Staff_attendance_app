import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Branch } from '../../branches/entities/branch.entity';

@Entity('vehicle_inspections')
export class VehicleInspection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inspection_number', unique: true })
  inspectionNumber: string;

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

  @Column({ name: 'vehicle_year', nullable: true })
  vehicleYear: string;

  @Column({ type: 'int', default: 0 })
  mileage: number;

  @Column({ name: 'fuel_level', default: 'half' }) // empty, quarter, half, three_quarter, full
  fuelLevel: string;

  @Column({ type: 'simple-array', nullable: true, name: 'warning_lights' })
  warningLights: string[];

  @Column({ type: 'simple-array', nullable: true, name: 'valuables_checklist' })
  valuablesChecklist: string[];

  @Column({ type: 'simple-array', nullable: true, name: 'extra_faults' })
  extraFaults: string[];

  @Column({ type: 'json', nullable: true, name: 'damage_markers' })
  // [{ id, x, y, view: 'front'|'rear'|'left'|'right', type: 'scratch'|'dent'|'crack'|'glass', note: '' }]
  damageMarkers: any[];

  @Column({ type: 'text', nullable: true, name: 'customer_signature' })
  customerSignature: string;

  @Column({ default: 'PENDING' }) // PENDING, SIGNED, CONVERTED_TO_JOBCARD
  status: string;

  @Column({ name: 'converted_job_card_id', nullable: true })
  convertedJobCardId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
