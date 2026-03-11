/**
 * Twin Event Hooks — barrel export
 *
 * All hook functions are designed as fire-and-forget:
 *  - They are async but swallow all errors internally
 *  - They should be called at the END of a service method
 *  - They never throw, so callers can safely `void` the promise
 *
 * Usage pattern in a service:
 *
 *   import { TwinEventEmitter } from '@kealee/core-ddts';
 *   import { StreamPublisher } from '@kealee/core-events';
 *   import { prisma } from '../../lib/prisma';
 *   import { onProjectCreated } from '../twins/hooks';
 *
 *   const publisher = new StreamPublisher();
 *   const emitter = new TwinEventEmitter(publisher, prisma);
 *
 *   // Inside a service method, after the main operation:
 *   void onProjectCreated(emitter, { projectId, name, ... }, { type: 'USER', id: userId });
 */

// Project hooks
export {
  onProjectCreated,
  onProjectStatusChanged,
  onProjectUpdated,
  onProjectMemberAdded,
} from './project-hooks';

// Permit hooks
export {
  onPermitSubmitted,
  onPermitApproved,
  onPermitRejected,
  onPermitAIReviewCompleted,
} from './permit-hooks';

// Estimation hooks
export {
  onEstimateGenerated,
  onEstimateLinked,
  onServiceTicketCreated,
  onServiceTicketTransitioned,
} from './estimation-hooks';

// Payment hooks
export {
  onMilestonePaymentInitiated,
  onMilestonePaymentCompleted,
  onMilestonePaymentRefunded,
  onEscrowFunded,
} from './payment-hooks';

// Schedule hooks
export {
  onScheduleItemCreated,
  onScheduleItemUpdated,
  onScheduleProgressUpdated,
  onScheduleBulkUpdated,
  onScheduleMilestoneReached,
} from './schedule-hooks';

// Marketplace / Bid hooks
export {
  onBidRequestCreated,
  onBidSubmitted,
  onBidAwarded,
  onOpportunityBidCreated,
  onOpportunityBidStatusChanged,
  onContractorInvitationSent,
} from './marketplace-hooks';
