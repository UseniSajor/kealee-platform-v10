/**
 * COMMUNICATIONS HUB WORKER
 *
 * Claw F -- docs-communication-claw
 *
 * Responsibilities:
 *   - Email delivery via Resend (SendGrid compatible)
 *   - SMS link-back delivery via Twilio (NEVER sends content, only links)
 *   - In-app notification delivery via WebSocket
 *   - Notification center management
 *   - Broadcast to project teams
 *
 * GUARDRAILS (PURE REPRESENTATION LAYER):
 *   - Cannot mutate contracts, budgets, schedules, or any domain data
 *   - Cannot make decisions or recommendations
 *   - Cannot trigger financial transactions
 *   - SMS must NEVER contain project content -- link-back only
 *   - Must call assertWritable() before every Prisma write
 *   - Only writes to: CommunicationLog, CommunicationTemplate, Message
 *
 * Queue: KEALEE_QUEUES.COMMUNICATION ('kealee-communication-hub')
 *
 * Job names:
 *   send-notification     -- route notification to appropriate channel
 *   send-email            -- direct email send via Resend
 *   send-sms-linkback     -- SMS with dashboard link only (never content)
 *   send-in-app           -- in-app notification via WebSocket
 *   broadcast             -- multi-channel broadcast to project team
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported communication channels */
export type CommChannel = 'EMAIL' | 'SMS' | 'IN_APP' | 'PUSH';

/** Notification priority levels */
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

/** Communication delivery status */
export type DeliveryStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';

/** Notification type definitions */
export type NotificationType =
  | 'CONTRACT_EXECUTED'
  | 'PERMIT_STATUS_UPDATE'
  | 'SCHEDULE_UPDATE'
  | 'DECISION_RECOMMENDED'
  | 'BUDGET_VARIANCE_ALERT'
  | 'INSPECTION_RESULT'
  | 'DOCUMENT_READY'
  | 'SIGNATURE_REQUESTED'
  | 'TASK_ASSIGNED'
  | 'TASK_OVERDUE'
  | 'BID_RECEIVED'
  | 'CHANGE_ORDER_UPDATE'
  | 'GENERAL';

/** Email send parameters */
export interface EmailSendParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: string; // base64
    contentType: string;
  }>;
}

/** SMS link-back parameters */
export interface SmsLinkbackParams {
  to: string;
  projectId: string;
  /** The dashboard path to link to (appended to APP_URL) */
  dashboardPath?: string;
}

/** In-app notification parameters */
export interface InAppNotificationParams {
  recipientId: string;
  title: string;
  body: string;
  type: NotificationType;
  projectId?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

/** Broadcast parameters */
export interface BroadcastParams {
  projectId: string;
  channels: CommChannel[];
  type: NotificationType;
  subject: string;
  body: string;
  priority?: NotificationPriority;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Notification Subject & Body Builders
// ---------------------------------------------------------------------------

/**
 * Build a notification subject line based on type and metadata.
 */
export function buildNotificationSubject(
  type: NotificationType,
  metadata?: Record<string, unknown>,
): string {
  const subjects: Record<NotificationType, string | ((m: Record<string, unknown>) => string)> = {
    CONTRACT_EXECUTED: 'Contract has been executed',
    PERMIT_STATUS_UPDATE: (m) =>
      `Permit status updated${m?.newStatus ? ` to ${m.newStatus}` : ''}`,
    SCHEDULE_UPDATE: 'Project schedule has been updated',
    DECISION_RECOMMENDED: 'New decision recommendation requires your review',
    BUDGET_VARIANCE_ALERT: 'Budget variance alert -- action required',
    INSPECTION_RESULT: (m) =>
      `Inspection ${m?.result === 'PASSED' ? 'passed' : 'requires attention'}`,
    DOCUMENT_READY: 'New document is ready for review',
    SIGNATURE_REQUESTED: 'Your signature is requested',
    TASK_ASSIGNED: 'New task has been assigned to you',
    TASK_OVERDUE: 'Task is overdue -- action required',
    BID_RECEIVED: 'New bid submission received',
    CHANGE_ORDER_UPDATE: 'Change order status updated',
    GENERAL: 'Kealee notification',
  };

  const builder = subjects[type] ?? subjects.GENERAL;
  if (typeof builder === 'function') {
    return builder(metadata ?? {});
  }
  return builder;
}

/**
 * Build a notification body based on type, project name, and metadata.
 */
export function buildNotificationBody(
  type: NotificationType,
  projectName: string,
  metadata?: Record<string, unknown>,
): string {
  const bodies: Record<NotificationType, string | ((p: string, m: Record<string, unknown>) => string)> = {
    CONTRACT_EXECUTED: (p) =>
      `The contract for ${p} has been executed. A signed copy is being generated.`,
    PERMIT_STATUS_UPDATE: (p, m) =>
      `Permit for ${p} changed from "${m.previousStatus ?? 'unknown'}" ` +
      `to "${m.newStatus ?? 'unknown'}".`,
    SCHEDULE_UPDATE: (p) =>
      `The schedule for ${p} has been updated. Please review in the dashboard.`,
    DECISION_RECOMMENDED: (p) =>
      `A new decision recommendation has been generated for ${p}. ` +
      `Please review and respond.`,
    BUDGET_VARIANCE_ALERT: (p) =>
      `A budget variance has been detected for ${p}. Please review and take action.`,
    INSPECTION_RESULT: (p, m) =>
      `Inspection for ${p} has ${m.result === 'PASSED' ? 'passed' : 'not passed'}. ` +
      `${m.findingCount ? `${m.findingCount} finding(s) recorded.` : ''}`,
    DOCUMENT_READY: (p) =>
      `A new document is ready for review on ${p}.`,
    SIGNATURE_REQUESTED: (p) =>
      `Your signature is requested on a document for ${p}.`,
    TASK_ASSIGNED: (p) =>
      `A new task has been assigned to you on ${p}.`,
    TASK_OVERDUE: (p) =>
      `A task on ${p} is overdue. Please take action.`,
    BID_RECEIVED: (p) =>
      `A new bid submission has been received for ${p}.`,
    CHANGE_ORDER_UPDATE: (p) =>
      `A change order on ${p} has been updated.`,
    GENERAL: (p) =>
      `Notification for ${p}.`,
  };

  const builder = bodies[type] ?? bodies.GENERAL;
  if (typeof builder === 'function') {
    return builder(projectName, metadata ?? {});
  }
  return builder;
}

// ---------------------------------------------------------------------------
// SMS Link-Back Helpers
// ---------------------------------------------------------------------------

/**
 * Build an SMS link-back message. Per Kealee policy, SMS messages contain
 * ONLY a short link to the dashboard -- never project content.
 *
 * @param projectId - The project ID for the dashboard link
 * @param dashboardPath - Optional custom path (defaults to /projects/{projectId})
 * @returns SMS body string with link only
 */
export function buildSmsLinkback(
  projectId: string,
  dashboardPath?: string,
): string {
  const baseUrl = process.env.APP_URL ?? 'https://app.kealee.com';
  const path = dashboardPath ?? `/projects/${projectId}`;
  return `Kealee alert for your project. View details: ${baseUrl}${path}`;
}

// ---------------------------------------------------------------------------
// Channel Routing
// ---------------------------------------------------------------------------

/**
 * Determine which channels to use based on notification priority.
 *
 * CRITICAL: EMAIL + SMS + IN_APP
 * HIGH:     EMAIL + IN_APP
 * NORMAL:   EMAIL or IN_APP (based on user preference)
 * LOW:      IN_APP only
 */
export function resolveChannelsForPriority(
  priority: NotificationPriority,
  userPreferredChannel?: CommChannel,
): CommChannel[] {
  switch (priority) {
    case 'CRITICAL':
      return ['EMAIL', 'SMS', 'IN_APP'];
    case 'HIGH':
      return ['EMAIL', 'IN_APP'];
    case 'NORMAL':
      return userPreferredChannel
        ? [userPreferredChannel, 'IN_APP']
        : ['EMAIL', 'IN_APP'];
    case 'LOW':
      return ['IN_APP'];
    default:
      return ['IN_APP'];
  }
}

// ---------------------------------------------------------------------------
// Rate Limiting Configuration
// ---------------------------------------------------------------------------

/**
 * Rate limits per channel to prevent abuse and comply with provider limits.
 */
export const CHANNEL_RATE_LIMITS: Record<CommChannel, {
  maxPerMinute: number;
  maxPerHour: number;
  maxPerDay: number;
}> = {
  EMAIL: { maxPerMinute: 50, maxPerHour: 500, maxPerDay: 5000 },
  SMS: { maxPerMinute: 10, maxPerHour: 100, maxPerDay: 500 },
  IN_APP: { maxPerMinute: 200, maxPerHour: 5000, maxPerDay: 50000 },
  PUSH: { maxPerMinute: 100, maxPerHour: 2000, maxPerDay: 20000 },
};

// ---------------------------------------------------------------------------
// Template Rendering
// ---------------------------------------------------------------------------

/**
 * Render a communication template with provided variables.
 * Supports {{variable}} syntax.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, unknown>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    if (value === undefined || value === null) return match;
    return String(value);
  });
}

/**
 * Validate that all required template variables are provided.
 */
export function validateTemplateVariables(
  template: string,
  variables: Record<string, unknown>,
): { valid: boolean; missing: string[] } {
  const requiredVars = Array.from(template.matchAll(/\{\{(\w+)\}\}/g)).map(
    (m) => m[1],
  );
  const uniqueVars = [...new Set(requiredVars)];
  const missing = uniqueVars.filter((v) => !(v in variables));

  return { valid: missing.length === 0, missing };
}

// ---------------------------------------------------------------------------
// Delivery Receipt Handling
// ---------------------------------------------------------------------------

/**
 * Map provider-specific status codes to Kealee delivery statuses.
 */
export function mapProviderStatus(
  provider: 'RESEND' | 'TWILIO' | 'WEBSOCKET',
  providerStatus: string,
): DeliveryStatus {
  const statusMaps: Record<string, Record<string, DeliveryStatus>> = {
    RESEND: {
      delivered: 'DELIVERED',
      sent: 'SENT',
      bounced: 'FAILED',
      complained: 'FAILED',
    },
    TWILIO: {
      delivered: 'DELIVERED',
      sent: 'SENT',
      queued: 'PENDING',
      failed: 'FAILED',
      undelivered: 'FAILED',
    },
    WEBSOCKET: {
      connected: 'DELIVERED',
      sent: 'SENT',
      disconnected: 'FAILED',
    },
  };

  return statusMaps[provider]?.[providerStatus] ?? 'PENDING';
}
