import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  country: string;

  @Column({ name: 'default_timezone', default: 'UTC' })
  defaultTimezone: string;

  @Column({ default: 'en' })
  locale: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ default: 'basic' })
  plan: string;

  @Column('jsonb', { default: {} })
  settings: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
