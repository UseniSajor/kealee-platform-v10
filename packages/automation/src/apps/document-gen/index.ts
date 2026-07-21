import { createQueue, addJob, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';
import { DocumentGeneratorService } from './document-gen.service.js';

export { DocumentGeneratorService } from './document-gen.service.js';
export { documentGenWorker } from './document-gen.worker.js';

export const documentGenQueue = createQueue(QUEUE_NAMES.DOCUMENT_GEN);
export const documentGenService = new DocumentGeneratorService();

/**
 * Register event subscriptions for the Document Generator.
 */
export function registerDocumentGenEvents(): void {
  // bid.accepted → generate contract from winning bid
  eventBus.subscribe(EVENT_TYPES.BID_ACCEPTED, async (event) => {
    if (event.data.bidId && event.data.leadId) {
      await addJob(documentGenQueue, 'generate-contract', {
        bidId: event.data.bidId,
        leadId: event.data.leadId,
      });
    }
  });

  // project.milestone.completed → generate invoice for milestone payment
  eventBus.subscribe(EVENT_TYPES.MILESTONE_COMPLETED, async (event) => {
    if (event.projectId && event.data.milestoneId) {
      await addJob(documentGenQueue, 'generate-invoice', {
        projectId: event.projectId,
        milestoneId: event.data.milestoneId,
      });
    }
  });

  // qa.issue_detected (HIGH severity) → generate punch list
  eventBus.subscribe(EVENT_TYPES.QA_ISSUE_DETECTED, async (event) => {
    const severity = event.data.severity;
    if (
      event.projectId &&
      (severity === 'HIGH' || severity === 'CRITICAL') &&
      event.data.qaResultIds
    ) {
      await addJob(documentGenQueue, 'generate-punch-list', {
        projectId: event.projectId,
        qaResultIds: event.data.qaResultIds,
      });
    }
  });

  // project.completed → generate closeout package document
  eventBus.subscribe(EVENT_TYPES.PROJECT_COMPLETED, async (event) => {
    if (event.projectId) {
      await addJob(documentGenQueue, 'generate-closeout', {
        projectId: event.projectId,
      });
    }
  });

  // change_order.approved → generate change order document
  eventBus.subscribe(EVENT_TYPES.CHANGE_ORDER_APPROVED, async (event) => {
    if (event.data.changeOrderId) {
      await addJob(documentGenQueue, 'generate-change-order-doc', {
        changeOrderId: event.data.changeOrderId,
      });
    }
  });

  console.log('[DocumentGen] Event subscriptions registered');
}
