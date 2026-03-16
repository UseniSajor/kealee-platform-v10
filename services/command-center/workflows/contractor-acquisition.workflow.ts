/**
 * services/command-center/workflows/contractor-acquisition.workflow.ts
 *
 * Contractor Acquisition Workflow — orchestrates the full pipeline:
 *   GrowthBot shortage detected
 *     → Zoho CRM lead created
 *     → SendGrid recruitment sequence (3 emails)
 *     → Twilio outreach SMS
 *     → Contractor registers
 *     → Onboarding: CRM stage update + welcome email
 *     → Documents uploaded: CRM update + verification reminder
 *     → Verified: CRM contact created + activation email + SMS
 *     → Inactive: re-engagement campaign
 *
 * All Zoho, SendGrid, and Twilio calls are fire-and-forget with error logging.
 * Failures never block the primary Kealee flow.
 *
 * Event triggers consumed by this workflow:
 *   trade_shortage_detected          (from GrowthBot analysis)
 *   contractor_lead_captured         (from Zoho webhook or direct form)
 *   contractor_registration_started  (from web-main registration step 1)
 *   contractor_documents_uploaded    (from portal-contractor document upload)
 *   contractor_verified              (from os-admin verification approval)
 *   contractor_inactive              (from GrowthBot inactivity scoring)
 */

import { Redis }  from 'ioredis';
import { createLogger } from '@kealee/observability';
import { retryWithBackoff } from '../utils/retry.js';
import {
  sendRecruitmentEmail1,
  sendRecruitmentEmail2,
  sendRecruitmentEmail3,
  sendOnboardingWelcome,
  sendRegistrationReminder,
  sendVerificationReminder,
  sendActivationWelcome,
  sendReengagementEmail,
} from '../integrations/sendgrid.js';
import {
  sendOutreachSms,
  sendRegistrationReminderSms,
  sendVerificationReminderSms,
  sendActivationWelcomeSms,
  sendReengagementSms,
} from '../integrations/twilio.js';

const logger = createLogger('contractor-acquisition');

// ─── Zoho CRM import (lazy — API service handles Zoho directly via HTTP) ──────
// The command-center calls the Kealee API to perform Zoho operations,
// keeping the Zoho OAuth token in a single service.

const API_BASE = process.env.INTERNAL_API_URL ?? 'http://api:3000';

async function apiPost(path: string, body: unknown): Promise<unknown> {
  return retryWithBackoff(
    async () => {
      const res = await fetch(`${API_BASE}${path}`, {
        method:  'POST',
        headers: {
          'Content-Type':   'application/json',
          'x-internal-key': process.env.INTERNAL_API_KEY ?? '',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    },
    {
      attempts:    3,
      baseDelayMs: 1000,
      label:       `zoho.post${path}`,
      recordSync:  true,
      syncPayload: { path, body: JSON.stringify(body).slice(0, 500) },
    },
  );
}

async function apiPut(path: string, body: unknown): Promise<unknown> {
  return retryWithBackoff(
    async () => {
    const res = await fetch(`${API_BASE}${path}`, {
      method:  'PUT',
      headers: {
        'Content-Type':   'application/json',
        'x-internal-key': process.env.INTERNAL_API_KEY ?? '',
      },
      body: JSON.stringify(body),
    });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    },
    {
      attempts:    3,
      baseDelayMs: 1000,
      label:       `zoho.put${path}`,
      recordSync:  true,
      syncPayload: { path, body: JSON.stringify(body).slice(0, 500) },
    },
  );
}

// ─── Deduplication ────────────────────────────────────────────────────────────

// Redis dedup key TTL for each acquisition step (prevents double-triggering)
const DEDUP_TTL: Record<string, number> = {
  outreach:       7  * 24 * 3600, // 7 days — don't re-outreach within a week
  registration:   2  * 24 * 3600, // 2 days
  documents:      3  * 24 * 3600, // 3 days
  verified:       30 * 24 * 3600, // 30 days — activation email once per month
  reengagement:   14 * 24 * 3600, // 14 days — re-engagement max every 2 weeks
};

async function isDuplicate(redis: Redis, step: string, identifier: string): Promise<boolean> {
  const key = `acq:dedup:${step}:${identifier}`;
  const ttl = DEDUP_TTL[step] ?? 86400;
  const result = await redis.set(key, '1', 'EX', ttl, 'NX');
  return result === null; // null = key already existed → duplicate
}

// ─── Registration URL Builder ─────────────────────────────────────────────────

function buildRegistrationUrl(trade?: string, geo?: string): string {
  const base = process.env.WEB_MAIN_URL ?? 'https://kealee.com';
  const params = new URLSearchParams();
  if (trade) params.set('trade', trade);
  if (geo)   params.set('geo', geo);
  const qs = params.toString();
  return `${base}/contractor/register${qs ? `?${qs}` : ''}`;
}

function buildDashboardUrl(profileId?: string): string {
  const base = process.env.PORTAL_CONTRACTOR_URL ?? 'https://contractor.kealee.com';
  return `${base}/dashboard`;
}

// ─── Workflow Class ───────────────────────────────────────────────────────────

export class ContractorAcquisitionWorkflow {
  constructor(private readonly redis: Redis) {}

  /**
   * TRIGGER 1 — Trade shortage detected.
   * GrowthBot calls this when a trade shortage score exceeds threshold.
   * Creates Zoho CRM lead, sends recruitment email sequence + SMS outreach.
   */
  async handleTradeShortageDetected(event: {
    trade:          string;
    geo?:           string;
    shortageScore:  number;
    targetEmails?:  Array<{ email: string; firstName?: string; phone?: string }>;
    campaignSource?: string;
  }): Promise<void> {
    const { trade, geo, shortageScore, targetEmails = [], campaignSource = 'shortage_auto' } = event;

    logger.info({ trade, geo, shortageScore, recipientCount: targetEmails.length },
      'ContractorAcquisition: trade shortage → outreach campaign');

    for (const target of targetEmails) {
      const identifier = target.email ?? target.phone ?? 'unknown';
      if (await isDuplicate(this.redis, 'outreach', `${trade}:${identifier}`)) {
        logger.debug({ identifier, trade }, 'Outreach dedup — skipping');
        continue;
      }

      const registrationUrl = buildRegistrationUrl(trade, geo);

      // 1. Create Zoho lead (fire-and-forget)
      void apiPost('/zoho/leads', {
        firstName:      target.firstName,
        lastName:       'Contractor',
        email:          target.email,
        phone:          target.phone,
        trade,
        geo,
        shortageScore,
        campaignSource,
        registrationUrl,
      });

      // 2. Email 1 — immediate
      if (target.email) {
        void sendRecruitmentEmail1({
          email:           target.email,
          firstName:       target.firstName,
          trade,
          geoArea:         geo,
          registrationUrl,
        }).catch(err => logger.error({ err }, 'Recruitment Email 1 failed'));
      }

      // 3. SMS outreach — immediate
      if (target.phone) {
        void sendOutreachSms({
          phone:           target.phone,
          firstName:       target.firstName,
          trade,
          geoArea:         geo,
          registrationUrl,
        }).catch(err => logger.error({ err }, 'Outreach SMS failed'));
      }
    }

    // Record campaign activity in Zoho
    if (shortageScore >= 50) {
      void apiPost('/zoho/leads', {
        lastName:      `[Campaign] ${trade} Shortage Score ${shortageScore}`,
        campaignSource,
        trade,
        geo,
        shortageScore,
      }).catch(() => {}); // non-critical
    }

    logger.info({ trade, geo, shortageScore }, 'Outreach campaign dispatched');
  }

  /**
   * TRIGGER 2 — Contractor lead captured.
   * Fires when a lead submits a form (Zoho webhook, web-main form, or direct API).
   * Enrolls in email sequence immediately.
   */
  async handleLeadCaptured(event: {
    email?:          string;
    phone?:          string;
    firstName?:      string;
    lastName?:       string;
    trade?:          string;
    geo?:            string;
    zohoLeadId?:     string;
    kealeeProfileId?: string;
    source?:         string;
  }): Promise<void> {
    const { email, phone, firstName, trade, geo, zohoLeadId, kealeeProfileId } = event;

    const identifier = email ?? phone ?? zohoLeadId ?? 'unknown';
    if (await isDuplicate(this.redis, 'outreach', `lead:${identifier}`)) {
      logger.debug({ identifier }, 'Lead captured dedup — skipping');
      return;
    }

    logger.info({ email, trade, source: event.source }, 'ContractorAcquisition: lead captured');

    // Update Zoho stage to Interested if we have a lead ID
    if (zohoLeadId) {
      void apiPut(`/zoho/leads/${zohoLeadId}/stage`, { stage: 'Interested' });
    }

    const registrationUrl = buildRegistrationUrl(trade, geo);

    // SendGrid Email 1 if not sent already (upsert pattern)
    if (email) {
      void sendRecruitmentEmail1({ email, firstName, trade, geoArea: geo, registrationUrl })
        .catch(err => logger.error({ err }, 'Lead Email 1 failed'));
    }

    // SMS outreach
    if (phone) {
      void sendOutreachSms({ phone, firstName, trade, geoArea: geo, registrationUrl })
        .catch(err => logger.error({ err }, 'Lead SMS failed'));
    }
  }

  /**
   * TRIGGER 3 — Contractor registration started.
   * Fires when contractor completes step 1 of web-main registration.
   * Updates CRM stage, sends welcome + onboarding email.
   */
  async handleRegistrationStarted(event: {
    email?:          string;
    phone?:          string;
    firstName?:      string;
    kealeeUserId?:   string;
    kealeeProfileId?: string;
    trade?:          string;
    zohoLeadId?:     string;
  }): Promise<void> {
    const { email, phone, firstName, kealeeUserId, kealeeProfileId, trade, zohoLeadId } = event;

    const identifier = kealeeUserId ?? email ?? 'unknown';
    if (await isDuplicate(this.redis, 'registration', identifier)) {
      return;
    }

    logger.info({ email, trade }, 'ContractorAcquisition: registration started');

    // Update Zoho lead stage
    if (zohoLeadId) {
      void apiPut(`/zoho/leads/${zohoLeadId}/stage`, {
        stage: 'Registration Started',
        notes: `Kealee User ID: ${kealeeUserId ?? '—'} | Profile ID: ${kealeeProfileId ?? '—'}`,
      });
    } else if (email) {
      void apiPost('/zoho/leads', {
        firstName,
        lastName:       'Contractor',
        email,
        phone,
        trade,
        kealeeUserId,
        kealeeProfileId,
        campaignSource: 'self_register',
      });
    }

    // Welcome email
    if (email) {
      void sendOnboardingWelcome({
        email,
        firstName,
        dashboardUrl: buildDashboardUrl(kealeeProfileId),
      }).catch(err => logger.error({ err }, 'Onboarding welcome failed'));
    }

    // Welcome SMS
    if (phone) {
      void sendRegistrationReminderSms({
        phone,
        firstName,
        registrationUrl: buildRegistrationUrl(trade),
      }).catch(err => logger.error({ err }, 'Registration SMS failed'));
    }
  }

  /**
   * TRIGGER 4 — Contractor documents uploaded.
   * Fires when contractor uploads license, COI, and W-9.
   * Updates CRM to Documents Uploaded, notifies ops team.
   */
  async handleDocumentsUploaded(event: {
    email?:          string;
    phone?:          string;
    firstName?:      string;
    kealeeUserId?:   string;
    kealeeProfileId?: string;
    zohoLeadId?:     string;
    documentTypes?:  string[];
  }): Promise<void> {
    const { email, phone, firstName, kealeeUserId, kealeeProfileId, zohoLeadId, documentTypes } = event;

    const identifier = kealeeUserId ?? email ?? 'unknown';
    if (await isDuplicate(this.redis, 'documents', identifier)) {
      return;
    }

    logger.info({ email, documentTypes }, 'ContractorAcquisition: documents uploaded');

    // Update CRM stage
    if (zohoLeadId) {
      void apiPut(`/zoho/leads/${zohoLeadId}/stage`, {
        stage: 'Documents Uploaded',
        notes: `Documents: ${documentTypes?.join(', ') ?? 'unknown'}. Awaiting ops review.`,
      });
    }

    // Verification reminder email (you submitted docs, we're reviewing)
    if (email) {
      void sendVerificationReminder({
        email,
        firstName,
        dashboardUrl: buildDashboardUrl(kealeeProfileId),
      }).catch(err => logger.error({ err }, 'Verification reminder failed'));
    }

    // SMS confirmation
    if (phone) {
      void sendVerificationReminderSms({
        phone,
        firstName,
        dashboardUrl: buildDashboardUrl(kealeeProfileId),
      }).catch(err => logger.error({ err }, 'Verification SMS failed'));
    }

    // Also post a note to ops via internal alert
    void this._publishEvent('contractor.acquisition.documents_uploaded', {
      kealeeProfileId, kealeeUserId, email, documentTypes,
    });
  }

  /**
   * TRIGGER 5 — Contractor verified.
   * Fires when ops admin marks contractor as ELIGIBLE.
   * Creates Zoho Contact, sends activation welcome.
   */
  async handleContractorVerified(event: {
    email?:          string;
    phone?:          string;
    firstName?:      string;
    lastName?:       string;
    businessName?:   string;
    trade?:          string;
    serviceAreas?:   string[];
    kealeeUserId?:   string;
    kealeeProfileId?: string;
    verificationStatus?: string;
  }): Promise<void> {
    const {
      email, phone, firstName, lastName, businessName, trade,
      serviceAreas, kealeeUserId, kealeeProfileId, verificationStatus,
    } = event;

    const identifier = kealeeUserId ?? email ?? 'unknown';
    if (await isDuplicate(this.redis, 'verified', identifier)) {
      return;
    }

    logger.info({ email, trade }, 'ContractorAcquisition: contractor verified → activating');

    // Create/update Zoho Contact (graduate from Lead)
    void apiPost('/zoho/contacts', {
      firstName,
      lastName:           lastName ?? businessName ?? 'Contractor',
      email,
      phone,
      businessName,
      kealeeProfileId,
      kealeeUserId,
      verificationStatus: verificationStatus ?? 'ELIGIBLE',
      trades:             trade ? [trade] : [],
      serviceAreas,
      stage:              'Verified Contractor',
    });

    // Activation email
    if (email) {
      void sendActivationWelcome({
        email,
        firstName,
        trade,
        dashboardUrl: buildDashboardUrl(kealeeProfileId),
      }).catch(err => logger.error({ err }, 'Activation welcome failed'));
    }

    // Activation SMS
    if (phone) {
      void sendActivationWelcomeSms({
        phone,
        firstName,
        trade,
        dashboardUrl: buildDashboardUrl(kealeeProfileId),
      }).catch(err => logger.error({ err }, 'Activation SMS failed'));
    }
  }

  /**
   * TRIGGER 6 — Contractor inactive.
   * Fires when GrowthBot detects a verified contractor hasn't responded in 60+ days.
   * Sends re-engagement campaign.
   */
  async handleContractorInactive(event: {
    email?:           string;
    phone?:           string;
    firstName?:       string;
    trade?:           string;
    kealeeProfileId?: string;
    daysSinceLast?:   number;
    inactivityScore?: number;
  }): Promise<void> {
    const { email, phone, firstName, trade, kealeeProfileId, daysSinceLast, inactivityScore } = event;

    const identifier = kealeeProfileId ?? email ?? 'unknown';
    if (await isDuplicate(this.redis, 'reengagement', identifier)) {
      logger.debug({ identifier }, 'Re-engagement dedup — already sent within 14 days');
      return;
    }

    logger.info({ email, trade, daysSinceLast, inactivityScore },
      'ContractorAcquisition: contractor inactive → re-engagement');

    // Re-engagement email
    if (email) {
      void sendReengagementEmail({
        email,
        firstName,
        trade,
        dashboardUrl: buildDashboardUrl(kealeeProfileId),
      }).catch(err => logger.error({ err }, 'Re-engagement email failed'));
    }

    // Re-engagement SMS
    if (phone) {
      void sendReengagementSms({
        phone,
        firstName,
        trade,
        dashboardUrl: buildDashboardUrl(kealeeProfileId),
      }).catch(err => logger.error({ err }, 'Re-engagement SMS failed'));
    }
  }

  // ─── Sequence Scheduling (Email 2 and 3) ───────────────────────────────────

  /**
   * Schedule Email 2 (+3 days) and Email 3 (+7 days) for a recruitment sequence.
   * These are enqueued as BullMQ delayed jobs so the main flow returns immediately.
   *
   * Call this after Email 1 is sent via handleTradeShortageDetected or handleLeadCaptured.
   */
  async scheduleRecruitmentFollowUps(params: {
    email:           string;
    firstName?:      string;
    trade?:          string;
    geoArea?:        string;
    registrationUrl?: string;
  }): Promise<void> {
    const { email, firstName, trade, geoArea, registrationUrl } = params;

    // Dynamically import queue to avoid circular dependency
    const { queues } = await import('../shared/queue.js');
    const queue = queues['GROWTH_BOT'];

    await queue.add(
      'recruitment-email-2',
      { email, firstName, trade, geoArea, registrationUrl },
      { delay: 3 * 24 * 60 * 60 * 1000, jobId: `recruit-email2-${email}-${trade}` },
    );

    await queue.add(
      'recruitment-email-3',
      { email, firstName, trade, geoArea, registrationUrl },
      { delay: 7 * 24 * 60 * 60 * 1000, jobId: `recruit-email3-${email}-${trade}` },
    );

    logger.debug({ email, trade }, 'Recruitment Email 2+3 scheduled');
  }

  /**
   * Process a scheduled follow-up job from the BullMQ queue.
   * Called by the growth worker when a delayed job fires.
   */
  async processScheduledEmail(jobName: string, data: {
    email:           string;
    firstName?:      string;
    trade?:          string;
    geoArea?:        string;
    registrationUrl?: string;
  }): Promise<void> {
    const { email, firstName, trade, geoArea, registrationUrl } = data;

    if (jobName === 'recruitment-email-2') {
      await sendRecruitmentEmail2({ email, firstName, trade, geoArea, registrationUrl });
    } else if (jobName === 'recruitment-email-3') {
      await sendRecruitmentEmail3({ email, firstName, trade, geoArea, registrationUrl });
    }
  }

  // ─── Internal Helpers ─────────────────────────────────────────────────────

  private async _publishEvent(type: string, data: Record<string, unknown>): Promise<void> {
    try {
      await this.redis.publish('kealee:events', JSON.stringify({
        id:        `acq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        source:    'contractor-acquisition-workflow',
        timestamp: new Date().toISOString(),
        data,
      }));
    } catch (err) {
      logger.warn({ err, type }, 'Failed to publish acquisition event');
    }
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _workflow: ContractorAcquisitionWorkflow | null = null;

export function getAcquisitionWorkflow(redis: Redis): ContractorAcquisitionWorkflow {
  if (!_workflow) {
    _workflow = new ContractorAcquisitionWorkflow(redis);
  }
  return _workflow;
}
