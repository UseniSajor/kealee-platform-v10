/**
 * Survey reconciliation and the discrepancy report.
 *
 * Compares a certified survey against PGAtlas parcel geometry, county contours,
 * LiDAR terrain, recorded plat calls and whatever is already in the digital twin.
 *
 * The governing rule: certified survey geometry is NEVER moved, rotated, scaled
 * or rubber-sheeted to make it agree with GIS. GIS is the less accurate source.
 * When they disagree, the report says so and a human decides — the engine does
 * not quietly "fix" the survey to match a tax map.
 */

import type { SurveyPoint } from './import-record'
import type { SiteTwin, Ring } from '../site-plan/site-twin'
import { featuresOfKind, ringAreaSqFt } from '../site-plan/site-twin'

export interface ReconciliationTolerances {
  /** Horizontal displacement between survey and GIS parcel, feet. */
  boundaryDisplacementFt: number
  /** Difference between a surveyed call and the recorded plat call, feet. */
  callDistanceFt: number
  /** Bearing difference, seconds of arc. */
  callBearingSeconds: number
  /** Surveyed spot elevation versus LiDAR, feet. */
  elevationFt: number
  /** Area difference as a fraction of recorded area. */
  areaFraction: number
  /** Distance within which a GIS feature is considered matched to a survey point. */
  featureMatchFt: number
  /** A TIN face longer than this on any edge is treated as spanning a data gap. */
  surfaceGapEdgeFt: number
  /** Vertical difference at a breakline crossing that indicates a real conflict. */
  breaklineCrossingFt: number
}

export const DEFAULT_TOLERANCES: ReconciliationTolerances = {
  boundaryDisplacementFt: 2.0,
  callDistanceFt: 0.1,
  callBearingSeconds: 30,
  elevationFt: 1.0,
  areaFraction: 0.02,
  featureMatchFt: 15,
  surfaceGapEdgeFt: 100,
  breaklineCrossingFt: 0.1,
}

export type DiscrepancySeverity = 'informational' | 'warning' | 'blocking'

export interface Discrepancy {
  code: string
  severity: DiscrepancySeverity
  subject: string
  /** What the survey says. */
  surveyValue: string
  /** What the comparison source says. */
  comparisonValue: string
  /** Signed or absolute magnitude of the difference, with units. */
  delta: string
  tolerance: string
  /** Where on the site, in survey coordinates, so it can be mapped. */
  location?: [number, number]
  interpretation: string
  resolution: string
}

export interface DiscrepancyReport {
  discrepancies: Discrepancy[]
  blockingCount: number
  warningCount: number
  tolerances: ReconciliationTolerances
  /** Explicit statement that nothing was moved. */
  geometryAltered: false
  summary: string
}

export interface PlatCall { bearing: string; distanceFt: number }

export interface ReconcileInput {
  surveyPoints: SurveyPoint[]
  surveyBoundary?: Ring
  surveyCalls?: { bearing: string; distanceFt: number }[]
  /** Recorded plat, when available. */
  platCalls?: PlatCall[]
  platAreaSqFt?: number
  /** Preliminary GIS parcel already in the twin. */
  twin: SiteTwin
  /** LiDAR elevation lookup, feet, in the survey's own datum. */
  lidarElevationAt?: (northing: number, easting: number) => number | null
  /** County contour elevations for spot comparison. */
  countyContourElevationAt?: (northing: number, easting: number) => number | null
  surveyVerticalDatum?: string | null
  gisVerticalDatum?: string | null
  surveyHorizontalDatum?: string | null
  /** Surfaces as delivered, for gap and breakline checks. */
  surfaces?: {
    name: string
    points: { id: string; northing: number; easting: number; elevation: number }[]
    faces: [number, number, number][]
    breaklines: { name: string; coordinates: [number, number, number][] }[]
  }[]
  /** Declared coordinate unit on the import, when one was stated. */
  coordinateUnit?: 'usSurveyFoot' | 'foot' | 'metre' | 'degree' | null
  /** Recorded acreage, used as an independent scale check for unit errors. */
  recordAcreage?: number
  /** Date the comparison imagery or GIS layer was captured, for change detection. */
  gisCaptureDate?: string
  surveyDate?: string | null
  tolerances?: Partial<ReconciliationTolerances>
}

function centroid(ring: Ring): [number, number] {
  const pts = ring.coordinates
  return [
    pts.reduce((s, p) => s + p[0], 0) / pts.length,
    pts.reduce((s, p) => s + p[1], 0) / pts.length,
  ]
}

/** Bearing text like "N 45-30-00 E" to decimal degrees, for comparison only. */
export function bearingToDegrees(bearing: string): number | null {
  const m = bearing.trim().match(/^([NS])\s*(\d+)[-\s](\d+)[-\s]([\d.]+)\s*([EW])$/i)
  if (!m) {
    const dec = Number(bearing)
    return Number.isFinite(dec) ? dec : null
  }
  const [, ns, d, mm, ss, ew] = m
  const angle = Number(d) + Number(mm) / 60 + Number(ss) / 3600
  const fromNorth = ns.toUpperCase() === 'N' ? angle : 180 - angle
  return ew.toUpperCase() === 'E' ? fromNorth : 360 - fromNorth
}

/**
 * First plan-view intersection of two polylines, with each line's own elevation
 * interpolated at that point. Returns null when they do not cross.
 */
function firstCrossing(
  a: [number, number, number][],
  b: [number, number, number][],
): { northing: number; easting: number; z1: number; z2: number } | null {
  for (let i = 0; i + 1 < a.length; i++) {
    for (let j = 0; j + 1 < b.length; j++) {
      const [n1, e1, za1] = a[i], [n2, e2, za2] = a[i + 1]
      const [n3, e3, zb1] = b[j], [n4, e4, zb2] = b[j + 1]
      const den = (e1 - e2) * (n3 - n4) - (n1 - n2) * (e3 - e4)
      if (Math.abs(den) < 1e-12) continue
      const t = ((e1 - e3) * (n3 - n4) - (n1 - n3) * (e3 - e4)) / den
      const u = ((e1 - e3) * (n1 - n2) - (n1 - n3) * (e1 - e2)) / den
      if (t < 0 || t > 1 || u < 0 || u > 1) continue
      return {
        easting: e1 + t * (e2 - e1),
        northing: n1 + t * (n2 - n1),
        z1: za1 + t * (za2 - za1),
        z2: zb1 + u * (zb2 - zb1),
      }
    }
  }
  return null
}

export function reconcileSurvey(input: ReconcileInput): DiscrepancyReport {
  const tol = { ...DEFAULT_TOLERANCES, ...input.tolerances }
  const d: Discrepancy[] = []
  const add = (x: Discrepancy) => d.push(x)

  // ── Datum conflicts ───────────────────────────────────────────────────────
  if (input.surveyVerticalDatum && input.gisVerticalDatum &&
      input.surveyVerticalDatum !== input.gisVerticalDatum) {
    add({
      code: 'VERTICAL_DATUM_CONFLICT', severity: 'blocking',
      subject: 'Vertical datum',
      surveyValue: input.surveyVerticalDatum,
      comparisonValue: input.gisVerticalDatum,
      delta: 'NAVD88 and NGVD29 differ by roughly 1 ft in Maryland',
      tolerance: 'exact match required',
      interpretation:
        'Elevations from these sources cannot be compared or combined until the datums are reconciled. ' +
        'Differencing them would put every proposed grade out by about a foot.',
      resolution: 'Establish the conversion explicitly, or resurvey to a single datum. Never convert silently.',
    })
  }

  // ── Boundary displacement, survey versus GIS parcel ───────────────────────
  const gisParcel = featuresOfKind(input.twin, 'Parcel')[0]
  if (input.surveyBoundary && gisParcel) {
    const sc = centroid(input.surveyBoundary)
    const gc = centroid(gisParcel.ring)
    const displacement = Math.hypot(sc[0] - gc[0], sc[1] - gc[1])
    if (displacement > tol.boundaryDisplacementFt) {
      add({
        code: 'BOUNDARY_DISPLACEMENT',
        severity: displacement > tol.boundaryDisplacementFt * 5 ? 'blocking' : 'warning',
        subject: 'Survey boundary versus PGAtlas parcel',
        surveyValue: `centroid ${sc[0].toFixed(2)}, ${sc[1].toFixed(2)}`,
        comparisonValue: `centroid ${gc[0].toFixed(2)}, ${gc[1].toFixed(2)}`,
        delta: `${displacement.toFixed(2)} ft`,
        tolerance: `${tol.boundaryDisplacementFt} ft`,
        location: sc,
        interpretation:
          'Tax/GIS parcel geometry is compiled, not surveyed, and is routinely offset by several feet. ' +
          'The survey governs.',
        resolution:
          'Use the survey boundary. The GIS parcel is retained as superseded geometry for reference. ' +
          'The survey is NOT adjusted to match GIS.',
      })
    }

    // Area comparison against the recorded plat.
    const surveyArea = ringAreaSqFt(input.surveyBoundary)
    if (input.platAreaSqFt && input.platAreaSqFt > 0) {
      const frac = Math.abs(surveyArea - input.platAreaSqFt) / input.platAreaSqFt
      if (frac > tol.areaFraction) {
        add({
          code: 'AREA_MISMATCH', severity: 'warning',
          subject: 'Surveyed area versus recorded plat area',
          surveyValue: `${surveyArea.toFixed(0)} sq ft`,
          comparisonValue: `${input.platAreaSqFt.toFixed(0)} sq ft`,
          delta: `${(frac * 100).toFixed(2)}%`,
          tolerance: `${(tol.areaFraction * 100).toFixed(1)}%`,
          interpretation: 'A material area difference can indicate a call error, a different parcel, or a prior conveyance.',
          resolution: 'Surveyor to reconcile against the recorded plat and deed.',
        })
      }
    }
  }

  // ── Boundary closure ──────────────────────────────────────────────────────
  if (input.surveyBoundary) {
    const c = input.surveyBoundary.coordinates
    const first = c[0], last = c[c.length - 1]
    const gap = Math.hypot(first[0] - last[0], first[1] - last[1])
    if (gap > 0.1) {
      add({
        code: 'UNCLOSED_BOUNDARY', severity: 'blocking',
        subject: 'Boundary closure',
        surveyValue: `${gap.toFixed(3)} ft misclosure`,
        comparisonValue: 'closed traverse expected',
        delta: `${gap.toFixed(3)} ft`,
        tolerance: '0.10 ft',
        location: first as [number, number],
        interpretation: 'The boundary traverse does not close, so the enclosed area and every derived quantity are unreliable.',
        resolution: 'Surveyor to correct the traverse. The engine does not close it automatically.',
      })
    }
  }

  // ── Survey calls versus recorded plat calls ───────────────────────────────
  if (input.surveyCalls && input.platCalls) {
    const n = Math.min(input.surveyCalls.length, input.platCalls.length)
    for (let i = 0; i < n; i++) {
      const s = input.surveyCalls[i], p = input.platCalls[i]
      const dDist = Math.abs(s.distanceFt - p.distanceFt)
      if (dDist > tol.callDistanceFt) {
        add({
          code: 'CALL_DISTANCE_MISMATCH', severity: 'warning',
          subject: `Boundary call ${i + 1} distance`,
          surveyValue: `${s.distanceFt.toFixed(2)} ft`,
          comparisonValue: `${p.distanceFt.toFixed(2)} ft (plat)`,
          delta: `${dDist.toFixed(2)} ft`,
          tolerance: `${tol.callDistanceFt} ft`,
          interpretation: 'Surveyed distance differs from the recorded call.',
          resolution: 'Surveyor to note whether the survey or the record controls.',
        })
      }
      const sb = bearingToDegrees(s.bearing), pb = bearingToDegrees(p.bearing)
      if (sb != null && pb != null) {
        const diffSec = Math.abs(sb - pb) * 3600
        if (diffSec > tol.callBearingSeconds) {
          add({
            code: 'CALL_BEARING_MISMATCH', severity: 'warning',
            subject: `Boundary call ${i + 1} bearing`,
            surveyValue: s.bearing, comparisonValue: `${p.bearing} (plat)`,
            delta: `${Math.round(diffSec)}"`,
            tolerance: `${tol.callBearingSeconds}"`,
            interpretation: 'Surveyed bearing differs from the recorded call, which may indicate a different basis of bearing.',
            resolution: 'Surveyor to state the basis of bearing and reconcile.',
          })
        }
      }
    }
    if (input.surveyCalls.length !== input.platCalls.length) {
      add({
        code: 'CALL_COUNT_MISMATCH', severity: 'warning',
        subject: 'Boundary call count',
        surveyValue: `${input.surveyCalls.length} calls`,
        comparisonValue: `${input.platCalls.length} calls (plat)`,
        delta: `${Math.abs(input.surveyCalls.length - input.platCalls.length)}`,
        tolerance: 'equal',
        interpretation: 'The survey and the plat describe a different number of boundary segments.',
        resolution: 'Confirm the parcel matches the plat referenced.',
      })
    }
  }

  // ── Surveyed elevations versus LiDAR / county contours ────────────────────
  if (input.lidarElevationAt || input.countyContourElevationAt) {
    const withZ = input.surveyPoints.filter(p => p.elevation != null)
    let exceed = 0
    let worst: { delta: number; point: SurveyPoint; lidar: number } | null = null
    for (const p of withZ) {
      const lidar = input.lidarElevationAt?.(p.northing, p.easting)
        ?? input.countyContourElevationAt?.(p.northing, p.easting)
      if (lidar == null) continue
      const delta = Math.abs((p.elevation as number) - lidar)
      if (delta > tol.elevationFt) {
        exceed++
        if (!worst || delta > worst.delta) worst = { delta, point: p, lidar }
      }
    }
    if (worst) {
      add({
        code: 'ELEVATION_DISCREPANCY',
        severity: worst.delta > tol.elevationFt * 3 ? 'blocking' : 'warning',
        subject: `Surveyed elevation versus LiDAR (${exceed} of ${withZ.length} points exceed tolerance)`,
        surveyValue: `${(worst.point.elevation as number).toFixed(2)} ft at point ${worst.point.pointId}`,
        comparisonValue: `${worst.lidar.toFixed(2)} ft (LiDAR)`,
        delta: `${worst.delta.toFixed(2)} ft`,
        tolerance: `${tol.elevationFt} ft`,
        location: [worst.point.northing, worst.point.easting],
        interpretation:
          'A systematic offset suggests a datum difference. Scattered differences suggest grading or ' +
          'construction since the LiDAR flight. LiDAR is mapping grade and does not override a survey.',
        resolution: 'Confirm the vertical datum, then treat differences as evidence of site change.',
      })
    }
  }

  // ── Improvements present in survey but absent from GIS, and vice versa ────
  const gisBuildings = featuresOfKind(input.twin, 'Building')
  const surveyedBuildingPoints = input.surveyPoints.filter(p => p.classification === 'building_corner')
  if (surveyedBuildingPoints.length > 0 && gisBuildings.length === 0) {
    add({
      code: 'IMPROVEMENT_NOT_IN_GIS', severity: 'informational',
      subject: 'Surveyed structure absent from GIS',
      surveyValue: `${surveyedBuildingPoints.length} building corner(s) surveyed`,
      comparisonValue: 'no structure in the GIS model',
      delta: `${surveyedBuildingPoints.length} points`,
      location: [surveyedBuildingPoints[0].northing, surveyedBuildingPoints[0].easting],
      tolerance: 'n/a',
      interpretation: 'Construction has likely occurred since the GIS layer was compiled.',
      resolution: 'Adopt the surveyed structure; GIS is superseded.',
    })
  }
  if (gisBuildings.length > 0 && surveyedBuildingPoints.length === 0) {
    add({
      code: 'GIS_FEATURE_NOT_SURVEYED', severity: 'warning',
      subject: 'GIS structure absent from survey',
      surveyValue: 'no building corners surveyed',
      comparisonValue: `${gisBuildings.length} structure(s) in GIS`,
      delta: `${gisBuildings.length} features`,
      tolerance: 'n/a',
      interpretation: 'The structure may have been demolished, or simply not located in the field.',
      resolution: 'Confirm with the surveyor whether the omission is intentional.',
    })
  }

  // ── Utility and drainage structures ───────────────────────────────────────
  const utilityPoints = input.surveyPoints.filter(
    p => p.classification === 'utility_structure' || p.classification === 'drainage_structure',
  )
  const gisUtilities = featuresOfKind(input.twin, 'Utility')
  if (gisUtilities.length > 0 && utilityPoints.length === 0) {
    add({
      code: 'UTILITY_DISCREPANCY', severity: 'warning',
      subject: 'Utility structures',
      surveyValue: 'none located in the field',
      comparisonValue: `${gisUtilities.length} utility feature(s) from record information`,
      delta: `${gisUtilities.length}`,
      tolerance: 'n/a',
      interpretation: 'Record utility locations are unverified. Design that depends on them carries risk.',
      resolution: 'Field-locate before excavation; call Miss Utility.',
    })
  }

  // ── Invalid and duplicate points ──────────────────────────────────────────
  const keys = new Map<string, number>()
  for (const p of input.surveyPoints) {
    const k = `${p.northing.toFixed(3)}|${p.easting.toFixed(3)}`
    keys.set(k, (keys.get(k) ?? 0) + 1)
  }
  const dupes = [...keys.values()].filter(v => v > 1).length
  if (dupes > 0) {
    add({
      code: 'DUPLICATE_POINTS', severity: 'warning',
      subject: 'Duplicate survey points',
      surveyValue: `${dupes} coordinate(s) appear more than once`,
      comparisonValue: 'unique coordinates expected',
      delta: `${dupes}`,
      tolerance: '0',
      interpretation: 'Duplicates can indicate a merged file or a re-shot point.',
      resolution: 'Surveyor to confirm which observation controls.',
    })
  }

  // ── Unit errors ───────────────────────────────────────────────────────────
  if (input.surveyBoundary && input.recordAcreage && input.recordAcreage > 0) {
    const surveyArea = ringAreaSqFt(input.surveyBoundary)
    const recordSqFt = input.recordAcreage * 43560
    const ratio = surveyArea / recordSqFt
    // Reading metres as feet inflates area by 3.28^2 ≈ 10.76; the reverse divides by it.
    const metresAsFeet = Math.abs(ratio - 10.7639) / 10.7639 < 0.05
    const feetAsMetres = Math.abs(ratio - 0.0929) / 0.0929 < 0.05
    if (metresAsFeet || feetAsMetres) {
      add({
        code: 'UNIT_ERROR', severity: 'blocking',
        subject: 'Coordinate units',
        surveyValue: `${surveyArea.toFixed(0)} sq ft computed from the coordinates`,
        comparisonValue: `${recordSqFt.toFixed(0)} sq ft from the recorded ${input.recordAcreage} acres`,
        delta: `ratio ${ratio.toFixed(4)}`,
        tolerance: 'ratio near 1.0',
        interpretation: metresAsFeet
          ? 'The computed area is about 10.76 times the record, which is the square of the foot-to-metre ratio. ' +
            'The coordinates are almost certainly metres being read as feet.'
          : 'The computed area is about a tenth of the record, consistent with feet being read as metres.',
        resolution:
          'Confirm the coordinate unit with the surveyor and re-import. The coordinates are not rescaled ' +
          'automatically — a unit guess that happens to be wrong is undetectable downstream.',
      })
    }
  }
  if (input.coordinateUnit == null) {
    add({
      code: 'UNIT_UNDECLARED', severity: 'warning',
      subject: 'Coordinate units',
      surveyValue: 'not declared',
      comparisonValue: 'a declared linear unit is expected',
      delta: 'n/a',
      tolerance: 'must be stated',
      interpretation: 'US survey feet and international feet differ by 2 ppm — about 0.01 ft across a 5,000 ft site.',
      resolution: 'Ask the surveyor which foot. Do not assume.',
    })
  }

  // ── Surface gaps and crossing breaklines ──────────────────────────────────
  for (const s of input.surfaces ?? []) {
    if (s.points.length === 0) continue
    const idx = new Map(s.points.map((p, i) => [i, p]))
    let longEdges = 0
    let worstEdge = 0
    let worstAt: [number, number] | undefined
    for (const face of s.faces) {
      const ps = face.map(i => idx.get(i - 1) ?? idx.get(i)).filter(Boolean) as typeof s.points
      if (ps.length < 3) continue
      for (let i = 0; i < 3; i++) {
        const a = ps[i], b = ps[(i + 1) % 3]
        const len = Math.hypot(a.northing - b.northing, a.easting - b.easting)
        if (len > tol.surfaceGapEdgeFt) {
          longEdges++
          if (len > worstEdge) { worstEdge = len; worstAt = [a.northing, a.easting] }
        }
      }
    }
    if (longEdges > 0) {
      add({
        code: 'SURFACE_GAP', severity: 'warning',
        subject: `Surface "${s.name}" triangulation`,
        surveyValue: `${longEdges} triangle edge(s) longer than ${tol.surfaceGapEdgeFt} ft`,
        comparisonValue: 'edges within the survey shot spacing',
        delta: `longest ${worstEdge.toFixed(0)} ft`,
        tolerance: `${tol.surfaceGapEdgeFt} ft`,
        location: worstAt,
        interpretation:
          'Long triangle edges span areas with no survey shots. The surface interpolates straight across ' +
          'them, so grades and earthwork volumes in those areas are invented by the triangulation, not measured.',
        resolution: 'Obtain supplemental shots, or bound the design so it does not rely on the gap.',
      })
    }

    // Breaklines that cross in plan but disagree in elevation describe an
    // impossible surface — two different heights at one point.
    const bl = s.breaklines
    for (let i = 0; i < bl.length; i++) {
      for (let j = i + 1; j < bl.length; j++) {
        const hit = firstCrossing(bl[i].coordinates, bl[j].coordinates)
        if (!hit) continue
        if (Math.abs(hit.z1 - hit.z2) > tol.breaklineCrossingFt) {
          add({
            code: 'BREAKLINE_CROSSING', severity: 'blocking',
            subject: `Breaklines "${bl[i].name}" and "${bl[j].name}" in surface "${s.name}"`,
            surveyValue: `elevation ${hit.z1.toFixed(2)} ft on "${bl[i].name}"`,
            comparisonValue: `elevation ${hit.z2.toFixed(2)} ft on "${bl[j].name}"`,
            delta: `${Math.abs(hit.z1 - hit.z2).toFixed(2)} ft at the crossing`,
            tolerance: `${tol.breaklineCrossingFt} ft`,
            location: [hit.northing, hit.easting],
            interpretation:
              'Two breaklines cross in plan with different elevations, which asks the surface to be at two ' +
              'heights at one point. Triangulation will resolve it arbitrarily and the resulting grades are unreliable.',
            resolution: 'Surveyor to correct the breaklines. The engine does not pick a winner.',
          })
        }
      }
    }
  }

  // ── Recent grading or construction change ─────────────────────────────────
  if (input.gisCaptureDate && input.surveyDate) {
    const gap = (Date.parse(input.surveyDate) - Date.parse(input.gisCaptureDate)) / 86_400_000
    const elevationFindings = d.filter(x => x.code === 'ELEVATION_DISCREPANCY').length
    const improvementFindings = d.filter(
      x => x.code === 'IMPROVEMENT_NOT_IN_GIS' || x.code === 'GIS_FEATURE_NOT_SURVEYED',
    ).length
    if (Number.isFinite(gap) && gap > 365 && (elevationFindings > 0 || improvementFindings > 0)) {
      add({
        code: 'SITE_CHANGED_SINCE_GIS', severity: 'informational',
        subject: 'Site change since the comparison data was captured',
        surveyValue: `surveyed ${input.surveyDate}`,
        comparisonValue: `GIS/LiDAR captured ${input.gisCaptureDate}`,
        delta: `${Math.round(gap / 365 * 10) / 10} years`,
        tolerance: '1 year',
        interpretation:
          'The elevation and improvement differences above are consistent with grading or construction ' +
          'having occurred in the interval, rather than with survey error. The survey is the current condition.',
        resolution: 'Adopt the survey. Note the change in the existing-conditions narrative.',
      })
    }
  }

  const blockingCount = d.filter(x => x.severity === 'blocking').length
  const warningCount = d.filter(x => x.severity === 'warning').length

  return {
    discrepancies: d,
    blockingCount,
    warningCount,
    tolerances: tol,
    geometryAltered: false,
    summary:
      d.length === 0
        ? 'No discrepancies beyond tolerance. Certified geometry was not altered.'
        : `${d.length} discrepancy finding(s): ${blockingCount} blocking, ${warningCount} warning. ` +
          'Certified survey geometry was NOT moved, rotated, scaled or rubber-sheeted.',
  }
}
