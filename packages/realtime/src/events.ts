/**
 * Kealee Realtime Event Types
 *
 * Central type definitions for all real-time events broadcast across
 * the platform. Both publishers (server-side) and subscribers (client hooks)
 * share these types as their contract.
 */

// ── Channel Types ────────────────────────────────────────────

export type ChannelType = 'user' | 'project' | 'org' | 'system';

// ── Base Event ───────────────────────────────────────────────

export interface RealtimeEvent<T extends string = string, P = unknown> {
  /** Dotted event name, e.g. 'estimate.created' */
  event: T;
  /** Typed payload for this event */
  payload: P;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Source app identifier, e.g. 'estimation-tool', 'bid-engine' */
  source: string;
  /** User who triggered the event (omitted for system events) */
  userId?: string;
  /** Optional correlation ID for tracing */
  correlationId?: string;
}

// ── Estimate Events ──────────────────────────────────────────

export type EstimateEventType =
  | 'estimate.created'
  | 'estimate.updated'
  | 'estimate.status_changed'
  | 'estimate.calculated'
  | 'estimate.locked'
  | 'estimate.unlocked'
  | 'estimate.exported'
  | 'estimate.deleted';

export interface EstimateEventPayload {
  estimateId: string;
  projectId: string;
  organizationId: string;
  name: string;
  status?: string;
  previousStatus?: string;
  totalCost?: number;
  updatedBy?: string;
}

// ── Order Events ─────────────────────────────────────────────

export type OrderEventType =
  | 'order.created'
  | 'order.assigned'
  | 'order.started'
  | 'order.completed'
  | 'order.cancelled'
  | 'order.hold';

export interface OrderEventPayload {
  orderId: string;
  projectId: string;
  organizationId: string;
  title: string;
  type: string;
  status: string;
  assignedTo?: string;
  assignedTeam?: string;
  priority?: string;
}

// ── Bid Events ───────────────────────────────────────────────

export type BidEventType =
  | 'bid.submitted'
  | 'bid.received'
  | 'bid.accepted'
  | 'bid.rejected'
  | 'bid.sync_complete'
  | 'bid.deadline_approaching';

export interface BidEventPayload {
  bidRequestId?: string;
  bidId?: string;
  estimateId?: string;
  projectId: string;
  organizationId: string;
  amount?: number;
  contractorName?: string;
  deadlineDays?: number;
}

// ── Job / Worker Events ──────────────────────────────────────

export type JobEventType =
  | 'job.completed'
  | 'job.failed'
  | 'job.progress';

export interface JobEventPayload {
  jobId: string;
  jobType: string;
  organizationId?: string;
  progress?: number;
  result?: unknown;
  error?: string;
}

// ── Budget Events ────────────────────────────────────────────

export type BudgetEventType =
  | 'budget.updated'
  | 'budget.threshold_warning'
  | 'budget.transfer_complete';

export interface BudgetEventPayload {
  projectId: string;
  organizationId: string;
  currentSpend?: number;
  totalBudget?: number;
  percentUsed?: number;
  variance?: number;
  thresholdType?: 'warning' | 'critical';
  message?: string;
}

// ── Activity Events ──────────────────────────────────────────

export type ActivityEventType =
  | 'activity.comment'
  | 'activity.file_upload'
  | 'activity.photo_uploaded'
  | 'activity.milestone'
  | 'activity.status_change'
  | 'activity.task_complete';

export interface ActivityEventPayload {
  projectId: string;
  actorId: string;
  actorName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  description: string;
  metadata?: Record<string, unknown>;
}

// ── Communication Events ─────────────────────────────────────

export type CommunicationEventType =
  | 'message.received'
  | 'decision.needed'
  | 'decision.resolved';

export interface CommunicationEventPayload {
  projectId?: string;
  organizationId?: string;
  from?: string;
  fromName?: string;
  preview?: string;
  title?: string;
  type?: string;
  outcome?: string;
}

// ── QA Events ────────────────────────────────────────────────

export type QAEventType =
  | 'qa.issue_found'
  | 'qa.inspection_passed'
  | 'qa.inspection_corrections';

export interface QAEventPayload {
  projectId: string;
  organizationId: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  photoUrl?: string;
  inspectionId?: string;
}

// ── Payment Events ───────────────────────────────────────────

export type PaymentEventType =
  | 'payment.received'
  | 'payment.released'
  | 'escrow.funded'
  | 'payout.sent';

export interface PaymentEventPayload {
  projectId?: string;
  organizationId?: string;
  amount: number;
  milestone?: string;
  contractorId?: string;
  contractorName?: string;
}

// ── Schedule Events ──────────────────────────────────────────

export type ScheduleEventType =
  | 'schedule.updated'
  | 'visit.scheduled'
  | 'visit.complete'
  | 'schedule.weather_rescheduled'
  | 'schedule.weather_alert';

export interface ScheduleEventPayload {
  projectId: string;
  organizationId: string;
  date?: string;
  pmName?: string;
  visitId?: string;
  photoCount?: number;
  /** Weather reschedule details */
  taskName?: string;
  trade?: string;
  originalDate?: string;
  newDate?: string;
  reason?: string;
  autoRescheduled?: boolean;
}

// ── System Events ────────────────────────────────────────────

export type SystemEventType =
  | 'system.maintenance'
  | 'system.announcement'
  | 'system.config_changed'
  | 'system.alert';

export interface SystemEventPayload {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  actionUrl?: string;
  expiresAt?: string;
}

// ── Presence ─────────────────────────────────────────────────

export interface PresenceUserInfo {
  userId: string;
  name: string;
  avatar?: string;
  role?: string;
  lastSeen?: string;
  status?: 'online' | 'on-site' | 'away';
}

// ── Autonomy Events ─────────────────────────────────────────

export type AutonomyEventType =
  | 'autonomous_action.executed'
  | 'autonomous_action.escalated'
  | 'autonomous_action.reverted'
  | 'autonomous_action.reviewed';

export interface AutonomyEventPayload {
  projectId: string;
  actionLogId: string;
  appSource: string;
  category: string;
  actionType: string;
  decision: string;
  description: string;
  amount?: number;
  confidence?: number;
  reasoning?: string;
  revertedBy?: string;
  reviewedBy?: string;
}

// ── Contractor Scoring Events ───────────────────────────────

export type ScoringEventType =
  | 'scoring.contractor_updated'
  | 'scoring.contractor_recalculated';

export interface ScoringEventPayload {
  contractorId: string;
  overallScore: number;
  previousScore?: number;
  confidence: string;
  changedComponent?: string;
  projectsCompleted?: number;
}

// ── Crew Tracking Events ────────────────────────────────────

export type CrewEventType =
  | 'crew.arrived'
  | 'crew.departed';

export interface CrewEventPayload {
  projectId: string;
  userId: string;
  userName: string;
  type: 'ARRIVE' | 'DEPART';
  verified: boolean;
  hoursOnSite?: number;
  timestamp: string;
}

// ── Sensor Events ──────────────────────────────────────────

export type SensorEventType =
  | 'sensor.alert'
  | 'sensor.device_offline'
  | 'sensor.device_online'
  | 'sensor.low_battery';

export interface SensorEventPayload {
  projectId: string;
  deviceId: string;
  deviceName: string;
  sensorType: string;
  location: string;
  value: number;
  unit: string;
  threshold?: number;
  alertType?: 'above_threshold' | 'below_threshold' | 'rate_of_change' | 'offline' | 'low_battery';
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

// ── Union Types ──────────────────────────────────────────────

export type KealeeEventType =
  | EstimateEventType
  | OrderEventType
  | BidEventType
  | JobEventType
  | BudgetEventType
  | ActivityEventType
  | CommunicationEventType
  | QAEventType
  | PaymentEventType
  | ScheduleEventType
  | SystemEventType
  | AutonomyEventType
  | ScoringEventType
  | CrewEventType
  | SensorEventType;

export type KealeeEventPayload =
  | EstimateEventPayload
  | OrderEventPayload
  | BidEventPayload
  | JobEventPayload
  | BudgetEventPayload
  | ActivityEventPayload
  | CommunicationEventPayload
  | QAEventPayload
  | PaymentEventPayload
  | ScheduleEventPayload
  | SystemEventPayload
  | AutonomyEventPayload
  | ScoringEventPayload
  | CrewEventPayload
  | SensorEventPayload;
