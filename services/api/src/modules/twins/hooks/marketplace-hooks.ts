/**
 * Marketplace / Bid Twin Hooks
 *
 * Fire-and-forget hooks called at the end of marketplace and bid service
 * methods to keep the project's Digital Twin in sync.
 *
 * All functions swallow errors so they never break the calling service.
 */

import type { TwinEventEmitter, ActorInfo } from '@kealee/core-ddts';

// ---- Bid Request Created -------------------------------------------------

export async function onBidRequestCreated(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    bidRequestId: string;
    title: string;
    tradeScope?: string;
    deadline?: string;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    await emitter.emitProjectEvent(
      'marketplace.bid.requested',
      data.projectId,
      {
        bidRequestId: data.bidRequestId,
        title: data.title,
        tradeScope: data.tradeScope,
        deadline: data.deadline,
      },
      actor,
      { description: `Bid request created: "${data.title}"` },
    );
  } catch (err) {
    console.error('[twin-hooks] onBidRequestCreated failed:', err);
  }
}

// ---- Bid Submitted -------------------------------------------------------

export async function onBidSubmitted(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    bidId: string;
    bidRequestId: string;
    contractorId: string;
    contractorName: string;
    amount: number;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    await emitter.emitProjectEvent(
      'marketplace.bid.submitted',
      data.projectId,
      {
        bidId: data.bidId,
        bidRequestId: data.bidRequestId,
        contractorId: data.contractorId,
        contractorName: data.contractorName,
        amount: data.amount,
      },
      actor,
      {
        description: `Bid submitted by ${data.contractorName}: $${data.amount.toLocaleString()}`,
      },
    );
  } catch (err) {
    console.error('[twin-hooks] onBidSubmitted failed:', err);
  }
}

// ---- Bid Awarded ---------------------------------------------------------

export async function onBidAwarded(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    bidId: string;
    contractorId: string;
    contractorName: string;
    amount: number;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    await emitter.emitAndUpdateKPI(
      'marketplace.bid.awarded',
      data.projectId,
      [{ kpiKey: 'completion_pct', delta: 2 }],
      {
        bidId: data.bidId,
        contractorId: data.contractorId,
        contractorName: data.contractorName,
        amount: data.amount,
      },
      actor,
      {
        severity: 'MEDIUM',
        description: `Bid awarded to ${data.contractorName}: $${data.amount.toLocaleString()}`,
      },
    );
  } catch (err) {
    console.error('[twin-hooks] onBidAwarded failed:', err);
  }
}

// ---- Opportunity Bid Created (from bid engine) ---------------------------

export async function onOpportunityBidCreated(
  emitter: TwinEventEmitter,
  data: {
    projectId?: string;
    bidId: string;
    projectName: string;
    source: string;
    bidDeadline: string;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    // Opportunity bids may not have a projectId yet
    if (!data.projectId) return;

    await emitter.emitProjectEvent(
      'marketplace.opportunity.created',
      data.projectId,
      {
        bidId: data.bidId,
        projectName: data.projectName,
        source: data.source,
        bidDeadline: data.bidDeadline,
      },
      actor,
      { description: `Opportunity bid discovered: "${data.projectName}" from ${data.source}` },
    );
  } catch (err) {
    console.error('[twin-hooks] onOpportunityBidCreated failed:', err);
  }
}

// ---- Opportunity Bid Status Changed --------------------------------------

export async function onOpportunityBidStatusChanged(
  emitter: TwinEventEmitter,
  data: {
    projectId?: string;
    bidId: string;
    previousStatus: string;
    newStatus: string;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    if (!data.projectId) return;

    await emitter.emitProjectEvent(
      'marketplace.opportunity.statusChanged',
      data.projectId,
      {
        bidId: data.bidId,
        previousStatus: data.previousStatus,
        newStatus: data.newStatus,
      },
      actor,
      {
        description: `Opportunity bid ${data.bidId}: ${data.previousStatus} -> ${data.newStatus}`,
      },
    );
  } catch (err) {
    console.error('[twin-hooks] onOpportunityBidStatusChanged failed:', err);
  }
}

// ---- Contractor Invitation Sent ------------------------------------------

export async function onContractorInvitationSent(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    contractorId: string;
    contractorName: string;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    await emitter.emitProjectEvent(
      'marketplace.contractor.invited',
      data.projectId,
      {
        contractorId: data.contractorId,
        contractorName: data.contractorName,
      },
      actor,
      { description: `Contractor invited: ${data.contractorName}` },
    );
  } catch (err) {
    console.error('[twin-hooks] onContractorInvitationSent failed:', err);
  }
}
