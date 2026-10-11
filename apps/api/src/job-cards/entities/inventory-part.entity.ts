import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('inventory_parts')
export class InventoryPart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'part_number', unique: true })
  partNumber: string;

  @Column()
  name: string;

  @Column({ default: 'General' }) // Engine, Brakes, Oils & Fluids, Filters, Body Work, Electrical, Suspension, General
  category: string;

  @Column({ type: 'int', default: 0, name: 'stock_quantity' })
  stockQuantity: number;

  @Column({ type: 'float', default: 0, name: 'unit_cost' })
  unitCost: number;

  @Column({ type: 'float', default: 0, name: 'unit_price' })
  unitPrice: number;

  @Column({ nullable: true })
  location: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
