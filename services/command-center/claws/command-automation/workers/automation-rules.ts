import type { PrismaClient } from '@prisma/client';
import type { EventBus, KealeeEventEnvelope } from '@kealee/events';
import { createEvent } from '@kealee/events';
import { KEALEE_QUEUES, createQueue } from '@kealee/queue';
import type { ClawConfig } from '../../base-claw';

// ---------------------------------------------------------------------------
// Automation Rule Definitions
// ---------------------------------------------------------------------------

interface AutomationRule {
  /** Unique rule identifier */
  id: string;
  /** Event type that triggers this rule */
  eventType: string;
  /** Task to create when the rule matches */
  task: {
    type: string;
    title: string;
    description: string;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    assignTo: 'PM' | 'OWNER' | 'INSPECTOR' | 'CONTRACTOR';
    dueDays: number;
    sourceApp: string | null;
  };
  /** Whether to also send a notification */
  notify: boolean;
  /** Notification recipients (role-based) */
  notifyRoles: string[];
}

/**
 * Built-in automation rules per architecture doc SS13.3.
 * These fire deterministically -- no AI needed.
 *
 * GUARDRAILS:
 * - Cannot make domain decisions
 * - Cannot override claw guardrails
 * - Cannot directly write to domain-owned models
 */
const AUTOMATION_RULES: AutomationRule[] = [
  // -------------------------------------------------------------------------
  // Rule 1: Failed compliance inspection -> schedule re-inspection
  // -------------------------------------------------------------------------
  {
    id: 'RULE-001',
    eventType: 'inspection.failed.compliance',
    task: {
      type: 'REINSPECTION',
      title: 'Schedule re-inspection',
      description:
        'A compliance inspection has failed. Schedule a re-inspection after the cited ' +
        'issues have been addressed. Review the inspection findings and ensure all ' +
        'corrective actions are documented before requesting re-inspection.',
      priority: 'HIGH',
      assignTo: 'PM',
      dueDays: 3,
      sourceApp: 'APP-09',
    },
    notify: true,
    notifyRoles: ['PM', 'INSPECTOR'],
  },

  // -------------------------------------------------------------------------
  // Rule 2: High budget variance -> review budget
  // -------------------------------------------------------------------------
  {
    id: 'RULE-002',
    eventType: 'budget.alert.variance.high',
    task: {
      type: 'BUDGET_REVIEW',
      title: 'Review budget variance',
      description:
        'Budget variance has exceeded the acceptable threshold. Review current spend ' +
        'against the approved budget, identify contributing factors, and recommend ' +
        'corrective actions or change orders if needed.',
      priority: 'HIGH',
      assignTo: 'PM',
      dueDays: 2,
      sourceApp: 'APP-04',
    },
    notify: true,
    notifyRoles: ['PM', 'OWNER'],
  },

  // -------------------------------------------------------------------------
  // Rule 3: Permit expiring -> renew permit
  // -------------------------------------------------------------------------
  {
    id: 'RULE-003',
    eventType: 'permit.expiring',
    task: {
      type: 'PERMIT_RENEWAL',
      title: 'Renew permit',
      description:
        'A permit is approaching its expiration date. Initiate the renewal process ' +
        'immediately to avoid work stoppages. Verify all required documentation is ' +
        'current and submit the renewal application to the jurisdiction.',
      priority: 'URGENT',
      assignTo: 'PM',
      dueDays: 1,
      sourceApp: 'APP-09',
    },
    notify: true,
    notifyRoles: ['PM'],
  },

  // -------------------------------------------------------------------------
  // Rule 4: Site visit completed -> upload visit report
  // -------------------------------------------------------------------------
  {
    id: 'RULE-004',
    eventType: 'sitevisit.completed',
    task: {
      type: 'VISIT_REPORT',
      title: 'Upload visit report',
      description:
        'A site visit has been completed. Upload the visit report including photos, ' +
        'observations, and any issues identified during the visit. Update the visit ' +
        'checklist status in the system.',
      priority: 'NORMAL',
      assignTo: 'PM',
      dueDays: 1,
      sourceApp: 'APP-12',
    },
    notify: false,
    notifyRoles: [],
  },
];

/**
 * Evaluate automation rules against an incoming event.
 *
 * Returns matching rules for the given event type.
 * Deterministic -- no AI involvement.
 */
export function evaluateRules(eventType: string): AutomationRule[] {
  return AUTOMATION_RULES.filter((rule) => rule.eventType === eventType);
}

/**
 * Execute matched automation rules -- create tasks and notifications.
 *
 * Called by the CommandAutomationClaw index after rule evaluation.
 *
 * GUARDRAILS:
 * - Only writes to AutomationTask, Notification, Alert (owned by Claw H)
 * - Cannot make domain decisions
 * - Cannot override claw guardrails
 * - Cannot directly write to domain-owned models
 */
export async function executeRules(
  matchedRules: AutomationRule[],
  event: KealeeEventEnvelope,
  prisma: PrismaClient,
  eventBus: EventBus,
  config: ClawConfig,
  assertWritable: (model: string) => void,
): Promise<void> {
  for (const rule of matchedRules) {
    // Create automation task
    assertWritable('AutomationTask');

    const dueAt = new Date(Date.now() + rule.task.dueDays * 86_400_000);

    const task = await prisma.automationTask.create({
      data: {
        type: rule.task.type,
        status: 'PENDING',
        priority: rule.task.priority,
        projectId: event.projectId ?? null,
        sourceApp: rule.task.sourceApp,
        payload: {
          title: rule.task.title,
          description: rule.task.description,
          assignTo: rule.task.assignTo,
          ruleId: rule.id,
          triggerEvent: event.type,
          triggerEventId: event.id,
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
        type: rule.task.type,
        title: rule.task.title,
        priority: rule.task.priority,
        assignTo: rule.task.assignTo,
        ruleId: rule.id,
      },
      entity: { type: 'AutomationTask', id: task.id },
      trigger: { eventId: event.id, eventType: event.type },
    });
    await eventBus.publish(taskEvent);

    // Send notifications if configured
    if (rule.notify && rule.notifyRoles.length > 0 && event.projectId) {
      assertWritable('Notification');

      // Find users with matching roles on this project
      const projectMembers = await prisma.projectMember.findMany({
        where: {
          projectId: event.projectId,
          role: { in: rule.notifyRoles },
        },
        select: { userId: true, role: true },
      });

      for (const member of projectMembers) {
        await prisma.notification.create({
          data: {
            userId: member.userId,
            type: `AUTOMATION_${rule.task.type}`,
            title: rule.task.title,
            message: rule.task.description,
            channels: ['push', 'email'],
            status: 'PENDING',
            data: {
              taskId: task.id,
              ruleId: rule.id,
              projectId: event.projectId,
              priority: rule.task.priority,
            },
          },
        });
      }
    }
  }
}

// Export rules for testing and introspection
export { AUTOMATION_RULES, type AutomationRule };
