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
  preliminary_site_plan: 'Preliminary Design Concept + Site Plan',
  verified_site_feasibility: 'Verified Site Feasibility Plan',
  permit_site_plan: 'Full / Detailed Survey-Based Site Plan',
}

export interface SitePlanPackageGuide {
  level: string
  summary: string
  sections: { number: string; title: string; description: string }[]
}

/**
 * Purchaser-facing reading order. Preliminary and full/detailed plans must
 * never share a name or imply the same evidence, professional review, or use.
 */
export const SITE_PLAN_PACKAGE_GUIDES: Record<SitePlanProjectPath, SitePlanPackageGuide> = {
  preliminary_site_plan: {
    level: 'Preliminary — unsealed',
    summary: 'Use this civil-planning package to understand existing site conditions, test a possible layout, identify constraints, and decide what to verify next. It is not a permit or construction set.',
    sections: [
      { number: '01', title: 'Project brief + design basis', description: 'Property, jurisdiction, stated program, source register, drawing basis, assumptions, and package limitations.' },
      { number: '02', title: 'Existing conditions', description: 'Parcel and adjoining context, streets and access, available contours, mapped easements, utilities, flood, soils, trees, and environmental constraints—only where supported by identified sources.' },
      { number: '03', title: 'Concept site + zoning plan', description: 'Buildable area, setbacks or BRLs, proposed footprint, lots, access, parking, circulation, open space, coverage, and key dimensions.' },
      { number: '04', title: 'Preliminary civil strategy', description: 'Conceptual grading and drainage direction, utility approach, stormwater and erosion-control implications, earthwork or roadway considerations, and likely approvals.' },
      { number: '05', title: 'Verification + next steps', description: 'Confidence by item, conflicts, alternatives, and the survey, field work, agency confirmation, or licensed-professional decisions required before detailed design.' },
    ],
  },
  verified_site_feasibility: {
    level: 'Preliminary — professionally reviewed',
    summary: 'Use this package to compare a proposed layout against verified inputs. A review does not turn it into a sealed permit or construction set.',
    sections: [
      { number: '01', title: 'Reviewed design concept', description: 'The proposed site layout and the practical development intent in purchaser-friendly form.' },
      { number: '02', title: 'Verified feasibility plan', description: 'The technical drawing and constraint analysis tied to the verified sources listed in the package.' },
      { number: '03', title: 'Professional findings', description: 'Reviewer decisions, exceptions, redlines, remaining evidence, and the recommended next service.' },
    ],
  },
  permit_site_plan: {
    level: 'Full / detailed — survey based',
    summary: 'This is the separate technical-plan workflow. Its sheet scope, professional responsibilities, seals, and agency status are shown explicitly.',
    sections: [
      { number: '01', title: 'Project + design basis', description: 'Approved scope, survey basis, jurisdiction requirements, sheet index, and professional responsibility.' },
      { number: '02', title: 'Detailed technical plans', description: 'Applicable existing-conditions, layout, grading, drainage, stormwater, utility, roadway, detail, landscape, profile, and calculation sheets.' },
      { number: '03', title: 'Review + submission status', description: 'Professional approvals or redlines, seals included or pending, agency checklist, outstanding items, and filing status.' },
    ],
  },
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

/** Structural copy of the worker's `SitePlanReviewRecord`. */
export interface SitePlanReview {
  version: number
  state: 'APPROVED' | 'CHANGES_REQUESTED'
  recordedAt: string
  reviewer: {
    displayName: string
    licenceNumber: string | null
    licenceState: string | null
    discipline: string
  } | null
  approvals: { subject: string; decision: string; comment: string | null; decidedAt: string | null }[]
  redlines: { subject: string; comment: string; decision: string }[]
  reviewCompletedAt: string | null
  note: string
}

export function parseSitePlanReview(
  formData: Record<string, unknown> | null | undefined,
): SitePlanReview | null {
  if (!formData) return null
  const raw = formData.sitePlanReview
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const rec = raw as Partial<SitePlanReview>
  if (rec.state !== 'APPROVED' && rec.state !== 'CHANGES_REQUESTED') return null
  return rec as SitePlanReview
}

/** `form_data.orderStatus` values a site-plan order moves through after delivery. */
export function sitePlanOrderStage(
  formData: Record<string, unknown> | null | undefined,
): 'delivered' | 'professional_review' | 'revision' | 'staff_review' | 'in_progress' {
  const status = formData?.orderStatus
  if (status === 'delivered') return 'delivered'
  if (status === 'needs_professional_review' || status === 'ready_for_delivery') return 'professional_review'
  if (status === 'revision_requested') return 'revision'
  if (status === 'in_review' && parseSitePlanReview(formData)) return 'staff_review'
  return 'in_progress'
}

/** Human label for a Prisma SitePlanContentSubject value. */
export function reviewSubjectLabel(subject: string): string {
  return subject.toLowerCase().replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
}
