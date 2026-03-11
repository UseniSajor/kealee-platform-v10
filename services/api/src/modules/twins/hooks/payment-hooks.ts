/**
 * Payment Twin Hooks
 *
 * Fire-and-forget hooks called at the end of payment service methods
 * to keep the project's Digital Twin in sync.
 *
 * All functions swallow errors so they never break the calling service.
 */

import type { TwinEventEmitter, ActorInfo } from '@kealee/core-ddts';

// ---- Milestone Payment Initiated -----------------------------------------

export async function onMilestonePaymentInitiated(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    milestoneId: string;
    milestoneName: string;
    amount: number;
    platformFee: number;
    contractorAmount: number;
    paymentIntentId: string;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    await emitter.emitProjectEvent(
      'payment.milestone.initiated',
      data.projectId,
      {
        milestoneId: data.milestoneId,
        milestoneName: data.milestoneName,
        amount: data.amount,
        platformFee: data.platformFee,
        contractorAmount: data.contractorAmount,
        paymentIntentId: data.paymentIntentId,
      },
      actor,
      {
        severity: 'MEDIUM',
        description: `Payment initiated for milestone "${data.milestoneName}": $${data.amount.toLocaleString()}`,
      },
    );
  } catch (err) {
    console.error('[twin-hooks] onMilestonePaymentInitiated failed:', err);
  }
}

// ---- Milestone Payment Completed -----------------------------------------

export async function onMilestonePaymentCompleted(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    milestoneId: string;
    milestoneName: string;
    amount: number;
    totalPaidToDate: number;
    totalBudget: number;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    // Calculate completion % based on payments vs budget
    const completionFromPayments =
      data.totalBudget > 0
        ? Math.round((data.totalPaidToDate / data.totalBudget) * 100)
        : undefined;

    const kpiUpdates = completionFromPayments !== undefined
      ? [{ kpiKey: 'completion_pct', value: Math.min(completionFromPayments, 100) }]
      : [];

    await emitter.emitAndUpdateKPI(
      'payment.milestone.completed',
      data.projectId,
      kpiUpdates,
      {
        milestoneId: data.milestoneId,
        milestoneName: data.milestoneName,
        amount: data.amount,
        totalPaidToDate: data.totalPaidToDate,
        totalBudget: data.totalBudget,
        completionFromPayments,
      },
      actor,
      {
        severity: 'MEDIUM',
        description: `Payment completed for milestone "${data.milestoneName}": $${data.amount.toLocaleString()}`,
      },
    );
  } catch (err) {
    console.error('[twin-hooks] onMilestonePaymentCompleted failed:', err);
  }
}

// ---- Milestone Payment Refunded ------------------------------------------

export async function onMilestonePaymentRefunded(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    milestoneId: string;
    refundId: string;
    amount: number;
    reason?: string;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    await emitter.emitAndUpdateKPI(
      'payment.milestone.refunded',
      data.projectId,
      [{ kpiKey: 'risk_score', delta: 5 }],
      {
        milestoneId: data.milestoneId,
        refundId: data.refundId,
        amount: data.amount,
        reason: data.reason,
      },
      actor,
      {
        severity: 'HIGH',
        description: `Payment refunded: $${data.amount.toLocaleString()}${data.reason ? ` (${data.reason})` : ''}`,
      },
    );
  } catch (err) {
    console.error('[twin-hooks] onMilestonePaymentRefunded failed:', err);
  }
}

// ---- Escrow Funded -------------------------------------------------------

export async function onEscrowFunded(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    escrowId: string;
    amount: number;
    newBalance: number;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    await emitter.emitProjectEvent(
      'payment.escrow.funded',
      data.projectId,
      {
        escrowId: data.escrowId,
        amount: data.amount,
        newBalance: data.newBalance,
      },
      actor,
      {
        description: `Escrow funded: $${data.amount.toLocaleString()} (balance: $${data.newBalance.toLocaleString()})`,
      },
    );
  } catch (err) {
    console.error('[twin-hooks] onEscrowFunded failed:', err);
  }
}
