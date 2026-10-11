import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { WorkSession } from './entities/work-session.entity';
import { Punch, PunchType } from '../punches/entities/punch.entity';
import { Employee } from '../employees/entities/employee.entity';
import { JobCard } from '../job-cards/entities/job-card.entity';
import { JobCardLog } from '../job-cards/entities/job-card-log.entity';
import { Task } from '../tasks/entities/task.entity';
import { TaskLog } from '../tasks/entities/task-log.entity';

export interface TimelineSegment {
  id: string;
  type: 'TASK' | 'JOB_CARD' | 'FREE_TIME' | 'BREAK';
  title: string;
  subtitle?: string;
  status: string; // IN_PROGRESS, PAUSED, COMPLETED, FREE
  pauseReason?: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes: number;
  logs?: Array<{ action: string; note?: string; reason?: string; createdAt: Date }>;
}

export interface EmployeeDailyWorkTimeline {
  employee: {
    id: string;
    fullName: string;
    employeeCode: string;
    jobTitle: string;
    status: string;
  };
  date: string;
  clockInTime?: Date;
  clockOutTime?: Date;
  liveStatus: {
    state: 'WORKING' | 'PAUSED' | 'FREE' | 'CLOCKED_OUT' | 'NOT_CLOCKED_IN';
    label: string;
    color: string;
    taskTitle?: string;
    pauseReason?: string;
    since?: Date;
    durationMinutes?: number;
  };
  stats: {
    shiftMinutes: number;
    activeTaskMinutes: number;
    pausedMinutes: number;
    freeMinutes: number;
    completedCount: number;
    inProgressCount: number;
    efficiencyPercent: number;
  };
  segments: TimelineSegment[];
  rawLogs: Array<{ source: 'JOB_CARD' | 'TASK'; id: string; action: string; title: string; createdAt: Date; note?: string }>;
}

@Injectable()
export class TimesheetService {
  constructor(
    @InjectRepository(WorkSession)
    private sessionRepo: Repository<WorkSession>,
    @InjectRepository(Punch)
    private punchRepo: Repository<Punch>,
    @InjectRepository(Employee)
    private empRepo: Repository<Employee>,
    @InjectRepository(JobCard)
    private jobRepo: Repository<JobCard>,
    @InjectRepository(JobCardLog)
    private jobLogRepo: Repository<JobCardLog>,
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    @InjectRepository(TaskLog)
    private taskLogRepo: Repository<TaskLog>,
  ) {}

  async getDailyWorkTimeline(tenantId: string, targetDateStr?: string): Promise<EmployeeDailyWorkTimeline[]> {
    const today = new Date();
    const dateStr = targetDateStr || today.toISOString().split('T')[0];

    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    const employees = await this.empRepo.find({
      where: { tenantId },
      order: { fullName: 'ASC' },
    });

    const isToday = dateStr === today.toISOString().split('T')[0];
    const now = isToday ? today : endOfDay;

    const report: EmployeeDailyWorkTimeline[] = [];

    for (const emp of employees) {
      // 1. Fetch punches for employee for the day
      const punches = await this.punchRepo.find({
        where: {
          employeeId: emp.id,
          serverTs: Between(startOfDay, endOfDay),
        },
        order: { serverTs: 'ASC' },
      });

      const inPunch = punches.find((p) => p.type === PunchType.IN);
      const outPunch = [...punches].reverse().find((p) => p.type === PunchType.OUT);

      const clockInTime = inPunch ? new Date(inPunch.serverTs) : undefined;
      const clockOutTime = outPunch ? new Date(outPunch.serverTs) : undefined;

      // 2. Fetch Job Cards & Logs for employee
      const jobCards = await this.jobRepo.find({
        where: { assignedMechanicId: emp.id },
      });
      const jobLogs = await this.jobLogRepo.find({
        where: {
          employeeId: emp.id,
          createdAt: Between(startOfDay, endOfDay),
        },
        order: { createdAt: 'ASC' },
      });

      // 3. Fetch Tasks & Logs for employee
      const tasks = await this.taskRepo.find({
        where: { assignedToId: emp.id },
      });
      const taskLogs = await this.taskLogRepo.find({
        where: {
          employeeId: emp.id,
          createdAt: Between(startOfDay, endOfDay),
        },
        order: { createdAt: 'ASC' },
      });

      // Combine logs
      const rawLogs: Array<{ source: 'JOB_CARD' | 'TASK'; id: string; action: string; title: string; createdAt: Date; note?: string }> = [];
      
      for (const log of jobLogs) {
        const card = jobCards.find((j) => j.id === log.jobCardId);
        rawLogs.push({
          source: 'JOB_CARD',
          id: log.id,
          action: log.action,
          title: card ? `Job #${card.jobNumber} (${card.customerName} - ${card.vehiclePlateNumber})` : 'Job Card',
          createdAt: new Date(log.createdAt),
          note: log.note || log.reason,
        });
      }

      for (const log of taskLogs) {
        const task = tasks.find((t) => t.id === log.taskId);
        rawLogs.push({
          source: 'TASK',
          id: log.id,
          action: log.action,
          title: task ? `Task: ${task.title}` : 'Task',
          createdAt: new Date(log.createdAt),
          note: log.note || log.reason,
        });
      }

      rawLogs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      // Build work segments
      const segments: TimelineSegment[] = [];
      let activeTaskMinutes = 0;
      let pausedMinutes = 0;
      let completedCount = 0;
      let inProgressCount = 0;

      // Process Job Cards
      for (const card of jobCards) {
        const logsForCard = jobLogs.filter((l) => l.jobCardId === card.id);
        const cardTitle = `Job #${card.jobNumber} - ${card.vehicleMake} ${card.vehicleModel} (${card.vehiclePlateNumber})`;

        if (card.status === 'COMPLETED' || card.status === 'READY') {
          completedCount++;
        } else if (card.status === 'IN_PROGRESS' || card.status === 'PAUSED') {
          inProgressCount++;
        }

        // Calculate time intervals from logs or startedAt
        let currentStart: Date | null = card.startedAt ? new Date(card.startedAt) : null;
        let cardPausedTime = 0;

        for (const l of logsForCard) {
          const lDate = new Date(l.createdAt);
          if (l.action.includes('IN_PROGRESS') || l.action === 'WORK_STARTED' || l.action === 'RESUMED') {
            if (!currentStart) currentStart = lDate;
          } else if (l.action.includes('PAUSED')) {
            if (currentStart) {
              const dur = Math.max(0, Math.floor((lDate.getTime() - currentStart.getTime()) / 60000));
              activeTaskMinutes += dur;
              segments.push({
                id: `jc-${card.id}-${l.id}`,
                type: 'JOB_CARD',
                title: cardTitle,
                subtitle: `Customer: ${card.customerName}`,
                status: 'PAUSED',
                pauseReason: l.reason || card.pauseReason || 'Paused',
                startTime: currentStart,
                endTime: lDate,
                durationMinutes: dur,
              });
              currentStart = null;
            }
          } else if (l.action.includes('COMPLETED') || l.action.includes('READY')) {
            if (currentStart) {
              const dur = Math.max(0, Math.floor((lDate.getTime() - currentStart.getTime()) / 60000));
              activeTaskMinutes += dur;
              segments.push({
                id: `jc-${card.id}-${l.id}`,
                type: 'JOB_CARD',
                title: cardTitle,
                subtitle: `Customer: ${card.customerName}`,
                status: 'COMPLETED',
                startTime: currentStart,
                endTime: lDate,
                durationMinutes: dur,
              });
              currentStart = null;
            }
          }
        }

        // If job is currently IN_PROGRESS right now
        if (currentStart && card.status === 'IN_PROGRESS') {
          const dur = Math.max(0, Math.floor((now.getTime() - currentStart.getTime()) / 60000));
          activeTaskMinutes += dur;
          segments.push({
            id: `jc-${card.id}-active`,
            type: 'JOB_CARD',
            title: cardTitle,
            subtitle: `Customer: ${card.customerName}`,
            status: 'IN_PROGRESS',
            startTime: currentStart,
            endTime: isToday ? undefined : endOfDay,
            durationMinutes: dur,
          });
        }
      }

      // Process Tasks
      for (const task of tasks) {
        const logsForTask = taskLogs.filter((l) => l.taskId === task.id);
        const taskTitle = `Task: ${task.title}`;

        if (task.status === 'completed') {
          completedCount++;
        } else if (task.status === 'in_progress' || task.status === 'paused') {
          inProgressCount++;
        }

        let currentStart: Date | null = task.startedAt ? new Date(task.startedAt) : null;

        for (const l of logsForTask) {
          const lDate = new Date(l.createdAt);
          if (l.action === 'WORK_STARTED' || l.action === 'RESUMED' || l.action === 'STATUS_IN_PROGRESS') {
            if (!currentStart) currentStart = lDate;
          } else if (l.action === 'PAUSED' || l.action === 'STATUS_PAUSED') {
            if (currentStart) {
              const dur = Math.max(0, Math.floor((lDate.getTime() - currentStart.getTime()) / 60000));
              activeTaskMinutes += dur;
              segments.push({
                id: `task-${task.id}-${l.id}`,
                type: 'TASK',
                title: taskTitle,
                subtitle: task.description || 'Assigned task',
                status: 'PAUSED',
                pauseReason: l.reason || task.pauseReason || 'Paused',
                startTime: currentStart,
                endTime: lDate,
                durationMinutes: dur,
              });
              currentStart = null;
            }
          } else if (l.action === 'COMPLETED' || l.action === 'STATUS_COMPLETED') {
            if (currentStart) {
              const dur = Math.max(0, Math.floor((lDate.getTime() - currentStart.getTime()) / 60000));
              activeTaskMinutes += dur;
              segments.push({
                id: `task-${task.id}-${l.id}`,
                type: 'TASK',
                title: taskTitle,
                subtitle: task.description || 'Assigned task',
                status: 'COMPLETED',
                startTime: currentStart,
                endTime: lDate,
                durationMinutes: dur,
              });
              currentStart = null;
            }
          }
        }

        if (currentStart && task.status === 'in_progress') {
          const dur = Math.max(0, Math.floor((now.getTime() - currentStart.getTime()) / 60000));
          activeTaskMinutes += dur;
          segments.push({
            id: `task-${task.id}-active`,
            type: 'TASK',
            title: taskTitle,
            subtitle: task.description || 'Assigned task',
            status: 'IN_PROGRESS',
            startTime: currentStart,
            endTime: isToday ? undefined : endOfDay,
            durationMinutes: dur,
          });
        }
      }

      // Sort segments chronologically
      segments.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      // 4. Calculate Shift Time & Free / Unassigned Time
      let shiftMinutes = 0;
      let freeMinutes = 0;

      if (clockInTime) {
        const shiftEnd = clockOutTime || now;
        shiftMinutes = Math.max(0, Math.floor((shiftEnd.getTime() - clockInTime.getTime()) / 60000));

        // Gap analysis for FREE TIME
        let cursor = clockInTime.getTime();

        for (const seg of segments) {
          const segStart = seg.startTime.getTime();
          if (segStart > cursor) {
            const gapMins = Math.floor((segStart - cursor) / 60000);
            if (gapMins >= 2) {
              freeMinutes += gapMins;
              segments.push({
                id: `free-${cursor}`,
                type: 'FREE_TIME',
                title: '🆓 Free / Unassigned Time',
                subtitle: 'Clocked in, waiting for next task assignment',
                status: 'FREE',
                startTime: new Date(cursor),
                endTime: new Date(segStart),
                durationMinutes: gapMins,
              });
            }
          }
          const segEnd = seg.endTime ? seg.endTime.getTime() : now.getTime();
          if (segEnd > cursor) cursor = segEnd;
        }

        // Gap from last task to shift end
        if (cursor < shiftEnd.getTime()) {
          const gapMins = Math.floor((shiftEnd.getTime() - cursor) / 60000);
          if (gapMins >= 2) {
            freeMinutes += gapMins;
            segments.push({
              id: `free-${cursor}`,
              type: 'FREE_TIME',
              title: '🆓 Free / Unassigned Time',
              subtitle: 'Clocked in, currently free',
              status: 'FREE',
              startTime: new Date(cursor),
              endTime: clockOutTime || (isToday ? undefined : endOfDay),
              durationMinutes: gapMins,
            });
          }
        }

        // Re-sort segments after inserting free time
        segments.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      }

      // 5. Determine Live Status
      let liveStatusState: 'WORKING' | 'PAUSED' | 'FREE' | 'CLOCKED_OUT' | 'NOT_CLOCKED_IN' = 'NOT_CLOCKED_IN';
      let liveLabel = 'Not Clocked In';
      let liveColor = 'bg-slate-500 text-slate-100 border-slate-600';
      let liveTaskTitle: string | undefined;
      let livePauseReason: string | undefined;
      let liveSince: Date | undefined;
      let liveDurationMinutes: number | undefined;

      if (clockInTime) {
        if (clockOutTime) {
          liveStatusState = 'CLOCKED_OUT';
          liveLabel = 'Clocked Out';
          liveColor = 'bg-slate-700 text-slate-300 border-slate-600';
          liveSince = clockOutTime;
        } else {
          // Currently clocked in
          const activeJob = jobCards.find((j) => j.status === 'IN_PROGRESS');
          const activeTask = tasks.find((t) => t.status === 'in_progress');
          const pausedJob = jobCards.find((j) => j.status === 'PAUSED');
          const pausedTask = tasks.find((t) => t.status === 'paused');

          if (activeJob) {
            liveStatusState = 'WORKING';
            liveTaskTitle = `Job #${activeJob.jobNumber} (${activeJob.vehicleMake} ${activeJob.vehicleModel})`;
            liveLabel = `Working: ${liveTaskTitle}`;
            liveColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 animate-pulse';
            liveSince = activeJob.startedAt ? new Date(activeJob.startedAt) : clockInTime;
            liveDurationMinutes = Math.floor((now.getTime() - (liveSince?.getTime() || now.getTime())) / 60000);
          } else if (activeTask) {
            liveStatusState = 'WORKING';
            liveTaskTitle = `Task: ${activeTask.title}`;
            liveLabel = `Working: ${liveTaskTitle}`;
            liveColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 animate-pulse';
            liveSince = activeTask.startedAt ? new Date(activeTask.startedAt) : clockInTime;
            liveDurationMinutes = Math.floor((now.getTime() - (liveSince?.getTime() || now.getTime())) / 60000);
          } else if (pausedJob) {
            liveStatusState = 'PAUSED';
            liveTaskTitle = `Job #${pausedJob.jobNumber}`;
            livePauseReason = pausedJob.pauseReason || 'Paused';
            liveLabel = `Paused: ${livePauseReason}`;
            liveColor = 'bg-amber-500/20 text-amber-300 border-amber-500/50';
          } else if (pausedTask) {
            liveStatusState = 'PAUSED';
            liveTaskTitle = `Task: ${pausedTask.title}`;
            livePauseReason = pausedTask.pauseReason || 'Paused';
            liveLabel = `Paused: ${livePauseReason}`;
            liveColor = 'bg-amber-500/20 text-amber-300 border-amber-500/50';
          } else {
            // Free / Unassigned
            liveStatusState = 'FREE';
            liveLabel = 'Free / Unassigned';
            liveColor = 'bg-blue-500/20 text-blue-300 border-blue-500/50';
            const lastSeg = segments[segments.length - 1];
            if (lastSeg && lastSeg.status === 'FREE') {
              liveSince = lastSeg.startTime;
              liveDurationMinutes = lastSeg.durationMinutes;
            }
          }
        }
      }

      const efficiencyPercent = shiftMinutes > 0 ? Math.min(100, Math.round((activeTaskMinutes / shiftMinutes) * 100)) : 0;

      report.push({
        employee: {
          id: emp.id,
          fullName: emp.fullName,
          employeeCode: emp.employeeCode,
          jobTitle: emp.jobTitle || 'Technician',
          status: emp.status,
        },
        date: dateStr,
        clockInTime,
        clockOutTime,
        liveStatus: {
          state: liveStatusState,
          label: liveLabel,
          color: liveColor,
          taskTitle: liveTaskTitle,
          pauseReason: livePauseReason,
          since: liveSince,
          durationMinutes: liveDurationMinutes,
        },
        stats: {
          shiftMinutes,
          activeTaskMinutes,
          pausedMinutes,
          freeMinutes,
          completedCount,
          inProgressCount,
          efficiencyPercent,
        },
        segments,
        rawLogs,
      });
    }

    return report;
  }
}
