/**
 * Typed Broadcast Helpers
 *
 * Pre-built broadcast wrappers for common events. Each helper constructs
 * a properly typed RealtimeEvent and sends it to the appropriate channels.
 *
 * All helpers are async and should be called with .catch() in production
 * to ensure broadcast failures never disrupt core operations.
 *
 * Usage:
 *   import { notifyEstimateCreated } from '@kealee/realtime';
 *
 *   // After creating an estimate:
 *   notifyEstimateCreated({
 *     estimateId: estimate.id,
 *     projectId: estimate.projectId,
 *     organizationId: estimate.organizationId,
 *     name: estimate.name,
 *     status: estimate.status,
 *     totalCost: estimate.totals.grandTotal,
 *   }, userId).catch(err => console.error('[Realtime] broadcast failed:', err));
 */

import {
  broadcastToProject,
  broadcastToUser,
  broadcastToOrg,
  broadcastSystemAlert,
} from './broadcast';
import type {
  RealtimeEvent,
  EstimateEventPayload,
  OrderEventPayload,
  BidEventPayload,
  JobEventPayload,
  BudgetEventPayload,
  ActivityEventPayload,
  CommunicationEventPayload,
  QAEventPayload,
  PaymentEventPayload,
  ScheduleEventPayload,
  SystemEventPayload,
  AutonomyEventPayload,
  ScoringEventPayload,
  CrewEventPayload,
  SensorEventPayload,
} from './events';

// ── Event Factory ────────────────────────────────────────────

function makeEvent<P>(
  event: string,
  payload: P,
  source: string,
  userId?: string,
  correlationId?: string
): RealtimeEvent<string, P> {
  return {
    event,
    payload,
    timestamp: new Date().toISOString(),
    source,
    userId,
    correlationId,
  };
}

// ── Estimate Helpers ─────────────────────────────────────────

export async function notifyEstimateCreated(
  payload: EstimateEventPayload,
  userId?: string
): Promise<void> {
  const event = makeEvent('estimate.created', payload, 'estimation-tool', userId);
  await broadcastToProject(payload.projectId, event, { excludeUserId: userId });
  await broadcastToOrg(payload.organizationId, event);
}

export async function notifyEstimateUpdated(
  payload: EstimateEventPayload,
  userId?: string
): Promise<void> {
  const event = makeEvent('estimate.updated', payload, 'estimation-tool', userId);
  await broadcastToProject(payload.projectId, event, { excludeUserId: userId });
}

export async function notifyEstimateStatusChanged(
  payload: EstimateEventPayload,
  userId?: string
): Promise<void> {
  const event = makeEvent('estimate.status_changed', payload, 'estimation-tool', userId);
  await broadcastToProject(payload.projectId, event);
  await broadcastToOrg(payload.organizationId, event);
}

export async function notifyEstimateCalculated(
  payload: EstimateEventPayload,
  userId?: string
): Promise<void> {
  const event = makeEvent('estimate.calculated', payload, 'estimation-tool', userId);
  await broadcastToProject(payload.projectId, event, { excludeUserId: userId });
}

export async function notifyEstimateLocked(
  payload: EstimateEventPayload,
  userId?: string
): Promise<void> {
  const event = makeEvent('estimate.locked', payload, 'estimation-tool', userId);
  await broadcastToProject(payload.projectId, event);
}

export async function notifyEstimateUnlocked(
  payload: EstimateEventPayload,
  userId?: string
): Promise<void> {
  const event = makeEvent('estimate.unlocked', payload, 'estimation-tool', userId);
  await broadcastToProject(payload.projectId, event);
}

// ── Order Helpers ────────────────────────────────────────────

export async function notifyOrderCreated(
  payload: OrderEventPayload,
  userId?: string
): Promise<void> {
  const event = makeEvent('order.created', payload, 'estimation-tool', userId);
  await broadcastToProject(payload.projectId, event);
  await broadcastToOrg(payload.organizationId, event);
}

export async function notifyOrderAssigned(
  payload: OrderEventPayload,
  userId?: string
): Promise<void> {
  const event = makeEvent('order.assigned', payload, 'estimation-tool', userId);
  await broadcastToProject(payload.projectId, event);
  // Also notify the assigned user directly
  if (payload.assignedTo) {
    await broadcastToUser(payload.assignedTo, event);
  }
}

export async function notifyOrderStarted(
  payload: OrderEventPayload,
  userId?: string
): Promise<void> {
  const event = makeEvent('order.started', payload, 'estimation-tool', userId);
  await broadcastToProject(payload.projectId, event);
}

export async function notifyOrderCompleted(
  payload: OrderEventPayload,
  userId?: string
): Promise<void> {
  const event = makeEvent('order.completed', payload, 'estimation-tool', userId);
  await broadcastToProject(payload.projectId, event);
  await broadcastToOrg(payload.organizationId, event);
}

// ── Bid Helpers ──────────────────────────────────────────────

export async function notifyBidSubmitted(
  payload: BidEventPayload,
  userId?: string
): Promise<void> {
  const event = makeEvent('bid.submitted', payload, 'bid-engine', userId);
  await broadcastToProject(payload.projectId, event);
  await broadcastToOrg(payload.organizationId, event);
}

export async function notifyBidReceived(
  payload: BidEventPayload,
  userId?: string
): Promise<void> {
  const event = makeEvent('bid.received', payload, 'bid-engine', userId);
  await broadcastToProject(payload.projectId, event);
}

export async function notifyBidAccepted(
  payload: BidEventPayload,
  userId?: string
): Promise<void> {
  const event = makeEvent('bid.accepted', payload, 'bid-engine', userId);
  await broadcastToProject(payload.projectId, event);
  await broadcastToOrg(payload.organizationId, event);
}

export async function notifyBidSyncComplete(
  payload: BidEventPayload,
  userId?: string
): Promise<void> {
  const event = makeEvent('bid.sync_complete', payload, 'bid-engine', userId);
  await broadcastToOrg(payload.organizationId, event);
}

// ── Job / Worker Helpers ─────────────────────────────────────

export async function notifyJobCompleted(
  payload: JobEventPayload,
  userId?: string
): Promise<void> {
  const event = makeEvent('job.completed', payload, 'estimation-tool', userId);
  if (userId) {
    await broadcastToUser(userId, event);
  }
  if (payload.organizationId) {
    await broadcastToOrg(payload.organizationId, event);
  }
}

export async function notifyJobFailed(
  payload: JobEventPayload,
  userId?: string
): Promise<void> {
  const event = makeEvent('job.failed', payload, 'estimation-tool', userId);
  if (userId) {
    await broadcastToUser(userId, event);
  }
}

export async function notifyJobProgress(
  payload: JobEventPayload,
  userId?: string
): Promise<void> {
  const event = makeEvent('job.progress', payload, 'estimation-tool', userId);
  if (userId) {
    await broadcastToUser(userId, event);
  }
}

// ── Budget Helpers ───────────────────────────────────────────

export async function notifyBudgetUpdated(
  payload: BudgetEventPayload
): Promise<void> {
  const event = makeEvent('budget.updated', payload, 'budget-tracker');
  await broadcastToProject(payload.projectId, event);
}

export async function notifyBudgetAlert(
  payload: BudgetEventPayload
): Promise<void> {
  const event = makeEvent('budget.threshold_warning', payload, 'budget-tracker');
  await broadcastToProject(payload.projectId, event);
  await broadcastToOrg(payload.organizationId, event);
}

// ── Activity Helpers ─────────────────────────────────────────

export async function notifyActivity(
  payload: ActivityEventPayload,
  eventType: 'comment' | 'file_upload' | 'photo_uploaded' | 'milestone' | 'status_change' | 'task_complete' = 'status_change'
): Promise<void> {
  const event = makeEvent(`activity.${eventType}`, payload, 'platform');
  await broadcastToProject(payload.projectId, event, { excludeUserId: payload.actorId });
}

// ── Communication Helpers ────────────────────────────────────

export async function notifyMessageReceived(
  recipientId: string,
  payload: CommunicationEventPayload
): Promise<void> {
  const event = makeEvent('message.received', payload, 'communication-hub');
  await broadcastToUser(recipientId, event);
}

export async function notifyDecisionNeeded(
  deciderId: string,
  payload: CommunicationEventPayload
): Promise<void> {
  const event = makeEvent('decision.needed', payload, 'decision-engine');
  await broadcastToUser(deciderId, event);
}

export async function notifyDecisionResolved(
  payload: CommunicationEventPayload & { projectId: string }
): Promise<void> {
  const event = makeEvent('decision.resolved', payload, 'decision-engine');
  await broadcastToProject(payload.projectId, event);
}

// ── QA Helpers ───────────────────────────────────────────────

export async function notifyQAIssue(
  payload: QAEventPayload
): Promise<void> {
  const event = makeEvent('qa.issue_found', payload, 'qa-vision');
  await broadcastToProject(payload.projectId, event);
}

export async function notifyInspectionPassed(
  payload: QAEventPayload
): Promise<void> {
  const event = makeEvent('qa.inspection_passed', payload, 'inspection-scheduler');
  await broadcastToProject(payload.projectId, event);
}

// ── Payment Helpers ──────────────────────────────────────────

export async function notifyPaymentReceived(
  payload: PaymentEventPayload & { projectId: string }
): Promise<void> {
  const event = makeEvent('payment.received', payload, 'payment-processing');
  await broadcastToProject(payload.projectId, event);
}

export async function notifyEscrowFunded(
  payload: PaymentEventPayload & { projectId: string }
): Promise<void> {
  const event = makeEvent('escrow.funded', payload, 'payment-processing');
  await broadcastToProject(payload.projectId, event);
}

export async function notifyPayoutSent(
  contractorId: string,
  payload: PaymentEventPayload
): Promise<void> {
  const event = makeEvent('payout.sent', payload, 'payment-processing');
  await broadcastToUser(contractorId, event);
}

// ── Schedule Helpers ─────────────────────────────────────────

export async function notifyVisitScheduled(
  payload: ScheduleEventPayload
): Promise<void> {
  const event = makeEvent('visit.scheduled', payload, 'scheduling-engine');
  await broadcastToProject(payload.projectId, event);
}

export async function notifyVisitComplete(
  payload: ScheduleEventPayload
): Promise<void> {
  const event = makeEvent('visit.complete', payload, 'scheduling-engine');
  await broadcastToProject(payload.projectId, event);
}

// ── System Helpers ───────────────────────────────────────────

export async function notifySystemMaintenance(
  payload: SystemEventPayload
): Promise<void> {
  const event = makeEvent('system.maintenance', payload, 'system');
  await broadcastSystemAlert(event);
}

export async function notifySystemAnnouncement(
  payload: SystemEventPayload
): Promise<void> {
  const event = makeEvent('system.announcement', payload, 'system');
  await broadcastSystemAlert(event);
}

// ── Autonomy Helpers ────────────────────────────────────────

/**
 * Notify PM of an autonomous action that was auto-executed
 */
export async function notifyAutonomousAction(
  projectId: string,
  payload: AutonomyEventPayload,
  pmUserIds?: string[]
): Promise<void> {
  const event = makeEvent('autonomous_action.executed', payload, 'autonomy-engine');
  await broadcastToProject(projectId, event);

  // Also notify each PM individually for urgent visibility
  if (pmUserIds) {
    for (const userId of pmUserIds) {
      await broadcastToUser(userId, event);
    }
  }
}

/**
 * Notify PM of an escalated action that requires human decision
 */
export async function notifyActionEscalated(
  projectId: string,
  payload: AutonomyEventPayload,
  pmUserIds?: string[]
): Promise<void> {
  const event = makeEvent('autonomous_action.escalated', payload, 'autonomy-engine');
  await broadcastToProject(projectId, event);

  if (pmUserIds) {
    for (const userId of pmUserIds) {
      await broadcastToUser(userId, event);
    }
  }
}

/**
 * Notify when an autonomous action is reverted by PM
 */
export async function notifyActionReverted(
  projectId: string,
  payload: AutonomyEventPayload
): Promise<void> {
  const event = makeEvent('autonomous_action.reverted', payload, 'autonomy-engine');
  await broadcastToProject(projectId, event);
}

// ── Contractor Scoring Helpers ──────────────────────────────

/**
 * Broadcast contractor score update
 */
export async function notifyContractorScoreUpdated(
  contractorId: string,
  payload: ScoringEventPayload
): Promise<void> {
  const event = makeEvent('scoring.contractor_updated', payload, 'scoring-engine');
  await broadcastToUser(contractorId, event);
}

// ── Crew Tracking Helpers ───────────────────────────────────

/**
 * Broadcast crew arrival at project site
 */
export async function notifyCrewArrived(
  payload: CrewEventPayload
): Promise<void> {
  const event = makeEvent('crew.arrived', payload, 'smart-scheduler');
  await broadcastToProject(payload.projectId, event);
}

/**
 * Broadcast crew departure from project site
 */
export async function notifyCrewDeparted(
  payload: CrewEventPayload
): Promise<void> {
  const event = makeEvent('crew.departed', payload, 'smart-scheduler');
  await broadcastToProject(payload.projectId, event);
}

// ── Weather Reschedule Helpers ──────────────────────────────

/**
 * Broadcast weather-triggered schedule change
 */
export async function notifyWeatherReschedule(
  payload: ScheduleEventPayload
): Promise<void> {
  const event = makeEvent('schedule.weather_rescheduled', payload, 'smart-scheduler');
  await broadcastToProject(payload.projectId, event);
}

// ── Sensor Alert Helpers ──────────────────────────────────────

/**
 * Broadcast sensor threshold alert to project channel
 */
export async function notifySensorAlert(
  payload: SensorEventPayload
): Promise<void> {
  const event = makeEvent('sensor.alert', payload, 'sensor-ingestion');
  await broadcastToProject(payload.projectId, event);
}

/**
 * Broadcast sensor device offline to project channel
 */
export async function notifySensorOffline(
  payload: SensorEventPayload
): Promise<void> {
  const event = makeEvent('sensor.device_offline', payload, 'sensor-ingestion');
  await broadcastToProject(payload.projectId, event);
}

/**
 * Broadcast sensor low battery warning
 */
export async function notifySensorLowBattery(
  payload: SensorEventPayload
): Promise<void> {
  const event = makeEvent('sensor.low_battery', payload, 'sensor-ingestion');
  await broadcastToProject(payload.projectId, event);
}
