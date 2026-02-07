import { createQueue, QUEUE_NAMES } from '../../infrastructure/queues.js';
import { eventBus } from '../../infrastructure/event-bus.js';
import { EVENT_TYPES } from '../../infrastructure/event-types.js';
import { DecisionSupportService } from './decision-support.service.js';

export { DecisionSupportService } from './decision-support.service.js';
export { decisionSupportWorker } from './decision-support.worker.js';

export const decisionSupportQueue = createQueue(QUEUE_NAMES.DECISION_SUPPORT);
export const decisionSupportService = new DecisionSupportService();

/**
 * Register event subscriptions for the Decision Support agent.
 *
 * This app is primarily CALLED BY other apps rather than event-driven.
 * Other apps call decisionSupportService.createDecision() directly:
 *   - APP-01 (Bid Engine) → createDecision(type: 'bid_award')
 *   - APP-03 (Change Order) → createDecision(type: 'change_order')
 *   - APP-06 (Inspection Coord) → createDecision(type: 'payment_release')
 *   - APP-12 (Smart Scheduler) → createDecision(type: 'schedule_change')
 *
 * The event subscriptions here are for logging and audit purposes.
 */
export function registerDecisionSupportEvents(): void {
  // decision.needed → log for audit (decisions are created by other apps)
  eventBus.subscribe(EVENT_TYPES.DECISION_NEEDED, async (event) => {
    console.log(
      `[DecisionSupport] Decision needed: ${event.data.type} — ${event.data.title ?? 'Untitled'}` +
        (event.projectId ? ` (project: ${event.projectId})` : ''),
    );
  });

  // decision.made → log resolution for audit
  eventBus.subscribe(EVENT_TYPES.DECISION_MADE, async (event) => {
    console.log(
      `[DecisionSupport] Decision made: ${event.data.type} → ${event.data.decision}` +
        ` by ${event.data.decidedBy ?? 'unknown'}` +
        (event.projectId ? ` (project: ${event.projectId})` : ''),
    );
  });

  console.log('[DecisionSupport] Event subscriptions registered');
}
