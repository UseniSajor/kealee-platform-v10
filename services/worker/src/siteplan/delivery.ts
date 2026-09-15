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
 * Products whose price includes a licensed professional's review. For these
 * the preliminary plan is a milestone and `siteplan.route_review` is enqueued
 * as soon as it is delivered.
 */
export function productIncludesProfessionalReview(productId: string | null | undefined): boolean {
  return SITE_PLAN_PRODUCT_STATUS[productId ?? ''] === 'needs_professional_review'
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

// ── Professional review outcome ──────────────────────────────────────────────

interface Redline {
  subject: string
  comment: string
  decision: 'CHANGES_REQUESTED' | 'REJECTED'
  decidedByName: string | null
  decidedAt: string | null
}

/** Structural copy of the engine's RouteReviewOutput, narrowed. */
interface RouteReviewOutput {
  reviewState: 'UNCLAIMED' | 'IN_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED'
  documentId?: string
  reviewer?: {
    displayName: string
    licenceNumber: string | null
    licenceState: string | null
    discipline: string
  } | null
  approvals?: {
    subject: string; decision: string; comment: string | null
    decidedByName: string | null; decidedAt: string | null
  }[]
  outstanding?: string[]
  redlines?: Redline[]
  reviewCompletedAt?: string | null
}

/** Written to `form_data.sitePlanReview` — the reviewer sign-off status the higher tiers promise. */
export interface SitePlanReviewRecord {
  version: 1
  state: 'APPROVED' | 'CHANGES_REQUESTED'
  recordedAt: string
  workflowId: string
  documentId: string | null
  reviewer: RouteReviewOutput['reviewer'] | null
  approvals: NonNullable<RouteReviewOutput['approvals']>
  redlines: Redline[]
  reviewCompletedAt: string | null
  note: string
}

export function buildSitePlanReviewRecord(input: {
  workflowId: string
  outputs: PriorOutputs
  now?: Date
}): SitePlanReviewRecord | null {
  const routed = asRecord<RouteReviewOutput>(input.outputs['siteplan.route_review'])
  if (!routed) return null
  if (routed.reviewState !== 'APPROVED' && routed.reviewState !== 'CHANGES_REQUESTED') return null
  return {
    version: 1,
    state: routed.reviewState,
    recordedAt: (input.now ?? new Date()).toISOString(),
    workflowId: input.workflowId,
    documentId: routed.documentId ?? null,
    reviewer: routed.reviewer ?? null,
    approvals: routed.approvals ?? [],
    redlines: routed.redlines ?? [],
    reviewCompletedAt: routed.reviewCompletedAt ?? null,
    note: routed.reviewState === 'APPROVED'
      ? 'Scoped professional review complete. Sealing remains a separate act, and jurisdiction approval is not implied.'
      : 'The reviewer withheld approval on at least one subject. Kealee is revising the plan.',
  }
}

/**
 * The `form_data` patch once the professional has decided.
 *
 * APPROVED on `verified_site_feasibility` is the end of that product —
 * "reviewer sign-off status" is its last line item — so it is delivered.
 * APPROVED on `permit_site_plan` still has issuance QC and submission ahead,
 * and those groups are not connected, so a Kealee reviewer carries it by hand
 * and the order says so. CHANGES_REQUESTED routes to a drafter either way.
 */
export function sitePlanReviewFormDataPatch(input: {
  productId: string | null | undefined
  record: SitePlanReviewRecord
}): Record<string, unknown> {
  const reviewer = input.record.reviewer
  const licence = reviewer
    ? [reviewer.licenceState, reviewer.licenceNumber].filter(Boolean).join(' ')
    : ''
  const who = reviewer
    ? licence ? `${reviewer.displayName} (${licence})` : reviewer.displayName
    : 'the assigned professional'

  if (input.record.state === 'CHANGES_REQUESTED') {
    const n = input.record.redlines.length
    return {
      sitePlanReview: input.record,
      orderStatus: 'revision_requested',
      orderStatusLabel: 'Revision Requested',
      orderStatusAt: input.record.recordedAt,
      orderStatusReason: `${who} requested changes on ${n} subject${n === 1 ? '' : 's'}. A drafter applies the redlines and the plan is re-routed for review.`,
      orderStatusSetBy: 'system',
      fulfillmentStatus: 'awaiting_drafter',
      requiresHumanFulfillment: true,
    }
  }

  const terminal = input.productId === 'verified_site_feasibility'
  return {
    sitePlanReview: input.record,
    sitePlanReviewedAt: input.record.reviewCompletedAt ?? input.record.recordedAt,
    orderStatus: terminal ? 'delivered' : 'in_review',
    orderStatusLabel: terminal ? 'Delivered' : 'In Review',
    orderStatusAt: input.record.recordedAt,
    orderStatusReason: terminal
      ? `Professional review completed by ${who}.`
      : `Professional review completed by ${who}. Issuance QC and the submission package are prepared by Kealee staff.`,
    orderStatusSetBy: 'system',
    fulfillmentStatus: terminal ? 'delivered' : 'awaiting_issuance',
    fulfillmentMode: 'automated',
    ...(terminal ? { fulfillmentCompletedAt: input.record.recordedAt } : {}),
    requiresHumanFulfillment: !terminal,
  }
}

/**
 * Runs when `siteplan.route_review` COMPLETES. Idempotent on the review
 * state: the same decision is not re-bridged or re-emailed.
 */
export async function bridgeSitePlanReviewOutcome(
  input: { workflowId: string; orderId: string; productId: string | null },
  ports: DeliveryPorts,
): Promise<DeliveryOutcome> {
  const none = (summary: string): DeliveryOutcome =>
    ({ bridged: false, emailed: false, orderStatus: null, summary })

  try {
    const order = await ports.loadOrder(input.orderId)
    if (!order) return none(`Order ${input.orderId} not found; nothing to bridge.`)

    const outputs = await ports.loadOutputs(input.workflowId)
    const record = buildSitePlanReviewRecord({ workflowId: input.workflowId, outputs, now: ports.now() })
    if (!record) return none(`Workflow ${input.workflowId} has no decided review to bridge.`)

    if (order.reviewState === record.state) {
      return none(`Order ${input.orderId} already carries review state ${record.state}; skipped.`)
    }

    const patch = sitePlanReviewFormDataPatch({ productId: input.productId, record })
    await ports.patchOrder(input.orderId, patch)
    const orderStatus = String(patch.orderStatus)

    // Changes requested is Kealee's work, not the customer's; no email until
    // the revised plan comes back around.
    if (record.state !== 'APPROVED' || !order.contactEmail) {
      return {
        bridged: true, emailed: false, orderStatus,
        summary: `Order ${input.orderId} review bridged (${orderStatus}).`,
      }
    }

    const email = await ports.sendReadyEmail({
      to: order.contactEmail,
      firstName: order.clientName?.split(' ')[0] || undefined,
      service: input.productId ?? 'verified_site_feasibility',
      intakeId: input.orderId,
      headline: 'Your site plan has been professionally reviewed',
    })
    return {
      bridged: true, emailed: email.sent, orderStatus,
      summary: email.sent
        ? `Order ${input.orderId} review bridged (${orderStatus}); customer emailed.`
        : `Order ${input.orderId} review bridged (${orderStatus}); email not sent (${email.error ?? 'unknown'}).`,
    }
  } catch (e) {
    return none(`Review bridge failed: ${e instanceof Error ? e.message : String(e)}`)
  }
}

// ── Review routing notice ────────────────────────────────────────────────────

/**
 * Tells the review desk a plan is waiting. Without this a
 * `verified_site_feasibility` order could sit at needs_professional_review
 * until someone happened to open /engineer/review.
 */
export async function notifyReviewRouted(
  input: { workflowId: string; orderId: string; productId: string | null; address: string | null },
  ports: Pick<DeliveryPorts, 'notifyOps'>,
): Promise<{ sent: boolean; summary: string }> {
  const webMain = webMainBase()
  const r = await ports.notifyOps({
    subject: `Site plan awaiting professional review — ${input.productId ?? 'site plan'}`,
    text: [
      'A preliminary site plan has been delivered and routed for licensed professional review.',
      '',
      `  Order:     ${input.orderId}`,
      `  Product:   ${input.productId ?? '-'}`,
      `  Address:   ${input.address ?? '-'}`,
      `  Workflow:  ${input.workflowId}`,
      '',
      `Claim it in the engineer review queue: ${webMain}/engineer/review`,
      'The order stays at needs_professional_review until the review is completed there.',
    ].join('\n'),
  }).catch((e: unknown) => ({ sent: false, error: e instanceof Error ? e.message : String(e) }))
  return {
    sent: r.sent,
    summary: r.sent ? 'Review desk notified.' : `Review desk NOT notified (${r.error ?? 'unknown'}).`,
  }
}

// ── Submission package ───────────────────────────────────────────────────────

/** Structural copy of the engine's SubmissionPackageOutput, narrowed. */
interface SubmissionPackageOutput {
  deliveryState: 'SUBMISSION_READY' | 'SUBMISSION_INCOMPLETE'
  submissionReady: boolean
  documentId: string
  pageCount?: number
  jurisdiction?: string
  agency?: string
  checklist?: { providedCount: number; outstandingCount: number; items: unknown[] }
  outstanding?: { code: string; requirement: string; responsible: string }[]
  blockingDisciplines?: string[]
  note?: string
}

/** Written to `form_data.sitePlanSubmission`. */
export interface SitePlanSubmissionRecord {
  version: 1
  state: 'SUBMISSION_READY' | 'SUBMISSION_INCOMPLETE'
  recordedAt: string
  workflowId: string
  documentId: string
  jurisdiction: string | null
  agency: string | null
  checklist: { providedCount: number; outstandingCount: number; items: unknown[] }
  outstanding: { code: string; requirement: string; responsible: string }[]
  note: string
}

export function buildSitePlanSubmissionRecord(input: {
  workflowId: string
  outputs: PriorOutputs
  now?: Date
}): SitePlanSubmissionRecord | null {
  const sub = asRecord<SubmissionPackageOutput>(input.outputs['siteplan.build_submission'])
  if (!sub?.documentId) return null
  return {
    version: 1,
    state: sub.deliveryState,
    recordedAt: (input.now ?? new Date()).toISOString(),
    workflowId: input.workflowId,
    documentId: sub.documentId,
    jurisdiction: sub.jurisdiction ?? null,
    agency: sub.agency ?? null,
    checklist: sub.checklist ?? { providedCount: 0, outstandingCount: 0, items: [] },
    outstanding: sub.outstanding ?? [],
    note: sub.note ?? '',
  }
}

/**
 * A ready package is the end of `permit_site_plan` as far as automation goes:
 * the customer has the drawing, the county checklist and nothing outstanding.
 * Filing itself is a separate act. An incomplete package is delivered too —
 * the drawing and the list of what is still owed are the useful thing — but
 * the order stays with a human because someone has to chase those items.
 */
export function sitePlanSubmissionFormDataPatch(input: {
  record: SitePlanSubmissionRecord
}): Record<string, unknown> {
  const ready = input.record.state === 'SUBMISSION_READY'
  const n = input.record.outstanding.length
  return {
    sitePlanSubmission: input.record,
    orderStatus: ready ? 'delivered' : 'in_review',
    orderStatusLabel: ready ? 'Delivered' : 'In Review',
    orderStatusAt: input.record.recordedAt,
    orderStatusReason: ready
      ? 'Submission package assembled and labelled ready to submit. Filing with the County is a separate act; jurisdiction approval is not implied.'
      : `Submission package assembled with ${n} outstanding item${n === 1 ? '' : 's'}. A Kealee coordinator resolves them before filing.`,
    orderStatusSetBy: 'system',
    fulfillmentStatus: ready ? 'delivered' : 'awaiting_submission_items',
    fulfillmentMode: 'automated',
    ...(ready ? { fulfillmentCompletedAt: input.record.recordedAt } : {}),
    requiresHumanFulfillment: !ready,
  }
}

export async function bridgeSitePlanSubmission(
  input: { workflowId: string; orderId: string; productId: string | null },
  ports: DeliveryPorts,
): Promise<DeliveryOutcome> {
  const none = (summary: string): DeliveryOutcome =>
    ({ bridged: false, emailed: false, orderStatus: null, summary })
  try {
    const order = await ports.loadOrder(input.orderId)
    if (!order) return none(`Order ${input.orderId} not found; nothing to bridge.`)
    const outputs = await ports.loadOutputs(input.workflowId)
    const record = buildSitePlanSubmissionRecord({ workflowId: input.workflowId, outputs, now: ports.now() })
    if (!record) return none(`Workflow ${input.workflowId} has no submission package to bridge.`)
    if (order.submissionState === record.state) {
      return none(`Order ${input.orderId} already carries submission state ${record.state}; skipped.`)
    }
    const patch = sitePlanSubmissionFormDataPatch({ record })
    await ports.patchOrder(input.orderId, patch)
    const orderStatus = String(patch.orderStatus)

    if (!order.contactEmail) {
      return { bridged: true, emailed: false, orderStatus, summary: `Order ${input.orderId} submission bridged (${orderStatus}); no customer email.` }
    }
    const email = await ports.sendReadyEmail({
      to: order.contactEmail,
      firstName: order.clientName?.split(' ')[0] || undefined,
      service: input.productId ?? 'permit_site_plan',
      intakeId: input.orderId,
      headline: record.state === 'SUBMISSION_READY'
        ? 'Your permit site plan package is ready to submit'
        : 'Your permit site plan package and county checklist are in your portal',
    })
    return {
      bridged: true, emailed: email.sent, orderStatus,
      summary: email.sent
        ? `Order ${input.orderId} submission bridged (${orderStatus}); customer emailed.`
        : `Order ${input.orderId} submission bridged (${orderStatus}); email not sent (${email.error ?? 'unknown'}).`,
    }
  } catch (e) {
    return none(`Submission bridge failed: ${e instanceof Error ? e.message : String(e)}`)
  }
}

// ── County comment round ─────────────────────────────────────────────────────

interface IngestCommentsOutput {
  round: number
  receivedCount: number
  comments: { id: string; sheet?: string; reviewer: string; comment: string; receivedAt: string }[]
  documentId: string
  resumeFrom: string
  note: string
}

/** Written to `form_data.sitePlanCountyReview`. */
export interface SitePlanCountyReviewRecord {
  version: 1
  round: number
  recordedAt: string
  workflowId: string
  documentId: string
  comments: IngestCommentsOutput['comments']
  resumeFrom: string
  note: string
}

export function buildSitePlanCountyReviewRecord(input: {
  workflowId: string
  outputs: PriorOutputs
  now?: Date
}): SitePlanCountyReviewRecord | null {
  const out = asRecord<IngestCommentsOutput>(input.outputs['siteplan.ingest_comments'])
  if (!out || !Array.isArray(out.comments) || out.comments.length === 0) return null
  return {
    version: 1,
    round: out.round,
    recordedAt: (input.now ?? new Date()).toISOString(),
    workflowId: input.workflowId,
    documentId: out.documentId,
    comments: out.comments,
    resumeFrom: out.resumeFrom,
    note: out.note,
  }
}

/**
 * County comments mean corrections: the order goes to revision_requested,
 * the comment ids are marked consumed so the next round only sees new ones,
 * and the resume point is recorded for the coordinator.
 */
export function sitePlanCountyReviewFormDataPatch(input: {
  record: SitePlanCountyReviewRecord
  previouslyIngested: string[]
}): Record<string, unknown> {
  const n = input.record.comments.length
  return {
    sitePlanCountyReview: input.record,
    sitePlanCountyCommentsIngested: [
      ...new Set([...input.previouslyIngested, ...input.record.comments.map(c => c.id)]),
    ],
    orderStatus: 'revision_requested',
    orderStatusLabel: 'Revision Requested',
    orderStatusAt: input.record.recordedAt,
    orderStatusReason:
      `County review returned ${n} comment${n === 1 ? '' : 's'} (round ${input.record.round}). ` +
      `Revise the inputs, then re-run ${input.record.resumeFrom}.`,
    orderStatusSetBy: 'system',
    fulfillmentStatus: 'awaiting_county_corrections',
    requiresHumanFulfillment: true,
  }
}

export async function bridgeSitePlanCountyReview(
  input: { workflowId: string; orderId: string; productId: string | null },
  ports: DeliveryPorts,
): Promise<DeliveryOutcome> {
  const none = (summary: string): DeliveryOutcome =>
    ({ bridged: false, emailed: false, orderStatus: null, summary })
  try {
    const order = await ports.loadOrder(input.orderId)
    if (!order) return none(`Order ${input.orderId} not found; nothing to bridge.`)
    const outputs = await ports.loadOutputs(input.workflowId)
    const record = buildSitePlanCountyReviewRecord({ workflowId: input.workflowId, outputs, now: ports.now() })
    if (!record) return none(`Workflow ${input.workflowId} has no ingested county comments to bridge.`)
    const newIds = record.comments.map(c => c.id).filter(id => !order.countyCommentsIngested.includes(id))
    if (newIds.length === 0) {
      return none(`Order ${input.orderId} already carries round ${record.round}'s comments; skipped.`)
    }
    const patch = sitePlanCountyReviewFormDataPatch({ record, previouslyIngested: order.countyCommentsIngested })
    await ports.patchOrder(input.orderId, patch)
    return {
      bridged: true, emailed: false, orderStatus: String(patch.orderStatus),
      summary: `Order ${input.orderId} county review round ${record.round} bridged (${record.comments.length} comments).`,
    }
  } catch (e) {
    return none(`County review bridge failed: ${e instanceof Error ? e.message : String(e)}`)
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
    /** `form_data.sitePlanReview.state`, when a review has been bridged. */
    reviewState: string | null
    /** `form_data.sitePlanSubmission.state`, when a submission has been bridged. */
    submissionState: string | null
    address: string | null
    /** `form_data.sitePlanCountyCommentsIngested` — comment ids consumed by earlier rounds. */
    countyCommentsIngested: string[]
  } | null>
  patchOrder(orderId: string, patch: Record<string, unknown>): Promise<void>
  sendReadyEmail(input: {
    to: string
    firstName: string | undefined
    service: string
    intakeId: string
    headline: string
  }): Promise<{ sent: boolean; error?: string }>
  /** Internal notice to the review desk. Never to the customer. */
  notifyOps(input: { subject: string; text: string }): Promise<{ sent: boolean; error?: string }>
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
        {
          contact_email: string | null; client_name: string | null; project_address: string | null
          delivered: boolean; review_state: string | null; submission_state: string | null
          ingested: unknown
        }[]
      >`
        SELECT contact_email, client_name, project_address,
               (form_data ? 'sitePlanDeliverable') AS delivered,
               form_data #>> '{sitePlanReview,state}' AS review_state,
               form_data #>> '{sitePlanSubmission,state}' AS submission_state,
               form_data -> 'sitePlanCountyCommentsIngested' AS ingested
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
        reviewState: row.review_state,
        submissionState: row.submission_state,
        address: row.project_address,
        countyCommentsIngested: Array.isArray(row.ingested) ? (row.ingested as unknown[]).map(String) : [],
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

    async notifyOps(input) {
      const key = process.env.RESEND_API_KEY
      if (!key) return { sent: false, error: 'RESEND_API_KEY not configured' }
      const to = process.env.SITE_PLAN_REVIEW_DESK_EMAIL ?? 'hello@kealee.com'
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Kealee Notifications <notifications@kealee.com>',
          to: [to], subject: input.subject, text: input.text,
        }),
      })
      return res.ok ? { sent: true } : { sent: false, error: `Resend ${res.status}` }
    },

    now: () => new Date(),
  }
}
