/**
 * GHL Sequence Engine
 *
 * Defines 5 drip sequences (CONCEPT, PERMIT, CONTRACTOR, NURTURE, POST_PURCHASE).
 * scheduleSequence() inserts steps into `ghl_sequence_queue` in Supabase with
 * scheduled_at = now() + delaySeconds.
 *
 * Steps are processed by the cron route at /api/cron/sequences every 5 minutes.
 */

import { getSupabaseAdmin }    from '@/lib/supabase-server'
import {
  PERMIT_BASIC_PRICE,
  CONCEPT_KITCHEN_PRICE,
  CONCEPT_WHOLE_HOME_PRICE,
} from '@kealee/core-rules'

// ── Step types ────────────────────────────────────────────────────────────────

export type StepType = 'sms' | 'email' | 'tag' | 'workflow' | 'opportunity' | 'move_stage'

export interface SmsStep {
  type:         'sms'
  delaySeconds: number
  message:      string
}

export interface EmailStep {
  type:         'email'
  delaySeconds: number
  subject:      string
  html:         string
}

export interface TagStep {
  type:         'tag'
  delaySeconds: number
  tags:         string[]
}

export interface WorkflowStep {
  type:         'workflow'
  delaySeconds: number
  workflowId:   string
  eventData?:   Record<string, string>
}

export interface OpportunityStep {
  type:            'opportunity'
  delaySeconds:    number
  name:            string
  pipelineId:      string
  pipelineStageId: string
  monetaryValue?:  number
}

export interface MoveStageStep {
  type:          'move_stage'
  delaySeconds:  number
  opportunityId: string
  newStageId:    string
}

export type SequenceStep =
  | SmsStep
  | EmailStep
  | TagStep
  | WorkflowStep
  | OpportunityStep
  | MoveStageStep

// ── Template interpolation ────────────────────────────────────────────────────

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`)
}

// ── Sequence definitions ──────────────────────────────────────────────────────

export type SequenceId =
  | 'CONCEPT_SEQUENCE'
  | 'PERMIT_SEQUENCE'
  | 'CONTRACTOR_SEQUENCE'
  | 'NURTURE_SEQUENCE'
  | 'POST_PURCHASE_SEQUENCE'

const DAY = 86400   // seconds in a day
const HR  = 3600    // seconds in an hour

export const SEQUENCES: Record<SequenceId, SequenceStep[]> = {

  // ── Concept inquiry sequence ─────────────────────────────────────────────
  CONCEPT_SEQUENCE: [
    {
      type:         'sms',
      delaySeconds: 0,
      message:      'Hi {firstName}! Thanks for your interest in a {projectType} concept from Kealee. Your AI design package starts at ${conceptPrice}. Ready to get started? → https://kealee.com/concept',
    },
    {
      type:         'tag',
      delaySeconds: 0,
      tags:         ['concept-inquiry', 'web-lead'],
    },
    {
      type:         'email',
      delaySeconds: 2 * HR,
      subject:      'Your {projectType} concept is waiting — here\'s what\'s included',
      html:         '<p>Hi {firstName},</p><p>Your AI concept package for a <strong>{projectType}</strong> project includes floor plan direction, permit scope, cost estimate, and material palette — all delivered digitally.</p><p><a href="https://kealee.com/concept?service={projectSlug}">Start my concept →</a></p>',
    },
    {
      type:         'sms',
      delaySeconds: DAY,
      message:      'Still thinking about your {projectType} project, {firstName}? Most homeowners in {location} budget ${conceptPrice}–${conceptPriceHigh} for a complete concept package. Any questions? Reply here.',
    },
    {
      type:         'email',
      delaySeconds: 3 * DAY,
      subject:      'Real project results: {projectType} in the DMV area',
      html:         '<p>Hi {firstName},</p><p>Here\'s what our clients typically experience with a <strong>{projectType}</strong> project in the DMV area:</p><ul><li>Permit scope identified before hiring a contractor</li><li>Cost estimate within 10–15% of actual bids</li><li>Contractor match within 5 business days</li></ul><p><a href="https://kealee.com/concept">Start your concept →</a></p>',
    },
    {
      type:         'sms',
      delaySeconds: 7 * DAY,
      message:      '{firstName}, just checking in — are you still planning your {projectType} project? We\'d love to help. Reply \'YES\' to get started or \'STOP\' to unsubscribe.',
    },
  ],

  // ── Permit inquiry sequence ──────────────────────────────────────────────
  PERMIT_SEQUENCE: [
    {
      type:         'sms',
      delaySeconds: 0,
      message:      `Hi {firstName}! Kealee can handle your permit filing for {projectType} in {location}. Our permit package starts at $${PERMIT_BASIC_PRICE}. Learn more: https://kealee.com/permits`,
    },
    {
      type:         'tag',
      delaySeconds: 0,
      tags:         ['permit-inquiry'],
    },
    {
      type:         'email',
      delaySeconds: HR,
      subject:      'Permit path for {projectType} in {location} — what you need to know',
      html:         '<p>Hi {firstName},</p><p>Getting a permit in {location} for a <strong>{projectType}</strong> project involves several steps. Our permit team handles the entire process — from application prep to approval tracking.</p><p><strong>What\'s included in your permit package:</strong></p><ul><li>Permit application prep and filing</li><li>Jurisdiction-specific code compliance review</li><li>Inspector coordination</li><li>Status tracking through approval</li></ul><p><a href="https://kealee.com/permits">View permit packages →</a></p>',
    },
    {
      type:         'email',
      delaySeconds: 3 * DAY,
      subject:      'Common permit mistakes homeowners make in {location}',
      html:         '<p>Hi {firstName},</p><p>The most common permit mistakes we see in {location}:</p><ol><li>Starting construction before permit approval</li><li>Incorrect scope descriptions on applications</li><li>Missing structural details for load-bearing changes</li><li>Wrong zoning classification for additions</li></ol><p>Our team handles all of this for you. <a href="https://kealee.com/permits">Start your permit package →</a></p>',
    },
    {
      type:         'sms',
      delaySeconds: 7 * DAY,
      message:      '{firstName}, are you ready to start your permit for {projectType}? Our team can have your application submitted within 5 business days. Reply YES to get started.',
    },
  ],

  // ── Contractor match sequence ────────────────────────────────────────────
  CONTRACTOR_SEQUENCE: [
    {
      type:         'sms',
      delaySeconds: 0,
      message:      'Hi {firstName}! We\'re matching you with verified contractors for your {projectType} project in {location}. We\'ll send 2–3 bids within 3 business days. Kealee',
    },
    {
      type:         'tag',
      delaySeconds: 0,
      tags:         ['contractor-match-requested'],
    },
    {
      type:         'email',
      delaySeconds: HR,
      subject:      'Contractor matching underway for your {projectType} project',
      html:         '<p>Hi {firstName},</p><p>We\'re reaching out to our verified contractor network for your <strong>{projectType}</strong> project in <strong>{location}</strong>.</p><p>You\'ll receive 2–3 competitive bids from contractors who have been background-checked, license-verified, and reviewed by our team.</p><p>Bids typically arrive within 3 business days. We\'ll notify you as each bid comes in.</p>',
    },
    {
      type:         'email',
      delaySeconds: 2 * DAY,
      subject:      'How to evaluate contractor bids for {projectType}',
      html:         '<p>Hi {firstName},</p><p>While your bids are being prepared, here\'s what to look for when comparing contractor proposals for a <strong>{projectType}</strong> project:</p><ul><li>Scope completeness — does the bid cover everything in your concept?</li><li>Payment schedule — milestone-based is best, not front-loaded</li><li>Insurance and license — verify before signing</li><li>Start date and timeline — get it in writing</li></ul>',
    },
  ],

  // ── Long-term nurture sequence ────────────────────────────────────────────
  NURTURE_SEQUENCE: [
    {
      type:         'tag',
      delaySeconds: 0,
      tags:         ['nurture-sequence'],
    },
    {
      type:         'email',
      delaySeconds: 3 * DAY,
      subject:      'Planning a {projectType} project? Here\'s where to start',
      html:         '<p>Hi {firstName},</p><p>When homeowners in {location} are planning a <strong>{projectType}</strong> project, the biggest unknowns are usually cost and permits. Kealee solves both — before you hire a contractor.</p><p><a href="https://kealee.com/concept">Start your free concept consultation →</a></p>',
    },
    {
      type:         'email',
      delaySeconds: 14 * DAY,
      subject:      '{projectType} cost guide for {location} — 2026',
      html:         `<p>Hi {firstName},</p><p>Here's what {projectType} projects typically cost in {location} in 2026:</p><ul><li>Entry-level: $15,000–$35,000</li><li>Mid-range: $40,000–$85,000</li><li>Premium: $90,000+</li></ul><p>Your actual cost depends on scope, materials, and site conditions. An AI concept from Kealee gives you a project-specific cost band in 24–48 hours.</p><p><a href="https://kealee.com/concept">Get your cost estimate →</a></p>`,
    },
    {
      type:         'email',
      delaySeconds: 30 * DAY,
      subject:      'Still thinking about your {projectType} project?',
      html:         '<p>Hi {firstName},</p><p>We know home projects take time to plan. When you\'re ready, Kealee makes it easy to get started — AI concept, permits, and contractor matching all in one place.</p><p><a href="https://kealee.com/concept">Pick up where you left off →</a></p>',
    },
  ],

  // ── Post-purchase onboarding sequence ────────────────────────────────────
  POST_PURCHASE_SEQUENCE: [
    {
      type:         'sms',
      delaySeconds: 0,
      message:      'Hi {firstName}! Payment confirmed — your {projectType} concept is in production. We\'ll deliver your package within your selected window. Questions? Reply here.',
    },
    {
      type:         'tag',
      delaySeconds: 0,
      tags:         ['paying-customer', 'concept-in-production'],
    },
    {
      type:         'email',
      delaySeconds: HR,
      subject:      'Your {projectType} concept package is confirmed — here\'s what happens next',
      html:         '<p>Hi {firstName},</p><p>Thank you for your purchase! Here\'s the timeline for your <strong>{projectType}</strong> concept package:</p><ol><li><strong>Now:</strong> Our AI design engine processes your photos and project details</li><li><strong>24–48 hours:</strong> Staff review and quality check</li><li><strong>Delivery:</strong> You\'ll receive an email with your full digital package</li></ol><p>Have photos or additional details to share? Reply to this email or upload them at <a href="https://kealee.com/upload">kealee.com/upload</a>.</p>',
    },
    {
      type:         'sms',
      delaySeconds: DAY,
      message:      '{firstName}, your {projectType} concept is being finalized. Watch your inbox for delivery! In the meantime, browse similar projects at kealee.com/blog',
    },
    {
      type:         'email',
      delaySeconds: 3 * DAY,
      subject:      'Your concept is ready — and here\'s your next step',
      html:         `<p>Hi {firstName},</p><p>Your concept package should have arrived by now. Your next step depends on what you decide:</p><ul><li><strong>Permits needed?</strong> We can file your permit application — <a href="https://kealee.com/permits">permit packages start at $${PERMIT_BASIC_PRICE}</a></li><li><strong>Ready to hire?</strong> We'll match you with 2–3 verified contractors — <a href="https://kealee.com/contractors">start contractor match</a></li><li><strong>Want more design detail?</strong> Upgrade to an Advanced Design package — <a href="https://kealee.com/concept">see options</a></li></ul>`,
    },
  ],
}

// ── scheduleSequence ──────────────────────────────────────────────────────────

export interface ScheduleSequenceResult {
  inserted: number
  sequenceId: SequenceId
  contactId: string
}

/**
 * Insert all steps of a sequence into ghl_sequence_queue with
 * scheduled_at = now() + step.delaySeconds.
 *
 * Template variables (e.g. {firstName}) are interpolated in message/html/subject strings.
 */
export async function scheduleSequence(
  contactId:  string,
  ghlContactId: string,
  sequenceId: SequenceId,
  vars:       Record<string, string>,
): Promise<ScheduleSequenceResult> {
  const supabase = getSupabaseAdmin()
  const steps    = SEQUENCES[sequenceId]
  const now      = Date.now()

  const rows = steps.map((step, i) => {
    const scheduledAt = new Date(now + step.delaySeconds * 1000).toISOString()

    // Build payload — interpolate template strings
    let payload: Record<string, unknown> = {}

    if (step.type === 'sms') {
      payload = { message: interpolate(step.message, vars) }
    } else if (step.type === 'email') {
      payload = {
        subject: interpolate(step.subject, vars),
        html:    interpolate(step.html, vars),
      }
    } else if (step.type === 'tag') {
      payload = { tags: step.tags }
    } else if (step.type === 'workflow') {
      payload = { workflowId: step.workflowId, eventData: step.eventData ?? {} }
    } else if (step.type === 'opportunity') {
      payload = {
        name:            interpolate(step.name, vars),
        pipelineId:      step.pipelineId,
        pipelineStageId: step.pipelineStageId,
        monetaryValue:   step.monetaryValue,
      }
    } else if (step.type === 'move_stage') {
      payload = { opportunityId: step.opportunityId, newStageId: step.newStageId }
    }

    return {
      contact_id:     contactId,
      ghl_contact_id: ghlContactId,
      sequence_id:    sequenceId,
      step_index:     i,
      step_type:      step.type,
      payload,
      scheduled_at:   scheduledAt,
      status:         'pending',
    }
  })

  const { error, data } = await supabase
    .from('ghl_sequence_queue')
    .insert(rows)
    .select('id')

  if (error) {
    console.error('[sequences] Insert error:', error.message)
    throw new Error(`scheduleSequence failed: ${error.message}`)
  }

  return { inserted: data?.length ?? rows.length, sequenceId, contactId }
}
