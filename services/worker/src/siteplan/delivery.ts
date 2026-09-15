/**
 * Closes the loop between the site-plan engine and the customer's order.
 *
 * `siteplan.deliver_preliminary` completes by writing PRELIMINARY_READY into a
 * stage-execution row, and until this file nothing read it: the order in
 * `public_intake_leads` stayed at the webhook's `processing`/`in_review`, the
 * owner portal kept showing "generating", and no email went out. The PDF sat
 * in `documents` with no customer-facing path to it.
 *
 * This mirrors the concept engine's "portal bridge": stage outputs are
 * projected onto `form_data.sitePlanDeliverable`, the order status advances,
 * and the universal deliverable-ready email is triggered through web-main.
 *
 * Nothing here gates on the seal. `pending_seal` items are REPORTED to the
 * customer as "items still requiring confirmation" — that line item is in the
 * product's `includes` — and never withhold the plan.
 */

import { prisma } from '@kealee/database'

// ── Stage output shapes this bridge reads ────────────────────────────────────
// Structural copies of the engine's exported interfaces, narrowed to the
// fields projected here. Kept local so the worker does not import processor
// modules just for types.

interface QcFinding { code: string; message: string }

interface DraftQcOutput {
  issuable?: boolean
  blocking?: QcFinding[]
  pendingSeal?: QcFinding[]
  summary?: string
}

interface RenderOutput {
  documentId: string
  filename?: string
  pageCount?: number
  frameFailures?: { sheet: string; missing: string[] }[]
}

interface ResolvePropertyOutput {
  matchedAddress?: string
  locatorScore?: number
  zoneCode?: string | null
  parcelAreaSqFt?: number | null
  parcelId?: string | null
  hasStreetFrontage?: boolean
  municipality?: {
    determined: boolean
    incorporated: boolean
    name: string | null
    internalStaffReviewRequired: boolean
  }
}

interface ExistingConditionsOutput {
  contourCount?: number
  intervalFt?: number | null
  verticalDatum?: string | null
}

interface EvaluateRulesOutput {
  packVersion?: string
}

interface DeliverOutput {
  deliveryState?: string
  documentId?: string
  pageCount?: number
  pendingSealCount?: number
}

/** Keys are engine job names; values are their persisted `outputs`. */
export type PriorOutputs = Record<string, unknown>

// ── The record the portal reads ──────────────────────────────────────────────

export const SITE_PLAN_PRELIMINARY_DISCLAIMER =
  'Preliminary and not for construction unless professionally reviewed. ' +
  'Not a boundary survey. Jurisdiction approval is separate and not implied.'

/**
 * Written to `public_intake_leads.form_data.sitePlanDeliverable`.
 *
 * Everything the portal shows about a site-plan order comes from this record,
 * so a field that is not here is not visible to the customer. The document
 * itself is fetched by id through the portal's site-plan document route.
 */
export interface SitePlanDeliverableRecord {
  version: 1
  deliveryState: string
  deliveredAt: string
  workflowId: string
  document: {
    id: string
    filename: string | null
    pageCount: number | null
  }
  /** What the engine could and could not establish, in customer terms. */
  property: {
    matchedAddress: string | null
    locatorScore: number | null
    parcelId: string | null
    parcelAreaSqFt: number | null
    zoneCode: string | null
    hasStreetFrontage: boolean | null
    municipality: string | null
    incorporated: boolean | null
    internalStaffReviewRequired: boolean
  }
  terrain: {
    contourCount: number
    intervalFt: number | null
    verticalDatum: string | null
  }
  rulePackVersion: string | null
  qc: {
    issuable: boolean
    summary: string | null
    /** Drawing defects. Empty on a delivered plan — a blocking finding fails the stage. */
    blocking: QcFinding[]
    /** Items a licensed professional must confirm. Reported, never gating. */
    pendingSeal: QcFinding[]
    frameFailures: { sheet: string; missing: string[] }[]
  }
  disclaimer: string
}

function asRecord<T>(v: unknown): T | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as T) : null
}

/**
 * Projects persisted stage outputs onto the customer-facing record.
 *
 * Pure. Missing upstream outputs produce `null`/empty fields rather than a
 * throw: a plan that rendered is deliverable even if, say, the contour stage
 * recorded nothing, and the record must say so instead of failing delivery.
 */
export function buildSitePlanDeliverable(input: {
  workflowId: string
  outputs: PriorOutputs
  now?: Date
}): SitePlanDeliverableRecord | null {
  const deliver = asRecord<DeliverOutput>(input.outputs['siteplan.deliver_preliminary'])
  const render = asRecord<RenderOutput>(input.outputs['siteplan.render_exports'])
  const documentId = deliver?.documentId ?? render?.documentId
  if (!documentId) return null

  const qc = asRecord<DraftQcOutput>(input.outputs['siteplan.run_draft_qc'])
  const prop = asRecord<ResolvePropertyOutput>(input.outputs['siteplan.resolve_property'])
  const terrain = asRecord<ExistingConditionsOutput>(input.outputs['siteplan.build_existing_conditions'])
  const rules = asRecord<EvaluateRulesOutput>(input.outputs['siteplan.evaluate_rules'])

  return {
    version: 1,
    deliveryState: deliver?.deliveryState ?? 'PRELIMINARY_READY',
    deliveredAt: (input.now ?? new Date()).toISOString(),
    workflowId: input.workflowId,
    document: {
      id: documentId,
      filename: render?.filename ?? null,
      pageCount: deliver?.pageCount ?? render?.pageCount ?? null,
    },
    property: {
      matchedAddress: prop?.matchedAddress ?? null,
      locatorScore: prop?.locatorScore ?? null,
      parcelId: prop?.parcelId ?? null,
      parcelAreaSqFt: prop?.parcelAreaSqFt ?? null,
      zoneCode: prop?.zoneCode ?? null,
      hasStreetFrontage: prop?.hasStreetFrontage ?? null,
      municipality: prop?.municipality?.name ?? null,
      incorporated: prop?.municipality?.determined ? prop.municipality.incorporated : null,
      internalStaffReviewRequired: prop?.municipality?.internalStaffReviewRequired ?? false,
    },
    terrain: {
      contourCount: terrain?.contourCount ?? 0,
      intervalFt: terrain?.intervalFt ?? null,
      verticalDatum: terrain?.verticalDatum ?? null,
    },
    rulePackVersion: rules?.packVersion ?? null,
    qc: {
      issuable: qc?.issuable ?? false,
      summary: qc?.summary ?? null,
      blocking: qc?.blocking ?? [],
      pendingSeal: qc?.pendingSeal ?? [],
      frameFailures: render?.frameFailures ?? [],
    },
    disclaimer: SITE_PLAN_PRELIMINARY_DISCLAIMER,
  }
}

// ── Order status ─────────────────────────────────────────────────────────────

/**
 * Site-plan SKUs and what a PRELIMINARY_READY plan means for each.
 *
 * The preliminary plan IS the product for `preliminary_site_plan`, so it is
 * delivered. For the two higher tiers it is a milestone: the customer can open
 * it now, but a professional still has to act, and the order says so. Mirrors
 * `ORDER_STATUSES` in web-main's order-status.ts — values, not the module,
 * because the worker does not import from a Next.js app.
 */
const SITE_PLAN_PRODUCT_STATUS: Record<string, 'delivered' | 'needs_professional_review'> = {
  preliminary_site_plan: 'delivered',
  verified_site_feasibility: 'needs_professional_review',
  permit_site_plan: 'needs_professional_review',
}

const ORDER_STATUS_LABEL: Record<'delivered' | 'needs_professional_review', string> = {
  delivered: 'Delivered',
  needs_professional_review: 'Needs Professional Review',
}

export function isSitePlanProduct(productId: string | null | undefined): boolean {
  return Boolean(productId && productId in SITE_PLAN_PRODUCT_STATUS)
}

/**
 * The `form_data` patch for a delivered preliminary plan.
 *
 * `orderStatus*` keys follow web-main's `orderStatusPatch()` so the admin and
 * customer views read it like any other transition. `fulfillmentStatus` moves
 * off the webhook's `manual` fallback: the engine ran, and a human picking the
 * order up should see that a plan already exists rather than start drafting.
 */
export function sitePlanDeliveryFormDataPatch(input: {
  productId: string | null | undefined
  record: SitePlanDeliverableRecord
}): Record<string, unknown> {
  const status = SITE_PLAN_PRODUCT_STATUS[input.productId ?? ''] ?? 'needs_professional_review'
  const humanNext = status === 'needs_professional_review'
  const pending = input.record.qc.pendingSeal.length

  const reason = humanNext
    ? `Preliminary site plan drafted by the engine (${pending} item${pending === 1 ? '' : 's'} pending professional confirmation). Professional review is part of this product.`
    : `Preliminary site plan delivered by the engine (${pending} item${pending === 1 ? '' : 's'} listed for confirmation).`

  return {
    sitePlanDeliverable: input.record,
    sitePlanDeliveredAt: input.record.deliveredAt,
    orderStatus: status,
    orderStatusLabel: ORDER_STATUS_LABEL[status],
    orderStatusAt: input.record.deliveredAt,
    orderStatusReason: reason,
    orderStatusSetBy: 'system',
    fulfillmentStatus: humanNext ? 'awaiting_professional_review' : 'delivered',
    fulfillmentMode: 'automated',
    fulfillmentCompletedAt: input.record.deliveredAt,
    // The webhook's manual fallback set this while the engine had no route.
    // A human is still needed on the higher tiers, but for the reason above,
    // not because automation failed.
    requiresHumanFulfillment: humanNext,
    ...(humanNext ? {} : { fulfillmentFallbackReason: null, fulfillmentFallbackDetail: null }),
  }
}

// ── Ports ────────────────────────────────────────────────────────────────────

export interface DeliveryPorts {
  loadOutputs(workflowId: string): Promise<PriorOutputs>
  /** Returns null when the order row does not exist. */
  loadOrder(orderId: string): Promise<{
    contactEmail: string | null
    clientName: string | null
    alreadyDelivered: boolean
  } | null>
  patchOrder(orderId: string, patch: Record<string, unknown>): Promise<void>
  sendReadyEmail(input: {
    to: string
    firstName: string | undefined
    service: string
    intakeId: string
    headline: string
  }): Promise<{ sent: boolean; error?: string }>
  now(): Date
}

export interface DeliveryOutcome {
  bridged: boolean
  emailed: boolean
  orderStatus: string | null
  summary: string
}

/**
 * Runs once per workflow, after the deliverable stage completes.
 *
 * Idempotent on the order: a redelivered or replayed `deliver_preliminary`
 * finds `sitePlanDeliverable` already present and stops, so the customer is
 * not emailed twice. Never throws — the plan is already drafted and persisted,
 * and a failure here must not mark the stage failed and trigger a re-render.
 */
export async function bridgeSitePlanDelivery(
  input: { workflowId: string; orderId: string; productId: string | null },
  ports: DeliveryPorts,
): Promise<DeliveryOutcome> {
  const none = (summary: string): DeliveryOutcome =>
    ({ bridged: false, emailed: false, orderStatus: null, summary })

  try {
    const order = await ports.loadOrder(input.orderId)
    if (!order) return none(`Order ${input.orderId} not found; nothing to bridge.`)
    if (order.alreadyDelivered) {
      return none(`Order ${input.orderId} already carries a site-plan deliverable; skipped.`)
    }

    const outputs = await ports.loadOutputs(input.workflowId)
    const record = buildSitePlanDeliverable({
      workflowId: input.workflowId, outputs, now: ports.now(),
    })
    if (!record) {
      return none(`Workflow ${input.workflowId} has no rendered document to deliver.`)
    }

    const patch = sitePlanDeliveryFormDataPatch({ productId: input.productId, record })
    await ports.patchOrder(input.orderId, patch)
    const orderStatus = String(patch.orderStatus)

    if (!order.contactEmail) {
      return {
        bridged: true, emailed: false, orderStatus,
        summary: `Order ${input.orderId} bridged (${orderStatus}); no customer email on file.`,
      }
    }

    const service = input.productId ?? 'preliminary_site_plan'
    const email = await ports.sendReadyEmail({
      to: order.contactEmail,
      firstName: order.clientName?.split(' ')[0] || undefined,
      service,
      intakeId: input.orderId,
      headline: orderStatus === 'delivered'
        ? 'Your preliminary site plan is ready — open it now'
        : 'Your preliminary site plan is drafted and queued for professional review',
    })

    return {
      bridged: true, emailed: email.sent, orderStatus,
      summary: email.sent
        ? `Order ${input.orderId} bridged (${orderStatus}); customer emailed.`
        : `Order ${input.orderId} bridged (${orderStatus}); email not sent (${email.error ?? 'unknown'}).`,
    }
  } catch (e) {
    return none(`Delivery bridge failed: ${e instanceof Error ? e.message : String(e)}`)
  }
}

// ── Production ports ─────────────────────────────────────────────────────────

function webMainBase(): string {
  return (
    process.env.NEXT_PUBLIC_WEB_MAIN_URL ??
    process.env.WEB_MAIN_URL ??
    'https://kealee.com'
  ).replace(/\/$/, '')
}

/**
 * The owner portal page for a site-plan order. Passed through to the email so
 * the claim link lands on the site-plan view instead of the concept page.
 */
export function sitePlanPortalPath(intakeId: string): string {
  return `/deliverables/${encodeURIComponent(intakeId)}/site-plan`
}

export function productionDeliveryPorts(deps: {
  loadOutputs: DeliveryPorts['loadOutputs']
}): DeliveryPorts {
  return {
    loadOutputs: deps.loadOutputs,

    async loadOrder(orderId) {
      const rows = await prisma.$queryRaw<
        { contact_email: string | null; client_name: string | null; delivered: boolean }[]
      >`
        SELECT contact_email, client_name,
               (form_data ? 'sitePlanDeliverable') AS delivered
        FROM public_intake_leads
        WHERE id = ${orderId}
        LIMIT 1
      `
      const row = rows[0]
      if (!row) return null
      return {
        contactEmail: row.contact_email,
        clientName: row.client_name,
        alreadyDelivered: Boolean(row.delivered),
      }
    },

    async patchOrder(orderId, patch) {
      // `||` merges at the top level, which is what a status transition wants:
      // every key in the patch replaces its predecessor and nothing else moves.
      await prisma.$executeRaw`
        UPDATE public_intake_leads
        SET form_data = COALESCE(form_data, '{}'::jsonb) || ${JSON.stringify(patch)}::jsonb,
            updated_at = now()
        WHERE id = ${orderId}
      `
    },

    async sendReadyEmail(input) {
      const res = await fetch(`${webMainBase()}/api/emails/deliverable-ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, nextPath: sitePlanPortalPath(input.intakeId) }),
      })
      if (res.ok) return { sent: true }
      return { sent: false, error: `HTTP ${res.status}` }
    },

    now: () => new Date(),
  }
}
