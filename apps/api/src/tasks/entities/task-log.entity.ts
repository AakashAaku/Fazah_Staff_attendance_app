import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Task } from './task.entity';
import { Employee } from '../../employees/entities/employee.entity';

@Entity('task_logs')
export class TaskLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'task_id' })
  taskId: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ name: 'employee_id', nullable: true })
  employeeId: string;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column() // CREATED, WORK_STARTED, PAUSED, RESUMED, COMPLETED, CANCELLED
  action: string;

  @Column({ nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
