/**
 * Site-plan orders in the owner portal.
 *
 * The site-plan engine (services/worker/src/siteplan) writes its result to
 * `public_intake_leads.form_data.sitePlanDeliverable` — see the worker's
 * `SitePlanDeliverableRecord`. The PDF itself lives in the `documents` table
 * and is served by `/api/site-plan/[intakeId]/document`.
 *
 * Site-plan SKUs never produce a `conceptOutput`, so everything keyed on that
 * (status mapping, the concept page, the PDF link) treated them as forever
 * generating. This module is the site-plan equivalent.
 */

export const SITE_PLAN_PROJECT_PATHS = [
  'preliminary_site_plan',
  'verified_site_feasibility',
  'permit_site_plan',
] as const

export type SitePlanProjectPath = (typeof SITE_PLAN_PROJECT_PATHS)[number]

export const SITE_PLAN_LABELS: Record<SitePlanProjectPath, string> = {
  preliminary_site_plan: 'Preliminary Site Plan',
  verified_site_feasibility: 'Verified Site Feasibility Plan',
  permit_site_plan: 'Survey-Based Permit Site Plan',
}

export function isSitePlanProjectPath(path: string | null | undefined): path is SitePlanProjectPath {
  return Boolean(path) && (SITE_PLAN_PROJECT_PATHS as readonly string[]).includes(path as string)
}

export interface SitePlanQcFinding { code: string; message: string }

/** Structural copy of the worker's `SitePlanDeliverableRecord`. */
export interface SitePlanDeliverable {
  version: number
  deliveryState: string
  deliveredAt: string
  workflowId: string
  document: { id: string; filename: string | null; pageCount: number | null }
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
  terrain: { contourCount: number; intervalFt: number | null; verticalDatum: string | null }
  rulePackVersion: string | null
  qc: {
    issuable: boolean
    summary: string | null
    blocking: SitePlanQcFinding[]
    pendingSeal: SitePlanQcFinding[]
    frameFailures: { sheet: string; missing: string[] }[]
  }
  disclaimer: string
}

export function parseSitePlanDeliverable(
  formData: Record<string, unknown> | null | undefined,
): SitePlanDeliverable | null {
  if (!formData) return null
  const raw = formData.sitePlanDeliverable
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const rec = raw as Partial<SitePlanDeliverable>
  if (!rec.document || typeof rec.document !== 'object' || typeof rec.document.id !== 'string') return null
  return rec as SitePlanDeliverable
}

/** Portal page for a site-plan order. */
export function sitePlanDeliverablePath(intakeId: string): string {
  return `/deliverables/${encodeURIComponent(intakeId)}/site-plan`
}

/** Owner-facing PDF download. */
export function sitePlanDocumentUrl(intakeId: string): string {
  return `/api/site-plan/${encodeURIComponent(intakeId)}/document`
}

/** `form_data.orderStatus` values a site-plan order moves through after delivery. */
export function sitePlanOrderStage(
  formData: Record<string, unknown> | null | undefined,
): 'delivered' | 'professional_review' | 'in_progress' {
  const status = formData?.orderStatus
  if (status === 'delivered') return 'delivered'
  if (status === 'needs_professional_review' || status === 'ready_for_delivery') return 'professional_review'
  return 'in_progress'
}
