/**
 * Engineering calculations for the site-plan set.
 *
 * The platform is the DRAFTER. It produces complete, finished designs — grading,
 * cut/fill, drainage, stormwater sizing, sediment control, sight distance — the
 * way a designer or EIT does. A Maryland Professional Engineer reviews, corrects
 * and seals the work under their responsible charge. Producing a design is not
 * practising engineering without a licence; sealing it is, and the platform
 * never seals.
 *
 * Every result carries its assumptions, the equation used, the inputs and a
 * calculation version, so a reviewing PE can check the arithmetic rather than
 * redo it. That is what makes the output reviewable instead of opaque.
 */

export const CALC_VERSION = 'kealee-civil-1.0.0'

export interface Calculation<T> {
  value: T
  equation: string
  inputs: Record<string, number | string>
  assumptions: string[]
  reference: string
  calcVersion: string
}

function calc<T>(
  value: T,
  equation: string,
  inputs: Record<string, number | string>,
  assumptions: string[],
  reference: string,
): Calculation<T> {
  return { value, equation, inputs, assumptions, reference, calcVersion: CALC_VERSION }
}

// ── Surfaces, slope and earthwork ───────────────────────────────────────────

export interface GridSurface {
  /** Elevations on a regular grid, row-major. */
  elevations: number[][]
  /** Grid spacing in feet. */
  spacingFt: number
  verticalDatum: string
}

/** Slope between adjacent grid cells, as a percentage. */
export function slopeAnalysis(surface: GridSurface): Calculation<{
  maxPercent: number
  meanPercent: number
  steepCellCount: number
  steepThresholdPercent: number
}> {
  const { elevations: e, spacingFt: s } = surface
  const slopes: number[] = []
  for (let r = 0; r < e.length; r++) {
    for (let c = 0; c < e[r].length; c++) {
      const right = c + 1 < e[r].length ? Math.abs(e[r][c + 1] - e[r][c]) : null
      const down = r + 1 < e.length ? Math.abs(e[r + 1][c] - e[r][c]) : null
      for (const d of [right, down]) if (d != null) slopes.push((d / s) * 100)
    }
  }
  const max = slopes.length ? Math.max(...slopes) : 0
  const mean = slopes.length ? slopes.reduce((a, b) => a + b, 0) / slopes.length : 0
  const STEEP = 25
  return calc(
    {
      maxPercent: round(max, 2),
      meanPercent: round(mean, 2),
      steepCellCount: slopes.filter(x => x >= STEEP).length,
      steepThresholdPercent: STEEP,
    },
    'slope% = (Δelevation / horizontal distance) × 100, evaluated between orthogonally adjacent grid nodes',
    { gridSpacingFt: s, nodes: e.length * (e[0]?.length ?? 0), steepThresholdPercent: STEEP },
    [
      'Slope is computed on the supplied grid; a coarser grid understates local steepness.',
      'Steep-slope threshold of 25% is a screening value — confirm the controlling local standard.',
    ],
    'Standard finite-difference slope on a regular grid',
  )
}

/**
 * Cut and fill by the average-end-area / prismoidal grid method.
 * Positive delta = fill required, negative = cut.
 */
export function cutFill(existing: GridSurface, proposed: GridSurface): Calculation<{
  cutCubicYards: number
  fillCubicYards: number
  netCubicYards: number
  balanced: boolean
}> {
  if (
    existing.spacingFt !== proposed.spacingFt ||
    existing.elevations.length !== proposed.elevations.length
  ) {
    throw new Error('cutFill: surfaces must share grid spacing and extent')
  }
  if (existing.verticalDatum !== proposed.verticalDatum) {
    throw new Error(
      `cutFill: vertical datum mismatch (${existing.verticalDatum} vs ${proposed.verticalDatum}). ` +
        'Datums must be reconciled explicitly, never silently converted.',
    )
  }
  const cellArea = existing.spacingFt ** 2
  let cutCf = 0
  let fillCf = 0
  for (let r = 0; r < existing.elevations.length; r++) {
    for (let c = 0; c < existing.elevations[r].length; c++) {
      const d = proposed.elevations[r][c] - existing.elevations[r][c]
      if (d > 0) fillCf += d * cellArea
      else cutCf += -d * cellArea
    }
  }
  const cutCy = cutCf / 27
  const fillCy = fillCf / 27
  const net = fillCy - cutCy
  return calc(
    {
      cutCubicYards: round(cutCy, 1),
      fillCubicYards: round(fillCy, 1),
      netCubicYards: round(net, 1),
      balanced: Math.abs(net) < Math.max(cutCy, fillCy) * 0.1,
    },
    'V = Σ (Δelevation × cell area) ÷ 27, over the grid; cut and fill accumulated separately',
    { gridSpacingFt: existing.spacingFt, cellAreaSqFt: cellArea, verticalDatum: existing.verticalDatum },
    [
      'Grid method — accuracy depends on grid density relative to terrain variability.',
      'No shrink or swell factor applied. Apply the geotechnical factor before ordering material.',
      'Topsoil strip and replace not included.',
    ],
    'Average-end-area grid earthwork',
  )
}

// ── Hydrology ───────────────────────────────────────────────────────────────

/** Runoff coefficients for the Rational Method. */
export const RUNOFF_COEFFICIENTS: Record<string, number> = {
  pavement: 0.95,
  roof: 0.95,
  gravel: 0.65,
  lawn_steep_clay: 0.45,
  lawn_average: 0.25,
  lawn_flat_sandy: 0.15,
  woodland: 0.15,
}

export interface SubArea { areaAcres: number; surface: keyof typeof RUNOFF_COEFFICIENTS | string; c?: number }

/** Composite runoff coefficient, area-weighted. */
export function compositeRunoffCoefficient(areas: SubArea[]): Calculation<number> {
  const total = areas.reduce((s, a) => s + a.areaAcres, 0)
  if (total <= 0) throw new Error('compositeRunoffCoefficient: total area must be positive')
  const weighted = areas.reduce((s, a) => {
    const c = a.c ?? RUNOFF_COEFFICIENTS[a.surface] ?? 0.5
    return s + c * a.areaAcres
  }, 0)
  return calc(
    round(weighted / total, 3),
    'C_composite = Σ(Cᵢ × Aᵢ) / ΣAᵢ',
    { totalAreaAcres: round(total, 4), subAreas: areas.length },
    ['Coefficients are standard published values; confirm against the County SWM manual.'],
    'Rational Method, composite C',
  )
}

/**
 * Time of concentration — Kirpich, for overland flow on a defined reach.
 * tc = 0.0078 × L^0.77 × S^-0.385, L in feet, S in ft/ft, tc in minutes.
 */
export function timeOfConcentrationKirpich(lengthFt: number, slopeFtPerFt: number): Calculation<number> {
  if (slopeFtPerFt <= 0) throw new Error('timeOfConcentration: slope must be positive')
  const tc = 0.0078 * Math.pow(lengthFt, 0.77) * Math.pow(slopeFtPerFt, -0.385)
  return calc(
    round(Math.max(tc, 5), 2),
    'tc = 0.0078 × L^0.77 × S^-0.385  (minutes; L ft, S ft/ft)',
    { lengthFt, slopeFtPerFt },
    [
      'Kirpich is calibrated for small rural watersheds with well-defined channels.',
      'A 5-minute floor is applied, which is standard practice.',
      'For sheet flow over developed surfaces, TR-55 segmental tc may be more appropriate.',
    ],
    'Kirpich (1940)',
  )
}

/** Peak discharge by the Rational Method: Q = C·i·A. */
export function peakDischargeRational(
  c: number,
  intensityInPerHr: number,
  areaAcres: number,
): Calculation<number> {
  const q = c * intensityInPerHr * areaAcres
  return calc(
    round(q, 2),
    'Q = C × i × A   (Q cfs, i in/hr, A acres)',
    { C: c, intensityInPerHr, areaAcres },
    [
      'Rational Method is appropriate for drainage areas up to roughly 200 acres.',
      'Rainfall intensity must come from the applicable NOAA Atlas 14 IDF curve for the site and design storm.',
      'The numeric coincidence that 1 in/hr over 1 acre ≈ 1 cfs is inherent to the method.',
    ],
    'Rational Method',
  )
}

/**
 * Water Quality Volume — Maryland ESD approach.
 * WQv = (P × Rv × A) / 12, with Rv = 0.05 + 0.009 × I  (I = % impervious).
 */
export function waterQualityVolume(
  rainfallInches: number,
  percentImpervious: number,
  areaAcres: number,
): Calculation<{ wqvCubicFeet: number; rv: number }> {
  const rv = 0.05 + 0.009 * percentImpervious
  const wqvAcreFt = (rainfallInches * rv * areaAcres) / 12
  const wqvCf = wqvAcreFt * 43_560
  return calc(
    { wqvCubicFeet: round(wqvCf, 0), rv: round(rv, 4) },
    'Rv = 0.05 + 0.009 × I ;  WQv = (P × Rv × A) / 12  [acre-ft] × 43,560 [cf]',
    { rainfallInches, percentImpervious, areaAcres },
    [
      'P is the water quality storm depth for the site — confirm the value required by the Maryland Stormwater Design Manual.',
      'Environmental Site Design to the maximum extent practicable is required before structural practices are considered.',
    ],
    'Maryland Stormwater Design Manual, ESD / WQv',
  )
}

/** Required storage for a practice, given treatment volume and available depth. */
export function practiceFootprint(
  treatmentVolumeCf: number,
  pondingDepthFt: number,
  voidRatio = 0.4,
): Calculation<{ footprintSqFt: number }> {
  if (pondingDepthFt <= 0) throw new Error('practiceFootprint: ponding depth must be positive')
  const footprint = treatmentVolumeCf / (pondingDepthFt * voidRatio)
  return calc(
    { footprintSqFt: round(footprint, 0) },
    'A = V / (d × n)   where n is the media void ratio',
    { treatmentVolumeCf, pondingDepthFt, voidRatio },
    [
      'Void ratio 0.4 is typical for bioretention media; confirm against the specified mix.',
      'Sizing excludes freeboard, underdrain and pretreatment volume.',
      'Infiltration feasibility depends on geotechnical testing not represented here.',
    ],
    'Storage volume / effective depth',
  )
}

// ── Roadway and access ──────────────────────────────────────────────────────

/**
 * AASHTO stopping sight distance.
 * SSD = 1.47·V·t + V² / (30·(f ± G))
 */
export function stoppingSightDistance(
  designSpeedMph: number,
  gradePercent = 0,
  perceptionReactionS = 2.5,
  frictionCoefficient = 0.35,
): Calculation<number> {
  const g = gradePercent / 100
  const denom = 30 * (frictionCoefficient + g)
  if (denom <= 0) throw new Error('stoppingSightDistance: grade exceeds available friction')
  const ssd = 1.47 * designSpeedMph * perceptionReactionS + (designSpeedMph ** 2) / denom
  return calc(
    round(ssd, 1),
    'SSD = 1.47·V·t + V² / (30·(f + G))   (ft; V mph, t s, G decimal grade)',
    { designSpeedMph, gradePercent, perceptionReactionS, frictionCoefficient },
    [
      'Perception-reaction time 2.5 s and friction 0.35 are AASHTO design values for wet pavement.',
      'This is a screening calculation. Intersection sight distance and sight triangles are a separate check requiring field verification of obstructions.',
    ],
    'AASHTO Green Book, stopping sight distance',
  )
}

/** Driveway geometry screening against typical residential standards. */
export function drivewayCheck(widthFt: number, gradePercent: number): Calculation<{
  widthAcceptable: boolean
  gradeAcceptable: boolean
  findings: string[]
}> {
  const findings: string[] = []
  const widthAcceptable = widthFt >= 10
  const gradeAcceptable = Math.abs(gradePercent) <= 15
  if (!widthAcceptable) findings.push(`Driveway width ${widthFt} ft is below the 10 ft screening minimum.`)
  if (!gradeAcceptable) findings.push(`Driveway grade ${gradePercent}% exceeds the 15% screening maximum.`)
  return calc(
    { widthAcceptable, gradeAcceptable, findings },
    'width ≥ 10 ft ; |grade| ≤ 15%',
    { widthFt, gradePercent },
    ['Screening thresholds only — the controlling County and fire-access standards govern.'],
    'Residential driveway screening',
  )
}

// ── Sediment and erosion control ────────────────────────────────────────────

/** Sediment trap sizing — volume proportional to contributing drainage area. */
export function sedimentTrapVolume(drainageAreaAcres: number, cfPerAcre = 3_600): Calculation<{
  requiredVolumeCf: number
}> {
  return calc(
    { requiredVolumeCf: round(drainageAreaAcres * cfPerAcre, 0) },
    'V = A × unit storage   (cf; A acres)',
    { drainageAreaAcres, cfPerAcre },
    [
      'Unit storage of 3,600 cf per acre is the common wet-storage standard; confirm against the Maryland Standards and Specifications for Soil Erosion and Sediment Control.',
      'Trap versus basin selection depends on drainage area thresholds set by the standard.',
    ],
    'MD Standards and Specifications for Soil Erosion and Sediment Control',
  )
}

function round(n: number, dp: number): number {
  const f = 10 ** dp
  return Math.round(n * f) / f
}
