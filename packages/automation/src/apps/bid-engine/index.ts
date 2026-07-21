import { createQueue } from '../../infrastructure/queues.js';
import { addJob } from '../../infrastructure/queues.js';
import { QUEUE_NAMES } from '../../infrastructure/queues.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';
import { BidEngineService } from './bid-engine.service.js';

export { BidEngineService } from './bid-engine.service.js';
export { bidEngineWorker } from './bid-engine.worker.js';

export const bidEngineQueue = createQueue(QUEUE_NAMES.BID_ENGINE);
export const bidEngineService = new BidEngineService();

/**
 * Register event subscriptions for the Bid Engine.
 * Call this once during application startup.
 */
export function registerBidEngineEvents(): void {
  // When a new lead is created, match contractors
  eventBus.subscribe(EVENT_TYPES.LEAD_CREATED, async (event) => {
    await addJob(bidEngineQueue, 'match-contractors', {
      leadId: event.data.leadId,
      projectId: event.projectId,
    });
  });

  // When a bid is submitted, score it
  eventBus.subscribe(EVENT_TYPES.BID_SUBMITTED, async (event) => {
    await addJob(bidEngineQueue, 'score-bid', {
      bidId: event.data.bidId,
    });
  });

  // When bid deadline is reached, evaluate all bids
  eventBus.subscribe(EVENT_TYPES.BID_DEADLINE_REACHED, async (event) => {
    await addJob(bidEngineQueue, 'evaluate-all', {
      evaluationId: event.data.evaluationId,
    });
  });

  console.log('[BidEngine] Event subscriptions registered');
}
