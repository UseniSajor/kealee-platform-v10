import { createQueue, addJob, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';
import { CommunicationHubService } from './communication-hub.service.js';

export { CommunicationHubService } from './communication-hub.service.js';
export { communicationHubWorker } from './communication-hub.worker.js';

export const communicationHubQueue = createQueue(QUEUE_NAMES.COMMUNICATION);
export const communicationHubService = new CommunicationHubService();

/**
 * Register event subscriptions for the Communication Hub.
 *
 * Each subscription maps an event type to a template-based notification job.
 * The worker picks up 'send-template' jobs and uses CommunicationHubService
 * to resolve templates, audience, and deliver via the appropriate channels.
 */
export function registerCommunicationHubEvents(): void {
  // 1. user.signed_up → welcome email
  eventBus.subscribe(EVENT_TYPES.USER_SIGNED_UP, async (event) => {
    if (event.userId) {
      await addJob(communicationHubQueue, 'send-notification', {
        userId: event.userId,
        type: 'welcome',
        title: 'Welcome to Kealee!',
        body: 'Your account has been created. Get started by setting up your first project.',
        channels: ['email', 'in_app'],
      });
    }
  });

  // 2. bid.submitted → notify client (project owner / PM)
  eventBus.subscribe(EVENT_TYPES.BID_SUBMITTED, async (event) => {
    if (event.projectId) {
      await addJob(communicationHubQueue, 'send-template', {
        templateName: 'bid_submitted',
        projectId: event.projectId,
        audience: 'pm' as const,
        variables: {
          contractor_name: event.data.contractorName ?? 'A contractor',
          bid_amount: event.data.bidAmount ?? 'N/A',
          project_name: event.data.projectName ?? '',
        },
      });
    }
  });

  // 3. bid.accepted → notify contractor
  eventBus.subscribe(EVENT_TYPES.BID_ACCEPTED, async (event) => {
    if (event.projectId) {
      await addJob(communicationHubQueue, 'send-template', {
        templateName: 'bid_accepted',
        projectId: event.projectId,
        audience: 'contractor' as const,
        variables: {
          project_name: event.data.projectName ?? '',
          contractor_name: event.data.contractorName ?? '',
        },
      });
    }
  });

  // 4. contract.signed → notify all parties
  eventBus.subscribe(EVENT_TYPES.CONTRACT_SIGNED, async (event) => {
    if (event.projectId) {
      await addJob(communicationHubQueue, 'send-template', {
        templateName: 'contract_signed',
        projectId: event.projectId,
        audience: 'all' as const,
        variables: {
          project_name: event.data.projectName ?? '',
          contract_number: event.data.contractNumber ?? '',
        },
      });
    }
  });

  // 5. escrow.funded → notify contractor
  eventBus.subscribe(EVENT_TYPES.ESCROW_FUNDED, async (event) => {
    if (event.projectId) {
      await addJob(communicationHubQueue, 'send-template', {
        templateName: 'escrow_funded',
        projectId: event.projectId,
        audience: 'contractor' as const,
        variables: {
          project_name: event.data.projectName ?? '',
          amount: event.data.amount ?? '',
          milestone_name: event.data.milestoneName ?? '',
        },
      });
    }
  });

  // 6. project.milestone.completed → notify client
  eventBus.subscribe(EVENT_TYPES.MILESTONE_COMPLETED, async (event) => {
    if (event.projectId) {
      await addJob(communicationHubQueue, 'send-template', {
        templateName: 'milestone_completed',
        projectId: event.projectId,
        audience: 'client' as const,
        variables: {
          project_name: event.data.projectName ?? '',
          milestone_name: event.data.milestoneName ?? '',
        },
      });
    }
  });

  // 7. inspection.passed → notify client
  eventBus.subscribe(EVENT_TYPES.INSPECTION_PASSED, async (event) => {
    if (event.projectId) {
      await addJob(communicationHubQueue, 'send-template', {
        templateName: 'inspection_passed',
        projectId: event.projectId,
        audience: 'client' as const,
        variables: {
          project_name: event.data.projectName ?? '',
          inspection_type: event.data.inspectionType ?? 'Inspection',
        },
      });
    }
  });

  // 8. inspection.failed → notify contractor
  eventBus.subscribe(EVENT_TYPES.INSPECTION_FAILED, async (event) => {
    if (event.projectId) {
      await addJob(communicationHubQueue, 'send-template', {
        templateName: 'inspection_failed',
        projectId: event.projectId,
        audience: 'contractor' as const,
        variables: {
          project_name: event.data.projectName ?? '',
          inspection_type: event.data.inspectionType ?? 'Inspection',
          failure_reason: event.data.reason ?? '',
        },
      });
    }
  });

  // 9. payment.released → notify contractor
  eventBus.subscribe(EVENT_TYPES.PAYMENT_RELEASED, async (event) => {
    if (event.projectId) {
      await addJob(communicationHubQueue, 'send-template', {
        templateName: 'payment_released',
        projectId: event.projectId,
        audience: 'contractor' as const,
        variables: {
          project_name: event.data.projectName ?? '',
          amount: event.data.amount ?? '',
          milestone_name: event.data.milestoneName ?? '',
        },
      });
    }
  });

  // 10. budget.overrun_detected → alert PM
  eventBus.subscribe(EVENT_TYPES.BUDGET_OVERRUN_DETECTED, async (event) => {
    if (event.projectId) {
      await addJob(communicationHubQueue, 'send-template', {
        templateName: 'budget_overrun',
        projectId: event.projectId,
        audience: 'pm' as const,
        variables: {
          project_name: event.data.projectName ?? '',
          category: event.data.category ?? '',
          overrun_amount: event.data.overrunAmount ?? '',
          alert_level: event.data.alertLevel ?? 'WARNING',
        },
      });
    }
  });

  // 11. qa.issue_detected → notify PM + contractor
  eventBus.subscribe(EVENT_TYPES.QA_ISSUE_DETECTED, async (event) => {
    if (event.projectId) {
      // Notify PM
      await addJob(communicationHubQueue, 'send-template', {
        templateName: 'qa_issue_pm',
        projectId: event.projectId,
        audience: 'pm' as const,
        variables: {
          project_name: event.data.projectName ?? '',
          issue_summary: event.data.issueSummary ?? '',
          severity: event.data.severity ?? '',
        },
      });
      // Notify contractor
      await addJob(communicationHubQueue, 'send-template', {
        templateName: 'qa_issue_contractor',
        projectId: event.projectId,
        audience: 'contractor' as const,
        variables: {
          project_name: event.data.projectName ?? '',
          issue_summary: event.data.issueSummary ?? '',
          severity: event.data.severity ?? '',
        },
      });
    }
  });

  // 12. schedule.disruption → notify PM
  eventBus.subscribe(EVENT_TYPES.SCHEDULE_DISRUPTION, async (event) => {
    if (event.projectId) {
      await addJob(communicationHubQueue, 'send-template', {
        templateName: 'schedule_disruption',
        projectId: event.projectId,
        audience: 'pm' as const,
        variables: {
          project_name: event.data.projectName ?? '',
          disruption_type: event.data.disruptionType ?? '',
          impact_days: event.data.impactDays ?? '',
        },
      });
    }
  });

  // 13. change_order.requested → notify approver (PM)
  eventBus.subscribe(EVENT_TYPES.CHANGE_ORDER_REQUESTED, async (event) => {
    if (event.projectId) {
      await addJob(communicationHubQueue, 'send-template', {
        templateName: 'change_order_requested',
        projectId: event.projectId,
        audience: 'pm' as const,
        variables: {
          project_name: event.data.projectName ?? '',
          co_number: event.data.changeOrderNumber ?? '',
          co_title: event.data.title ?? '',
          co_amount: event.data.amount ?? '',
        },
      });
    }
  });

  // 14. decision.needed → notify decision maker (PM)
  eventBus.subscribe(EVENT_TYPES.DECISION_NEEDED, async (event) => {
    if (event.projectId) {
      await addJob(communicationHubQueue, 'send-template', {
        templateName: 'decision_needed',
        projectId: event.projectId,
        audience: 'pm' as const,
        variables: {
          project_name: event.data.projectName ?? '',
          decision_type: event.data.type ?? '',
          description: event.data.description ?? 'A decision requires your attention.',
        },
      });
    }
  });

  // 15. subscription.created → confirmation email
  eventBus.subscribe(EVENT_TYPES.SUBSCRIPTION_CREATED, async (event) => {
    if (event.userId) {
      await addJob(communicationHubQueue, 'send-notification', {
        userId: event.userId,
        type: 'subscription_confirmation',
        title: 'Subscription Confirmed',
        body: 'Your Kealee subscription is now active. Thank you for choosing Kealee!',
        channels: ['email', 'in_app'],
      });
    }
  });

  // 16. document.generated → notify recipient
  eventBus.subscribe(EVENT_TYPES.DOCUMENT_GENERATED, async (event) => {
    if (event.projectId) {
      await addJob(communicationHubQueue, 'send-template', {
        templateName: 'document_generated',
        projectId: event.projectId,
        audience: 'pm' as const,
        variables: {
          project_name: event.data.projectName ?? '',
          document_type: event.data.type ?? 'document',
          document_id: event.data.reportId ?? event.data.documentId ?? '',
        },
      });
    }
  });

  // 17. project.completed → notify all parties
  eventBus.subscribe(EVENT_TYPES.PROJECT_COMPLETED, async (event) => {
    if (event.projectId) {
      await addJob(communicationHubQueue, 'send-template', {
        templateName: 'project_completed',
        projectId: event.projectId,
        audience: 'all' as const,
        variables: {
          project_name: event.data.projectName ?? '',
        },
      });
    }
  });

  console.log('[CommunicationHub] Event subscriptions registered (17 events)');
}
