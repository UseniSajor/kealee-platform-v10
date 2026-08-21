/**
 * Data reliability levels and provenance.
 *
 * Every fact the site-plan engine uses carries a reliability level. The level
 * does not block generation — the agents produce the full package regardless —
 * but it determines what the package is ALLOWED TO CLAIM about itself, and it
 * drives the source-and-accuracy report.
 *
 *   LEVEL 0  UNVERIFIED    user sketches, photos, OCR, hand-entered dimensions
 *   LEVEL 1  PRELIMINARY   GIS, LiDAR, aerial imagery, tax parcels, public
 *                          utility mapping. County GIS is Level 1 — it is not a
 *                          field survey and must never be described as one.
 *   LEVEL 2  PROFESSIONAL  surveyor-certified boundary/topographic survey,
 *                          verified title, approved NRI/TCP, geotechnical data,
 *                          professional calculations
 */

export type ReliabilityLevel = 0 | 1 | 2

export const RELIABILITY_LABELS: Record<ReliabilityLevel, string> = {
  0: 'Unverified',
  1: 'Preliminary (GIS/LiDAR)',
  2: 'Professional',
}

/**
 * Required on any output derived from Level 1 data. The wording is fixed by the
 * project brief and should not be softened.
 */
export const LEVEL_1_DISCLOSURE =
  'PRELIMINARY—BASED ON GIS/LIDAR DATA—NOT FOR PERMIT OR CONSTRUCTION.'

export const LEVEL_0_DISCLOSURE =
  'UNVERIFIED—BASED ON INFORMATION SUPPLIED BY THE APPLICANT AND NOT INDEPENDENTLY CHECKED.'

export type AccuracyClass =
  | 'survey_grade'
  | 'mapping_grade'
  | 'approximate'
  | 'schematic'
  | 'unknown'

/**
 * Provenance for one fact. The brief requires source, acquisition date, CRS,
 * horizontal and vertical datum, accuracy class, status, responsible
 * professional and revision history on every object.
 *
 * `verticalDatum: null` is meaningful and common — most parcel/zoning layers
 * carry no elevation at all. It is distinct from "we did not record it", which
 * is what `'unknown'` means.
 */
export interface SourceRecord {
  sourceId: string
  authority: string
  dataset: string
  url?: string
  /** When the source produced the data, if it states one. */
  effectiveDate?: string
  /** When Kealee retrieved it. */
  retrievedAt: string
  crs: string | null
  horizontalDatum: string | null
  verticalDatum: string | null
  accuracyClass: AccuracyClass
  reliabilityLevel: ReliabilityLevel
  /** Licensed professional responsible, when the source is Level 2. */
  responsibleProfessional?: {
    name: string
    licenseNumber: string
    discipline: string
    state: string
  }
  revision?: number
  notes?: string
}

/** The lowest level present governs what the package may claim. */
export function governingReliability(sources: SourceRecord[]): ReliabilityLevel {
  if (sources.length === 0) return 0
  return sources.reduce<ReliabilityLevel>(
    (lowest, s) => (s.reliabilityLevel < lowest ? s.reliabilityLevel : lowest),
    2,
  )
}

export function disclosureFor(level: ReliabilityLevel): string | null {
  if (level === 0) return LEVEL_0_DISCLOSURE
  if (level === 1) return LEVEL_1_DISCLOSURE
  return null
}

/**
 * Whether the underlying DATA could support a permit submission.
 *
 * This is a statement about data sufficiency only. It is not sign-off — a
 * package is permit-ready only when a human has also signed it off, which an
 * administrator handles at the package level.
 */
export function dataSupportsPermitSubmission(sources: SourceRecord[]): {
  sufficient: boolean
  reason: string
  missing: string[]
} {
  const missing: string[] = []
  const hasCertifiedSurvey = sources.some(
    s => s.reliabilityLevel === 2 && /survey/i.test(s.dataset),
  )
  if (!hasCertifiedSurvey) {
    missing.push('Maryland surveyor-certified boundary and topographic survey')
  }
  const hasVertical = sources.some(s => s.verticalDatum != null)
  if (!hasVertical) {
    missing.push('Vertical datum — no source on file carries elevation control')
  }
  return {
    sufficient: missing.length === 0,
    reason:
      missing.length === 0
        ? 'Level 2 data is present. Package still requires human sign-off before it is permit-ready.'
        : 'Mandatory Level 2 data is absent, so the package cannot be described as permit-ready.',
    missing,
  }
}

/** County GIS is always Level 1 — helper so callers cannot accidentally mark it Level 2. */
export function gisSourceRecord(input: {
  sourceId: string
  authority: string
  dataset: string
  url?: string
  crs: string
  horizontalDatum: string
  effectiveDate?: string
}): SourceRecord {
  return {
    ...input,
    retrievedAt: new Date().toISOString(),
    verticalDatum: null,
    accuracyClass: 'mapping_grade',
    reliabilityLevel: 1,
  }
}
