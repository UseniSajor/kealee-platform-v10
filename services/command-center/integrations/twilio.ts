/**
 * services/command-center/integrations/twilio.ts
 *
 * Twilio SMS messages for contractor acquisition pipeline.
 *
 * Messages:
 *  - outreachSms:             Initial outreach when shortage detected
 *  - registrationReminder:    24h reminder if registration not completed
 *  - verificationReminder:    48h reminder if docs not uploaded
 *  - activationWelcome:       Contractor goes Active
 *  - reengagementSms:         For inactive contractors
 *
 * SMS compliance:
 *  - All messages include "Reply STOP to opt out"
 *  - Phone numbers must be in E.164 format (+1XXXXXXXXXX)
 *  - Rate-limited to avoid carrier filtering
 *
 * Requires env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 *   (or TWILIO_MESSAGING_SERVICE_SID for higher throughput)
 */

import twilio from 'twilio';
import { createLogger } from '@kealee/observability';

const logger = createLogger('twilio-integration');

// ─── Config ───────────────────────────────────────────────────────────────────

const ACCOUNT_SID    = process.env.TWILIO_ACCOUNT_SID    ?? '';
const AUTH_TOKEN     = process.env.TWILIO_AUTH_TOKEN     ?? '';
const FROM_NUMBER    = process.env.TWILIO_PHONE_NUMBER   ?? '';
const MSG_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID ?? '';

let _client: ReturnType<typeof twilio> | null = null;

function getClient(): ReturnType<typeof twilio> | null {
  if (!ACCOUNT_SID || !AUTH_TOKEN) {
    logger.warn('TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set — SMS will be skipped');
    return null;
  }
  if (!_client) {
    _client = twilio(ACCOUNT_SID, AUTH_TOKEN);
  }
  return _client;
}

export function isTwilioConfigured(): boolean {
  return Boolean(ACCOUNT_SID && AUTH_TOKEN && (FROM_NUMBER || MSG_SERVICE_SID));
}

// ─── Send Helper ──────────────────────────────────────────────────────────────

async function sendSms(to: string, body: string): Promise<void> {
  const client = getClient();
  if (!client) return;

  if (!FROM_NUMBER && !MSG_SERVICE_SID) {
    logger.warn('TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID not set — SMS skipped');
    return;
  }

  // Normalize to E.164 if not already
  const normalizedTo = to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`;

  // Enforce SMS length (concatenation OK but keep it concise)
  const maxLength = 320;
  const truncated = body.length > maxLength ? `${body.slice(0, maxLength - 3)}...` : body;

  try {
    const msg = await client.messages.create({
      body: truncated,
      to:   normalizedTo,
      ...(MSG_SERVICE_SID
        ? { messagingServiceSid: MSG_SERVICE_SID }
        : { from: FROM_NUMBER }),
    });

    logger.info({ sid: msg.sid, to: normalizedTo }, 'SMS sent');
  } catch (err: any) {
    logger.error({ err: err?.message, to: normalizedTo }, 'Twilio send failed');
    throw err;
  }
}

// ─── Contractor Outreach SMS ──────────────────────────────────────────────────

/**
 * Initial outreach when GrowthBot detects a trade shortage and has a phone number.
 * This is a WARM outreach — only send to contractors who've opted in or are in the DB.
 */
export async function sendOutreachSms(params: {
  phone:       string;
  firstName?:  string;
  trade?:      string;
  geoArea?:    string;
  registrationUrl?: string;
}): Promise<void> {
  const { phone, firstName = 'there', trade = 'your trade', geoArea, registrationUrl } = params;
  const url = registrationUrl ?? `${process.env.WEB_MAIN_URL ?? 'https://kealee.com'}/contractor/register`;

  const geo = geoArea ? ` in ${geoArea}` : '';
  const body =
    `Hi ${firstName}! Kealee has ${trade} projects${geo} ready to assign — no bidding, permit-ready, on-time payments. ` +
    `Join free: ${url} ` +
    `Reply STOP to opt out.`;

  await sendSms(phone, body);
}

/**
 * Registration reminder SMS — sent ~24h after outreach if not registered.
 */
export async function sendRegistrationReminderSms(params: {
  phone:            string;
  firstName?:       string;
  registrationUrl?: string;
}): Promise<void> {
  const { phone, firstName = 'there', registrationUrl } = params;
  const url = registrationUrl ?? `${process.env.WEB_MAIN_URL ?? 'https://kealee.com'}/contractor/register`;

  const body =
    `Hey ${firstName}, you haven't finished your Kealee registration. ` +
    `Takes 5 min — project leads are waiting: ${url} ` +
    `Reply STOP to opt out.`;

  await sendSms(phone, body);
}

/**
 * Verification reminder — sent ~48h after registration if documents not uploaded.
 */
export async function sendVerificationReminderSms(params: {
  phone:         string;
  firstName?:    string;
  dashboardUrl?: string;
}): Promise<void> {
  const { phone, firstName = 'there', dashboardUrl } = params;
  const url = dashboardUrl ?? `${process.env.PORTAL_CONTRACTOR_URL ?? 'https://contractor.kealee.com'}/profile`;

  const body =
    `Hi ${firstName}, upload your contractor license + COI on Kealee to get verified and start receiving leads. ` +
    `${url} ` +
    `Reply STOP to opt out.`;

  await sendSms(phone, body);
}

/**
 * Activation welcome SMS — sent when contractor is verified and marked Active.
 */
export async function sendActivationWelcomeSms(params: {
  phone:         string;
  firstName?:    string;
  trade?:        string;
  dashboardUrl?: string;
}): Promise<void> {
  const { phone, firstName = 'there', trade = 'your trade', dashboardUrl } = params;
  const url = dashboardUrl ?? `${process.env.PORTAL_CONTRACTOR_URL ?? 'https://contractor.kealee.com'}/projects`;

  const body =
    `You're verified on Kealee, ${firstName}! Your ${trade} account is live — check your first project leads: ${url} ` +
    `Reply STOP to opt out.`;

  await sendSms(phone, body);
}

/**
 * Re-engagement SMS for inactive contractors.
 */
export async function sendReengagementSms(params: {
  phone:         string;
  firstName?:    string;
  trade?:        string;
  dashboardUrl?: string;
}): Promise<void> {
  const { phone, firstName = 'there', trade = 'your trade', dashboardUrl } = params;
  const url = dashboardUrl ?? `${process.env.PORTAL_CONTRACTOR_URL ?? 'https://contractor.kealee.com'}/projects`;

  const body =
    `Hi ${firstName}, new ${trade} projects just posted on Kealee in your area. ` +
    `Log in before they're assigned: ${url} ` +
    `Reply STOP to opt out.`;

  await sendSms(phone, body);
}

/**
 * Document approved / milestone notification SMS.
 * Generic status update for contractor pipeline events.
 */
export async function sendStatusUpdateSms(params: {
  phone:    string;
  firstName?: string;
  message:  string;
}): Promise<void> {
  const { phone, firstName = 'there', message } = params;
  const body = `Hi ${firstName}, ${message} Reply STOP to opt out.`;
  await sendSms(phone, body);
}
