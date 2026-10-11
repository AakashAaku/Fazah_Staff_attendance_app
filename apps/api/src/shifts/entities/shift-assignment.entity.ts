import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { Shift } from './shift.entity';

@Entity('shift_assignments')
export class ShiftAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'shift_id' })
  shiftId: string;

  @ManyToOne(() => Shift, shift => shift.assignments)
  @JoinColumn({ name: 'shift_id' })
  shift: Shift;

  @Column({ type: 'date', name: 'valid_from' })
  validFrom: string; // YYYY-MM-DD

  @Column({ type: 'date', name: 'valid_to', nullable: true })
  validTo: string | null;

  @Column({ type: 'smallint', array: true, nullable: true })
  weekdays: number[]; // 0=Sun, 1=Mon, etc.

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
