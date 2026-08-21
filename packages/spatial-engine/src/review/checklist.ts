/**
 * County checklist and issuance quality control.
 *
 * Two jobs:
 *   1. Produce the DPIE submission checklist draft (delivery item 8), so an
 *      applicant knows exactly what the County will look for.
 *   2. Run the issuance QC blocks from the brief, so a package that would be
 *      rejected on intake is caught here instead.
 *
 * A QC block stops ISSUANCE — labelling the set as ready to submit. It does not
 * stop drafting. The drawings are still produced; they are just not called
 * submission-ready while a blocking condition stands.
 */

import type { SiteTwin } from '../site-plan/site-twin'
import { checkTwinConsistency, featuresOfKind } from '../site-plan/site-twin'
import type { ApplicabilityReport } from '../site-plan/classification'
import type { ReviewMatrix } from './disciplines'
import type { SheetId } from '../sheets/sheet-template'

export interface ChecklistItem {
  code: string
  requirement: string
  /** Where the requirement comes from. Never an unexplained rule. */
  citation: string
  status: 'provided' | 'outstanding' | 'not_applicable'
  evidence?: string
  responsible: string
}

export interface CountyChecklist {
  jurisdiction: string
  agency: string
  items: ChecklistItem[]
  providedCount: number
  outstandingCount: number
  summary: string
}

export function buildCountyChecklist(input: {
  twin: SiteTwin
  applicability: ApplicabilityReport
  sheets: SheetId[]
}): CountyChecklist {
  const { twin, applicability, sheets } = input
  const items: ChecklistItem[] = []
  const has = (k: Parameters<typeof featuresOfKind>[1]) => featuresOfKind(twin, k).length > 0

  const add = (
    code: string,
    requirement: string,
    citation: string,
    provided: boolean,
    responsible: string,
    evidence?: string,
    applicable = true,
  ) =>
    items.push({
      code,
      requirement,
      citation,
      status: !applicable ? 'not_applicable' : provided ? 'provided' : 'outstanding',
      evidence,
      responsible,
    })

  add('SP-01', 'Site plan drawn to a standard engineering scale with graphic scale and north arrow',
    'DPIE Site/Road Plan Checklist', sheets.length > 0, 'Kealee', `${sheets.length} sheets issued`)

  add('SP-02', 'Property boundary with bearings and distances from a certified survey',
    'Subtitle 24 — Subdivision Regulations',
    twin.sources.some(s => s.reliabilityLevel === 2 && /survey/i.test(s.dataset)),
    'Maryland Licensed Surveyor',
    has('Parcel') ? 'Boundary shown from GIS parcel — certification outstanding' : undefined)

  add('SP-03', 'Zoning designation, and dimensional standards for the zone',
    'Subtitle 27 § 27-4200 series', Boolean(twin.zoneCode), 'Kealee',
    twin.zoneCode ? `Zone ${twin.zoneCode}` : undefined)

  add('SP-04', 'Building setbacks (front, side, rear yard depths) dimensioned',
    'Subtitle 27 § 27-4202', has('Setback'), 'Maryland Professional Engineer')

  add('SP-05', 'Recorded easements and rights-of-way shown',
    'Subtitle 24', has('Easement'), 'Maryland Licensed Surveyor')

  add('SP-06', 'Limits of disturbance delineated and quantified',
    'COMAR 26.17.01 / MD Standards for Soil Erosion and Sediment Control',
    has('LimitOfDisturbance') && !applicability.disturbance.indeterminate,
    'Kealee',
    `${applicability.disturbance.knownTotalSqFt.toLocaleString()} sq ft` +
      (applicability.disturbance.indeterminate ? ' — components outstanding' : ''))

  add('SP-07', 'Existing and proposed topography with contour interval and benchmark',
    'DPIE Site/Road Plan Checklist', Boolean(twin.verticalDatum),
    'Maryland Licensed Surveyor',
    twin.verticalDatum ?? 'No vertical datum established')

  add('SP-08', 'Stormwater management concept with computations',
    'Maryland Stormwater Design Manual',
    sheets.includes('C-600'), 'Maryland Professional Engineer',
    undefined, applicability.sedimentAndStormwater.required)

  add('SP-09', 'Sediment and erosion control plan with sequence of construction',
    'MD Standards and Specifications for Soil Erosion and Sediment Control',
    sheets.includes('C-700'), 'Maryland Professional Engineer',
    undefined, applicability.sedimentAndStormwater.required)

  add('SP-10', 'Utility layout with existing service locations',
    'WSSC / DPIE coordination', sheets.includes('C-500'), 'Maryland Professional Engineer')

  add('SP-11', 'Landscape and tree canopy schedule',
    'Prince George\'s County Landscape Manual; Subtitle 25 § 25-128',
    sheets.includes('L-100'), 'Landscape Architect', undefined, sheets.includes('L-100'))

  add('SP-12', 'Tree Conservation Plan / Natural Resource Inventory coordination',
    'Subtitle 25 — Woodland Conservation',
    sheets.includes('TCP-NRI'), 'Qualified Environmental Professional',
    undefined, sheets.includes('TCP-NRI'))

  add('SP-13', 'Professional seal and signature on each sheet within the sealer\'s practice',
    'Md. Code, Business Occupations and Professions', false,
    'Licensed professional', 'Applied by the professional at sign-off — never by the platform')

  const applicableItems = items.filter(i => i.status !== 'not_applicable')
  const provided = applicableItems.filter(i => i.status === 'provided').length
  const outstanding = applicableItems.length - provided

  return {
    jurisdiction: twin.jurisdictionCode,
    agency: 'Department of Permitting, Inspections and Enforcement (DPIE)',
    items,
    providedCount: provided,
    outstandingCount: outstanding,
    summary: `${provided} of ${applicableItems.length} applicable checklist items satisfied; ${outstanding} outstanding.`,
  }
}

// ── Issuance quality control ────────────────────────────────────────────────

export interface QcFinding {
  code: string
  severity: 'blocking' | 'warning'
  message: string
  remedy: string
}

export interface QcResult {
  findings: QcFinding[]
  blocking: QcFinding[]
  /** Package may be labelled ready to submit. */
  issuable: boolean
  summary: string
}

/**
 * The issuance blocks the brief enumerates, evaluated against the model, the
 * checklist and the review matrix.
 */
export function runIssuanceQc(input: {
  twin: SiteTwin
  applicability: ApplicabilityReport
  checklist: CountyChecklist
  reviewMatrix: ReviewMatrix
  sheetFrameFailures: number
}): QcResult {
  const findings: QcFinding[] = []
  const { twin, applicability, checklist, reviewMatrix } = input

  const add = (code: string, severity: QcFinding['severity'], message: string, remedy: string) =>
    findings.push({ code, severity, message, remedy })

  // Geometry and datum findings come from the twin itself.
  for (const c of checkTwinConsistency(twin)) {
    add(c.code, c.severity, c.message,
      c.severity === 'blocking' ? 'Resolve in the site model before issuance.' : 'Review before issuance.')
  }

  if (!twin.sources.some(s => s.reliabilityLevel === 2 && /survey/i.test(s.dataset))) {
    add('MISSING_SURVEY_CERTIFICATION', 'blocking',
      'No surveyor-certified boundary or topographic survey is on file.',
      'Obtain a certified survey. Drawings remain valid as preliminary until then.')
  }

  if (featuresOfKind(twin, 'Easement').length === 0) {
    add('MISSING_EASEMENT', 'warning',
      'No easements are recorded in the model. An unmapped easement can invalidate a building location after approval.',
      'Confirm against the title report.')
  }

  if (applicability.disturbance.indeterminate) {
    add('INCONSISTENT_LIMITS_OF_DISTURBANCE', 'blocking',
      `Limits of disturbance are not fully quantified: ${applicability.disturbance.unknownComponents.join(', ')}.`,
      'Quantify every component so the 5,000 sq ft determination is defensible.')
  }

  // Footprint agreement between the architectural intent and the civil model.
  const proposed = featuresOfKind(twin, 'Building').filter(b => !b.existing)
  if (proposed.length === 0) {
    add('FOOTPRINT_MISMATCH', 'warning',
      'No proposed building footprint is in the model.',
      'Import the architectural footprint before issuing C-200.')
  }

  if (input.sheetFrameFailures > 0) {
    add('SHEET_FRAME_INCOMPLETE', 'blocking',
      `${input.sheetFrameFailures} sheet(s) are missing a required frame element.`,
      'Regenerate the sheets; every sheet must carry the full title block and notes.')
  }

  const staleDays = 365
  for (const s of twin.sources) {
    const age = (Date.now() - Date.parse(s.retrievedAt)) / 86_400_000
    if (Number.isFinite(age) && age > staleDays) {
      add('STALE_SOURCE_DATA', 'warning',
        `Source "${s.dataset}" was retrieved ${Math.round(age)} days ago.`,
        'Re-retrieve before submission; jurisdiction data changes.')
    }
  }

  if (checklist.outstandingCount > 0) {
    add('CHECKLIST_INCOMPLETE', 'warning',
      `${checklist.outstandingCount} County checklist item(s) outstanding.`,
      'Close the outstanding items or note why each is not applicable.')
  }

  if (!reviewMatrix.submissionReady) {
    add('MISSING_PROFESSIONAL_REVIEW', 'blocking',
      reviewMatrix.summary,
      'Route the package to the outstanding disciplines for review and seal.')
  }

  const blocking = findings.filter(f => f.severity === 'blocking')
  return {
    findings,
    blocking,
    issuable: blocking.length === 0,
    summary: blocking.length
      ? `Not ready to submit — ${blocking.length} blocking finding${blocking.length === 1 ? '' : 's'}. ` +
        'Drawings are still issued as preliminary.'
      : 'No blocking findings. Package may be labelled ready for submission once sealed.',
  }
}

// ── Revision response (delivery item 11) ────────────────────────────────────

export interface CountyComment {
  id: string
  sheet?: SheetId
  reviewer: string
  comment: string
  receivedAt: string
}

export interface RevisionResponse {
  commentId: string
  response: string
  sheetsRevised: SheetId[]
  modelRevision: number
  status: 'addressed' | 'pending' | 'disputed'
}

export function buildRevisionResponseMatrix(
  comments: CountyComment[],
  responses: RevisionResponse[],
): { rows: (CountyComment & { response?: RevisionResponse })[]; addressed: number; outstanding: number } {
  const rows = comments.map(c => ({ ...c, response: responses.find(r => r.commentId === c.id) }))
  const addressed = rows.filter(r => r.response?.status === 'addressed').length
  return { rows, addressed, outstanding: rows.length - addressed }
}
