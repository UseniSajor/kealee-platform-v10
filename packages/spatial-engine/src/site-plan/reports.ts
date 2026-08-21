/**
 * Delivery-workflow reports 2 and 3: missing information, and source & accuracy.
 *
 * Report 1 (site-plan applicability) is produced by classification.ts.
 *
 * These are the deliverables that carry no drafting risk and can be sold on
 * their own — they tell an applicant exactly what the County will require and
 * exactly how far the current data can be trusted.
 */

import type { SiteTwin } from './site-twin'
import { checkTwinConsistency, featuresOfKind } from './site-twin'
import {
  RELIABILITY_LABELS,
  disclosureFor,
  governingReliability,
  dataSupportsPermitSubmission,
  type ReliabilityLevel,
} from './reliability'
import type { ApplicabilityReport } from './classification'

// ── Report 2: missing information ───────────────────────────────────────────

export interface MissingItem {
  key: string
  label: string
  /** Why the County or the engineer needs it. */
  why: string
  severity: 'required' | 'recommended'
  /** Who is expected to supply it. */
  responsible: 'applicant' | 'surveyor' | 'engineer' | 'architect' | 'environmental' | 'kealee'
}

export interface MissingInformationReport {
  items: MissingItem[]
  requiredCount: number
  recommendedCount: number
  summary: string
}

export function buildMissingInformationReport(
  twin: SiteTwin,
  applicability: ApplicabilityReport,
): MissingInformationReport {
  const items: MissingItem[] = []
  const add = (i: MissingItem) => items.push(i)

  if (!twin.zoneCode) {
    add({ key: 'zone', label: 'Zoning classification', why: 'Drives every dimensional standard on C-200.', severity: 'required', responsible: 'kealee' })
  }
  if (featuresOfKind(twin, 'Parcel').length === 0) {
    add({ key: 'parcel', label: 'Parcel boundary geometry', why: 'Nothing can be dimensioned or placed without it.', severity: 'required', responsible: 'kealee' })
  }

  const hasCertifiedSurvey = twin.sources.some(s => s.reliabilityLevel === 2 && /survey/i.test(s.dataset))
  if (!hasCertifiedSurvey) {
    add({
      key: 'survey',
      label: 'Maryland surveyor-certified boundary and topographic survey',
      why: 'GIS parcel geometry is preliminary and may be offset from surveyed boundaries. A permit submission needs certified geometry.',
      severity: 'required',
      responsible: 'surveyor',
    })
  }

  if (!twin.verticalDatum) {
    add({
      key: 'vertical_datum',
      label: 'Vertical datum and benchmark',
      why: 'Grading, drainage and finished-floor elevations cannot be established without elevation control. Datums are never assumed.',
      severity: 'required',
      responsible: 'surveyor',
    })
  }

  if (featuresOfKind(twin, 'Easement').length === 0) {
    add({
      key: 'easements',
      label: 'Recorded easements and title report',
      why: 'An unmapped easement can invalidate a building location after approval.',
      severity: 'required',
      responsible: 'applicant',
    })
  }

  for (const c of applicability.disturbance.breakdown) {
    if (c.sqFt == null) {
      add({
        key: `disturbance:${c.component}`,
        label: `Disturbance area — ${c.component}`,
        why: 'Unquantified components keep the project above the 5,000 sq ft gate by default.',
        severity: 'required',
        responsible: 'applicant',
      })
    }
  }

  for (const open of applicability.openItems) {
    add({ key: `open:${open.slice(0, 24)}`, label: open, why: 'Raised by the applicability review.', severity: 'required', responsible: 'kealee' })
  }

  const utilities = featuresOfKind(twin, 'Utility')
  if (utilities.length === 0) {
    add({ key: 'utilities', label: 'Existing utility locations', why: 'Required for C-500 and for conflict detection. Utility locations are never inferred.', severity: 'recommended', responsible: 'surveyor' })
  }

  const requiredCount = items.filter(i => i.severity === 'required').length
  const recommendedCount = items.length - requiredCount
  return {
    items,
    requiredCount,
    recommendedCount,
    summary:
      requiredCount === 0
        ? 'No required information is outstanding.'
        : `${requiredCount} required item${requiredCount === 1 ? '' : 's'} outstanding` +
          (recommendedCount ? `, plus ${recommendedCount} recommended.` : '.'),
  }
}

// ── Report 3: source and accuracy ───────────────────────────────────────────

export interface SourceAccuracyRow {
  dataset: string
  authority: string
  retrievedAt: string
  effectiveDate?: string
  crs: string | null
  horizontalDatum: string | null
  verticalDatum: string | null
  accuracyClass: string
  reliability: string
  url?: string
}

export interface SourceAccuracyReport {
  rows: SourceAccuracyRow[]
  governingLevel: ReliabilityLevel
  governingLabel: string
  disclosure: string | null
  permitDataSufficiency: { sufficient: boolean; reason: string; missing: string[] }
  consistency: ReturnType<typeof checkTwinConsistency>
  blockingCount: number
  summary: string
}

export function buildSourceAccuracyReport(twin: SiteTwin): SourceAccuracyReport {
  const rows: SourceAccuracyRow[] = twin.sources.map(s => ({
    dataset: s.dataset,
    authority: s.authority,
    retrievedAt: s.retrievedAt,
    effectiveDate: s.effectiveDate,
    crs: s.crs,
    horizontalDatum: s.horizontalDatum,
    verticalDatum: s.verticalDatum,
    accuracyClass: s.accuracyClass,
    reliability: RELIABILITY_LABELS[s.reliabilityLevel],
    url: s.url,
  }))

  const governingLevel = governingReliability(twin.sources)
  const consistency = checkTwinConsistency(twin)
  const blockingCount = consistency.filter(c => c.severity === 'blocking').length

  return {
    rows,
    governingLevel,
    governingLabel: RELIABILITY_LABELS[governingLevel],
    disclosure: disclosureFor(governingLevel),
    permitDataSufficiency: dataSupportsPermitSubmission(twin.sources),
    consistency,
    blockingCount,
    summary:
      `${rows.length} source${rows.length === 1 ? '' : 's'} on file. Governing reliability: ` +
      `${RELIABILITY_LABELS[governingLevel]}. ` +
      (blockingCount
        ? `${blockingCount} blocking consistency finding${blockingCount === 1 ? '' : 's'}.`
        : 'No blocking consistency findings.'),
  }
}
