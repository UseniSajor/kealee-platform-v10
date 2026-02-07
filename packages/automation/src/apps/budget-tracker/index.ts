import { createQueue, addJob, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';
import { BudgetTrackerService } from './budget-tracker.service.js';

export { BudgetTrackerService } from './budget-tracker.service.js';
export { budgetTrackerWorker } from './budget-tracker.worker.js';

export const budgetTrackerQueue = createQueue(QUEUE_NAMES.BUDGET_TRACKER);
export const budgetTrackerService = new BudgetTrackerService();

/**
 * Register event subscriptions for the Budget Tracker.
 */
export function registerBudgetTrackerEvents(): void {
  // Receipt uploaded → process receipt
  eventBus.subscribe(EVENT_TYPES.RECEIPT_UPLOADED, async (event) => {
    if (event.projectId) {
      await addJob(budgetTrackerQueue, 'process-receipt', {
        projectId: event.projectId,
        fileUrl: event.data.fileUrl,
        documentId: event.data.documentId,
      });
    }
  });

  // Payment released → process payment
  eventBus.subscribe(EVENT_TYPES.PAYMENT_RELEASED, async (event) => {
    if (event.data.paymentId) {
      await addJob(budgetTrackerQueue, 'process-payment', {
        paymentId: event.data.paymentId,
      });
    }
  });

  // Change order approved → recalculate snapshot
  eventBus.subscribe(EVENT_TYPES.CHANGE_ORDER_APPROVED, async (event) => {
    if (event.projectId) {
      await addJob(budgetTrackerQueue, 'create-snapshot', {
        projectId: event.projectId,
      });
    }
  });

  // Daily cron: create snapshots for all active projects (midnight)
  budgetTrackerQueue.add(
    'daily-snapshots',
    {},
    {
      repeat: { pattern: '0 0 * * *' }, // Daily at midnight
    },
  ).catch((err) => {
    console.error('[BudgetTracker] Failed to add cron job:', err.message);
  });

  console.log('[BudgetTracker] Event subscriptions registered');
}
