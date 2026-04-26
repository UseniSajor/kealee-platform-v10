"use strict";
/**
 * @kealee/realtime — Supabase Realtime Package
 *
 * Server-side broadcast functions, client-side React hooks,
 * and typed event definitions for real-time communication
 * across the Kealee Platform.
 *
 * Server Usage:
 *   import { broadcastToProject, notifyEstimateCreated } from '@kealee/realtime';
 *
 * Client Usage:
 *   import { useProjectChannel, useUserChannel, usePresence } from '@kealee/realtime';
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePresenceStats = exports.generateInsights = exports.describeActivity = exports.projectPresenceChannel = exports.PLATFORM_PRESENCE_CHANNEL = exports.usePresence = exports.useUserChannel = exports.useProjectChannel = exports.notifySensorLowBattery = exports.notifySensorOffline = exports.notifySensorAlert = exports.notifyWeatherReschedule = exports.notifyCrewDeparted = exports.notifyCrewArrived = exports.notifySystemAnnouncement = exports.notifySystemMaintenance = exports.notifyVisitComplete = exports.notifyVisitScheduled = exports.notifyPayoutSent = exports.notifyEscrowFunded = exports.notifyPaymentReceived = exports.notifyInspectionPassed = exports.notifyQAIssue = exports.notifyDecisionResolved = exports.notifyDecisionNeeded = exports.notifyMessageReceived = exports.notifyActivity = exports.notifyBudgetAlert = exports.notifyBudgetUpdated = exports.notifyJobProgress = exports.notifyJobFailed = exports.notifyJobCompleted = exports.notifyBidSyncComplete = exports.notifyBidAccepted = exports.notifyBidReceived = exports.notifyBidSubmitted = exports.notifyOrderCompleted = exports.notifyOrderStarted = exports.notifyOrderAssigned = exports.notifyOrderCreated = exports.notifyEstimateUnlocked = exports.notifyEstimateLocked = exports.notifyEstimateCalculated = exports.notifyEstimateStatusChanged = exports.notifyEstimateUpdated = exports.notifyEstimateCreated = exports.broadcastSystemAlert = exports.broadcastToOrg = exports.broadcastToProject = exports.broadcastToUser = void 0;
// ── Server-Side Broadcast ────────────────────────────────────
var broadcast_1 = require("./broadcast");
Object.defineProperty(exports, "broadcastToUser", { enumerable: true, get: function () { return broadcast_1.broadcastToUser; } });
Object.defineProperty(exports, "broadcastToProject", { enumerable: true, get: function () { return broadcast_1.broadcastToProject; } });
Object.defineProperty(exports, "broadcastToOrg", { enumerable: true, get: function () { return broadcast_1.broadcastToOrg; } });
Object.defineProperty(exports, "broadcastSystemAlert", { enumerable: true, get: function () { return broadcast_1.broadcastSystemAlert; } });
// ── Typed Convenience Helpers ────────────────────────────────
var helpers_1 = require("./helpers");
// Estimates
Object.defineProperty(exports, "notifyEstimateCreated", { enumerable: true, get: function () { return helpers_1.notifyEstimateCreated; } });
Object.defineProperty(exports, "notifyEstimateUpdated", { enumerable: true, get: function () { return helpers_1.notifyEstimateUpdated; } });
Object.defineProperty(exports, "notifyEstimateStatusChanged", { enumerable: true, get: function () { return helpers_1.notifyEstimateStatusChanged; } });
Object.defineProperty(exports, "notifyEstimateCalculated", { enumerable: true, get: function () { return helpers_1.notifyEstimateCalculated; } });
Object.defineProperty(exports, "notifyEstimateLocked", { enumerable: true, get: function () { return helpers_1.notifyEstimateLocked; } });
Object.defineProperty(exports, "notifyEstimateUnlocked", { enumerable: true, get: function () { return helpers_1.notifyEstimateUnlocked; } });
// Orders
Object.defineProperty(exports, "notifyOrderCreated", { enumerable: true, get: function () { return helpers_1.notifyOrderCreated; } });
Object.defineProperty(exports, "notifyOrderAssigned", { enumerable: true, get: function () { return helpers_1.notifyOrderAssigned; } });
Object.defineProperty(exports, "notifyOrderStarted", { enumerable: true, get: function () { return helpers_1.notifyOrderStarted; } });
Object.defineProperty(exports, "notifyOrderCompleted", { enumerable: true, get: function () { return helpers_1.notifyOrderCompleted; } });
// Bids
Object.defineProperty(exports, "notifyBidSubmitted", { enumerable: true, get: function () { return helpers_1.notifyBidSubmitted; } });
Object.defineProperty(exports, "notifyBidReceived", { enumerable: true, get: function () { return helpers_1.notifyBidReceived; } });
Object.defineProperty(exports, "notifyBidAccepted", { enumerable: true, get: function () { return helpers_1.notifyBidAccepted; } });
Object.defineProperty(exports, "notifyBidSyncComplete", { enumerable: true, get: function () { return helpers_1.notifyBidSyncComplete; } });
// Jobs
Object.defineProperty(exports, "notifyJobCompleted", { enumerable: true, get: function () { return helpers_1.notifyJobCompleted; } });
Object.defineProperty(exports, "notifyJobFailed", { enumerable: true, get: function () { return helpers_1.notifyJobFailed; } });
Object.defineProperty(exports, "notifyJobProgress", { enumerable: true, get: function () { return helpers_1.notifyJobProgress; } });
// Budget
Object.defineProperty(exports, "notifyBudgetUpdated", { enumerable: true, get: function () { return helpers_1.notifyBudgetUpdated; } });
Object.defineProperty(exports, "notifyBudgetAlert", { enumerable: true, get: function () { return helpers_1.notifyBudgetAlert; } });
// Activity
Object.defineProperty(exports, "notifyActivity", { enumerable: true, get: function () { return helpers_1.notifyActivity; } });
// Communication
Object.defineProperty(exports, "notifyMessageReceived", { enumerable: true, get: function () { return helpers_1.notifyMessageReceived; } });
Object.defineProperty(exports, "notifyDecisionNeeded", { enumerable: true, get: function () { return helpers_1.notifyDecisionNeeded; } });
Object.defineProperty(exports, "notifyDecisionResolved", { enumerable: true, get: function () { return helpers_1.notifyDecisionResolved; } });
// QA
Object.defineProperty(exports, "notifyQAIssue", { enumerable: true, get: function () { return helpers_1.notifyQAIssue; } });
Object.defineProperty(exports, "notifyInspectionPassed", { enumerable: true, get: function () { return helpers_1.notifyInspectionPassed; } });
// Payments
Object.defineProperty(exports, "notifyPaymentReceived", { enumerable: true, get: function () { return helpers_1.notifyPaymentReceived; } });
Object.defineProperty(exports, "notifyEscrowFunded", { enumerable: true, get: function () { return helpers_1.notifyEscrowFunded; } });
Object.defineProperty(exports, "notifyPayoutSent", { enumerable: true, get: function () { return helpers_1.notifyPayoutSent; } });
// Schedule
Object.defineProperty(exports, "notifyVisitScheduled", { enumerable: true, get: function () { return helpers_1.notifyVisitScheduled; } });
Object.defineProperty(exports, "notifyVisitComplete", { enumerable: true, get: function () { return helpers_1.notifyVisitComplete; } });
// System
Object.defineProperty(exports, "notifySystemMaintenance", { enumerable: true, get: function () { return helpers_1.notifySystemMaintenance; } });
Object.defineProperty(exports, "notifySystemAnnouncement", { enumerable: true, get: function () { return helpers_1.notifySystemAnnouncement; } });
// Crew Tracking
Object.defineProperty(exports, "notifyCrewArrived", { enumerable: true, get: function () { return helpers_1.notifyCrewArrived; } });
Object.defineProperty(exports, "notifyCrewDeparted", { enumerable: true, get: function () { return helpers_1.notifyCrewDeparted; } });
// Weather Reschedule
Object.defineProperty(exports, "notifyWeatherReschedule", { enumerable: true, get: function () { return helpers_1.notifyWeatherReschedule; } });
// Sensor Alerts
Object.defineProperty(exports, "notifySensorAlert", { enumerable: true, get: function () { return helpers_1.notifySensorAlert; } });
Object.defineProperty(exports, "notifySensorOffline", { enumerable: true, get: function () { return helpers_1.notifySensorOffline; } });
Object.defineProperty(exports, "notifySensorLowBattery", { enumerable: true, get: function () { return helpers_1.notifySensorLowBattery; } });
// ── Client-Side React Hooks ──────────────────────────────────
var useProjectChannel_1 = require("./hooks/useProjectChannel");
Object.defineProperty(exports, "useProjectChannel", { enumerable: true, get: function () { return useProjectChannel_1.useProjectChannel; } });
var useUserChannel_1 = require("./hooks/useUserChannel");
Object.defineProperty(exports, "useUserChannel", { enumerable: true, get: function () { return useUserChannel_1.useUserChannel; } });
var usePresence_1 = require("./hooks/usePresence");
Object.defineProperty(exports, "usePresence", { enumerable: true, get: function () { return usePresence_1.usePresence; } });
// ── Platform Presence ────────────────────────────────────────
var presence_1 = require("./presence");
Object.defineProperty(exports, "PLATFORM_PRESENCE_CHANNEL", { enumerable: true, get: function () { return presence_1.PLATFORM_PRESENCE_CHANNEL; } });
Object.defineProperty(exports, "projectPresenceChannel", { enumerable: true, get: function () { return presence_1.projectPresenceChannel; } });
Object.defineProperty(exports, "describeActivity", { enumerable: true, get: function () { return presence_1.describeActivity; } });
Object.defineProperty(exports, "generateInsights", { enumerable: true, get: function () { return presence_1.generateInsights; } });
Object.defineProperty(exports, "calculatePresenceStats", { enumerable: true, get: function () { return presence_1.calculatePresenceStats; } });
