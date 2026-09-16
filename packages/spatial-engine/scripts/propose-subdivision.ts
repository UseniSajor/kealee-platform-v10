/**
 * Propose a subdivision of a parcel that has NO recorded plat.
 *
 *   pnpm tsx scripts/propose-subdivision.ts "4600 Wheeler Rd" ../../output/site-plans/wheeler-4600 \
 *     [--recorded-acres 5.115479] [--case SE-1796]
 *
 * Layout: ONE entrance at the centre of the fronting street's frontage, a
 * stem in, then a T — a branch curving away to the left and one to the
 * right, each ending in a cul-de-sac. Every lot fronts the new street; none
 * front the existing road (lots along it back onto it, with access to the
 * new street only). Bends are circular curves with a stated radius and a
 * curve table, as the approved Joseph Drive plan (Yocum Property) draws them.
 *
 * Lots are cut with polygon booleans (polygon-clipping): a strip along a
 * station interval of a branch, on one side, clipped to the parcel and the
 * branch's cell, minus every right-of-way. Inside a curve the lot is a pie to
 * the centre of curvature and the corner is split on the angle bisector, the
 * way corner lots on curved streets are actually drawn.
 *
 * What is refused: the outer boundary is the county parcel polygon (Level 1)
 * and is said so; a recorded acreage that disagrees is reported, not
 * adjusted; lots meet the zone's certified minimums or are marked; the
 * density cap is on NET tract area; nothing about drainage, sewer capacity
 * or forest conservation is designed here.
 */
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import polygonClipping from 'polygon-clipping'
import { fetchPgAtlasPropertyRecord, resolvePgAtlasSite } from '../src/jurisdictions/pgatlas'
import { fetchPgContours, type PgContourResult } from '../src/jurisdictions/pg-elevation'
import { fetchSoilMapUnits } from '../src/jurisdictions/usda-soils'
import { waterQualityVolume, practiceFootprint } from '../src/site-plan/engineering'
import { PG_ZONE_DIMENSIONAL_TABLES } from '../src/jurisdictions/pg-dimensional-standards.generated'

type P = [number, number]

// ── Street section — from an APPROVED PG residential street ─────────────────
//
// Yocum Property, Lots 1–19, Clinton (5th District): Joseph Drive, "60' WIDE
// R.O.W.", paving reduced 36' → 26' under DPIE 15927-2020-0 (street
// construction) / 15919-2020-0 (storm drain & site grading), Design
// Engineering Inc., P.L. Arora P.E. 11101. Both sets in `existing site plans/`.
// Its curve table runs R = 343' to 531'. Cul-de-sac radii here are assumed.
const STREET = {
  rightOfWayFt: 60,
  pavementFt: 26,
  bulbRightOfWayRadiusFt: 50,
  bulbPavementRadiusFt: 40,
  /** Centreline radius at bends. Below Joseph Drive's smallest (343'); a local cul-de-sac street, stated as assumed. */
  curveRadiusFt: 150,
  /** Straight run from the existing R/W line to the first point of curve. Assumed. */
  minTangentFromEntranceFt: 50,
  basis: 'Joseph Drive, Yocum Property Lots 1–19 — DPIE approvals 15927-2020-0 / 15919-2020-0',
  note: '60\' R/W and 26\' pavement per the approved Joseph Drive section (Yocum Property, DPIE 15927-2020-0). '
      + 'Bend radius 150\' centreline and cul-de-sac radii (50\' R/W, 40\' pavement) are ASSUMED — that approval '
      + 'is a through street with R ≥ 343\'. Confirm against PGC DPW&T Specifications and Standards.',
}
/** Wheeler Road — "80' R/W PER MASTER PLAN" on the 2023 layout sheet. */
const MASTER_PLAN_ROW_FT = 80
const DEPTH = 400   // how far a lot strip reaches back from the street before the parcel clips it
const NEAR_FT = 130 // the first tier beside every part of the street belongs to the lots fronting it

// ── Stormwater management — Environmental Site Design, MDE Design Manual Ch. 5 ─
//
// The 2023 layout sheet for this parcel carries a "Hydro Area", "Impervious
// Surface" and "Infiltration Berms 6' wide" legend and 1,200 SF dwelling
// footprints. The concept here reserves ONE stormwater parcel at the low
// corner of the tract, sized for the ESD volume of the whole subdivision, and
// notes the per-lot practices that sheet shows. Nothing below is a design.
const SWM = {
  /** Rainfall target P_E, inches. 1.0 in is the Manual's floor; Table 5.3 raises it with % impervious and hydrologic soil group. */
  rainfallTargetIn: 1.0,
  /** Impervious cover assumed per lot: 1,200 sf dwelling (as the 2023 sheet draws) + driveway, walk and apron. */
  lotImperviousSqFt: 2000,
  /** Sidewalk both sides of the new street, 4 ft each, as the Yocum section shows. */
  sidewalkFtPerFtOfStreet: 8,
  practice: 'Environmental Site Design — micro-bioretention (M-6), one cell at the low corner',
  pondingDepthFt: 2,
  voidRatio: 0.4,
  /** Parcel area over the practice footprint: side slopes, forebay, access, freeboard. */
  parcelOverFootprint: 2.0,
  minParcelSqFt: 6000,
}

// ── Geometry, EPSG:2248 feet ────────────────────────────────────────────────

function area(r: P[]): number {
  let a = 0
  for (let i = 0; i < r.length; i++) { const q = r[(i + 1) % r.length]; a += r[i][0] * q[1] - q[0] * r[i][1] }
  return a / 2
}
function openRing(r: P[]): P[] {
  const f = r[0], l = r[r.length - 1]
  return f[0] === l[0] && f[1] === l[1] ? r.slice(0, -1) : r
}
/** Sutherland–Hodgman against a linear predicate: keeps points where g(p) ≥ 0. */
function clipWhere(subject: P[], g: (p: P) => number): P[] {
  if (subject.length < 3) return []
  const out: P[] = []
  for (let j = 0; j < subject.length; j++) {
    const cur = subject[j], prev = subject[(j + subject.length - 1) % subject.length]
    const gc = g(cur), gp = g(prev)
    const cIn = gc >= -1e-9, pIn = gp >= -1e-9
    const cut = (): P => { const t = gp / (gp - gc || 1e-12); return [prev[0] + (cur[0] - prev[0]) * t, prev[1] + (cur[1] - prev[1]) * t] }
    if (cIn) { if (!pIn) out.push(cut()); out.push(cur) } else if (pIn) out.push(cut())
  }
  return out.length >= 3 && Math.abs(area(out)) > 1 ? out : []
}
const dot = (p: P, o: P, d: P) => (p[0] - o[0]) * d[0] + (p[1] - o[1]) * d[1]
const cross = (d: P, p: P, o: P) => d[0] * (p[1] - o[1]) - d[1] * (p[0] - o[0])
const add = (o: P, d: P, k: number): P => [o[0] + d[0] * k, o[1] + d[1] * k]
const leftOf = (d: P): P => [-d[1], d[0]]
const norm = (d: P): P => { const l = Math.hypot(d[0], d[1]) || 1; return [d[0] / l, d[1] / l] }
const rot = (d: P, deg: number): P => { const t = deg * Math.PI / 180; return [d[0] * Math.cos(t) - d[1] * Math.sin(t), d[0] * Math.sin(t) + d[1] * Math.cos(t)] }
const dist = (a: P, b: P) => Math.hypot(a[0] - b[0], a[1] - b[1])

function bearingOf(a: P, b: P): string {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const ns = dy >= 0 ? 'N' : 'S', ew = dx >= 0 ? 'E' : 'W'
  const deg = Math.atan2(Math.abs(dx), Math.abs(dy)) * 180 / Math.PI
  let total = Math.round(deg * 3600)                       // whole seconds, carried so no field reads 60
  const d = Math.floor(total / 3600); total -= d * 3600
  const m = Math.floor(total / 60), s = total - m * 60
  return `${ns} ${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${String(s).padStart(2, '0')} ${ew}`
}
function courses(ring: P[], labels: (i: number) => string) {
  const r = openRing(ring)
  return r.map((p, i) => {
    const q = r[(i + 1) % r.length]
    return { kind: 'line', bearing: bearingOf(p, q), distanceFt: Math.round(dist(p, q) * 100) / 100, label: labels(i) }
  })
}
function circle(c: P, r: number, n = 36): P[] {
  return Array.from({ length: n }, (_, i) => [c[0] + r * Math.cos(2 * Math.PI * i / n), c[1] + r * Math.sin(2 * Math.PI * i / n)] as P)
}
function extentAlong(ring: P[], origin: P, d: P): number {
  let lo = Infinity, hi = -Infinity
  for (const p of ring) { const t = dot(p, origin, d); lo = Math.min(lo, t); hi = Math.max(hi, t) }
  return ring.length ? hi - lo : 0
}
/** Squared distance from p to segment ab. */
function segDist(p: P, a: P, b: P): number {
  const vx = b[0] - a[0], vy = b[1] - a[1]
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / (vx * vx + vy * vy || 1)))
  return Math.hypot(p[0] - (a[0] + t * vx), p[1] - (a[1] + t * vy))
}

// Polygon booleans. Rings in, largest outer ring out.
// Coordinates are snapped to 0.001 ft and consecutive duplicates dropped before
// every operation: the sweep line is not robust to 1e-12-ft segments, and a
// lot line placed to a thousandth of a foot is already ten times finer than a
// plat records.
type MP = polygonClipping.MultiPolygon
function clean(r: P[]): P[] {
  const out: P[] = []
  for (const p of r) {
    const q: P = [Math.round(p[0] * 1000) / 1000, Math.round(p[1] * 1000) / 1000]
    const last = out[out.length - 1]
    if (!last || last[0] !== q[0] || last[1] !== q[1]) out.push(q)
  }
  while (out.length > 1 && out[0][0] === out[out.length - 1][0] && out[0][1] === out[out.length - 1][1]) out.pop()
  // Drop spikes (an edge that turns straight back) and points on a straight line:
  // neither is a corner a plat would call, and a spike is a zero-area hair a union leaves.
  for (let changed = true; changed && out.length >= 3;) {
    changed = false
    for (let i = 0; i < out.length; i++) {
      const a = out[(i + out.length - 1) % out.length], b = out[i], c = out[(i + 1) % out.length]
      const ux = b[0] - a[0], uy = b[1] - a[1], vx = c[0] - b[0], vy = c[1] - b[1]
      const cr = ux * vy - uy * vx, lu = Math.hypot(ux, uy), lv = Math.hypot(vx, vy)
      if (lu < 1e-9 || lv < 1e-9 || Math.abs(cr) / (lu * lv) < 2e-4) { out.splice(i, 1); changed = true; break }
    }
  }
  return out.length >= 3 ? out : []
}
const asMP = (r: P[]): MP => { const c = clean(r); return c.length ? [[[...c, c[0]]]] : [] }
const mpOf = (rings: P[][]): MP => rings.map(clean).filter(r => r.length >= 3).map(r => [[...r, r[0]]])
function union(rings: P[][]): MP {
  const mps = mpOf(rings)
  if (!mps.length) return []
  try { return polygonClipping.union(mps[0], ...mps.slice(1)) } catch { return [] }
}
function intersection(a: MP, b: MP): MP { try { return a.length && b.length ? polygonClipping.intersection(a, b) : [] } catch { return [] } }
function difference(a: MP, b: MP): MP { try { return a.length ? (b.length ? polygonClipping.difference(a, b) : a) : [] } catch { return [] } }
function largestRing(mp: MP): P[] {
  let best: P[] = [], bestA = 0
  for (const poly of mp) { const r = openRing(poly[0] as P[]); const a = Math.abs(area(r)); if (a > bestA) { bestA = a; best = r } }
  return best
}
const mpArea = (mp: MP) => mp.reduce((s, poly) => s + Math.abs(area(openRing(poly[0] as P[]))) - poly.slice(1).reduce((h, hole) => h + Math.abs(area(openRing(hole as P[]))), 0), 0)
/**
 * Everything within `hw` of a polyline, as ONE band with mitred joins. The
 * street polyline is tangent-continuous (straights meet arcs at PC and PT and
 * the arc is sampled every 7.5°), so a mitre is exact to well under 0.01 ft;
 * rectangles-plus-joint-discs left 0.2-ft notches along every curved frontage,
 * which then printed as calls of 0.13 ft and broke the traverse.
 */
function corridorOf(pts: P[], hw: number): P[][] {
  const side = (sgn: 1 | -1): P[] => {
    const out: P[] = []
    for (let i = 0; i < pts.length; i++) {
      const dIn = i > 0 ? norm([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]) : null
      const dOut = i + 1 < pts.length ? norm([pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]]) : null
      const n1 = dIn ? leftOf(dIn) : leftOf(dOut!), n2 = dOut ? leftOf(dOut) : n1
      const k = 1 + n1[0] * n2[0] + n1[1] * n2[1]            // mitre: (n1 + n2) / (1 + n1·n2)
      const m: P = k > 0.05 ? [(n1[0] + n2[0]) / k, (n1[1] + n2[1]) / k] : n1
      out.push(add(pts[i], m, sgn * hw))
    }
    return out
  }
  return [[...side(1), ...side(-1).reverse()]]
}

// ── Zone standards ──────────────────────────────────────────────────────────

function standard(zone: string, startsWith: string): number | null {
  const table = PG_ZONE_DIMENSIONAL_TABLES[zone]
  const row = table?.rows.find(r => r.standard.startsWith(startsWith))
  const v = row?.values[0]?.replace(/,/g, '').match(/[\d.]+/)?.[0]
  return v ? Number(v) : null
}
interface Std { minArea: number; minWidth: number; minFrontage: number }
interface Lot { ring: P[]; sqFt: number; widthFt: number; frontageFt: number; fronts: string; ok: boolean; problems: string[]; backsOntoExisting: boolean }

// ── The street: one entrance, a stem, bends, one cul-de-sac ─────────────────
//
// Template: the 2023 "Wheeler Rd Subdivision Layout" sheet in `existing site
// plans/` (19 lots + parkland on this parcel). Its street enters from Wheeler,
// runs a tier in from the north boundary, rounds the north-east corner and
// runs a tier in from the east boundary — with lots on BOTH sides. That sheet
// has two entrances and an 18' private alley off Wheeler; here there is ONE
// entrance and the other end is finished as a cul-de-sac, and no alley.

interface Frame { A: P; B: P; L: number; u: P; n: P; ccw: P[] }
interface Curve { id: string; vertex: P; centre: P; radiusFt: number; deltaDeg: number; tangentFt: number; lengthFt: number; pc: P; pt: P; arc: P[]; turnSign: 1 | -1; dIn: P; dOut: P }
interface Seg { kind: 'straight' | 'arc'; curve: number }   // curve: index of the arc's curve, or of the curve this straight leads INTO (−1 after the last)
interface Road {
  pts: P[]; cum: number[]; len: number
  segs: Seg[]
  curves: Curve[]
  /** The cul-de-sac centre; absent on a street that ends at another street. */
  bulb?: P
  /** 'main' or a side street's name; side streets have their own R/W width. */
  id: string
  rightOfWayFt: number
  pavementFt: number
  /** How deep its lots may run back from it; a side street's lots are one tier, the main street's run to the boundary. */
  lotDepthFt?: number
  /** For curve k: ≥ 0 on the incoming tangent's side of the interior angle bisector. */
  nearerIn: ((p: P) => number)[]
}
/** `entrySkewDeg`: the stem's angle off perpendicular to the existing road (signed, CCW +). Intersections are held within 15° of a right angle. */
interface RoadParams { stationFt: number; stemFt: number; radiusFt: number; entrySkewDeg?: number; legs: { turnDeg: number; runFt: number }[] }

function reachAlong(f: Frame, o: P, d: P): number {
  let best = 0
  for (let i = 0; i < f.ccw.length; i++) {
    const a = f.ccw[i], b = f.ccw[(i + 1) % f.ccw.length]
    const dx = b[0] - a[0], dy = b[1] - a[1]
    const den = d[0] * dy - d[1] * dx
    if (Math.abs(den) < 1e-9) continue
    const t = ((a[0] - o[0]) * dy - (a[1] - o[1]) * dx) / den
    const w = ((a[0] - o[0]) * d[1] - (a[1] - o[1]) * d[0]) / den
    if (w >= -1e-9 && w <= 1 + 1e-9 && t > 1) best = Math.max(best, t)
  }
  return best
}

/** A circular curve of radius R turning direction d1 into d2 at vertex v. */
function fillet(id: string, v: P, d1: P, d2: P, R: number): Curve {
  const delta = Math.acos(Math.max(-1, Math.min(1, d1[0] * d2[0] + d1[1] * d2[1])))
  const T = R * Math.tan(delta / 2)
  const pc = add(v, d1, -T), pt = add(v, d2, T)
  const turnSign: 1 | -1 = cross(d1, d2, [0, 0]) >= 0 ? 1 : -1
  const centre = add(pc, leftOf(d1), turnSign * R)
  const arc: P[] = []
  const a0 = Math.atan2(pc[1] - centre[1], pc[0] - centre[0])
  const steps = Math.max(6, Math.ceil(delta * 180 / Math.PI / 7.5))
  for (let i = 0; i <= steps; i++) {
    const a = a0 + turnSign * delta * i / steps
    arc.push([centre[0] + R * Math.cos(a), centre[1] + R * Math.sin(a)])
  }
  arc[0] = pc; arc[arc.length - 1] = pt
  return { id, vertex: v, centre, radiusFt: R, deltaDeg: delta * 180 / Math.PI, tangentFt: T, lengthFt: R * delta, pc, pt, arc, turnSign, dIn: d1, dOut: d2 }
}

/** The street as a polyline: stem, then for each leg a fillet at the PI and a straight run; the last run ends at the bulb centre. */
function buildRoad(f: Frame, pr: RoadParams): Road | null {
  const { A, u, n } = f
  const R = pr.radiusFt, bulbR = STREET.bulbRightOfWayRadiusFt
  const o1 = add(A, u, pr.stationFt)
  const n0 = rot(n, pr.entrySkewDeg ?? 0)
  const pis: P[] = [], dirs: P[] = [n0]
  let v = add(o1, n0, pr.stemFt)
  for (const leg of pr.legs) { pis.push(v); const d = rot(dirs[dirs.length - 1], leg.turnDeg); dirs.push(d); v = add(v, d, leg.runFt) }
  const bulb = v
  const curves = pis.map((pi, k) => fillet(`C${k + 1}`, pi, dirs[k], dirs[k + 1], R))
  const runs = [pr.stemFt, ...pr.legs.map(l => l.runFt)]
  for (let k = 0; k < curves.length; k++) {
    const before = k === 0 ? STREET.minTangentFromEntranceFt : 20
    if (runs[k] - (k > 0 ? curves[k - 1].tangentFt : 0) - curves[k].tangentFt < before) return null
  }
  if (runs[runs.length - 1] - curves[curves.length - 1].tangentFt < bulbR + 20) return null
  const pts: P[] = [o1], segs: Seg[] = []
  curves.forEach((c, k) => {
    segs.push({ kind: 'straight', curve: k })
    for (let i = 1; i < c.arc.length; i++) segs.push({ kind: 'arc', curve: k })
    pts.push(...c.arc)
  })
  segs.push({ kind: 'straight', curve: -1 })
  pts.push(bulb)
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]))
  const nearerIn = curves.map(c => {
    const bisIn = norm([-c.dIn[0] + c.dOut[0], -c.dIn[1] + c.dOut[1]])   // interior bisector, into the corner
    const probe = add(add(c.vertex, c.dIn, -10), leftOf(c.dIn), c.turnSign) // just inside the corner, beside the incoming tangent
    const sgn = Math.sign(cross(bisIn, probe, c.vertex)) || 1
    return (p: P) => sgn * cross(bisIn, p, c.vertex)
  })
  return { pts, cum, len: cum[cum.length - 1], segs, curves, bulb, id: 'main', rightOfWayFt: STREET.rightOfWayFt, pavementFt: STREET.pavementFt, nearerIn }
}

// ── Lots ────────────────────────────────────────────────────────────────────

interface Layout {
  lots: Lot[]; road: Road; roads: Road[]
  /** The street adjoins the reserved stormwater parcel. */
  streetTouchesKeepOut: boolean
  centrelines: P[][]; rowRings: P[][]; pavementRings: P[][]; rowSqFt: number
  params: RoadParams
  leftoverSqFt: number
}

function layoutRoad(f: Frame, tract: P[], roads: Road[], params: RoadParams, std: Std, keepOut: P[][] = []): Layout | null {
  const { A, n } = f
  const road = roads.find(rd => rd.id === 'main') ?? roads[0]
  const bulbR = STREET.bulbRightOfWayRadiusFt
  const parcel = asMP(tract)
  const corridor = union(roads.flatMap(rd => [...corridorOf(rd.pts, rd.rightOfWayFt / 2), ...(rd.bulb ? [circle(rd.bulb, bulbR, 72)] : [])]))
  for (const ring of keepOut) if (mpArea(intersection(corridor, asMP(ring))) > 1) return null   // the street may not cross a reserved parcel
  const pavement = union(roads.flatMap(rd => [...corridorOf(rd.pts, rd.pavementFt / 2), ...(rd.bulb ? [circle(rd.bulb, STREET.bulbPavementRadiusFt, 72)] : [])]))

  const segDir = (rd: Road, i: number): P => norm([rd.pts[i + 1][0] - rd.pts[i][0], rd.pts[i + 1][1] - rd.pts[i][1]])
  const at = (rd: Road, s: number, i: number): P => {
    const t = (s - rd.cum[i]) / ((rd.cum[i + 1] - rd.cum[i]) || 1)
    return [rd.pts[i][0] + (rd.pts[i + 1][0] - rd.pts[i][0]) * t, rd.pts[i][1] + (rd.pts[i + 1][1] - rd.pts[i][1]) * t]
  }
  /** The land one side of a road between two stations, before any clipping: quads, pies inside bends, fans outside. */
  const stripRings = (rd: Road, side: 1 | -1, a: number, e: number, depth = rd.lotDepthFt ?? DEPTH): P[][] => {
    const rings: P[][] = []
    let prevN: P | null = null, prevJoint: P | null = null
    for (let i = 0; i + 1 < rd.pts.length; i++) {
      const sa = Math.max(a, rd.cum[i]), sb = Math.min(e, rd.cum[i + 1])
      if (sb - sa < 0.05) continue
      const p0 = at(rd, sa, i), p1 = at(rd, sb, i)
      const nm = leftOf(segDir(rd, i)); if (side < 0) { nm[0] = -nm[0]; nm[1] = -nm[1] }
      const seg = rd.segs[i]
      let quad: P[]
      if (seg.kind === 'arc') {
        const c = rd.curves[seg.curve]
        if (side === c.turnSign) quad = depth >= c.radiusFt ? [p0, p1, c.centre] : [p0, p1, add(p1, nm, depth), add(p0, nm, depth)]   // inside the bend: a pie to the centre
        else {
          quad = [p0, p1, add(p1, nm, depth), add(p0, nm, depth)]
          if (prevN && prevJoint && sa <= rd.cum[i] + 1e-6 && (prevN[0] !== nm[0] || prevN[1] !== nm[1]))
            rings.push([prevJoint, add(prevJoint, prevN, depth), add(prevJoint, nm, depth)])   // fan at the joint
        }
      } else {
        quad = [p0, p1, add(p1, nm, depth), add(p0, nm, depth)]
        // A straight between bends: on the inside of a bend, stop at its bisector so this tangent's
        // lots and the next tangent's lots meet on the corner line, as corner lots are drawn.
        const next = seg.curve >= 0 ? rd.curves[seg.curve] : null
        const prev = seg.curve === -1 ? rd.curves[rd.curves.length - 1] : seg.curve > 0 ? rd.curves[seg.curve - 1] : null
        if (depth >= DEPTH) {
          if (next && side === next.turnSign) quad = clipWhere(quad, rd.nearerIn[seg.curve])
          if (prev && side === prev.turnSign) quad = clipWhere(quad, p => -rd.nearerIn[rd.curves.indexOf(prev)](p))
        }
      }
      if (quad.length) rings.push(quad)
      prevN = nm; prevJoint = rd.pts[i + 1]
    }
    return rings
  }
  // No lot reaches into the first NEAR_FT beside any other part of any street
  // — that band belongs to the lots fronting there — and no lot takes ground a
  // lot already cut has: each cut is also less everything taken so far.
  const bulbDirOf = (rd: Road): P => norm([rd.bulb![0] - rd.pts[rd.pts.length - 2][0], rd.bulb![1] - rd.pts[rd.pts.length - 2][1]])
  const bulbRayOf = (rd: Road) => { const d = bulbDirOf(rd), m = leftOf(d); return (ang: number): P => [m[0] * Math.sin(ang) + d[0] * Math.cos(ang), m[1] * Math.sin(ang) + d[1] * Math.cos(ang)] }
  const nearBand = union([
    ...roads.flatMap(rd => [...stripRings(rd, 1, 0, rd.len, NEAR_FT), ...stripRings(rd, -1, 0, rd.len, NEAR_FT)]),
    ...roads.filter(rd => rd.bulb).map(rd => clipWhere(circle(rd.bulb!, bulbR + NEAR_FT), p => dot(p, rd.bulb!, bulbDirOf(rd)))),
  ])
  let taken: MP = []
  const finish = (mp: MP, own: MP): P[] =>
    largestRing(difference(difference(difference(intersection(mp, parcel), corridor), difference(nearBand, own)), taken))
  const strip = (rd: Road, side: 1 | -1, a: number, e: number): P[] => {
    const rings = stripRings(rd, side, a, e)
    if (!rings.length) return []
    const own = union(stripRings(rd, side, Math.max(0, a - 1), Math.min(rd.len, e + 1), NEAR_FT))
    return finish(union(rings), own)
  }
  const wedge = (rd: Road, a0: number, a1: number): P[] => {
    if (!rd.bulb) return []
    const bulbRay = bulbRayOf(rd)
    const fan: P[] = [rd.bulb]
    const steps = 6
    for (let i = steps; i >= 0; i--) fan.push(add(rd.bulb, bulbRay(a0 + (a1 - a0) * i / steps), rd.lotDepthFt ?? DEPTH))
    const ownFan: P[] = [rd.bulb]
    for (let i = steps; i >= 0; i--) ownFan.push(add(rd.bulb, bulbRay(a0 - 0.02 + (a1 - a0 + 0.04) * i / steps), bulbR + NEAR_FT))
    return finish(asMP(fan), asMP(ownFan))
  }
  /** Boundary length of the lot that lies on any street's R/W line. */
  const frontageOf = (ring: P[]): number => {
    const onStreet = (p: P) => {
      for (const rd of roads) {
        for (let i = 0; i + 1 < rd.pts.length; i++) if (segDist(p, rd.pts[i], rd.pts[i + 1]) <= rd.rightOfWayFt / 2 + 0.5) return true
        if (rd.bulb && dist(p, rd.bulb) <= bulbR + 0.5) return true
      }
      return false
    }
    let len = 0
    for (let i = 0; i < ring.length; i++) {
      const p = ring[i], q = ring[(i + 1) % ring.length]
      if (onStreet(p) && onStreet(q) && onStreet([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2])) len += dist(p, q)
    }
    return len
  }
  const check = (l: Lot): Lot => {
    const problems: string[] = []
    if (l.sqFt < std.minArea) problems.push(`net area ${l.sqFt.toFixed(0)} < ${std.minArea} sf`)
    if (l.widthFt < std.minWidth - 0.5) problems.push(`width ${l.widthFt.toFixed(1)} < ${std.minWidth} ft`)
    if (l.frontageFt < std.minFrontage - 0.5) problems.push(`frontage ${l.frontageFt.toFixed(1)} < ${std.minFrontage} ft`)
    return { ...l, problems, ok: problems.length === 0 }
  }
  const backs = (ring: P[]) => ring.some(p => Math.abs(dot(p, A, n)) < 3)
  const mkLot = (ring: P[], fronts: string, widthDir: P): Lot =>
    check({ ring, sqFt: Math.abs(area(ring)), widthFt: extentAlong(ring, ring[0], widthDir), frontageFt: frontageOf(ring), fronts, ok: false, problems: [], backsOntoExisting: backs(ring) })

  const lots: Lot[] = []
  for (const rd of roads) {
  const end = rd.len
  for (const side of [1, -1] as const) {
    const sideName = side === 1 ? 'LEFT' : 'RIGHT'
    let cursor = 0
    const made: { a: number; e: number; ring: P[] }[] = []
    while (cursor < end - 1) {
      let e = Math.min(cursor + std.minWidth, end), ring = strip(rd, side, cursor, e)
      if (!ring.length) { cursor += 5; continue }
      let a = Math.abs(area(ring))
      // widen by the shortfall, then trim back in 5-ft steps so the lot is not fatter than it must be
      if (a < std.minArea) {
        let w = std.minWidth
        for (let k = 0; k < 6 && a < std.minArea && e < end - 1e-6; k++) {
          w = Math.min(w * Math.max(1.05, std.minArea / Math.max(a, 1)) + 2, end - cursor)
          e = cursor + w; ring = strip(rd, side, cursor, e); a = Math.abs(area(ring))
        }
        for (;;) {
          const e2 = e - 5
          if (e2 - cursor < std.minWidth) break
          const r2 = strip(rd, side, cursor, e2)
          if (!r2.length || Math.abs(area(r2)) < std.minArea) break
          e = e2; ring = r2; a = Math.abs(area(r2))
        }
      }
      made.push({ a: cursor, e, ring })
      taken = union([...taken.map(poly => openRing(poly[0] as P[])), ring])
      cursor = e
    }
    if (made.length > 1 && Math.abs(area(made[made.length - 1].ring)) < std.minArea) {
      const tail = made.pop()!, prev = made.pop()!
      taken = difference(taken, union([prev.ring, tail.ring]))
      // first try two equal lots over the pair; only then one
      const midS = (prev.a + tail.e) / 2
      const r1 = strip(rd, side, prev.a, midS), r2 = r1.length ? (taken = union([...taken.map(poly => openRing(poly[0] as P[])), r1]), strip(rd, side, midS, tail.e)) : []
      if (r1.length && r2.length && Math.abs(area(r1)) >= std.minArea && Math.abs(area(r2)) >= std.minArea && midS - prev.a >= std.minWidth) {
        made.push({ a: prev.a, e: midS, ring: r1 }, { a: midS, e: tail.e, ring: r2 })
        taken = union([...taken.map(poly => openRing(poly[0] as P[])), r2])
      } else {
        if (r1.length) taken = difference(taken, asMP(r1))
        const merged = strip(rd, side, prev.a, tail.e)
        if (merged.length) { made.push({ a: prev.a, e: tail.e, ring: merged }); taken = union([...taken.map(poly => openRing(poly[0] as P[])), merged]) }
        else { made.push(prev, tail); taken = union([...taken.map(poly => openRing(poly[0] as P[])), prev.ring, tail.ring]) }
      }
    }
    for (const m of made) {
      if (!m.ring.length) continue
      const mid = (m.a + m.e) / 2
      const i = Math.max(0, rd.cum.findIndex(c => c > mid) - 1)
      const seg = rd.segs[i]
      const where = rd.id !== 'main' ? rd.id.toUpperCase() : seg.kind === 'arc' ? `CURVE ${rd.curves[seg.curve].id}` : seg.curve === 0 ? 'ENTRANCE' : seg.curve === -1 ? 'LAST RUN' : `RUN ${seg.curve}`
      lots.push(mkLot(m.ring, `PROPOSED STREET (${where}, ${sideName} SIDE)`, segDir(rd, i)))
    }
  }
  }
  // each bulb: pie wedges beyond the centre, as many as conform
  for (const rd of roads) {
    if (!rd.bulb) continue
    const bulbRay = bulbRayOf(rd)
    let best: Lot[] = [], bestOk = -1
    const takenBefore = taken
    for (let k = 1; k <= 5; k++) {
      const wedges: Lot[] = []
      taken = takenBefore
      for (let i = 0; i < k; i++) {
        const a0 = -Math.PI / 2 + Math.PI * i / k, a1 = -Math.PI / 2 + Math.PI * (i + 1) / k
        const ring = wedge(rd, a0, a1)
        if (!ring.length) continue
        wedges.push(mkLot(ring, `PROPOSED STREET (${rd.id === 'main' ? '' : rd.id.toUpperCase() + ' '}CUL-DE-SAC)`, leftOf(bulbRay((a0 + a1) / 2))))
        taken = union([...taken.map(poly => openRing(poly[0] as P[])), ring])
      }
      const ok = wedges.filter(x => x.ok).length
      if (ok > bestOk || (ok === bestOk && wedges.length < best.length)) { bestOk = ok; best = wedges }
    }
    taken = takenBefore
    for (const w of best) taken = union([...taken.map(poly => openRing(poly[0] as P[])), w.ring])
    lots.push(...best)
  }

  // Ground no lot took — a sliver at a tip, the far side of a bend — goes to
  // the neighbour it shares the longest line with, when the two make one ring.
  const rowInParcel = intersection(corridor, parcel)
  const orphans = difference(difference(parcel, corridor), union(lots.map(l => l.ring)))
  for (const poly of orphans) {
    const ring = openRing(poly[0] as P[])
    const a = Math.abs(area(ring))
    if (a < 50) continue
    let bestI = -1, bestShared = 0
    lots.forEach((l, i) => {
      let shared = 0
      for (let k = 0; k < ring.length; k++) {
        const p = ring[k], q = ring[(k + 1) % ring.length], m: P = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
        const near = (x: P) => l.ring.some((_, j) => segDist(x, l.ring[j], l.ring[(j + 1) % l.ring.length]) < 0.05)
        if (near(p) && near(q) && near(m)) shared += dist(p, q)
      }
      if (shared > bestShared) { bestShared = shared; bestI = i }
    })
    if (bestI < 0 || bestShared < 5) continue
    const merged = union([lots[bestI].ring, ring])
    if (merged.length !== 1 || merged[0].length !== 1) continue
    const l = lots[bestI]
    lots[bestI] = check({ ...l, ring: clean(openRing(merged[0][0] as P[])), sqFt: l.sqFt + a })
  }
  // A lot that does not conform joins the neighbour it shares the longest line
  // with, when the two make one ring — a corner sliver is nobody's building lot.
  for (let pass = 0; pass < 3; pass++) {
    const bad = lots.findIndex(l => !l.ok)
    if (bad < 0) break
    const ring = lots[bad].ring
    let bestI = -1, bestShared = 0
    lots.forEach((l, i) => {
      if (i === bad) return
      let shared = 0
      for (let k = 0; k < ring.length; k++) {
        const p = ring[k], q = ring[(k + 1) % ring.length], m: P = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
        const near = (x: P) => l.ring.some((_, j) => segDist(x, l.ring[j], l.ring[(j + 1) % l.ring.length]) < 0.05)
        if (near(p) && near(q) && near(m)) shared += dist(p, q)
      }
      if (shared > bestShared) { bestShared = shared; bestI = i }
    })
    if (bestI < 0 || bestShared < 5) break
    const merged = union([lots[bestI].ring, ring])
    if (merged.length !== 1 || merged[0].length !== 1) break
    const l = lots[bestI]
    lots[bestI] = check({ ...l, ring: clean(openRing(merged[0][0] as P[])), sqFt: l.sqFt + lots[bad].sqFt, frontageFt: l.frontageFt + lots[bad].frontageFt, backsOntoExisting: l.backsOntoExisting || lots[bad].backsOntoExisting })
    lots.splice(bad, 1)
  }
  // Does the street reach the reserved parcel (so it has frontage for access and maintenance)?
  const streetTouchesKeepOut = keepOut.some(ring => mpArea(intersection(union(roads.flatMap(rd => [...corridorOf(rd.pts, rd.rightOfWayFt / 2 + 2), ...(rd.bulb ? [circle(rd.bulb, bulbR + 2)] : [])])), asMP(ring))) > 1)
  const rowSqFt = mpArea(rowInParcel)
  return {
    lots, road, roads, streetTouchesKeepOut,
    centrelines: roads.map(rd => rd.pts),
    rowRings: rowInParcel.map(poly => openRing(poly[0] as P[])),
    pavementRings: intersection(pavement, parcel).map(poly => openRing(poly[0] as P[])),
    rowSqFt, params,
    leftoverSqFt: Math.abs(area(tract)) - rowSqFt - lots.reduce((s, l) => s + l.sqFt, 0),
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const argv = process.argv.slice(2)
  const flag = (k: string) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined }
  const positional = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')))
  const [address, outDir] = positional
  if (!address || !outDir) { console.error('usage: propose-subdivision.ts "<street address>" <out dir> [--recorded-acres N] [--case ID]'); process.exit(1) }
  const recordedAcres = flag('--recorded-acres') ? Number(flag('--recorded-acres')) : null
  const caseNumber = flag('--case') ?? null
  /** Which end of the frontage the entrance is at: the eastern or western tip, or either (searched). */
  const enterAt = (flag('--enter') ?? 'either') as 'east' | 'west' | 'either'
  const newStreetName = flag('--street') ?? 'PROPOSED PUBLIC STREET (NAME TBD)'
  /** A second street from the existing road, perpendicular, at this fraction of the frontage (0–1) or station in ft, running until it meets the main street (a T). The 2023 sheet's alley, widened. */
  const sideStreetAt = flag('--side-street') ? Number(flag('--side-street')) : null
  const sideStreetName = flag('--side-street-name') ?? 'STREET B'
  const SIDE_STREET = { rightOfWayFt: 50, pavementFt: 26 }   // a minor residential street; assumed section
  /** No separate stormwater parcel at the low corner (the 2023 sheet keeps its open space inside the loop). */
  const noSwmParcel = argv.includes('--no-swm-parcel')
  /** Make the lot on the inside of the street's sharpest bend PARKLAND / stormwater, as the 2023 sheet does. */
  const parklandCorner = argv.includes('--parkland-corner')
  /** Follow exactly this many rear edges (the 2023 sheet's loop follows two); the bend-length penalty is dropped. */
  const edgesWanted = flag('--edges') ? Number(flag('--edges')) : null
  /** Which street families to search: 'l' (following the rear boundaries), 'spine', or 'both'. */
  const family = (flag('--family') ?? 'both') as 'l' | 'spine' | 'both'
  /** Longest total length of curve the street may have, ft — a short bend was asked for. */
  const maxCurveFt = flag('--max-curve-ft') ? Number(flag('--max-curve-ft')) : Infinity
  const streetLabel = newStreetName.toUpperCase().replace(/\bCT\b/, 'COURT').replace(/\bRD\b/, 'ROAD').replace(/\bDR\b/, 'DRIVE')
  mkdirSync(outDir, { recursive: true })

  const site = await resolvePgAtlasSite(address, {})
  if (!site?.parcel) throw new Error(`No parcel for "${address}" — nothing is proposed on an invented boundary.`)
  const zone = site.zoning?.zoneCode ?? ''
  const ring = openRing(site.parcel.ring.coordinates as P[])
  const subjRec = await fetchPgAtlasPropertyRecord(...(ring.reduce((a, p) => [a[0] + p[0] / ring.length, a[1] + p[1] / ring.length], [0, 0]) as P))
  if (subjRec) console.log(`    record: ${subjRec.ownerName ?? '?'} · acct ${subjRec.account ?? '?'} · ${subjRec.propertyDesc ?? ''} ${subjRec.subdivision ?? ''} · plat ${subjRec.plat ?? 'none'} · L.${subjRec.liber ?? '?'} F.${subjRec.folio ?? '?'} · ${subjRec.acres ?? '?'} ac (assessment)`)
  const ccw = area(ring) > 0 ? ring : ring.slice().reverse()
  const parcelSqFt = Math.abs(area(ccw))
  const recordedSqFt = recordedAcres ? recordedAcres * 43560 : null

  const minArea = standard(zone, 'Net lot area, min.'), minWidth = standard(zone, 'Lot width, min.')
  const minFrontage = standard(zone, 'Lot frontage') ?? 50, maxDensity = standard(zone, 'Density, max.')
  const frontYard = standard(zone, 'Front yard depth') ?? 25, sideYard = standard(zone, 'Side yard depth') ?? 8
  if (!minArea || !minWidth) throw new Error(`Zone ${zone} has no certified lot standards in the dimensional table.`)
  const std: Std = { minArea, minWidth, minFrontage }

  console.log(`\n=== ${site.address.matchedAddress} — proposed subdivision (one entrance, street a tier in from the rear boundaries, cul-de-sac) ===`)
  console.log(`    parcel ${site.parcel.propId}  GIS ${parcelSqFt.toFixed(0)} sf (${(parcelSqFt / 43560).toFixed(4)} ac)`
    + (recordedSqFt ? `  RECORDED ${recordedSqFt.toFixed(0)} sf (${recordedAcres} ac) — differ by ${(parcelSqFt - recordedSqFt).toFixed(0)} sf; neither moved` : '')
    + `  zone ${zone}${caseNumber ? `  case ${caseNumber}` : ''}`)
  console.log(`    standards: min lot ${minArea} sf · width ${minWidth} ft · frontage ${minFrontage} ft · density ${maxDensity} du/ac (net)`)

  const sp = site.streetPoint as P | null
  if (!sp) throw new Error('No fronting street established (Sec. 24-128).')
  let best = { i: 0, d: Infinity }
  for (let i = 0; i < ccw.length; i++) {
    const d = segDist(sp, ccw[i], ccw[(i + 1) % ccw.length])
    if (d < best.d) best = { i, d }
  }
  const A = ccw[best.i], B = ccw[(best.i + 1) % ccw.length]
  const L = dist(A, B)
  const u: P = [(B[0] - A[0]) / L, (B[1] - A[1]) / L], n = leftOf(u)
  const f: Frame = { A, B, L, u, n, ccw }
  const existingStreet = site.streets[0]?.name ?? 'street'
  console.log(`    frontage on ${existingStreet}: ${L.toFixed(1)} ft; entrance at its centre, station ${(L / 2).toFixed(0)} ft`)

  // Wheeler Road is an 80' R/W per master plan (2023 layout sheet). Where the
  // parcel line sits closer than 40' to the county centreline the difference is
  // a strip to be dedicated at platting; it is kept out of every lot here.
  const mid: P = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]
  let toCentre = Infinity
  for (const st of site.streets) for (const path of st.paths) for (let i = 0; i + 1 < path.length; i++)
    toCentre = Math.min(toCentre, segDist(mid, path[i] as P, path[i + 1] as P))
  const dedFt = Number.isFinite(toCentre) ? Math.max(0, Math.round((MASTER_PLAN_ROW_FT / 2 - toCentre) * 10) / 10) : 0
  const tract = dedFt > 0 ? clipWhere(ccw, p => dot(p, A, n) - dedFt) : ccw
  const dedRing = dedFt > 0 ? clipWhere(ccw, p => dedFt - dot(p, A, n)) : []
  console.log(`    ${existingStreet} centreline ${Number.isFinite(toCentre) ? toCentre.toFixed(1) + ' ft' : 'NOT FOUND'} from the parcel line; master plan ${MASTER_PLAN_ROW_FT}' R/W → dedication strip ${dedFt} ft (${dedRing.length ? Math.abs(area(dedRing)).toFixed(0) : 0} sf)`)

  // ── Stormwater: the low corner, the soils, the volume, the parcel ─────────
  const ext = ccw.reduce((e, p) => ({ x0: Math.min(e.x0, p[0]), x1: Math.max(e.x1, p[0]), y0: Math.min(e.y0, p[1]), y1: Math.max(e.y1, p[1]) }), { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity })
  const centre: P = [(ext.x0 + ext.x1) / 2, (ext.y0 + ext.y1) / 2]
  let contours: PgContourResult | null = null
  try { contours = await fetchPgContours(centre[0], centre[1], { radiusFt: Math.hypot(ext.x1 - ext.x0, ext.y1 - ext.y0) / 2 + 60 }) }
  catch (e) { console.log(`    contours: NOT AVAILABLE (${(e as Error).message})`) }
  const soils = await fetchSoilMapUnits('prince_georges_md').catch(() => null)
  const hsgs = [...new Set((soils?.units ?? []).map(u => u.hydrologicGroup).filter((g): g is string => !!g))].sort()
  const elevAt = (p: P): number | null => {
    if (!contours?.contours.length) return null
    let bestD = Infinity, bestE: number | null = null
    for (const c of contours.contours) for (const q of c.path) { const d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2; if (d < bestD) { bestD = d; bestE = c.elevationFt } }
    return bestE
  }
  const vertexEl = tract.map(p => elevAt(p))
  let lowI = -1
  vertexEl.forEach((e, i) => { if (e !== null && (lowI < 0 || e < (vertexEl[lowI] as number))) lowI = i })
  const relief = contours ? { min: Math.min(...vertexEl.filter((e): e is number => e !== null)), max: Math.max(...vertexEl.filter((e): e is number => e !== null)) } : null
  if (contours) console.log(`    contours: ${contours.contours.length} (${contours.source.layer}); tract corners ${relief!.min}–${relief!.max} ft ${contours.verticalDatum}; low corner at ${bearingOf(centre, tract[lowI])} of centre${contours.truncated ? ' — RESPONSE TRUNCATED' : ''}`)
  console.log(`    soils: ${soils ? `${soils.areaSymbol} ${soils.units.length} map units, HSG ${hsgs.join(', ') || '?'}` : 'NOT AVAILABLE'}`)

  // Size for the density-cap lot count and a street of about the frontage's length; re-stated for the actual layout below.
  const swmSize = (lotCount: number, pavementSqFt: number, streetLengthFt: number) => {
    const impervious = lotCount * SWM.lotImperviousSqFt + pavementSqFt + streetLengthFt * SWM.sidewalkFtPerFtOfStreet
    const pct = 100 * impervious / parcelSqFt
    const wq = waterQualityVolume(SWM.rainfallTargetIn, pct, parcelSqFt / 43560)
    const fp = practiceFootprint(wq.value.wqvCubicFeet, SWM.pondingDepthFt, SWM.voidRatio)
    return { imperviousSqFt: Math.round(impervious), percentImpervious: Math.round(pct * 10) / 10, rv: wq.value.rv, esdvCf: wq.value.wqvCubicFeet, footprintSqFt: fp.value.footprintSqFt,
      parcelSqFt: Math.max(SWM.minParcelSqFt, Math.round(fp.value.footprintSqFt * SWM.parcelOverFootprint)) }
  }
  const capGrossEarly = maxDensity ? Math.floor(maxDensity * (recordedSqFt ?? parcelSqFt) / 43560) : 20
  const swmEst = swmSize(capGrossEarly, STREET.pavementFt * L * 0.9 + Math.PI * STREET.bulbPavementRadiusFt ** 2, L * 0.9)
  let swmRing: P[] = [], tractForLots = tract
  if (lowI >= 0 && !noSwmParcel) {
    const low = tract[lowI]
    const tc = tract.reduce((a, p) => [a[0] + p[0] / tract.length, a[1] + p[1] / tract.length], [0, 0] as P)
    const dir = norm([tc[0] - low[0], tc[1] - low[1]])
    let lo = 0, hi = dist(low, tc)
    for (let k = 0; k < 40; k++) {   // the cut across the corner that takes the parcel's area
      const d = (lo + hi) / 2
      const r = clipWhere(tract, p => d - dot(p, low, dir))
      if (Math.abs(area(r)) < swmEst.parcelSqFt) lo = d; else hi = d
    }
    swmRing = clipWhere(tract, p => hi - dot(p, low, dir))
    tractForLots = clipWhere(tract, p => dot(p, low, dir) - hi)
  }
  console.log(`    stormwater (preliminary, ${capGrossEarly} lots): impervious ${swmEst.imperviousSqFt} sf (${swmEst.percentImpervious}%), Rv ${swmEst.rv}, ESDv ${swmEst.esdvCf} cf at P_E ${SWM.rainfallTargetIn} in → practice ${swmEst.footprintSqFt} sf → PARCEL A ${swmRing.length ? Math.abs(area(swmRing)).toFixed(0) + ' sf reserved at the low corner' : 'NOT PLACED (no contours)'}`)

  // Rear edges, from B round to A, merged where nearly straight; the two longest set the runs.
  const rear: { p0: P; p1: P; d: P; len: number }[] = []
  const iB = (best.i + 1) % ccw.length
  for (let k = 0; k < ccw.length - 1; k++) {
    const p0 = ccw[(iB + k) % ccw.length], p1 = ccw[(iB + k + 1) % ccw.length]
    const d = norm([p1[0] - p0[0], p1[1] - p0[1]]), len = dist(p0, p1)
    const last = rear[rear.length - 1]
    if (last && Math.acos(Math.max(-1, Math.min(1, last.d[0] * d[0] + last.d[1] * d[1]))) < 12 * Math.PI / 180) {
      last.p1 = p1; last.len = dist(last.p0, p1); last.d = norm([p1[0] - last.p0[0], p1[1] - last.p0[1]])
    } else rear.push({ p0, p1, d, len })
  }
  const longest = rear.map((e, i) => ({ e, i })).sort((x, y) => y.e.len - x.e.len).slice(0, 2).sort((x, y) => x.i - y.i)
  if (longest.length < 2) throw new Error('Fewer than two rear boundary edges — the L-street template does not apply.')
  const [edgeNearB, edgeNearA] = [longest[0].e, longest[1].e]
  console.log(`    rear edges: ${rear.length}; runs follow the ${edgeNearB.len.toFixed(0)}-ft edge (${bearingOf(edgeNearB.p0, edgeNearB.p1)}) and the ${edgeNearA.len.toFixed(0)}-ft edge (${bearingOf(edgeNearA.p0, edgeNearA.p1)})`)

  const bulbR = STREET.bulbRightOfWayRadiusFt
  const capGross = maxDensity ? Math.floor(maxDensity * (recordedSqFt ?? parcelSqFt) / 43560) : Infinity
  const signedAngle = (a: P, b: P) => Math.atan2(cross(a, b, [0, 0]), a[0] * b[0] + a[1] * b[1]) * 180 / Math.PI
  const lineMeet = (o: P, d: P, q: P, e: P): number | null => {   // t with o + d·t on the line (q, e)
    const den = d[0] * e[1] - d[1] * e[0]
    if (Math.abs(den) < 1e-9) return null
    return ((q[0] - o[0]) * e[1] - (q[1] - o[1]) * e[0]) / den
  }
  const score = (c: Layout) => Math.min(c.lots.filter(l => l.ok).length, capGross) * 1000 - c.leftoverSqFt / 1000 - c.lots.filter(l => !l.ok).length * 60 - c.rowSqFt / 4000
    - (c.params.radiusFt < STREET.curveRadiusFt ? 400 : 0) + (c.streetTouchesKeepOut ? 400 : 0)
    - (edgesWanted != null ? 0 : 3 * c.road.curves.reduce((t, cv) => t + cv.lengthFt, 0))    // a long bend is worth a third of a lot per 100 ft, unless the bends were asked for
  const rejectedSide: Record<string, number> = {}
  /** The side street: from the existing road at `station`, perpendicular, to where it meets the main street. */
  const buildSideStreet = (main: Road, station: number): Road | null => {
    const o2 = add(A, u, station)
    let hit: P | null = null, hitT = Infinity
    for (let i = 0; i + 1 < main.pts.length; i++) {
      const a = main.pts[i], b = main.pts[i + 1]
      const dx = b[0] - a[0], dy = b[1] - a[1]
      const den = n[0] * dy - n[1] * dx
      if (Math.abs(den) < 1e-9) continue
      const t = ((a[0] - o2[0]) * dy - (a[1] - o2[1]) * dx) / den
      const w = ((a[0] - o2[0]) * n[1] - (a[1] - o2[1]) * n[0]) / den
      if (w >= 0 && w <= 1 && t > 60 && t < hitT) { hitT = t; hit = add(o2, n, t) }
    }
    const dbg = (why: string) => { if (process.env.DEBUG_SIDE) { rejectedSide[why] = (rejectedSide[why] ?? 0) + 1 } return null }
    if (Math.abs(dot(main.pts[0], A, u) - station) < 120) return dbg('entrance spacing')   // two entrances under 120 ft apart is not an intersection spacing
    /** A turnaround short of the main street's ground (or of the boundary), when there is no T to make. */
    const stub = (): Road | null => {
      const reach = reachAlong(f, o2, n)
      let len = reach - STREET.bulbRightOfWayRadiusFt - 15
      if (hit) len = Math.min(len, hitT - main.rightOfWayFt / 2 - STREET.bulbRightOfWayRadiusFt - 15)
      // and clear of the main street's corridor anywhere along it
      for (let k = 0; k < 40; k++) {
        const bulb = add(o2, n, len)
        let dMin = Infinity
        for (let i = 0; i + 1 < main.pts.length; i++) dMin = Math.min(dMin, segDist(bulb, main.pts[i], main.pts[i + 1]))
        if (dMin >= STREET.bulbRightOfWayRadiusFt + main.rightOfWayFt / 2 + 10) break
        len -= 10
      }
      if (len < 150) return dbg('too short for a cul-de-sac')
      const bulb = add(o2, n, len)
      return { pts: [o2, bulb], cum: [0, len], len, segs: [{ kind: 'straight', curve: -1 }], curves: [], bulb, id: sideStreetName, rightOfWayFt: SIDE_STREET.rightOfWayFt, pavementFt: SIDE_STREET.pavementFt, lotDepthFt: 150, nearerIn: [] }
    }
    if (!hit) return stub()
    // The T must land on a straight run of the main street, clear of its bends and its bulb.
    let hs = 0, hi = -1
    for (let i = 0; i + 1 < main.pts.length; i++) if (segDist(hit, main.pts[i], main.pts[i + 1]) < 0.5) { hi = i; hs = main.cum[i] + dist(main.pts[i], hit); break }
    if (hi < 0 || main.segs[hi].kind !== 'straight') { dbg('T on a curve'); return stub() }
    for (const c of main.curves) { const pcS = main.cum[main.pts.findIndex(q => q === c.pc)] ?? 0, ptS = main.cum[main.pts.findIndex(q => q === c.pt)] ?? 0; if (hs > pcS - 60 && hs < ptS + 60) { dbg('T near a curve'); return stub() } }
    if (main.bulb && main.len - hs < 120) { dbg('T near the bulb'); return stub() }
    const pts: P[] = [o2, hit]
    return { pts, cum: [0, hitT], len: hitT, segs: [{ kind: 'straight', curve: -1 }], curves: [], id: sideStreetName, rightOfWayFt: SIDE_STREET.rightOfWayFt, pavementFt: SIDE_STREET.pavementFt, lotDepthFt: 150, nearerIn: [] }
  }
  const tryLayout = (pr: RoadParams): Layout | null => {
    const road = buildRoad(f, pr)
    if (road && road.curves.reduce((t, c) => t + c.lengthFt, 0) > maxCurveFt) return null
    if (!road) return null
    if (sideStreetAt == null) return layoutRoad(f, tractForLots, [road], pr, std, swmRing.length ? [swmRing] : [])
    // The side street's lots are cut first, so it serves a full row each side; its station is searched around the one asked for.
    let bestSide: Layout | null = null
    for (const dv of [0, -0.05, 0.05, -0.1, 0.1, -0.15, -0.2]) {
      const st = (sideStreetAt <= 1 ? sideStreetAt * L : sideStreetAt) + dv * L
      const side = buildSideStreet(road, st)
      if (!side) continue
      const cand = layoutRoad(f, tractForLots, [side, road], pr, std, swmRing.length ? [swmRing] : [])
      if (cand && (!bestSide || score(cand) > score(bestSide))) bestSide = cand
    }
    return bestSide
  }
  type Edge = typeof rear[number]
  /** Road params: enter at `station`, then run parallel to each edge in turn at its offset, the bulb `short` ft before the boundary. */
  const paramsFor = (station: number, follow: { E: Edge; dir: 1 | -1; off: number }[], short: number, R: number): RoadParams | string =>
    paramsForLines(station, follow.map(x => ({ q: add(x.E.p0, leftOf(x.E.d), x.off), d: [x.E.d[0] * x.dir, x.E.d[1] * x.dir] as P })), short, R)   // inward normal: the ring is CCW
  const paramsForLines = (station: number, lines: { q: P; d: P }[], short: number, R: number, entrySkewDeg = 0): RoadParams | string => {
    const o1 = add(A, u, station)
    const n0 = rot(n, entrySkewDeg)
    const stem = lineMeet(o1, n0, lines[0].q, lines[0].d)
    if (stem === null || stem < 100) return 'stem'
    let v = add(o1, n0, stem), dPrev = n0
    const legs: RoadParams['legs'] = []
    for (let k = 0; k < lines.length; k++) {
      const d = lines[k].d
      const run = k + 1 < lines.length ? lineMeet(v, d, lines[k + 1].q, lines[k + 1].d) : reachAlong(f, v, d) - bulbR - 15 - short
      if (run === null || run < 60) return `run${k + 1}`
      legs.push({ turnDeg: signedAngle(dPrev, d), runFt: run })
      v = add(v, d, run); dPrev = d
    }
    return { stationFt: station, stemFt: stem, radiusFt: R, entrySkewDeg, legs }
  }
  let bestLayout: Layout | null = null, bestScore = -Infinity, tried = 0
  const t0 = Date.now()
  if (process.env.LAYOUT) {   // station,stem,R,turn1,run1[,turn2,run2...]
    const v = process.env.LAYOUT.split(',').map(Number)
    const legs: RoadParams['legs'] = []
    for (let i = 3; i + 1 < v.length; i += 2) legs.push({ turnDeg: v[i], runFt: v[i + 1] })
    bestLayout = tryLayout({ stationFt: v[0], stemFt: v[1], radiusFt: v[2], entrySkewDeg: Number(process.env.ENTRY_SKEW ?? 0), legs })
    console.log(`    forced layout ${process.env.LAYOUT}`)
  } else {
    // The edges the street follows: from the entrance end round the tract, skipping edges too short to run beside.
    const followable = (edges: Edge[]) => edges.filter(e => e.len >= 300).slice(0, 3)   // a short jog in the boundary is cut across, not followed
    const fromA = followable(rear.slice().reverse()).map(E => ({ E, dir: -1 as const }))
    const fromB = followable(rear).map(E => ({ E, dir: 1 as const }))
    const aIsEast = A[0] > B[0]
    const allOptions = [
      { name: `enter near A (${aIsEast ? 'east' : 'west'} tip)`, tip: aIsEast ? 'east' : 'west', edges: fromA, stations: [] as number[] },
      { name: `enter near B (${aIsEast ? 'west' : 'east'} tip)`, tip: aIsEast ? 'west' : 'east', edges: fromB, stations: [] as number[] },
    ]
    for (let st = 120; st <= L / 2; st += 24) { allOptions[0].stations.push(st); allOptions[1].stations.push(L - st) }
    const options = allOptions.filter(o => enterAt === 'either' || o.tip === enterAt)
    console.log(`    entrance: ${enterAt} → ${options.map(o => o.name).join(' / ')}`)
    const offs = [130, 160, 190, 220, 250, 280]
    const rejected: Record<string, number> = {}
    const offsetCombos = (k: number): number[][] => k === 0 ? [[]] : offsetCombos(k - 1).flatMap(c => offs.map(o => [...c, o]))
    for (const opt of options) {
      let optBest = 0
      // follow all its edges, or all but the last (the road stops short of the far edge)
      for (const nEdges of [opt.edges.length, opt.edges.length - 1]) {
        if (nEdges < 1 || family === 'spine') continue
        if (edgesWanted != null && nEdges !== edgesWanted) continue
        for (const station of opt.stations) for (const offsets of offsetCombos(nEdges)) for (const short of [0, 60, 120]) for (const R of [STREET.curveRadiusFt, 100]) {
          const pr = paramsFor(station, opt.edges.slice(0, nEdges).map((e, i) => ({ ...e, off: offsets[i] })), short, R)
          if (typeof pr === 'string') { rejected[pr] = (rejected[pr] ?? 0) + 1; continue }
          const cand = tryLayout(pr)
          if (!cand) { rejected.road = (rejected.road ?? 0) + 1; continue }
          tried++
          const sc = score(cand)
          optBest = Math.max(optBest, cand.lots.filter(l => l.ok).length)
          if (sc > bestScore) { bestScore = sc; bestLayout = cand }
        }
      }
      // A SPINE: one run from the entrance angled across the tract toward the far tip, so the only
      // bend is the entrance curve (shorter than rounding a boundary corner). Its line is the
      // frontage offset `off` in, turned `skew` degrees into the tract.
      if (family !== 'l') {
        const towardFar: P = opt.edges === fromA ? [u[0], u[1]] : [-u[0], -u[1]]      // along the frontage, away from the entrance tip
        const into = cross(towardFar, n, [0, 0]) > 0 ? 1 : -1                          // rotating this way turns into the tract
        const entryToward = cross(n, towardFar, [0, 0]) > 0 ? 1 : -1              // tilting the stem this way leans it toward the far tip
        for (const station of opt.stations) for (const off of [150, 190, 230, 270]) for (const skew of [0, 10, 20, 30]) for (const entry of [0, 15]) for (const short of [0, 60, 120]) for (const R of [STREET.curveRadiusFt, 100]) {
          const d = rot(towardFar, into * skew)
          const q = add(add(A, u, L / 2), n, off)
          const pr = paramsForLines(station, [{ q, d }], short, R, entryToward * entry)
          if (typeof pr === 'string') { rejected[pr] = (rejected[pr] ?? 0) + 1; continue }
          const cand = tryLayout(pr)
          if (!cand) { rejected.road = (rejected.road ?? 0) + 1; continue }
          tried++
          const sc = score(cand)
          optBest = Math.max(optBest, cand.lots.filter(l => l.ok).length)
          if (sc > bestScore) { bestScore = sc; bestLayout = cand }
        }
      }
      console.log(`    ${opt.name} (${opt.edges.length} edges to follow): ${tried} layouts so far, best ${optBest} conforming (${((Date.now() - t0) / 1000).toFixed(0)} s); rejected ${JSON.stringify(rejected)}`)
    }
    if (bestLayout) {   // refine the entrance and the bulb around the best
      const p = bestLayout.params
      for (const ds of [-24, -12, 0, 12, 24]) for (const dr of [-40, -20, 0, 20]) {
        if (!ds && !dr) continue
        const legs = p.legs.map((l, i) => i === p.legs.length - 1 ? { ...l, runFt: l.runFt + dr } : l)
        const cand = tryLayout({ ...p, stationFt: p.stationFt + ds, legs })
        if (cand) { tried++; const sc = score(cand); if (sc > bestScore) { bestScore = sc; bestLayout = cand } }
      }
    }
  }
  if (process.env.DEBUG_SIDE) console.log(`    side street rejections ${JSON.stringify(rejectedSide)}`)
  if (!bestLayout) throw new Error('No layout fits.')
  const layout = bestLayout
  console.log(`    searched ${tried} layouts in ${((Date.now() - t0) / 1000).toFixed(0)} s`)

  const dedSqFt = dedRing.length ? Math.abs(area(dedRing)) : 0
  const swmSqFt = swmRing.length ? Math.abs(area(swmRing)) : 0
  const pavementSqFt = mpArea(union(layout.pavementRings))
  const swm = swmSize(layout.lots.length, pavementSqFt, layout.road.len)
  const swmShort = swmRing.length && swm.parcelSqFt > swmSqFt * 1.05
  console.log(`    PARCEL A ${layout.streetTouchesKeepOut ? 'fronts the proposed street' : 'has NO street frontage — access easement needed'}`)
  console.log(`    stormwater (as laid out, ${layout.lots.length} lots, pavement ${pavementSqFt.toFixed(0)} sf): impervious ${swm.imperviousSqFt} sf (${swm.percentImpervious}%), ESDv ${swm.esdvCf} cf → practice ${swm.footprintSqFt} sf; PARCEL A ${swmSqFt.toFixed(0)} sf${swmShort ? ' — SHORT of the ' + swm.parcelSqFt + ' sf wanted' : ''}`)
  // Parcel A is not a lot; net tract area for density excludes street dedication only (Sec. 27-4202 net lot area / net tract area).
  // PARKLAND at the inside of the sharpest bend — the 2023 sheet's open space in the corner of the loop,
  // which also takes the ESD practice. The lot is kept in the set as a parcel that is not a building lot.
  let parklandIdx = -1
  if (parklandCorner && layout.road.curves.length) {
    const sharpest = layout.road.curves.reduce((b, c) => c.deltaDeg > b.deltaDeg ? c : b, layout.road.curves[0])
    let bestD = Infinity
    layout.lots.forEach((l, i) => { const d = Math.min(...l.ring.map(q => dist(q, sharpest.centre))); if (d < bestD) { bestD = d; parklandIdx = i } })
    if (parklandIdx >= 0) console.log(`    PARKLAND: lot ${parklandIdx + 1} (${layout.lots[parklandIdx].sqFt.toFixed(0)} sf) at the inside of ${sharpest.id} becomes parkland / stormwater`)
  }
  const parklandRing = parklandIdx >= 0 ? clean(layout.lots[parklandIdx].ring) : []
  const netSqFt = parcelSqFt - layout.rowSqFt - dedSqFt
  const netRecordedSqFt = recordedSqFt ? recordedSqFt - layout.rowSqFt - dedSqFt : null
  const cap = maxDensity ? Math.floor(maxDensity * netSqFt / 43560) : Infinity
  const capRecorded = maxDensity && netRecordedSqFt ? Math.floor(maxDensity * netRecordedSqFt / 43560) : null
  const conforming = layout.lots.filter(l => l.ok)
  const pr = layout.params
  console.log(`\n    ${layout.lots.length} lots (${conforming.length} conform); entrance at station ${pr.stationFt.toFixed(0)} ft${pr.entrySkewDeg ? ` skewed ${pr.entrySkewDeg}° off perpendicular` : ''}; stem ${pr.stemFt.toFixed(0)} ft; R ${pr.radiusFt} ft; `
    + pr.legs.map((l, i) => `C${i + 1} ${l.turnDeg.toFixed(1)}° then ${l.runFt.toFixed(0)} ft`).join('; ') + ` to the bulb; `
    + `R/W ${layout.rowSqFt.toFixed(0)} sf; net ${netSqFt.toFixed(0)} sf → cap ${cap} du` + (capRecorded !== null ? ` (recorded acreage: ${capRecorded})` : ''))
  layout.lots.forEach((l, i) => console.log(`      Lot ${String(i + 1).padStart(2)}: ${l.sqFt.toFixed(0).padStart(6)} sf  w ${l.widthFt.toFixed(1).padStart(6)}  fr ${l.frontageFt.toFixed(1).padStart(6)}  ${l.fronts}${l.backsOntoExisting ? ' · backs onto ' + existingStreet : ''}${l.ok ? '' : '  NOT CONFORMING — ' + l.problems.join('; ')}`))
  console.log(`      leftover ${layout.leftoverSqFt.toFixed(0)} sf`)
  const curves = layout.road.curves
  for (const c of curves) console.log(`      curve ${c.id}: R ${c.radiusFt}', Δ ${c.deltaDeg.toFixed(2)}°, T ${c.tangentFt.toFixed(2)}', L ${c.lengthFt.toFixed(2)}'`)
  if (layout.lots.length > cap) console.log(`    *** ${layout.lots.length} lots exceeds the density cap of ${cap}; drop to ${cap}.`)

  // ── Emit ──────────────────────────────────────────────────────────────────
  const slug = path.basename(outDir)
  const subdivisionName = `${site.address.matchedAddress} — PRELIMINARY SUBDIVISION CONCEPT`
  const provenance =
    'PRELIMINARY. Outer boundary from the Prince George\'s County parcel layer (PGAtlas Property/MapServer/15), '
    + 'compiled from tax maps — NOT a boundary survey and NOT a plat of record. Lot lines and streets are PROPOSED by Kealee. '
    + 'A Maryland licensed surveyor must establish the boundary before any plat is prepared.'
  const reference = { subdivisionName, recordedIn: 'NONE — no plat of record; preliminary concept' }
  const programme = { totalFloorAreaSqFt: 2400, storeys: 2, hasBasement: false, garage: 'attached_2_car', coveredPorch: true }
  const outerRing = [...ccw.slice(best.i), ...ccw.slice(0, best.i)]

  writeFileSync(path.join(outDir, `${slug}.plat.json`), JSON.stringify({
    _source: provenance, address: site.address.matchedAddress,
    reference: { ...reference, lot: 'outer boundary (county parcel)' },
    basisOfBearings: 'Maryland State Plane Coordinate System (NAD 83), from PGAtlas parcel geometry',
    pointOfBeginning: outerRing[0], recordedAreaSqFt: Math.round(recordedSqFt ?? parcelSqFt), programme,
    frontSetbackFt: frontYard, sideSetbackFt: sideYard,
    calls: courses(outerRing, i => i === 0 ? `frontage — ${existingStreet}` : `county parcel edge ${i + 1}`),
  }, null, 2))

  const notes = [
    'This drawing is a preliminary subdivision concept. It is not a plat, not a boundary survey, and not for recording.',
    'Street layout follows the 2023 "Wheeler Rd Subdivision Layout" sheet for this parcel (street a tier in from the north and east boundaries, lots both sides) with ONE entrance from Wheeler Road; the second entrance and the private alley on that sheet are omitted and the far end is finished as a cul-de-sac.',
    `Lot lines are proposed to meet Sec. 27-4202 ${zone}: minimum net lot area ${minArea} sq ft, minimum lot width ${minWidth} ft, minimum frontage ${minFrontage} ft, maximum density ${maxDensity} du/ac of net tract area.`,
    `All lots take access from ${streetLabel}. No lot takes access from ${existingStreet}; lots backing onto it are double-frontage lots and a no-access reservation along ${existingStreet} is anticipated at platting.`,
    'Boundary shown from the county parcel layer (Level 1). A field survey by a Maryland licensed surveyor governs.',
  ]
  if (recordedSqFt) notes.push(`Recorded acreage ${recordedAcres} ac (${recordedSqFt.toFixed(0)} sq ft) differs from the county GIS polygon (${parcelSqFt.toFixed(0)} sq ft) by ${(parcelSqFt - recordedSqFt).toFixed(0)} sq ft. Both are reported; neither is adjusted. The survey resolves it.`)
  if (caseNumber) notes.push(`Special exception ${caseNumber} is of record on this property. Its conditions have not been read into this concept and govern where they conflict.`)
  if (dedFt > 0) notes.push(`${existingStreet} is an ${MASTER_PLAN_ROW_FT}-ft right-of-way per the master plan; the parcel line is ${toCentre.toFixed(1)} ft from the county centreline, so a ${dedFt}-ft strip (${Math.abs(area(dedRing)).toFixed(0)} sq ft) along the frontage is shown for dedication and is excluded from every lot.`)
  if (layout.roads.length > 1) notes.push(`${layout.roads.slice(1).map(r => `${r.id.toUpperCase()} (${r.rightOfWayFt}' R/W, ${r.pavementFt}' pavement, ${Math.round(r.len)} ft)`).join('; ')}: a second public street from ${existingStreet} to ${streetLabel} in place of the 18-ft private alley on the 2023 layout sheet, so the lots between front a public street. Its section is assumed as a minor residential street; DPW&T standards govern.`)
  if (swmRing.length && !layout.streetTouchesKeepOut) notes.push('PARCEL A does not front the proposed street in this layout; a 20-ft access and maintenance easement across the adjoining lot is required at platting.')
  if (parklandRing.length) notes.push(`PARKLAND (${Math.abs(area(parklandRing)).toFixed(0)} sq ft) inside the bend of ${streetLabel} is open space and the site of the ESD stormwater practice, as the 2023 layout sheet places it; it is not a building lot.`)
  notes.push(`Water and sewer: every lot is served from ${streetLabel}; no service connects to ${existingStreet}. Proposed 8-in WSSC water main and 8-in sanitary sewer in ${streetLabel}, extended from the existing WSSC mains in ${existingStreet} at the entrance. As-built size, location, depth and flow direction of the ${existingStreet} mains are not read here.`)
  notes.push(`Stormwater management by Environmental Site Design to the maximum extent practicable (Md. Stormwater Management Act of 2007; MDE Design Manual Ch. 5; PGC Sec. 32-172). Preliminary ESD volume: ${swm.imperviousSqFt} sq ft impervious (${swm.percentImpervious}% of the tract: ${layout.lots.length} lots × ${SWM.lotImperviousSqFt} sq ft, ${pavementSqFt.toFixed(0)} sq ft pavement, sidewalks), Rv = ${swm.rv}, P_E = ${SWM.rainfallTargetIn} in → ESDv = ${swm.esdvCf} cu ft; micro-bioretention at ${SWM.pondingDepthFt} ft × n ${SWM.voidRatio} → ${swm.footprintSqFt} sq ft of practice. ${swmRing.length ? `PARCEL A (${swmSqFt.toFixed(0)} sq ft) is reserved at the low corner of the tract (${relief ? `corner elevations ${relief.min}–${relief.max} ft ${contours!.verticalDatum}` : 'contours unavailable'}) for the practice, its forebay and access; it is not a building lot.` : 'No stormwater parcel is placed: county contours were not available to find the low corner.'} Hydrologic soil group(s) ${hsgs.length ? hsgs.join(', ') : 'unknown'} per USDA SSURGO ${soils?.areaSymbol ?? ''} — P_E is to be taken from Table 5.3 for the site's group and % impervious; the ${SWM.rainfallTargetIn} in used here is the Manual's floor. Rooftop disconnection and a 6-ft infiltration berm along the rear of each lot, as the 2023 layout sheet's legend shows, are credited at concept plan and reduce the parcel; infiltration feasibility depends on the Sec. 32-131 soils investigation. A stormwater management concept approval from DPIE precedes preliminary plan.`)
  notes.push(`Proposed public street: ${STREET.note}${pr.radiusFt !== STREET.curveRadiusFt ? ` THIS LAYOUT USES A ${pr.radiusFt}-FT CENTRELINE RADIUS at its bends, below the 150 ft assumed above; confirm against the DPW&T minimum for a local street before preliminary plan.` : ''} Street dedication ${layout.rowSqFt.toFixed(0)} sq ft. Storm drainage, sanitary sewer capacity, street lighting and forest conservation are not designed here.`)

  writeFileSync(path.join(outDir, `${slug}.plat-record.json`), JSON.stringify({
    reference: `${subdivisionName}. Zone ${zone}${caseNumber ? `, ${caseNumber}` : ''}. Parcel ${site.parcel.propId}${subjRec ? ` — ${subjRec.propertyDesc ?? ''} ${subjRec.subdivision ?? ''}, owner of record ${subjRec.ownerName ?? 'not published'}, acct ${subjRec.account ?? '?'}, L. ${subjRec.liber ?? '?'} F. ${subjRec.folio ?? '?'}${subjRec.plat ? `, PLAT ${subjRec.plat} OF RECORD (not read — obtain it; it supersedes the GIS outline drawn here)` : ''}` : ''}, GIS ${parcelSqFt.toFixed(0)} sq ft${recordedSqFt ? `, recorded ${recordedAcres} ac` : ''}${subjRec?.acres ? `, assessment ${subjRec.acres} ac` : ''}. ${provenance}`,
    ownerOfRecord: subjRec,
    citation: 'PRELIMINARY CONCEPT — NO PLAT OF RECORD',
    notes, dedicationWidthFt: dedFt, adjoiners: [],
    dedications: dedRing.length ? [{ name: `${existingStreet} — ${MASTER_PLAN_ROW_FT}' R/W PER MASTER PLAN`, widthFt: dedFt, ring: dedRing, sqFt: Math.abs(area(dedRing)) }] : [],
    curveTable: curves.map(c => ({ curve: c.id, radiusFt: c.radiusFt, deltaDeg: Math.round(c.deltaDeg * 100) / 100, tangentFt: Math.round(c.tangentFt * 100) / 100, lengthFt: Math.round(c.lengthFt * 100) / 100, pc: c.pc, pt: c.pt })),
    stormwater: {
      method: 'MDE Stormwater Design Manual Ch. 5 — ESD: Rv = 0.05 + 0.009·I; ESDv = P_E·Rv·A/12; practice area = ESDv/(d·n)',
      rainfallTargetIn: SWM.rainfallTargetIn, hydrologicSoilGroups: hsgs, soilsSource: soils?.source ?? null,
      contoursSource: contours?.source ?? null, cornerElevationsFt: relief, lowCorner: lowI >= 0 ? tract[lowI] : null,
      ...swm, practice: SWM.practice, pondingDepthFt: SWM.pondingDepthFt, voidRatio: SWM.voidRatio,
      parcels: [
        ...(swmRing.length ? [{ name: 'PARCEL A — STORMWATER MANAGEMENT (ESD)', ring: swmRing, sqFt: Math.round(swmSqFt), practice: SWM.practice, footprintSqFt: swm.footprintSqFt, requiredVolumeCf: swm.esdvCf }] : []),
        ...(parklandRing.length ? [{ name: 'PARKLAND — OPEN SPACE AND STORMWATER MANAGEMENT (ESD)', ring: parklandRing, sqFt: Math.round(Math.abs(area(parklandRing))), practice: SWM.practice, footprintSqFt: swm.footprintSqFt, requiredVolumeCf: swm.esdvCf }] : []),
      ],
      perLot: ['rooftop disconnection (N-1)', '6-ft infiltration berm along the rear lot line (2023 sheet legend)'],
    },
    proposedStreets: [{
      name: streetLabel + (layout.roads.length > 1 ? ` AND ${layout.roads.filter(r => r.id !== 'main').map(r => r.id.toUpperCase()).join(', ')}` : ''),
      branches: layout.roads.map(r => ({ name: r.id === 'main' ? streetLabel : r.id.toUpperCase(), rightOfWayFt: r.rightOfWayFt, pavementFt: r.pavementFt, lengthFt: Math.round(r.len), centreline: r.pts, culDeSac: !!r.bulb })),
      rightOfWayFt: STREET.rightOfWayFt, pavementFt: STREET.pavementFt,
      bulbRightOfWayRadiusFt: STREET.bulbRightOfWayRadiusFt, bulbPavementRadiusFt: STREET.bulbPavementRadiusFt,
      centreline: layout.centrelines[0], centrelines: layout.centrelines,
      rowRings: layout.rowRings, pavementRings: layout.pavementRings,
      rowSqFt: layout.rowSqFt, basis: STREET.basis, note: STREET.note,
      // Mains in the new street, extended from the existing WSSC mains in the fronting road.
      // Every lot's water service and sewer lateral runs to these, none to the existing road.
      utilities: {
        water: { sizeIn: 8, offsetFt: -8, label: `PROP. 8" WATER MAIN (WSSC) IN ${streetLabel}`, connectsTo: `EX. WSSC WATER MAIN IN ${existingStreet}` },
        sewer: { sizeIn: 8, offsetFt: 8, label: `PROP. 8" SAN. SEWER (WSSC) IN ${streetLabel}`, connectsTo: `EX. WSSC SANITARY SEWER IN ${existingStreet}` },
        note: `Water and sewer for every lot are served from ${streetLabel}. The subdivision's mains connect to the existing WSSC mains in ${existingStreet} at the entrance and extend the length of ${streetLabel} to the cul-de-sac. WSSC as-built size and location of the mains in ${existingStreet}, and the sewer's depth and flow direction, are not read here and govern the connection.`,
      },
    }],
  }, null, 2))

  const lotFiles: string[] = []
  layout.lots.forEach((l, i) => {
    if (i === parklandIdx) return
    l.ring = clean(l.ring)
    const lotNo = parklandIdx >= 0 && i > parklandIdx ? i : i + 1
    const file = path.join(outDir, `${slug}-lot${lotNo}.plat.json`)
    writeFileSync(file, JSON.stringify({
      _source: provenance, address: site.address.matchedAddress,
      reference: { ...reference, lot: `${lotNo}` },
      basisOfBearings: 'Maryland State Plane Coordinate System (NAD 83), from PGAtlas parcel geometry',
      pointOfBeginning: l.ring[0], recordedAreaSqFt: Math.round(l.sqFt), programme,
      frontSetbackFt: frontYard, sideSetbackFt: sideYard, frontsOn: l.fronts,
      utilityMainLabel: `PROP. 8" MAIN IN ${streetLabel}`,
      calls: courses(l.ring, j => j === 0 ? `proposed lot line (fronts ${l.fronts})` : `proposed lot line ${j + 1}`),
    }, null, 2))
    lotFiles.push(file)
  })

  writeFileSync(path.join(outDir, `${slug}.proposal.json`), JSON.stringify({
    address: site.address.matchedAddress, parcelId: site.parcel.propId, zone, caseNumber,
    parcelSqFtGis: parcelSqFt, recordedAcres, recordedSqFt,
    standards: { minArea, minWidth, minFrontage, maxDensity, frontYard, sideYard },
    frontage: { streetName: existingStreet, lengthFt: L },
    existingStreet: { name: existingStreet, masterPlanRightOfWayFt: MASTER_PLAN_ROW_FT, centrelineToParcelLineFt: Number.isFinite(toCentre) ? toCentre : null, dedicationFt: dedFt, dedicationSqFt: dedSqFt },
    street: { ...STREET, curveRadiusFt: layout.params.radiusFt, ...layout.params, rowSqFt: layout.rowSqFt, curves: curves.map(c => ({ id: c.id, radiusFt: c.radiusFt, deltaDeg: c.deltaDeg, tangentFt: c.tangentFt, lengthFt: c.lengthFt })), centrelines: layout.centrelines },
    netSqFt, densityCap: cap, densityCapRecorded: capRecorded,
    stormwater: { ...swm, parcelSqFt: Math.round(swmSqFt), parcelRing: swmRing, lowCorner: lowI >= 0 ? tract[lowI] : null, cornerElevationsFt: relief, hydrologicSoilGroups: hsgs, rainfallTargetIn: SWM.rainfallTargetIn },
    lots: layout.lots.map((l, i) => ({ lot: i + 1, fronts: l.fronts, backsOntoExisting: l.backsOntoExisting, widthFt: l.widthFt, frontageFt: l.frontageFt, sqFt: l.sqFt, conforming: l.ok, problems: l.problems, ring: l.ring })),
    leftoverSqFt: layout.leftoverSqFt, generatedAt: new Date().toISOString(),
  }, null, 2))

  console.log(`\n    wrote ${lotFiles.length + 3} files to ${outDir}`)
  console.log(`    next: pnpm tsx scripts/generate-subdivision.ts ${path.join(outDir, `${slug}.plat.json`)} ${lotFiles.join(' ')} ${path.join(outDir, `${slug}-preliminary-set.pdf`)}`)
}

main().catch(e => { console.error(e); process.exit(1) })
