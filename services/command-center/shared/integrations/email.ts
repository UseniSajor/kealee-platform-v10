/**
 * KEALEE COMMAND CENTER - EMAIL INTEGRATION
 * SendGrid Email Service
 */

import sgMail, { MailDataRequired } from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Email template IDs
export const EMAIL_TEMPLATES = {
  // Bid Engine
  BID_INVITATION: 'd-bid-invitation-template',
  BID_RECEIVED: 'd-bid-received-template',
  BID_AWARDED: 'd-bid-awarded-template',
  BID_NOT_SELECTED: 'd-bid-not-selected-template',

  // Visit Scheduler
  VISIT_SCHEDULED: 'd-visit-scheduled-template',
  VISIT_REMINDER: 'd-visit-reminder-template',
  VISIT_CANCELLED: 'd-visit-cancelled-template',

  // Reports
  REPORT_DELIVERY: 'd-report-delivery-template',
  REPORT_DAILY: 'd-report-daily-template',
  REPORT_WEEKLY: 'd-report-weekly-template',
  REPORT_MONTHLY: 'd-report-monthly-template',

  // Permits & Inspections
  PERMIT_STATUS: 'd-permit-status-template',
  PERMIT_APPROVED: 'd-permit-approved-template',
  PERMIT_EXPIRING: 'd-permit-expiring-template',
  INSPECTION_SCHEDULED: 'd-inspection-scheduled-template',
  INSPECTION_RESULT: 'd-inspection-result-template',

  // Change Orders
  CHANGE_ORDER_REQUEST: 'd-change-order-request-template',
  CHANGE_ORDER_APPROVED: 'd-change-order-approved-template',
  CHANGE_ORDER_REJECTED: 'd-change-order-rejected-template',

  // Budget & Finance
  BUDGET_ALERT: 'd-budget-alert-template',
  INVOICE_READY: 'd-invoice-ready-template',
  PAYMENT_RECEIVED: 'd-payment-received-template',

  // Tasks
  TASK_ASSIGNED: 'd-task-assigned-template',
  TASK_OVERDUE: 'd-task-overdue-template',

  // AI Alerts
  RISK_ALERT: 'd-risk-alert-template',
  QA_ISSUE_ALERT: 'd-qa-issue-alert-template',

  // Documents
  DOCUMENT_READY: 'd-document-ready-template',
  SIGNATURE_REQUESTED: 'd-signature-requested-template',
  DOCUMENT_SIGNED: 'd-document-signed-template',
} as const;

export type EmailTemplate = typeof EMAIL_TEMPLATES[keyof typeof EMAIL_TEMPLATES];

// Email parameters
export interface EmailParams {
  to: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  templateId?: EmailTemplate;
  dynamicTemplateData?: Record<string, unknown>;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition?: 'attachment' | 'inline';
    contentId?: string;
  }>;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  categories?: string[];
}

// Default sender
const DEFAULT_FROM = {
  email: process.env.SENDGRID_FROM_EMAIL || 'noreply@kealee.com',
  name: process.env.SENDGRID_FROM_NAME || 'Kealee',
};

/**
 * Send a single email
 */
export async function sendEmail(params: EmailParams): Promise<string> {
  const msg: MailDataRequired = {
    to: params.to,
    from: DEFAULT_FROM,
    subject: params.subject,
    html: params.html,
    text: params.text,
    templateId: params.templateId,
    dynamicTemplateData: params.dynamicTemplateData,
    attachments: params.attachments,
    cc: params.cc,
    bcc: params.bcc,
    replyTo: params.replyTo,
    categories: params.categories,
  };

  const [response] = await sgMail.send(msg);
  return response.headers['x-message-id'] as string;
}

/**
 * Send multiple emails (batch)
 */
export async function sendBulkEmails(
  emails: EmailParams[]
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const messages: MailDataRequired[] = emails.map(params => ({
    to: params.to,
    from: DEFAULT_FROM,
    subject: params.subject,
    html: params.html,
    text: params.text,
    templateId: params.templateId,
    dynamicTemplateData: params.dynamicTemplateData,
    attachments: params.attachments,
  }));

  const results = { sent: 0, failed: 0, errors: [] as string[] };

  try {
    await sgMail.send(messages);
    results.sent = messages.length;
  } catch (error: unknown) {
    const err = error as { response?: { body?: { errors?: Array<{ message: string }> } } };
    results.failed = messages.length;
    results.errors = err.response?.body?.errors?.map((e: { message: string }) => e.message) || ['Unknown error'];
  }

  return results;
}

/**
 * Send bid invitation email
 */
export async function sendBidInvitation(params: {
  contractorEmail: string;
  contractorName: string;
  projectName: string;
  projectAddress: string;
  deadline: Date;
  bidLink: string;
  matchScore?: number;
  matchReasons?: string[];
}): Promise<string> {
  return sendEmail({
    to: params.contractorEmail,
    templateId: EMAIL_TEMPLATES.BID_INVITATION,
    dynamicTemplateData: {
      contractor_name: params.contractorName,
      project_name: params.projectName,
      project_address: params.projectAddress,
      deadline: params.deadline.toLocaleDateString(),
      deadline_time: params.deadline.toLocaleTimeString(),
      bid_link: params.bidLink,
      match_score: params.matchScore,
      match_reasons: params.matchReasons,
    },
    categories: ['bid-invitation', 'contractor'],
  });
}

/**
 * Send visit reminder email
 */
export async function sendVisitReminder(params: {
  pmEmail: string;
  pmName: string;
  projectName: string;
  projectAddress: string;
  visitDate: Date;
  visitType: string;
  notes?: string;
}): Promise<string> {
  return sendEmail({
    to: params.pmEmail,
    templateId: EMAIL_TEMPLATES.VISIT_REMINDER,
    dynamicTemplateData: {
      pm_name: params.pmName,
      project_name: params.projectName,
      project_address: params.projectAddress,
      visit_date: params.visitDate.toLocaleDateString(),
      visit_time: params.visitDate.toLocaleTimeString(),
      visit_type: params.visitType,
      notes: params.notes,
    },
    categories: ['visit-reminder', 'pm'],
  });
}

/**
 * Send report to recipients
 */
export async function sendReport(params: {
  recipients: string[];
  reportType: 'daily' | 'weekly' | 'monthly' | 'final';
  projectName: string;
  periodStart: Date;
  periodEnd: Date;
  summary: string;
  pdfAttachment?: { content: string; filename: string };
}): Promise<string> {
  const templateMap = {
    daily: EMAIL_TEMPLATES.REPORT_DAILY,
    weekly: EMAIL_TEMPLATES.REPORT_WEEKLY,
    monthly: EMAIL_TEMPLATES.REPORT_MONTHLY,
    final: EMAIL_TEMPLATES.REPORT_DELIVERY,
  };

  return sendEmail({
    to: params.recipients,
    templateId: templateMap[params.reportType],
    dynamicTemplateData: {
      project_name: params.projectName,
      report_type: params.reportType,
      period_start: params.periodStart.toLocaleDateString(),
      period_end: params.periodEnd.toLocaleDateString(),
      summary: params.summary,
    },
    attachments: params.pdfAttachment ? [{
      content: params.pdfAttachment.content,
      filename: params.pdfAttachment.filename,
      type: 'application/pdf',
      disposition: 'attachment',
    }] : undefined,
    categories: ['report', params.reportType],
  });
}

/**
 * Send budget alert
 */
export async function sendBudgetAlert(params: {
  pmEmail: string;
  pmName: string;
  projectName: string;
  alertType: 'threshold_exceeded' | 'variance_detected' | 'over_budget';
  currentSpend: number;
  budget: number;
  variance: number;
  details: string;
}): Promise<string> {
  return sendEmail({
    to: params.pmEmail,
    templateId: EMAIL_TEMPLATES.BUDGET_ALERT,
    dynamicTemplateData: {
      pm_name: params.pmName,
      project_name: params.projectName,
      alert_type: params.alertType,
      current_spend: params.currentSpend.toLocaleString(),
      budget: params.budget.toLocaleString(),
      variance: params.variance.toLocaleString(),
      variance_percent: ((params.variance / params.budget) * 100).toFixed(1),
      details: params.details,
    },
    categories: ['budget-alert', 'pm', params.alertType],
  });
}

/**
 * Send risk alert
 */
export async function sendRiskAlert(params: {
  recipients: string[];
  projectName: string;
  riskType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendations: string[];
}): Promise<string> {
  return sendEmail({
    to: params.recipients,
    templateId: EMAIL_TEMPLATES.RISK_ALERT,
    dynamicTemplateData: {
      project_name: params.projectName,
      risk_type: params.riskType,
      severity: params.severity,
      description: params.description,
      recommendations: params.recommendations,
    },
    categories: ['risk-alert', params.severity],
  });
}
