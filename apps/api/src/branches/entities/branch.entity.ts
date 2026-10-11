import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  timezone: string;

  @Column('decimal', { precision: 10, scale: 8, nullable: true })
  lat: number;

  @Column('decimal', { precision: 11, scale: 8, nullable: true })
  lng: number;

  @Column({ name: 'geofence_radius_m', default: 100 })
  geofenceRadiusM: number;

  @Column('text', { array: true, nullable: true, name: 'allowed_cidrs' })
  allowedCidrs: string[];

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
