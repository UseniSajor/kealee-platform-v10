/**
 * APP-09: TASK QUEUE MANAGER
 * Automation Level: 90%
 *
 * Features:
 * - Auto-creates tasks from events (new project, milestones, inspections)
 * - Priority scoring by deadline, client tier, value, dependencies
 * - PM workload balancing and auto-assignment
 * - Task escalation workflows
 * - Dashboard metrics
 */

import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import {
  createWorker,
  queues,
  QUEUE_NAMES,
  JOB_OPTIONS,
} from '../../../shared/queue.js';
import { getEventBus, EVENT_TYPES, KealeeEvent } from '../../../shared/events.js';
import { sendEmail, EMAIL_TEMPLATES } from '../../../shared/integrations/email.js';
import { sendUrgentTaskSMS } from '../../../shared/integrations/sms.js';
import { addWorkingDays, daysUntilDeadline, formatDate } from '../../../shared/utils/date.js';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

const prisma = new PrismaClient();

// ============================================================================
// TYPES
// ============================================================================

export type TaskType =
  | 'REVIEW_BID'
  | 'SCHEDULE_VISIT'
  | 'REVIEW_CHANGE_ORDER'
  | 'PREPARE_REPORT'
  | 'SCHEDULE_INSPECTION'
  | 'FOLLOW_UP_CLIENT'
  | 'REVIEW_PERMIT'
  | 'BUDGET_REVIEW'
  | 'QUALITY_CHECK'
  | 'MILESTONE_CHECK'
  | 'DOCUMENT_REVIEW'
  | 'GENERAL';

export type TaskPriority = 1 | 2 | 3 | 4 | 5; // 1 = highest

export type TaskStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface TaskDefinition {
  projectId?: string;
  type: TaskType;
  title: string;
  description?: string;
  dueAt: Date;
  priority?: TaskPriority;
  assignedPmId?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  dependencies?: string[];
  estimatedMinutes?: number;
}

export interface PMWorkload {
  pmId: string;
  pmName: string;
  activeTaskCount: number;
  pendingTaskCount: number;
  overdueTaskCount: number;
  totalEstimatedMinutes: number;
  capacityScore: number; // 0-100
}

// Priority weights
const PRIORITY_WEIGHTS = {
  daysUntilDeadline: 0.3,
  clientTier: 0.25,
  projectValue: 0.2,
  taskType: 0.15,
  dependencies: 0.1,
};

const TIER_SCORES: Record<string, number> = {
  PREMIUM: 100,
  ENTERPRISE: 80,
  PROFESSIONAL: 60,
  STARTER: 40,
};

const TYPE_URGENCY: Record<TaskType, number> = {
  SCHEDULE_INSPECTION: 90,
  REVIEW_CHANGE_ORDER: 85,
  REVIEW_PERMIT: 80,
  REVIEW_BID: 75,
  SCHEDULE_VISIT: 70,
  BUDGET_REVIEW: 65,
  PREPARE_REPORT: 60,
  QUALITY_CHECK: 55,
  FOLLOW_UP_CLIENT: 50,
  MILESTONE_CHECK: 45,
  DOCUMENT_REVIEW: 40,
  GENERAL: 30,
};

// ============================================================================
// TASK QUEUE SERVICE
// ============================================================================

class TaskQueueService {
  /**
   * Create a new task
   */
  async createTask(definition: TaskDefinition): Promise<{ id: string; priority: TaskPriority }> {
    // Calculate priority if not provided
    const priority = definition.priority || await this.calculatePriority(definition);

    // Auto-assign PM if not specified
    let assignedPmId = definition.assignedPmId;
    if (!assignedPmId && definition.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: definition.projectId },
        select: { pmId: true },
      });
      assignedPmId = project?.pmId || undefined;
    }

    // If still no PM, find least loaded PM
    if (!assignedPmId) {
      assignedPmId = await this.findLeastLoadedPM();
    }

    const task = await prisma.automationTask.create({
      data: {
        projectId: definition.projectId,
        type: definition.type,
        title: definition.title,
        description: definition.description,
        dueAt: definition.dueAt,
        priority,
        assignedPmId,
        relatedEntityId: definition.relatedEntityId,
        relatedEntityType: definition.relatedEntityType,
        dependencies: definition.dependencies,
        estimatedMinutes: definition.estimatedMinutes || 30,
        status: assignedPmId ? 'ASSIGNED' : 'PENDING',
      } as any,
    });

    // Emit event
    await getEventBus('task-queue').publish(EVENT_TYPES.TASK_CREATED, {
      taskId: task.id,
      projectId: definition.projectId,
      type: definition.type,
      title: definition.title,
      priority,
      assignedPmId,
      dueAt: definition.dueAt,
    });

    // Send notification if assigned
    if (assignedPmId) {
      await this.notifyAssignment(task.id, assignedPmId);
    }

    return { id: task.id, priority };
  }

  /**
   * Calculate task priority
   */
  private async calculatePriority(definition: TaskDefinition): Promise<TaskPriority> {
    let score = 0;

    // Days until deadline (0-100)
    const days = daysUntilDeadline(definition.dueAt);
    const deadlineScore = days <= 0 ? 100 : days <= 1 ? 90 : days <= 3 ? 70 : days <= 7 ? 50 : 30;
    score += deadlineScore * PRIORITY_WEIGHTS.daysUntilDeadline;

    // Client tier
    if (definition.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: definition.projectId },
        include: { client: { select: { subscriptionTier: true } } },
      } as any) as any;
      const tier = project?.client?.subscriptionTier || 'STARTER';
      score += (TIER_SCORES[tier] || 40) * PRIORITY_WEIGHTS.clientTier;

      // Project value
      const budget = Number(project?.budget || 0);
      const valueScore = budget >= 1000000 ? 100 : budget >= 500000 ? 80 : budget >= 100000 ? 60 : 40;
      score += valueScore * PRIORITY_WEIGHTS.projectValue;
    }

    // Task type urgency
    score += TYPE_URGENCY[definition.type] * PRIORITY_WEIGHTS.taskType;

    // Dependencies (more dependencies = higher priority to unblock others)
    const dependentCount = definition.dependencies?.length || 0;
    score += Math.min(dependentCount * 20, 100) * PRIORITY_WEIGHTS.dependencies;

    // Convert score to priority (1-5)
    if (score >= 85) return 1;
    if (score >= 70) return 2;
    if (score >= 55) return 3;
    if (score >= 40) return 4;
    return 5;
  }

  /**
   * Find PM with lowest workload
   */
  private async findLeastLoadedPM(): Promise<string | undefined> {
    const pms = await prisma.user.findMany({
      where: { role: 'PM', status: 'ACTIVE' },
      select: { id: true },
    });

    if (pms.length === 0) return undefined;

    const workloads = await Promise.all(
      pms.map(pm => this.getPMWorkload(pm.id))
    );

    workloads.sort((a, b) => b.capacityScore - a.capacityScore);
    return workloads[0]?.pmId;
  }

  /**
   * Get PM workload
   */
  async getPMWorkload(pmId: string): Promise<PMWorkload> {
    const pm = await prisma.user.findUnique({
      where: { id: pmId },
      select: { name: true },
    });

    const now = new Date();
    const [active, pending, overdue, totalMinutes] = await Promise.all([
      prisma.automationTask.count({
        where: { assignedPmId: pmId, status: 'IN_PROGRESS' },
      }),
      prisma.automationTask.count({
        where: { assignedPmId: pmId, status: { in: ['PENDING', 'ASSIGNED'] } },
      }),
      prisma.automationTask.count({
        where: { assignedPmId: pmId, dueAt: { lt: now }, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      }),
      prisma.automationTask.aggregate({
        where: { assignedPmId: pmId, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
        _sum: { estimatedMinutes: true },
      } as any),
    ]);

    // Capacity: 480 minutes (8 hours) per day capacity
    const minutes = (totalMinutes as any)._sum?.estimatedMinutes || 0;
    const capacityUsed = minutes / 480;
    const capacityScore = Math.max(0, Math.round((1 - capacityUsed) * 100));

    return {
      pmId,
      pmName: pm?.name || 'Unknown',
      activeTaskCount: active,
      pendingTaskCount: pending,
      overdueTaskCount: overdue,
      totalEstimatedMinutes: minutes,
      capacityScore,
    };
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string, result?: object): Promise<void> {
    const task = await prisma.automationTask.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        result: result as object | undefined,
      } as any,
      include: { project: { select: { name: true } } },
    } as any) as any;

    // Emit event
    await getEventBus('task-queue').publish(EVENT_TYPES.TASK_COMPLETED, {
      taskId,
      projectId: task.projectId,
      projectName: task.project?.name,
      type: task.type,
      completedAt: task.completedAt,
    });

    // Check for dependent tasks to unblock
    const dependentTasks = await prisma.automationTask.findMany({
      where: {
        dependencies: { has: taskId },
        status: 'BLOCKED',
      } as any,
    }) as any[];

    for (const dependent of dependentTasks) {
      const deps = (dependent.dependencies as string[]) || [];
      const completedDeps = await prisma.automationTask.count({
        where: {
          id: { in: deps },
          status: 'COMPLETED',
        },
      });

      if (completedDeps === deps.length) {
        await prisma.automationTask.update({
          where: { id: dependent.id },
          data: { status: 'ASSIGNED' },
        });
      }
    }
  }

  /**
   * Check and escalate overdue tasks
   */
  async checkOverdueTasks(): Promise<{ escalated: number }> {
    const now = new Date();
    const overdueTasks = await prisma.automationTask.findMany({
      where: {
        dueAt: { lt: now },
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        escalatedAt: null,
      },
      include: {
        assignedPm: { select: { name: true, email: true, phone: true } },
        project: { select: { name: true } },
      },
    } as any) as any[];

    let escalated = 0;

    for (const task of overdueTasks) {
      const overdueDays = Math.ceil((now.getTime() - new Date(task.dueAt).getTime()) / (1000 * 60 * 60 * 24));

      // Escalate after 1 day overdue
      if (overdueDays >= 1) {
        await prisma.automationTask.update({
          where: { id: task.id },
          data: {
            escalatedAt: now,
            priority: Math.max(1, (Number(task.priority) || 3) - 1) as TaskPriority,
          } as any,
        });

        // Emit event
        await getEventBus('task-queue').publish(EVENT_TYPES.TASK_ESCALATED, {
          taskId: task.id,
          projectId: task.projectId,
          overdueDays,
          assignedPmId: task.assignedPmId,
        });

        // Notify PM
        if (task.assignedPm?.email) {
          await sendEmail({
            to: task.assignedPm.email,
            templateId: EMAIL_TEMPLATES.TASK_OVERDUE,
            dynamicTemplateData: {
              pm_name: task.assignedPm.name,
              task_title: task.title,
              project_name: task.project?.name,
              overdue_days: overdueDays,
              task_link: `${process.env.APP_URL}/tasks/${task.id}`,
            },
          });

          // SMS for high priority
          if (task.priority && Number(task.priority) <= 2 && task.assignedPm.phone) {
            await sendUrgentTaskSMS({
              phone: task.assignedPm.phone,
              task: task.title,
              project: task.project?.name || 'Unknown',
              deadline: formatDate(new Date(task.dueAt)),
            });
          }
        }

        escalated++;
      }
    }

    return { escalated };
  }

  /**
   * Notify PM of task assignment
   */
  private async notifyAssignment(taskId: string, pmId: string): Promise<void> {
    const task = await prisma.automationTask.findUnique({
      where: { id: taskId },
      include: { project: { select: { name: true } } },
    } as any) as any;

    const pm = await prisma.user.findUnique({
      where: { id: pmId },
      select: { name: true, email: true },
    });

    if (pm?.email && task) {
      await sendEmail({
        to: pm.email,
        templateId: EMAIL_TEMPLATES.TASK_ASSIGNED,
        dynamicTemplateData: {
          pm_name: pm.name,
          task_title: task.title,
          task_type: task.type,
          project_name: task.project?.name,
          due_date: formatDate(new Date(task.dueAt)),
          priority: task.priority,
          task_link: `${process.env.APP_URL}/tasks/${taskId}`,
        },
      });

      await getEventBus('task-queue').publish(EVENT_TYPES.TASK_ASSIGNED, {
        taskId,
        pmId,
        pmName: pm.name,
      });
    }
  }

  /**
   * Auto-create tasks from events
   */
  async handleEvent(event: KealeeEvent): Promise<void> {
    const eventData = event.data as any;
    switch (event.type) {
      case EVENT_TYPES.PROJECT_CREATED:
        await this.createTask({
          projectId: eventData.projectId,
          type: 'SCHEDULE_VISIT',
          title: `Schedule kickoff visit for ${eventData.projectName}`,
          dueAt: addWorkingDays(new Date(), 3),
          priority: 2,
        });
        break;

      case EVENT_TYPES.BID_ANALYSIS_COMPLETE:
        await this.createTask({
          projectId: eventData.projectId,
          type: 'REVIEW_BID',
          title: `Review bid analysis for ${eventData.projectName}`,
          description: `${eventData.totalBids} bids received. Recommended: ${eventData.recommendedContractor}`,
          dueAt: addWorkingDays(new Date(), 2),
          priority: 2,
          relatedEntityId: eventData.bidRequestId,
          relatedEntityType: 'BID_REQUEST',
        });
        break;

      case EVENT_TYPES.CHANGE_ORDER_CREATED:
        await this.createTask({
          projectId: eventData.projectId,
          type: 'REVIEW_CHANGE_ORDER',
          title: `Review Change Order #${eventData.number}`,
          dueAt: addWorkingDays(new Date(), 2),
          priority: 2,
          relatedEntityId: eventData.changeOrderId,
          relatedEntityType: 'CHANGE_ORDER',
        });
        break;

      case EVENT_TYPES.INSPECTION_SCHEDULED:
        await this.createTask({
          projectId: eventData.projectId,
          type: 'SCHEDULE_INSPECTION',
          title: `Prepare for ${eventData.inspectionType} inspection`,
          dueAt: addWorkingDays(new Date(eventData.scheduledAt), -1),
          priority: 1,
          relatedEntityId: eventData.inspectionId,
          relatedEntityType: 'INSPECTION',
        });
        break;

      case EVENT_TYPES.PERMIT_COMMENTS_RECEIVED:
        await this.createTask({
          projectId: eventData.projectId,
          type: 'REVIEW_PERMIT',
          title: `Review permit comments`,
          dueAt: addWorkingDays(new Date(), 3),
          priority: 2,
          relatedEntityId: eventData.permitId,
          relatedEntityType: 'PERMIT',
        });
        break;
    }
  }
}

// ============================================================================
// WORKER
// ============================================================================

const service = new TaskQueueService();

type TaskQueueJob =
  | { type: 'CREATE_TASK'; definition: TaskDefinition }
  | { type: 'COMPLETE_TASK'; taskId: string; result?: object }
  | { type: 'CHECK_OVERDUE' }
  | { type: 'GET_WORKLOAD'; pmId: string }
  | { type: 'REBALANCE_WORKLOADS' };

async function processTaskQueueJob(job: Job<TaskQueueJob>): Promise<unknown> {
  console.log(`[TaskQueue] Processing job: ${job.data.type} (${job.id})`);

  switch (job.data.type) {
    case 'CREATE_TASK':
      return service.createTask(job.data.definition);

    case 'COMPLETE_TASK':
      await service.completeTask(job.data.taskId, job.data.result);
      return { completed: true };

    case 'CHECK_OVERDUE':
      return service.checkOverdueTasks();

    case 'GET_WORKLOAD':
      return service.getPMWorkload(job.data.pmId);

    case 'REBALANCE_WORKLOADS':
      // TODO: Implement workload rebalancing
      return { rebalanced: false };

    default:
      throw new Error(`Unknown job type`);
  }
}

export const taskQueueWorker = createWorker(
  QUEUE_NAMES.TASK_QUEUE,
  processTaskQueueJob,
  { concurrency: 10 }
);

// Subscribe to events for auto-task creation
const eventBus = getEventBus('task-queue');
eventBus.subscribe('*', async (event) => {
  await service.handleEvent(event);
});

// ============================================================================
// API ROUTES
// ============================================================================

export async function taskQueueRoutes(fastify: FastifyInstance) {
  fastify.post('/tasks', async (request: FastifyRequest) => {
    const definition = request.body as TaskDefinition;
    return service.createTask(definition);
  });

  fastify.get('/tasks', async (request: FastifyRequest) => {
    const { pmId, status, priority } = request.query as {
      pmId?: string;
      status?: string;
      priority?: string;
    };

    return prisma.automationTask.findMany({
      where: {
        ...(pmId && { assignedPmId: pmId }),
        ...(status && { status }),
        ...(priority && { priority: parseInt(priority) }),
      },
      include: {
        project: { select: { name: true } },
        assignedPm: { select: { name: true } },
      },
      orderBy: [{ priority: 'asc' }, { dueAt: 'asc' }],
    } as any);
  });

  fastify.post('/tasks/:id/complete', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const { result } = request.body as { result?: object };
    await service.completeTask(id, result);
    return { completed: true };
  });

  fastify.get('/tasks/workload/:pmId', async (request: FastifyRequest) => {
    const { pmId } = request.params as { pmId: string };
    return service.getPMWorkload(pmId);
  });

  fastify.post('/tasks/check-overdue', async () => {
    return service.checkOverdueTasks();
  });
}

export { TaskQueueService };
