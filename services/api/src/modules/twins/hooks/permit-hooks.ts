/**
 * Permit Twin Hooks
 *
 * Fire-and-forget hooks called at the end of permit service methods
 * to keep the project's Digital Twin in sync.
 *
 * All functions swallow errors so they never break the calling service.
 */

import type { TwinEventEmitter, ActorInfo } from '@kealee/core-ddts';

// ---- Permit Submitted ----------------------------------------------------

export async function onPermitSubmitted(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    permitId: string;
    permitType: string;
    jurisdiction: string;
    jurisdictionRefNumber?: string;
    aiReviewScore?: number;
    expedited?: boolean;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    await emitter.emitProjectEvent(
      'pm.permit.submitted',
      data.projectId,
      {
        permitId: data.permitId,
        permitType: data.permitType,
        jurisdiction: data.jurisdiction,
        jurisdictionRefNumber: data.jurisdictionRefNumber,
        aiReviewScore: data.aiReviewScore,
        expedited: data.expedited ?? false,
      },
      actor,
      {
        severity: 'MEDIUM',
        description: `Permit ${data.permitType} submitted to ${data.jurisdiction}`,
      },
    );
  } catch (err) {
    console.error('[twin-hooks] onPermitSubmitted failed:', err);
  }
}

// ---- Permit Approved -----------------------------------------------------

export async function onPermitApproved(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    permitId: string;
    permitType: string;
    approvedAt?: string;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    await emitter.emitAndUpdateKPI(
      'pm.permit.approved',
      data.projectId,
      [{ kpiKey: 'completion_pct', delta: 5 }],
      {
        permitId: data.permitId,
        permitType: data.permitType,
        approvedAt: data.approvedAt ?? new Date().toISOString(),
      },
      actor,
      {
        severity: 'MEDIUM',
        description: `Permit ${data.permitType} approved`,
      },
    );
  } catch (err) {
    console.error('[twin-hooks] onPermitApproved failed:', err);
  }
}

// ---- Permit Rejected / Revision Requested --------------------------------

export async function onPermitRejected(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    permitId: string;
    permitType: string;
    reason?: string;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    await emitter.emitAndUpdateKPI(
      'pm.permit.rejected',
      data.projectId,
      [{ kpiKey: 'risk_score', delta: 10 }],
      {
        permitId: data.permitId,
        permitType: data.permitType,
        reason: data.reason,
      },
      actor,
      {
        severity: 'HIGH',
        description: `Permit ${data.permitType} rejected${data.reason ? `: ${data.reason}` : ''}`,
      },
    );
  } catch (err) {
    console.error('[twin-hooks] onPermitRejected failed:', err);
  }
}

// ---- Permit AI Review Completed ------------------------------------------

export async function onPermitAIReviewCompleted(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    permitId: string;
    aiReviewScore: number;
    readyToSubmit: boolean;
    issueCount: number;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    await emitter.emitProjectEvent(
      'pm.permit.aiReviewCompleted',
      data.projectId,
      {
        permitId: data.permitId,
        aiReviewScore: data.aiReviewScore,
        readyToSubmit: data.readyToSubmit,
        issueCount: data.issueCount,
      },
      actor,
      { description: `AI review completed (score: ${data.aiReviewScore})` },
    );
  } catch (err) {
    console.error('[twin-hooks] onPermitAIReviewCompleted failed:', err);
  }
}
