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

// ── Event Types ──────────────────────────────────────────────
export type {
  ChannelType,
  RealtimeEvent,
  EstimateEventType,
  EstimateEventPayload,
  OrderEventType,
  OrderEventPayload,
  BidEventType,
  BidEventPayload,
  JobEventType,
  JobEventPayload,
  BudgetEventType,
  BudgetEventPayload,
  ActivityEventType,
  ActivityEventPayload,
  CommunicationEventType,
  CommunicationEventPayload,
  QAEventType,
  QAEventPayload,
  PaymentEventType,
  PaymentEventPayload,
  ScheduleEventType,
  ScheduleEventPayload,
  SystemEventType,
  SystemEventPayload,
  PresenceUserInfo,
  KealeeEventType,
  KealeeEventPayload,
  CrewEventType,
  CrewEventPayload,
  SensorEventType,
  SensorEventPayload,
} from './events';

// ── Server-Side Broadcast ────────────────────────────────────
export {
  broadcastToUser,
  broadcastToProject,
  broadcastToOrg,
  broadcastSystemAlert,
} from './broadcast';

// ── Typed Convenience Helpers ────────────────────────────────
export {
  // Estimates
  notifyEstimateCreated,
  notifyEstimateUpdated,
  notifyEstimateStatusChanged,
  notifyEstimateCalculated,
  notifyEstimateLocked,
  notifyEstimateUnlocked,
  // Orders
  notifyOrderCreated,
  notifyOrderAssigned,
  notifyOrderStarted,
  notifyOrderCompleted,
  // Bids
  notifyBidSubmitted,
  notifyBidReceived,
  notifyBidAccepted,
  notifyBidSyncComplete,
  // Jobs
  notifyJobCompleted,
  notifyJobFailed,
  notifyJobProgress,
  // Budget
  notifyBudgetUpdated,
  notifyBudgetAlert,
  // Activity
  notifyActivity,
  // Communication
  notifyMessageReceived,
  notifyDecisionNeeded,
  notifyDecisionResolved,
  // QA
  notifyQAIssue,
  notifyInspectionPassed,
  // Payments
  notifyPaymentReceived,
  notifyEscrowFunded,
  notifyPayoutSent,
  // Schedule
  notifyVisitScheduled,
  notifyVisitComplete,
  // System
  notifySystemMaintenance,
  notifySystemAnnouncement,
  // Crew Tracking
  notifyCrewArrived,
  notifyCrewDeparted,
  // Weather Reschedule
  notifyWeatherReschedule,
  // Sensor Alerts
  notifySensorAlert,
  notifySensorOffline,
  notifySensorLowBattery,
} from './helpers';

// ── Client-Side React Hooks ──────────────────────────────────
export {
  useProjectChannel,
  type ProjectChannelHandlers,
} from './hooks/useProjectChannel';

export {
  useUserChannel,
  type UserChannelHandlers,
} from './hooks/useUserChannel';

export {
  usePresence,
  type UsePresenceReturn,
} from './hooks/usePresence';

// ── Platform Presence ────────────────────────────────────────
export {
  PLATFORM_PRESENCE_CHANNEL,
  projectPresenceChannel,
  describeActivity,
  generateInsights,
  calculatePresenceStats,
} from './presence';

export type {
  PlatformPresenceInfo,
  PresenceInsight,
  PresenceStats,
} from './presence';
