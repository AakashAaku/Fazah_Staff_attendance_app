import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('labor_catalog')
export class LaborCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ default: 'General' }) // Mechanical, Denting, Painting, Tinting, Electrical, Cleaning
  section: string;

  @Column({ type: 'float', default: 1.0, name: 'standard_hours' })
  standardHours: number;

  @Column({ type: 'float', default: 100.0, name: 'standard_rate' })
  standardRate: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
