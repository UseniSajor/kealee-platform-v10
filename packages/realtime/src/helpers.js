"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyEstimateCreated = notifyEstimateCreated;
exports.notifyEstimateUpdated = notifyEstimateUpdated;
exports.notifyEstimateStatusChanged = notifyEstimateStatusChanged;
exports.notifyEstimateCalculated = notifyEstimateCalculated;
exports.notifyEstimateLocked = notifyEstimateLocked;
exports.notifyEstimateUnlocked = notifyEstimateUnlocked;
exports.notifyOrderCreated = notifyOrderCreated;
exports.notifyOrderAssigned = notifyOrderAssigned;
exports.notifyOrderStarted = notifyOrderStarted;
exports.notifyOrderCompleted = notifyOrderCompleted;
exports.notifyBidSubmitted = notifyBidSubmitted;
exports.notifyBidReceived = notifyBidReceived;
exports.notifyBidAccepted = notifyBidAccepted;
exports.notifyBidSyncComplete = notifyBidSyncComplete;
exports.notifyJobCompleted = notifyJobCompleted;
exports.notifyJobFailed = notifyJobFailed;
exports.notifyJobProgress = notifyJobProgress;
exports.notifyBudgetUpdated = notifyBudgetUpdated;
exports.notifyBudgetAlert = notifyBudgetAlert;
exports.notifyActivity = notifyActivity;
exports.notifyMessageReceived = notifyMessageReceived;
exports.notifyDecisionNeeded = notifyDecisionNeeded;
exports.notifyDecisionResolved = notifyDecisionResolved;
exports.notifyQAIssue = notifyQAIssue;
exports.notifyInspectionPassed = notifyInspectionPassed;
exports.notifyPaymentReceived = notifyPaymentReceived;
exports.notifyEscrowFunded = notifyEscrowFunded;
exports.notifyPayoutSent = notifyPayoutSent;
exports.notifyVisitScheduled = notifyVisitScheduled;
exports.notifyVisitComplete = notifyVisitComplete;
exports.notifySystemMaintenance = notifySystemMaintenance;
exports.notifySystemAnnouncement = notifySystemAnnouncement;
exports.notifyAutonomousAction = notifyAutonomousAction;
exports.notifyActionEscalated = notifyActionEscalated;
exports.notifyActionReverted = notifyActionReverted;
exports.notifyContractorScoreUpdated = notifyContractorScoreUpdated;
exports.notifyCrewArrived = notifyCrewArrived;
exports.notifyCrewDeparted = notifyCrewDeparted;
exports.notifyWeatherReschedule = notifyWeatherReschedule;
exports.notifySensorAlert = notifySensorAlert;
exports.notifySensorOffline = notifySensorOffline;
exports.notifySensorLowBattery = notifySensorLowBattery;
const broadcast_1 = require("./broadcast");
// ── Event Factory ────────────────────────────────────────────
function makeEvent(event, payload, source, userId, correlationId) {
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
async function notifyEstimateCreated(payload, userId) {
    const event = makeEvent('estimate.created', payload, 'estimation-tool', userId);
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event, { excludeUserId: userId });
    await (0, broadcast_1.broadcastToOrg)(payload.organizationId, event);
}
async function notifyEstimateUpdated(payload, userId) {
    const event = makeEvent('estimate.updated', payload, 'estimation-tool', userId);
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event, { excludeUserId: userId });
}
async function notifyEstimateStatusChanged(payload, userId) {
    const event = makeEvent('estimate.status_changed', payload, 'estimation-tool', userId);
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
    await (0, broadcast_1.broadcastToOrg)(payload.organizationId, event);
}
async function notifyEstimateCalculated(payload, userId) {
    const event = makeEvent('estimate.calculated', payload, 'estimation-tool', userId);
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event, { excludeUserId: userId });
}
async function notifyEstimateLocked(payload, userId) {
    const event = makeEvent('estimate.locked', payload, 'estimation-tool', userId);
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
}
async function notifyEstimateUnlocked(payload, userId) {
    const event = makeEvent('estimate.unlocked', payload, 'estimation-tool', userId);
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
}
// ── Order Helpers ────────────────────────────────────────────
async function notifyOrderCreated(payload, userId) {
    const event = makeEvent('order.created', payload, 'estimation-tool', userId);
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
    await (0, broadcast_1.broadcastToOrg)(payload.organizationId, event);
}
async function notifyOrderAssigned(payload, userId) {
    const event = makeEvent('order.assigned', payload, 'estimation-tool', userId);
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
    // Also notify the assigned user directly
    if (payload.assignedTo) {
        await (0, broadcast_1.broadcastToUser)(payload.assignedTo, event);
    }
}
async function notifyOrderStarted(payload, userId) {
    const event = makeEvent('order.started', payload, 'estimation-tool', userId);
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
}
async function notifyOrderCompleted(payload, userId) {
    const event = makeEvent('order.completed', payload, 'estimation-tool', userId);
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
    await (0, broadcast_1.broadcastToOrg)(payload.organizationId, event);
}
// ── Bid Helpers ──────────────────────────────────────────────
async function notifyBidSubmitted(payload, userId) {
    const event = makeEvent('bid.submitted', payload, 'bid-engine', userId);
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
    await (0, broadcast_1.broadcastToOrg)(payload.organizationId, event);
}
async function notifyBidReceived(payload, userId) {
    const event = makeEvent('bid.received', payload, 'bid-engine', userId);
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
}
async function notifyBidAccepted(payload, userId) {
    const event = makeEvent('bid.accepted', payload, 'bid-engine', userId);
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
    await (0, broadcast_1.broadcastToOrg)(payload.organizationId, event);
}
async function notifyBidSyncComplete(payload, userId) {
    const event = makeEvent('bid.sync_complete', payload, 'bid-engine', userId);
    await (0, broadcast_1.broadcastToOrg)(payload.organizationId, event);
}
// ── Job / Worker Helpers ─────────────────────────────────────
async function notifyJobCompleted(payload, userId) {
    const event = makeEvent('job.completed', payload, 'estimation-tool', userId);
    if (userId) {
        await (0, broadcast_1.broadcastToUser)(userId, event);
    }
    if (payload.organizationId) {
        await (0, broadcast_1.broadcastToOrg)(payload.organizationId, event);
    }
}
async function notifyJobFailed(payload, userId) {
    const event = makeEvent('job.failed', payload, 'estimation-tool', userId);
    if (userId) {
        await (0, broadcast_1.broadcastToUser)(userId, event);
    }
}
async function notifyJobProgress(payload, userId) {
    const event = makeEvent('job.progress', payload, 'estimation-tool', userId);
    if (userId) {
        await (0, broadcast_1.broadcastToUser)(userId, event);
    }
}
// ── Budget Helpers ───────────────────────────────────────────
async function notifyBudgetUpdated(payload) {
    const event = makeEvent('budget.updated', payload, 'budget-tracker');
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
}
async function notifyBudgetAlert(payload) {
    const event = makeEvent('budget.threshold_warning', payload, 'budget-tracker');
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
    await (0, broadcast_1.broadcastToOrg)(payload.organizationId, event);
}
// ── Activity Helpers ─────────────────────────────────────────
async function notifyActivity(payload, eventType = 'status_change') {
    const event = makeEvent(`activity.${eventType}`, payload, 'platform');
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event, { excludeUserId: payload.actorId });
}
// ── Communication Helpers ────────────────────────────────────
async function notifyMessageReceived(recipientId, payload) {
    const event = makeEvent('message.received', payload, 'communication-hub');
    await (0, broadcast_1.broadcastToUser)(recipientId, event);
}
async function notifyDecisionNeeded(deciderId, payload) {
    const event = makeEvent('decision.needed', payload, 'decision-engine');
    await (0, broadcast_1.broadcastToUser)(deciderId, event);
}
async function notifyDecisionResolved(payload) {
    const event = makeEvent('decision.resolved', payload, 'decision-engine');
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
}
// ── QA Helpers ───────────────────────────────────────────────
async function notifyQAIssue(payload) {
    const event = makeEvent('qa.issue_found', payload, 'qa-vision');
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
}
async function notifyInspectionPassed(payload) {
    const event = makeEvent('qa.inspection_passed', payload, 'inspection-scheduler');
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
}
// ── Payment Helpers ──────────────────────────────────────────
async function notifyPaymentReceived(payload) {
    const event = makeEvent('payment.received', payload, 'payment-processing');
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
}
async function notifyEscrowFunded(payload) {
    const event = makeEvent('escrow.funded', payload, 'payment-processing');
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
}
async function notifyPayoutSent(contractorId, payload) {
    const event = makeEvent('payout.sent', payload, 'payment-processing');
    await (0, broadcast_1.broadcastToUser)(contractorId, event);
}
// ── Schedule Helpers ─────────────────────────────────────────
async function notifyVisitScheduled(payload) {
    const event = makeEvent('visit.scheduled', payload, 'scheduling-engine');
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
}
async function notifyVisitComplete(payload) {
    const event = makeEvent('visit.complete', payload, 'scheduling-engine');
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
}
// ── System Helpers ───────────────────────────────────────────
async function notifySystemMaintenance(payload) {
    const event = makeEvent('system.maintenance', payload, 'system');
    await (0, broadcast_1.broadcastSystemAlert)(event);
}
async function notifySystemAnnouncement(payload) {
    const event = makeEvent('system.announcement', payload, 'system');
    await (0, broadcast_1.broadcastSystemAlert)(event);
}
// ── Autonomy Helpers ────────────────────────────────────────
/**
 * Notify PM of an autonomous action that was auto-executed
 */
async function notifyAutonomousAction(projectId, payload, pmUserIds) {
    const event = makeEvent('autonomous_action.executed', payload, 'autonomy-engine');
    await (0, broadcast_1.broadcastToProject)(projectId, event);
    // Also notify each PM individually for urgent visibility
    if (pmUserIds) {
        for (const userId of pmUserIds) {
            await (0, broadcast_1.broadcastToUser)(userId, event);
        }
    }
}
/**
 * Notify PM of an escalated action that requires human decision
 */
async function notifyActionEscalated(projectId, payload, pmUserIds) {
    const event = makeEvent('autonomous_action.escalated', payload, 'autonomy-engine');
    await (0, broadcast_1.broadcastToProject)(projectId, event);
    if (pmUserIds) {
        for (const userId of pmUserIds) {
            await (0, broadcast_1.broadcastToUser)(userId, event);
        }
    }
}
/**
 * Notify when an autonomous action is reverted by PM
 */
async function notifyActionReverted(projectId, payload) {
    const event = makeEvent('autonomous_action.reverted', payload, 'autonomy-engine');
    await (0, broadcast_1.broadcastToProject)(projectId, event);
}
// ── Contractor Scoring Helpers ──────────────────────────────
/**
 * Broadcast contractor score update
 */
async function notifyContractorScoreUpdated(contractorId, payload) {
    const event = makeEvent('scoring.contractor_updated', payload, 'scoring-engine');
    await (0, broadcast_1.broadcastToUser)(contractorId, event);
}
// ── Crew Tracking Helpers ───────────────────────────────────
/**
 * Broadcast crew arrival at project site
 */
async function notifyCrewArrived(payload) {
    const event = makeEvent('crew.arrived', payload, 'smart-scheduler');
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
}
/**
 * Broadcast crew departure from project site
 */
async function notifyCrewDeparted(payload) {
    const event = makeEvent('crew.departed', payload, 'smart-scheduler');
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
}
// ── Weather Reschedule Helpers ──────────────────────────────
/**
 * Broadcast weather-triggered schedule change
 */
async function notifyWeatherReschedule(payload) {
    const event = makeEvent('schedule.weather_rescheduled', payload, 'smart-scheduler');
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
}
// ── Sensor Alert Helpers ──────────────────────────────────────
/**
 * Broadcast sensor threshold alert to project channel
 */
async function notifySensorAlert(payload) {
    const event = makeEvent('sensor.alert', payload, 'sensor-ingestion');
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
}
/**
 * Broadcast sensor device offline to project channel
 */
async function notifySensorOffline(payload) {
    const event = makeEvent('sensor.device_offline', payload, 'sensor-ingestion');
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
}
/**
 * Broadcast sensor low battery warning
 */
async function notifySensorLowBattery(payload) {
    const event = makeEvent('sensor.low_battery', payload, 'sensor-ingestion');
    await (0, broadcast_1.broadcastToProject)(payload.projectId, event);
}
