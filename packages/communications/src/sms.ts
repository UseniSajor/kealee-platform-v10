/**
 * SMS & WhatsApp Service via Twilio
 *
 * Handles all outbound SMS and WhatsApp messages for the Kealee Platform.
 */

import twilio from 'twilio';
import { PrismaClient } from '@kealee/database';

const prisma = new PrismaClient();

let twilioClient: twilio.Twilio | null = null;

function getTwilioClient(): twilio.Twilio {
  if (twilioClient) return twilioClient;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be configured');
  }
  twilioClient = twilio(sid, token);
  return twilioClient;
}

const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+15005550006';

// E.164 phone number format validation
const E164_REGEX = /^\+[1-9]\d{1,14}$/;

export interface SendSMSOptions {
  to: string;
  body: string;
  userId?: string;
  projectId?: string;
}

export interface SendSMSResult {
  messageSid: string;
  status: string;
}

/**
 * Send an SMS message via Twilio.
 */
export async function sendSMS(opts: SendSMSOptions): Promise<SendSMSResult> {
  if (!E164_REGEX.test(opts.to)) {
    throw new Error(`Invalid phone number format: ${opts.to}. Must be E.164 format (+1XXXXXXXXXX)`);
  }

  const client = getTwilioClient();
  const truncatedBody = opts.body.substring(0, 1600);

  const message = await client.messages.create({
    body: truncatedBody,
    from: FROM_NUMBER,
    to: opts.to,
  });

  // Log to CommunicationLog
  await prisma.communicationLog.create({
    data: {
      channel: 'SMS',
      type: 'NOTIFICATION',
      recipientPhone: opts.to,
      clientId: opts.userId,
      projectId: opts.projectId,
      body: truncatedBody,
      status: 'SENT',
      sentAt: new Date(),
      metadata: {
        messageSid: message.sid,
        twilioStatus: message.status,
      },
    },
  });

  return {
    messageSid: message.sid,
    status: message.status,
  };
}

export interface SendWhatsAppOptions {
  to: string;
  body: string;
  userId?: string;
  projectId?: string;
}

/**
 * Send a WhatsApp message via Twilio.
 */
export async function sendWhatsApp(opts: SendWhatsAppOptions): Promise<SendSMSResult> {
  if (!E164_REGEX.test(opts.to)) {
    throw new Error(`Invalid phone number format: ${opts.to}. Must be E.164 format (+1XXXXXXXXXX)`);
  }

  const client = getTwilioClient();
  const truncatedBody = opts.body.substring(0, 1600);

  const message = await client.messages.create({
    body: truncatedBody,
    from: `whatsapp:${FROM_NUMBER}`,
    to: `whatsapp:${opts.to}`,
  });

  // Log to CommunicationLog
  await prisma.communicationLog.create({
    data: {
      channel: 'SMS',
      type: 'NOTIFICATION',
      recipientPhone: opts.to,
      clientId: opts.userId,
      projectId: opts.projectId,
      body: truncatedBody,
      status: 'SENT',
      sentAt: new Date(),
      metadata: {
        messageSid: message.sid,
        twilioStatus: message.status,
        channel: 'whatsapp',
      },
    },
  });

  return {
    messageSid: message.sid,
    status: message.status,
  };
}

/**
 * SMS Templates - Short versions of email templates.
 * Kept under 160 chars where possible for single-segment SMS.
 */
export const SMS_TEMPLATES = {
  WELCOME: (name: string) =>
    `Welcome to Kealee, ${name}! Your account is ready. Log in: app.kealee.com`,

  NEW_LEAD: (projectType: string, location: string) =>
    `New ${projectType} lead in ${location}. Bid now: app.kealee.com/leads`,

  BID_SUBMITTED: (projectName: string) =>
    `New bid received on ${projectName}. Review it now: app.kealee.com`,

  BID_ACCEPTED: (projectName: string) =>
    `Your bid was accepted for ${projectName}! Check your dashboard for next steps.`,

  CONTRACT_SIGNED: (projectName: string) =>
    `Contract signed for ${projectName}. Work can now begin!`,

  MILESTONE_COMPLETE: (milestoneName: string) =>
    `${milestoneName} is complete. Please review and approve payment: app.kealee.com`,

  PAYMENT_RELEASED: (amount: string) =>
    `Payment of ${amount} has been released to your account.`,

  PAYMENT_FAILED: () =>
    `Your Kealee payment failed. Update your payment method to avoid interruption: app.kealee.com/billing`,

  INSPECTION_REMINDER: (date: string, address: string) =>
    `Inspection reminder: ${date} at ${address}. Be prepared.`,

  INSPECTION_PASSED: (projectName: string) =>
    `Inspection passed for ${projectName}! Milestone can proceed.`,

  INSPECTION_FAILED: (projectName: string) =>
    `Inspection failed for ${projectName}. Issues need correction.`,

  QA_ISSUE: (severity: string) =>
    `${severity} QA issue found. Correction required: app.kealee.com`,

  DECISION_NEEDED: (title: string) =>
    `Action needed: ${title}. Review and decide: app.kealee.com`,

  BUDGET_ALERT: (projectName: string) =>
    `Budget alert for ${projectName}. Review the overrun: app.kealee.com`,

  WEEKLY_REPORT: (projectName: string) =>
    `Your weekly report for ${projectName} is ready: app.kealee.com`,

  SCHEDULE_DISRUPTION: (projectName: string) =>
    `Schedule disruption on ${projectName}. Review impact: app.kealee.com`,

  CHANGE_ORDER: (projectName: string) =>
    `Change order requested for ${projectName}. Review: app.kealee.com`,

  DOCUMENT_READY: (docType: string) =>
    `Your ${docType} is ready for review: app.kealee.com`,

  PROJECT_COMPLETED: (projectName: string) =>
    `${projectName} is complete! View your project summary: app.kealee.com`,

  ESCROW_FUNDED: (amount: string) =>
    `Escrow funded with ${amount}. Project can proceed.`,

  SUBSCRIPTION_CONFIRMED: () =>
    `Your Kealee subscription is confirmed. Welcome aboard!`,
};
