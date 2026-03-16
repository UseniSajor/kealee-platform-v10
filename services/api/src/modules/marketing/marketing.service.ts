/**
 * services/api/src/modules/marketing/marketing.service.ts
 *
 * Contractor marketing service — orchestrates Zoho CRM,
 * SendGrid, and Twilio for contractor marketing campaigns.
 */

import { createLogger } from '@kealee/observability';
import Stripe from 'stripe';
import { MARKETING_PACKAGES, type MarketingPackageId } from './marketing.packages.js';

const logger = createLogger('marketing-service');

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  : null;

const API_BASE = process.env.INTERNAL_API_URL ?? 'http://api:3000';

// ─── Subscription Management ──────────────────────────────────────────────────

/**
 * Create a Stripe subscription checkout for a marketing package.
 */
export async function createMarketingSubscription(params: {
  userId:     string;
  profileId:  string;
  email:      string;
  packageId:  MarketingPackageId;
  billing:    'monthly' | 'annual';
  successUrl: string;
  cancelUrl:  string;
}): Promise<{ url: string; sessionId: string }> {
  const pkg = MARKETING_PACKAGES[params.packageId];
  if (!pkg) throw new Error(`Unknown marketing package: ${params.packageId}`);

  const priceId = params.billing === 'annual'
    ? pkg.stripePriceAnnualId
    : pkg.stripePriceMonthlyId;

  if (!priceId) {
    throw new Error(`No Stripe price configured for ${params.packageId} ${params.billing}`);
  }

  if (!stripe) throw new Error('Stripe not configured');

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    { price: priceId, quantity: 1 },
  ];

  // Add setup fee if Pro package
  if (pkg.setupFee && process.env.STRIPE_PRICE_MKT_PRO_SETUP) {
    lineItems.push({ price: process.env.STRIPE_PRICE_MKT_PRO_SETUP, quantity: 1 });
  }

  const session = await stripe.checkout.sessions.create({
    mode:          'subscription',
    line_items:    lineItems,
    customer_email: params.email,
    success_url:   params.successUrl,
    cancel_url:    params.cancelUrl,
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 14, // 14-day free trial
      metadata: {
        userId:    params.userId,
        profileId: params.profileId,
        packageId: params.packageId,
        billing:   params.billing,
      },
    },
    metadata: {
      userId:    params.userId,
      profileId: params.profileId,
      packageId: params.packageId,
    },
  });

  logger.info({ userId: params.userId, packageId: params.packageId, sessionId: session.id },
    'Marketing subscription checkout created');

  return { url: session.url!, sessionId: session.id };
}

// ─── CRM Sync ─────────────────────────────────────────────────────────────────

/**
 * Sync a new marketing subscriber to Zoho CRM.
 * Called after subscription is confirmed via webhook.
 */
export async function syncMarketingSubscriberToCRM(params: {
  email:      string;
  firstName?: string;
  lastName?:  string;
  phone?:     string;
  company?:   string;
  packageId:  MarketingPackageId;
  profileId:  string;
}): Promise<void> {
  const pkg = MARKETING_PACKAGES[params.packageId];

  try {
    await fetch(`${API_BASE}/zoho/contacts`, {
      method:  'POST',
      headers: {
        'Content-Type':   'application/json',
        'x-internal-key': process.env.INTERNAL_API_KEY ?? '',
      },
      body: JSON.stringify({
        firstName:          params.firstName,
        lastName:           params.lastName ?? params.company ?? 'Contractor',
        email:              params.email,
        phone:              params.phone,
        businessName:       params.company,
        kealeeProfileId:    params.profileId,
        verificationStatus: 'ACTIVE',
        stage:              'Active Contractor',
      }),
    });

    logger.info({ email: params.email, packageId: params.packageId }, 'Marketing subscriber synced to Zoho');
  } catch (err) {
    logger.error({ err, email: params.email }, 'Zoho CRM sync failed (non-fatal)');
  }
}

// ─── SendGrid Campaign Automation ────────────────────────────────────────────

/**
 * Enroll a contractor in a marketing package onboarding email sequence.
 * Sends welcome + next-steps emails via SendGrid.
 */
export async function enrollInMarketingOnboarding(params: {
  email:       string;
  firstName?:  string;
  packageId:   MarketingPackageId;
  dashboardUrl?: string;
}): Promise<void> {
  const pkg = MARKETING_PACKAGES[params.packageId];
  const dashUrl = params.dashboardUrl
    ?? `${process.env.PORTAL_CONTRACTOR_URL ?? 'https://contractor.kealee.com'}/marketing`;

  // Import at runtime to avoid circular dep in tests
  const { default: sgMail } = await import('@sendgrid/mail');

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    logger.warn('SENDGRID_API_KEY not set — marketing onboarding email skipped');
    return;
  }

  sgMail.setApiKey(apiKey);

  const fromEmail = process.env.SENDGRID_FROM_EMAIL ?? 'hello@kealee.com';
  const fromName  = process.env.SENDGRID_FROM_NAME  ?? 'Kealee Platform';
  const firstName = params.firstName ?? 'there';

  const featuresHtml = pkg.features
    .filter(f => f.included)
    .map(f => `<li><strong>${f.name}</strong> — ${f.description}</li>`)
    .join('\n');

  await sgMail.send({
    to:      params.email,
    from:    { email: fromEmail, name: fromName },
    subject: `Welcome to Kealee ${pkg.name} — your marketing setup starts now`,
    html: `
    <div style="font-family:-apple-system,sans-serif;max-width:580px;margin:40px auto;padding:40px;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
      <div style="background:#1A2B4A;padding:24px 32px;border-radius:8px 8px 0 0;margin:-40px -40px 32px">
        <h1 style="color:#2ABFBF;margin:0;font-size:22px">Kealee Marketing</h1>
        <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px">${pkg.name} — ${pkg.tagline}</p>
      </div>
      <h2 style="color:#1A2B4A">Welcome, ${firstName}!</h2>
      <p>Your <strong>${pkg.name}</strong> marketing package is active. Here's what's included:</p>
      <ul style="line-height:2">${featuresHtml}</ul>
      <p><strong>Onboarding takes ${pkg.onboardingDays} business day${pkg.onboardingDays > 1 ? 's' : ''}.</strong>
         Our team will contact you to complete setup.</p>
      <a href="${dashUrl}" style="display:inline-block;background:#E8793A;color:#fff;padding:12px 24px;border-radius:6px;font-weight:700;text-decoration:none;margin:8px 0 24px">
        Go to your marketing dashboard →
      </a>
      <p style="font-size:13px;color:#999">Questions? Reply to this email — we read them.</p>
    </div>`,
  });

  logger.info({ email: params.email, packageId: params.packageId }, 'Marketing onboarding email sent');
}

// ─── Lead Notification ────────────────────────────────────────────────────────

/**
 * Notify a contractor of a new marketing lead (from landing page form).
 */
export async function notifyContractorLead(params: {
  contractorEmail:  string;
  contractorPhone?: string;
  contractorName?:  string;
  leadName:         string;
  leadEmail:        string;
  leadPhone?:       string;
  leadMessage?:     string;
  trade?:           string;
  geo?:             string;
}): Promise<void> {
  const { contractorEmail, contractorPhone, contractorName, leadName, leadEmail, leadPhone, leadMessage, trade, geo } = params;

  // Email notification
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey) {
    const { default: sgMail } = await import('@sendgrid/mail');
    sgMail.setApiKey(apiKey);

    await sgMail.send({
      to:      contractorEmail,
      from:    { email: process.env.SENDGRID_FROM_EMAIL ?? 'hello@kealee.com', name: 'Kealee Marketing' },
      subject: `New lead: ${leadName}${trade ? ` — ${trade}` : ''}`,
      html: `
      <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:40px auto;padding:32px;background:#fff;border-radius:8px;border:1px solid #e2e8f0">
        <h2 style="color:#1A2B4A;margin-top:0">New project lead for you</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#718096;font-size:14px">Name</td><td style="padding:8px 0;font-weight:600">${leadName}</td></tr>
          <tr><td style="padding:8px 0;color:#718096;font-size:14px">Email</td><td style="padding:8px 0">${leadEmail}</td></tr>
          ${leadPhone ? `<tr><td style="padding:8px 0;color:#718096;font-size:14px">Phone</td><td style="padding:8px 0">${leadPhone}</td></tr>` : ''}
          ${trade ? `<tr><td style="padding:8px 0;color:#718096;font-size:14px">Trade</td><td style="padding:8px 0">${trade}</td></tr>` : ''}
          ${geo ? `<tr><td style="padding:8px 0;color:#718096;font-size:14px">Location</td><td style="padding:8px 0">${geo}</td></tr>` : ''}
          ${leadMessage ? `<tr><td style="padding:8px 0;color:#718096;font-size:14px">Message</td><td style="padding:8px 0">${leadMessage}</td></tr>` : ''}
        </table>
        <a href="mailto:${leadEmail}" style="display:inline-block;background:#E8793A;color:#fff;padding:12px 24px;border-radius:6px;font-weight:700;text-decoration:none;margin-top:16px">
          Reply to ${leadName} →
        </a>
      </div>`,
    }).catch(err => logger.error({ err }, 'Lead notification email failed'));
  }

  // SMS notification
  if (contractorPhone) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const from       = process.env.TWILIO_PHONE_NUMBER;

    if (accountSid && authToken && from) {
      const { default: twilio } = await import('twilio');
      const client = twilio(accountSid, authToken);

      const body = `Kealee: New lead — ${leadName}${leadPhone ? ` (${leadPhone})` : ''}${trade ? ` — ${trade}` : ''}. Reply STOP to opt out.`;

      await client.messages.create({
        to:   contractorPhone.startsWith('+') ? contractorPhone : `+1${contractorPhone.replace(/\D/g, '')}`,
        from,
        body,
      }).catch(err => logger.error({ err }, 'Lead notification SMS failed'));
    }
  }

  logger.info({ contractorEmail, leadName, trade }, 'Contractor lead notification sent');
}

// ─── Landing Page Data ────────────────────────────────────────────────────────

/**
 * Get the landing page data for a contractor.
 * Returns structured data for the contractor's public marketing page.
 */
export async function getContractorLandingPageData(profileId: string): Promise<{
  profile:       Record<string, unknown> | null;
  seoTitle:      string;
  seoDescription: string;
  schema:        Record<string, unknown>;
}> {
  // Fetch profile from API
  let profile: Record<string, unknown> | null = null;

  try {
    const res = await fetch(`${API_BASE}/marketplace/contractors/${profileId}/public`, {
      headers: { 'x-internal-key': process.env.INTERNAL_API_KEY ?? '' },
    });
    if (res.ok) profile = await res.json();
  } catch (err) {
    logger.warn({ err, profileId }, 'Failed to fetch contractor profile for landing page');
  }

  const name  = (profile?.businessName as string) ?? 'Licensed Contractor';
  const trade = (profile?.primaryTrade as string) ?? 'General Contractor';
  const city  = (profile?.city as string) ?? '';
  const state = (profile?.state as string) ?? '';
  const geo   = [city, state].filter(Boolean).join(', ');

  return {
    profile,
    seoTitle:       `${name} | ${trade} in ${geo || 'Your Area'} | Kealee`,
    seoDescription: `${name} is a verified ${trade} contractor${geo ? ` serving ${geo}` : ''}. Get a free quote on Kealee.`,
    schema: {
      '@context':    'https://schema.org',
      '@type':       'LocalBusiness',
      'name':        name,
      'description': `Verified ${trade} contractor on the Kealee platform`,
      ...(geo ? { 'areaServed': geo } : {}),
    },
  };
}
