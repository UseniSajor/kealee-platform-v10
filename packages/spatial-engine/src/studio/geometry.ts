/**
 * Deterministic planar geometry for the Studio command engine. Feet in a
 * projected CRS; no geodesy. Polygon booleans go through turf, which is planar
 * polygon-clipping underneath and already a runtime dependency.
 */

import {
  polygon as turfPolygon, featureCollection, union as turfUnion, difference as turfDifference,
  intersect as turfIntersect,
} from '@turf/turf'
import type { Pos, StudioGeometry } from './model'

export type XY = [number, number]
const xy = (p: Pos): XY => [p[0], p[1]]

export function mapCoords(g: StudioGeometry, f: (p: Pos) => Pos): StudioGeometry {
  if (g.type === 'Point') return { type: 'Point', coordinates: f(g.coordinates) }
  if (g.type === 'LineString') return { type: 'LineString', coordinates: g.coordinates.map(f) }
  return { type: 'Polygon', coordinates: g.coordinates.map(r => r.map(f)) }
}

const keepZ = (p: Pos, x: number, y: number): Pos => (p.length === 3 ? [x, y, p[2]] : [x, y])

export function translate(g: StudioGeometry, dx: number, dy: number): StudioGeometry {
  return mapCoords(g, p => keepZ(p, p[0] + dx, p[1] + dy))
}

export function rotate(g: StudioGeometry, angleDeg: number, origin: XY): StudioGeometry {
  const a = (angleDeg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a)
  return mapCoords(g, p => {
    const x = p[0] - origin[0], y = p[1] - origin[1]
    return keepZ(p, origin[0] + x * c - y * s, origin[1] + x * s + y * c)
  })
}

export function scale(g: StudioGeometry, factor: number, origin: XY): StudioGeometry {
  return mapCoords(g, p => keepZ(p, origin[0] + (p[0] - origin[0]) * factor, origin[1] + (p[1] - origin[1]) * factor))
}

/** Mirror across the line through a and b. */
export function mirror(g: StudioGeometry, a: XY, b: XY): StudioGeometry {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy
  const out = mapCoords(g, p => {
    const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L
    const fx = a[0] + t * dx, fy = a[1] + t * dy
    return keepZ(p, 2 * fx - p[0], 2 * fy - p[1])
  })
  // A reflection reverses winding; restore it so area signs stay meaningful.
  if (out.type === 'Polygon') return { type: 'Polygon', coordinates: out.coordinates.map(r => [...r].reverse()) }
  return out
}

export function centroid(g: StudioGeometry): XY {
  if (g.type === 'Point') return xy(g.coordinates)
  if (g.type === 'LineString') {
    let L = 0, cx = 0, cy = 0
    for (let i = 1; i < g.coordinates.length; i++) {
      const a = g.coordinates[i - 1], b = g.coordinates[i]
      const l = Math.hypot(b[0] - a[0], b[1] - a[1])
      L += l; cx += l * (a[0] + b[0]) / 2; cy += l * (a[1] + b[1]) / 2
    }
    return L > 0 ? [cx / L, cy / L] : xy(g.coordinates[0])
  }
  const r = openRing(g.coordinates[0])
  let a = 0, cx = 0, cy = 0
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const f = r[j][0] * r[i][1] - r[i][0] * r[j][1]
    a += f; cx += (r[j][0] + r[i][0]) * f; cy += (r[j][1] + r[i][1]) * f
  }
  if (Math.abs(a) < 1e-9) return xy(r[0])
  return [cx / (3 * a), cy / (3 * a)]
}

export function openRing(r: Pos[]): XY[] {
  const pts = r.map(xy)
  if (pts.length > 1) {
    const f = pts[0], l = pts[pts.length - 1]
    if (Math.abs(f[0] - l[0]) < 1e-9 && Math.abs(f[1] - l[1]) < 1e-9) pts.pop()
  }
  return pts
}

export function closeRing(r: XY[]): Pos[] {
  return [...r, r[0]]
}

export function signedArea(r: XY[]): number {
  let a = 0
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1]
  return a / 2
}

export function polygonArea(g: StudioGeometry): number {
  if (g.type !== 'Polygon') return 0
  const [outer, ...holes] = g.coordinates
  return Math.abs(signedArea(openRing(outer))) - holes.reduce((s, h) => s + Math.abs(signedArea(openRing(h))), 0)
}

export function lineLength(pts: Pos[]): number {
  let L = 0
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
  return L
}

export function distPointSegment(p: XY, a: XY, b: XY): number {
  const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy
  const t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)) : 0
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))
}

/** Segments of a geometry (a polygon's outer ring closes). */
export function segmentsOf(g: StudioGeometry): [XY, XY][] {
  if (g.type === 'Point') return []
  const pts = g.type === 'LineString' ? g.coordinates.map(xy) : openRing(g.coordinates[0])
  const segs: [XY, XY][] = []
  for (let i = 1; i < pts.length; i++) segs.push([pts[i - 1], pts[i]])
  if (g.type === 'Polygon' && pts.length > 2) segs.push([pts[pts.length - 1], pts[0]])
  return segs
}

export function pointInPolygon(p: XY, ring: XY[]): boolean {
  let hit = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / ((yj - yi) || 1e-12) + xi) hit = !hit
  }
  return hit
}

function segIntersect(a: XY, b: XY, c: XY, d: XY): { t: number; u: number; p: XY } | null {
  const r: XY = [b[0] - a[0], b[1] - a[1]], s: XY = [d[0] - c[0], d[1] - c[1]]
  const den = r[0] * s[1] - r[1] * s[0]
  if (Math.abs(den) < 1e-12) return null
  const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den
  const u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den
  return { t, u, p: [a[0] + t * r[0], a[1] + t * r[1]] }
}

/** Minimum distance between two geometries; 0 when they touch or overlap. */
export function minDistance(g1: StudioGeometry, g2: StudioGeometry): number {
  if (intersects(g1, g2)) return 0
  const v1 = g1.type === 'Point' ? [xy(g1.coordinates)] : segmentsOf(g1).flat()
  const v2 = g2.type === 'Point' ? [xy(g2.coordinates)] : segmentsOf(g2).flat()
  const s1 = segmentsOf(g1), s2 = segmentsOf(g2)
  let best = Infinity
  for (const p of v1) {
    if (!s2.length) best = Math.min(best, Math.hypot(p[0] - v2[0][0], p[1] - v2[0][1]))
    for (const [a, b] of s2) best = Math.min(best, distPointSegment(p, a, b))
  }
  for (const p of v2) for (const [a, b] of s1) best = Math.min(best, distPointSegment(p, a, b))
  return best
}

export function intersects(g1: StudioGeometry, g2: StudioGeometry): boolean {
  for (const [a, b] of segmentsOf(g1)) for (const [c, d] of segmentsOf(g2)) {
    const hit = segIntersect(a, b, c, d)
    if (hit && hit.t >= 0 && hit.t <= 1 && hit.u >= 0 && hit.u <= 1) return true
  }
  const inside = (p: XY, g: StudioGeometry) => g.type === 'Polygon' && pointInPolygon(p, openRing(g.coordinates[0]))
  const first = (g: StudioGeometry): XY => (g.type === 'Point' ? xy(g.coordinates) : g.type === 'LineString' ? xy(g.coordinates[0]) : openRing(g.coordinates[0])[0])
  return inside(first(g1), g2) || inside(first(g2), g1)
}

/** True when every vertex of `inner` lies inside polygon `outer`. */
export function containedIn(inner: StudioGeometry, outer: StudioGeometry): boolean {
  if (outer.type !== 'Polygon') return false
  const ring = openRing(outer.coordinates[0])
  const pts = inner.type === 'Point' ? [xy(inner.coordinates)] : inner.type === 'LineString' ? inner.coordinates.map(xy) : openRing(inner.coordinates[0])
  return pts.every(p => pointInPolygon(p, ring) || ring.some((_, i) => distPointSegment(p, ring[i], ring[(i + 1) % ring.length]) < 1e-6))
}

/** Offset a polyline sideways by d (positive = left of travel). Mitred joints. */
export function offsetLine(pts: Pos[], d: number): Pos[] {
  const P = pts.map(xy)
  const normals = P.slice(1).map((b, i) => {
    const a = P[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    return [-(b[1] - a[1]) / L, (b[0] - a[0]) / L] as XY
  })
  return P.map((p, i) => {
    const n0 = normals[Math.max(0, i - 1)], n1 = normals[Math.min(normals.length - 1, i)]
    const nx = n0[0] + n1[0], ny = n0[1] + n1[1], L = Math.hypot(nx, ny) || 1
    const cos = (nx / L) * n1[0] + (ny / L) * n1[1]
    const k = d / Math.max(0.2, cos)
    return keepZ(pts[i], p[0] + (nx / L) * k, p[1] + (ny / L) * k)
  })
}

/** The ground within d of a segment: a rectangle with round ends. */
function band(a: XY, b: XY, d: number, steps = 8): XY[] {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
  const nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L
  const out: XY[] = []
  const cap = (c: XY, from: number) => {
    for (let k = 0; k <= steps; k++) {
      const t = from - (Math.PI * k) / steps
      out.push([c[0] + (Math.cos(t) * nx - Math.sin(t) * ny) * d, c[1] + (Math.sin(t) * nx + Math.cos(t) * ny) * d])
    }
  }
  cap(b, 0); cap(a, Math.PI)
  return out
}

function toTurf(r: XY[]) { return turfPolygon([closeRing(r).map(p => [p[0], p[1]])]) }

function largestOuter(f: any): XY[] | null {
  if (!f) return null
  const g = f.geometry
  const polys: number[][][][] = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
  let best: XY[] | null = null, bestA = 0
  for (const poly of polys) {
    const r = poly[0].slice(0, -1).map((c: number[]) => [c[0], c[1]] as XY)
    const a = Math.abs(signedArea(r))
    if (a > bestA) { best = r; bestA = a }
  }
  return best
}

/**
 * Buffer a geometry by d feet (d > 0 grows, d < 0 insets a polygon). The
 * result is the set of points within |d| of the geometry — exact for concave
 * shapes, the same construction the envelope uses for a pipestem lot.
 */
export function buffer(g: StudioGeometry, d: number): StudioGeometry | null {
  if (d === 0) return g
  const segs = segmentsOf(g)
  const bands = segs.map(([a, b]) => toTurf(band(a, b, Math.abs(d))))
  if (g.type === 'Point') {
    const c = xy(g.coordinates), ring: XY[] = []
    for (let k = 0; k < 32; k++) ring.push([c[0] + Math.abs(d) * Math.cos((2 * Math.PI * k) / 32), c[1] + Math.abs(d) * Math.sin((2 * Math.PI * k) / 32)])
    return { type: 'Polygon', coordinates: [closeRing(ring)] }
  }
  const all = bands.length > 1 ? turfUnion(featureCollection(bands)) : bands[0]
  if (g.type === 'LineString') {
    const r = largestOuter(all)
    return r ? { type: 'Polygon', coordinates: [closeRing(r)] } : null
  }
  const poly = toTurf(openRing(g.coordinates[0]))
  const res = d > 0
    ? turfUnion(featureCollection([poly, all as any]))
    : turfDifference(featureCollection([poly, all as any]))
  const r = largestOuter(res)
  return r ? { type: 'Polygon', coordinates: [closeRing(r)] } : null
}

/** Area of overlap between two polygons. */
export function overlapArea(g1: StudioGeometry, g2: StudioGeometry): number {
  if (g1.type !== 'Polygon' || g2.type !== 'Polygon') return 0
  const res = turfIntersect(featureCollection([toTurf(openRing(g1.coordinates[0])), toTurf(openRing(g2.coordinates[0]))]))
  if (!res) return 0
  const g = res.geometry as any
  const polys: number[][][][] = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
  return polys.reduce((s, p) => s + Math.abs(signedArea(p[0].slice(0, -1).map(c => [c[0], c[1]] as XY))), 0)
}

/** First intersection of the ray from a through b (beyond b) with any segment of `target`. */
function rayHit(a: XY, b: XY, target: StudioGeometry): XY | null {
  let best: { t: number; p: XY } | null = null
  for (const [c, d] of segmentsOf(target)) {
    const hit = segIntersect(a, b, c, d)
    if (hit && hit.t > 1 + 1e-9 && hit.u >= 0 && hit.u <= 1 && (!best || hit.t < best.t)) best = { t: hit.t, p: hit.p }
  }
  return best?.p ?? null
}

/** Extend a polyline's end until it meets `boundary`. */
export function extendLine(pts: Pos[], boundary: StudioGeometry, end: 'start' | 'end'): Pos[] | null {
  const P = pts.map(xy)
  if (end === 'end') {
    const hit = rayHit(P[P.length - 2], P[P.length - 1], boundary)
    return hit ? [...pts.slice(0, -1), keepZ(pts[pts.length - 1], hit[0], hit[1])] : null
  }
  const hit = rayHit(P[1], P[0], boundary)
  return hit ? [keepZ(pts[0], hit[0], hit[1]), ...pts.slice(1)] : null
}

/** Trim a polyline at its first crossing of `boundary`, keeping the chosen side. */
export function trimLine(pts: Pos[], boundary: StudioGeometry, keep: 'start' | 'end'): Pos[] | null {
  const P = pts.map(xy)
  for (let i = 1; i < P.length; i++) {
    for (const [c, d] of segmentsOf(boundary)) {
      const hit = segIntersect(P[i - 1], P[i], c, d)
      if (hit && hit.t >= 0 && hit.t <= 1 && hit.u >= 0 && hit.u <= 1) {
        const cut = keepZ(pts[i], hit.p[0], hit.p[1])
        return keep === 'start' ? [...pts.slice(0, i), cut] : [cut, ...pts.slice(i)]
      }
    }
  }
  return null
}

/** Split a polyline at the point on it nearest `at`. */
export function splitLine(pts: Pos[], at: XY): [Pos[], Pos[]] | null {
  const P = pts.map(xy)
  let best = { i: -1, d: Infinity, p: [0, 0] as XY }
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1], b = P[i], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy
    const t = L2 ? Math.max(0, Math.min(1, ((at[0] - a[0]) * dx + (at[1] - a[1]) * dy) / L2)) : 0
    const p: XY = [a[0] + t * dx, a[1] + t * dy], dd = Math.hypot(at[0] - p[0], at[1] - p[1])
    if (dd < best.d) best = { i, d: dd, p }
  }
  if (best.i < 0) return null
  const cut: Pos = [best.p[0], best.p[1]]
  const first = [...pts.slice(0, best.i), cut], second = [cut, ...pts.slice(best.i)]
  if (lineLength(first) < 1e-6 || lineLength(second) < 1e-6) return null
  return [first, second]
}

/** Join two polylines that share (within tol) an endpoint. */
export function joinLines(a: Pos[], b: Pos[], tol = 0.01): Pos[] | null {
  const eq = (p: Pos, q: Pos) => Math.hypot(p[0] - q[0], p[1] - q[1]) <= tol
  const A = a, B = b
  if (eq(A[A.length - 1], B[0])) return [...A, ...B.slice(1)]
  if (eq(A[A.length - 1], B[B.length - 1])) return [...A, ...[...B].reverse().slice(1)]
  if (eq(A[0], B[B.length - 1])) return [...B, ...A.slice(1)]
  if (eq(A[0], B[0])) return [...[...B].reverse(), ...A.slice(1)]
  return null
}

/** Round the corner at vertex i of a polyline with an arc of radius r. */
export function filletVertex(pts: Pos[], i: number, r: number, steps = 8): Pos[] | null {
  if (i <= 0 || i >= pts.length - 1 || r <= 0) return null
  const [a, v, b] = [xy(pts[i - 1]), xy(pts[i]), xy(pts[i + 1])]
  const u1 = [a[0] - v[0], a[1] - v[1]], u2 = [b[0] - v[0], b[1] - v[1]]
  const l1 = Math.hypot(u1[0], u1[1]), l2 = Math.hypot(u2[0], u2[1])
  const cosT = (u1[0] * u2[0] + u1[1] * u2[1]) / (l1 * l2)
  const theta = Math.acos(Math.max(-1, Math.min(1, cosT)))
  if (theta < 1e-3 || Math.PI - theta < 1e-3) return null
  const tLen = r / Math.tan(theta / 2)
  if (tLen > l1 || tLen > l2) return null
  const p1: XY = [v[0] + (u1[0] / l1) * tLen, v[1] + (u1[1] / l1) * tLen]
  const p2: XY = [v[0] + (u2[0] / l2) * tLen, v[1] + (u2[1] / l2) * tLen]
  const bis = [u1[0] / l1 + u2[0] / l2, u1[1] / l1 + u2[1] / l2], bl = Math.hypot(bis[0], bis[1])
  const cd = r / Math.sin(theta / 2)
  const c: XY = [v[0] + (bis[0] / bl) * cd, v[1] + (bis[1] / bl) * cd]
  let a1 = Math.atan2(p1[1] - c[1], p1[0] - c[0]), a2 = Math.atan2(p2[1] - c[1], p2[0] - c[0])
  let sweep = a2 - a1
  while (sweep > Math.PI) sweep -= 2 * Math.PI
  while (sweep < -Math.PI) sweep += 2 * Math.PI
  const arc: Pos[] = []
  for (let k = 0; k <= steps; k++) {
    const t = a1 + (sweep * k) / steps
    arc.push([c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)])
  }
  return [...pts.slice(0, i), ...arc, ...pts.slice(i + 1)]
}

/** Nearest point on geometry to p, and its distance. */
export function nearestOn(g: StudioGeometry, p: XY): { point: XY; distance: number } {
  if (g.type === 'Point') { const q = xy(g.coordinates); return { point: q, distance: Math.hypot(p[0] - q[0], p[1] - q[1]) } }
  let best = { point: p, distance: Infinity }
  for (const [a, b] of segmentsOf(g)) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy
    const t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)) : 0
    const q: XY = [a[0] + t * dx, a[1] + t * dy], d = Math.hypot(p[0] - q[0], p[1] - q[1])
    if (d < best.distance) best = { point: q, distance: d }
  }
  return best
}

export function isValidGeometry(g: StudioGeometry): string | null {
  const finite = (p: Pos) => p.every(Number.isFinite)
  if (g.type === 'Point') return finite(g.coordinates) ? null : 'point has non-finite coordinates'
  if (g.type === 'LineString') {
    if (g.coordinates.length < 2) return 'a line needs at least two vertices'
    if (!g.coordinates.every(finite)) return 'line has non-finite coordinates'
    if (lineLength(g.coordinates) < 1e-6) return 'line has zero length'
    return null
  }
  if (!g.coordinates.length || openRing(g.coordinates[0]).length < 3) return 'a polygon needs at least three vertices'
  if (!g.coordinates.flat().every(finite)) return 'polygon has non-finite coordinates'
  if (Math.abs(signedArea(openRing(g.coordinates[0]))) < 1e-6) return 'polygon has zero area'
  return null
}

/**
 * Per-edge inset of a polygon: the points at least `d[i]` from edge i. Exact
 * for concave outlines (it is the envelope definition, not half-plane
 * clipping). Returns the largest remaining piece.
 */
export function insetPerEdgeDistance(g: StudioGeometry, d: number[]): StudioGeometry | null {
  if (g.type !== 'Polygon') return null
  const ring = openRing(g.coordinates[0])
  const bands = ring.map((a, i) => (d[i] > 0 ? toTurf(band(a, ring[(i + 1) % ring.length], d[i])) : null)).filter(Boolean) as any[]
  if (!bands.length) return g
  const cut = bands.length > 1 ? turfUnion(featureCollection(bands)) : bands[0]
  const left = turfDifference(featureCollection([toTurf(ring), cut]))
  const r = largestOuter(left)
  return r ? { type: 'Polygon', coordinates: [closeRing(r)] } : null
}
