/**
 * Level 2 promotion, and what regenerating the set after a promotion means.
 *
 * Promotion is the moment a site stops being "GIS says roughly this" and starts
 * being "a licensed surveyor certifies this". Everything downstream changes:
 * setbacks are measured from a real boundary, the disturbance area is real, the
 * preliminary disclosure comes off the sheets.
 *
 * Because it changes what the package is allowed to claim, promotion has hard
 * preconditions and no override. An agent cannot argue its way to Level 2.
 */

import type { SurveyImportRecord } from './import-record'
import type { SiteFeature, SiteTwin } from '../site-plan/site-twin'
import type { ReliabilityLevel } from '../site-plan/reliability'
import { LEVEL_1_DISCLOSURE, LEVEL_0_DISCLOSURE } from '../site-plan/reliability'
import type { SheetId, SheetStatus, RevisionEntry } from '../sheets/sheet-template'
import type { DiscrepancyReport } from './reconcile'

export interface PromotionRequest {
  record: SurveyImportRecord
  discrepancies: DiscrepancyReport
  /** Set when a person confirmed the seal by looking at the document. */
  sealReviewedBy?: string
  /** Set when the licence was checked against the state board register. */
  licenceVerification?: { verifiedAt: string; register: string; verifiedBy: string }
  /** Which twin object kinds the survey covers. Promotion is per-scope, not global. */
  scope: SiteFeature['kind'][]
}

export interface PromotionCheck {
  requirement: string
  satisfied: boolean
  detail: string
}

export interface PromotionDecision {
  promoted: boolean
  fromLevel: ReliabilityLevel
  toLevel: ReliabilityLevel
  checks: PromotionCheck[]
  /** Object kinds actually promoted — never wider than the survey's scope. */
  promotedScope: SiteFeature['kind'][]
  blockers: string[]
  rationale: string
}

/**
 * Formats that can carry Level 2. A PDF cannot, whatever it depicts: the
 * platform needs the surveyor's coordinates, not a rendering of them.
 */
const LEVEL_2_CAPABLE = new Set<SurveyImportRecord['format']>(['csv', 'landxml', 'dxf', 'dwg'])

export function evaluatePromotion(req: PromotionRequest): PromotionDecision {
  const r = req.record
  const checks: PromotionCheck[] = []
  const add = (requirement: string, satisfied: boolean, detail: string) =>
    checks.push({ requirement, satisfied, detail })

  add(
    'Format can carry survey-grade coordinates',
    LEVEL_2_CAPABLE.has(r.format),
    LEVEL_2_CAPABLE.has(r.format)
      ? `${r.format.toUpperCase()} carries coordinate data.`
      : `${r.format.toUpperCase()} is a depiction, not coordinate data. LiDAR is mapping grade; PDF is nonauthoritative. ` +
        'Request the coordinate file.',
  )

  add(
    'Coordinate reference system confirmed',
    r.crs != null,
    r.crs
      ? `Confirmed as ${r.crs}.`
      : r.candidateCrs
        ? `Only a candidate of ${r.candidateCrs} exists. A candidate is not a confirmation.`
        : 'No CRS established.',
  )

  add(
    'Horizontal datum stated',
    r.horizontalDatum != null,
    r.horizontalDatum ?? 'Not stated. NAD83(1986) and NAD83(2011) differ materially in Maryland.',
  )

  // A missing vertical datum does not block promotion outright — a boundary
  // survey with no elevations is a perfectly ordinary, certifiable product. It
  // restricts WHICH objects promote, which is handled in `promotedScope` below.
  const hasVertical = r.verticalDatum != null
  add(
    'Vertical datum stated (required only for elevation-dependent objects)',
    true,
    hasVertical
      ? (r.verticalDatum as string)
      : 'Not stated. Boundary objects still promote; grading, drainage, surfaces and floodplain objects ' +
        'are held back until a datum is established.',
  )

  const surveyor = r.surveyor
  add(
    'Responsible licensed surveyor identified',
    surveyor != null && surveyor.licenceNumber.length > 0,
    surveyor
      ? `${surveyor.name}, ${surveyor.state} licence ${surveyor.licenceNumber}.`
      : 'No licensed professional is attached to this import.',
  )

  const licenceVerified = req.licenceVerification != null || surveyor?.licenceVerifiedAt != null
  add(
    'Licence verified against the state register',
    licenceVerified,
    req.licenceVerification
      ? `Verified ${req.licenceVerification.verifiedAt} against ${req.licenceVerification.register} by ${req.licenceVerification.verifiedBy}.`
      : surveyor?.licenceVerifiedAt
        ? `Verified ${surveyor.licenceVerifiedAt}.`
        : 'Not verified. A licence number written on a drawing is a claim, not a verification.',
  )

  const sealed = r.seal.sealed && r.seal.evidence === 'document_reviewed'
  add(
    'Seal established by document review',
    sealed || req.sealReviewedBy != null,
    sealed || req.sealReviewedBy
      ? `Seal reviewed${req.sealReviewedBy ? ` by ${req.sealReviewedBy}` : ''}.`
      : r.seal.evidence === 'declared_by_uploader'
        ? 'The uploader declared the document sealed. That is not evidence — a person must review the document.'
        : 'No seal evidence.',
  )

  add(
    'Survey date recorded',
    r.surveyDate != null,
    r.surveyDate ?? 'Not recorded. The upload date is not the survey date and is never substituted for it.',
  )

  const blockingDiscrepancies = req.discrepancies.blockingCount
  add(
    'No blocking discrepancies outstanding',
    blockingDiscrepancies === 0,
    blockingDiscrepancies === 0
      ? `${req.discrepancies.discrepancies.length} finding(s), none blocking.`
      : `${blockingDiscrepancies} blocking finding(s) must be resolved by the responsible professional first.`,
  )

  const blockers = checks.filter(c => !c.satisfied).map(c => `${c.requirement}: ${c.detail}`)
  const promoted = blockers.length === 0

  // Elevation-dependent kinds cannot promote without a vertical datum, even
  // when everything else passes.
  const elevationDependent: SiteFeature['kind'][] = [
    'Surface', 'Contour', 'Breakline', 'SpotElevation', 'StormPipe', 'DrainageArea', 'SWMPractice', 'Floodplain',
  ]
  const promotedScope = promoted
    ? hasVertical ? req.scope : req.scope.filter(k => !elevationDependent.includes(k))
    : []

  // A parser can establish that an import QUALIFIES for Level 2 — confirmed CRS,
  // datum, identified surveyor, reviewed seal. Only promotion GRANTS it, and a
  // refused promotion means the geometry is held at Level 1 at most, whatever
  // the import record says about itself.
  const heldLevel: ReliabilityLevel = promoted ? 2 : (Math.min(r.reliabilityLevel, 1) as ReliabilityLevel)

  return {
    promoted,
    fromLevel: r.reliabilityLevel,
    toLevel: heldLevel,
    checks,
    promotedScope,
    blockers,
    rationale: promoted
      ? `Promoted to Level 2 for ${promotedScope.length} object kind(s) on the certification of ` +
        `${surveyor?.name}, ${surveyor?.state} licence ${surveyor?.licenceNumber}` +
        (hasVertical ? '.' : '. Elevation-dependent objects were held at their current level because no vertical datum is stated.')
      : `Held at Level ${heldLevel}. ${blockers.length} precondition(s) unmet: ` +
        blockers.map(b => b.split(':')[0]).join('; ') + '.',
  }
}

/** Applies a promotion decision to the twin, in scope only. */
export function applyPromotion(twin: SiteTwin, decision: PromotionDecision, sourceId: string): SiteTwin {
  if (!decision.promoted) return twin
  return {
    ...twin,
    revision: twin.revision + 1,
    updatedAt: new Date().toISOString(),
    features: twin.features.map(f =>
      f.sourceId === sourceId && decision.promotedScope.includes(f.kind)
        ? { ...f, reliabilityLevel: 2 as ReliabilityLevel, revision: f.revision + 1 }
        : f,
    ),
    sources: twin.sources.map(s =>
      s.sourceId === sourceId
        ? { ...s, reliabilityLevel: 2 as ReliabilityLevel, accuracyClass: 'survey_grade' as const }
        : s,
    ),
  }
}

// ── Sheet regeneration ──────────────────────────────────────────────────────

/**
 * Which sheets read which twin object kinds. This is the dependency graph that
 * makes "one model change regenerates every affected sheet" checkable instead
 * of a claim.
 */
export const SHEET_DEPENDENCIES: Record<SheetId, SiteFeature['kind'][]> = {
  'C-000': ['Parcel'],
  'C-100': ['Parcel', 'BoundarySegment', 'Easement', 'Building', 'ExistingFeature', 'Contour', 'SpotElevation', 'Utility', 'Tree'],
  'C-200': ['Parcel', 'BoundarySegment', 'Setback', 'Building', 'Easement', 'Pavement', 'ParkingSpace', 'ProposedFeature'],
  'C-300': ['Building', 'ExistingFeature', 'DemolitionFeature', 'Pavement', 'Tree'],
  'C-400': ['Parcel', 'Contour', 'Breakline', 'Surface', 'SpotElevation', 'LimitOfDisturbance', 'DrainageArea', 'StormPipe', 'Structure'],
  'C-500': ['Utility', 'StormPipe', 'Structure', 'Building', 'Easement'],
  'C-600': ['DrainageArea', 'SWMPractice', 'StormPipe', 'Surface', 'LimitOfDisturbance', 'EnvironmentalBuffer'],
  'C-700': ['LimitOfDisturbance', 'Contour', 'Surface', 'EnvironmentalBuffer', 'Parcel'],
  'C-800': ['Pavement', 'ParkingSpace', 'Sidewalk', 'ProposedFeature', 'Contour'],
  'C-900': [],
  'L-100': ['Tree', 'Woodland', 'Parcel', 'Setback', 'Pavement', 'Building'],
  'TCP-NRI': ['Tree', 'Woodland', 'EnvironmentalBuffer', 'Floodplain', 'LimitOfDisturbance', 'Parcel'],
}

export interface RegenerationPlan {
  affectedSheets: SheetId[]
  unaffectedSheets: SheetId[]
  /** Sheets whose STATUS changes because the governing reliability level moved. */
  statusChanges: { sheet: SheetId; from: SheetStatus; to: SheetStatus; reason: string }[]
  /** Disclosure text that must now appear, or null when it comes off. */
  disclosure: string | null
  revisionEntry: RevisionEntry
  /** Explicit statement of what happens to the geometry being replaced. */
  supersededHandling: string
}

export function planRegeneration(input: {
  changedKinds: SiteFeature['kind'][]
  currentSheets: { sheet: SheetId; status: SheetStatus; revisions: RevisionEntry[] }[]
  newGoverningLevel: ReliabilityLevel
  previousGoverningLevel: ReliabilityLevel
  description: string
  by: string
  date?: string
}): RegenerationPlan {
  const changed = new Set(input.changedKinds)
  const all = Object.keys(SHEET_DEPENDENCIES) as SheetId[]
  const affected = all.filter(s => SHEET_DEPENDENCIES[s].some(k => changed.has(k)))
  // C-000 carries the source-and-accuracy table, so any reliability change hits it.
  if (input.newGoverningLevel !== input.previousGoverningLevel && !affected.includes('C-000')) {
    affected.unshift('C-000')
  }

  const disclosure =
    input.newGoverningLevel === 0 ? LEVEL_0_DISCLOSURE
    : input.newGoverningLevel === 1 ? LEVEL_1_DISCLOSURE
    : null

  const statusChanges: RegenerationPlan['statusChanges'] = []
  if (input.newGoverningLevel > input.previousGoverningLevel) {
    for (const s of input.currentSheets) {
      if (!affected.includes(s.sheet)) continue
      if (s.status === 'PRELIMINARY' && input.newGoverningLevel === 2) {
        statusChanges.push({
          sheet: s.sheet,
          from: s.status,
          to: 'FOR_REVIEW',
          reason:
            'The governing data is now professionally certified, so the sheet is no longer preliminary. ' +
            'It becomes FOR_REVIEW — not PERMIT_SET, which requires a professional review record and seal.',
        })
      }
    }
  } else if (input.newGoverningLevel < input.previousGoverningLevel) {
    for (const s of input.currentSheets) {
      if (!affected.includes(s.sheet)) continue
      if (s.status === 'PERMIT_SET' || s.status === 'FOR_REVIEW') {
        statusChanges.push({
          sheet: s.sheet,
          from: s.status,
          to: 'PRELIMINARY',
          reason: 'The governing reliability level fell. The sheet cannot continue to claim what it claimed.',
        })
      }
    }
  }

  const maxRev = input.currentSheets.reduce(
    (m, s) => Math.max(m, ...s.revisions.map(r => r.number), 0), 0,
  )

  return {
    affectedSheets: affected,
    unaffectedSheets: all.filter(s => !affected.includes(s)),
    statusChanges,
    disclosure,
    revisionEntry: {
      number: maxRev + 1,
      date: input.date ?? new Date().toISOString().slice(0, 10),
      description: input.description,
      by: input.by,
    },
    supersededHandling:
      'Replaced geometry is retained in the model marked superseded, with the superseding source and ' +
      'date. Previously issued sheets remain reproducible from the twin revision they were generated ' +
      'from; nothing is deleted.',
  }
}
