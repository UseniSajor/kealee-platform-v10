/**
 * Limits of disturbance and the 5,000 sq ft gate.
 *
 * Prince George's County (and Maryland generally) treats 5,000 square feet of
 * land disturbance as the threshold that pulls a project into sediment-control
 * and stormwater-management review. Getting this wrong in either direction is
 * expensive: under-count and the project is filed under the wrong permit and
 * rejected; over-count and the applicant pays for review they did not need.
 *
 * The brief enumerates what must be counted. Everything on that list is a field
 * here, so a component can never be silently omitted — an unknown component is
 * recorded as unknown and surfaces in the missing-information report rather than
 * being treated as zero.
 */

import type { ReliabilityLevel, SourceRecord } from './reliability'

/** Threshold in square feet. */
export const DISTURBANCE_THRESHOLD_SQFT = 5_000

/**
 * Every component of the limits of disturbance, per the brief.
 * `null` means "not yet known" and is NOT the same as 0.
 */
export interface DisturbanceComponents {
  buildingFootprintSqFt: number | null
  drivewaySqFt: number | null
  utilityTrenchesSqFt: number | null
  gradingSqFt: number | null
  stormwaterFacilitiesSqFt: number | null
  stockpilesSqFt: number | null
  constructionAccessSqFt: number | null
  offsiteWorkSqFt: number | null
  demolitionSqFt: number | null
  stagingAreasSqFt: number | null
}

export const DISTURBANCE_COMPONENT_LABELS: Record<keyof DisturbanceComponents, string> = {
  buildingFootprintSqFt: 'Building footprint',
  drivewaySqFt: 'Driveway',
  utilityTrenchesSqFt: 'Utility trenches',
  gradingSqFt: 'Grading',
  stormwaterFacilitiesSqFt: 'Stormwater facilities',
  stockpilesSqFt: 'Stockpiles',
  constructionAccessSqFt: 'Construction access',
  offsiteWorkSqFt: 'Offsite work',
  demolitionSqFt: 'Demolition',
  stagingAreasSqFt: 'Staging areas',
}

export interface DisturbanceResult {
  /** Sum of the components that ARE known. */
  knownTotalSqFt: number
  /** Components not yet supplied. */
  unknownComponents: string[]
  /** True when known components already cross the threshold. */
  meetsThreshold: boolean
  /**
   * True when the known total is under the threshold but unknown components
   * could still push it over. The honest middle state — neither "under" nor
   * "over" is defensible yet.
   */
  indeterminate: boolean
  thresholdSqFt: number
  /** How close the known total is, as a percentage of the threshold. */
  percentOfThreshold: number
  reliabilityLevel: ReliabilityLevel
  explanation: string
  breakdown: { component: string; sqFt: number | null }[]
}

export function calculateDisturbance(
  components: Partial<DisturbanceComponents>,
  options: { reliabilityLevel?: ReliabilityLevel; sources?: SourceRecord[] } = {},
): DisturbanceResult {
  const keys = Object.keys(DISTURBANCE_COMPONENT_LABELS) as (keyof DisturbanceComponents)[]

  const breakdown = keys.map(k => ({
    component: DISTURBANCE_COMPONENT_LABELS[k],
    sqFt: components[k] ?? null,
  }))

  const known = breakdown.filter(b => typeof b.sqFt === 'number')
  const unknown = breakdown.filter(b => b.sqFt == null).map(b => b.component)
  const knownTotalSqFt = known.reduce((sum, b) => sum + (b.sqFt as number), 0)

  const meetsThreshold = knownTotalSqFt >= DISTURBANCE_THRESHOLD_SQFT
  const indeterminate = !meetsThreshold && unknown.length > 0

  const reliabilityLevel = options.reliabilityLevel ?? 0
  const percentOfThreshold = Math.round((knownTotalSqFt / DISTURBANCE_THRESHOLD_SQFT) * 100)

  let explanation: string
  if (meetsThreshold) {
    explanation =
      `Known disturbance of ${knownTotalSqFt.toLocaleString()} sq ft meets or exceeds the ` +
      `${DISTURBANCE_THRESHOLD_SQFT.toLocaleString()} sq ft threshold, so the project routes ` +
      'through Site Development Concept, stormwater management, and erosion and sediment ' +
      'control review unless a documented County exception applies.'
  } else if (indeterminate) {
    explanation =
      `Known disturbance is ${knownTotalSqFt.toLocaleString()} sq ft ` +
      `(${percentOfThreshold}% of the ${DISTURBANCE_THRESHOLD_SQFT.toLocaleString()} sq ft ` +
      `threshold), but ${unknown.length} component${unknown.length === 1 ? ' is' : 's are'} ` +
      `not yet quantified: ${unknown.join(', ')}. The project cannot be placed below the ` +
      'threshold until those are supplied.'
  } else {
    explanation =
      `Total disturbance of ${knownTotalSqFt.toLocaleString()} sq ft is below the ` +
      `${DISTURBANCE_THRESHOLD_SQFT.toLocaleString()} sq ft threshold, with all components ` +
      'accounted for.'
  }

  return {
    knownTotalSqFt,
    unknownComponents: unknown,
    meetsThreshold,
    indeterminate,
    thresholdSqFt: DISTURBANCE_THRESHOLD_SQFT,
    percentOfThreshold,
    reliabilityLevel,
    explanation,
    breakdown,
  }
}

/**
 * Whether the sediment-control / SWM workflow is triggered.
 *
 * Indeterminate counts as triggered. If we cannot show the project is under the
 * threshold, the safe and correct assumption is that it is over — routing a
 * small project through extra review is recoverable, filing a large one under
 * the wrong permit is not.
 */
export function requiresSedimentAndStormwaterReview(result: DisturbanceResult): {
  required: boolean
  certain: boolean
  reason: string
} {
  if (result.meetsThreshold) {
    return { required: true, certain: true, reason: result.explanation }
  }
  if (result.indeterminate) {
    return {
      required: true,
      certain: false,
      reason:
        'Treated as required because disturbance is not fully quantified. ' + result.explanation,
    }
  }
  return { required: false, certain: true, reason: result.explanation }
}
