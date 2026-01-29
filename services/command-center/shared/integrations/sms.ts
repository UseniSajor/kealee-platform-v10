/**
 * KEALEE COMMAND CENTER - SMS INTEGRATION
 * Twilio SMS/WhatsApp Service
 */

import twilio from 'twilio';

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const SMS_FROM = process.env.TWILIO_PHONE_NUMBER!;
const WHATSAPP_FROM = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

// SMS message types
export type SMSType =
  | 'visit_reminder'
  | 'inspection_alert'
  | 'urgent_task'
  | 'bid_deadline'
  | 'approval_needed'
  | 'emergency_alert'
  | 'general';

// SMS templates
const SMS_TEMPLATES: Record<SMSType, string> = {
  visit_reminder: 'Kealee Reminder: Site visit at {project} scheduled for {time}. Address: {address}',
  inspection_alert: 'Kealee Alert: Inspection {status} for {project}. {details}',
  urgent_task: 'Kealee URGENT: {task} requires immediate attention for {project}. Due: {deadline}',
  bid_deadline: 'Kealee: Bid deadline approaching for {project}. {count} bids received. Deadline: {deadline}',
  approval_needed: 'Kealee: Your approval is needed for {item} on {project}. Review: {link}',
  emergency_alert: 'Kealee EMERGENCY: {alert} at {project}. Immediate action required. {contact}',
  general: '{message}',
};

interface SMSParams {
  to: string;
  type?: SMSType;
  variables?: Record<string, string>;
  body?: string; // Direct body content (alternative to type+variables)
}

/**
 * Format phone number to E.164 format
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Add US country code if not present
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }

  // Already has country code
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }

  throw new Error(`Invalid phone number format: ${phone}`);
}

/**
 * Build SMS message from template
 */
function buildMessage(type: SMSType, variables: Record<string, string>): string {
  let message = SMS_TEMPLATES[type];

  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(new RegExp(`{${key}}`, 'g'), value);
  }

  return message;
}

/**
 * Send SMS message
 */
export async function sendSMS(params: SMSParams): Promise<string> {
  // Use direct body if provided, otherwise build from template
  const body = params.body || (params.type && params.variables ? buildMessage(params.type, params.variables) : '');
  if (!body) {
    throw new Error('Either body or type+variables must be provided');
  }
  const to = formatPhoneNumber(params.to);

  const message = await client.messages.create({
    body,
    from: SMS_FROM,
    to,
  });

  return message.sid;
}

/**
 * Send WhatsApp message
 */
export async function sendWhatsApp(params: SMSParams): Promise<string> {
  const body = buildMessage(params.type, params.variables);
  const to = `whatsapp:${formatPhoneNumber(params.to)}`;

  const message = await client.messages.create({
    body,
    from: WHATSAPP_FROM,
    to,
  });

  return message.sid;
}

/**
 * Send bulk SMS messages
 */
export async function sendBulkSMS(
  messages: SMSParams[]
): Promise<{ sent: number; failed: number; sids: string[] }> {
  const results = { sent: 0, failed: 0, sids: [] as string[] };

  for (const params of messages) {
    try {
      const sid = await sendSMS(params);
      results.sids.push(sid);
      results.sent++;
    } catch (error) {
      console.error(`Failed to send SMS to ${params.to}:`, error);
      results.failed++;
    }
  }

  return results;
}

// Convenience functions for common scenarios

/**
 * Send visit reminder SMS
 */
export async function sendVisitReminderSMS(params: {
  phone: string;
  project: string;
  time: string;
  address: string;
}): Promise<string> {
  return sendSMS({
    to: params.phone,
    type: 'visit_reminder',
    variables: {
      project: params.project,
      time: params.time,
      address: params.address,
    },
  });
}

/**
 * Send inspection alert SMS
 */
export async function sendInspectionAlertSMS(params: {
  phone: string;
  project: string;
  status: 'PASSED' | 'FAILED' | 'SCHEDULED';
  details: string;
}): Promise<string> {
  return sendSMS({
    to: params.phone,
    type: 'inspection_alert',
    variables: {
      project: params.project,
      status: params.status,
      details: params.details,
    },
  });
}

/**
 * Send urgent task SMS
 */
export async function sendUrgentTaskSMS(params: {
  phone: string;
  task: string;
  project: string;
  deadline: string;
}): Promise<string> {
  return sendSMS({
    to: params.phone,
    type: 'urgent_task',
    variables: {
      task: params.task,
      project: params.project,
      deadline: params.deadline,
    },
  });
}

/**
 * Send emergency alert SMS to multiple recipients
 */
export async function sendEmergencyAlert(params: {
  phones: string[];
  alert: string;
  project: string;
  contact: string;
}): Promise<{ sent: number; failed: number }> {
  const messages = params.phones.map(phone => ({
    to: phone,
    type: 'emergency_alert' as SMSType,
    variables: {
      alert: params.alert,
      project: params.project,
      contact: params.contact,
    },
  }));

  const result = await sendBulkSMS(messages);
  return { sent: result.sent, failed: result.failed };
}
