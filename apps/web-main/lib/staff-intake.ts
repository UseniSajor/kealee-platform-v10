/**
 * Staff-operated intake.
 *
 * Two situations the public form does not serve:
 *
 *   ASSISTED  — someone rings up, or is not comfortable with a web form, and a
 *               member of staff takes the order for them. A real, billable
 *               customer order; only the data entry differs.
 *
 *   IN_HOUSE  — Kealee's own lots. No customer, no payment, no Stripe. The same
 *               engine, the same reports, the same review gates.
 *
 * The design constraint that matters is the phone call. A caller will not have
 * every answer to hand, and the person taking the order must be able to move on
 * without inventing one. So every field beyond the minimum is optional, and
 * anything not captured is recorded as NOT ASKED rather than left to look like
 * an answered "no". That distinction survives all the way into the rule engine,
 * where an unknown lot type routes to a human instead of silently defaulting to
 * "interior" and producing the wrong setback.
 */

import { SITE_PLAN_PROJECT_PATHS } from '@/lib/site-plan-rules'
import { resolveProductAutomationRoute } from '@/lib/product-automation'

export type IntakeMode = 'assisted' | 'in_house'

/** Products a staff member can open an order for. */
export const STAFF_INTAKE_PATHS = [
  ...SITE_PLAN_PROJECT_PATHS,
  'design_concept',
  'cost_estimate',
  'certified_estimate',
  'permit_path_only',
  'estimate_permit_bundle',
  'design_estimate_permit_bundle',
] as const

export type StaffIntakePath = (typeof STAFF_INTAKE_PATHS)[number]

export interface StaffIntakeInput {
  mode: IntakeMode
  projectPath: string

  /** Required for an assisted order; a label is enough for in-house. */
  clientName?: string
  contactEmail?: string
  contactPhone?: string
  projectAddress: string

  /** Whoever took the call, for the audit trail. */
  takenBy: string
  /** Free-text notes from the call. */
  callNotes?: string

  /** Anything the caller could answer. Everything here is optional. */
  formData?: Record<string, unknown>
  /** Field names the caller could not answer. Recorded, never guessed. */
  notAsked?: string[]

  budgetRange?: string
}

export interface StaffIntakeValidation {
  ok: boolean
  errors: string[]
  /** Non-fatal: things worth chasing but not worth blocking the order. */
  warnings: string[]
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/**
 * Validates a staff-entered order.
 *
 * Deliberately lenient on everything except identity and address. Blocking a
 * phone order because the caller does not know their lot width would mean the
 * order never gets taken — the engine already handles unknowns properly, so the
 * intake does not need to.
 */
export function validateStaffIntake(input: StaffIntakeInput): StaffIntakeValidation {
  const errors: string[] = []
  const warnings: string[] = []

  if (!STAFF_INTAKE_PATHS.includes(input.projectPath as StaffIntakePath)) {
    errors.push(`Unknown product "${input.projectPath}".`)
  }
  if (!input.projectAddress?.trim()) {
    errors.push('A project address is required — without it no jurisdiction can be resolved.')
  }
  if (!input.takenBy?.trim()) {
    errors.push('Record who took this order.')
  }

  if (input.mode === 'assisted') {
    if (!input.clientName?.trim()) errors.push('A client name is required for a customer order.')
    if (!input.contactEmail?.trim() && !input.contactPhone?.trim()) {
      errors.push('A customer order needs at least an email or a phone number to deliver to.')
    }
    if (input.contactEmail && !EMAIL.test(input.contactEmail.trim())) {
      errors.push('The email address is not valid — deliverables would not reach the customer.')
    }
    if (!input.contactEmail?.trim()) {
      warnings.push('No email captured. Deliverables cannot be sent until one is obtained.')
    }
  }

  if (input.mode === 'in_house' && (input.contactEmail || input.clientName)) {
    warnings.push('In-house job with customer details attached — check the mode is right.')
  }

  const fd = input.formData ?? {}
  if (!fd.zone && !fd.zoning) {
    warnings.push('No zone captured. It will be resolved from GIS, which is preliminary until surveyed.')
  }
  if (fd.cornerLot === undefined && !fd.lotType) {
    warnings.push(
      'Corner-lot status not captured. It changes the front yard requirement in most zones, so the ' +
      'rule engine will route the setback to a human rather than guess.',
    )
  }

  return { ok: errors.length === 0, errors, warnings }
}

/**
 * Builds the `form_data` for a staff-entered order.
 *
 * `staffIntake.notAsked` is the load-bearing part. A phone order legitimately
 * has gaps, and recording which questions were never put to the caller is what
 * lets ops chase the right person later instead of guessing why a rule went to
 * review.
 */
export function buildStaffIntakeFormData(input: StaffIntakeInput): Record<string, unknown> {
  const notAsked = [...new Set(input.notAsked ?? [])].sort()
  return {
    ...(input.formData ?? {}),
    staffIntake: {
      mode: input.mode,
      takenBy: input.takenBy,
      takenAt: new Date().toISOString(),
      callNotes: input.callNotes ?? null,
      // Never conflate "asked and answered no" with "never asked".
      notAsked,
      channel: input.mode === 'in_house' ? 'internal' : 'phone_or_assisted',
    },
    ...(input.mode === 'in_house'
      ? {
          inHouseJob: true,
          requiresPayment: false,
          billingExempt: 'self-perform',
          // An in-house job is still a v30 AI-automated order. It skips Stripe,
          // not the bots — without this flag it would sit paid and idle,
          // because nothing downstream would recognise it as automated.
          // `v30` is a frozen DB key written by os-ai-orch; see CLAUDE.md.
          v30: true,
          v30Source: 'admin-in-house',
        }
      : {}),
  }
}

/**
 * The automation fields the Stripe webhook would normally attach.
 *
 * An in-house job never passes through the webhook, so if these are not set
 * here the order is paid, flagged v30, and still picked up by nothing. This is
 * the same route resolution the webhook performs, applied at creation instead.
 */
export function buildInHouseAutomationFormData(projectPath: string): Record<string, unknown> {
  const route = resolveProductAutomationRoute({ source: 'public_intake_v30', projectPath })
  if (!route) {
    return {
      fulfillmentStatus: 'unroutable',
      fulfillmentNote:
        `No automation route is configured for "${projectPath}". The job was created but no bot will ` +
        'pick it up — route it by hand.',
    }
  }
  return {
    ...route,
    fulfillmentStatus: 'queued',
    fulfillmentQueuedAt: new Date().toISOString(),
  }
}

export interface StaffIntakeRecord {
  project_path: string
  client_name: string
  contact_email: string | null
  contact_phone: string | null
  project_address: string
  budget_range: string
  source: string
  status: string
  requires_payment: boolean
  payment_amount: number
  metadata: Record<string, unknown>
  form_data: Record<string, unknown>
}

/**
 * The row to insert.
 *
 * An in-house job is created already paid: there is no Stripe session coming,
 * and leaving it "new" would strand it outside every fulfilment path. An
 * assisted order stays unpaid — a staff member takes payment separately, and
 * the existing webhook drives fulfilment exactly as it does for a web order.
 */
export function buildStaffIntakeRecord(input: StaffIntakeInput): StaffIntakeRecord {
  const inHouse = input.mode === 'in_house'
  return {
    project_path: input.projectPath,
    client_name: (input.clientName ?? `In-house — ${input.projectAddress}`).trim(),
    contact_email: input.contactEmail?.trim() || null,
    contact_phone: input.contactPhone?.trim() || null,
    project_address: input.projectAddress.trim(),
    budget_range: input.budgetRange?.trim() || 'Not provided',
    source: inHouse ? 'admin-in-house' : 'admin-assisted',
    status: inHouse ? 'paid' : 'new',
    requires_payment: !inHouse,
    payment_amount: 0,
    metadata: {
      enteredBy: input.takenBy,
      enteredAt: new Date().toISOString(),
      intakeMode: input.mode,
    },
    form_data: {
      ...buildStaffIntakeFormData(input),
      ...(inHouse ? buildInHouseAutomationFormData(input.projectPath) : {}),
    },
  }
}
