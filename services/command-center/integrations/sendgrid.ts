/**
 * services/command-center/integrations/sendgrid.ts
 *
 * SendGrid email sequences for contractor acquisition and onboarding.
 *
 * Supports two delivery modes:
 *  1. Dynamic Template IDs (recommended for production) — set SENDGRID_TEMPLATE_* vars
 *  2. Inline HTML fallback — used when template IDs are not configured
 *
 * Sequences:
 *  - Recruitment (3-email):     Email 1 (immediate), Email 2 (+3 days), Email 3 (+7 days)
 *  - Onboarding welcome:        Immediate after registration
 *  - Registration reminder:     +24h if registration not completed
 *  - Verification reminder:     +48h if docs not submitted
 *  - Activation welcome:        After contractor marked Active
 *
 * Sequence scheduling is handled via BullMQ delayed jobs (growth.queue.ts).
 */

import sgMail from '@sendgrid/mail';
import type { MailDataRequired } from '@sendgrid/mail';
import { createLogger } from '@kealee/observability';

const logger = createLogger('sendgrid-integration');

// ─── Config ───────────────────────────────────────────────────────────────────

const API_KEY    = process.env.SENDGRID_API_KEY ?? '';
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? 'hello@kealee.com';
const FROM_NAME  = process.env.SENDGRID_FROM_NAME  ?? 'Kealee Platform';

// Optional: template IDs for SendGrid Dynamic Templates
const TEMPLATES = {
  RECRUIT_1:             process.env.SENDGRID_TEMPLATE_RECRUIT_1,
  RECRUIT_2:             process.env.SENDGRID_TEMPLATE_RECRUIT_2,
  RECRUIT_3:             process.env.SENDGRID_TEMPLATE_RECRUIT_3,
  ONBOARDING_WELCOME:    process.env.SENDGRID_TEMPLATE_ONBOARDING_WELCOME,
  REGISTRATION_REMINDER: process.env.SENDGRID_TEMPLATE_REGISTRATION_REMINDER,
  VERIFICATION_REMINDER: process.env.SENDGRID_TEMPLATE_VERIFICATION_REMINDER,
  ACTIVATION_WELCOME:    process.env.SENDGRID_TEMPLATE_ACTIVATION_WELCOME,
} as const;

let _initialized = false;

function init(): boolean {
  if (!API_KEY) {
    logger.warn('SENDGRID_API_KEY not set — email sends will be skipped');
    return false;
  }
  if (!_initialized) {
    sgMail.setApiKey(API_KEY);
    _initialized = true;
  }
  return true;
}

// ─── Send Helper ──────────────────────────────────────────────────────────────

async function sendEmail(msg: MailDataRequired): Promise<void> {
  if (!init()) return;

  try {
    await sgMail.send(msg);
    logger.info({ to: msg.to, subject: (msg as any).subject }, 'Email sent');
  } catch (err: any) {
    logger.error(
      { err: err?.message, to: msg.to },
      'SendGrid send failed',
    );
    throw err;
  }
}

// ─── HTML Email Templates ─────────────────────────────────────────────────────

function emailWrapper(content: string, preheader = ''): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kealee</title>
  <style>
    body { margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #1A2B4A; padding: 32px 40px; }
    .header h1 { color: #2ABFBF; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 14px; }
    .body { padding: 40px; color: #2d3748; line-height: 1.7; }
    .body h2 { font-size: 20px; font-weight: 700; color: #1A2B4A; margin-top: 0; }
    .body p { font-size: 15px; margin: 0 0 16px; }
    .cta { display: inline-block; background: #E8793A; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 700; font-size: 15px; margin: 8px 0 24px; }
    .highlight { background: #f0fafa; border-left: 4px solid #2ABFBF; padding: 16px 20px; border-radius: 0 6px 6px 0; margin: 24px 0; }
    .footer { padding: 24px 40px; background: #f8f8f8; border-top: 1px solid #e8e8e8; }
    .footer p { font-size: 12px; color: #999; margin: 0 0 4px; line-height: 1.5; }
    .footer a { color: #2ABFBF; text-decoration: none; }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
  <div class="container">
    <div class="header">
      <h1>Kealee</h1>
      <p>Construction Development Platform</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>You're receiving this because you were identified as a contractor in our network.
         <a href="{{unsubscribe_url}}">Unsubscribe</a> at any time.</p>
      <p>Kealee Platform · 123 Main Street · San Francisco, CA 94105</p>
    </div>
  </div>
</body>
</html>`.trim();
}

// ─── Recruitment Sequence ─────────────────────────────────────────────────────

export interface RecruitmentSequenceParams {
  email:      string;
  firstName?: string;
  trade?:     string;
  geoArea?:   string;
  registrationUrl?: string;
}

/**
 * Email 1 — Stop chasing homeowners — get real construction projects.
 * Sent immediately upon outreach campaign launch.
 */
export async function sendRecruitmentEmail1(params: RecruitmentSequenceParams): Promise<void> {
  const { email, firstName = 'there', trade = 'your trade', registrationUrl } = params;
  const ctaUrl = registrationUrl ?? `${process.env.WEB_MAIN_URL ?? 'https://kealee.com'}/contractor/register`;

  if (TEMPLATES.RECRUIT_1) {
    return sendEmail({
      to:          email,
      from:        { email: FROM_EMAIL, name: FROM_NAME },
      templateId:  TEMPLATES.RECRUIT_1,
      dynamicTemplateData: {
        first_name:       firstName,
        trade,
        registration_url: ctaUrl,
      },
    });
  }

  return sendEmail({
    to:      email,
    from:    { email: FROM_EMAIL, name: FROM_NAME },
    subject: `Stop chasing homeowners — get real construction projects`,
    html:    emailWrapper(
      `<h2>Hey ${firstName},</h2>
      <p>If you're tired of small residential jobs and weekend DIY clients, we built something different.</p>
      <div class="highlight">
        <strong>Kealee connects licensed ${trade} contractors with permit-ready, developer-backed construction projects</strong> —
        the kind that pay on time and come back with more work.
      </div>
      <p>No cold calls. No bidding wars with 40 other subs. Just project leads matched to your license, capacity, and region.</p>
      <p>Here's what contractors on Kealee get:</p>
      <ul>
        <li>Qualified project leads in your trade</li>
        <li>Transparent payment milestones (no chasing invoices)</li>
        <li>Digital project management — everything in one place</li>
        <li>First-look access when new projects go live in your area</li>
      </ul>
      <p>Takes 10 minutes to set up your contractor profile.</p>
      <a href="${ctaUrl}" class="cta">Join the Kealee Contractor Network →</a>
      <p style="font-size:13px;color:#888;">No subscription. No upfront cost. We make money when you win work.</p>`,
      `Real construction projects in ${params.geoArea ?? 'your area'} need ${trade} contractors now.`,
    ),
  });
}

/**
 * Email 2 — How Kealee delivers permit-ready jobs.
 * Sent 3 days after Email 1.
 */
export async function sendRecruitmentEmail2(params: RecruitmentSequenceParams): Promise<void> {
  const { email, firstName = 'there', trade = 'your trade', registrationUrl } = params;
  const ctaUrl = registrationUrl ?? `${process.env.WEB_MAIN_URL ?? 'https://kealee.com'}/contractor/register`;

  if (TEMPLATES.RECRUIT_2) {
    return sendEmail({
      to:          email,
      from:        { email: FROM_EMAIL, name: FROM_NAME },
      templateId:  TEMPLATES.RECRUIT_2,
      dynamicTemplateData: { first_name: firstName, trade, registration_url: ctaUrl },
    });
  }

  return sendEmail({
    to:      email,
    from:    { email: FROM_EMAIL, name: FROM_NAME },
    subject: `How Kealee delivers permit-ready jobs`,
    html:    emailWrapper(
      `<h2>${firstName}, here's how it works</h2>
      <p>One of the biggest problems contractors tell us about: showing up to a job that isn't permit-ready.
         Delays. Change orders. Weeks of waiting.</p>
      <p><strong>At Kealee, projects don't enter the marketplace until they've cleared:</strong></p>
      <ul>
        <li>Feasibility review (financing, zoning, title)</li>
        <li>Permit application filed and tracked</li>
        <li>Project scope locked by a licensed architect or engineer</li>
        <li>Developer funding confirmed</li>
      </ul>
      <div class="highlight">
        By the time a project is assigned to a ${trade} contractor, it's ready to start —
        not ready to sit on your calendar for 6 months.
      </div>
      <p>We're seeing strong demand for ${trade} contractors
         ${params.geoArea ? `in <strong>${params.geoArea}</strong>` : 'across our markets'} right now.
         Projects are waiting.</p>
      <a href="${ctaUrl}" class="cta">See available projects in my area →</a>`,
      'Projects that are actually ready to go — no permit limbo.',
    ),
  });
}

/**
 * Email 3 — Join the contractor marketplace.
 * Sent 7 days after Email 1 (final in sequence).
 */
export async function sendRecruitmentEmail3(params: RecruitmentSequenceParams): Promise<void> {
  const { email, firstName = 'there', trade = 'your trade', registrationUrl } = params;
  const ctaUrl = registrationUrl ?? `${process.env.WEB_MAIN_URL ?? 'https://kealee.com'}/contractor/register`;

  if (TEMPLATES.RECRUIT_3) {
    return sendEmail({
      to:          email,
      from:        { email: FROM_EMAIL, name: FROM_NAME },
      templateId:  TEMPLATES.RECRUIT_3,
      dynamicTemplateData: { first_name: firstName, trade, registration_url: ctaUrl },
    });
  }

  return sendEmail({
    to:      email,
    from:    { email: FROM_EMAIL, name: FROM_NAME },
    subject: `Last call: Join the Kealee contractor marketplace`,
    html:    emailWrapper(
      `<h2>This is our last email, ${firstName}</h2>
      <p>We won't keep showing up in your inbox — that's not how we want to work with contractors.</p>
      <p>But before we close your file, here's the short version:</p>
      <div class="highlight">
        Kealee is a marketplace where licensed ${trade} contractors get matched with
        developer-backed construction projects. <strong>No cost to join. No bidding on specs.</strong>
        If your license, insurance, and capacity match a project — you get offered the work.
      </div>
      <p>If the timing isn't right, we get it. You can always sign up at <a href="${ctaUrl}">kealee.com/contractor/register</a> when you're ready.</p>
      <p>If you want in — now's the time. It takes 10 minutes.</p>
      <a href="${ctaUrl}" class="cta">Join Kealee — 10 minutes →</a>
      <p style="font-size:13px;color:#888;">After today we'll stop sending outreach emails. You can re-engage anytime at kealee.com.</p>`,
      'Final email — join the network or we\'ll leave you alone.',
    ),
  });
}

// ─── Onboarding & Lifecycle Emails ───────────────────────────────────────────

/**
 * Send onboarding welcome email after contractor registers.
 */
export async function sendOnboardingWelcome(params: {
  email:        string;
  firstName?:   string;
  businessName?: string;
  dashboardUrl?: string;
}): Promise<void> {
  const { email, firstName = 'there', businessName, dashboardUrl } = params;
  const ctaUrl = dashboardUrl ?? `${process.env.PORTAL_CONTRACTOR_URL ?? 'https://contractor.kealee.com'}/dashboard`;

  if (TEMPLATES.ONBOARDING_WELCOME) {
    return sendEmail({
      to:          email,
      from:        { email: FROM_EMAIL, name: FROM_NAME },
      templateId:  TEMPLATES.ONBOARDING_WELCOME,
      dynamicTemplateData: { first_name: firstName, business_name: businessName, dashboard_url: ctaUrl },
    });
  }

  return sendEmail({
    to:      email,
    from:    { email: FROM_EMAIL, name: FROM_NAME },
    subject: `Welcome to Kealee${businessName ? `, ${businessName}` : ''}`,
    html:    emailWrapper(
      `<h2>Welcome to Kealee, ${firstName}!</h2>
      <p>Your contractor account is set up. Here's what happens next:</p>
      <ol>
        <li><strong>Complete your profile</strong> — add your license number, trades, and service areas</li>
        <li><strong>Upload documents</strong> — license, insurance certificate (COI), and W-9</li>
        <li><strong>Pass verification</strong> — our team reviews credentials (usually 1–2 business days)</li>
        <li><strong>Start receiving project leads</strong> — matched to your trade and region</li>
      </ol>
      <a href="${ctaUrl}" class="cta">Go to your dashboard →</a>
      <p>Questions? Reply to this email — we actually read them.</p>`,
      'Your contractor account is live — here\'s your next step.',
    ),
  });
}

/**
 * Send registration reminder if contractor hasn't completed registration.
 * Sent ~24 hours after outreach if registration not completed.
 */
export async function sendRegistrationReminder(params: {
  email:           string;
  firstName?:      string;
  registrationUrl?: string;
}): Promise<void> {
  const { email, firstName = 'there', registrationUrl } = params;
  const ctaUrl = registrationUrl ?? `${process.env.WEB_MAIN_URL ?? 'https://kealee.com'}/contractor/register`;

  if (TEMPLATES.REGISTRATION_REMINDER) {
    return sendEmail({
      to:          email,
      from:        { email: FROM_EMAIL, name: FROM_NAME },
      templateId:  TEMPLATES.REGISTRATION_REMINDER,
      dynamicTemplateData: { first_name: firstName, registration_url: ctaUrl },
    });
  }

  return sendEmail({
    to:      email,
    from:    { email: FROM_EMAIL, name: FROM_NAME },
    subject: `You started signing up for Kealee — finish in 5 minutes`,
    html:    emailWrapper(
      `<h2>Hey ${firstName}, don't leave your spot</h2>
      <p>You started your Kealee contractor registration but didn't finish. That's fine — it takes about 5 minutes from where you left off.</p>
      <p>New projects in your trade are being posted. Verified contractors get first-look access.</p>
      <a href="${ctaUrl}" class="cta">Continue registration →</a>`,
      'Your registration is saved — pick up where you left off.',
    ),
  });
}

/**
 * Send verification reminder when documents haven't been submitted.
 * Sent ~48 hours after registration if docs still pending.
 */
export async function sendVerificationReminder(params: {
  email:         string;
  firstName?:    string;
  dashboardUrl?: string;
}): Promise<void> {
  const { email, firstName = 'there', dashboardUrl } = params;
  const ctaUrl = dashboardUrl ?? `${process.env.PORTAL_CONTRACTOR_URL ?? 'https://contractor.kealee.com'}/profile`;

  if (TEMPLATES.VERIFICATION_REMINDER) {
    return sendEmail({
      to:          email,
      from:        { email: FROM_EMAIL, name: FROM_NAME },
      templateId:  TEMPLATES.VERIFICATION_REMINDER,
      dynamicTemplateData: { first_name: firstName, dashboard_url: ctaUrl },
    });
  }

  return sendEmail({
    to:      email,
    from:    { email: FROM_EMAIL, name: FROM_NAME },
    subject: `Upload your license and COI — get verified on Kealee`,
    html:    emailWrapper(
      `<h2>${firstName}, one step left</h2>
      <p>Your profile is set up. The only thing standing between you and project leads: <strong>verification</strong>.</p>
      <p>We need three documents to verify your account:</p>
      <ul>
        <li>State contractor's license</li>
        <li>Certificate of Insurance (COI)</li>
        <li>W-9 form</li>
      </ul>
      <p>Once submitted, our team typically verifies within 1–2 business days. Then you're live.</p>
      <a href="${ctaUrl}" class="cta">Upload documents now →</a>`,
      'Upload your license and insurance to unlock project leads.',
    ),
  });
}

/**
 * Send activation welcome when contractor is fully verified and active.
 */
export async function sendActivationWelcome(params: {
  email:         string;
  firstName?:    string;
  trade?:        string;
  dashboardUrl?: string;
}): Promise<void> {
  const { email, firstName = 'there', trade = 'your trade', dashboardUrl } = params;
  const ctaUrl = dashboardUrl ?? `${process.env.PORTAL_CONTRACTOR_URL ?? 'https://contractor.kealee.com'}/projects`;

  if (TEMPLATES.ACTIVATION_WELCOME) {
    return sendEmail({
      to:          email,
      from:        { email: FROM_EMAIL, name: FROM_NAME },
      templateId:  TEMPLATES.ACTIVATION_WELCOME,
      dynamicTemplateData: { first_name: firstName, trade, dashboard_url: ctaUrl },
    });
  }

  return sendEmail({
    to:      email,
    from:    { email: FROM_EMAIL, name: FROM_NAME },
    subject: `You're verified on Kealee — project leads are live`,
    html:    emailWrapper(
      `<h2>You're in, ${firstName}</h2>
      <p>Your ${trade} contractor account is verified and active. You can now receive project leads matched to your license and service area.</p>
      <div class="highlight">
        When a project matching your trade and region is posted, you'll be notified immediately.
        First-response contractors win the work — keep an eye on your dashboard.
      </div>
      <a href="${ctaUrl}" class="cta">View available projects →</a>
      <p>Your contractor dashboard is the hub for everything — leads, active projects, payments, and documents.</p>`,
      'Your account is verified. Project leads are live.',
    ),
  });
}

// ─── Re-engagement ────────────────────────────────────────────────────────────

/**
 * Send re-engagement email to inactive contractor.
 * Triggered by GrowthBot inactivity detection.
 */
export async function sendReengagementEmail(params: {
  email:         string;
  firstName?:    string;
  trade?:        string;
  dashboardUrl?: string;
}): Promise<void> {
  const { email, firstName = 'there', trade = 'your trade', dashboardUrl } = params;
  const ctaUrl = dashboardUrl ?? `${process.env.PORTAL_CONTRACTOR_URL ?? 'https://contractor.kealee.com'}/projects`;

  return sendEmail({
    to:      email,
    from:    { email: FROM_EMAIL, name: FROM_NAME },
    subject: `New ${trade} projects in your area — check your dashboard`,
    html:    emailWrapper(
      `<h2>New work in your area, ${firstName}</h2>
      <p>There are new ${trade} projects on Kealee that match your license and region.
         It's been a while since you last logged in.</p>
      <p>Project leads won't wait — first-response contractors get priority.
         Log in to see what's available.</p>
      <a href="${ctaUrl}" class="cta">See new projects →</a>
      <p style="font-size:13px;color:#888;">Your account and credentials are still active.</p>`,
      'New projects in your area — log in before they\'re gone.',
    ),
  });
}
