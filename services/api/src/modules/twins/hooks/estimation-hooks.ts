/**
 * Estimation Twin Hooks
 *
 * Fire-and-forget hooks called at the end of estimation service methods
 * to keep the project's Digital Twin in sync.
 *
 * All functions swallow errors so they never break the calling service.
 */

import type { TwinEventEmitter, ActorInfo } from '@kealee/core-ddts';

// ---- Estimate Generated --------------------------------------------------

export async function onEstimateGenerated(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    estimateId: string;
    total: number;
    laborCost: number;
    materialsCost: number;
    contingency: number;
    timelineDays: number;
    confidence: number;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    await emitter.emitAndUpdateKPI(
      'estimation.estimate.generated',
      data.projectId,
      [
        { kpiKey: 'budget_variance', value: 0 }, // Fresh estimate resets variance
      ],
      {
        estimateId: data.estimateId,
        total: data.total,
        laborCost: data.laborCost,
        materialsCost: data.materialsCost,
        contingency: data.contingency,
        timelineDays: data.timelineDays,
        confidence: data.confidence,
      },
      actor,
      {
        description: `Estimate generated: $${data.total.toLocaleString()} (confidence ${data.confidence}%)`,
      },
    );
  } catch (err) {
    console.error('[twin-hooks] onEstimateGenerated failed:', err);
  }
}

// ---- Estimate Linked to Project ------------------------------------------

export async function onEstimateLinked(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    estimateId: string;
    estimateTotal: number;
    validUntil?: string;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    await emitter.emitProjectEvent(
      'estimation.estimate.linked',
      data.projectId,
      {
        estimateId: data.estimateId,
        estimateTotal: data.estimateTotal,
        validUntil: data.validUntil,
      },
      actor,
      { description: `Estimate ${data.estimateId} linked to project` },
    );
  } catch (err) {
    console.error('[twin-hooks] onEstimateLinked failed:', err);
  }
}

// ---- Service Ticket Created ----------------------------------------------

export async function onServiceTicketCreated(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    ticketId: string;
    type: string;
    priority: string;
    clientName: string;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    await emitter.emitProjectEvent(
      'estimation.ticket.created',
      data.projectId,
      {
        ticketId: data.ticketId,
        type: data.type,
        priority: data.priority,
        clientName: data.clientName,
      },
      actor,
      { description: `Service ticket ${data.ticketId} created (${data.type})` },
    );
  } catch (err) {
    console.error('[twin-hooks] onServiceTicketCreated failed:', err);
  }
}

// ---- Service Ticket Transitioned -----------------------------------------

export async function onServiceTicketTransitioned(
  emitter: TwinEventEmitter,
  data: {
    projectId: string;
    ticketId: string;
    previousStatus: string;
    newStatus: string;
  },
  actor?: ActorInfo,
): Promise<void> {
  try {
    await emitter.emitProjectEvent(
      'estimation.ticket.transitioned',
      data.projectId,
      {
        ticketId: data.ticketId,
        previousStatus: data.previousStatus,
        newStatus: data.newStatus,
      },
      actor,
      {
        description: `Ticket ${data.ticketId}: ${data.previousStatus} -> ${data.newStatus}`,
      },
    );
  } catch (err) {
    console.error('[twin-hooks] onServiceTicketTransitioned failed:', err);
  }
}
