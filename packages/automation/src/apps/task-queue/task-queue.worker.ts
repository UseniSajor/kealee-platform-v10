import { PrismaClient } from '@prisma/client';
import type { Job } from 'bullmq';
import { createWorker, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { TaskQueueService } from './task-queue.service.js';
import type { ProjectType } from './task-templates.js';

const prisma = new PrismaClient();
const service = new TaskQueueService();
const SOURCE_APP = 'APP-09';

interface CreateProjectTasksPayload {
  projectId: string;
  projectType: ProjectType;
}

interface AssignTasksPayload {
  projectId: string;
  phase: string;
}

interface AdvancePhasePayload {
  projectId: string;
}

interface CheckOverduePayload {
  // Empty — checks all tasks
}

interface RebalanceWorkloadPayload {
  // Empty — rebalances across active projects
}

type TaskQueuePayload =
  | CreateProjectTasksPayload
  | AssignTasksPayload
  | AdvancePhasePayload
  | CheckOverduePayload
  | RebalanceWorkloadPayload;

async function processor(job: Job<TaskQueuePayload>): Promise<any> {
  const task = await prisma.automationTask.create({
    data: {
      type: `task-queue:${job.name}`,
      status: 'PROCESSING',
      sourceApp: SOURCE_APP,
      payload: job.data as any,
      startedAt: new Date(),
    },
  });

  try {
    let result: any;

    switch (job.name) {
      case 'create-project-tasks': {
        const payload = job.data as CreateProjectTasksPayload;
        const count = await service.createProjectTasks(
          payload.projectId,
          payload.projectType,
        );
        result = { projectId: payload.projectId, tasksCreated: count };
        break;
      }

      case 'assign-tasks': {
        const payload = job.data as AssignTasksPayload;
        const count = await service.assignTasksToPM(
          payload.projectId,
          payload.phase,
        );
        result = { projectId: payload.projectId, phase: payload.phase, assigned: count };
        break;
      }

      case 'advance-phase': {
        const payload = job.data as AdvancePhasePayload;
        const nextPhase = await service.advanceToNextPhase(payload.projectId);
        result = { projectId: payload.projectId, nextPhase };
        break;
      }

      case 'check-overdue': {
        const overdueCount = await service.checkOverdueTasks();
        result = { overdueCount };
        break;
      }

      case 'rebalance-workload': {
        // Get all active projects and rebalance unassigned pending tasks
        const activeProjects = await prisma.project.findMany({
          where: { status: 'ACTIVE', currentPhase: { not: null } },
          select: { id: true, currentPhase: true },
        });

        let totalRebalanced = 0;
        for (const project of activeProjects) {
          if (project.currentPhase) {
            const count = await service.assignTasksToPM(
              project.id,
              project.currentPhase,
            );
            totalRebalanced += count;
          }
        }

        result = { projectsChecked: activeProjects.length, tasksRebalanced: totalRebalanced };
        break;
      }

      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }

    await prisma.automationTask.update({
      where: { id: task.id },
      data: { status: 'COMPLETED', result: result ?? {}, completedAt: new Date() },
    });

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.automationTask.update({
      where: { id: task.id },
      data: { status: 'FAILED', error: message, completedAt: new Date() },
    });
    throw err;
  }
}

export const taskQueueWorker = createWorker<TaskQueuePayload>(
  QUEUE_NAMES.TASK_QUEUE,
  processor,
  { concurrency: 5 },
);
