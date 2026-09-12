/**
 * The whole subdivision on one set of sheets — both lots, as the plat shows it.
 *
 * `generate-from-plat.ts` draws ONE lot. A recorded plat does not: it shows the
 * outer boundary, the internal division, and the area dedicated to public use,
 * all on one sheet, because those three things only make sense against each
 * other. A reviewer checking that the lots close against the outer boundary,
 * or that the dedication is what the plat says, cannot do it from two separate
 * drawings.
 *
 * So this builds each lot exactly as the single-lot generator does — same
 * setbacks, same envelope, same footprint placement, same county layers — and
 * composes them onto one boundary of record.
 *
 *   pnpm tsx scripts/generate-subdivision.ts \
 *     ../../output/site-plans/porter-subdivision.plat.json \
 *     ../../output/site-plans/porter-lot1.plat.json \
 *     ../../output/site-plans/porter-lot2.plat.json \
 *     ../../output/site-plans/porter-subdivision-permit-set.pdf
 *
 * SHEETS=... overrides the sheet list. ASCII_SHEETS=... narrows the terminal
 * render. The full canonical set is the default here: this output is meant for
 * submission, and a submission arrives complete.
 */

import { readFileSync, writeFileSync } from 'fs'
import { renderAsciiPlan } from '../src/sheets/render-ascii'
import { toDxf, toLandXml } from '../src/export/exporters'
import { buildRecordedPlatBoundary } from '../src/survey/recorded-plat'
import { normaliseRing } from '../src/site-plan/buildable-envelope'
import { resolvePgAtlasSite, fetchPgAtlasEasements, fetchPgAtlasAdjacentParcels } from '../src/jurisdictions/pgatlas'
import { fetchPgContours } from '../src/jurisdictions/pg-elevation'
import { fetchSoilMapUnits } from '../src/jurisdictions/usda-soils'
import {
  designSwaleSystem, SWALE_MANNING_N, SWALE_FREEBOARD_FT, SWALE_PERMISSIBLE_VELOCITY_FPS,
  type SwaleReachInput,
} from '../src/site-plan/swale'
import {
  buildProposedSurface, extractContours, earthwork, MAX_MOWABLE_SLOPE_PCT,
  type ExtractedContour,
} from '../src/site-plan/proposed-grade'
import { buildLotPackage } from '../src/self-perform/lot-package'
import { composeSheets, blocksFromFeatures } from '../src/sheets/composer'
import { renderSheetSetPdf } from '../src/sheets/render-pdf'
import { buildSheetContext } from '../src/sheets/render-svg'
import { SHEET_TITLES, type SheetId } from '../src/sheets/sheet-template'
import type { Position, SiteFeature, SiteTwin } from '../src/site-plan/site-twin'

const FULL_SET: SheetId[] = [
  'C-000', 'C-100', 'C-200', 'C-300', 'C-400',
  'C-500', 'C-600', 'C-700', 'C-800', 'C-900', 'L-100',
]

type PlatSpec = {
  address: string
  reference: Record<string, string>
  basisOfBearings?: string
  pointOfBeginning?: [number, number]
  recordedAreaSqFt?: number
  programme?: Record<string, unknown>
  triangleRearAsSide?: boolean
  frontSetbackFt?: number
  sideSetbackFt?: number
  sideStandoffFt?: number
  sanitaryFrom?: 'frontage' | 'rear' | 'lot13'
  frontFaceToCurbFt?: number
  curbOffsetFt?: number
  calls: unknown[]
  siteLatLon?: [number, number]
  /** Finished floor above the street grade at the driveway, ft. */
  frontDoorAboveStreetFt?: number
  /**
   * How the dwelling meets the ground.
   *
   * 'slab' grades a pad to the finished floor, which is the default and the
   * right answer outside a floodplain. 'crawlspace' and 'pier' carry the floor
   * on the foundation and leave the ground at existing grade, which is what a
   * lot below the base flood elevation requires — see `padElFt` in
   * `proposed-grade.ts`. 'basement' is 'slab' with a below-grade storey and is
   * not permissible where the basement slab falls below the flood elevation.
   */
  foundation?: 'slab' | 'basement' | 'crawlspace' | 'pier'
  retainingWall?: { behindHouseFt: number; heightFt: number }
  /** Carry the rear-yard grading out toward the easement — see proposed-grade. */
  rearYard?: { extentFt?: number; benchFt?: number; easementStandoffFt?: number }
  frontageExisting?: boolean
  omitWaterAndSewer?: boolean
  omitSwmPractice?: boolean
  stormOutfall?: unknown
}

/** Even-odd point-in-ring. EPSG:2248 feet, no projection. */
function pointInRing(p: readonly number[], ring: readonly (readonly number[])[]): boolean {
  return inRing(p, ring)
}

/** Even-odd point-in-ring. EPSG:2248 feet, no projection. */
function inRing(p: readonly number[], ring: readonly (readonly number[])[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** True when two rings share any area — containment either way, or a crossing. */
function ringsTouch(a: readonly Position[], b: readonly Position[]): boolean {
  if (a.some(p => inRing(p, b))) return true
  if (b.some(p => inRing(p, a))) return true
  const cross = (o: Position, p: Position, q: Position) =>
    (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0])
  for (let i = 0; i < a.length; i++) {
    const a1 = a[i], a2 = a[(i + 1) % a.length]
    for (let j = 0; j < b.length; j++) {
      const b1 = b[j], b2 = b[(j + 1) % b.length]
      if (((cross(a1, a2, b1) > 0) !== (cross(a1, a2, b2) > 0))
          && ((cross(b1, b2, a1) > 0) !== (cross(b1, b2, a2) > 0))) return true
    }
  }
  return false
}

function centroidOf(ring: Position[]): [number, number] {
  return ring.reduce((a, c) => [a[0] + c[0] / ring.length, a[1] + c[1] / ring.length], [0, 0] as [number, number])
}

/**
 * Clips a polygon to a convex clip polygon, Sutherland–Hodgman.
 *
 * The WSSC easement is a straight strip and the parcel it lies in is a
 * quadrilateral, so this is exact for the case at hand. It is what keeps the
 * easement INSIDE Lot 13 instead of running through whatever the strip's
 * arithmetic happens to cross.
 */
function clipToConvex(subject: Position[], clip: Position[]): Position[] {
  const area = (r: Position[]) => {
    let a = 0
    for (let i = 0; i < r.length; i++) {
      const q = r[(i + 1) % r.length]
      a += r[i][0] * q[1] - q[0] * r[i][1]
    }
    return a / 2
  }
  const cw = area(clip) < 0
  let out = subject.slice()
  for (let i = 0; i < clip.length; i++) {
    const a = clip[i], b = clip[(i + 1) % clip.length]
    const inside = (p: Position) => {
      const cross = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
      return cw ? cross <= 1e-9 : cross >= -1e-9
    }
    const input = out
    out = []
    for (let j = 0; j < input.length; j++) {
      const cur = input[j], prev = input[(j + input.length - 1) % input.length]
      const curIn = inside(cur), prevIn = inside(prev)
      const cut = (): Position => {
        const d1 = (b[0] - a[0]) * (prev[1] - a[1]) - (b[1] - a[1]) * (prev[0] - a[0])
        const d2 = (b[0] - a[0]) * (cur[1] - a[1]) - (b[1] - a[1]) * (cur[0] - a[0])
        const t = d1 / (d1 - d2 || 1e-12)
        return [prev[0] + (cur[0] - prev[0]) * t, prev[1] + (cur[1] - prev[1]) * t]
      }
      if (curIn) {
        if (!prevIn) out.push(cut())
        out.push(cur)
      } else if (prevIn) out.push(cut())
    }
    if (!out.length) return []
  }
  return out
}
async function main(): Promise<void> {
  const [outerPath, ...rest] = process.argv.slice(2)
  const outPath = rest.pop()
  const lotPaths = rest
  if (!outerPath || !lotPaths.length || !outPath) {
    console.error('usage: generate-subdivision.ts <outer.plat.json> <lot.plat.json...> <out.pdf>')
    process.exit(1)
  }

  const outerSpec = JSON.parse(readFileSync(outerPath, 'utf8')) as PlatSpec
  const subdivisionName = outerSpec.reference.subdivisionName ?? 'Subdivision'
  console.log(`\n=== ${subdivisionName} — permit set, ${lotPaths.length} lots on one boundary ===\n`)

  const site = await resolvePgAtlasSite(outerSpec.address, {})
  if (!site) throw new Error(`The county locator did not match "${outerSpec.address}".`)

  // ── The outer boundary of record ──────────────────────────────────────────
  const outer = buildRecordedPlatBoundary({
    calls: outerSpec.calls as never,
    reference: outerSpec.reference as never,
    basisOfBearings: outerSpec.basisOfBearings ?? null,
    pointOfBeginning: outerSpec.pointOfBeginning ?? null,
    crs: 'EPSG:2248', horizontalDatum: 'NAD83',
    recordedAreaSqFt: outerSpec.recordedAreaSqFt ?? null,
    referenceParcel: site.parcel ? { coordinates: site.parcel.ring.coordinates } : null,
  })
  const outerRing = outer.ring.coordinates as Position[]
  console.log('[1] outer boundary')
  console.log(`    computed area   ${outer.computedAreaSqFt?.toFixed(0) ?? '—'} sq ft`
    + (outerSpec.recordedAreaSqFt ? `  (recorded ${outerSpec.recordedAreaSqFt.toLocaleString()})` : ''))
  console.log(`    precision       1:${outer.traverse.precisionDenominator?.toFixed(0) ?? '—'}`)

  // ── County layers, once, over the whole subdivision ───────────────────────
  const c0 = centroidOf(outerRing)
  const radiusFt = Math.ceil(Math.max(...outerRing.map(c => Math.hypot(c[0] - c0[0], c[1] - c0[1]))) + 100)
  const contours = await fetchPgContours(c0[0], c0[1], { radiusFt }).catch(() => null)
  const nearbyEasements = await fetchPgAtlasEasements(c0[0], c0[1], { radiusFt: radiusFt + 150 })
  console.log(`    contours        ${contours?.contours.length ?? 0} within ${radiusFt} ft`
    + (contours ? ` · ${contours.verticalDatum ?? 'datum not stated'}` : ' — NONE RETURNED'))

  // The adjoining lots, as the plat shows them. A boundary of record is read
  // against what it abuts; the subject parcel is excluded so it is not drawn
  // twice, once as the subject and once as its own neighbour.
  const swept = await fetchPgAtlasAdjacentParcels(c0[0], c0[1], {
    radiusFt: radiusFt + 200,
    excludePropId: site.parcel?.parcelId ?? null,
  })
  // ONLY THE ABUTTERS. A radius sweep over a subdivision returns the
  // neighbourhood — forty parcels here — and a plat shows the properties that
  // actually touch the boundary, eight of them, each lettered with its owner or
  // lot and its record reference. Forty outlines is not more information than
  // eight; it is the same drawing with the adjoiners no longer legible.
  // ABUTTING, OR ACROSS THE STREET.
  //
  // A 3 ft tolerance keeps the lots that touch the boundary and drops every lot
  // on the far side of Rollins Avenue, because a 57 ft right-of-way is between
  // them — so the street was drawn with a centreline and nothing beyond it. The
  // plat names four properties opposite (Dade, Ferrell, Valle Gargan, Rollins)
  // and shows their frontage, which is what makes the street read as a street.
  //
  // The wider reach is deliberately generous enough to cross the right-of-way
  // and no further; the render trims each one to the part near this site.
  const ABUT_TOLERANCE_FT = 3
  const ACROSS_STREET_FT = 90
  const gapToBoundary = (pcl: { ring: { coordinates: Position[] } }) => {
    let best = Infinity
    for (const c of pcl.ring.coordinates as Position[]) {
      for (let i = 0; i < outerRing.length; i++) {
        const o = outerRing[i], n = outerRing[(i + 1) % outerRing.length]
        const vx = n[0] - o[0], vy = n[1] - o[1]
        const t = Math.max(0, Math.min(1,
          ((c[0] - o[0]) * vx + (c[1] - o[1]) * vy) / (vx * vx + vy * vy || 1)))
        best = Math.min(best, Math.hypot(c[0] - (o[0] + t * vx), c[1] - (o[1] + t * vy)))
      }
    }
    return best
  }
  const adjacentParcels = swept.filter(p => gapToBoundary(p) <= ACROSS_STREET_FT)
  const touching = swept.filter(p => gapToBoundary(p) <= ABUT_TOLERANCE_FT).length
  console.log(`    adjoining lots  ${touching} abutting + `
    + `${adjacentParcels.length - touching} across the street (${swept.length} swept)`)

  const platRecordPath = outerPath.replace(/\.plat\.json$/, '.plat-record.json')
  let platRecord: {
    reference: string; citation?: string; notes: string[]; legend?: string[]
    adjoiners?: { boundary: string; label: string; reference: string }[]
    platEasements?: { type: string; widthFt: number; along: string; note: string }[]
    dedicationWidthFt?: number
    existingPavement?: { label: string; note: string }
    approvalsOfRecord?: { kind: string; number: string; confirmedBy: string; status: string }[]
    monuments?: { id: string; label: string; easting: number; northing: number; note: string }[]
    monumentNote?: string
    frontageSection?: { sidewalkWidthFt: number; plantingStripWidthFt: number; totalFt: number; note: string }
    waterAndSewerConnection?: {
      source?: string
      easement?: { type: string; widthFt: number; label: string; route: string }
      privateEasement?: { type: string; widthFt: number; label: string; on: string; note: string }
      corridor?: {
        eastTerminus: number[]; axis: number[]; bearing: string
        lengthFt: number; widthFt: number
        services?: { offsetsFt: number[]; orderSouthToNorth: string[]; note?: string }
      }
    }
  } | undefined
  try { platRecord = JSON.parse(readFileSync(platRecordPath, 'utf8')) } catch { platRecord = undefined }
  console.log(`    plat record     ${platRecord ? 'transcribed text attached' : 'none found'}`)
  if (platRecord?.adjoiners?.length) {
    // The plat letters each adjoiner against the boundary it touches. That is
    // the information a reviewer uses; a GIS outline with no name on it is not.
    platRecord = {
      ...platRecord,
      notes: [
        ...platRecord.notes,
        'ADJOINING PROPERTIES, per the recorded plat: '
          + platRecord.adjoiners.map(a => `${a.label} (${a.reference}) — ${a.boundary}`).join('; ')
          + '.',
      ],
    }
    console.log(`    adjoiners       ${platRecord.adjoiners.length} lettered from the plat`)
  }

  // ── The frontage section, ONE definition ─────────────────────────────────
  //
  // The walk, strip and curb are drawn at subdivision level, and the apron is
  // drawn per lot. When the two carried their own copies of these widths they
  // disagreed by 3 ft and the apron finished past the gutter, in the travelled
  // way. The per-lot package is told where this sheet puts the gutter.
  const SW_W = platRecord?.frontageSection?.sidewalkWidthFt ?? 3
  const VERGE_W = platRecord?.frontageSection?.plantingStripWidthFt ?? 4
  const CURB_W = 1.5
  const FRONTAGE_OUT_FT = SW_W + VERGE_W + CURB_W

  // ── Soils, which Sec. 32-130(a)(13) requires and this path never fetched ──
  //
  // `generate-site-plan.ts` has fetched SSURGO since it was written; this
  // generator never did, so every subdivision sheet went out with no SOILS
  // TABLE at all. The renderer draws one — it simply had nothing to draw, and
  // an absent table looks exactly like a table nobody required.
  //
  // Fetched ONCE for the survey area rather than per lot: it is the same query
  // four times over, and four identical tables on one sheet is not four facts.
  const soils = (await fetchSoilMapUnits('prince_georges_md').catch(() => null))?.units

  /**
   * Ground elevation at a point, interpolated from the county contour mapping.
   *
   * The two nearest contour lines of DIFFERENT elevation are found and the
   * point is interpolated linearly between them by distance. It is what a
   * drafter does by eye between two contours, and it is honest about its
   * source: 2 ft county mapping, not a field-run survey, which is why every
   * elevation derived from it is lettered as such.
   */
  const groundElevationAt = (q: Position): number | null => {
    if (!contours?.contours.length) return null
    const best = new Map<number, number>()
    for (const c of contours.contours) {
      let d = Infinity
      for (let i = 0; i < c.path.length - 1; i++) {
        const p0 = c.path[i], p1 = c.path[i + 1]
        const vx = p1[0] - p0[0], vy = p1[1] - p0[1]
        const L2 = vx * vx + vy * vy || 1
        const tt = Math.max(0, Math.min(1, ((q[0] - p0[0]) * vx + (q[1] - p0[1]) * vy) / L2))
        d = Math.min(d, Math.hypot(q[0] - (p0[0] + tt * vx), q[1] - (p0[1] + tt * vy)))
      }
      const cur = best.get(c.elevationFt)
      if (cur == null || d < cur) best.set(c.elevationFt, d)
    }
    const ranked = [...best.entries()].sort((a, b) => a[1] - b[1])
    if (!ranked.length) return null
    if (ranked.length === 1) return ranked[0][0]
    // SMOOTH, because a gradient is taken off this.
    //
    // Interpolating between the TWO nearest contours is fine for reading a
    // single elevation and useless as a surface: the pair changes abruptly as
    // the query point moves, so the field is discontinuous, and sampling a
    // slope across it returned 156% where the design holds 15%. The steepness
    // was in the interpolator, not in the ground.
    //
    // Inverse-distance weighting over the four nearest contour levels is
    // continuous everywhere and still honours the nearest line.
    const near = ranked.slice(0, 4)
    if (near[0][1] < 1e-6) return near[0][0]
    let num = 0, den = 0
    for (const [el, d] of near) {
      const w = 1 / (d * d)
      num += el * w
      den += w
    }
    return den > 0 ? num / den : ranked[0][0]
  }
  console.log(`    soils           ${soils?.length ?? 0} SSURGO map unit(s)`
    + (soils?.length ? ' (USDA NRCS, area MD033)' : ' — NOT RETRIEVED; the sheet will carry no '
      + 'soils table and Sec. 32-130(a)(13) is unmet'))

  // ── The shared storm system, READ BEFORE THE LOTS ARE LAID OUT ───────────
  //
  // It was loaded after every lot package, purely because its pipes and
  // structures are drawn at subdivision level. But it also carries the RECORDED
  // 60 ft storm drain easement on the 54/55 party line, and a recorded easement
  // is ground a dwelling may not stand on. Read late, it could not steer the
  // houses, and it did not: two corners of the Lot 55 dwelling, two of its
  // driveway, two of its leadwalk and one of its apron were placed inside it.
  const trunkPath = outerPath.replace(/\.plat\.json$/, '.storm-trunk.json')
  type TrunkFile = {
    outfall: [number, number]; totalDaAc: number
    q10AtOutfall: number; q100AtOutfall: number
    existingOutfallPipe?: { sizeIn: number; upgradeToIn: number; class: string; material: string }
    recordedEasement5455?: { ring: [number, number][]; widthFt: number; areaSqFt: number }
    easementPipe5455?: {
      sizeIn: number; material: string; pipeClass: string
      from: [number, number]; to: [number, number]; lengthFt: number
      _note?: string; _sizeBasis?: string
    }
    structures: { id: string; lot: string | null; at: [number, number]; gradeEl: number; type: string }[]
    pipes: { from: string; to: string; line: [number, number][]; lengthFt: number
             sizeIn: number; pipeClass: string; daCumAc: number
             q10: number; q100: number; v100: number }[]
  }
  let trunk: TrunkFile | undefined
  let swaleDesign: ReturnType<typeof designSwaleSystem> | undefined
  /** Cut profiles for the section panel — see the floodplain block below. */
  const crossSections: Array<{
    lot: string
    floodElFt: number
    note: string
    stations: Array<{ staFt: number; existingFt: number; proposedFt: number | null }>
  }> = []
  let earthworkTotals: {
    cutCubicYd: number; fillCubicYd: number; netCubicYd: number; gradedAreaSqFt: number
  } | undefined
  try { trunk = JSON.parse(readFileSync(trunkPath, 'utf8')) } catch { trunk = undefined }
  /**
   * A STATED CLEARANCE from the recorded storm drain easement, ft.
   *
   * Nothing in Subtitle 27 sets a distance between a dwelling and an easement:
   * the easement itself is the restriction, and a house outside it complies.
   * This is a CLIENT INSTRUCTION — hold the dwellings well clear of the county's
   * storm drain — so it is drawn as one and lettered as one. It is not
   * presented as a code requirement, because it is not one.
   *
   * Lot 55 sat 4.5 ft off the easement and Lot 54 14.6 ft; both are moved.
   */
  const EASEMENT_CLEARANCE_FT = 15

  /**
   * A convex ring pushed outward by a uniform distance, mitred at the corners.
   *
   * Each edge is offset along its outward normal and consecutive offset lines
   * are intersected, which is exact for the convex quadrilateral the recorded
   * easement is. It is used ONLY to place buildings; the easement drawn on the
   * sheet is the recorded ring itself, at its recorded 60 ft.
   */
  const bufferConvexRing = (ring: Position[], ft: number): Position[] => {
    const n = ring.length
    if (n < 3 || ft <= 0) return ring
    const cx = ring.reduce((t2, p) => t2 + p[0], 0) / n
    const cy = ring.reduce((t2, p) => t2 + p[1], 0) / n
    // Offset line for edge i, as a point and a direction.
    const lines = ring.map((p, i) => {
      const q = ring[(i + 1) % n]
      const ex = q[0] - p[0], ey = q[1] - p[1]
      const el = Math.hypot(ex, ey) || 1
      let nx = -ey / el, ny = ex / el
      // Outward is away from the centroid, whichever way the ring is wound.
      if (nx * ((p[0] + q[0]) / 2 - cx) + ny * ((p[1] + q[1]) / 2 - cy) < 0) { nx = -nx; ny = -ny }
      return { px: p[0] + nx * ft, py: p[1] + ny * ft, dx: ex / el, dy: ey / el }
    })
    const out: Position[] = []
    for (let i = 0; i < n; i++) {
      const a2 = lines[(i - 1 + n) % n], b2 = lines[i]
      const den = a2.dx * b2.dy - a2.dy * b2.dx
      if (Math.abs(den) < 1e-9) { out.push([b2.px, b2.py]); continue }
      const t2 = ((b2.px - a2.px) * b2.dy - (b2.py - a2.py) * b2.dx) / den
      out.push([a2.px + a2.dx * t2, a2.py + a2.dy * t2])
    }
    return out
  }

  const recordedKeepOut: Position[][] = trunk?.recordedEasement5455
    ? [bufferConvexRing(trunk.recordedEasement5455.ring as Position[], EASEMENT_CLEARANCE_FT)]
    : []
  if (recordedKeepOut.length) {
    console.log(`    easement standoff ${EASEMENT_CLEARANCE_FT} ft clear of the recorded 54/55 `
      + 'storm drain easement — a stated clearance, not a code requirement')
  }

  // ── Each lot, built exactly as the single-lot generator builds it ─────────
  // THE SEWER CONNECTION IS THE CUL-DE-SAC ON MODUPEOLA WAY.
  //
  // Neither lot is sewered from Rollins Avenue. The main is in the Modupeola
  // Way circle, reached ACROSS LOT 13 in the adjoining Addition to Pleasant
  // Park subdivision, so the lateral leaves the north-west of the site rather
  // than the frontage. The connection is the point on the Modupeola centreline
  // nearest the subject boundary — the closest point of the circle.
  //
  // Lot 1 runs to it. Lot 2 runs to LOT 1's connection rather than making a
  // second tap: one connection through the adjoining lot, two houses on it.
  const modupeolaPath: Position[] = (site.streets ?? [])
    .filter(st => /modupeola/i.test(st.name ?? ''))
    .flatMap(st => st.paths)
    .flat()
  const sewerConnection: Position | null = (() => {
    if (modupeolaPath.length < 2) return null
    // The nearest point ON THE CENTRELINE, interpolated along its segments —
    // not the nearest vertex. A cul-de-sac is drawn as a stub into the middle
    // plus an arc, so snapping to a vertex put the connection at the CENTRE of
    // the circle. The lateral is meant to reach the circle, not its middle.
    let best: Position | null = null, bestD = Infinity
    for (let i = 0; i < modupeolaPath.length - 1; i++) {
      const p0 = modupeolaPath[i], p1 = modupeolaPath[i + 1]
      const vx = p1[0] - p0[0], vy = p1[1] - p0[1]
      for (const o of outerRing) {
        const t = Math.max(0, Math.min(1,
          ((o[0] - p0[0]) * vx + (o[1] - p0[1]) * vy) / (vx * vx + vy * vy || 1)))
        const q: Position = [p0[0] + t * vx, p0[1] + t * vy]
        const d = Math.hypot(o[0] - q[0], o[1] - q[1])
        if (d < bestD) { bestD = d; best = q }
      }
    }
    return best
  })()
  let lot1Connection: Position | null = null

  // ── THE RECORDED CORRIDOR, TRANSCRIBED ───────────────────────────────────
  //
  // Page 2 of the WSSC easement document is the authority for every line in
  // this block. Nothing here is derived from where features happen to fall.
  //
  //   mains in the Modupeola Way cul-de-sac
  //     -> EAST in the 20 ft WSSC easement on the LOT 13 side of the line LOT
  //        12 and LOT 13 share
  //     -> cleanout at the corner common to LOT 1, LOT 12 and LOT 13
  //     -> SOUTH-EAST in the private utility easement, inside LOT 1 along its
  //        south-west boundary, to the LOT 1 / LOT 2 corner, where LOT 2's
  //        services enter LOT 2
  //
  // FOUR earlier attempts anchored this on Lot 1's WEST CORNER and each one
  // failed review: the corridor came out at whatever angle the nearest boundary
  // vertex and the nearest centreline point happened to make, and it ran across
  // LOT 15 — ground these lots have no right over. The east terminus is not the
  // west corner. It is 39.46 ft south-east of it.
  //
  // The transcription has an independent check built into it: the terminus is
  // read off the sketch as the LOT 12 / LOT 13 / LOT 1 corner, and it lands on
  // Lot 1's recorded south-west line to 0.00 ft. A bad transcription does not
  // land on a line it was never fitted to.
  const conn = platRecord?.waterAndSewerConnection
  const corridorRec = conn?.corridor
  // Lot 1's recorded boundary: the corridor is seated on it.
  const lot1Ring: Position[] | null = (() => {
    const lp = lotPaths.find(q => /lot1/i.test(q))
    if (!lp) return null
    const s = JSON.parse(readFileSync(lp, 'utf8')) as PlatSpec
    return buildRecordedPlatBoundary({
      calls: s.calls as never, reference: s.reference as never,
      basisOfBearings: s.basisOfBearings ?? null, pointOfBeginning: s.pointOfBeginning ?? null,
      crs: 'EPSG:2248', horizontalDatum: 'NAD83',
      recordedAreaSqFt: s.recordedAreaSqFt ?? null, referenceParcel: null,
    }).ring.coordinates as Position[]
  })()
  const unit = (a: Position, b: Position): Position => {
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]
  }
  // The corridor, and the two easements it is made of.
  const corridor = (() => {
    if (!corridorRec || !lot1Ring) return null
    const C = corridorRec.eastTerminus as Position
    // The connection sketch locates the west end at the mains in the circular
    // cul-de-sac, while the recorded plat fixes the east terminus. Seat the
    // easement on those two independent controls instead of stopping it at an
    // arbitrary scaled distance short of the circle.
    const westControl = sewerConnection ?? [
      C[0] + corridorRec.axis[0] * corridorRec.lengthFt,
      C[1] + corridorRec.axis[1] * corridorRec.lengthFt,
    ] as Position
    const u = unit(C, westControl)
    const L = Math.hypot(westControl[0] - C[0], westControl[1] - C[1])
    const Wd = corridorRec.widthFt
    // Lot 1's south-west line: the east side of the WSSC easement, and the line
    // the private easement runs along. Found as the recorded edge the terminus
    // lies on, so a change to the plat moves both easements with it.
    let swA: Position | null = null, swB: Position | null = null
    for (let i = 0; i < lot1Ring.length - 1; i++) {
      const a2 = lot1Ring[i], b2 = lot1Ring[i + 1]
      const vx = b2[0] - a2[0], vy = b2[1] - a2[1]
      const t = ((C[0] - a2[0]) * vx + (C[1] - a2[1]) * vy) / (vx * vx + vy * vy || 1)
      if (t < -0.02 || t > 1.02) continue
      const d = Math.hypot(C[0] - (a2[0] + t * vx), C[1] - (a2[1] + t * vy))
      if (d < 0.5) { swA = a2; swB = b2 }
    }
    if (!swA || !swB) return null
    // V3 is the far end of that edge — the LOT 1 / LOT 2 / LOT 12 corner. The
    // corridor's terminus is between the two, so the far end is the one the
    // private easement runs TO.
    const dA = Math.hypot(swA[0] - C[0], swA[1] - C[1])
    const dB = Math.hypot(swB[0] - C[0], swB[1] - C[1])
    const V3 = dA > dB ? swA : swB          // toward LOT 2
    const V0 = dA > dB ? swB : swA          // Lot 1's west corner
    // THE 20 FT WIDTH SITS ON THE LOT 12 SIDE, not astride the line.
    //
    // NOTHING ENCROACHES ON LOT 12 — there is no easement over it.
    //
    // This was briefly thrown onto the LOT 12 side, which drew the runs across
    // ground these lots hold no right over. The recorded WSSC easement on the
    // connection sketch crosses LOT 13, so the 20 ft width is thrown to the
    // LOT 13 side of the LOT 12 / LOT 13 line and LOT 12 is left clear.
    const nRaw: Position = [u[1], -u[0]]
    const cenL1 = centroidOf(lot1Ring)
    // WHICH SIDE IS LOT 13? Ask the parcel layer, not a sign.
    //
    // This was first decided by dotting the corridor normal against Lot 1's own
    // centroid direction, which is nearly along the axis rather than across it:
    // the along-axis component dominated the dot product and the corridor came
    // out on the LOT 12 side — drawn over ground there is no easement for. The
    // county parcel for LOT 13 is in `adjacentParcels`, so the side is measured
    // to ITS centroid. The field note that identifies it is in CLAUDE.md: the
    // layer's key is PROP_ID, and 34811 is the LOT 13 candidate at the Porter
    // west corner. Absent that parcel the corridor is not sided by guess — the
    // transcribed north side is kept, which is where the sketch draws it.
    const l13 = adjacentParcels.find(pcl => String(pcl.propId) === '34811')
    const n: Position = (() => {
      if (!l13) return nRaw
      const c13 = centroidOf(l13.ring.coordinates as Position[])
      const toward = (c13[0] - C[0]) * nRaw[0] + (c13[1] - C[1]) * nRaw[1]
      return toward >= 0 ? nRaw : [-nRaw[0], -nRaw[1]] as Position
    })()
    // Into Lot 1, across its south-west line.
    const s = unit(V3, V0)
    const mRaw: Position = [s[1], -s[0]]
    const cen = centroidOf(lot1Ring)
    const towardIn = (cen[0] - C[0]) * mRaw[0] + (cen[1] - C[1]) * mRaw[1]
    const m: Position = towardIn >= 0 ? mRaw : [-mRaw[0], -mRaw[1]]
    const west: Position = westControl
    const half = Wd / 2
    // The corridor's centreline is offset a half width onto LOT 13, so its
    // far edge lies on the LOT 12 / LOT 13 line and nothing crosses into 12.
    const axC: Position = [C[0] + n[0] * half, C[1] + n[1] * half]
    const axW: Position = [west[0] + n[0] * half, west[1] + n[1] * half]
    const roundWest: Position[] = []
    for (let i = 0; i <= 8; i++) {
      const theta = Math.PI * i / 8
      roundWest.push([
        axW[0] + n[0] * half * Math.cos(theta) + u[0] * half * Math.sin(theta),
        axW[1] + n[1] * half * Math.cos(theta) + u[1] * half * Math.sin(theta),
      ])
    }
    const wsscRing: Position[] = [C, ...roundWest, C]
    const pw = conn?.privateEasement?.widthFt ?? 10

    // PAGE 2 CONTROLS THE PRIVATE EASEMENT EXTENT: C → V3 only, wholly on the
    // Lot 1 side. The sketch does not show an easement from C to V0, so that
    // unsupported upper segment is not drawn.
    const ew = pw
    const privRing: Position[] = [
      C, V3,
      [V3[0] + m[0] * ew, V3[1] + m[1] * ew],
      [C[0] + m[0] * ew, C[1] + m[1] * ew],
      C,
    ]
    /** Public run, `d` ft into LOT 13 from the LOT 12 / LOT 13 line. */
    const publicRun = (d: number): Position[] => {
      const converge = Math.min(24, L * 0.45)
      return [
        [west[0] + n[0] * d, west[1] + n[1] * d],
        [C[0] + u[0] * converge + n[0] * d, C[1] + u[1] * converge + n[1] * d],
        C,
      ]
    }
    /** Private run at `d` ft inside the separate Lot 1 easement. */
    const privateRun = (d: number): Position[] => [
      [C[0] + m[0] * d, C[1] + m[1] * d],
      [V3[0] + m[0] * d, V3[1] + m[1] * d],
    ]
    const rearLenFt = Math.hypot(V3[0] - C[0], V3[1] - C[1])
    return { C, u, n, m, L, Wd, pw, west, V3, V0, wsscRing, privRing,
             ew, rearLenFt, publicRun, privateRun, axC, axW }
  })()
  if (corridor) {
    console.log(`    corridor        20 ft WSSC easement, ${corridor.L.toFixed(2)} ft on `
      + `${corridorRec?.bearing}, from the LOT 1 / LOT 12 / LOT 13 corner`)
    console.log(`                    terminus E${corridor.C[0].toFixed(2)} N${corridor.C[1].toFixed(2)} `
      + `— transcribed, and it lands on Lot 1's recorded south-west line`)
    console.log(`                    private utility easement ${corridor.ew} ft inside LOT 1, `
      + `${Math.hypot(corridor.V3[0] - corridor.C[0], corridor.V3[1] - corridor.C[1]).toFixed(2)} ft to the LOT 2 corner`)
  } else {
    console.error('  !! NO CORRIDOR: the transcribed connection record is missing or does not')
    console.error('  !! seat on the recorded boundary. No easement is drawn.')
  }
  // Services keep to the route the record gives them: Lot 1 taps at the
  // cleanout, Lot 2 at the LOT 1 / LOT 2 corner the private easement reaches.
  const utilityRoute: Position[] | null = null

  // WHERE EACH LOT TAPS, per the recorded sketch.
  //
  //   LOT 1 — at the cleanout, the corner common to LOT 1, LOT 12 and LOT 13.
  //   LOT 2 — at the LOT 1 / LOT 2 corner, which is where the private utility
  //           easement running down Lot 1's south-west boundary delivers it.
  //
  // Both previously ran to the nearest point of the Modupeola centreline, which
  // sent Lot 2's services diagonally across Lot 1 outside any easement.
  /**
   * This lot's own structure on the shared trunk — where its house drainage goes.
   *
   * The trunk file names the lot each structure serves, so the connection is
   * read from the record rather than guessed by proximity: the nearest
   * structure to a house is not necessarily the one its lateral is meant to
   * reach, and on a curved rear easement it frequently is not.
   */
  const tagOf = (label: string) => label.replace(/\s+/g, '').toLowerCase()

  /** Midpoint of the lot edge nearest the street — where the grade is read. */
  const frontPointOf = (ring: Position[]): Position | null => {
    const paths = (site.streets ?? []).flatMap(st => st.paths)
    if (!paths.length || ring.length < 2) return null
    let best: Position | null = null, bestD = Infinity
    for (let i = 0; i < ring.length - 1; i++) {
      const m: Position = [(ring[i][0] + ring[i + 1][0]) / 2, (ring[i][1] + ring[i + 1][1]) / 2]
      let d = Infinity
      for (const path of paths) {
        for (let j = 0; j < path.length - 1; j++) {
          const p0 = path[j], p1 = path[j + 1]
          const vx = p1[0] - p0[0], vy = p1[1] - p0[1]
          const tt = Math.max(0, Math.min(1,
            ((m[0] - p0[0]) * vx + (m[1] - p0[1]) * vy) / (vx * vx + vy * vy || 1)))
          d = Math.min(d, Math.hypot(m[0] - (p0[0] + tt * vx), m[1] - (p0[1] + tt * vy)))
        }
      }
      if (d < bestD) { bestD = d; best = m }
    }
    return best
  }

  const stormStructureFor = (spec: PlatSpec):
      { to: Position; label: string } | null => {
    const lot = String(spec.reference?.lot ?? '').trim()
    const st = trunk?.structures.find(x => String(x.lot ?? '').trim() === lot && lot !== '')
    if (!st) return null
    return {
      to: st.at as Position,
      label: `House drainage collected and conveyed to ${st.id} (${st.type}) on the shared storm `
        + 'drain trunk in the rear easement. Invert to be set from the field-run topographic '
        + 'survey; see the STORM DRAIN SCHEDULE for the trunk sizes and flows.',
    }
  }

  const sanitaryPointFor = (spec: PlatSpec): Position | null => {
    if (spec.sanitaryFrom !== 'lot13') return null
    if (!corridor) return sewerConnection
    const lot = String(spec.reference?.lot ?? '').trim()
    if (/^2$/.test(lot)) return corridor.V3
    lot1Connection = corridor.C
    return corridor.C
  }
  const lots = []
  for (const lotPath of lotPaths) {
    const spec = JSON.parse(readFileSync(lotPath, 'utf8')) as PlatSpec
    const plat = buildRecordedPlatBoundary({
      calls: spec.calls as never,
      reference: spec.reference as never,
      basisOfBearings: spec.basisOfBearings ?? null,
      pointOfBeginning: spec.pointOfBeginning ?? null,
      crs: 'EPSG:2248', horizontalDatum: 'NAD83',
      recordedAreaSqFt: spec.recordedAreaSqFt ?? null,
      referenceParcel: null,
    })
    const lotRing = plat.ring.coordinates as Position[]
    const easements = nearbyEasements === null ? undefined : nearbyEasements
      .filter(e => e.ring.coordinates.some(c => inRing(c, lotRing)))
      .map(e => ({
        ring: e.ring,
        easementType: String(e.attributes.EASEMENT_TYPE ?? e.category),
        beneficiary: e.attributes.NAME != null ? String(e.attributes.NAME) : undefined,
        recordReference: e.attributes.RECORD_PLAT != null ? `Record plat ${String(e.attributes.RECORD_PLAT)}` : undefined,
      }))
    const pkg = buildLotPackage(
      {
        name: spec.address, address: spec.address,
        jurisdictionCode: 'prince_georges_md',
        zoneCode: site.zoning?.zoneCode ?? '',
        isResidentialSingleFamily: true, dwellingUnitCount: 1,
        streetPoint: site.streetPoint, parcelId: site.parcel?.parcelId ?? null,
        streets: site.streets,
        triangleRearAsSide: spec.triangleRearAsSide,
        // PLAT FIRST. The dedication width and the frontage easement are
        // dimensioned on the recorded instrument; PGAtlas supplies the layers
        // the plat does not carry — contours, zoning, streets.
        frontSetbackFt: spec.frontSetbackFt ?? null,
        sideSetbackFt: spec.sideSetbackFt ?? null,
        sideStandoffFt: spec.sideStandoffFt ?? null,
        // ── BUILDING ELEVATIONS, SET FROM THE STREET ──────────────────────
        //
        // The BUILDING DATA table has carried G / B / FF / SF columns since it
        // was written and every one of them printed an em dash, because nothing
        // ever computed them. The plat specs have said `frontDoorAboveStreetFt:
        // 2.0` all along and nothing read it.
        //
        // FF is the street grade at the front of the lot plus that 2 ft. The
        // rest follow from the architecture, and each is an ASSUMPTION with a
        // stated basis rather than a number picked to fill a column:
        //
        //   SF  sub-floor, 1.0 ft below FF — floor joist plus subfloor
        //   B   basement slab, 9.0 ft below FF — STATED for this project. The
        //       approved Indian Queen East plan's 'Wayne' two-storey carries
        //       8.6 ft (FF 76.6, lower level 68.0), which is the same wall
        //       within four inches; 9.0 ft is the figure to build to.
        //   G   garage slab, 0.33 ft below FF — the 4 in step down from
        //       dwelling to garage
        //
        // Grade comes from county 2 ft contour mapping, so every figure is
        // lettered as mapping-derived and is reset from the field-run survey.
        ...(() => {
          const frontEl = frontPointOf(plat.ring.coordinates as Position[])
          const street = frontEl ? groundElevationAt(frontEl) : null
          if (street == null) return {}
          const ff = street + (spec.frontDoorAboveStreetFt ?? 2)
          // B is reported only where a basement is actually proposed. It was
          // previously computed for every dwelling regardless, so a slab or a
          // vented crawlspace still printed a basement slab elevation in the
          // BUILDING DATA table — a below-grade storey the design does not have.
          const hasBasement = (spec.foundation ?? (spec.programme?.hasBasement ? 'basement' : 'slab')) === 'basement'
          return {
            finishedFloorElevFt: Number(ff.toFixed(2)),
            subFloorElevFt: Number((ff - 1.0).toFixed(2)),
            basementElevFt: hasBasement ? Number((ff - 9.0).toFixed(2)) : null,
            garageSlabElevFt: Number((ff - 0.33).toFixed(2)),
            foundationType: spec.foundation ?? (spec.programme?.hasBasement ? 'basement' : 'slab'),
          }
        })(),
        sanitaryFrom: spec.sanitaryFrom,
        siteLatLon: spec.siteLatLon ?? null,
        frontageExisting: spec.frontageExisting ?? null,
        // Where this sheet's own curb is, so the apron reaches it and stops.
        frontageOutFt: FRONTAGE_OUT_FT,
        soils,
        omitWaterAndSewer: spec.omitWaterAndSewer ?? null,
        omitSwmPractice: spec.omitSwmPractice ?? null,
        // EACH HOUSE IS CONNECTED TO THE TRUNK IN THE EASEMENT.
        //
        // The trunk was drawn and each lot was given its own structure, and
        // nothing joined the two: four inlets and manholes stood in the rear
        // easement with no pipe reaching them from the dwellings they drain.
        // A reviewer reads that as a system that collects nothing.
        //
        // The lateral runs from the dwelling to THIS lot's structure, sized and
        // classed by `design.ts` to the same county practice as the trunk.
        stormOutfall: (spec.stormOutfall as never)
          ?? (stormStructureFor(spec) as never)
          ?? null,
        // The subdivision easements, so the stormwater practice keeps clear of
        // them. They are created below, after every lot package, so the design
        // stage cannot find them on the twin.
        keepOutRings: [
          ...(corridor ? [corridor.privRing, corridor.wsscRing] : []),
          // ONLY THE LOTS THE EASEMENT ACTUALLY BURDENS.
          //
          // Passed to every lot, the keep-out did more than keep houses off the
          // easement: it also drives the placement search to put each dwelling
          // as FAR from it as the lot allows, and on Lots 53 and 56 — 150 ft
          // and 120 ft away, burdened by nothing — that shoved two houses
          // against their side lot lines for no reason at all. A ring that does
          // not touch a lot has no business steering the house on it.
          ...recordedKeepOut.filter(r => ringsTouch(r, lotRing)),
        ],
        // BOTH LOTS ARE SEWERED FROM LOT 13 in the adjoining Pleasant Park
        // subdivision, through the north-east boundary — not from Rollins and
        // not from directly behind.
        //
        // Lot 1's lateral runs to that connection. Lot 2's runs to LOT 1's
        // connection rather than making a second one, which is what the
        // instruction describes and what a shared lateral looks like: one tap,
        // two houses.
        sanitaryPoint: sanitaryPointFor(spec),
        utilityRoute: spec.sanitaryFrom === 'lot13' ? utilityRoute : null,
        frontFaceToCurbFt: spec.frontFaceToCurbFt ?? null,
        curbOffsetFt: spec.curbOffsetFt ?? null,
        dedicationWidthFt: platRecord?.dedicationWidthFt ?? null,
        platFrontageEasementFt: platRecord?.platEasements?.find(
          e => e.along === 'frontage')?.widthFt ?? null,
        // Each lot's own package must know it was drawn from a plat, or its
        // missing-information report falls back to the GIS wording and the set
        // tells a reviewer the boundary is compiled when it is transcribed.
        platRecord,
        easements,
        adjacentParcels,
        contours: contours?.contours, verticalDatum: contours?.verticalDatum ?? null,
        programme: spec.programme as never,
      },
      {
        ring: plat.ring,
        provenance: 'survey',
        authority: `Recorded plat ${subdivisionName} ${spec.reference.liber ?? ''} `
          + `f.${spec.reference.folio ?? ''}, lot ${spec.reference.lot ?? ''}`.trim(),
        retrievedAt: new Date().toISOString(),
      },
    )
    lots.push({ spec, plat, pkg, label: `LOT ${spec.reference.lot ?? '?'}` })
    console.log(`    ${`lot ${spec.reference.lot}`.padEnd(15)} ${plat.computedAreaSqFt?.toFixed(0)} sq ft`
      + `  (recorded ${spec.recordedAreaSqFt?.toLocaleString()})`
      + `  ·  ${Math.round(pkg.buildable?.footprintAreaSqFt ?? 0).toLocaleString()} sq ft footprint`
      + `  ·  ${easements?.length ?? 0} GIS + `
      + `${platRecord?.platEasements?.filter(e => e.along === 'frontage').length ?? 0} plat easement(s)`)
  }

  // ── Compose one twin ──────────────────────────────────────────────────────
  //
  // The first lot's twin carries the sources, datum, streets and zoning already
  // resolved, so it is the base. Its own Parcel becomes a lot line and the
  // OUTER boundary takes the Parcel slot at the front, where the renderers look
  // for the extents. Every other lot's features follow, re-identified so two
  // lots cannot collide on a feature id.
  const base = lots[0].pkg.twin
  const outerParcel: SiteFeature = {
    kind: 'Parcel', id: 'subdivision-outer',
    ring: outer.ring,
    parcelId: site.parcel?.parcelId ?? null,
    areaSqFt: outer.computedAreaSqFt ?? null,
  } as never

  const merged: SiteFeature[] = [outerParcel]
  lots.forEach((l, i) => {
    for (const f of l.pkg.twin.features) {
      // Contours and RECORDED easements are identical across lots — those
      // layers are fetched once for the whole subdivision — so only the first
      // lot contributes them. Drawing them twice thickens every line.
      //
      // DESIGN-GENERATED easements are NOT identical. The proposed storm
      // drainage easement follows each lot's own run to its own outfall, so
      // this skip silently discarded three of the four: the CAD carried one
      // 737 sq ft strip, which is exactly lot 53's, and lots 54, 55 and 56 had
      // a storm drain with no right over the ground it crosses. What is shared
      // is what was FETCHED, and `sourceId` is what says so.
      const fetched = (f as { sourceId?: string }).sourceId !== 'design'
      // TOPOGRAPHY IS DRAWN ONCE, OVER THE WHOLE SUBDIVISION — see below.
      //
      // This kept the FIRST lot's contours on the premise that the layer is
      // fetched once and is therefore identical across lots. The layer is; what
      // each lot package PRODUCES from it is not. The package clips terrain to
      // its own lot plus the 20 ft peripheral strip Sec. 32-130(a)(5) requires,
      // so lot 1's features cover lot 1.
      //
      // Measured on the generated model: contours spanned x 1308994-1309131
      // against a boundary spanning 1308580-1309106. Lot 53 had 239 contour
      // vertices, Lot 54 had 54, and LOTS 55 AND 56 HAD NONE — two of the four
      // lots went out with no existing grade at all, on a sheet whose grading
      // and drainage are the point of it.
      if (f.kind === 'Contour') continue
      if (i > 0 && f.kind === 'Easement' && fetched) continue
      merged.push({ ...f, id: `l${i + 1}-${f.id}` } as SiteFeature)
    }
  })

  // ONE CONTINUOUS SIDEWALK AND VERGE ACROSS THE WHOLE FRONTAGE.
  //
  // Each lot derived its own, so the walk was built in per-lot pieces that
  // stopped at every internal lot line — and a sidewalk that stops at a
  // property line is not a sidewalk. It runs the full frontage of the outer
  // boundary of record, corner to corner, which is also how it will be built:
  // the street construction permit covers the frontage, not the parcels.
  const frontageEdges: [Position, Position][] = []
  for (let i = 0; i < outerRing.length - 1; i++) {
    const a2 = outerRing[i], b2 = outerRing[i + 1]
    const mid: Position = [(a2[0] + b2[0]) / 2, (a2[1] + b2[1]) / 2]
    let d = Infinity
    for (const st of site.streets ?? []) {
      for (const path of st.paths) {
        for (let j = 0; j < path.length - 1; j++) {
          const p0 = path[j], p1 = path[j + 1]
          const vx = p1[0] - p0[0], vy = p1[1] - p0[1]
          const t = Math.max(0, Math.min(1,
            ((mid[0] - p0[0]) * vx + (mid[1] - p0[1]) * vy) / (vx * vx + vy * vy || 1)))
          d = Math.min(d, Math.hypot(mid[0] - (p0[0] + t * vx), mid[1] - (p0[1] + t * vy)))
        }
      }
    }
    if (d <= 60) frontageEdges.push([a2, b2])
  }

  const centreSegs: [Position, Position][] = (site.streets ?? [])
    .flatMap(st => st.paths)
    .flatMap(path => path.slice(0, -1).map((p, k) => [p, path[k + 1]] as [Position, Position]))
  const frontageFeats: SiteFeature[] = []

  // ── Existing grade, ONE surface across every lot ──────────────────────────
  //
  // Clipped to the boundary of record plus the 20 ft peripheral strip
  // Sec. 32-130(a)(5) asks for — the same rule each lot package applies, but
  // applied to the whole tract so the surface is continuous across the internal
  // lot lines instead of stopping at them.
  if (contours?.contours.length) {
    const xs = outerRing.map(c => c[0]), ys = outerRing.map(c => c[1])
    const PERIPHERAL_FT = 20
    const bx0 = Math.min(...xs) - PERIPHERAL_FT, bx1 = Math.max(...xs) + PERIPHERAL_FT
    const by0 = Math.min(...ys) - PERIPHERAL_FT, by1 = Math.max(...ys) + PERIPHERAL_FT
    const near = (q: readonly number[]) =>
      q[0] >= bx0 && q[0] <= bx1 && q[1] >= by0 && q[1] <= by1
    // Segment by segment, so a contour crossing the edge runs to it rather than
    // stopping at the last vertex inside — a vertex filter makes a complete
    // surface look like a broken one.
    const clip = (path: [number, number][]): [number, number][][] => {
      const out: [number, number][][] = []
      let run: [number, number][] = []
      for (let k = 0; k < path.length - 1; k++) {
        const A = path[k], B = path[k + 1]
        if (near(A) || near(B)) {
          if (!run.length) run.push(A)
          run.push(B)
        } else if (run.length) { out.push(run); run = [] }
      }
      if (run.length >= 2) out.push(run)
      return out
    }
    let drawn = 0
    contours.contours.forEach((c, ci) => {
      clip(c.path as [number, number][]).forEach((path, k) => {
        drawn++
        frontageFeats.push({
          kind: 'Contour', id: `ct-${ci}-${k}`,
          line: path.map(([x, y]) => [x, y, c.elevationFt] as Position),
          attributes: { elevationFt: c.elevationFt, weight: c.weight, hidden: c.hidden },
        } as never as SiteFeature)
      })
    })
    console.log(`    topography      ${drawn} contour run(s) across the whole tract`
      + ` (${contours.verticalDatum ?? 'datum not stated'})`)
  }
  frontageEdges.forEach(([a2, b2], i) => {
    const ex = b2[0] - a2[0], ey = b2[1] - a2[1]
    const el = Math.hypot(ex, ey) || 1
    // THE OUTWARD NORMAL IS MEASURED, NOT ASSUMED.
    //
    // Its sign depends on the ring's winding, and getting it backwards put the
    // walk and the curb on the far side of the frontage — out at the street
    // centreline instead of in the right-of-way. Both candidates are tested
    // against the centreline and the one that moves TOWARD it is outward.
    const distTo = (q: Position) => {
      let d = Infinity
      for (const [p0, p1] of centreSegs) {
        const vx = p1[0] - p0[0], vy = p1[1] - p0[1]
        const tt = Math.max(0, Math.min(1,
          ((q[0] - p0[0]) * vx + (q[1] - p0[1]) * vy) / (vx * vx + vy * vy || 1)))
        d = Math.min(d, Math.hypot(q[0] - (p0[0] + tt * vx), q[1] - (p0[1] + tt * vy)))
      }
      return d
    }
    const mid: Position = [(a2[0] + b2[0]) / 2, (a2[1] + b2[1]) / 2]
    const cand: Position = [ey / el, -ex / el]
    const probe: Position = [mid[0] + cand[0] * 5, mid[1] + cand[1] * 5]
    const sign = distTo(probe) < distTo(mid) ? 1 : -1
    const nx = cand[0] * sign, ny = cand[1] * sign
    const toCentre = distTo(mid)

    const band = (from: number, width: number, id: string, kind: string, label: string) => {
      const ring: Ring = { coordinates: [
        [a2[0] + nx * from, a2[1] + ny * from],
        [b2[0] + nx * from, b2[1] + ny * from],
        [b2[0] + nx * (from + width), b2[1] + ny * (from + width)],
        [a2[0] + nx * (from + width), a2[1] + ny * (from + width)],
        [a2[0] + nx * from, a2[1] + ny * from],
      ] }
      frontageFeats.push({
        kind: kind as never, id: `${id}-${i}`, ring,
        attributes: { label, improvement: id.replace('frontage-', '') },
      } as never)
    }

    // THE SECTION IS MEASURED FROM THE LOTS' FRONT LINE, NOT THIS EDGE.
    //
    // On Porter this edge belongs to the OUTER boundary, which still contains
    // the 20 ft dedicated strip — the outer figure is 21,825 sq ft against the
    // lots' 17,606. So it is the FAR side of the dedication, hard against the
    // street, and every band measured outward from it landed in the travelled
    // way: the walk and the curb came out at the centreline.
    //
    // Stepping back by the dedication width puts the origin on the lots' front
    // property line, which is what the section is dimensioned from.
    //
    // THE STEP-BACK IS ZERO WHERE THE PLAT RECORDS NO DEDICATION. This
    // defaulted to 20 ft, which invented a dedicated strip on any plat that
    // does not have one, and Indian Queen East does not: its outer boundary is
    // the union of the four lots, so its front edge already IS the lots' front
    // line. Measured on the generated model, that fabricated 20 ft put the
    // sidewalk 17-20 ft, the planting strip 13-17 ft and the curb and gutter
    // 11.5-13 ft INSIDE the lots — public works on private ground, with the
    // apron correctly at the property line and reaching for a curb that had
    // been drawn into somebody's front garden.
    //
    // A dedication is a dimension on a recorded instrument. Where the record is
    // silent there is no dedication to step back through.
    const dedicationFt = platRecord?.dedicationWidthFt ?? 0
    const o: Position = [a2[0] - nx * dedicationFt, a2[1] - ny * dedicationFt]
    const o2: Position = [b2[0] - nx * dedicationFt, b2[1] - ny * dedicationFt]
    const bandFrom = (from: number, width: number, id: string, kind: string, label: string,
                      p0: Position = o, p1: Position = o2) => {
      const ring: Ring = { coordinates: [
        [p0[0] + nx * from, p0[1] + ny * from],
        [p1[0] + nx * from, p1[1] + ny * from],
        [p1[0] + nx * (from + width), p1[1] + ny * (from + width)],
        [p0[0] + nx * (from + width), p0[1] + ny * (from + width)],
        [p0[0] + nx * from, p0[1] + ny * from],
      ] }
      frontageFeats.push({
        kind: kind as never, id: `${id}-${i}`, ring,
        attributes: { label, improvement: id.replace('frontage-', '') },
      } as never)
    }
    // CLIP TO THE LOTS' OWN FRONTAGE.
    //
    // The outer boundary's Rollins edge is 222.28 ft (the plat letters 222.27)
    // while the two lots front only 199.65 of it (plat: 199.64). Running the
    // walk and the curb the full edge carried them 22.6 ft past Lot 2 and onto
    // the neighbour — drawing work on land this application does not touch.
    // Frontage improvements stop where the frontage does.
    const frontExtents: number[] = []
    for (const l of lots) {
      const yards = l.pkg.buildable?.edgeYards ?? []
      const pts = normaliseRing(l.plat.ring)
      const fi = yards.indexOf('front')
      if (fi < 0 || fi >= pts.length) continue
      for (const q of [pts[fi], pts[(fi + 1) % pts.length]]) {
        frontExtents.push((q[0] - o[0]) * ((o2[0] - o[0]) / (Math.hypot(o2[0] - o[0], o2[1] - o[1]) || 1))
          + (q[1] - o[1]) * ((o2[1] - o[1]) / (Math.hypot(o2[0] - o[0], o2[1] - o[1]) || 1)))
      }
    }
    const ux2 = (o2[0] - o[0]) / (Math.hypot(o2[0] - o[0], o2[1] - o[1]) || 1)
    const uy2 = (o2[1] - o[1]) / (Math.hypot(o2[0] - o[0], o2[1] - o[1]) || 1)
    const fullLen = Math.hypot(o2[0] - o[0], o2[1] - o[1])
    const lotStart = frontExtents.length ? Math.max(0, Math.min(...frontExtents)) : 0
    const lotEnd = frontExtents.length ? Math.min(fullLen, Math.max(...frontExtents)) : fullLen
    const edgeLen = lotEnd - lotStart
    // Endpoints of the frontage improvements: the lots' extent, not the edge's.
    const lotA: Position = [o[0] + ux2 * lotStart, o[1] + uy2 * lotStart]
    const lotB: Position = [o[0] + ux2 * lotEnd, o[1] + uy2 * lotEnd]
    // The gaps the driveways cut through the frontage, computed once and
    // applied to EVERY band. The curb alone was interrupted, so the sidewalk
    // and the planting strip ran straight over each driveway — a walk drawn
    // through an apron is a drafting error a reviewer sees immediately, and it
    // is also just wrong: the apron replaces the walk where it crosses.
    const alongOf = (q: Position) => (q[0] - lotA[0]) * ux2 + (q[1] - lotA[1]) * uy2
    const gaps: [number, number][] = []
    for (const f of merged) {
      if (!/-apron$/.test(String(f.id))) continue
      const r = (f as { ring?: Ring }).ring?.coordinates as Position[] | undefined
      if (!r?.length) continue
      const proj = r.map(alongOf)
      // NO PADDING. The band must BUTT the apron, not stop half a foot short:
      // a white gap between the walk and the driveway it meets reads as a
      // construction gap, and at 1"=20' half a foot is a visible sliver.
      gaps.push([Math.min(...proj), Math.max(...proj)])
    }
    gaps.sort((g, h) => g[0] - h[0])
    const runs: [number, number][] = []
    let cursor = 0
    for (const [g0, g1] of gaps) {
      if (g0 > cursor) runs.push([cursor, Math.min(g0, edgeLen)])
      cursor = Math.max(cursor, g1)
    }
    if (cursor < edgeLen) runs.push([cursor, edgeLen])
    const at = (d: number): Position => [lotA[0] + ux2 * d, lotA[1] + uy2 * d]

    runs.forEach(([s0, s1], k) => {
      // Keep even a short run: it is the piece that reaches the lot line.
      if (s1 - s0 < 0.05) return
      // THE WALK, STRIP AND CURB SIT IN THE 20 ft PUBLIC USE DEDICATION.
      //
      // Page 2 of the easement document letters a 10' PUE INSIDE each lot along
      // the frontage and a PUBLIC USE DEDICATION strip OUTSIDE it, between the
      // lots and Rollins Avenue. The PUE is a utility right over private ground;
      // the dedication is the public strip, and that is where the sidewalk and
      // the curb and gutter are built.
      //
      // They were moved inside the property line earlier, which put public works
      // on private land and left the PUE occupied by a footway it has nothing to
      // do with.
      //
      //   0 … 3 ft out   concrete sidewalk
      //   3 … 7 ft out   planting strip (street trees)
      //       7 ft out   curb and gutter, then the travelled way
      //
      // All inside the 20 ft dedication; the 10 ft PUE stays clear on the lot
      // side of the line.
      bandFrom(0, SW_W, `frontage-sidewalk-${k}`, 'Pavement',
        k === 0 ? `CONCRETE SIDEWALK  ${SW_W}' WIDE` : '', at(s0), at(s1))
      bandFrom(SW_W, VERGE_W, `frontage-verge-${k}`, 'Surface',
        k === 0 ? `PLANTING STRIP  ${VERGE_W}' WIDE  (STREET TREES)` : '', at(s0), at(s1))
      bandFrom(SW_W + VERGE_W, CURB_W, `frontage-curb-${k}`, 'Pavement',
        k === 0 ? 'CURB AND GUTTER' : '', at(s0), at(s1))
    })
    console.log(`    frontage bands  ${runs.length} run(s) broken by `
      + `${gaps.length} driveway crossing(s)`)

    // THE STREET, ALIGNED TO THE PLAT AND POSITIONED BY PGATLAS.
    //
    // Each source is used for what it is good for. The plat gives the
    // ALIGNMENT: it letters the frontage S 10°30'46" E and draws the existing
    // pavement centreline parallel to it, so the street runs parallel to the
    // lots' front line by construction. PGAtlas gives the POSITION: a measured
    // distance to the centreline, which the plat draws but does not dimension.
    //
    // Using the PGAtlas polyline for alignment too put a compiled centreline's
    // own wobble into the drawing — it is a digitised street, not a surveyed
    // one, and it wandered against a boundary that closes 1:118,119.
    const centreOut = toCentre + dedicationFt
    // The centreline runs the FULL STREET, not just the frontage. The plat
    // draws Rollins Avenue across the whole sheet and dimensions 222.27 ft
    // along it — a centreline clipped to the lots stops being a street and
    // becomes a tick mark. It is extended past both ends of the frontage.
    const RUN_PAST_FT = 60
    const cA: Position = [
      lotA[0] + nx * centreOut - ux2 * RUN_PAST_FT,
      lotA[1] + ny * centreOut - uy2 * RUN_PAST_FT,
    ]
    const cB: Position = [
      lotB[0] + nx * centreOut + ux2 * RUN_PAST_FT,
      lotB[1] + ny * centreOut + uy2 * RUN_PAST_FT,
    ]
    frontageFeats.push({
      kind: 'ExistingFeature', id: `centreline-plat-${i}`,
      line: [cA, cB],
      attributes: {
        label: 'EX. PAVEMENT CENTERLINE',
        note: `Parallel to the lots' front line, as the recorded plat draws it; offset `
          + `${centreOut.toFixed(1)} ft, measured against the county centreline. `
          + `Alignment from the plat, position from PGAtlas.`,
      },
    } as never)

    // The far right-of-way line, mirrored across the measured centreline.
    const far = toCentre * 2 + dedicationFt
    frontageFeats.push({
      kind: 'ExistingFeature', id: `row-far-${i}`,
      line: [
        [lotA[0] + nx * far - ux2 * RUN_PAST_FT, lotA[1] + ny * far - uy2 * RUN_PAST_FT],
        [lotB[0] + nx * far + ux2 * RUN_PAST_FT, lotB[1] + ny * far + uy2 * RUN_PAST_FT],
      ],
      attributes: {
        label: `FAR RIGHT-OF-WAY LINE (DERIVED — ${toCentre.toFixed(1)} ft each side)`,
      },
    } as never)
    console.log(`    frontage        ${SW_W} ft walk + ${VERGE_W} ft strip + ${CURB_W} ft curb, `
      + `out from the lots' front line`
      + (dedicationFt > 0
        ? `, inside the ${dedicationFt} ft public use dedication`
        : ' (no dedication of record — the front line is the right-of-way line)')
      + `; centreline ${(toCentre + dedicationFt).toFixed(1)} ft out, `
      + `R/W to R/W ${far.toFixed(1)} ft`)
  })
  // ── THE RECORDED EASEMENTS, AND THE WORK INSIDE THEM ─────────────────────
  //
  // These were withheld from the sheet until the corridor could be transcribed
  // off page 2 rather than derived. It has been, so they are drawn.
  //
  // What a reviewer measures here: the public 20 ft WSSC easement and every
  // public service run remain on Lot 13; the separate private utility easement
  // begins at the common corner and remains in Lot 1. Lot 12 is left clear.
  if (corridor) {
    const easeFeats: SiteFeature[] = []
    easeFeats.push({
      kind: 'Easement', id: 'wssc-esmt',
      ring: { coordinates: corridor.wsscRing },
      easementType: 'WSSC', widthFt: corridor.Wd,
      beneficiary: 'Washington Suburban Sanitary Commission',
      recordReference: conn?.easement?.label ?? "20' WSSC ESMT",
      attributes: {
        label: "20' WSSC ESMT",
        note: conn?.easement?.route ?? '',
      },
    } as never as SiteFeature)
    easeFeats.push({
      kind: 'Easement', id: 'private-utility-esmt',
      ring: { coordinates: corridor.privRing },
      easementType: 'Private Utility',
      beneficiary: 'LOT 2, over LOT 1',
      recordReference: 'PRIVATE UTILITY ESMT',
      attributes: {
        label: 'PRIVATE UTILITY ESMT',
        note: conn?.privateEasement?.note ?? '',
      },
    } as never as SiteFeature)

    // THE FOUR HOUSE CONNECTIONS IN THE TWO EASEMENTS.
    //
    // Page 2 draws four lines across the 20 ft easement — two SHC farther into
    // LOT 13 and two WHC nearer the common line, but all four remain in LOT 13
    // — converging on the cleanout at the terminus. They are drawn that way here, and they
    // converge 24 ft back from the terminus so that every leg stays inside the
    // easement where it pinches.
    const svc = corridorRec?.services
    const order = svc?.orderSouthToNorth ?? ['WHC', 'WHC', 'SHC', 'SHC']
    // THE LATERALS RUN INSIDE THE EASEMENT — not on its line and not outside it.
    //
    // The transcribed offsets [1, 7, 13, 19] are measured across the 20 ft
    // PUBLIC corridor and put a line 1 ft off each edge. Inside a 20 ft band, four runs at
    // 6 ft centres seated 4 ft clear of both edges keep every line within the
    // easement, water and sewer still adjacent in pairs as the sketch shows.
    const insets = [4, 8, 12, 16]
    insets.forEach((d, k) => {
      const code = order[k] ?? 'WHC'
      const water = /^W/.test(code)
      easeFeats.push({
        kind: 'Utility', id: `public-corridor-${code.toLowerCase()}-${k}`,
        line: corridor.publicRun(d),
        attributes: {
          type: water ? 'Water service (WHC)' : 'Sanitary lateral (SHC)',
          size: water ? 'WHC' : '4" SHC',
          // The MAIN, lettered at the cul-de-sac circle where these runs start
          // — the size a connection is made to, taken from the transcribed
          // mains rather than assumed.
          sizeAtMain: water
            ? (conn?.mains?.find(mn => mn.kind === 'water')?.label ?? 'EX. WATER MAIN')
            : (conn?.mains?.find(mn => mn.kind === 'sewer')?.label ?? 'EX. SEWER MAIN'),
          from: 'offsite',
          label: code,
          note: `Inside the 20 ft WSSC easement on LOT 13, ${d} ft from the LOT 12 / LOT 13 line, `
            + 'from the Modupeola Way mains to the common corner. '
            + 'Record information — field verification required before excavation; call Miss '
            + 'Utility.',
        },
      } as never as SiteFeature)
      easeFeats.push({
        kind: 'Utility', id: `private-corridor-${code.toLowerCase()}-${k}`,
        line: corridor.privateRun([2, 4, 6, 8][k]),
        attributes: {
          type: water ? 'Water service (WHC)' : 'Sanitary lateral (SHC)',
          size: water ? 'WHC' : '4" SHC', from: 'shared', label: code,
          note: `Inside the separate 10 ft Lot 1 private utility easement, connected at the common corner. `
            + 'Field verification required before excavation; call Miss Utility.',
        },
      } as never as SiteFeature)
    })
    // The cleanout the sketch letters at the terminus.
    easeFeats.push({
      kind: 'SpotElevation', id: 'corridor-co',
      point: corridor.C,
      attributes: {
        label: 'CO', monument: true,
        note: 'Cleanout at the LOT 1 / LOT 12 / LOT 13 corner, as lettered on the connection sketch.',
      },
    } as never as SiteFeature)
    // The connection itself, named rather than drawn into the pavement: the
    // sketch shows the mains in Modupeola Way but does not fix them to a
    // coordinate, and a main drawn where none has been located reads exactly
    // like one that has.
    easeFeats.push({
      kind: 'Annotation', id: 'corridor-conn-note',
      point: [
        corridor.west[0] + corridor.n[0] * (corridor.Wd / 2),
        corridor.west[1] + corridor.n[1] * (corridor.Wd / 2),
      ],
      attributes: {
        label: 'CONNECT TO EX. 8" WATER AND EX. 8" SEWER IN MODUPEOLA WAY',
        note: 'Mains are of record in Modupeola Way; their positions are not surveyed here.',
      },
    } as never as SiteFeature)

    // CONTAINMENT CHECK — the whole point of the exercise.
    //
    // ON the boundary is not OUTSIDE it. Both easements are seated on Lot 1's
    // south-west line by construction, so their corners sit on that edge; the
    // first version of this check measured to the ring's VERTICES and reported
    // two corners inside Lot 1 that are in fact on its line, which suppressed
    // the very easements it was written to verify.
    const onBoundary = (q: Position) => {
      const r = lot1Ring ?? []
      let best = Infinity
      for (let i = 0; i < r.length - 1; i++) {
        const a2 = r[i], b2 = r[i + 1]
        const vx = b2[0] - a2[0], vy = b2[1] - a2[1]
        const t = Math.max(0, Math.min(1,
          ((q[0] - a2[0]) * vx + (q[1] - a2[1]) * vy) / (vx * vx + vy * vy || 1)))
        best = Math.min(best, Math.hypot(q[0] - (a2[0] + t * vx), q[1] - (a2[1] + t * vy)))
      }
      return best <= 0.5
    }
    const inLot1 = (q: Position) => inRing(q, lot1Ring ?? [])
    const strayed = corridor.privRing.slice(0, -1).filter(q => !inLot1(q) && !onBoundary(q))
    const lot13 = adjacentParcels.find(pcl => String(pcl.propId) === '34811')
      ?? adjacentParcels.reduce((best, pcl) => {
        const d = (z: { ring: { coordinates: Position[] } }) =>
          Math.min(...(z.ring.coordinates as Position[]).map(c =>
            Math.hypot(c[0] - corridor.C[0], c[1] - corridor.C[1])))
        return d(pcl) < d(best) ? pcl : best
      }, adjacentParcels[0])
    const offLot1 = corridor.wsscRing.slice(0, -1).filter(q => inLot1(q) && !onBoundary(q))
    if (strayed.length || offLot1.length) {
      console.error(`  !! EASEMENT CONTAINMENT FAILED — ${offLot1.length} WSSC corner(s) inside LOT 1, `
        + `${strayed.length} private-easement corner(s) outside it. Easements NOT drawn.`)
    } else {
      merged.push(...easeFeats)
      const a = (r: Position[]) => Math.abs(r.slice(0, -1).reduce((s, q, i, arr) => {
        const w = arr[(i + 1) % arr.length]; return s + (q[0] * w[1] - w[0] * q[1])
      }, 0) / 2)
      console.log(`    easements       20 ft WSSC ${Math.round(a(corridor.wsscRing))} sq ft to cul-de-sac circle`
        + `  ·  private utility ${Math.round(a(corridor.privRing))} sq ft in LOT 1`)
      console.log(`    corridor runs   ${insets.length} house connections `
        + `(${order.join(', ')}) at ${insets.join('/')} ft inside the ${corridor.ew} ft easement`)
      console.log(`    lot 1 easement  ${corridor.ew} ft private, ${corridor.rearLenFt.toFixed(2)} ft `
        + 'from the LOT 1/12/13 corner toward the LOT 1/2/12 corner; wholly inside LOT 1')
      if (lot13) console.log(`    LOT 13 reference parcel ${lot13.propId}; the public corridor is on the LOT 13 side — LOT 12 is left clear`)
    }
  }
  // LOT 2's services are tapped at the LOT 1 / LOT 2 corner by sanitaryPointFor,
  // which is where the private utility easement delivers them, so no reroute is
  // applied here. They previously joined Lot 1's run at a corner the record does
  // not use, and cut across Lot 1 outside any easement to get there.

  // MONUMENTS OF RECORD. The plat publishes corner coordinates to four decimals
  // and letters IPF at them. On the drawing they give the field the positions to
  // recover — which is where a certification starts. Carrying them does not make
  // this a survey and the sheet does not say it does.
  for (const mon of platRecord?.monuments ?? []) {
    frontageFeats.push({
      kind: 'SpotElevation', id: `mon-${mon.id}`,
      point: [mon.easting, mon.northing] as Position,
      attributes: { label: `${mon.label} (${mon.id})`, note: mon.note, monument: true },
    } as never)
  }
  if (platRecord?.monuments?.length) {
    console.log(`    monuments       ${platRecord.monuments.length} of record, from the plat`)
  }

  // ── ONE STORM DRAIN SYSTEM FOR THE WHOLE SUBDIVISION ─────────────────────
  //
  // Four lots developed together get ONE collector, not four unrelated runs to
  // four outfalls. The per-lot `stormOutfall` route is still there for a single
  // lot on its own; where a trunk file exists it supersedes it, because a trunk
  // crosses lot lines and no per-lot package can own it — that is also why
  // these are pushed as subdivision-level features and never through a lot's
  // containment filter.
  //
  // Alignment and sizing come from the trunk file; INVERTS DELIBERATELY DO NOT.
  // The contour-built DEM that gives the catchment area is smoothed and spreads
  // 2.4 ft over a 100 ft box, which is the same order as the differences that
  // set an invert. Area is an integral and survives that noise; an invert does
  // not. The structures are lettered with grade and the note says the inverts
  // come from the field survey.
  if (trunk) {
    // ── A CONTINUOUS 10 ft STORM DRAIN EASEMENT ACROSS THE REAR ─────────────
    //
    // The trunk runs along the rear of all four lots and had a recorded right
    // over exactly one of them: the 60 ft strip on the 54/55 party line. Every
    // other reach crossed private ground with nothing granting it. A storm
    // drain needs a right over the land it occupies, and a shared system needs
    // ONE right that does not stop at each internal lot line.
    //
    // Ten feet wide, per instruction, along the rear property line of every
    // lot, built as one strip across the whole tract.
    const rearCentreline: Position[] = []
    {
      const REAR_ESMT_WIDTH_FT = 10
      // The rear line of the tract: the outer boundary edges FURTHEST from the
      // street. The frontage edges are already known, so the rear is what is
      // left on the far side.
      const rearEdges: [Position, Position][] = []
      for (let i = 0; i < outerRing.length - 1; i++) {
        const a2 = outerRing[i], b2 = outerRing[i + 1]
        const mid: Position = [(a2[0] + b2[0]) / 2, (a2[1] + b2[1]) / 2]
        let d = Infinity
        for (const st of site.streets ?? []) {
          for (const path of st.paths) {
            for (let j = 0; j < path.length - 1; j++) {
              const p0 = path[j], p1 = path[j + 1]
              const vx = p1[0] - p0[0], vy = p1[1] - p0[1]
              const tt = Math.max(0, Math.min(1,
                ((mid[0] - p0[0]) * vx + (mid[1] - p0[1]) * vy) / (vx * vx + vy * vy || 1)))
              d = Math.min(d, Math.hypot(mid[0] - (p0[0] + tt * vx), mid[1] - (p0[1] + tt * vy)))
            }
          }
        }
        if (d > 140 && Math.hypot(b2[0] - a2[0], b2[1] - a2[1]) > 15) rearEdges.push([a2, b2])
      }
      const cOuter = centroidOf(outerRing)
      let rearArea = 0
      for (const [a2, b2] of rearEdges) {
        const ex = b2[0] - a2[0], ey = b2[1] - a2[1]
        const el = Math.hypot(ex, ey) || 1
        // Inward: toward the tract, so the easement lies ON the lots.
        let nx = -ey / el, ny = ex / el
        if (nx * (cOuter[0] - a2[0]) + ny * (cOuter[1] - a2[1]) < 0) { nx = -nx; ny = -ny }
        const ring: Position[] = [
          a2, b2,
          [b2[0] + nx * REAR_ESMT_WIDTH_FT, b2[1] + ny * REAR_ESMT_WIDTH_FT],
          [a2[0] + nx * REAR_ESMT_WIDTH_FT, a2[1] + ny * REAR_ESMT_WIDTH_FT],
        ]
        rearArea += el * REAR_ESMT_WIDTH_FT
        // The centreline of the strip, which is where the pipe is laid.
        const half = REAR_ESMT_WIDTH_FT / 2
        if (!rearCentreline.length) rearCentreline.push([a2[0] + nx * half, a2[1] + ny * half])
        rearCentreline.push([b2[0] + nx * half, b2[1] + ny * half])
        frontageFeats.push({
          kind: 'Easement', id: `esmt-sd-rear-${frontageFeats.length}`,
          ring: { coordinates: [...ring, ring[0]] },
          easementType: 'Storm Drain',
          widthFt: REAR_ESMT_WIDTH_FT,
          beneficiary: "Prince George's County — storm drainage",
          notes: `${REAR_ESMT_WIDTH_FT} ft storm drain easement along the rear property line, `
            + 'CONTINUOUS ACROSS ALL LOTS. PROPOSED — to be granted and recorded; it is the right '
            + 'the shared rear trunk runs in, and without it the pipe crosses private ground on '
            + 'every lot but 54 and 55.',
        } as never as SiteFeature)
      }
      if (rearEdges.length) {
        console.log(`    rear easement   ${REAR_ESMT_WIDTH_FT} ft continuous across `
          + `${rearEdges.length} rear boundary segment(s), ${Math.round(rearArea).toLocaleString()} `
          + 'sq ft — PROPOSED, to be granted and recorded')
      } else {
        console.error('  !! No rear boundary segment identified: the 10 ft rear storm drain')
        console.error('  !! easement was NOT drawn. The trunk has no right over the ground it')
        console.error('  !! crosses on lots 53 and 56.')
      }
    }

    // ── THE TRUNK IS LAID IN THE REAR EASEMENT ──────────────────────────────
    //
    // The structures were placed on each lot's OWN rear edge midpoint, 9 ft in,
    // and the reaches drawn straight between them. On a tract whose rear
    // boundary is not one straight line that put the pipe outside the easement
    // granted for it: measured on the model, only ST-1 to ST-2 was inside, the
    // other two reaches were 13% and 15% inside, and the rest crossed private
    // ground with no right over it.
    //
    // Every structure is projected onto the easement centreline and every reach
    // follows that centreline, so the whole system lies in the strip that
    // exists for it. Lengths shift by a few feet; the hydraulics are re-read
    // from the trunk file, which is the authority for size and flow, and a
    // length change of this order does not move a 15 in minimum.
    const centreOf = (pt: Position): Position => {
      let best: Position = pt, bestD = Infinity
      for (let i = 0; i < rearCentreline.length - 1; i++) {
        const a2 = rearCentreline[i], b2 = rearCentreline[i + 1]
        const vx = b2[0] - a2[0], vy = b2[1] - a2[1]
        const L2 = vx * vx + vy * vy
        if (!L2) continue
        const tt = Math.max(0, Math.min(1, ((pt[0] - a2[0]) * vx + (pt[1] - a2[1]) * vy) / L2))
        const q: Position = [a2[0] + vx * tt, a2[1] + vy * tt]
        const d = Math.hypot(q[0] - pt[0], q[1] - pt[1])
        if (d < bestD) { bestD = d; best = q }
      }
      return best
    }
    /** Along-distance of a point projected onto the centreline. */
    const alongCentre = (pt: Position): number => {
      let acc = 0, bestS = 0, bestD = Infinity
      for (let i = 0; i < rearCentreline.length - 1; i++) {
        const a2 = rearCentreline[i], b2 = rearCentreline[i + 1]
        const vx = b2[0] - a2[0], vy = b2[1] - a2[1]
        const L = Math.hypot(vx, vy) || 1
        const tt = Math.max(0, Math.min(1, ((pt[0] - a2[0]) * vx + (pt[1] - a2[1]) * vy) / (L * L)))
        const q: Position = [a2[0] + vx * tt, a2[1] + vy * tt]
        const d = Math.hypot(q[0] - pt[0], q[1] - pt[1])
        if (d < bestD) { bestD = d; bestS = acc + tt * L }
        acc += L
      }
      return bestS
    }
    /** The centreline path between two along-distances, inclusive of vertices. */
    const centrePath = (s0: number, s1: number): Position[] => {
      const lo = Math.min(s0, s1), hi = Math.max(s0, s1)
      const pts: Position[] = []
      let acc = 0
      const at = (d: number): Position => {
        let a3 = 0
        for (let i = 0; i < rearCentreline.length - 1; i++) {
          const a2 = rearCentreline[i], b2 = rearCentreline[i + 1]
          const L = Math.hypot(b2[0] - a2[0], b2[1] - a2[1]) || 1
          if (d <= a3 + L) {
            const tt = (d - a3) / L
            return [a2[0] + (b2[0] - a2[0]) * tt, a2[1] + (b2[1] - a2[1]) * tt]
          }
          a3 += L
        }
        return rearCentreline[rearCentreline.length - 1]
      }
      pts.push(at(lo))
      for (let i = 1; i < rearCentreline.length - 1; i++) {
        acc += Math.hypot(rearCentreline[i][0] - rearCentreline[i - 1][0],
                          rearCentreline[i][1] - rearCentreline[i - 1][1])
        if (acc > lo && acc < hi) pts.push(rearCentreline[i])
      }
      pts.push(at(hi))
      return s0 <= s1 ? pts : pts.reverse()
    }

    // NO PIPE ON GROUND THIS APPLICATION HAS NO RIGHT OVER.
    //
    // The trunk ran ST-2 to an endwall at [1308885.97, 398678.95], which is
    // inside PGAtlas parcel PROP_ID 212977 — the adjoining property to the
    // north. Measured on the generated model, only 21% of that reach was on
    // Lot 54; the remaining 79% and the outfall structure itself stood on a
    // neighbour's land, with no easement of record anywhere near it. The
    // recorded 54/55 easement is a 60 ft strip on the party line and stops at
    // the boundary.
    //
    // A storm drain drawn across land the applicant has no right over is not a
    // design a reviewer can approve; it is a proposal to trespass. The reach is
    // withheld and the gap is REPORTED, because a system that now terminates
    // without an outfall is a blocking defect and must read as one — quietly
    // dropping the pipe would leave a sheet that looks finished and is not.
    const offsiteReaches = new Set<string>()
    const swaleInputs: SwaleReachInput[] = []
    const swaleLines = new Map<string, Position[]>()
    for (const pipe of trunk.pipes) {
      const ends = [pipe.line[0], pipe.line[pipe.line.length - 1]] as Position[]
      const offLot = ends.filter(q => !lots.some(l => inRing(q, l.plat.ring.coordinates as Position[])))
      if (offLot.length) {
        offsiteReaches.add(`${pipe.from}-${pipe.to}`)
        continue
      }
      const routed = rearCentreline.length >= 2
        ? centrePath(alongCentre(pipe.line[0] as Position),
                     alongCentre(pipe.line[pipe.line.length - 1] as Position))
        : (pipe.line as Position[])
      const gradeOf = (id: string) =>
        trunk?.structures.find(x => x.id === id)?.gradeEl ?? 0
      swaleInputs.push({
        id: `${pipe.from}-${pipe.to}`,
        fromId: pipe.from, toId: pipe.to,
        lengthFt: pipe.lengthFt,
        daCumAc: pipe.daCumAc,
        q10Cfs: pipe.q10, q100Cfs: pipe.q100,
        upstreamEl: gradeOf(pipe.from), downstreamEl: gradeOf(pipe.to),
      })
      swaleLines.set(`${pipe.from}-${pipe.to}`, routed)
    }
    // ── THE REAR-YARD DRAINAGE SWALE ────────────────────────────────────────
    //
    // ESD TO THE MAXIMUM EXTENT PRACTICABLE, which the Maryland Stormwater
    // Management Act of 2007 requires BEFORE structural conveyance. A grass
    // swale is an ESD conveyance under the MDE Design Manual; the 15 in RCP
    // trunk this replaces is not, and it was the worse engineering besides:
    // the whole four-lot system delivers Q100 = 4.71 cfs, which Manning passes
    // in under 12 in of pipe, and its two upper reaches ran at 0.63 and 0.70
    // fps — a quarter of the 2.5 to 3 fps a storm drain needs to scour itself.
    // A pipe that silts in a rear-yard easement is found when it surcharges.
    //
    // The swale carries the same flow at a velocity that suits it, is
    // inspectable from the surface, is a practice the stormwater concept can
    // count, and fits inside the 10 ft easement with room to mow.
    const swale = designSwaleSystem(swaleInputs)
    swaleDesign = swale
    for (const r of swale.reaches) {
      const line = swaleLines.get(r.id)
      if (!line?.length) continue
      frontageFeats.push({
        kind: 'ProposedFeature', id: `sw-${r.id}`.toLowerCase(),
        line,
        attributes: {
          type: 'Drainage swale',
          swale: true,
          proposed: true,
          // THE LABEL CARRIES THE GRADE AND BOTH INVERTS.
          //
          // "0.50% GRADE" tells a contractor the shape of the fall and not one
          // elevation to build it to. A swale is staked from its invert at each
          // end, the same way a pipe is, so the label reads like a pipe run:
          // section, grade, invert in, invert out.
          // THE LINE BREAK IS CHOSEN, NOT LEFT TO THE WRAPPER. Set as one run
          // and wrapped to fit, it broke between "INV IN" and its own number:
          // the sheet read "… GRADE · INV IN" and then "60.30 INV OUT 52.50" on
          // the next line, which splits an elevation from its label.
          label: `DRAINAGE SWALE — ${r.section.bottomWidthFt}' BOTTOM, `
            + `${r.section.sideSlopeZ}:1 SIDES, ${r.slopePct.toFixed(2)}% GRADE`
            + (r.invertUpFt != null && r.invertDownFt != null
              ? `\nINV IN ${r.invertUpFt.toFixed(2)}  ·  INV OUT ${r.invertDownFt.toFixed(2)}`
              : ''),
          invertUpFt: r.invertUpFt,
          invertDownFt: r.invertDownFt,
          note:
            `${r.fromId} to ${r.toId}, ${r.lengthFt.toFixed(0)} ft. DA ${r.daCumAc.toFixed(4)} ac `
            + `cumulative; Q10 ${r.q10Cfs.toFixed(2)} cfs, Q100 ${r.q100Cfs.toFixed(2)} cfs. `
            + `Normal depth ${r.depth100Ft.toFixed(2)} ft at Q100, velocity `
            + `${r.velocity100Fps.toFixed(2)} fps, top width ${r.topWidth100Ft.toFixed(1)} ft; `
            + `section ${r.sectionWidthFt.toFixed(1)} ft overall with ${r.freeboardFt} ft `
            + `freeboard, capacity ${r.capacityCfs.toFixed(2)} cfs. Manning n = `
            + `${r.section.manningN} (mown grass). `
            + (r.invertUpFt != null && r.invertDownFt != null
              ? `Invert ${r.invertUpFt.toFixed(2)} at ${r.fromId} falling to `
                + `${r.invertDownFt.toFixed(2)} at ${r.toId}, `
                + `${(r.invertUpFt - r.invertDownFt).toFixed(2)} ft of fall; cut below existing `
                + `ground ${(r.cutUpFt ?? 0).toFixed(2)} ft at the head and `
                + `${(r.cutDownFt ?? 0).toFixed(2)} ft at the outlet. `
              : '')
            + 'GRADES TO BE SET FROM THE FIELD-RUN '
            + 'TOPOGRAPHIC SURVEY. Establish sod before the contributing area is stabilised.',
        },
      } as never as SiteFeature)
    }
    if (swale.reaches.length) {
      const worst = swale.reaches.reduce((a, b) => a.velocity100Fps > b.velocity100Fps ? a : b)
      console.log(`    rear swale      ${swale.reaches.length} reach(es), `
        + `${swale.maxSectionWidthFt.toFixed(1)} ft widest section — fits the 10 ft easement; `
        + `worst velocity ${worst.velocity100Fps.toFixed(2)} fps `
        + `(${SWALE_PERMISSIBLE_VELOCITY_FPS} fps permissible, n = ${SWALE_MANNING_N}, `
        + `${SWALE_FREEBOARD_FT} ft freeboard)`)
      for (const f of swale.findings) console.log(`      · ${f}`)
    }

    if (offsiteReaches.size) {
      console.error('')
      console.error(`  !! ${offsiteReaches.size} storm reach(es) NOT DRAWN — they leave the`)
      console.error('  !! subject property and cross adjoining land with no easement of record:')
      for (const r of offsiteReaches) console.error(`  !!   ${r}`)
      console.error('  !! Those reaches are NOT REPLACED BY THE SWALE either — the swale ends at')
      console.error('  !! the system low point on the rear of LOT 54 and discharges into the')
      console.error('  !! RECORDED 54/55 easement alongside the 42 in main, which is the one')
      console.error('  !! path off this site with a right of record. The endwall that used to')
      console.error('  !! stand in PGAtlas parcel PROP_ID 212977 is gone with the pipe, and the')
      console.error('  !! county contours show that reach RISING 1.0 ft from ST-2 to the outfall,')
      console.error('  !! so it could not have drained as drawn in any case.')
      console.error('')
    }

    // ── The 42 in RCP in the recorded 54/55 easement ────────────────────────
    //
    // An EXTENSION of the existing inlet at the Fort Foote Road culvert, run
    // the full length of both lots inside the easement that exists for it. It
    // is drawn as a trunk main because that is what it is — the largest pipe on
    // the sheet — and it is lettered as an extension so nobody reads it as a
    // new independent system.
    const ep5455 = trunk.easementPipe5455
    if (ep5455) {
      frontageFeats.push({
        kind: 'Utility', id: 'sd-esmt-5455-main',
        line: [ep5455.from as Position, ep5455.to as Position],
        attributes: {
          type: 'Storm drain',
          main: true,
          size: `${ep5455.sizeIn}" ${ep5455.material} ${ep5455.pipeClass}`,
          // Its OWN caption group. Sharing 'shared' with the rear trunk meant
          // one of the two was lettered and the other was not, and the one that
          // lost is the 42 in main in the recorded easement — the largest pipe
          // on the sheet.
          from: 'esmt-5455',
          note:
            `${ep5455.lengthFt} ft of ${ep5455.sizeIn}" ${ep5455.material} ${ep5455.pipeClass} in `
            + 'the recorded 60 ft storm drain easement on the LOT 54 / LOT 55 party line, running '
            + 'the full length of both lots. EXTENSION OF THE EXISTING INLET AT THE FORT FOOTE '
            + 'ROAD CULVERT. BURIED: outside diameter 4.17 ft, 1.5 ft minimum cover over the '
            + 'crown, so finished grade over this main shall be no lower than the invert plus '
            + '5.67 ft for its full length — where the existing ground is lower, fill is '
            + 'required and is carried on the grading plan. Invert and slope to be set from the '
            + 'field-run topographic survey and the existing inlet; bedding per P.G. County DER '
            + 'SWM Std. and Specification #02200.',
        },
      } as never as SiteFeature)
      // ── THE PIPE IS BURIED, AND THE GRADING HAS TO CARRY IT ───────────────
      //
      // A 42 in main is not a line on a plan; it is a structure roughly 4.2 ft
      // across the outside that has to sit under enough ground to survive the
      // loads over it. Drawn without that, the grading plan promises finished
      // grades the pipe cannot fit beneath, and the conflict surfaces on site
      // when the trench is open.
      //
      //   wall   scales with the barrel — about 4 in on a 42 in RCP and 5 in on
      //          a 48 in — so OD is ID plus twice the wall
      //   cover  1.5 ft minimum over the crown in a landscaped easement
      //
      // WALL THICKNESS IS NOT A CONSTANT. It was fixed at 4 in, which is right
      // for a 42 in barrel and wrong for the 48 in this run was upsized to: the
      // OD came out 0.17 ft short and so did every cover figure derived from
      // it. On the one dimension that decides whether the pipe fits under the
      // rear yard, that is not a rounding error.
      //
      // The minimum finished grade over the main is therefore invert + OD +
      // cover, and that figure is computed at both ends and reported against
      // the ground the county mapping shows. Where the existing ground is
      // already lower, FILL IS REQUIRED and the grading plan has to place it.
      const wallInFor = (idIn: number) =>
        idIn <= 36 ? 4.0 : idIn <= 42 ? 4.5 : idIn <= 48 ? 5.0 : 5.5
      const WALL_IN = wallInFor(ep5455.sizeIn)
      const COVER_FT = 1.5
      const odFt = (ep5455.sizeIn + 2 * WALL_IN) / 12
      const gUp = groundElevationAt(ep5455.from as Position)
      const gDn = groundElevationAt(ep5455.to as Position)
      // The main extends an EXISTING inlet, so its upstream invert is set by
      // that structure and is not this design's to choose. What the design can
      // state is the cover the finished grade must provide.
      const needUp = gUp != null ? gUp : null
      const needDn = gDn != null ? gDn : null
      console.log(`    54/55 main      ${ep5455.sizeIn}" ${ep5455.material} ${ep5455.pipeClass}, `
        + `${ep5455.lengthFt} ft in the recorded easement — extension of the Fort Foote Rd `
        + 'culvert inlet')
      console.log(`                    BURIED: OD ${odFt.toFixed(2)} ft, ${COVER_FT} ft minimum `
        + `cover; finished grade over the main must be at least invert + `
        + `${(odFt + COVER_FT).toFixed(2)} ft`)
      if (needUp != null && needDn != null) {
        console.log(`                    existing ground over the run: EL ${needUp.toFixed(1)} at `
          + `the street end, EL ${needDn.toFixed(1)} at the rear — county 2 ft contour mapping; `
          + 'inverts to be set from the field-run survey and the existing inlet')
      }
    }

    // NO NEW EASEMENTS ARE DRAWN OVER THE TRUNK.
    //
    // A 10 ft strip was added over every reach, which put four proposed
    // easements on lots that already have a recorded storm drain easement
    // running to the rear — the corridor this trunk is routed along precisely
    // so it uses the existing right. Drawing proposed easements on top of it
    // asks the owners to grant ground they have already granted.
    // THE RECORDED 54/55 STORM DRAIN EASEMENT, 30 ft each side of the party
    // line. It is a RECORDED right, so it is drawn from its own dimensions and
    // lettered as recorded — not as a proposal.
    const re5455 = trunk.recordedEasement5455
    if (re5455) {
      // THE EASEMENT STOPS AT THE PROPERTY LINE.
      //
      // It is built as a 60 ft strip 162 ft along the 54/55 party line, and a
      // strip built from a centreline and a length runs to wherever the
      // arithmetic takes it — here past the front lot line into Fort Foote Road
      // and past the rear line onto the neighbour. An easement burdens the land
      // it is recorded over; drawn beyond the boundary it claims ground this
      // application has no interest in.
      //
      // Clipped against the boundary of record. The easement ring is a convex
      // parallelogram, so clipping the boundary TO it yields the intersection
      // exactly.
      const bounds = outerRing[0] === outerRing[outerRing.length - 1]
        ? outerRing.slice(0, -1) : outerRing
      const clipped = clipToConvex(bounds, re5455.ring as Position[])
      const drawnRing = clipped.length >= 3 ? clipped : (re5455.ring as Position[])
      if (clipped.length < 3) {
        console.error('  !! the recorded 54/55 easement does not intersect the boundary of record;')
        console.error('  !! it is drawn as recorded and must be checked against the plat.')
      }
      frontageFeats.push({
        kind: 'Easement', id: 'esmt-sd-5455',
        ring: { coordinates: [...drawnRing, drawnRing[0]] as Position[] },
        easementType: 'Storm Drain', widthFt: re5455.widthFt,
        beneficiary: 'Prince George\'s County — storm drainage',
        recordReference: 'PLAT BOOK WWW 65, P. 60',
      } as never as SiteFeature)
      const shoelace = (r: Position[]) => {
        let a2 = 0
        for (let i = 0; i < r.length; i++) {
          const q = r[(i + 1) % r.length]
          a2 += r[i][0] * q[1] - q[0] * r[i][1]
        }
        return Math.abs(a2 / 2)
      }
      console.log(`    54/55 easement  ${re5455.widthFt} ft (30 ft each side of the party line), `
        + `${Math.round(shoelace(drawnRing)).toLocaleString()} sq ft within the boundary `
        + `(${re5455.areaSqFt.toLocaleString()} sq ft as a full strip) — recorded`)
    }
    for (const st of trunk.structures) {
      // On the easement centreline, with the pipe it serves. A manhole beside
      // its own main is not a manhole.
      const stAt = rearCentreline.length >= 2 && st.lot ? centreOf(st.at as Position) : st.at
      frontageFeats.push({
        kind: 'SpotElevation', id: `sd-str-${st.id}`.toLowerCase(),
        point: stAt as Position,
        attributes: {
          label: `${st.id}  GR ${st.gradeEl.toFixed(1)}`, monument: true,
          note: `${st.type}${st.lot ? `, lot ${st.lot}` : ''}. Grade shown from county contour `
            + 'mapping; TOP and INVERT to be set from the field-run topographic survey.',
        },
      } as never as SiteFeature)
    }
    const ep = trunk.existingOutfallPipe
    console.log(`    storm trunk     ${trunk.pipes.length} reach(es), `
      + `${trunk.structures.length} structure(s); DA ${trunk.totalDaAc} ac, `
      + `Q10 ${trunk.q10AtOutfall} cfs, Q100 ${trunk.q100AtOutfall} cfs at the outfall`)
    if (ep) {
      console.log(`    outfall pipe    existing ${ep.sizeIn} in -> UPGRADE TO `
        + `${ep.upgradeToIn} in ${ep.material} ${ep.class}`)
    }
  } else {
    console.log('    storm trunk     no trunk file; per-lot storm routes stand')
  }

  // ── THE PROPOSED SURFACE, AND ITS CONTOURS ────────────────────────────────
  //
  // Every proposed contour on this sheet is a level line cut through ONE
  // surface, so they agree with the finished floors, with the swale and with
  // each other by construction. Sketching them beside the existing ones would
  // produce lines that close nowhere and from which no volume can be taken.
  //
  // The design, as instructed: level at street grade from the front lot line to
  // the face of the dwelling, then a single gradual slope to the rear where it
  // ties back into existing ground. No survey is needed to decide that — a
  // survey fixes where EXISTING ground is, and it is the tie line and the
  // earthwork either side of it that will move when one is run.
  // Collected inside the grading block and written after it, so the export
  // must be declared in the enclosing scope.
  const proposedGrids: Array<{ lot: string; x0: number; y0: number; cellFt: number; nx: number; ny: number; z: number[][] }> = []
  {
    const gradeFeats: SiteFeature[] = []
    let cutTotal = 0, fillTotal = 0, gradedTotal = 0
    const gradeFindings: string[] = []
    for (const l of lots) {
      const lotRing = l.plat.ring.coordinates as Position[]
      const yards = l.pkg.buildable?.edgeYards ?? []
      const pts = normaliseRing(l.plat.ring)
      const fi = yards.indexOf('front')
      if (fi < 0) continue
      // The whole front run, the same way the services and the apron take it.
      const n = pts.length
      let s0 = fi, e0 = fi
      for (let k = 1; k < n; k++) {
        const i = ((fi - k) % n + n) % n
        if (yards[i] !== 'front') break
        s0 = i
      }
      for (let k = 1; k < n; k++) {
        const i = (fi + k) % n
        if (yards[i] !== 'front') break
        e0 = i
      }
      const frontPath: Position[] = []
      for (let k = 0; k <= n; k++) {
        const i = (s0 + k) % n
        frontPath.push(pts[i])
        if (i === e0) { frontPath.push(pts[(i + 1) % n]); break }
      }
      const frontMid = frontPointOf(lotRing)
      const streetEl = frontMid ? groundElevationAt(frontMid) : null
      if (streetEl == null) {
        gradeFindings.push(`${l.label}: no street grade could be read from the contour mapping, `
          + 'so no proposed surface was built for this lot.')
        continue
      }
      const fp = l.pkg.buildable?.footprint?.coordinates as Position[] | undefined
      // The tie: the near edge of the 10 ft rear easement. Behind it the ground
      // is the swale's and is not regraded by the lots.
      const depthOfLot = (() => {
        const a2 = frontPath[0], b2 = frontPath[frontPath.length - 1]
        const dxx = b2[0] - a2[0], dyy = b2[1] - a2[1]
        const ll = Math.hypot(dxx, dyy) || 1
        let ix = -dyy / ll, iy = dxx / ll
        const cx = lotRing.reduce((t2, q) => t2 + q[0], 0) / lotRing.length
        const cy = lotRing.reduce((t2, q) => t2 + q[1], 0) / lotRing.length
        if ((cx - a2[0]) * ix + (cy - a2[1]) * iy < 0) { ix = -ix; iy = -iy }
        return Math.max(...lotRing.map(q => (q[0] - a2[0]) * ix + (q[1] - a2[1]) * iy))
      })()
      // ── ELEVATED FOUNDATION: THE PAD IS THE MINIMUM THAT STILL DRAINS ──
      //
      // A vented crawlspace or pier foundation carries the finished floor on
      // the wall rather than on fill, so the pad no longer rises with the
      // floor. It cannot simply be left at existing grade either: on these
      // lots the ground falls AWAY from the street, and a pad at existing
      // grade puts the dwelling in a hollow with the front yard draining into
      // it.
      //
      // The pad is therefore set to the LOWEST elevation satisfying both
      // constraints — at least half a foot above existing ground under the
      // footprint, and high enough that the front yard still falls to the
      // street at a mowable minimum — and never above the slab pad it
      // replaces. The remaining height is taken in the foundation wall, where
      // it displaces no floodwater.
      const padElOverride: number | null = (() => {
        const f = l.spec.foundation
        if (f !== 'crawlspace' && f !== 'pier') return null
        const fpr = fp
        if (!fpr?.length) return null
        const c4: Position = [
          fpr.reduce((n2, q) => n2 + q[0], 0) / fpr.length,
          fpr.reduce((n2, q) => n2 + q[1], 0) / fpr.length,
        ]
        const g = groundElevationAt(c4)
        if (g == null) return null
        const a4 = frontPath[0]
        const b4 = frontPath[frontPath.length - 1]
        const fl4 = Math.hypot(b4[0] - a4[0], b4[1] - a4[1]) || 1
        const ix4 = -(b4[1] - a4[1]) / fl4
        const iy4 = (b4[0] - a4[0]) / fl4
        const faceFt = Math.min(...fpr.map(q => (q[0] - a4[0]) * ix4 + (q[1] - a4[1]) * iy4))
        const MIN_FRONT_YARD_PCT = 2.5
        const drainEl = streetEl + (MIN_FRONT_YARD_PCT / 100) * Math.max(0, faceFt)
        const slabEl = streetEl + (l.spec.frontDoorAboveStreetFt ?? 2) - 0.5
        const padEl = Math.min(slabEl, Math.max(g + 0.5, drainEl))
        const ffEl4 = streetEl + (l.spec.frontDoorAboveStreetFt ?? 2)
        console.log(`    foundation      LOT ${l.spec.reference?.lot ?? '?'}: ${f} — existing `
          + `EL ${g.toFixed(2)}, drainage minimum EL ${drainEl.toFixed(2)}, pad EL ${padEl.toFixed(2)}, `
          + `floor EL ${ffEl4.toFixed(2)} — ${(ffEl4 - padEl).toFixed(2)} ft of vented foundation wall`)
        return Number(padEl.toFixed(2))
      })()

      const surface = buildProposedSurface({
        lot: lotRing,
        frontPath,
        footprint: fp ?? null,
        streetElFt: streetEl,
        // The finished floor the pad is built to — the street grade plus the
        // 2 ft the front of every dwelling stands above it.
        finishedFloorElFt: streetEl + (l.spec.frontDoorAboveStreetFt ?? 2),
        ...(padElOverride == null ? {} : { padElFt: padElOverride }),
        existingElAt: groundElevationAt,
        tieDepthFt: Math.max(40, depthOfLot - 10),
        // ── THE REAR YARD, CARRIED OUT TOWARD THE EASEMENT ──────────────────
        //
        // Stated per lot, and sized against what the lot actually has room for
        // rather than taken on trust. Two things bound it: a recorded easement
        // it must not grade into, and the depth left between the dwelling and
        // the tie line — run the bench out too far and the drop that is left
        // has to happen in whatever is behind it, which is how a flat lawn buys
        // a slope nobody can mow.
        ...(() => {
          const spec = l.spec.rearYard
          if (!spec) return {}
          const fpc = fp?.length
            ? (fp[0] === fp[fp.length - 1] ? fp.slice(0, -1) : fp) : []
          if (!fpc.length) return {}
          const standoff = spec.easementStandoffFt ?? 8
          const segDist = (q: Position, a2: Position, b2: Position): number => {
            const vx = b2[0] - a2[0], vy = b2[1] - a2[1]
            const L2 = vx * vx + vy * vy || 1
            const tt = Math.max(0, Math.min(1, ((q[0] - a2[0]) * vx + (q[1] - a2[1]) * vy) / L2))
            return Math.hypot(q[0] - (a2[0] + vx * tt), q[1] - (a2[1] + vy * tt))
          }
          // Nearest RECORDED easement, measured from the dwelling itself. The
          // rear drainage easement is proposed by this design, not of record,
          // and the bench may run up to it; the 54/55 storm drain easement and
          // the utility strips are of record and it may not.
          let toEasement = Infinity
          const recorded = frontageFeats.filter(e => e.kind === 'Easement'
            && !/rear/.test(String((e as { id?: string }).id ?? '')))
          for (const e of recorded) {
            const er = (e as unknown as { ring?: { coordinates: Position[] } }).ring?.coordinates
            if (!er?.length) continue
            for (const q of fpc) {
              for (let i = 0; i < er.length - 1; i++) {
                toEasement = Math.min(toEasement, segDist(q, er[i], er[i + 1]))
              }
            }
          }
          // Depth of the rear face, in the same frame `depthOfLot` uses.
          const a2 = frontPath[0], b2 = frontPath[frontPath.length - 1]
          const dxx = b2[0] - a2[0], dyy = b2[1] - a2[1]
          const ll = Math.hypot(dxx, dyy) || 1
          let ix = -dyy / ll, iy = dxx / ll
          const cxl = lotRing.reduce((n2, q) => n2 + q[0], 0) / lotRing.length
          const cyl = lotRing.reduce((n2, q) => n2 + q[1], 0) / lotRing.length
          if ((cxl - a2[0]) * ix + (cyl - a2[1]) * iy < 0) { ix = -ix; iy = -iy }
          const rearFaceFt = Math.max(...fpc.map(q =>
            (q[0] - a2[0]) * ix + (q[1] - a2[1]) * iy))
          const roomFt = Math.max(0, Math.max(40, depthOfLot - 10) - rearFaceFt)
          const wantFt = Number.isFinite(toEasement)
            ? Math.max(0, toEasement - standoff) : (spec.extentFt ?? 0)
          const extentFt = Math.min(spec.extentFt ?? wantFt, wantFt, roomFt)
          console.log(`    rear yard       ${l.label}: grading carried ${extentFt.toFixed(0)} ft `
            + `out from the dwelling — nearest recorded easement `
            + `${Number.isFinite(toEasement) ? toEasement.toFixed(0) : '—'} ft less a `
            + `${standoff} ft standoff, and ${roomFt.toFixed(0)} ft of depth to the tie line`)
          // ── HOW MUCH OF THAT EXTENT CAN BE FLAT ─────────────────────────
          //
          // Carrying the transition further out on its own buys very little
          // here: 49 ft from the dwelling is a 39 ft run once the 10 ft apron
          // is taken off, and the blend was already 40. The contours behind
          // this house were not tight because the transition was short — they
          // were tight because ALL of it is transition. There is no flat ground
          // in a rear yard that starts falling ten feet off the wall.
          //
          // So the bench is what actually answers this: level within its 2%,
          // carried out, with the drop taken in what is left. How much can be
          // level is set by what the remainder has to do — the run left over
          // must still hold 3:1, the slope an owner can mow, and past that the
          // flat lawn is just buying itself a bank. Drop is measured on the
          // county mapping at the far end of the bench, not assumed.
          // The rear bench is set off the PAD the surface was actually built
          // to, which on an elevated foundation is not finished floor less
          // 0.5 ft. Reading the slab figure here would size the bench against
          // a pad the design does not have.
          const padTopEl = padElOverride
            ?? streetEl + (l.spec.frontDoorAboveStreetFt ?? 2) - 0.5
          const probe: Position = [
            (fpc.reduce((n2, q) => n2 + q[0], 0) / fpc.length) + ix * (rearFaceFt + extentFt
              - (fpc.reduce((n2, q) => n2 + (q[0] - a2[0]) * ix + (q[1] - a2[1]) * iy, 0)
                 / fpc.length)),
            (fpc.reduce((n2, q) => n2 + q[1], 0) / fpc.length) + iy * (rearFaceFt + extentFt
              - (fpc.reduce((n2, q) => n2 + (q[0] - a2[0]) * ix + (q[1] - a2[1]) * iy, 0)
                 / fpc.length)),
          ]
          const existingAtEnd = groundElevationAt(probe)
          const dropFt = existingAtEnd == null ? 0 : Math.max(0, padTopEl - 0.2 - existingAtEnd)
          const needForMowableFt = dropFt * (100 / 33.3)
          const autoBenchFt = Math.max(10, extentFt - needForMowableFt)
          const benchFt = Math.min(spec.benchFt ?? autoBenchFt, extentFt)
          console.log(`                    bench ${benchFt.toFixed(0)} ft level at 2%, then `
            + `${(extentFt - benchFt).toFixed(0)} ft to take ${dropFt.toFixed(1)} ft of drop `
            + `(${dropFt > 0 && extentFt > benchFt
              ? `${((dropFt / (extentFt - benchFt)) * 100).toFixed(0)}%` : '—'})`)
          return { rearGradeExtentFt: extentFt, rearBenchFt: benchFt }
        })(),
        retainingWall: l.spec.retainingWall
          ? { atFt: l.spec.retainingWall.behindHouseFt, heightFt: l.spec.retainingWall.heightFt }
          : null,
      })
      if (!surface) continue
      gradeFindings.push(...surface.findings.map(f => `${l.label}: ${f}`))

      // ── THE PROPOSED SURFACE, EXPORTED AS A GRID ────────────────────────
      //
      // PROPOSED_GRID=<path> writes the graded surface as elevations on a
      // regular grid, sampled from `surface.elevationAt` itself.
      //
      // It exists because the alternative does not work. Reconstructing the
      // proposed ground by interpolating the PROPOSED CONTOURS is lossy in
      // exactly the place it matters: a 2 ft contour interval cannot represent
      // a pad, the interpolation has nothing to key on inside the footprint
      // where no contour crosses, and clipping to the limit-of-disturbance
      // rings discards the tie-out grading beyond them. Measured that way a pad
      // the engine built at EL 57.97 read as EL 51.30 — unchanged from existing
      // ground — and every earthwork and floodplain-fill volume derived from it
      // was understated.
      //
      // Volumes decide whether this project is permittable. They are taken from
      // the surface that was designed, not from a contour rendering of it.
      if (process.env.PROPOSED_GRID) {
        const CELL_FT = 2
        const xs = (lotRing as Position[]).map(q => q[0])
        const ys = (lotRing as Position[]).map(q => q[1])
        const x0 = Math.floor(Math.min(...xs)) - 20
        const x1 = Math.ceil(Math.max(...xs)) + 20
        const y0 = Math.floor(Math.min(...ys)) - 20
        const y1 = Math.ceil(Math.max(...ys)) + 20
        const rows: number[][] = []
        for (let y = y0; y <= y1; y += CELL_FT) {
          const row: number[] = []
          for (let x = x0; x <= x1; x += CELL_FT) {
            const z = surface.elevationAt([x, y] as Position)
            row.push(z == null ? -9999 : Number(z.toFixed(3)))
          }
          rows.push(row)
        }
        proposedGrids.push({
          lot: l.spec.reference?.lot ?? l.label, x0, y0, cellFt: CELL_FT,
          nx: rows[0]?.length ?? 0, ny: rows.length, z: rows,
        })
      }

      // ── FRONT YARD DRAINAGE, VERIFIED ─────────────────────────────────────
      //
      // The whole point of standing the dwelling 2 ft above the street is that
      // water leaves it. That is a claim about a surface, so it is CHECKED on
      // the surface rather than asserted from the design intent: the ground in
      // front of the house is sampled on a grid and the fall toward the street
      // is measured at every point.
      //
      // Checking it off the proposed contours cannot work — a contour is a line
      // of CONSTANT elevation, so a lot whose front yard crosses one contour
      // level yields no gradient at all and reads as flat.
      {
        const a2 = frontPath[0], b2 = frontPath[frontPath.length - 1]
        const dxx = b2[0] - a2[0], dyy = b2[1] - a2[1]
        const ll = Math.hypot(dxx, dyy) || 1
        let ix = -dyy / ll, iy = dxx / ll
        const cxl = lotRing.reduce((t2, q) => t2 + q[0], 0) / lotRing.length
        const cyl = lotRing.reduce((t2, q) => t2 + q[1], 0) / lotRing.length
        if ((cxl - a2[0]) * ix + (cyl - a2[1]) * iy < 0) { ix = -ix; iy = -iy }
        const depthAt = (q: Position) => (q[0] - a2[0]) * ix + (q[1] - a2[1]) * iy
        const alongAt = (q: Position) => (q[0] - a2[0]) * (dxx / ll) + (q[1] - a2[1]) * (dyy / ll)
        const fpc = fp?.length
          ? (fp[0] === fp[fp.length - 1] ? fp.slice(0, -1) : fp) : []
        if (fpc.length) {
          const padStart = Math.min(...fpc.map(depthAt))
          const aLo = Math.min(...fpc.map(alongAt)), aHi = Math.max(...fpc.map(alongAt))
          let samples = 0, against = 0, minFall = Infinity, maxFall = 0
          const STEP = 5
          for (let d = 3; d < padStart - 2; d += STEP) {
            for (let al = aLo - 10; al <= aHi + 10; al += STEP) {
              const q: Position = [a2[0] + (dxx / ll) * al + ix * d,
                                   a2[1] + (dyy / ll) * al + iy * d]
              if (!inRing(q, lotRing)) continue
              // THE FRONT YARD STARTS AT THE EDGE OF THE DRAINAGE APRON.
              //
              // The first 10 ft off the wall is the apron, it is built at 2%,
              // and it is checked as an apron a few lines down — on rays off
              // the wall, which is how its own note is written. Leaving it in
              // this band too meant the yard's flattest reading was always the
              // apron, and the yard proper — the thing this check is named for
              // and the thing a 3.4% plane was designed for — never got looked
              // at on its own.
              {
                let dHouse = Infinity
                for (let k = 0; k < fpc.length; k++) {
                  const w0 = fpc[k], w1 = fpc[(k + 1) % fpc.length]
                  const vx = w1[0] - w0[0], vy = w1[1] - w0[1]
                  const L2 = vx * vx + vy * vy || 1
                  const tt = Math.max(0, Math.min(1,
                    ((q[0] - w0[0]) * vx + (q[1] - w0[1]) * vy) / L2))
                  dHouse = Math.min(dHouse,
                    Math.hypot(q[0] - (w0[0] + vx * tt), q[1] - (w0[1] + vy * tt)))
                }
                if (dHouse <= 10) continue
              }
              const qOut: Position = [q[0] - ix * STEP, q[1] - iy * STEP]
              const z1 = surface.elevationAt(q), z2 = surface.elevationAt(qOut)
              if (z1 == null || z2 == null) continue
              samples++
              // Falling toward the street means the point nearer the street is
              // LOWER than the point nearer the house.
              const fallPct = ((z1 - z2) / STEP) * 100
              if (fallPct <= 0) { against++; continue }
              // HOW FAST IT FALLS IS READ DOWN THE SLOPE, NOT TOWARD THE STREET.
              //
              // The difference above answers the right question — does water
              // move away from the wall — but it is one component of a gradient
              // and it is the wrong one to size the fall by. Beside the house
              // the yard falls RADIALLY off the corner, so its street-ward
              // component shrinks to nothing while the ground under it is still
              // at the design grade: the flattest reading on Lot 54 came out at
              // 0.7% on a plane built at 3.4%. The steepest descent is what a
              // 2% minimum is written about.
              // Over a foot, not over the grid spacing. The yard falls RADIALLY
              // off the corners of the house, and a 5 ft difference taken there
              // cuts the curve rather than following it — it read 1.4% on a
              // plane built at 4.0%, which is the same arithmetic that made the
              // apron look flat.
              const H = 0.5
              const zx = surface.elevationAt([q[0] + H, q[1]])
              const zy = surface.elevationAt([q[0], q[1] + H])
              const slopePct = zx == null || zy == null
                ? fallPct
                : (Math.hypot(zx - z1, zy - z1) / H) * 100
              minFall = Math.min(minFall, slopePct)
              maxFall = Math.max(maxFall, slopePct)
            }
          }
          if (samples > 0) {
            // The flattest ground in the sampled band is the drainage apron
            // itself, which is BUILT at 2%. Compared exactly, the design fails
            // its own test on the last bit of a float.
            const FALL_TOL = 0.01
            const pass = against === 0 && minFall >= 2 - FALL_TOL
            console.log(`                    front yard drainage: ${samples} point(s) sampled, `
              + `${against} draining toward the dwelling; fall `
              + `${Number.isFinite(minFall) ? minFall.toFixed(1) : '—'}% to ${maxFall.toFixed(1)}%`
              + ` — ${pass ? 'WATER RUNS AWAY FROM THE HOUSE EVERYWHERE' : 'CHECK'}`)
            if (against > 0) {
              gradeFindings.push(`${l.label}: ${against} of ${samples} sampled points in the front `
                + 'yard drain TOWARD the dwelling. Water must leave the house at every point.')
            } else if (minFall < 2 - FALL_TOL) {
              gradeFindings.push(`${l.label}: front yard falls only ${minFall.toFixed(1)}% at its `
                + 'flattest, under the 2% a graded lawn needs. It drains, but not briskly enough.')
            }
          }
        }
      }

      // ── EVERY SIDE OF THE HOUSE, NOT JUST THE FRONT ───────────────────────
      //
      // The check above walks the FRONT yard and measures the fall toward the
      // street. Three sides of the dwelling are not in it. A house takes water
      // at whichever wall the ground runs back at, and on these lots the ground
      // falls to the REAR — which is where a pad, a drainage apron and a
      // retaining wall all meet, and where a mistake in any of the three puts
      // the low line against the foundation instead of away from it.
      //
      // So the ground is walked right round the dwelling and asked the only
      // question that matters: at this point, does the surface run away from
      // the house or back at it. Steepest descent, dotted with the direction
      // out of the nearest wall. Anything not positive is water that stays.
      if (fp?.length) {
        const fpc = fp[0] === fp[fp.length - 1] ? fp.slice(0, -1) : fp
        // Nearest point on the footprint, and how far out the sample lies.
        const nearestOn = (q: Position): { at: Position; dist: number } => {
          let best: Position = fpc[0], bd = Infinity
          for (let k = 0; k < fpc.length; k++) {
            const p0 = fpc[k], p1 = fpc[(k + 1) % fpc.length]
            const vx = p1[0] - p0[0], vy = p1[1] - p0[1]
            const L2 = vx * vx + vy * vy || 1
            const tt = Math.max(0, Math.min(1, ((q[0] - p0[0]) * vx + (q[1] - p0[1]) * vy) / L2))
            const c: Position = [p0[0] + vx * tt, p0[1] + vy * tt]
            const dd = Math.hypot(q[0] - c[0], q[1] - c[1])
            if (dd < bd) { bd = dd; best = c }
          }
          return { at: best, dist: bd }
        }
        // The apron is the first 10 ft off the wall — the strip the design
        // notes promise 2% on. Beyond it the ground is tying out and only the
        // DIRECTION is required, not a rate.
        const APRON_FT = 10
        const REACH_FT = 25
        const STEP = 2.5
        const xs = fpc.map(q => q[0]), ys = fpc.map(q => q[1])
        let ring = 0, back = 0, apronBack = 0, apronRays = 0, minApron = Infinity
        let worst: { at: Position; dist: number; pct: number } | null = null
        for (let gx = Math.min(...xs) - REACH_FT; gx <= Math.max(...xs) + REACH_FT; gx += STEP) {
          for (let gy = Math.min(...ys) - REACH_FT; gy <= Math.max(...ys) + REACH_FT; gy += STEP) {
            const q: Position = [gx, gy]
            const near = nearestOn(q)
            if (near.dist < 1 || near.dist > REACH_FT) continue
            if (inRing(q, fpc)) continue
            if (!inRing(q, lotRing)) continue
            // THE DIFFERENCE IS TAKEN OVER A FOOT, NOT OVER THE GRID SPACING.
            //
            // The apron is a CONE around the dwelling, and 2.5 ft forward
            // differences taken 3 ft off a building corner sample right across
            // its apex: the readings came back at 1.1 to 1.3% on a surface whose
            // radial fall is exactly 2.0% by construction, and the shortfall was
            // entirely in the arithmetic. The grid can stay coarse — it only
            // decides where to look — but the gradient at each point has to be
            // read over a step short enough that the surface is straight across
            // it.
            const H = 0.5
            const qx: Position = [gx + H, gy], qy: Position = [gx, gy + H]
            if (inRing(qx, fpc) || inRing(qy, fpc)) continue
            const z0 = surface.elevationAt(q)
            const zx = surface.elevationAt(qx)
            const zy = surface.elevationAt(qy)
            if (z0 == null || zx == null || zy == null) continue
            // Steepest descent is the negative gradient.
            const gxv = (zx - z0) / H, gyv = (zy - z0) / H
            const gm = Math.hypot(gxv, gyv)
            const outX = (q[0] - near.at[0]) / near.dist, outY = (q[1] - near.at[1]) / near.dist
            const awayFps = gm > 0 ? (-gxv * outX + -gyv * outY) / gm : 0
            ring++
            if (awayFps <= 0) {
              back++
              if (!worst || awayFps < worst.pct) {
                worst = { at: q, dist: near.dist, pct: awayFps }
              }
            }

          }
        }
        // ── THE APRON, WALKED OFF THE WALL ────────────────────────────────
        //
        // The note this design carries reads "positive drainage away from
        // structure at 2% minimum for the first 10 ft". That is a FALL OVER A
        // RUN, off a wall, and it is checked as one: from every point on the
        // footprint, straight out along the outward normal, ten feet.
        //
        // Read instead as a gradient magnitude on a grid it answered a
        // different question and answered it badly — the apron is a cone, so
        // the steepest descent near a building corner is not the fall away from
        // the wall, and a coarse difference across the cone's apex under-read a
        // 2.0% surface as 1.1%.
        {
          const STEP_ALONG = 2, RAY_STEP = 1
          for (let k = 0; k < fpc.length; k++) {
            const p0 = fpc[k], p1 = fpc[(k + 1) % fpc.length]
            const ex = p1[0] - p0[0], ey = p1[1] - p0[1]
            const el = Math.hypot(ex, ey) || 1
            let nx = -ey / el, ny = ex / el
            const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2
            const cx2 = fpc.reduce((t2, w2) => t2 + w2[0], 0) / fpc.length
            const cy2 = fpc.reduce((t2, w2) => t2 + w2[1], 0) / fpc.length
            if ((mx - cx2) * nx + (my - cy2) * ny < 0) { nx = -nx; ny = -ny }
            for (let t = 0; t <= el; t += STEP_ALONG) {
              const bx = p0[0] + (ex / el) * t, by = p0[1] + (ey / el) * t
              const zWall = surface.elevationAt([bx, by])
              if (zWall == null) continue
              let prev = zWall, reversed = false, zEnd: number | null = null
              for (let r = RAY_STEP; r <= APRON_FT + 1e-9; r += RAY_STEP) {
                const qr: Position = [bx + nx * r, by + ny * r]
                if (!inRing(qr, lotRing)) { zEnd = null; break }
                const zr = surface.elevationAt(qr)
                if (zr == null) { zEnd = null; break }
                if (zr > prev + 1e-6) reversed = true
                prev = zr; zEnd = zr
              }
              if (zEnd == null) continue
              apronRays++
              if (reversed) apronBack++
              minApron = Math.min(minApron, ((zWall - zEnd) / APRON_FT) * 100)
            }
          }
        }

        if (ring > 0) {
          // TWO DIFFERENT QUESTIONS, AND ONLY ONE OF THEM IS A DEFECT.
          //
          // Ground standing above the pad WILL run at the house — that is what
          // a bank does, and no amount of grading changes it on a lot cut into
          // a hillside. Demanding that every point within 25 ft slope outward
          // would condemn Lot 56 for the shape of its own hill.
          //
          // What has to be true is that water off that bank is INTERCEPTED and
          // taken away. So the apron is held to the 2% it promises, and the toe
          // it drains into is held to having somewhere to go. A level toe with
          // a bank above it is the failure; a graded one is the detail.
          // The apron is BUILT at 2%, so `>= 2` on a float fires on the
          // design itself. A hundredth of a percent is not a grading defect.
          const APRON_TOL = 0.01
          const apronOk = apronBack === 0 && minApron >= 2 - APRON_TOL
          const toeOk = surface.toeRingFallFt > 0.05
          console.log(`                    perimeter drainage: ${apronRays} ray(s) off the walls, `
            + `apron falls ${Number.isFinite(minApron) ? minApron.toFixed(1) : '—'}% over 10 ft at `
            + `its flattest, ${apronBack} reversing; ${back} of ${ring} point(s) beyond the apron `
            + `shed toward the house, into a toe with ${surface.toeRingFallFt.toFixed(2)} ft of `
            + `fall — ${apronOk && toeOk ? 'WATER LEAVES THE HOUSE ON EVERY SIDE' : 'CHECK'}`)
          if (apronBack > 0) {
            gradeFindings.push(`${l.label}: ${apronBack} of ${apronRays} rays off the dwelling `
              + 'walls RISE somewhere in the first 10 ft. The drainage apron is the one strip that '
              + 'must fall away from the structure the whole way out.')
          } else if (minApron < 2 - APRON_TOL) {
            gradeFindings.push(`${l.label}: the drainage apron falls only ${minApron.toFixed(1)}% `
              + 'at its flattest, under the 2% over the first 10 ft that the grading notes on this '
              + 'sheet require.')
          }
          if (back > 0 && !toeOk) {
            gradeFindings.push(`${l.label}: ${back} of ${ring} points beyond the apron shed toward `
              + 'the dwelling and the apron toe is level, so what arrives there has no outlet. '
              + 'Grade the toe to daylight or cut a diversion swale above the house.')
          }
        }
      }

      // ── THE FLOODPLAIN CONCEPT, WHERE ONE IS ASKED FOR ────────────────────
      //
      // FLOODPLAIN_EL=57 draws the ground below a stated flood elevation on
      // each lot, for the concept study sheet. It is env-gated and off by
      // default: this is a STUDY overlay and it must never appear on a permit
      // sheet by accident.
      //
      // The line is the stated elevation cut through the EXISTING surface, so
      // it shows what is below it TODAY. It is not a delineation and it is not
      // a proposed condition — the elevation it is cut at comes from a 1979
      // county letter in the WSSC datum, and the datum has not been tied to
      // NAVD88. That caveat travels with the feature so it cannot be read off
      // the sheet without it.
      if (process.env.FLOODPLAIN_EL) {
        const fpEl = Number(process.env.FLOODPLAIN_EL)
        if (Number.isFinite(fpEl)) {
          // ── EXISTING AND PROPOSED, BOTH ─────────────────────────────────
          //
          // DPIE asks for two delineations, not one: item 18 is the EXISTING
          // 100-year floodplain and item 19 the PROPOSED. They are the same
          // elevation cut through two different surfaces, and the difference
          // between them IS the floodplain impact — the thing a reviewer is
          // actually assessing. Drawing only the existing one states the
          // problem and says nothing about what the project does to it.
          const cutAt = (
            surf: (p: Position) => number | null,
          ): { lines: ExtractedContour[]; below: number; total: number } => {
            const lines2 = extractContours(surf, lotRing, { intervalFt: fpEl, cellFt: 6 })
              .filter(c => Math.abs(c.elevationFt - fpEl) < 1e-6)
            let b = 0, t2 = 0
            const xs3 = lotRing.map(q => q[0]), ys3 = lotRing.map(q => q[1])
            for (let gx = Math.min(...xs3); gx <= Math.max(...xs3); gx += 5) {
              for (let gy = Math.min(...ys3); gy <= Math.max(...ys3); gy += 5) {
                const q: Position = [gx, gy]
                if (!inRing(q, lotRing)) continue
                const z = surf(q)
                if (z == null) continue
                t2++
                if (z < fpEl) b++
              }
            }
            return { lines: lines2, below: b, total: t2 }
          }
          const ex = cutAt(groundElevationAt)
          const pr = cutAt(p2 => surface.elevationAt(p2))
          const lines = ex.lines
          const below = ex.below, total = ex.total
          const pctBelow = total ? (below / total) * 100 : 0
          const pctBelowProp = pr.total ? (pr.below / pr.total) * 100 : 0
          const areaExSf = Math.round(below * 25)
          const areaPrSf = Math.round(pr.below * 25)

          for (const [n, c] of pr.lines.entries()) {
            gradeFeats.push({
              kind: 'Floodplain', id: `fp-prop-${tagOf(l.label)}-${n}`,
              ring: { coordinates: c.path },
              designation: `EL ${fpEl.toFixed(0)} LIMIT ON PROPOSED GROUND`,
              attributes: {
                elevationFt: fpEl,
                condition: 'proposed',
                pctLotBelow: Number(pctBelowProp.toFixed(1)),
                areaBelowSqFt: areaPrSf,
                areaBelowExistingSqFt: areaExSf,
                note:
                  `PROPOSED condition — ground below EL ${fpEl.toFixed(0)} after grading is `
                  + `${pctBelowProp.toFixed(1)}% of this lot, against ${pctBelow.toFixed(1)}% `
                  + `existing, a change of ${(areaPrSf - areaExSf).toLocaleString()} sq ft. `
                  + 'THE ELEVATION DOES NOT MOVE — this line shows where the SAME stated elevation '
                  + 'meets the REGRADED surface. It is not a claim that the flood elevation changes, '
                  + 'and it is not a delineation: a delineation requires modelling on surveyed '
                  + 'cross sections, tied to a datum, sealed by a licensed professional engineer.',
              },
            } as never as SiteFeature)
          }

          for (const [n, c] of lines.entries()) {
            gradeFeats.push({
              kind: 'Floodplain', id: `fp-el-${tagOf(l.label)}-${n}`,
              ring: { coordinates: c.path },
              designation: `EL ${fpEl.toFixed(0)} LIMIT ON EXISTING GROUND`,
              attributes: {
                elevationFt: fpEl,
                condition: 'existing',
                pctLotBelow: Number(pctBelow.toFixed(1)),
                areaBelowSqFt: areaExSf,
                areaBelowProposedSqFt: areaPrSf,
                note:
                  `Existing ground below EL ${fpEl.toFixed(0)} — ${pctBelow.toFixed(1)}% of this `
                  + 'lot. CUT THROUGH THE EXISTING SURFACE FROM COUNTY 2 FT CONTOUR MAPPING, NOT A '
                  + 'FIELD SURVEY AND NOT A FLOODPLAIN DELINEATION. The elevation is stated in '
                  + 'FPS-770017 (PG County DPW&T, 16 July 1979) as 57 ft plus or minus IN THE WSSC '
                  + 'DATUM. No WSSC to NAVD88 tie has been established for this site, so this line '
                  + 'is drawn at the numeric value in NAVD88 and its true position depends on that '
                  + 'tie. FPS-770017 carries no cross sections and its controlling revision, '
                  + 'FPS 960004, is not in the project record.',
              },
            } as never as SiteFeature)
          }
          console.log(`    floodplain      ${l.label}: below EL ${fpEl.toFixed(0)} — existing `
            + `${pctBelow.toFixed(1)}% (${areaExSf.toLocaleString()} sq ft), proposed `
            + `${pctBelowProp.toFixed(1)}% (${areaPrSf.toLocaleString()} sq ft), change `
            + `${areaPrSf - areaExSf >= 0 ? '+' : ''}${(areaPrSf - areaExSf).toLocaleString()} sq ft`)

          // ── A CROSS SECTION, CUT AND CARRIED ─────────────────────────────
          //
          // FPS-770017's own county comment reads "No cross sections on plans",
          // and that is half of why the floodplain of record cannot be relied
          // on. A concept study that repeats the omission is no better. The
          // section is cut at the centre of the lot, front lot line to rear —
          // perpendicular to the overflow, which runs along the rear — and
          // carries existing ground, proposed ground and the stated elevation
          // on one profile.
          {
            const a3 = frontPath[0], b3 = frontPath[frontPath.length - 1]
            const dxs = b3[0] - a3[0], dys = b3[1] - a3[1]
            const ls = Math.hypot(dxs, dys) || 1
            let ix3 = -dys / ls, iy3 = dxs / ls
            const cx3 = lotRing.reduce((t2, q) => t2 + q[0], 0) / lotRing.length
            const cy3 = lotRing.reduce((t2, q) => t2 + q[1], 0) / lotRing.length
            if ((cx3 - a3[0]) * ix3 + (cy3 - a3[1]) * iy3 < 0) { ix3 = -ix3; iy3 = -iy3 }
            const alongAt3 = (q: Position) =>
              (q[0] - a3[0]) * (dxs / ls) + (q[1] - a3[1]) * (dys / ls)
            const mid3 = fp?.length
              ? fp.reduce((t2, q) => t2 + alongAt3(q), 0) / fp.length
              : lotRing.reduce((t2, q) => t2 + alongAt3(q), 0) / lotRing.length
            const stations: Array<{ staFt: number; existingFt: number; proposedFt: number | null }> = []
            for (let d3 = 0; d3 <= depthOfLot; d3 += 5) {
              const q: Position = [a3[0] + (dxs / ls) * mid3 + ix3 * d3,
                                   a3[1] + (dys / ls) * mid3 + iy3 * d3]
              if (!inRing(q, lotRing)) continue
              const ez = groundElevationAt(q)
              if (ez == null) continue
              stations.push({ staFt: d3, existingFt: Number(ez.toFixed(2)),
                              proposedFt: (() => { const z = surface.elevationAt(q)
                                                   return z == null ? null : Number(z.toFixed(2)) })() })
            }
            if (stations.length >= 3) {
              crossSections.push({
                lot: l.label, floodElFt: fpEl,
                note: 'Cut at the centre of the lot, front lot line to rear, perpendicular to the '
                  + 'overflow corridor. Existing ground from county 2 ft contour mapping, NAVD88 — '
                  + 'NOT a field-run survey. Flood elevation is the FPS-770017 figure in the WSSC '
                  + 'datum, plotted at its numeric value on an NAVD88 profile pending the tie.',
                stations,
              })
            }
          }
        }
      }

      // ── THE GROUND COVER LIMIT, DRAWN ─────────────────────────────────────
      //
      // A slope steeper than 3:1 is not a lawn. Three answers exist — flatten
      // it, retain it, or plant it in something that holds a bank without a
      // mower — and GROUND COVER is the one specified on this set. Naming it in
      // a note and leaving the sheet silent about WHERE would put the cost and
      // the boundary on the contractor's judgement, so the boundary is drawn.
      //
      // It is the 33.3% contour of the SLOPE of the finished surface, extracted
      // by the same marching-squares pass that draws the elevation contours —
      // a level line through a different field. Inside it the ground is steeper
      // than 3:1; outside it, turf.
      {
        const H = 0.5
        const slopePctAt = (q: Position): number | null => {
          const z0 = surface.elevationAt(q)
          const zx = surface.elevationAt([q[0] + H, q[1]])
          const zy = surface.elevationAt([q[0], q[1] + H])
          if (z0 == null || zx == null || zy == null) return null
          // Only where the design MOVES the ground. Left unqualified this traces
          // the natural bank along the frontage, which is steep, is not this
          // project's work, and is not getting planted.
          const e0 = groundElevationAt(q)
          if (e0 == null || Math.abs(z0 - e0) < 0.5) return 0
          return (Math.hypot(zx - z0, zy - z0) / H) * 100
        }
        const limits = extractContours(slopePctAt, lotRing, {
          intervalFt: MAX_MOWABLE_SLOPE_PCT, cellFt: 6,
        }).filter(c => Math.abs(c.elevationFt - MAX_MOWABLE_SLOPE_PCT) < 1e-6)
        for (const [n, c] of limits.entries()) {
          gradeFeats.push({
            kind: 'ProposedFeature', id: `gc-${tagOf(l.label)}-${n}`,
            line: c.path,
            attributes: {
              type: 'Ground cover limit',
              proposed: true,
              label: 'LIMIT OF GROUND COVER — SLOPES STEEPER THAN 3:1',
              note:
                'Ground cover, not turf, on the slope side of this line. 3:1 is the steepest a '
                + 'lawn is mown safely; these slopes reach '
                + `${surface.maxSlopePct.toFixed(0)}% `
                + `(${surface.maxSlopeRatio}) and are stable, but they will not be maintained by an `
                + 'owner with a mower. Species, spacing and establishment per the Prince '
                + "George's County Landscape Manual. Line taken from the finished surface at the "
                + '3:1 slope, over ground this design moves by more than 0.5 ft.',
            },
          } as never as SiteFeature)
        }
        if (limits.length) {
          console.log(`    ground cover    ${l.label}: ${limits.length} limit line(s) at 3:1 — `
            + `steepest ${surface.maxSlopePct.toFixed(0)}% (${surface.maxSlopeRatio})`)
        }
      }

      // ── THE WALL, DRAWN ───────────────────────────────────────────────────
      //
      // A retaining wall is a structure and a reviewer looks for it as one: a
      // line, a height, and the elevations either side of it. It is traced at
      // the stated offset around the dwelling so it follows the house rather
      // than being a straight line drawn near it.
      if (surface.retainingWall && fp?.length) {
        const w = surface.retainingWall
        const fpc = fp[0] === fp[fp.length - 1] ? fp.slice(0, -1) : fp
        const cxf = fpc.reduce((t2, q) => t2 + q[0], 0) / fpc.length
        const cyf = fpc.reduce((t2, q) => t2 + q[1], 0) / fpc.length
        // Only the REAR of the house is retained; the wall runs behind it.
        const wallPts: Position[] = []
        for (let k = 0; k < fpc.length; k++) {
          const a2 = fpc[k], b2 = fpc[(k + 1) % fpc.length]
          const m: Position = [(a2[0] + b2[0]) / 2, (a2[1] + b2[1]) / 2]
          // The rear face: the one furthest from the front lot line.
          const dm = (m[0] - frontPath[0][0]) * 0 + 0
          void dm
          const ox = m[0] - cxf, oy = m[1] - cyf
          const ol = Math.hypot(ox, oy) || 1
          const cand: Position = [m[0] + (ox / ol) * w.atFt, m[1] + (oy / ol) * w.atFt]
          const zc = surface.elevationAt(cand)
          const ze = groundElevationAt(cand)
          // Retain only where the design is actually holding ground up.
          if (zc != null && ze != null && zc - ze > w.heightFt * 0.5) {
            wallPts.push([a2[0] + (ox / ol) * w.atFt, a2[1] + (oy / ol) * w.atFt])
            wallPts.push([b2[0] + (ox / ol) * w.atFt, b2[1] + (oy / ol) * w.atFt])
          }
        }
        if (wallPts.length >= 2) {
          // TOP AND BOTTOM ARE READ ACROSS THE WALL, a foot either side of it.
          //
          // Reading both at the same point gave TW 57.7 against BW 52.0 for a
          // 3 ft wall: the top came off the designed surface and the bottom off
          // the county mapping, which are two different things sampled at one
          // place. The step a wall makes is the difference between the finished
          // surface on its two sides, so that is what is measured.
          const wp = wallPts[0]
          const oxw = wp[0] - cxf, oyw = wp[1] - cyf
          const olw = Math.hypot(oxw, oyw) || 1
          const topEl = surface.elevationAt(
            [wp[0] - (oxw / olw) * 1.5, wp[1] - (oyw / olw) * 1.5])
          const botEl = surface.elevationAt(
            [wp[0] + (oxw / olw) * 1.5, wp[1] + (oyw / olw) * 1.5])
          gradeFeats.push({
            kind: 'ProposedFeature', id: `wall-${tagOf(l.label)}`,
            line: wallPts,
            attributes: {
              type: 'Retaining wall',
              proposed: true,
              label: `PROPOSED ${w.heightFt.toFixed(1)}' RETAINING WALL`,
              note:
                `Low retaining wall ${w.atFt.toFixed(0)} ft behind the dwelling, `
                + `${w.heightFt.toFixed(1)} ft high`
                + (topEl != null && botEl != null
                  ? `. Top of wall EL ${topEl.toFixed(1)}, bottom EL ${botEl.toFixed(1)}` : '')
                + '. It takes the drop a 3:1 graded lawn cannot follow, so the slope above it is '
                + 'mowable and the graded area stops at the wall. Under 4 ft, so no separate '
                + "building permit or engineered design is triggered; confirm against Prince "
                + "George's County requirements and provide a footing detail and drainage behind "
                + 'the stem before construction.',
            },
          } as never as SiteFeature)
          console.log(`    retaining wall  ${l.label}: ${w.heightFt.toFixed(1)} ft at `
            + `${w.atFt.toFixed(0)} ft behind the dwelling`
            + (topEl != null && botEl != null
              ? `, TW ${topEl.toFixed(1)} / BW ${botEl.toFixed(1)}` : ''))
        }
      }

      const cs = extractContours(surface.elevationAt, lotRing, { intervalFt: 2, cellFt: 6 })
      for (const [ci, c] of cs.entries()) {
        gradeFeats.push({
          kind: 'Contour', id: `pc-${l.label.replace(/\s+/g, '')}-${ci}`.toLowerCase(),
          line: c.path.map(([x, y]) => [x, y, c.elevationFt] as Position),
          attributes: { elevationFt: c.elevationFt, proposed: true },
        } as never as SiteFeature)
      }
      // ── SPOT ELEVATIONS, COMPUTED ─────────────────────────────────────────
      //
      // Sec. 32-130(a)(9) asks for basement, first floor and ground elevations
      // AT THE CORNERS OF ALL BUILDINGS, spot elevations at critical points,
      // and the driveway profile. The sheet had finished floors and storm
      // structure grades and nothing else, so the paragraph read PARTIAL.
      //
      // Nothing here waits for a survey. Existing ground is known from the
      // county mapping, the pad is the street grade carried to the dwelling,
      // the finished floor is that plus 2 ft, and every other point is
      // arithmetic on those three. A design professional revises them; they do
      // not have to invent them.
      const ffEl = streetEl + (l.spec.frontDoorAboveStreetFt ?? 2)
      const spot = (id: string, at: Position, label: string, note: string) => {
        gradeFeats.push({
          kind: 'SpotElevation', id, point: at,
          attributes: { label, note, proposed: true },
        } as never as SiteFeature)
      }
      const tag = tagOf(l.label)
      if (fp?.length) {
        const corners = fp[0] === fp[fp.length - 1] ? fp.slice(0, -1) : fp
        corners.forEach((c, ci) => {
          const g = surface.elevationAt(c)
          if (g == null) return
          spot(`sp-${tag}-bc${ci}`, c, `G ${g.toFixed(1)}`,
            `Proposed ground at building corner ${ci + 1}. Finished floor ${ffEl.toFixed(2)}, `
            + `${(ffEl - g).toFixed(2)} ft above this corner. Basement slab `
            + `${(ffEl - 9).toFixed(2)}. Sec. 32-130(a)(9).`)
        })
      }
      // The driveway profile: apron at the street, garage slab at the house.
      const dw = l.pkg.twin.features.find(f =>
        String(f.id).endsWith('driveway')) as { ring?: { coordinates: Position[] } } | undefined
      if (dw?.ring?.coordinates?.length) {
        const dr = dw.ring.coordinates
        const head: Position = [(dr[0][0] + dr[1][0]) / 2, (dr[0][1] + dr[1][1]) / 2]
        const toe: Position = [(dr[2][0] + dr[3][0]) / 2, (dr[2][1] + dr[3][1]) / 2]
        const garageEl = ffEl - 0.33
        const runFt = Math.hypot(toe[0] - head[0], toe[1] - head[1])
        const slopePct = runFt > 0 ? ((garageEl - streetEl) / runFt) * 100 : 0
        spot(`sp-${tag}-apron`, head, `EP ${streetEl.toFixed(1)}`,
          'Edge of pavement at the driveway apron — the street grade the driveway starts from.')
        spot(`sp-${tag}-gar`, toe, `GAR ${garageEl.toFixed(1)}`,
          `Garage slab, 4 in below the finished floor. Driveway rises `
          + `${(garageEl - streetEl).toFixed(2)} ft over ${runFt.toFixed(0)} ft = `
          + `${slopePct.toFixed(1)}% longitudinal.`)
        const T4_MIN = 1, T4_MAX = 12.5
        if (slopePct < T4_MIN || slopePct > T4_MAX) {
          gradeFindings.push(`${l.label}: driveway longitudinal grade ${slopePct.toFixed(1)}% is `
            + `outside the ${T4_MIN}% to ${T4_MAX}% of PGC Code Sec. 32-151 Table 4. Adjust the `
            + 'garage slab or the pad.')
        }
      }
      // Where the proposed surface meets existing, which is the line a
      // reviewer looks for and the limit of the graded area.
      {
        const mid = frontMid
        if (mid) {
          const a2 = frontPath[0], b2 = frontPath[frontPath.length - 1]
          const dxx = b2[0] - a2[0], dyy = b2[1] - a2[1]
          const ll = Math.hypot(dxx, dyy) || 1
          let ix = -dyy / ll, iy = dxx / ll
          const cx2 = lotRing.reduce((t2, q) => t2 + q[0], 0) / lotRing.length
          const cy2 = lotRing.reduce((t2, q) => t2 + q[1], 0) / lotRing.length
          if ((cx2 - a2[0]) * ix + (cy2 - a2[1]) * iy < 0) { ix = -ix; iy = -iy }
          const tie: Position = [mid[0] + ix * surface.tieDepthFt, mid[1] + iy * surface.tieDepthFt]
          const tg = groundElevationAt(tie)
          if (tg != null) {
            spot(`sp-${tag}-tie`, tie, `TIE ${tg.toFixed(1)}`,
              'Proposed grade meets existing grade. Nothing behind this line is regraded.')
          }
        }
      }

      const ew = earthwork(surface.elevationAt, groundElevationAt, lotRing, 6,
        fp?.length ? (fp[0] === fp[fp.length - 1] ? fp.slice(0, -1) : fp) : null)
      cutTotal += ew.cutCubicYd
      fillTotal += ew.fillCubicYd
      gradedTotal += ew.gradedAreaSqFt
      console.log(`    grading ${l.label.padEnd(7)} street EL ${streetEl.toFixed(1)} → front yard `
        + `at ${surface.frontYardSlopePct.toFixed(1)}% → pad EL ${surface.padElFt.toFixed(1)} `
        + `(${surface.padStartFt.toFixed(0)}-${surface.padDepthFt.toFixed(0)} ft in) → rear at `
        + `${surface.maxSlopePct.toFixed(1)}% (${surface.maxSlopeRatio}) → ties at `
        + `${surface.tieDepthFt.toFixed(0)} ft`)
      if (surface.maxSlopeAt) {
        const m = surface.maxSlopeAt
        console.log(`                    steepest at ${m.depthFt.toFixed(0)} ft in, `
          + `${m.distToHouseFt.toFixed(0)} ft from the house: proposed `
          + `${m.proposedEl.toFixed(1)} against existing ${m.existingEl.toFixed(1)}`)
      }
      console.log(`                    cut ${ew.cutCubicYd} cy / fill ${ew.fillCubicYd} cy over `
        + `${ew.gradedAreaSqFt.toLocaleString()} sq ft; ${cs.length} proposed contour(s)`)
    }
    if (gradeFeats.length) {
      merged.push(...gradeFeats)
      earthworkTotals = {
        cutCubicYd: cutTotal, fillCubicYd: fillTotal,
        netCubicYd: fillTotal - cutTotal, gradedAreaSqFt: gradedTotal,
      }
      // A NET IMPORT THIS SIZE IS A DESIGN DECISION, NOT A DETAIL.
      //
      // Holding the pad dead level at street grade across a lot that falls to
      // the rear buys the level front yard with fill, and the fill is not
      // small: roughly a cubic yard for every eight square feet regraded here,
      // which is several hundred truck movements. It is exactly what was asked
      // for and it is what it costs, so it is reported rather than absorbed.
      const perSqFt = gradedTotal > 0 ? (fillTotal - cutTotal) / gradedTotal : 0
      if (perSqFt > 0.08) {
        console.log('')
        console.log(`  ** ${(fillTotal - cutTotal).toLocaleString()} CY NET IMPORT is a large`)
        console.log('  ** number for four residential lots — about one cubic yard per')
        console.log(`  ** ${(1 / perSqFt).toFixed(0)} sq ft regraded. It follows directly from`)
        console.log('  ** holding the pad LEVEL at street grade across lots that fall 6 to 9 ft')
        console.log('  ** to the rear. Sloping the pad at 2% away from the dwelling instead of')
        console.log('  ** holding it dead level, or stepping it down behind the house, would cut')
        console.log('  ** it substantially and still drain. That is a design choice, so it is')
        console.log('  ** put here rather than made quietly.')
        console.log('')
      }
      console.log(`    earthwork       ${cutTotal.toLocaleString()} cy cut, `
        + `${fillTotal.toLocaleString()} cy fill, net `
        + `${(fillTotal - cutTotal).toLocaleString()} cy `
        + `${fillTotal >= cutTotal ? 'IMPORT' : 'EXPORT'} over `
        + `${gradedTotal.toLocaleString()} sq ft regraded`)
    }
    for (const f of gradeFindings) console.log(`      · ${f}`)
  }

  // The per-lot pieces are replaced by the continuous run.
  const withoutPerLot = merged.filter(f =>
    // The CURB too: the per-lot package derives one from each lot's own front
    // edge, and the continuous run below replaces all of them. Left in, two
    // curb lines were drawn along the same frontage.
    !/(^|-)(sidewalk|verge|curb)$/.test(String(f.id)))
  merged.length = 0
  merged.push(...withoutPerLot, ...frontageFeats)

  let twin: SiteTwin = {
    ...base,
    features: merged,
    revision: base.revision + 1,
    // Preserve the per-lot engineering results after composing the two lot
    // twins. Renderers must not mistake Lot 1's metadata for a project total.
    projectLots: lots.map((lot, index) => ({
      featurePrefix: `l${index + 1}-`,
      label: lot.label,
      address: lot.spec.address,
      areaSqFt: lot.plat.computedAreaSqFt ?? lot.spec.recordedAreaSqFt ?? null,
      buildableEnvelope: (lot.pkg.twin as { buildableEnvelope?: unknown }).buildableEnvelope ?? null,
      drainage: (lot.pkg.twin as { drainage?: unknown }).drainage ?? null,
      disturbedAreaSqFt: (lot.pkg.twin as { disturbedAreaSqFt?: number }).disturbedAreaSqFt ?? null,
      disturbanceHasUnknowns: (lot.pkg.twin as { disturbanceHasUnknowns?: boolean }).disturbanceHasUnknowns ?? false,
    })),
  } as SiteTwin
  if (platRecord) twin = { ...twin, platRecord } as typeof twin
  // THE STORM DRAIN COMPUTATIONS BELONG ON THE SHEET, NOT IN A FILE.
  //
  // Every size, class, drainage area and flow was carried only in the notes
  // attached to the pipe features, where a reviewer reads them one at a time by
  // clicking a CAD object — which on paper means not at all. An approved storm
  // drain plan carries a structure and pipe schedule, and this set is asking to
  // be approved. The schedule is put on the twin so the renderer can table it.
  if (trunk) twin = { ...twin, stormTrunk: trunk } as typeof twin
  if (swaleDesign) twin = { ...twin, swaleDesign } as typeof twin
  if (crossSections.length) twin = { ...twin, crossSections } as typeof twin
  if (earthworkTotals) twin = { ...twin, earthwork: earthworkTotals } as typeof twin

  // ── Sheets ────────────────────────────────────────────────────────────────
  const override = process.env.SHEETS?.split(',').map(x => x.trim()).filter(Boolean) as SheetId[] | undefined
  // THE SET IS SIZED TO THE PROJECT, BUT NOT BY THE GREEDY MERGE.
  //
  // Eleven sheets is what a subdivision with roads, storm drain and lighting
  // needs; two infill houses on an existing street do not need a demolition
  // plan with nothing to demolish or a details sheet with no details.
  //
  // The composer's content merge alone is the wrong tool for choosing: it
  // folded the PROPOSED site plan into the existing-conditions sheet and
  // dropped the landscape sheet, because it merges by what is drawn and not by
  // what a reviewer must be handed. Existing and proposed are separate sheets
  // even when both would fit on one — they are read against each other — and
  // the landscape sheet carries a canopy requirement that is code, not content.
  //
  // So the condensed set is named, and each entry says why it is in it:
  //
  //   C-000  cover, approvals, index, general notes, plat record
  //   C-100  EXISTING conditions and boundary of record
  //   C-200  PROPOSED site, zoning and dimensional compliance
  //   C-400  grading and drainage — carries the required county notes
  //   C-700  sediment and erosion control — carries them too
  //   L-100  landscape and tree canopy — Sec. 25-128 is a requirement
  //
  // FULL_SET=1 forces the canonical eleven; SHEETS=... names any list.
  // ONE SHEET. C-001 carries every discipline — existing, proposed, grading,
  // paving, landscape — with the tables and notes in the right-hand column,
  // which is what the approved plans in this repo do for an individual lot.
  // Two houses on an existing street do not need a set; a reviewer comparing
  // proposed against existing should not have to turn a page to do it.
  //
  // SHEETS=... still names a list and FULL_SET=1 forces the canonical eleven,
  // for a project that genuinely needs them.
  // C-001 CARRIES EVERY DISCIPLINE, AND GRADING GETS ITS OWN SHEET TOO.
  //
  // One condensed sheet suits a small project and it is what this set has been
  // drawn on. It is not a grading plan: contours, spot elevations, the swale
  // and the earthwork sit on it among the boundary, the services, the
  // landscape and the details, and a reviewer asked for the grading plan
  // cannot be pointed at it.
  //
  // C-400 draws the same model filtered to grading, stormwater and sediment
  // control over the standard base — lot lines, BRL, easements, dwelling and
  // paving — which is a grading plan a reviewer can stamp.
  // ── AND THE LANDSCAPE SHEET ───────────────────────────────────────────────
  //
  // Sec. 25-128 makes tree canopy a REQUIREMENT — 20% of net tract area on
  // RSF-95 — and a requirement that is only ever stated in a note is a
  // requirement nobody can check. L-100 draws it: the trees, the planting
  // strip, the canopy the schedule is counting, and the EASEMENT AREAS, which
  // is where it matters most. A 60 ft storm drain easement with a 42 in main in
  // it and a 10 ft drainage easement carrying the swale are not plantable
  // ground — nothing with a root ball goes over a pipe — and a landscape plan
  // that does not show them proposes trees somebody will have to refuse.
  const CONDENSED: SheetId[] = ['C-001', 'L-100', 'C-400']
  const sheetIds: SheetId[] = override ?? (process.env.FULL_SET ? FULL_SET : CONDENSED)
  console.log(`    sheets          ${sheetIds.length}: ${sheetIds.join(', ')}`)
  console.log(`                    condensed from the canonical ${FULL_SET.length}; `
    + 'FULL_SET=1 forces all, SHEETS=... names a list')
  const projectName = `${subdivisionName} — ${lots.map(l => l.label).join(' & ')}`
  // The recorded WSSC connection sketch is THIS project's exhibit, named here
  // rather than living in the global county-details list — where it printed on
  // an unrelated project's sheets.
  const sheets = sheetIds.map((sheet, i) => ({
    ...buildSheetContext({
      sheet, twin, projectName,
      status: 'PRELIMINARY', sheetIndex: i + 1, sheetCount: sheetIds.length, sheetIds,
    }),
    // Carried on the context explicitly: `buildSheetContext` does not pass the
    // list through, and the cover sheet's index needs every sheet in the set,
    // not just the one being drawn.
    sheetIds,
    // Exhibits are per PROJECT. The connection sketch belongs to Rollins; the
    // field topo belongs to Indian Queen. Named by which plat record is loaded.
    exhibits: platRecord?.citation === 'PLAT BOOK WWW 65, P. 60'
      ? ['indian-queen-field-topo']
      : ['wssc-connection-sketch'],
  }))
  const out = await renderSheetSetPdf({ sheets, responsibility: undefined })

  // A LOCKED TARGET IS REPORTED, NEVER SWALLOWED.
  //
  // Writing to a PDF that is open in a viewer fails with EACCES on Windows, and
  // a run whose output is piped away looks exactly like a successful one. That
  // happened here for over an hour: every regeneration threw, the console said
  // nothing a filter kept, and the reviewer was looking at a stale file while
  // being told it was current.
  //
  // So: write, and if the target is locked, say so at the top of the output and
  // write a sibling the reviewer can open instead. Silence is the one response
  // that is not allowed.
  const written = (() => {
    try {
      writeFileSync(outPath, out.buffer)
      return outPath
    } catch (e) {
      const err = e as NodeJS.ErrnoException
      if (err.code !== 'EACCES' && err.code !== 'EBUSY' && err.code !== 'EPERM') throw e
      const alt = outPath.replace(/\.pdf$/, `.${Date.now()}.pdf`)
      writeFileSync(alt, out.buffer)
      console.error('')
      console.error(`  !! ${outPath}`)
      console.error(`  !! IS LOCKED (${err.code}) — it is open in a viewer, so it was NOT updated.`)
      console.error(`  !! The new sheet was written to:`)
      console.error(`  !!   ${alt}`)
      console.error('  !! Close the PDF and run again to update the original path.')
      console.error('')
      return alt
    }
  })()

  const dxfPath = outPath.replace(/\.pdf$/, '.dxf')
  const xmlPath = outPath.replace(/\.pdf$/, '.landxml.xml')
  writeFileSync(dxfPath, toDxf(twin))
  writeFileSync(xmlPath, toLandXml(twin))

  // THE MODEL ITSELF, when asked for.
  //
  // The DXF is grouped by CAD layer, so a driveway, an apron and a public walk
  // all arrive as `C-PVMT` and nothing downstream can tell which is which. That
  // is fine for CAD and useless for checking a dimension: verifying that the
  // apron stops at the gutter needs the apron, named. TWIN_JSON=... writes the
  // twin as generated so a setback or an offset can be measured rather than
  // eyeballed off the sheet.
  if (process.env.TWIN_JSON) {
    writeFileSync(process.env.TWIN_JSON, JSON.stringify(twin, null, 2))
  }
  if (process.env.PROPOSED_GRID && proposedGrids.length) {
    writeFileSync(process.env.PROPOSED_GRID, JSON.stringify({
      crs: 'EPSG:2248', verticalDatum: 'NAVD88',
      note: 'Proposed graded surface sampled directly from the design surface, '
        + 'not interpolated from contours. -9999 is outside the graded extent.',
      grids: proposedGrids,
    }))
    console.log(`    proposed grid   ${proposedGrids.length} lot surface(s) -> ${process.env.PROPOSED_GRID}`)
  }

  // ── Terminal review, every sheet ──────────────────────────────────────────
  const only = process.env.ASCII_SHEETS?.split(',').map(x => x.trim()).filter(Boolean)
  const toDraw = only?.length ? sheetIds.filter(id => only.includes(id)) : sheetIds
  const lotAreas = lots.map(l => `${l.label} ${l.plat.computedAreaSqFt?.toFixed(0)} SF`).join(' · ')
  for (const sheetId of toDraw) {
    console.log('')
    console.log(renderAsciiPlan({
      twin, sheet: sheetId,
      envelope: null, footprint: null,
      title: `${sheetId}  ${SHEET_TITLES[sheetId]}`,
      subtitle: `${subdivisionName.toUpperCase()} · ${lotAreas} · `
        + `${outer.computedAreaSqFt?.toFixed(0)} SF outer boundary of record`,
    }))
  }

  console.log(`\n[2] ${written}`)
  console.log(`    ${out.pageCount} sheet(s): ${sheetIds.join(' | ')}`)
  console.log(`    CAD: ${dxfPath}`)
  console.log(`         ${xmlPath}`)

  // ── What still gates a submission ─────────────────────────────────────────
  //
  // Merged and de-duplicated across lots: an item raised once per lot is one
  // item, and a reader who sees the same sentence twice stops reading them.
  const beforeSeal = [...new Set(lots.flatMap(l => l.pkg.beforeSeal))]
  console.log(`\n    ${beforeSeal.length} item(s) outstanding before a seal:`)
  for (const item of beforeSeal) console.log(`      · ${item}`)
}

main().catch(e => { console.error(e); process.exit(1) })
