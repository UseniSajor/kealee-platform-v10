/**
 * Drainage area computations for the DRAINAGE AREA MAP.
 *
 * The engineering module has carried the rational method, Kirpich time of
 * concentration and the Maryland WQv since it was written, and nothing on the
 * site-plan path ever called them. The plan drew a drainage area — one polygon,
 * the whole lot — and computed nothing from it, so the sheet asserted a
 * catchment without a single number behind it.
 *
 * What is derived here is PRE- and POST-development peak discharge for the same
 * catchment, which is the comparison a reviewer actually looks for: the increase
 * is what the stormwater management has to manage.
 *
 * WHAT IS NOT DERIVED, and is not invented:
 *
 *   - Rainfall intensity. It comes from the NOAA Atlas 14 IDF curve for THIS
 *     site and design storm. A default would look exactly like a real value.
 *   - Slope, when there is no surveyed grade. Kirpich needs one, and a guessed
 *     slope moves the whole Q.
 *
 * Both are inputs. Absent, the computation reports what it could not compute
 * rather than filling in a plausible number — a peak discharge is sized against,
 * and a fabricated one sizes a pipe.
 */

import {
  compositeRunoffCoefficient, peakDischargeRational, timeOfConcentrationKirpich,
  waterQualityVolume, RUNOFF_COEFFICIENTS, type SubArea,
} from './engineering'
import { ringAreaSqFt, type Position, type Ring, type SiteTwin } from './site-twin'
import {
  noaaIntensity, MD_WATER_QUALITY_RAINFALL_IN, MD_WQV_CITATION, NOAA_ATLAS14_SITE,
} from '../jurisdictions/noaa-atlas14'

const SQFT_PER_ACRE = 43_560

/** Even-odd point-in-ring. EPSG:2248 feet, so no projection. */
function pointInRing(p: Position, ring: readonly Position[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > p[1]) !== (yj > p[1])
        && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi || 1e-9) + xi) inside = !inside
  }
  return inside
}

export interface DrainageSubArea {
  label: string
  areaSqFt: number
  surface: string
  c: number
}

export interface DrainageComputation {
  totalAreaSqFt: number
  totalAreaAcres: number
  /** Impervious as a percentage of the catchment. */
  percentImpervious: number
  preDevelopment: { subAreas: DrainageSubArea[]; compositeC: number; peakCfs: number | null }
  postDevelopment: { subAreas: DrainageSubArea[]; compositeC: number; peakCfs: number | null }
  /** Post minus pre. The number the management has to answer for. */
  increaseCfs: number | null
  timeOfConcentrationMin: number | null
  flowPathFt: number | null
  flowPathSlopePct: number | null
  returnPeriodYr: number
  intensityInPerHr: number | null
  waterQualityVolumeCf: number | null
  rv: number | null
  assumptions: string[]
}

export interface DrainageInput {
  twin: SiteTwin
  /** Catchment. Defaults to the parcel. */
  catchment?: Ring | null
  /** Design storm return period. 10-year is the ordinary storm-drain design. */
  returnPeriodYr?: number
  /** Override the NOAA intensity, if a designer has their own figure. */
  intensityInPerHr?: number | null
  /** Longest flow path, ft. Defaults to the catchment's diagonal. */
  flowPathFt?: number | null
  /** Flow path slope, ft/ft. From surveyed grade — not guessed. */
  flowPathSlopeFtPerFt?: number | null
  /** Water quality storm depth, inches, per the Maryland Stormwater Design Manual. */
  waterQualityRainfallIn?: number | null
}

function subAreasFrom(twin: SiteTwin, totalSqFt: number, proposed: boolean): DrainageSubArea[] {
  if (!proposed) {
    // Pre-development: the lot as it stands. These are vacant recorded lots, so
    // the catchment is lawn/meadow in its entirety. Anything already built would
    // appear as an EXISTING building or pavement feature and be picked up here.
    const existingRoof = twin.features
      .filter(f => f.kind === 'Building' && (f as { existing?: boolean }).existing === true)
      .reduce((n, f) => n + ringAreaSqFt((f as { ring: Ring }).ring), 0)
    const existingPaved = twin.features
      .filter(f => f.kind === 'ExistingFeature' && (f as { ring?: Ring }).ring)
      .reduce((n, f) => n + ringAreaSqFt((f as { ring: Ring }).ring), 0)
    const pervious = Math.max(0, totalSqFt - existingRoof - existingPaved)
    const out: DrainageSubArea[] = []
    if (existingRoof > 0) {
      out.push({ label: 'Existing roof', areaSqFt: existingRoof, surface: 'roof', c: RUNOFF_COEFFICIENTS.roof })
    }
    if (existingPaved > 0) {
      out.push({ label: 'Existing paving', areaSqFt: existingPaved, surface: 'pavement', c: RUNOFF_COEFFICIENTS.pavement })
    }
    out.push({ label: 'Pervious — lawn / meadow', areaSqFt: pervious, surface: 'lawn_average', c: RUNOFF_COEFFICIENTS.lawn_average })
    return out
  }

  const roof = twin.features
    .filter(f => f.kind === 'Building' && (f as { existing?: boolean }).existing !== true)
    .reduce((n, f) => n + ringAreaSqFt((f as { ring: Ring }).ring), 0)
  // Only paving ON the lot counts toward the lot's catchment. The apron, walk
  // and curb sit in the right-of-way and drain to the street, which is a
  // different catchment with a different owner.
  const paved = twin.features
    .filter(f => f.kind === 'Pavement' && (f as { ring?: Ring }).ring)
    .filter(f => {
      const imp = String(((f as { attributes?: Record<string, unknown> }).attributes?.improvement) ?? '')
      return !/sidewalk|curb|apron/i.test(imp)
    })
    .reduce((n, f) => n + ringAreaSqFt((f as { ring: Ring }).ring), 0)
  const pervious = Math.max(0, totalSqFt - roof - paved)
  const out: DrainageSubArea[] = []
  if (roof > 0) out.push({ label: 'Proposed roof', areaSqFt: roof, surface: 'roof', c: RUNOFF_COEFFICIENTS.roof })
  if (paved > 0) out.push({ label: 'Driveway and on-lot paving', areaSqFt: paved, surface: 'pavement', c: RUNOFF_COEFFICIENTS.pavement })
  out.push({ label: 'Pervious — lawn', areaSqFt: pervious, surface: 'lawn_average', c: RUNOFF_COEFFICIENTS.lawn_average })
  return out
}

const toSub = (s: DrainageSubArea): SubArea => ({ areaAcres: s.areaSqFt / SQFT_PER_ACRE, surface: s.surface, c: s.c })

export function computeDrainage(input: DrainageInput): DrainageComputation | null {
  const parcel = input.catchment
    ?? (input.twin.features.find(f => f.kind === 'Parcel') as { ring?: Ring } | undefined)?.ring
  if (!parcel) return null

  const totalSqFt = ringAreaSqFt(parcel)
  const totalAcres = totalSqFt / SQFT_PER_ACRE
  const assumptions: string[] = []

  const pre = subAreasFrom(input.twin, totalSqFt, false)
  const post = subAreasFrom(input.twin, totalSqFt, true)
  const preC = compositeRunoffCoefficient(pre.map(toSub)).value
  const postC = compositeRunoffCoefficient(post.map(toSub)).value

  const impSqFt = post.filter(s => s.c >= 0.9).reduce((n, s) => n + s.areaSqFt, 0)
  const percentImpervious = totalSqFt > 0 ? (impSqFt / totalSqFt) * 100 : 0

  // SLOPE FROM THE COUNTY'S OWN 2 FT CONTOURS.
  //
  // Kirpich needs the slope of the longest flow path, and this used to report
  // that it had none. It does: the contours on the twin carry elevations, so
  // the fall across the catchment divided by the flow path is the slope. That
  // is exactly how it is read off a topographic map.
  const coords = parcel.coordinates as Position[]
  const xs = coords.map(c => c[0]), ys = coords.map(c => c[1])
  const diag = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))
  const flowPathFt = input.flowPathFt ?? diag

  const elevs: number[] = []
  for (const f of input.twin.features) {
    if (f.kind !== 'Contour') continue
    const line = (f as { line?: number[][] }).line
    if (!line?.length) continue
    // Only contours crossing the catchment describe its fall.
    if (!line.some(pt => pointInRing([pt[0], pt[1]], coords))) continue
    for (const pt of line) if (pt.length > 2 && Number.isFinite(pt[2])) elevs.push(pt[2])
  }
  let slope = input.flowPathSlopeFtPerFt ?? null
  if (slope == null && elevs.length >= 2) {
    const fall = Math.max(...elevs) - Math.min(...elevs)
    if (fall > 0 && flowPathFt > 0) slope = fall / flowPathFt
  }
  // A floor of 0.5%: Kirpich diverges as the slope approaches zero, and no
  // graded residential lot drains flatter than that by design.
  if (slope != null && slope < 0.005) slope = 0.005

  let tc: number | null = null
  if (slope != null && slope > 0) {
    tc = timeOfConcentrationKirpich(flowPathFt, slope).value
    assumptions.push(
      `Time of concentration by Kirpich over a ${flowPathFt.toFixed(0)} ft flow path at ` +
      `${(slope * 100).toFixed(1)}%, taken from the ${elevs.length ? '2 ft contours across the ' +
      'catchment' : 'design grade'}. A 5-minute floor applies.`)
  }

  const returnPeriodYr = input.returnPeriodYr ?? 10
  const i = input.intensityInPerHr ?? (tc != null ? noaaIntensity(tc, returnPeriodYr) : null)
  let preQ: number | null = null, postQ: number | null = null
  if (i != null && i > 0) {
    preQ = peakDischargeRational(preC, i, totalAcres).value
    postQ = peakDischargeRational(postC, i, totalAcres).value
    assumptions.push(
      `Rainfall intensity ${i.toFixed(2)} in/hr for the ${returnPeriodYr}-year storm at a ` +
      `${tc?.toFixed(1)} minute duration. ${NOAA_ATLAS14_SITE.citation}.`)
  }

  const P = input.waterQualityRainfallIn ?? MD_WATER_QUALITY_RAINFALL_IN
  const wqvCalc = waterQualityVolume(P, percentImpervious, totalAcres).value
  const wqv = wqvCalc.wqvCubicFeet
  const rv = wqvCalc.rv
  assumptions.push(`Water quality volume on a ${P.toFixed(1)} in rainfall. ${MD_WQV_CITATION}.`)
  assumptions.push(
    'Runoff coefficients: roof and pavement 0.95, average lawn 0.25. Confirm the lawn coefficient ' +
    'against the soil hydrologic group before relying on the composite.',
    'Sidewalk, curb and gutter and the driveway apron lie in the public right-of-way and drain to ' +
    'the street. They are excluded from the lot catchment and included in the disturbed area.')

  return {
    totalAreaSqFt: totalSqFt,
    totalAreaAcres: Number(totalAcres.toFixed(4)),
    percentImpervious: Number(percentImpervious.toFixed(1)),
    preDevelopment: { subAreas: pre, compositeC: preC, peakCfs: preQ },
    postDevelopment: { subAreas: post, compositeC: postC, peakCfs: postQ },
    increaseCfs: preQ != null && postQ != null ? Number((postQ - preQ).toFixed(2)) : null,
    timeOfConcentrationMin: tc,
    flowPathFt: Number(flowPathFt.toFixed(0)),
    flowPathSlopePct: slope == null ? null : Number((slope * 100).toFixed(2)),
    returnPeriodYr,
    intensityInPerHr: i,
    waterQualityVolumeCf: wqv,
    rv,
    assumptions,
  }
}
