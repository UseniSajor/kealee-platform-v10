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
  // `platRecord` rides on the twin without being on its type, the same way
  // render-pdf reads it to print the plat call table.
  const platBased = (twin as { platRecord?: unknown }).platRecord != null
  if (!hasCertifiedSurvey) {
    add({
      key: 'survey',
      label: 'Maryland surveyor-certified boundary and topographic survey',
      // The reason depends on where the boundary came from. Saying "GIS parcel
      // geometry is preliminary" on a drawing built from a RECORDED PLAT is
      // simply false, and a reader who checks it against the plat call table on
      // the sheet learns the caveats are boilerplate — which costs the accurate
      // ones their weight too.
      why: platBased
        ? 'The boundary of record is transcribed from the recorded plat and closes, but a transcription is not a field survey: it cannot confirm the monuments are set where the plat says, nor supply topography. A permit submission needs a certified survey.'
        : 'GIS parcel geometry is preliminary and may be offset from surveyed boundaries. A permit submission needs certified geometry.',
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

  // A TITLE REPORT IS STILL REQUIRED WHEN EASEMENTS ARE DRAWN.
  //
  // This dropped the item as soon as any Easement feature existed, so fetching
  // the county's platted easements would have closed it — and a mapped easement
  // set is not a title search. GIS carries what was platted; it does not carry
  // an easement granted by a deed after recordation, and that one binds the
  // land just as hard. The item stays required, and says which case it is.
  const mapped = featuresOfKind(twin, 'Easement').length
  const easementLayerQueried = twin.sources.some(s => /easement/i.test(s.dataset))
  add({
    key: 'easements',
    label: mapped > 0
      ? `Title report — ${mapped} platted easement${mapped === 1 ? '' : 's'} drawn`
      : easementLayerQueried
        ? 'Title report — no platted easement burdens this lot'
        : 'Recorded easements and title report',
    why: mapped > 0
      ? 'The platted easements the county publishes are drawn, but GIS does not carry easements granted by deed after the plat was recorded. Only a title report closes this.'
      : easementLayerQueried
        ? 'The county platted-easement layers were queried and none covers this lot. That is not a clear title: an easement granted by deed after the plat was recorded never reaches GIS. Only a title report closes this.'
        : 'An unmapped easement can invalidate a building location after approval.',
    // RECOMMENDED, NOT REQUIRED. A title report is not a DPIE permit submittal
    // item — what the submission must carry is the DEPICTION of recorded
    // easements on the plan, and the recorded plat supplies that. Listing it as
    // required put a due-diligence step in the same column as a certified
    // survey, which is genuinely required, and a list that cannot tell those
    // apart is not a checklist.
    severity: 'recommended',
    responsible: 'applicant',
  })

  // Only while the THRESHOLD QUESTION is still open.
  //
  // Each of these says an unquantified component 'keeps the project above the
  // 5,000 sq ft gate by default'. Once the known components alone clear the
  // gate that sentence is moot — the determination is made and no unknown can
  // unmake it — and six items demanding numbers that would change nothing read
  // exactly like six items that matter.
  for (const c of applicability.disturbance.breakdown) {
    if (c.sqFt == null && applicability.disturbance.indeterminate) {
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
