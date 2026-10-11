import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { TaskLog } from './entities/task-log.entity';
import { CreateTaskDto, UpdateTaskStatusDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    @InjectRepository(TaskLog)
    private taskLogRepo: Repository<TaskLog>,
  ) {}

  async create(tenantId: string, assignedById: string, dto: CreateTaskDto) {
    const task = this.taskRepo.create({
      tenantId,
      assignedById,
      ...dto,
    });
    const saved = await this.taskRepo.save(task);

    // Record initial TaskLog
    await this.taskLogRepo.save(
      this.taskLogRepo.create({
        taskId: saved.id,
        employeeId: dto.assignedToId,
        action: 'CREATED',
        note: `Task "${saved.title}" created and assigned to staff`,
      }),
    );

    return saved;
  }

  async findAll(tenantId: string, branchId?: string, employeeId?: string) {
    const where: any = { tenantId };
    if (branchId) where.branchId = branchId;
    if (employeeId) where.assignedToId = employeeId;

    return await this.taskRepo.find({
      where,
      relations: { assignedTo: true, assignedBy: true },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(
    tenantId: string,
    id: string,
    dto: { status: string; pauseReason?: string; employeeId?: string; note?: string },
  ) {
    const task = await this.taskRepo.findOne({
      where: { id, tenantId },
      relations: { assignedTo: true },
    });
    if (!task) throw new NotFoundException('Task not found');

    const oldStatus = task.status;
    task.status = dto.status;
    if (dto.pauseReason !== undefined) task.pauseReason = dto.pauseReason;

    let action = `STATUS_${dto.status.toUpperCase()}`;

    if (dto.status === 'in_progress') {
      if (!task.startedAt) {
        task.startedAt = new Date();
        action = 'WORK_STARTED';
      } else if (oldStatus === 'paused') {
        action = 'RESUMED';
      } else {
        action = 'WORK_STARTED';
      }
    } else if (dto.status === 'paused') {
      action = 'PAUSED';
    } else if (dto.status === 'completed') {
      task.completedAt = new Date();
      action = 'COMPLETED';
    } else if (dto.status === 'cancelled') {
      action = 'CANCELLED';
    }

    const saved = await this.taskRepo.save(task);

    // Save Log
    await this.taskLogRepo.save(
      this.taskLogRepo.create({
        taskId: id,
        employeeId: dto.employeeId || task.assignedToId,
        action,
        reason: dto.pauseReason || undefined,
        note: dto.note || `Task status changed from ${oldStatus} to ${dto.status}`,
      }),
    );

    return saved;
  }

  async reopenTask(tenantId: string, id: string, dto: { reason: string; employeeId?: string }) {
    const task = await this.taskRepo.findOne({
      where: { id, tenantId },
      relations: { assignedTo: true },
    });
    if (!task) throw new NotFoundException('Task not found');
    if (!dto.reason || !dto.reason.trim()) {
      throw new Error('Comment/reason is required to reopen a task');
    }

    const oldStatus = task.status;
    task.status = 'in_progress';
    task.completedAt = null as any; // Reset completed timestamp for active work tracking

    const saved = await this.taskRepo.save(task);

    // Record REOPENED action log with admin comment
    await this.taskLogRepo.save(
      this.taskLogRepo.create({
        taskId: id,
        employeeId: dto.employeeId || task.assignedToId,
        action: 'REOPENED',
        reason: 'ADMIN_REOPEN',
        note: dto.reason.trim(),
      }),
    );

    return saved;
  }

  async getReopenedReport(tenantId: string, dateStr?: string) {
    const qb = this.taskLogRepo.createQueryBuilder('log')
      .leftJoinAndSelect('log.task', 'task')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .leftJoinAndSelect('log.employee', 'employee')
      .where('log.action = :action', { action: 'REOPENED' })
      .orderBy('log.createdAt', 'DESC');

    if (dateStr) {
      const start = `${dateStr}T00:00:00.000Z`;
      const end = `${dateStr}T23:59:59.999Z`;
      qb.andWhere('log.createdAt >= :start AND log.createdAt <= :end', { start, end });
    }

    return qb.getMany();
  }

  async getTaskLogs(taskId: string) {
    return this.taskLogRepo.find({
      where: { taskId },
      relations: { employee: true },
      order: { createdAt: 'DESC' },
    });
  }

  async remove(tenantId: string, id: string) {
    const result = await this.taskRepo.delete({ id, tenantId });
    if (result.affected === 0) throw new NotFoundException('Task not found');
    return { success: true };
  }
}
