/**
 * WATER AND SEWER HOUSE CONNECTIONS FROM THE MAINS, CLEAR OF EVERYTHING BUILT.
 *
 * A service is laid in open trench. Drawn under a driveway, an apron, a walk,
 * a stoop or a bioretention cell, it is a pipe that cannot be repaired — or
 * even installed after the slab — without breaking out concrete. The per-lot
 * design ran each service square from the house wall to the front lot line and
 * never looked at the paving it crossed; on a cul-de-sac, where drives fan in
 * toward the bulb, almost every service ended up under a drive.
 *
 * This runs each lot's pair from ITS OWN MAIN (the water service to the water
 * main, the sewer lateral to the sewer main), each tapped square to the main,
 * leaving the dwelling at points `separationFt` apart along one wall (WSSC
 * 10 ft water/sewer horizontal separation), and accepts a pair only when both
 * runs:
 *   - keep `clearanceFt` off every obstacle (paving, practices, culverts,
 *     other buildings) — no concrete or structure has to be removed;
 *   - stay inside the lot or the public right-of-way — never through a
 *     neighbour;
 *   - do not pass under their own dwelling;
 *   - hold the separation over their whole length.
 * The shortest acceptable pair wins. If none exists, nothing is invented: the
 * caller keeps what it had and reports the lot.
 *
 * Coordinates are State Plane feet (EPSG:2248); no projection.
 */
import type { Position } from './site-twin'

export interface ConnectionObstacle { label: string; ring?: Position[]; line?: Position[] }

export interface HouseConnectionInput {
  dwelling: Position[]
  /** Rings the run may occupy: the lot itself and the street right-of-way. */
  allowed: Position[][]
  waterMain: Position[]
  sewerMain: Position[]
  obstacles: ConnectionObstacle[]
  separationFt?: number
  clearanceFt?: number
}

export interface HouseConnectionRoute {
  /** Main tap first, dwelling last; three points where the run bends once. */
  water: Position[]
  sewer: Position[]
  lengthFt: number
  minClearanceFt: number
}

const dist = (a: Position, b: Position) => Math.hypot(a[0] - b[0], a[1] - b[1])

function nearestOnLine(p: Position, line: Position[]): Position {
  let best: Position = line[0], bd = Infinity
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i], b = line[i + 1]
    const vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx * vx + vy * vy
    if (!L2) continue
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2))
    const q: Position = [a[0] + vx * t, a[1] + vy * t]
    const d = dist(p, q)
    if (d < bd) { bd = d; best = q }
  }
  return best
}

function distToPolyline(p: Position, line: Position[]): number {
  return dist(p, nearestOnLine(p, line))
}

function inRing(p: Position, ring: Position[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

const closed = (r: Position[]): Position[] =>
  r.length && dist(r[0], r[r.length - 1]) < 1e-6 ? r : [...r, r[0]]

/** Points every `step` ft from a to b, stopping `trim` ft short of b. */
function samples(a: Position, b: Position, step: number, trim: number): Position[] {
  const L = dist(a, b), n = Math.max(1, Math.ceil((L - trim) / step))
  const out: Position[] = []
  for (let k = 0; k <= n; k++) {
    const t = Math.min(L - trim, k * step) / (L || 1)
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
  }
  return out
}

/** Clearance from one point to an obstacle; negative when inside a ring. */
function clearanceTo(p: Position, o: ConnectionObstacle): number {
  if (o.ring && o.ring.length > 2) {
    const r = closed(o.ring)
    const d = distToPolyline(p, r)
    return inRing(p, r) ? -d : d
  }
  if (o.line && o.line.length > 1) return distToPolyline(p, o.line)
  return Infinity
}

/** Smallest clearance along a run to any obstacle, or -1 if it leaves the allowed area or enters the house. */
function runClearance(a: Position, b: Position, inp: HouseConnectionInput, house: Position[]): number {
  let minC = Infinity
  // `b` is ON the dwelling wall; the last half foot touches it by design.
  for (const p of samples(a, b, 1, 0.5)) {
    if (inRing(p, house) && distToPolyline(p, house) > 0.25) return -1
    if (!inp.allowed.some(r => inRing(p, closed(r)) || distToPolyline(p, closed(r)) < 0.25)) return -1
    for (const o of inp.obstacles) minC = Math.min(minC, clearanceTo(p, o))
  }
  return minC
}

function pathDist(p1: Position[], p2: Position[]): number {
  let m = Infinity
  for (let i = 0; i < p1.length - 1; i++) for (const p of samples(p1[i], p1[i + 1], 1, 0)) m = Math.min(m, distToPolyline(p, p2))
  return m
}
const pathLen = (p: Position[]) => p.slice(1).reduce((s, q, i) => s + dist(p[i], q), 0)

/** Points on a polyline every `step` ft within `range` ft (by arc length) of the point nearest `p`. */
function tapsNear(p: Position, line: Position[], range: number, step: number): Position[] {
  const cum = [0]
  for (let i = 1; i < line.length; i++) cum.push(cum[i - 1] + dist(line[i - 1], line[i]))
  let s0 = 0, bd = Infinity
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i], b = line[i + 1], L = cum[i + 1] - cum[i]
    if (!L) continue
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / (L * L)))
    const d = dist(p, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
    if (d < bd) { bd = d; s0 = cum[i] + t * L }
  }
  const at = (s: number): Position => {
    s = Math.max(0, Math.min(cum[cum.length - 1], s))
    let i = 0
    while (i < line.length - 2 && cum[i + 1] < s) i++
    const L = cum[i + 1] - cum[i] || 1, t = (s - cum[i]) / L
    return [line[i][0] + (line[i + 1][0] - line[i][0]) * t, line[i][1] + (line[i + 1][1] - line[i][1]) * t]
  }
  const out: Position[] = [at(s0)]
  for (let k = step; k <= range; k += step) out.push(at(s0 - k), at(s0 + k))
  return out
}

type Box = [number, number, number, number]
const boxOf = (pts: Position[], pad = 0): Box => {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
  return [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad]
}
const overlap = (a: Box, b: Box) => a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3]

export function routeHouseConnections(inp: HouseConnectionInput): HouseConnectionRoute | null {
  const sep = inp.separationFt ?? 10
  const clr = inp.clearanceFt ?? 3
  const house = closed(inp.dwelling)
  const obsBoxes = inp.obstacles.map(o => boxOf((o.ring ?? o.line ?? [[Infinity, Infinity]]) as Position[]))
  // Clear run from a tap on `main` to the exit `e`: the tap square to the main
  // where that is clear, otherwise slid along the main (up to 60 ft) to the
  // nearest clear angle. Cost = length + a premium for leaving square.
  type Run = { path: Position[]; cost: number; clr: number }
  const memo = new Map<string, Run[]>()
  const clearOf = (a: Position, b: Position) => {
    const sub = { ...inp, obstacles: inp.obstacles.filter((_, i) => overlap(obsBoxes[i], boxOf([a, b], clr + 0.5))) }
    return runClearance(a, b, sub, house)
  }
  // Straight from the main to `from` (the wall, or the bend), tap slid along
  // the main to the cheapest clear one.
  // The cheapest few, not one: the cheapest water and sewer runs can
  // converge, and the pair then needs the next tap along.
  const KEEP = 6
  const straight = (from: Position, main: Position[]): Run[] => {
    const sqLen = dist(from, nearestOnLine(from, main)) || 1
    const opts = tapsNear(from, main, 60, 2).map(t => {
      const len = dist(from, t)
      const dev = Math.acos(Math.max(-1, Math.min(1, sqLen / (len || 1)))) * 180 / Math.PI
      return { t, cost: len + dev * 0.6 }
    }).sort((x, y) => x.cost - y.cost)
    const out: Run[] = []
    for (const { t, cost } of opts) {
      const c = clearOf(t, from)
      if (c < clr) continue
      out.push({ path: [t, from], cost, clr: c })
      if (out.length >= KEEP) break
    }
    return out
  }
  // A straight run if one is clear; otherwise ONE bend — out of the wall
  // square for 5-40 ft, then straight to the main — the way a service is
  // taken out past a walk or a stoop. A bend costs 15 ft.
  const bestRuns = (e: Position, nrm: Position, main: Position[], key: string): Run[] => {
    const k = `${key}:${e[0].toFixed(2)},${e[1].toFixed(2)}`
    if (memo.has(k)) return memo.get(k)!
    let runs = straight(e, main)
    if (!runs.length) {
      for (let d = 5; d <= 40; d += 2.5) {
        const b: Position = [e[0] + nrm[0] * d, e[1] + nrm[1] * d]
        const c1 = clearOf(b, e)
        if (c1 < clr) break
        for (const r of straight(b, main)) runs.push({ path: [...r.path, e], cost: r.cost + d + 15, clr: Math.min(c1, r.clr) })
      }
      runs = runs.sort((x, y) => x.cost - y.cost).slice(0, KEEP)
    }
    memo.set(k, runs)
    return runs
  }
  let best: HouseConnectionRoute & { cost: number } | null = null
  for (let i = 0; i < house.length - 1; i++) {
    const a = house[i], b = house[i + 1]
    const L = dist(a, b)
    if (L < sep + 3) continue
    const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L
    const at = (s: number): Position => [a[0] + ux * s, a[1] + uy * s]
    // outward normal of this wall
    const mid = at(L / 2)
    let nrm: Position = [-uy, ux]
    if (inRing([mid[0] + nrm[0] * 0.5, mid[1] + nrm[1] * 0.5], house)) nrm = [uy, -ux]
    // The exits are spaced along the wall by whatever it takes for the RUNS to
    // hold the separation: on a wall skewed to the street (every lot on a
    // cul-de-sac bulb) exits 10 ft apart give runs only ~7 ft apart.
    const pairs: [Position, Position][] = []
    for (let s1 = 1.5; s1 <= L - 1.5; s1 += 1) {
      for (let s2 = s1 + sep; s2 <= L - 1.5 && s2 <= s1 + sep * 2.5; s2 += 1) {
        pairs.push([at(s1), at(s2)], [at(s2), at(s1)])
      }
    }
    {
      for (const [pw, ps] of pairs) {
        const ws = bestRuns(pw, nrm, inp.waterMain, 'w')
        if (!ws.length) continue
        const vs = bestRuns(ps, nrm, inp.sewerMain, 's')
        for (const w of ws) for (const v of vs) {
          const cost = w.cost + v.cost
          if (best && cost >= best.cost) continue
          if (pathDist(w.path, v.path) < sep) continue
          best = { water: w.path, sewer: v.path, lengthFt: pathLen(w.path) + pathLen(v.path), minClearanceFt: Math.min(w.clr, v.clr), cost }
        }
      }
    }
  }
  if (!best) return null
  const { cost: _c, ...route } = best
  return route
}
