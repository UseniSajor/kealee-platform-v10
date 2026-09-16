/**
 * Propose a subdivision of a parcel that has NO recorded plat.
 *
 *   pnpm tsx scripts/propose-subdivision.ts "4600 Wheeler Rd" ../../output/site-plans/wheeler-4600 \
 *     [--frontage-only] [--recorded-acres 5.115479] [--case SE-1796]
 *
 * What this does, and what it refuses to do:
 *
 *   - The OUTER boundary is the county parcel polygon (PGAtlas Property layer,
 *     Level 1). It is compiled from tax maps, not surveyed; the sheets say so.
 *     Where a recorded acreage is supplied and disagrees, BOTH are reported
 *     and neither is moved.
 *   - Lots are PROPOSED to the zone's certified minimums (Sec. 27-4202): net
 *     area, lot width, street frontage, and the density cap on NET tract
 *     area (tract minus street dedication).
 *   - Default layout is an INTERNAL CUL-DE-SAC entering from the fronting
 *     street: lots along the fronting street either side of the entrance,
 *     lots down both sides of the new street, and lots around the bulb. The
 *     road station and length are searched to maximise conforming lots.
 *     `--frontage-only` keeps the older single-band layout with a remainder.
 *   - The street section (R/W width, pavement, bulb radius) is an ASSUMPTION
 *     stated on the sheet — no certified DPW&T standard is in the rule pack.
 *     Storm drainage, sewer capacity and forest conservation are not designed.
 *
 * It writes the plat-spec files that generate-subdivision.ts consumes — the
 * courses are derived from coordinates, not transcribed from an instrument —
 * plus a `proposedStreets` record the sheet renderer draws.
 */
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import { resolvePgAtlasSite } from '../src/jurisdictions/pgatlas'
import { PG_ZONE_DIMENSIONAL_TABLES } from '../src/jurisdictions/pg-dimensional-standards.generated'

type P = [number, number]

// ── Street section — taken from an APPROVED PG residential street ────────────
//
// Yocum Property, Lots 1–19, Clinton (5th District): Joseph Drive, "60' WIDE
// R.O.W.", paving width reduced from 36' to 26' under DPIE plan approval
// 15927-2020-0 (street construction) / 15919-2020-0 (storm drain & site
// grading), Design Engineering Inc., sealed P.L. Arora P.E. 11101. Both sets
// are in `existing site plans/`. Joseph Drive is a through street; the
// cul-de-sac radius below is NOT from that approval and is stated as assumed.
const STREET = {
  rightOfWayFt: 60,
  pavementFt: 26,
  bulbRightOfWayRadiusFt: 50,
  bulbPavementRadiusFt: 40,
  basis: 'Joseph Drive, Yocum Property Lots 1–19 — DPIE approvals 15927-2020-0 / 15919-2020-0',
  note: '60\' R/W and 26\' pavement per the approved Joseph Drive section (Yocum Property, DPIE 15927-2020-0). '
      + 'Cul-de-sac radii (50\' R/W, 40\' pavement) are ASSUMED — that approval has no cul-de-sac. '
      + 'Confirm against PGC DPW&T Specifications and Standards before preliminary plan submission.',
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
/** Keep the LEFT of a→b. */
function clipHalfPlane(subject: P[], a: P, b: P): P[] {
  if (subject.length < 3) return []
  const side = (p: P) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
  const out: P[] = []
  for (let j = 0; j < subject.length; j++) {
    const cur = subject[j], prev = subject[(j + subject.length - 1) % subject.length]
    const cIn = side(cur) >= -1e-9, pIn = side(prev) >= -1e-9
    const cut = (): P => {
      const d1 = side(prev), d2 = side(cur), t = d1 / (d1 - d2 || 1e-12)
      return [prev[0] + (cur[0] - prev[0]) * t, prev[1] + (cur[1] - prev[1]) * t]
    }
    if (cIn) { if (!pIn) out.push(cut()); out.push(cur) } else if (pIn) out.push(cut())
  }
  return out
}
function bearingOf(a: P, b: P): string {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const ns = dy >= 0 ? 'N' : 'S', ew = dx >= 0 ? 'E' : 'W'
  const deg = Math.atan2(Math.abs(dx), Math.abs(dy)) * 180 / Math.PI
  const d = Math.floor(deg), m = Math.floor((deg - d) * 60), s = Math.round(((deg - d) * 60 - m) * 60)
  return `${ns} ${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${String(s).padStart(2, '0')} ${ew}`
}
function courses(ring: P[], labels: (i: number) => string) {
  const r = openRing(ring)
  return r.map((p, i) => {
    const q = r[(i + 1) % r.length]
    return { kind: 'line', bearing: bearingOf(p, q), distanceFt: Math.round(Math.hypot(q[0] - p[0], q[1] - p[1]) * 100) / 100, label: labels(i) }
  })
}
function circle(c: P, r: number, n = 32): P[] {
  return Array.from({ length: n }, (_, i) => [c[0] + r * Math.cos(2 * Math.PI * i / n), c[1] + r * Math.sin(2 * Math.PI * i / n)] as P)
}
/** Longest chord of a ring along direction d (its "width" in that direction). */
function extentAlong(ring: P[], origin: P, d: P): number {
  let lo = Infinity, hi = -Infinity
  for (const p of ring) { const t = (p[0] - origin[0]) * d[0] + (p[1] - origin[1]) * d[1]; lo = Math.min(lo, t); hi = Math.max(hi, t) }
  return ring.length ? hi - lo : 0
}

// ── Zone standards ──────────────────────────────────────────────────────────

function standard(zone: string, startsWith: string): number | null {
  const table = PG_ZONE_DIMENSIONAL_TABLES[zone]
  const row = table?.rows.find(r => r.standard.startsWith(startsWith))
  const v = row?.values[0]?.replace(/,/g, '').match(/[\d.]+/)?.[0]
  return v ? Number(v) : null
}

interface Lot { ring: P[]; sqFt: number; widthFt: number; frontageFt: number; fronts: string; ok: boolean; problems: string[] }

// ── Layout ──────────────────────────────────────────────────────────────────

interface Frame { A: P; B: P; L: number; u: P; n: P; ccw: P[] }

/** Depth of the parcel at frontage station s, measured inward along n. */
function depthAt(f: Frame, s: number): number {
  const p0: P = [f.A[0] + f.u[0] * s, f.A[1] + f.u[1] * s]
  let best = 0
  for (let i = 0; i < f.ccw.length; i++) {
    const a = f.ccw[i], b = f.ccw[(i + 1) % f.ccw.length]
    // ray p0 + n t  vs segment a + (b-a) w
    const dx = b[0] - a[0], dy = b[1] - a[1]
    const den = f.n[0] * dy - f.n[1] * dx
    if (Math.abs(den) < 1e-9) continue
    const t = ((a[0] - p0[0]) * dy - (a[1] - p0[1]) * dx) / den
    const w = ((a[0] - p0[0]) * f.n[1] - (a[1] - p0[1]) * f.n[0]) / den
    if (w >= -1e-9 && w <= 1 + 1e-9 && t > 1) best = Math.max(best, t)
  }
  return best
}

/** Sutherland–Hodgman against a linear predicate: keeps points where g(p) ≥ 0. Handedness-proof. */
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
  return out.length >= 3 ? out : []
}
const dot = (p: P, o: P, d: P) => (p[0] - o[0]) * d[0] + (p[1] - o[1]) * d[1]
const cross = (d: P, p: P, o: P) => d[0] * (p[1] - o[1]) - d[1] * (p[0] - o[0])

/** A strip of the parcel: along-coordinate in [s0,s1] (direction d1 from origin), depth in [t0,t1] (direction d2). */
function strip(f: Frame, origin: P, d1: P, s0: number, s1: number, d2: P, t0: number, t1: number): P[] {
  let poly = f.ccw.slice()
  poly = clipWhere(poly, p => dot(p, origin, d1) - s0)
  poly = clipWhere(poly, p => s1 - dot(p, origin, d1))
  poly = clipWhere(poly, p => dot(p, origin, d2) - t0)
  poly = clipWhere(poly, p => t1 - dot(p, origin, d2))
  return poly
}

/**
 * Cut a run [s0,s1] into lots ≥ minWidth wide, merging a short tail into its
 * neighbour and checking each against the zone.
 */
function lotsAlong(
  f: Frame, origin: P, d1: P, s0: number, s1: number, d2: P, t0: number, t1: number,
  std: { minArea: number; minWidth: number; minFrontage: number }, fronts: string,
): Lot[] {
  const run = s1 - s0
  const n = Math.floor(run / std.minWidth)
  if (n <= 0) return []
  const w = run / n
  const lots: Lot[] = []
  let cursor = s0
  while (cursor < s1 - 1e-6) {
    let span = 1, ring: P[] = [], sqFt = 0
    for (;;) {
      const e = Math.min(cursor + span * w, s1)
      ring = strip(f, origin, d1, cursor, e, d2, t0, t1)
      sqFt = ring.length >= 3 ? Math.abs(area(ring)) : 0
      if (sqFt >= std.minArea || e >= s1 - 1e-6) break
      span++
    }
    const e = Math.min(cursor + span * w, s1)
    const widthFt = extentAlong(ring, origin, d1)
    if (sqFt > 0) lots.push({ ring, sqFt, widthFt, frontageFt: widthFt, fronts, ok: false, problems: [] })
    cursor = e
  }
  if (lots.length > 1 && lots[lots.length - 1].sqFt < std.minArea) {
    const tail = lots.pop()!, prev = lots[lots.length - 1]
    const s = s1 - (prev.widthFt + tail.widthFt) - 0.01
    prev.ring = strip(f, origin, d1, Math.max(s0, s), s1, d2, t0, t1)
    prev.sqFt = Math.abs(area(prev.ring)); prev.widthFt = extentAlong(prev.ring, origin, d1); prev.frontageFt = prev.widthFt
  }
  for (const l of lots) {
    l.problems = []
    if (l.sqFt < std.minArea) l.problems.push(`net area ${l.sqFt.toFixed(0)} < ${std.minArea} sf`)
    if (l.widthFt < std.minWidth - 0.5) l.problems.push(`width ${l.widthFt.toFixed(1)} < ${std.minWidth} ft`)
    if (l.frontageFt < std.minFrontage - 0.5) l.problems.push(`frontage ${l.frontageFt.toFixed(1)} < ${std.minFrontage} ft`)
    l.ok = l.problems.length === 0
  }
  return lots
}

interface Layout {
  lots: Lot[]
  street: {
    legs: { from: P; to: P; lengthFt: number }[]
    bulbCentre: P; rowRings: P[][]; pavementRings: P[][]; rowSqFt: number
    stationFt: number; stemFt: number; turnDeg: number; leg2Ft: number
  } | null
  leftoverSqFt: number
}

/** How far the parcel extends from `o` along direction `d` (ray cast against the boundary). */
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

/**
 * A street entering perpendicular from the fronting street (stem, `t1` ft),
 * turning `turnDeg` (0 = straight on), running `L2` ft to a cul-de-sac.
 * Lots: along the fronting street either side of the entrance; both sides of
 * each leg (deep, out to the boundary, as Yocum's are); wedges around the
 * bulb. Everything is clipped to lie behind the frontage band and outside
 * the R/W. Joseph Drive on the Yocum plan curves through its tract for the
 * same reason this bends: a straight stem in a shallow tract serves few lots.
 */
function roadLayout(
  f: Frame, sR: number, t1: number, turnDeg: number, L2: number,
  std: { minArea: number; minWidth: number; minFrontage: number }, frontDepth: number,
): Layout {
  const { A, L, u, n } = f
  const half = STREET.rightOfWayFt / 2
  const bulbR = STREET.bulbRightOfWayRadiusFt
  const at = (s: number, t: number): P => [A[0] + u[0] * s + n[0] * t, A[1] + u[1] * s + n[1] * t]
  const th = turnDeg * Math.PI / 180
  const d2: P = [n[0] * Math.cos(th) + u[0] * Math.sin(th), n[1] * Math.cos(th) + u[1] * Math.sin(th)]   // leg-2 direction
  const m: P = [-d2[1], d2[0]]                                                                        // left of leg 2
  const mu: P = [-u[0], -u[1]]
  const o1 = at(sR, 0), o2 = at(sR, t1), c: P = [o2[0] + d2[0] * L2, o2[1] + d2[1] * L2]

  // Common clips: behind the frontage lots, and outside each leg's R/W.
  const behindFront = (p: P) => dot(p, A, n) - frontDepth
  const behindFrontMaxRef = { fn: (p: P) => dot(p, A, n) - (frontDepth + 160) }
  const outsideLeg = (o: P, d: P, len: number, keepNearFront = false) => (poly: P[]): P[] => {
    // Points within the leg's R/W corridor are removed by splitting the
    // polygon on the corridor's two edges and keeping the parts outside;
    // for lot strips (convex-ish, mostly on one side) keeping the larger
    // outside part is the honest approximation.
    const side: P = [-d[1], d[0]]
    // Does the bounded corridor actually intersect this polygon? (A strip
    // crossing the road mid-way has no vertex inside it.)
    let hit = poly.slice()
    hit = clipWhere(hit, p => dot(p, o, d))
    hit = clipWhere(hit, p => len - dot(p, o, d))
    hit = clipWhere(hit, p => half - dot(p, o, side))
    hit = clipWhere(hit, p => half + dot(p, o, side))
    if (hit.length < 3 || Math.abs(area(hit)) < 1) return poly
    const left = clipWhere(poly, p => dot(p, o, side) - half)
    const right = clipWhere(poly, p => -half - dot(p, o, side))
    if (keepNearFront) {
      // A frontage lot keeps the piece on the fronting-street side, whatever its size.
      const depthOf = (r: P[]) => r.length ? r.reduce((acc, p) => acc + dot(p, A, n), 0) / r.length : Infinity
      return depthOf(left) <= depthOf(right) ? left : right
    }
    const aL = left.length ? Math.abs(area(left)) : 0, aR = right.length ? Math.abs(area(right)) : 0
    return aL >= aR ? left : right
  }
  // A side that faces the fronting street starts behind the frontage lots'
  // furthest rear line; a side that faces away starts at the R/W.
  const facesFront = (sideDir: P) => sideDir[0] * n[0] + sideDir[1] * n[1] < 0
  const finish = (lots: Lot[], sideDir: P | null, extraClip?: (poly: P[]) => P[]) => lots.flatMap(l => {
    let ring = clipWhere(l.ring, sideDir && facesFront(sideDir) ? behindFrontMaxRef.fn : behindFront)
    ring = outsideLeg(o1, n, t1)(ring)
    ring = outsideLeg(o2, d2, L2)(ring)
    if (extraClip) ring = extraClip(ring)
    if (ring.length < 3) return []
    const sqFt = Math.abs(area(ring))
    const problems: string[] = []
    if (sqFt < std.minArea) problems.push(`net area ${sqFt.toFixed(0)} < ${std.minArea} sf`)
    if (l.widthFt < std.minWidth - 0.5) problems.push(`width ${l.widthFt.toFixed(1)} < ${std.minWidth} ft`)
    if (l.frontageFt < std.minFrontage - 0.5) problems.push(`frontage ${l.frontageFt.toFixed(1)} < ${std.minFrontage} ft`)
    return [{ ...l, ring, sqFt, problems, ok: problems.length === 0 }]
  })

  const lots: Lot[] = []
  const cornerGap = 25
  const FAR = 2000
  // Fronting-street lots either side of the entrance (corner lots keep 25 ft
  // off the new R/W). They run back to the new street's R/W where it lies
  // behind them, capped at FRONT_MAX where it does not — the land between
  // Wheeler Road and a parallel leg is theirs, not a row of slivers.
  const FRONT_MAX = frontDepth + 160
  // Does the new street's corridor lie behind this station, within reach?
  const inCorridorOf = (o: P, d: P, len: number, p: P) => {
    const side: P = [-d[1], d[0]]
    const sAlong = dot(p, o, d), w = dot(p, o, side)
    return sAlong >= -1e-6 && sAlong <= len + 1e-6 && Math.abs(w) <= half + 1e-6
  }
  const streetBehind = (station: number): boolean => {
    for (let depth = frontDepth; depth <= FRONT_MAX + half; depth += 10) {
      const p = at(station, depth)
      if (inCorridorOf(o2, d2, L2, p) || Math.hypot(p[0] - c[0], p[1] - c[1]) <= bulbR) return true
    }
    return false
  }
  const frontClip = (poly: P[], station: number) => {
    let r = outsideLeg(o1, n, t1, true)(poly)
    r = outsideLeg(o2, d2, L2, true)(r)
    r = clipWhere(r, p => bulbR - Math.hypot(p[0] - c[0], p[1] - c[1]) < 0 ? 1 : -1)   // drop anything inside the bulb (coarse)
    const cap = streetBehind(station) ? FRONT_MAX : frontDepth
    return clipWhere(r, p => cap - dot(p, A, n))
  }
  const frontLots = (lotsIn: Lot[]) => lotsIn.flatMap(l => {
    const station = l.ring.length ? l.ring.reduce((acc, p) => acc + dot(p, A, u), 0) / l.ring.length : 0
    const ring = frontClip(l.ring, station)
    if (ring.length < 3) return []
    const sqFt = Math.abs(area(ring))
    const problems: string[] = []
    if (sqFt < std.minArea) problems.push(`net area ${sqFt.toFixed(0)} < ${std.minArea} sf`)
    if (l.widthFt < std.minWidth - 0.5) problems.push(`width ${l.widthFt.toFixed(1)} < ${std.minWidth} ft`)
    return [{ ...l, ring, sqFt, problems, ok: problems.length === 0 }]
  })
  lots.push(...frontLots(lotsAlong(f, A, u, 0, sR - half - cornerGap, n, 0, FAR, std, 'WHEELER ROAD')))
  lots.push(...frontLots(lotsAlong(f, A, u, sR + half + cornerGap, L, n, 0, FAR, std, 'WHEELER ROAD')))

  // Leg 1 side lots, only if the stem is long enough past the frontage band.
  const stemFrom = frontDepth, stemTo = t1 - half - cornerGap
  if (stemTo - stemFrom >= std.minWidth) {
    lots.push(...finish(lotsAlong(f, o1, n, stemFrom, stemTo, u, half, FAR, std, 'PROPOSED STREET (STEM, EAST)'), null))
    lots.push(...finish(lotsAlong(f, o1, n, stemFrom, stemTo, mu, half, FAR, std, 'PROPOSED STREET (STEM, WEST)'), null))
  }
  // Leg 2 side lots.
  const legFrom = half + cornerGap, legTo = L2 - bulbR
  if (legTo - legFrom >= std.minWidth) {
    const mm: P = [-m[0], -m[1]]
    lots.push(...finish(lotsAlong(f, o2, d2, legFrom, legTo, m, half, FAR, std, 'PROPOSED STREET (LEFT)'), m))
    lots.push(...finish(lotsAlong(f, o2, d2, legFrom, legTo, mm, half, FAR, std, 'PROPOSED STREET (RIGHT)'), mm))
  }
  // Bulb wedges.
  const beyond = clipWhere(clipWhere(f.ccw.slice(), p => dot(p, o2, d2) - legTo), behindFront)
  if (beyond.length >= 3) {
    const dir = (ang: number): P => [m[0] * Math.sin(ang) + d2[0] * Math.cos(ang), m[1] * Math.sin(ang) + d2[1] * Math.cos(ang)]
    let bestWedges: Lot[] = [], bestOk = -1
    for (let wedgeCount = 2; wedgeCount <= 6; wedgeCount++) {
      const wedges: Lot[] = []
      for (let k = 0; k < wedgeCount; k++) {
        const a0 = -Math.PI / 2 + Math.PI * k / wedgeCount, a1 = -Math.PI / 2 + Math.PI * (k + 1) / wedgeCount
        const da = dir(a0), db = dir(a1), mid = dir((a0 + a1) / 2)
        let poly = beyond.slice()
        poly = clipWhere(poly, p => cross(da, p, c))            // counter-clockwise of da
        poly = clipWhere(poly, p => -cross(db, p, c))           // clockwise of db
        poly = clipWhere(poly, p => dot(p, c, mid) - bulbR)     // outside the bulb R/W (chord)
        const sqFt = poly.length >= 3 ? Math.abs(area(poly)) : 0
        if (sqFt <= 0) continue
        const chord = 2 * bulbR * Math.sin((a1 - a0) / 2)
        const perp: P = [-mid[1], mid[0]]
        const l: Lot = { ring: poly, sqFt, widthFt: extentAlong(poly, c, perp), frontageFt: chord, fronts: 'PROPOSED STREET (CUL-DE-SAC)', ok: false, problems: [] }
        if (l.sqFt < std.minArea) l.problems.push(`net area ${l.sqFt.toFixed(0)} < ${std.minArea} sf`)
        if (l.widthFt < std.minWidth - 0.5) l.problems.push(`width ${l.widthFt.toFixed(1)} < ${std.minWidth} ft`)
        if (l.frontageFt < std.minFrontage - 0.5) l.problems.push(`frontage ${l.frontageFt.toFixed(1)} < ${std.minFrontage} ft`)
        l.ok = l.problems.length === 0
        wedges.push(l)
      }
      const ok = wedges.filter(w => w.ok).length
      if (ok > bestOk || (ok === bestOk && wedges.length < bestWedges.length)) { bestOk = ok; bestWedges = wedges }
    }
    lots.push(...bestWedges)
  }

  // The street: two R/W rectangles and the bulb; pavement likewise.
  const rect = (o: P, d: P, len: number, hw: number): P[] => {
    const s: P = [-d[1], d[0]]
    return [[o[0] + s[0] * hw, o[1] + s[1] * hw], [o[0] - s[0] * hw, o[1] - s[1] * hw],
            [o[0] - s[0] * hw + d[0] * len, o[1] - s[1] * hw + d[1] * len], [o[0] + s[0] * hw + d[0] * len, o[1] + s[1] * hw + d[1] * len]]
  }
  const rowRings = [rect(o1, n, t1, half), rect(o2, d2, L2, half), circle(c, bulbR)]
  const ph = STREET.pavementFt / 2
  const pavementRings = [rect(o1, n, t1, ph), rect(o2, d2, L2, ph), circle(c, STREET.bulbPavementRadiusFt)]
  const rowSqFt = STREET.rightOfWayFt * (t1 + L2) + Math.PI * bulbR * bulbR / 2
  const used = lots.reduce((s, l) => s + l.sqFt, 0) + rowSqFt
  return {
    lots,
    street: { legs: [{ from: o1, to: o2, lengthFt: t1 }, { from: o2, to: c, lengthFt: L2 }], bulbCentre: c, rowRings, pavementRings, rowSqFt, stationFt: sR, stemFt: t1, turnDeg, leg2Ft: L2 },
    leftoverSqFt: Math.abs(area(f.ccw)) - used,
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const argv = process.argv.slice(2)
  const flag = (k: string) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined }
  const positional = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--') && argv[i - 1] !== '--frontage-only'))
  const [address, outDir] = positional
  if (!address || !outDir) { console.error('usage: propose-subdivision.ts "<street address>" <out dir> [--frontage-only] [--recorded-acres N] [--case ID]'); process.exit(1) }
  const frontageOnly = argv.includes('--frontage-only')
  const recordedAcres = flag('--recorded-acres') ? Number(flag('--recorded-acres')) : null
  const caseNumber = flag('--case') ?? null
  mkdirSync(outDir, { recursive: true })

  const site = await resolvePgAtlasSite(address, {})
  if (!site?.parcel) throw new Error(`No parcel for "${address}" — nothing is proposed on an invented boundary.`)
  const zone = site.zoning?.zoneCode ?? ''
  const ring = openRing(site.parcel.ring.coordinates as P[])
  const ccw = area(ring) > 0 ? ring : ring.slice().reverse()
  const parcelSqFt = Math.abs(area(ccw))
  const recordedSqFt = recordedAcres ? recordedAcres * 43560 : null

  const minArea = standard(zone, 'Net lot area, min.'), minWidth = standard(zone, 'Lot width, min.')
  const minFrontage = standard(zone, 'Lot frontage') ?? 50, maxDensity = standard(zone, 'Density, max.')
  const frontYard = standard(zone, 'Front yard depth') ?? 25, sideYard = standard(zone, 'Side yard depth') ?? 8
  if (!minArea || !minWidth) throw new Error(`Zone ${zone} has no certified lot standards in the dimensional table.`)
  const std = { minArea, minWidth, minFrontage }

  console.log(`\n=== ${site.address.matchedAddress} — proposed subdivision${frontageOnly ? ' (frontage only)' : ' (cul-de-sac)'} ===`)
  console.log(`    parcel ${site.parcel.propId}  GIS ${parcelSqFt.toFixed(0)} sf (${(parcelSqFt / 43560).toFixed(4)} ac)`
    + (recordedSqFt ? `  RECORDED ${recordedSqFt.toFixed(0)} sf (${recordedAcres} ac) — differ by ${(parcelSqFt - recordedSqFt).toFixed(0)} sf; neither moved` : '')
    + `  zone ${zone}${caseNumber ? `  case ${caseNumber}` : ''}`)
  console.log(`    standards: min lot ${minArea} sf · width ${minWidth} ft · frontage ${minFrontage} ft · density ${maxDensity} du/ac (net)`)

  // Front edge nearest the street point.
  const sp = site.streetPoint as P | null
  if (!sp) throw new Error('No fronting street established (Sec. 24-128); lots cannot be proposed.')
  let best = { i: 0, d: Infinity }
  for (let i = 0; i < ccw.length; i++) {
    const a = ccw[i], b = ccw[(i + 1) % ccw.length]
    const vx = b[0] - a[0], vy = b[1] - a[1]
    const t = Math.max(0, Math.min(1, ((sp[0] - a[0]) * vx + (sp[1] - a[1]) * vy) / (vx * vx + vy * vy || 1)))
    const d = Math.hypot(sp[0] - (a[0] + t * vx), sp[1] - (a[1] + t * vy))
    if (d < best.d) best = { i, d }
  }
  const A = ccw[best.i], B = ccw[(best.i + 1) % ccw.length]
  const L = Math.hypot(B[0] - A[0], B[1] - A[1])
  const u: P = [(B[0] - A[0]) / L, (B[1] - A[1]) / L], n: P = [-u[1], u[0]]
  const f: Frame = { A, B, L, u, n, ccw }
  const streetName = site.streets[0]?.name ?? 'street'
  console.log(`    frontage on ${streetName}: ${L.toFixed(1)} ft`)

  const frontDepth = Math.max(Math.ceil(minArea / minWidth / 5) * 5 + 15, 145)

  let layout: Layout
  if (frontageOnly) {
    const lots = lotsAlong(f, A, u, 0, L, n, 0, frontDepth, std, streetName)
    layout = { lots, street: null, leftoverSqFt: parcelSqFt - lots.reduce((s, l) => s + l.sqFt, 0) }
  } else {
    // Search the road station and length for the most conforming lots.
    let bestLayout: Layout | null = null, bestScore = -Infinity
    const half = STREET.rightOfWayFt / 2, bulbR = STREET.bulbRightOfWayRadiusFt
    const capGross = maxDensity ? Math.floor(maxDensity * (recordedSqFt ?? parcelSqFt) / 43560) : Infinity
    let tried = 0
    for (let sR = half + 25 + minWidth; sR <= L - (half + 25 + minWidth); sR += 20) {
      for (const t1 of [frontDepth + 30, frontDepth + 60, frontDepth + 30 + minWidth + 25 + 45]) {
        if (t1 + bulbR > depthAt(f, sR)) continue
        for (const turnDeg of [-90, -80, -65, -50, -35, -20, 0, 20, 35, 50, 65, 80, 90]) {
          const th = turnDeg * Math.PI / 180
          const d2: P = [n[0] * Math.cos(th) + u[0] * Math.sin(th), n[1] * Math.cos(th) + u[1] * Math.sin(th)]
          const o2: P = [A[0] + u[0] * sR + n[0] * t1, A[1] + u[1] * sR + n[1] * t1]
          const reach = reachAlong(f, o2, d2)
          for (let L2 = half + 25 + minWidth + bulbR; L2 <= reach - bulbR - 40; L2 += 20) {
            const cand = roadLayout(f, sR, t1, turnDeg, L2, std, frontDepth)
            tried++
            const conforming = Math.min(cand.lots.filter(l => l.ok).length, capGross)
            const score = conforming * 1000 - cand.leftoverSqFt / 1000 - cand.lots.filter(l => !l.ok).length * 50 - cand.street!.rowSqFt / 5000
            if (score > bestScore) { bestScore = score; bestLayout = cand }
          }
        }
      }
    }
    if (process.env.LAYOUT) {
      // LAYOUT=sR,t1,turnDeg,L2 — force a geometry for inspection.
      const [a, b, cdeg, d] = process.env.LAYOUT.split(',').map(Number)
      bestLayout = roadLayout(f, a, b, cdeg, d, std, frontDepth)
      console.log(`    forced layout ${process.env.LAYOUT}`)
    }
    if (!bestLayout) throw new Error('No street layout fits; use --frontage-only.')
    console.log(`    searched ${tried} street layouts`)
    layout = bestLayout
  }

  const netSqFt = parcelSqFt - (layout.street?.rowSqFt ?? 0)
  const netRecordedSqFt = recordedSqFt ? recordedSqFt - (layout.street?.rowSqFt ?? 0) : null
  const cap = maxDensity ? Math.floor(maxDensity * netSqFt / 43560) : Infinity
  const capRecorded = maxDensity && netRecordedSqFt ? Math.floor(maxDensity * netRecordedSqFt / 43560) : null
  const conforming = layout.lots.filter(l => l.ok)
  // Number lots: Wheeler lots first (by station), then street sides, then bulb — as laid out.
  layout.lots.forEach((l, i) => { (l as Lot & { no: number }).no = i + 1 })

  console.log(`\n    ${layout.lots.length} lots (${conforming.length} conform)`
    + (layout.street ? `; street enters at station ${layout.street.stationFt.toFixed(0)} ft, stem ${layout.street.stemFt.toFixed(0)} ft, turns ${layout.street.turnDeg}°, ${layout.street.leg2Ft.toFixed(0)} ft to bulb centre, R/W ${layout.street.rowSqFt.toFixed(0)} sf` : '')
    + `; net ${netSqFt.toFixed(0)} sf → density cap ${cap} du` + (capRecorded !== null ? ` (recorded acreage: ${capRecorded} du)` : ''))
  layout.lots.forEach((l, i) => console.log(`      Lot ${String(i + 1).padStart(2)}: ${l.sqFt.toFixed(0).padStart(6)} sf  w ${l.widthFt.toFixed(1).padStart(6)}  fr ${l.frontageFt.toFixed(1).padStart(6)}  ${l.fronts}${l.ok ? '' : '  NOT CONFORMING — ' + l.problems.join('; ')}`))
  console.log(`      leftover ${layout.leftoverSqFt.toFixed(0)} sf`)
  if (layout.lots.length > cap) console.log(`    *** ${layout.lots.length} lots exceeds the density cap of ${cap}; the plan must drop to ${cap}.`)

  // ── Emit ──────────────────────────────────────────────────────────────────
  const slug = path.basename(outDir)
  const subdivisionName = `${site.address.matchedAddress} — PRELIMINARY SUBDIVISION CONCEPT`
  const provenance =
    'PRELIMINARY. Outer boundary from the Prince George\'s County parcel layer (PGAtlas Property/MapServer/15), '
    + 'compiled from tax maps — NOT a boundary survey and NOT a plat of record. Lot lines and the street are PROPOSED by Kealee. '
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
    calls: courses(outerRing, i => i === 0 ? `frontage — ${streetName}` : `county parcel edge ${i + 1}`),
  }, null, 2))

  const notes = [
    'This drawing is a preliminary subdivision concept. It is not a plat, not a boundary survey, and not for recording.',
    `Lot lines are proposed to meet Sec. 27-4202 ${zone}: minimum net lot area ${minArea} sq ft, minimum lot width ${minWidth} ft, minimum frontage ${minFrontage} ft, maximum density ${maxDensity} du/ac of net tract area.`,
    'Boundary shown from the county parcel layer (Level 1). A field survey by a Maryland licensed surveyor governs.',
  ]
  if (recordedSqFt) notes.push(`Recorded acreage ${recordedAcres} ac (${recordedSqFt.toFixed(0)} sq ft) differs from the county GIS polygon (${parcelSqFt.toFixed(0)} sq ft) by ${(parcelSqFt - recordedSqFt).toFixed(0)} sq ft. Both are reported; neither is adjusted. The survey resolves it.`)
  if (caseNumber) notes.push(`Special exception ${caseNumber} is of record on this property. Its conditions have not been read into this concept and govern where they conflict.`)
  if (layout.street) notes.push(`Proposed public street: ${STREET.note} Street dedication ${layout.street.rowSqFt.toFixed(0)} sq ft. Storm drainage, sanitary sewer capacity, and forest conservation are not designed here.`)
  notes.push('Corner lots at the new street keep a 25 ft yard along both streets (Sec. 27-4202 note 2).')

  writeFileSync(path.join(outDir, `${slug}.plat-record.json`), JSON.stringify({
    reference: `${subdivisionName}. Zone ${zone}${caseNumber ? `, ${caseNumber}` : ''}. Parcel ${site.parcel.propId}, GIS ${parcelSqFt.toFixed(0)} sq ft${recordedSqFt ? `, recorded ${recordedAcres} ac` : ''}. ${provenance}`,
    citation: 'PRELIMINARY CONCEPT — NO PLAT OF RECORD',
    notes, dedicationWidthFt: 0, adjoiners: [],
    proposedStreets: layout.street ? [{
      name: 'PROPOSED PUBLIC STREET (NAME TBD)',
      rightOfWayFt: STREET.rightOfWayFt, pavementFt: STREET.pavementFt,
      bulbRightOfWayRadiusFt: STREET.bulbRightOfWayRadiusFt, bulbPavementRadiusFt: STREET.bulbPavementRadiusFt,
      centreline: [layout.street.legs[0].from, layout.street.legs[0].to, layout.street.legs[1].to],
      bulbCentre: layout.street.bulbCentre,
      rowRings: layout.street.rowRings, pavementRings: layout.street.pavementRings,
      rowSqFt: layout.street.rowSqFt, basis: STREET.basis, note: STREET.note,
    }] : [],
  }, null, 2))

  const lotFiles: string[] = []
  layout.lots.forEach((l, i) => {
    const file = path.join(outDir, `${slug}-lot${i + 1}.plat.json`)
    writeFileSync(file, JSON.stringify({
      _source: provenance, address: site.address.matchedAddress,
      reference: { ...reference, lot: `${i + 1} (proposed)` },
      basisOfBearings: 'Maryland State Plane Coordinate System (NAD 83), from PGAtlas parcel geometry',
      pointOfBeginning: l.ring[0], recordedAreaSqFt: Math.round(l.sqFt), programme,
      frontSetbackFt: frontYard, sideSetbackFt: sideYard,
      frontsOn: l.fronts,
      calls: courses(l.ring, j => j === 0 ? `proposed lot line (fronts ${l.fronts})` : `proposed lot line ${j + 1}`),
    }, null, 2))
    lotFiles.push(file)
  })

  writeFileSync(path.join(outDir, `${slug}.proposal.json`), JSON.stringify({
    address: site.address.matchedAddress, parcelId: site.parcel.propId, zone, caseNumber,
    parcelSqFtGis: parcelSqFt, recordedAcres, recordedSqFt,
    standards: { minArea, minWidth, minFrontage, maxDensity, frontYard, sideYard },
    frontage: { streetName, lengthFt: L },
    street: layout.street ? { ...STREET, ...layout.street } : null,
    netSqFt, densityCap: cap, densityCapRecorded: capRecorded,
    lots: layout.lots.map((l, i) => ({ lot: i + 1, fronts: l.fronts, widthFt: l.widthFt, frontageFt: l.frontageFt, sqFt: l.sqFt, conforming: l.ok, problems: l.problems, ring: l.ring })),
    leftoverSqFt: layout.leftoverSqFt, generatedAt: new Date().toISOString(),
  }, null, 2))

  console.log(`\n    wrote ${lotFiles.length + 3} files to ${outDir}`)
  console.log(`    next: pnpm tsx scripts/generate-subdivision.ts ${path.join(outDir, `${slug}.plat.json`)} ${lotFiles.join(' ')} ${path.join(outDir, `${slug}-preliminary-set.pdf`)}`)
}

main().catch(e => { console.error(e); process.exit(1) })
