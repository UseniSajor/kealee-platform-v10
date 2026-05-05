/**
 * services/worker/src/processors/lead-followup.processor.ts
 *
 * Processes lead follow-up jobs:
 * - Abandoned checkout: 1h SMS → 24h email → 72h reminder
 * - Soft capture nurture: 1h → 24h → 72h → 7d → 14d
 * - Post-purchase upsell: 1d → 7d → 14d
 */

import { Worker, Job } from 'bullmq'
import { redis } from '../config/redis.config'
import { emailQueue } from '../queues/email.queue'
import type { LeadFollowupJobData } from '../queues/lead-followup.queue'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://kealee.com'
const FROM_EMAIL = 'Kealee <hello@kealee.com>'

// ── Email templates ────────────────────────────────────────────────────────────

const TEMPLATES = {

  // ── Abandoned checkout sequence ──────────────────────────────────────────────

  sms_1h: {
    subject: 'Your Kealee project is saved — complete it anytime',
    getHtml: (name: string, projectType: string, leadId: string) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <p style="font-size:16px">Hi ${name},</p>
        <p>You started a <strong>${projectType}</strong> concept with Kealee — your details are saved.</p>
        <p>Whenever you're ready, just pick up where you left off:</p>
        <p style="margin:24px 0">
          <a href="${APP_URL}/concept" style="background:#E8724B;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block">
            Resume My Concept
          </a>
        </p>
        <p style="font-size:13px;color:#666">Questions? Reply here or email <a href="mailto:hello@kealee.com">hello@kealee.com</a></p>
        <p style="font-size:13px;color:#666">— The Kealee Team</p>
      </div>
    `,
  },

  email_24h: {
    subject: 'Your project is ready — complete your order',
    getHtml: (name: string, projectType: string, leadId: string) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <h2 style="color:#1A2B4A">Still thinking it over?</h2>
        <p>Hi ${name},</p>
        <p>Your <strong>${projectType}</strong> concept is saved and ready. Complete your order to unlock:</p>
        <ul style="padding-left:20px;line-height:1.8">
          <li>AI-generated renders and floor plans</li>
          <li>Trade-by-trade cost estimate</li>
          <li>Permit scope and requirements</li>
          <li>30-minute consultation with your specialist</li>
        </ul>
        <p style="margin:24px 0">
          <a href="${APP_URL}/concept" style="background:#E8724B;color:#fff;padding:13px 30px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block;font-size:15px">
            Complete My Order
          </a>
        </p>
        <p style="font-size:13px;color:#666">Most projects are delivered within 3–5 days of payment. Pricing is revealed at checkout — no commitment until then.</p>
        <p style="font-size:13px;color:#666">— The Kealee Team · <a href="mailto:hello@kealee.com">hello@kealee.com</a></p>
      </div>
    `,
  },

  reminder_72h: {
    subject: 'Last reminder — your project details expire soon',
    getHtml: (name: string, projectType: string, leadId: string) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <h2 style="color:#1A2B4A">Your ${projectType} project is waiting</h2>
        <p>Hi ${name},</p>
        <p>We wanted to send one final reminder that your project information is still saved. Here's what you'll get when you complete your order:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
          <tr style="background:#f8f9fa">
            <td style="padding:10px 14px;font-weight:600">AI Renders</td>
            <td style="padding:10px 14px;color:#555">3–15 photorealistic visuals</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:600">Cost Estimate</td>
            <td style="padding:10px 14px;color:#555">Line-item breakdown with RSMeans data</td>
          </tr>
          <tr style="background:#f8f9fa">
            <td style="padding:10px 14px;font-weight:600">Permit Scope</td>
            <td style="padding:10px 14px;color:#555">What permits you need and how to get them</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:600">Delivery</td>
            <td style="padding:10px 14px;color:#555">3–5 business days</td>
          </tr>
        </table>
        <p style="margin:24px 0">
          <a href="${APP_URL}/concept" style="background:#E8724B;color:#fff;padding:13px 30px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block;font-size:15px">
            Complete My Order →
          </a>
        </p>
        <p style="font-size:12px;color:#999">If you've decided not to proceed, no problem — your info won't be stored after 30 days. Questions? <a href="mailto:hello@kealee.com" style="color:#E8724B">hello@kealee.com</a></p>
      </div>
    `,
  },

  // ── Soft capture nurture sequence ────────────────────────────────────────────

  nurture_1h: {
    subject: 'Got your request — here\'s what happens next',
    getHtml: (name: string, service: string) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <p>Hi ${name || 'there'},</p>
        <p>Thanks for reaching out about <strong>${service}</strong>. We've noted your interest and a specialist will follow up within 24 hours.</p>
        <p>While you wait, here's what Kealee delivers:</p>
        <ul style="padding-left:20px;line-height:1.8;font-size:14px">
          <li><strong>AI Renders</strong> — photorealistic before/after visuals of your space</li>
          <li><strong>Cost Estimate</strong> — line-item breakdown validated against RSMeans</li>
          <li><strong>Permit Scope</strong> — exactly what permits you'll need and how to file</li>
          <li><strong>Delivery</strong> — 2–6 business days from payment</li>
        </ul>
        <p style="margin:24px 0">
          <a href="${APP_URL}/concept" style="background:#E8724B;color:#fff;padding:12px 26px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block">
            See All Services
          </a>
        </p>
        <p style="font-size:13px;color:#666">— The Kealee Team · <a href="mailto:hello@kealee.com">hello@kealee.com</a></p>
      </div>
    `,
  },

  nurture_24h: {
    subject: 'How Kealee works — your questions answered',
    getHtml: (name: string, service: string) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <h2 style="color:#1A2B4A">How it works in 4 steps</h2>
        <p>Hi ${name || 'there'},</p>
        <p>We get a lot of questions about the process. Here's exactly what happens after you start a project:</p>
        <ol style="padding-left:20px;line-height:2;font-size:14px">
          <li><strong>Choose your project type</strong> — Kitchen, bathroom, addition, exterior, or 6 others</li>
          <li><strong>Tell us your vision</strong> — Budget, location, goals, and any photos</li>
          <li><strong>Checkout</strong> — Pricing shown at this step. No commitment before then.</li>
          <li><strong>Get your concept</strong> — Delivered to your inbox in 2–6 days</li>
        </ol>
        <p style="margin:24px 0">
          <a href="${APP_URL}/concept" style="background:#E8724B;color:#fff;padding:13px 30px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block">
            Start My Project →
          </a>
        </p>
        <p style="font-size:13px;color:#666">Questions? Reply to this email — we respond within a few hours.<br>— The Kealee Team</p>
      </div>
    `,
  },

  nurture_72h: {
    subject: 'Real projects. Real results.',
    getHtml: (name: string, service: string) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <h2 style="color:#1A2B4A">What our clients say</h2>
        <p>Hi ${name || 'there'},</p>
        <p>Still deciding? Here's what homeowners are saying about their Kealee concepts:</p>
        <blockquote style="border-left:3px solid #E8724B;margin:16px 0;padding:12px 16px;background:#fef9f7;font-style:italic;color:#444">
          "The renders looked exactly like the finished kitchen. My contractor used them as the blueprint. Worth every penny."
          <br><strong style="font-style:normal;font-size:13px">— Sarah M., Kitchen Remodel, Bethesda MD</strong>
        </blockquote>
        <blockquote style="border-left:3px solid #E8724B;margin:16px 0;padding:12px 16px;background:#fef9f7;font-style:italic;color:#444">
          "Got my permits approved on the first submission. The permit scope brief was the difference-maker."
          <br><strong style="font-style:normal;font-size:13px">— James T., Home Addition, Arlington VA</strong>
        </blockquote>
        <p style="margin:24px 0">
          <a href="${APP_URL}/concept" style="background:#E8724B;color:#fff;padding:13px 30px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block">
            Get My Concept
          </a>
        </p>
        <p style="font-size:12px;color:#999">— The Kealee Team · <a href="mailto:hello@kealee.com" style="color:#E8724B">hello@kealee.com</a></p>
      </div>
    `,
  },

  nurture_7d: {
    subject: 'Your project idea — still here when you\'re ready',
    getHtml: (name: string, service: string) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <p>Hi ${name || 'there'},</p>
        <p>We know home projects take time to plan. Whenever you're ready to move forward with <strong>${service}</strong>, we're here.</p>
        <p>A few things to keep in mind:</p>
        <ul style="padding-left:20px;line-height:1.8;font-size:14px">
          <li>Pricing is only revealed at checkout — browse freely with no commitment</li>
          <li>Most concepts are delivered within 3–5 business days</li>
          <li>You own everything we deliver — renders, floor plans, cost estimates, permits scope</li>
        </ul>
        <p style="margin:24px 0">
          <a href="${APP_URL}" style="background:#E8724B;color:#fff;padding:12px 26px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block">
            Explore Kealee
          </a>
        </p>
        <p style="font-size:12px;color:#999">Not interested? No problem. This is our last outreach.<br>— The Kealee Team</p>
      </div>
    `,
  },

  // ── Post-purchase upsell sequence ────────────────────────────────────────────

  upsell_7d: {
    subject: 'Your concept is delivered — what\'s next?',
    getHtml: (name: string, service: string) => `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <h2 style="color:#1A2B4A">Ready to move forward?</h2>
        <p>Hi ${name},</p>
        <p>Your <strong>${service}</strong> concept has been delivered. Now that you have your renders, cost estimate, and permit scope — here's what most clients do next:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
          <tr style="background:#f8f9fa">
            <td style="padding:10px 14px;font-weight:600">Get Permits Filed</td>
            <td style="padding:10px 14px;color:#555">We handle DMV submissions from $495</td>
            <td style="padding:10px 14px"><a href="${APP_URL}/permits" style="color:#16A34A;font-weight:600">Get Permits →</a></td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:600">Certified Estimate</td>
            <td style="padding:10px 14px;color:#555">Notarized for lender financing</td>
            <td style="padding:10px 14px"><a href="${APP_URL}/estimate" style="color:#2563EB;font-weight:600">Get Estimate →</a></td>
          </tr>
          <tr style="background:#f8f9fa">
            <td style="padding:10px 14px;font-weight:600">Match a Contractor</td>
            <td style="padding:10px 14px;color:#555">3 vetted bids from local pros</td>
            <td style="padding:10px 14px"><a href="${APP_URL}/marketplace" style="color:#E8724B;font-weight:600">Find Pros →</a></td>
          </tr>
        </table>
        <p style="font-size:13px;color:#666">Questions about your deliverables? Reply here or call <a href="tel:+12405550100">(240) 555-0100</a>.</p>
        <p style="font-size:13px;color:#666">— The Kealee Team</p>
      </div>
    `,
  },
}

// ── Processor ─────────────────────────────────────────────────────────────────

export function createLeadFollowupWorker(): Worker<LeadFollowupJobData> {
  return new Worker<LeadFollowupJobData>(
    'lead-followup',
    async (job: Job<LeadFollowupJobData>) => {
      const { leadId, email, firstName, projectType, jobType, source } = job.data
      const name = firstName || 'there'
      const serviceLabel = projectType || 'your project'

      console.log(`[lead-followup] ${jobType} for lead=${leadId} email=${email}`)

      try {
        // ── Abandoned checkout sequence ──────────────────────────────────────

        if (jobType === 'sms_1h') {
          // SMS via Twilio (stub — Twilio integration optional)
          // TODO: const twilio = getTwilioClient(); await twilio.messages.create(...)
          // For now: send a light email as a fallback touch
          const tmpl = TEMPLATES.sms_1h
          await emailQueue.sendEmail({
            to: email,
            subject: tmpl.subject,
            html: tmpl.getHtml(name, serviceLabel, leadId),
            text: `Hi ${name}, your ${serviceLabel} project details are saved at kealee.com — complete your order whenever you're ready.`,
            metadata: { eventType: 'abandoned_checkout_1h', leadId },
          })
          return { type: 'email', status: 'sent', jobType, leadId }
        }

        if (jobType === 'email_24h') {
          const tmpl = TEMPLATES.email_24h
          await emailQueue.sendEmail({
            to: email,
            subject: tmpl.subject,
            html: tmpl.getHtml(name, serviceLabel, leadId),
            text: `Hi ${name}, your ${serviceLabel} concept is ready — complete your order at kealee.com.`,
            metadata: { eventType: 'abandoned_checkout_24h', leadId },
          })
          return { type: 'email', status: 'sent', jobType, leadId }
        }

        if (jobType === 'reminder_72h') {
          const tmpl = TEMPLATES.reminder_72h
          await emailQueue.sendEmail({
            to: email,
            subject: tmpl.subject,
            html: tmpl.getHtml(name, serviceLabel, leadId),
            text: `Hi ${name}, final reminder — your ${serviceLabel} project details are saved at kealee.com.`,
            metadata: { eventType: 'abandoned_checkout_72h', leadId },
          })
          return { type: 'email', status: 'sent', jobType, leadId }
        }

        // ── Soft capture nurture sequence ────────────────────────────────────

        if (jobType === 'nurture_1h') {
          const tmpl = TEMPLATES.nurture_1h
          await emailQueue.sendEmail({
            to: email,
            subject: tmpl.subject,
            html: tmpl.getHtml(name, serviceLabel),
            text: `Hi ${name}, thanks for reaching out about ${serviceLabel}. A specialist will follow up within 24 hours. — The Kealee Team`,
            metadata: { eventType: 'soft_capture_nurture_1h', leadId, source },
          })
          return { type: 'email', status: 'sent', jobType, leadId }
        }

        if (jobType === 'nurture_24h') {
          const tmpl = TEMPLATES.nurture_24h
          await emailQueue.sendEmail({
            to: email,
            subject: tmpl.subject,
            html: tmpl.getHtml(name, serviceLabel),
            text: `Hi ${name}, here's how Kealee works: choose project → tell us your vision → checkout → get your concept in days. Start at kealee.com/concept`,
            metadata: { eventType: 'soft_capture_nurture_24h', leadId, source },
          })
          return { type: 'email', status: 'sent', jobType, leadId }
        }

        if (jobType === 'nurture_72h') {
          const tmpl = TEMPLATES.nurture_72h
          await emailQueue.sendEmail({
            to: email,
            subject: tmpl.subject,
            html: tmpl.getHtml(name, serviceLabel),
            text: `Hi ${name}, here's what homeowners say about Kealee. Start your project at kealee.com/concept`,
            metadata: { eventType: 'soft_capture_nurture_72h', leadId, source },
          })
          return { type: 'email', status: 'sent', jobType, leadId }
        }

        if (jobType === 'nurture_7d') {
          const tmpl = TEMPLATES.nurture_7d
          await emailQueue.sendEmail({
            to: email,
            subject: tmpl.subject,
            html: tmpl.getHtml(name, serviceLabel),
            text: `Hi ${name}, whenever you're ready to move forward with ${serviceLabel}, we're here. kealee.com`,
            metadata: { eventType: 'soft_capture_nurture_7d', leadId, source },
          })
          return { type: 'email', status: 'sent', jobType, leadId }
        }

        // ── Post-purchase upsell ─────────────────────────────────────────────

        if (jobType === 'upsell_7d') {
          const tmpl = TEMPLATES.upsell_7d
          await emailQueue.sendEmail({
            to: email,
            subject: tmpl.subject,
            html: tmpl.getHtml(name, serviceLabel),
            text: `Hi ${name}, your ${serviceLabel} is delivered. Next steps: permits ($495+), certified estimate ($1,850), or contractor match. See kealee.com`,
            metadata: { eventType: 'post_purchase_upsell_7d', leadId, source },
          })
          return { type: 'email', status: 'sent', jobType, leadId }
        }

        console.warn(`[lead-followup] Unknown jobType: ${jobType} — skipping`)
        return { type: 'unknown', status: 'skipped', jobType }

      } catch (err: any) {
        console.error(`[lead-followup] Job ${job.id} (${jobType}) failed:`, err.message)
        throw err
      }
    },
    { connection: redis, concurrency: 5 }
  )
}
