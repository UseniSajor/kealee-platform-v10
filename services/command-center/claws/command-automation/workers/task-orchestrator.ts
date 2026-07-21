import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';
import { createEvent } from '@kealee/events';
import { KEALEE_QUEUES, createQueue, createWorker } from '@kealee/queue';
import { AIProvider } from '@kealee/ai';
import type { ClawConfig } from '../../base-claw';
import { TASK_PRIORITIZATION_PROMPT } from '../ai/prompts';
import type { Job } from 'bullmq';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TaskSuggestion {
  shouldCreateTask: boolean;
  task?: {
    type: string;
    title: string;
    description: string;
    priority: string;
    assignTo: string;
    dueDays: number;
    sourceApp: string;
  };
  reasoning: string;
}

/**
 * Task Orchestrator Worker
 *
 * Responsibilities:
 * - Log ALL events to ActivityLog
 * - Evaluate automation rules for follow-up tasks
 * - Create follow-up tasks when rules match
 * - Hourly overdue task check
 *
 * GUARDRAILS:
 * - Cannot make domain decisions
 * - Cannot override claw guardrails
 * - Cannot directly write to domain-owned models
 */
export function registerTaskOrchestratorWorker(
  prisma: PrismaClient,
  eventBus: EventBus,
  config: ClawConfig,
  ai: AIProvider,
  assertWritable: (model: string) => void,
): void {

  createWorker(KEALEE_QUEUES.TASK_ORCHESTRATOR, async (job: Job) => {
    switch (job.name) {
      case 'log-event':
        await handleLogEvent(job);
        break;
      case 'evaluate-automation':
        await handleEvaluateAutomation(job);
        break;
      case 'check-overdue':
        await handleCheckOverdue(job);
        break;
    }
  });

  // -------------------------------------------------------------------------
  // Log Event -- persist ALL domain events to ActivityLog
  // -------------------------------------------------------------------------

  async function handleLogEvent(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };

    assertWritable('ActivityLog');

    // Determine category from event type prefix
    const category = extractCategory(event.type);

    await prisma.activityLog.create({
      data: {
        projectId: event.projectId ?? null,
        userId: (event.payload as any)?.userId ?? null,
        action: event.type,
        category,
        entityType: (event as any).entity?.type ?? null,
        entityId: (event as any).entity?.id ?? null,
        description: `Event ${event.type} from ${event.source}`,
        metadata: {
          eventId: event.id,
          source: event.source,
          payload: event.payload,
          timestamp: event.timestamp ?? new Date().toISOString(),
          hopCount: event.metadata?.hopCount ?? 0,
        },
      },
    });
  }

  // -------------------------------------------------------------------------
  // Evaluate Automation -- AI-powered task creation for unmatched events
  // -------------------------------------------------------------------------

  async function handleEvaluateAutomation(job: Job): Promise<void> {
    const { event } = job.data as { event: KealeeEventEnvelope };
    if (!event.projectId) return;

    assertWritable('AutomationTask');

    // Get project context for AI evaluation
    const project = await prisma.project.findUnique({
      where: { id: event.projectId },
      select: { name: true, status: true },
    });

    // Use AI to evaluate whether a task should be created
    const aiResult = await ai.reason({
      task: `Evaluate this event and determine if a follow-up task should be created.`,
      context: {
        eventType: event.type,
        eventSource: event.source,
        projectName: project?.name ?? 'Unknown',
        projectStatus: project?.status ?? 'Unknown',
        payload: event.payload,
      },
      systemPrompt: TASK_PRIORITIZATION_PROMPT,
    });

    const suggestion = aiResult as unknown as TaskSuggestion;
    if (!suggestion?.shouldCreateTask || !suggestion.task) return;

    // Create the automation task
    const dueAt = suggestion.task.dueDays
      ? new Date(Date.now() + suggestion.task.dueDays * 86_400_000)
      : null;

    const task = await prisma.automationTask.create({
      data: {
        type: suggestion.task.type || event.type,
        status: 'PENDING',
        priority: suggestion.task.priority || 'NORMAL',
        projectId: event.projectId,
        sourceApp: suggestion.task.sourceApp ?? null,
        payload: {
          title: suggestion.task.title,
          description: suggestion.task.description,
          assignTo: suggestion.task.assignTo,
          triggerEvent: event.type,
          aiReasoning: suggestion.reasoning,
        },
        dueAt,
      },
    });

    // Publish task.created event
    const taskEvent = createEvent({
      type: 'task.created',
      source: config.name,
      projectId: event.projectId,
      organizationId: event.organizationId,
      payload: {
        taskId: task.id,
        type: suggestion.task.type,
        title: suggestion.task.title,
        priority: suggestion.task.priority,
        assignTo: suggestion.task.assignTo,
      },
      entity: { type: 'AutomationTask', id: task.id },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await eventBus.publish(taskEvent);
  }

  // -------------------------------------------------------------------------
  // Check Overdue -- hourly scan for overdue tasks
  // -------------------------------------------------------------------------

  async function handleCheckOverdue(_job: Job): Promise<void> {
    assertWritable('AutomationTask');
    assertWritable('Notification');
    assertWritable('Alert');

    const now = new Date();

    // Find overdue tasks
    const overdueTasks = await prisma.automationTask.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueAt: { lt: now },
      },
      include: {
        project: { select: { name: true, organizationId: true } },
      },
    });

    if (overdueTasks.length === 0) return;

    // Group by project for batch notification
    const byProject = new Map<string, typeof overdueTasks>();
    for (const task of overdueTasks) {
      const key = task.projectId ?? 'unassigned';
      if (!byProject.has(key)) byProject.set(key, []);
      byProject.get(key)!.push(task);
    }

    for (const [projectId, tasks] of byProject) {
      // Update tasks to mark them as overdue in metadata
      for (const task of tasks) {
        await prisma.automationTask.update({
          where: { id: task.id },
          data: {
            payload: {
              ...(task.payload as Record<string, unknown> ?? {}),
              isOverdue: true,
              overdueCheckedAt: now.toISOString(),
            },
          },
        });
      }

      // Create alert for overdue tasks
      const urgentCount = tasks.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length;
      const alertLevel = urgentCount > 0 ? 'WARNING' : 'INFO';

      await prisma.alert.create({
        data: {
          level: alertLevel,
          source: config.name,
          title: `${tasks.length} overdue task(s)`,
          message:
            `Project ${(tasks[0] as any).project?.name ?? projectId} has ${tasks.length} overdue tasks ` +
            `(${urgentCount} urgent/high priority).`,
          data: {
            projectId: projectId !== 'unassigned' ? projectId : null,
            taskIds: tasks.map((t) => t.id),
            urgentCount,
          },
        },
      });

      // Publish system alert event
      if (projectId !== 'unassigned') {
        const alertEvent = createEvent({
          type: 'system.alert',
          source: config.name,
          projectId,
          organizationId: (tasks[0] as any).project?.organizationId ?? null,
          payload: {
            alertType: 'OVERDUE_TASKS',
            taskCount: tasks.length,
            urgentCount,
          },
        });
        await eventBus.publish(alertEvent);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function extractCategory(eventType: string): string {
    const prefix = eventType.split('.')[0];
    const categoryMap: Record<string, string> = {
      estimate: 'ESTIMATION',
      bid: 'BIDDING',
      contract: 'CONTRACTS',
      changeorder: 'CHANGE_ORDERS',
      payment: 'PAYMENTS',
      schedule: 'SCHEDULING',
      sitevisit: 'FIELD_OPS',
      budget: 'BUDGET',
      permit: 'PERMITS',
      inspection: 'INSPECTIONS',
      compliance: 'COMPLIANCE',
      document: 'DOCUMENTS',
      communication: 'COMMUNICATION',
      prediction: 'RISK',
      risk: 'RISK',
      decision: 'DECISIONS',
      task: 'AUTOMATION',
      system: 'SYSTEM',
    };
    return categoryMap[prefix] ?? 'GENERAL';
  }
}
