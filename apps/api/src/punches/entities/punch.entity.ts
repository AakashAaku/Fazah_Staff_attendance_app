import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

export enum PunchType {
  IN = 'IN',
  OUT = 'OUT',
  BREAK_START = 'BREAK_START',
  BREAK_END = 'BREAK_END',
}

export enum PunchMethod {
  KIOSK_PIN = 'kiosk_pin',
  PHONE_QR = 'phone_qr',
  ADMIN_MANUAL = 'admin_manual',
  AUTO_CLOSE = 'auto_close',
  OFFLINE_SYNC = 'offline_sync',
}

@Entity('punches')
@Index(['tenantId', 'employeeId', 'serverTs'])
@Index(['tenantId', 'branchId', 'serverTs'])
export class Punch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee;

  @Column('uuid', { nullable: true })
  branchId: string;

  @Column('uuid', { nullable: true })
  deviceId: string;

  @Column({ type: 'enum', enum: PunchType })
  type: PunchType;

  @Column({ type: 'timestamptz' })
  serverTs: Date;

  @Column({ type: 'enum', enum: PunchMethod })
  method: PunchMethod;

  @Column({ type: 'inet', nullable: true })
  ip: string;

  @Column({ type: 'varchar', nullable: true })
  userAgent: string;

  @Column({ type: 'float', nullable: true })
  lat: number;

  @Column({ type: 'float', nullable: true })
  lng: number;

  @Column({ type: 'varchar', nullable: true })
  photoKey: string;

  @Column({ type: 'varchar', nullable: true })
  photoSha256: string;

  @Column({ type: 'float', nullable: true })
  faceScore: number;

  @Column({ type: 'varchar', nullable: true })
  challengeId: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  idempotencyKey: string;

  @Column({ type: 'int', default: 0 })
  riskScore: number;

  @Column({ type: 'text', array: true, default: [] })
  flags: string[];

  @Column('uuid', { nullable: true })
  sessionId: string;

  @Column({ type: 'jsonb', nullable: true })
  clientMeta: any;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Punches are append-only. Included for completeness.
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
