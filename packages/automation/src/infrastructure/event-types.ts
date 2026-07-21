export interface KealeeEvent {
  id: string;
  eventType: string;
  sourceApp: string;
  projectId?: string;
  userId?: string;
  data: Record<string, any>;
  timestamp: number;
}

export const EVENT_TYPES = {
  // User & Onboarding
  USER_SIGNED_UP: 'user.signed_up',
  USER_ONBOARDING_COMPLETE: 'user.onboarding_complete',

  // Leads & Bids
  LEAD_CREATED: 'lead.created',
  BID_SUBMITTED: 'bid.submitted',
  BID_ACCEPTED: 'bid.accepted',
  BID_DEADLINE_REACHED: 'bid.deadline_reached',

  // Contracts & Escrow
  CONTRACT_GENERATED: 'contract.generated',
  CONTRACT_SIGNED: 'contract.signed',
  ESCROW_FUNDED: 'escrow.funded',
  PAYMENT_RELEASED: 'payment.released',

  // Projects
  PROJECT_ACTIVATED: 'project.activated',
  PROJECT_COMPLETED: 'project.completed',
  PROJECT_STATUS_CHANGED: 'project.status_changed',

  // Milestones & Tasks
  MILESTONE_COMPLETED: 'project.milestone.completed',
  TASK_COMPLETED: 'task.completed',
  TASK_OVERDUE: 'task.overdue',

  // Inspections & Permits
  INSPECTION_SCHEDULED: 'inspection.scheduled',
  INSPECTION_PASSED: 'inspection.passed',
  INSPECTION_FAILED: 'inspection.failed',
  PERMIT_SUBMITTED: 'permit.submitted',
  PERMIT_APPROVED: 'permit.approved',

  // Documents & Photos
  RECEIPT_UPLOADED: 'receipt.uploaded',
  SITE_PHOTO_UPLOADED: 'site_photo.uploaded',
  DOCUMENT_GENERATED: 'document.generated',

  // Budget & Schedule
  BUDGET_OVERRUN_DETECTED: 'budget.overrun_detected',
  SCHEDULE_DISRUPTION: 'schedule.disruption',
  CHANGE_ORDER_REQUESTED: 'change_order.requested',
  CHANGE_ORDER_APPROVED: 'change_order.approved',

  // Subscriptions
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_RENEWED: 'subscription.renewed',
  SUBSCRIPTION_CANCELED: 'subscription.canceled',

  // QA & Decisions
  QA_ISSUE_DETECTED: 'qa.issue_detected',
  DECISION_NEEDED: 'decision.needed',
  DECISION_MADE: 'decision.made',
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];
