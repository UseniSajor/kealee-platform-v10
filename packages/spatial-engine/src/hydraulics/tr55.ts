/**
 * Hydrology — NRCS TR-55, curve number runoff and peak discharge.
 *
 * "Urban Hydrology for Small Watersheds", Technical Release 55, USDA Natural
 * Resources Conservation Service, Second Edition, June 1986, with the 2003 and
 * 2009 WinTR-55 corrections. This is the method Prince George's County DPIE and
 * MDE accept for watersheds of this size.
 *
 * ── Why not the Rational Method here ────────────────────────────────────────
 *
 * The Rational Method (Q = C·i·A) is a storm-drain sizing tool. It carries no
 * volume, no hydrograph and no routing, and its C is a lumped guess. It is
 * acceptable in Prince George's County for inlet and pipe sizing on small
 * areas and it is NOT acceptable as the hydrology behind a floodplain study,
 * because a floodplain study has to answer what the water surface does, which
 * is a question about volume and timing, not just peak rate.
 *
 * The contributing area at the Fort Foote Road crossing is about 0.6 square
 * miles. That is far past where the Rational Method belongs — the usual
 * practical ceiling is 20 to 200 acres depending on whose manual you read, and
 * nobody's is 400.
 *
 * ── Curve number ────────────────────────────────────────────────────────────
 *
 *     S = 1000/CN − 10          potential maximum retention, in
 *     Ia = 0.2·S                initial abstraction, in
 *     Q = (P − Ia)² / (P − Ia + S)   for P > Ia, else 0
 *
 * The 0.2 ratio is TR-55's, and it is known to be high — Woodward and others
 * have argued for 0.05 — but 0.2 is what the published tables are calibrated
 * against and what a reviewer will check, so it is what is used.
 *
 * ── Peak discharge ──────────────────────────────────────────────────────────
 *
 *     q_p = q_u · A_m · Q · F_p
 *
 * q_u  unit peak discharge, csm/in, from Tc and Ia/P for the rainfall
 *      distribution — Type II across Maryland
 * A_m  drainage area, square miles
 * Q    runoff depth, in
 * F_p  pond and swamp adjustment factor
 *
 * q_u comes from the TR-55 Appendix F regression rather than by reading
 * Exhibit 4-II off a chart:
 *
 *     log(q_u) = C0 + C1·log(Tc) + C2·(log Tc)²
 */

/** Rainfall distributions. Maryland is Type II throughout. */
export type RainfallDistribution = 'I' | 'IA' | 'II' | 'III'

/** Potential maximum retention S, in. */
export function retentionS(curveNumber: number): number {
  if (curveNumber <= 0 || curveNumber > 100) throw new Error(`curve number out of range: ${curveNumber}`)
  return 1000 / curveNumber - 10
}

/** Runoff depth Q, in, for rainfall P, in. TR-55 eq. 2-3 / 2-4. */
export function runoffDepthIn(rainfallIn: number, curveNumber: number): number {
  const S = retentionS(curveNumber)
  const Ia = 0.2 * S
  if (rainfallIn <= Ia) return 0
  return Math.pow(rainfallIn - Ia, 2) / (rainfallIn - Ia + S)
}

export interface CoverParcel {
  label: string
  /** Fraction of the watershed, 0..1. */
  fraction: number
  /** Curve number for this cover on its soil. */
  curveNumber: number
}

/**
 * Area-weighted composite curve number.
 *
 * TR-55 warns against compositing where CNs differ widely and the impervious
 * fraction is high, because the runoff relation is non-linear — the composite
 * understates runoff from the impervious part at small storms. At the storms a
 * floodplain study looks at (10-year and rarer) the error is small, and the
 * composite is what the county's own reviewers compute. Both facts belong in
 * the report, which is why this function returns the parts as well as the sum.
 */
export function compositeCurveNumber(parcels: readonly CoverParcel[]): {
  curveNumber: number
  totalFraction: number
  parts: readonly CoverParcel[]
} {
  let total = 0
  let weighted = 0
  for (const p of parcels) {
    total += p.fraction
    weighted += p.fraction * p.curveNumber
  }
  if (total <= 0) throw new Error('cover fractions sum to zero')
  return { curveNumber: weighted / total, totalFraction: total, parts: parcels }
}

/**
 * Sheet flow travel time, hr. TR-55 eq. 3-3, Manning kinematic solution.
 *
 *     Tt = 0.007·(n·L)^0.8 / (P2^0.5 · s^0.4)
 *
 * Valid to 100 ft of flow length and no further — TR-55 is explicit that sheet
 * flow becomes shallow concentrated flow within about 100 ft, and the 300 ft
 * the 1986 edition originally allowed was withdrawn.
 */
export function sheetFlowHr(input: {
  lengthFt: number
  manningN: number
  slopeFtPerFt: number
  twoYear24hrRainfallIn: number
}): number {
  const L = Math.min(input.lengthFt, 100)
  const s = Math.max(input.slopeFtPerFt, 0.0001)
  return (
    (0.007 * Math.pow(input.manningN * L, 0.8)) /
    (Math.pow(input.twoYear24hrRainfallIn, 0.5) * Math.pow(s, 0.4))
  )
}

/**
 * Shallow concentrated flow velocity, fps. TR-55 figure 3-1 as equations.
 *
 *     unpaved  V = 16.1345·sqrt(s)
 *     paved    V = 20.3282·sqrt(s)
 */
export function shallowConcentratedFps(slopeFtPerFt: number, paved: boolean): number {
  const s = Math.max(slopeFtPerFt, 0.0001)
  return (paved ? 20.3282 : 16.1345) * Math.sqrt(s)
}

export interface TcSegment {
  kind: 'sheet' | 'shallow' | 'channel'
  label: string
  lengthFt: number
  slopeFtPerFt: number
  /** Sheet flow roughness, or channel Manning n. */
  manningN?: number
  /** Shallow concentrated only. */
  paved?: boolean
  /** Channel only — hydraulic radius, ft. */
  hydraulicRadiusFt?: number
  /** Computed. */
  velocityFps?: number
  travelTimeHr?: number
}

/**
 * Time of concentration by the TR-55 segmental method.
 *
 * Tc is the single most sensitive input in the whole study: q_u varies roughly
 * as Tc^−0.6, so a 30 percent error in Tc is a 17 percent error in peak flow.
 * It is reported here segment by segment so a reviewer can argue with any one
 * of them instead of with a number that appeared from nowhere.
 */
export function timeOfConcentration(
  segments: readonly TcSegment[],
  twoYear24hrRainfallIn: number,
): { tcHr: number; segments: TcSegment[]; minimumApplied: boolean } {
  const out: TcSegment[] = []
  let total = 0
  for (const s of segments) {
    const seg: TcSegment = { ...s }
    if (s.kind === 'sheet') {
      seg.travelTimeHr = sheetFlowHr({
        lengthFt: s.lengthFt,
        manningN: s.manningN ?? 0.24,
        slopeFtPerFt: s.slopeFtPerFt,
        twoYear24hrRainfallIn,
      })
      seg.velocityFps = seg.travelTimeHr > 0 ? Math.min(s.lengthFt, 100) / (seg.travelTimeHr * 3600) : 0
    } else if (s.kind === 'shallow') {
      seg.velocityFps = shallowConcentratedFps(s.slopeFtPerFt, s.paved ?? false)
      seg.travelTimeHr = s.lengthFt / (seg.velocityFps * 3600)
    } else {
      const n = s.manningN ?? 0.05
      const r = s.hydraulicRadiusFt ?? 1.0
      seg.velocityFps = (1.486 / n) * Math.pow(r, 2 / 3) * Math.sqrt(Math.max(s.slopeFtPerFt, 0.0001))
      seg.travelTimeHr = s.lengthFt / (seg.velocityFps * 3600)
    }
    total += seg.travelTimeHr ?? 0
    out.push(seg)
  }
  // TR-55's unit peak discharge regression is not defined below Tc = 0.1 hr.
  const minimumApplied = total < 0.1
  return { tcHr: Math.max(total, 0.1), segments: out, minimumApplied }
}

/**
 * Unit peak discharge coefficients — TR-55 Table F-1, Type II distribution.
 * Keyed by Ia/P; the table is interpolated in Ia/P between entries.
 */
const TYPE_II_COEFFS: readonly (readonly [number, number, number, number])[] = [
  // Ia/P,  C0,       C1,        C2
  [0.1, 2.55323, -0.6151, -0.16403],
  [0.2, 2.46532, -0.62257, -0.11657],
  [0.25, 2.41896, -0.61594, -0.0882],
  [0.3, 2.36409, -0.59857, -0.05621],
  [0.35, 2.29238, -0.57005, -0.02281],
  [0.4, 2.20282, -0.51599, -0.01259],
  [0.45, 2.14758, -0.48488, -0.01147],
  [0.5, 2.08643, -0.4436, -0.0946],
]

/**
 * Unit peak discharge q_u, csm/in. TR-55 eq. 4-1 and Appendix F.
 *
 * TR-55 limits Ia/P to the range 0.10 to 0.50 and says so: outside it the
 * regression is extrapolation. Values are clamped to the ends and the clamp is
 * REPORTED, because a silently clamped Ia/P is a silently wrong peak flow.
 */
export function unitPeakDischarge(
  tcHr: number,
  iaOverP: number,
  distribution: RainfallDistribution = 'II',
): { quCsmIn: number; clamped: boolean; iaOverPUsed: number } {
  if (distribution !== 'II') {
    throw new Error(`only the Type II distribution is carried; Maryland is Type II (got ${distribution})`)
  }
  const clamped = iaOverP < 0.1 || iaOverP > 0.5
  const r = Math.min(0.5, Math.max(0.1, iaOverP))
  let lo = TYPE_II_COEFFS[0]
  let hi = TYPE_II_COEFFS[TYPE_II_COEFFS.length - 1]
  for (let i = 0; i < TYPE_II_COEFFS.length - 1; i++) {
    if (r >= TYPE_II_COEFFS[i][0] && r <= TYPE_II_COEFFS[i + 1][0]) {
      lo = TYPE_II_COEFFS[i]
      hi = TYPE_II_COEFFS[i + 1]
      break
    }
  }
  const t = hi[0] === lo[0] ? 0 : (r - lo[0]) / (hi[0] - lo[0])
  const c0 = lo[1] + (hi[1] - lo[1]) * t
  const c1 = lo[2] + (hi[2] - lo[2]) * t
  const c2 = lo[3] + (hi[3] - lo[3]) * t
  const lt = Math.log10(tcHr)
  return { quCsmIn: Math.pow(10, c0 + c1 * lt + c2 * lt * lt), clamped, iaOverPUsed: r }
}

export interface PeakDischargeInput {
  areaSqMi: number
  curveNumber: number
  rainfallIn: number
  tcHr: number
  /** Pond and swamp adjustment. 1.0 where none. TR-55 Table 4-2. */
  pondFactor?: number
  label: string
}

export interface PeakDischargeResult {
  label: string
  rainfallIn: number
  runoffIn: number
  iaOverP: number
  quCsmIn: number
  peakCfs: number
  /** Runoff volume over the watershed, acre-ft. */
  volumeAcFt: number
  clampedIaOverP: boolean
  notes: string[]
}

export function peakDischarge(input: PeakDischargeInput): PeakDischargeResult {
  const S = retentionS(input.curveNumber)
  const Ia = 0.2 * S
  const Q = runoffDepthIn(input.rainfallIn, input.curveNumber)
  const iaOverP = Ia / input.rainfallIn
  const { quCsmIn, clamped, iaOverPUsed } = unitPeakDischarge(input.tcHr, iaOverP)
  const fp = input.pondFactor ?? 1.0
  const notes: string[] = []
  if (clamped) {
    notes.push(
      `Ia/P computed as ${iaOverP.toFixed(4)}, outside the TR-55 range 0.10 to 0.50; ` +
        `the table was entered at ${iaOverPUsed.toFixed(2)}. TR-55 says this is the ` +
        'limit of the method rather than a value to extrapolate through.',
    )
  }
  const peak = quCsmIn * input.areaSqMi * Q * fp
  return {
    label: input.label,
    rainfallIn: input.rainfallIn,
    runoffIn: Q,
    iaOverP,
    quCsmIn,
    peakCfs: peak,
    volumeAcFt: (Q / 12) * input.areaSqMi * 640,
    clampedIaOverP: clamped,
    notes,
  }
}

/**
 * NOAA Atlas 14, Volume 2 Version 3 — 24-hour point precipitation depths at
 * 38.7611 N, 77.0115 W (9588 Fort Foote Road), partial duration series, in.
 *
 * Retrieved 2026-09-11 from the NWS Hydrometeorological Design Studies Center
 * Precipitation Frequency Data Server. The partial duration series is the
 * conservative pair — the annual maximum series at the same point gives 4.76,
 * 5.99, 7.06 and 8.26 in, within two percent — and it is the series Prince
 * George's County and MDE design against.
 */
export const FORT_FOOTE_24HR_DEPTH_IN: Readonly<Record<number, number>> = {
  1: 2.58,
  2: 3.12,
  5: 4.02,
  10: 4.81,
  25: 6.01,
  50: 7.08,
  100: 8.29,
  500: 11.8,
}

export const FORT_FOOTE_PRECIP_CITATION =
  'NOAA Atlas 14 Volume 2 Version 3, PFDS point estimate, 38.7611 N 77.0115 W, ' +
  'partial duration series, retrieved 2026-09-11'
