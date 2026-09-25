/**
 * A contextual front setback, MEASURED from the block face.
 *
 * DC's rule (11-D § 206.2, 11-E § 206.2) has no number in it: a house's front
 * setback must fall "within the range of existing front setbacks of all
 * residential buildings on the same side of the street in the block". The only
 * honest way to put a number on a drawing is to measure the block, so that is
 * what this does:
 *
 *   1. Take the lots in the same block (a DC SQUARE) that front the same street
 *      on the same side as the subject lot.
 *   2. On each, take the principal building — the largest footprint — and
 *      measure its nearest point to that lot's front lot line.
 *   3. Report the range, every sample, and what the samples are made of.
 *
 * WHAT THE MEASUREMENT IS NOT
 *
 * Footprints are planimetric roof outlines digitised from aerial imagery. A
 * roof overhang or a front porch roof reads nearer the street than the wall,
 * and nothing in the layer says which buildings are residential. The range is
 * therefore evidence for a reviewer and a basis for the drawing, stated as
 * such, not a determination by the Zoning Administrator.
 *
 * Nothing here is fabricated: with fewer than two measured neighbours there is
 * no range, the result says so, and the front setback is an open item.
 */

import type { Position } from '../site-plan/site-twin'

export interface BlockLot {
  id: string
  ring: Position[]
}

export interface BlockFaceSample {
  lotId: string
  setbackFt: number
  footprintAreaSqFt: number
}

export interface BlockFaceResult {
  /** Enough neighbours were measured to state a range. */
  determined: boolean
  minFt: number | null
  maxFt: number | null
  /** Mean of the samples, for rules that ask for the block AVERAGE (11-D § 702.1). */
  meanFt: number | null
  samples: BlockFaceSample[]
  /** Lots on the block face that carried no building to measure. */
  vacantLotIds: string[]
  /** The subject lot's own front edge, in the engine CRS. */
  subjectFrontEdge: [Position, Position] | null
  caveats: string[]
}

// ── geometry ────────────────────────────────────────────────────────────────

function open(ring: Position[]): Position[] {
  const pts = ring.map(p => [p[0], p[1]] as Position)
  if (pts.length > 1) {
    const a = pts[0], b = pts[pts.length - 1]
    if (Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9) pts.pop()
  }
  return pts
}

export function polygonArea(ring: Position[]): number {
  const pts = open(ring)
  let a = 0
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]
  }
  return Math.abs(a / 2)
}

export function centroid(ring: Position[]): Position {
  const pts = open(ring)
  let a = 0, cx = 0, cy = 0
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const f = pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]
    a += f
    cx += (pts[j][0] + pts[i][0]) * f
    cy += (pts[j][1] + pts[i][1]) * f
  }
  if (Math.abs(a) < 1e-9) {
    return [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length]
  }
  return [cx / (3 * a), cy / (3 * a)]
}

export function pointInPolygon(p: Position, ring: Position[]): boolean {
  const pts = open(ring)
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j]
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function closestOnSegment(p: Position, a: Position, b: Position): { d: number; t: number; q: Position } {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const len2 = dx * dx + dy * dy
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2))
  const q: Position = [a[0] + t * dx, a[1] + t * dy]
  return { d: Math.hypot(p[0] - q[0], p[1] - q[1]), t, q }
}

/** Nearest point on a set of polylines, with the direction of the segment it lies on. */
function nearestOnPaths(p: Position, paths: Position[][]): { d: number; q: Position; dir: Position } | null {
  let best: { d: number; q: Position; dir: Position } | null = null
  for (const path of paths) {
    for (let i = 0; i + 1 < path.length; i++) {
      const c = closestOnSegment(p, path[i], path[i + 1])
      if (!best || c.d < best.d) {
        best = { d: c.d, q: c.q, dir: [path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]] }
      }
    }
  }
  return best
}

/** +1 or -1: which side of the street a point lies on. */
function sideOf(p: Position, paths: Position[][]): number {
  const n = nearestOnPaths(p, paths)
  if (!n) return 0
  const cross = n.dir[0] * (p[1] - n.q[1]) - n.dir[1] * (p[0] - n.q[0])
  return Math.sign(cross)
}

/** The lot edge that fronts the street: nearest midpoint, and roughly parallel to it. */
export function frontEdgeOf(ring: Position[], streetPaths: Position[][]): [Position, Position] | null {
  const pts = open(ring)
  let best: { score: number; edge: [Position, Position] } | null = null
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (len < 3) continue
    const mid: Position = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    const n = nearestOnPaths(mid, streetPaths)
    if (!n) continue
    const dlen = Math.hypot(n.dir[0], n.dir[1]) || 1
    const cos = Math.abs(((b[0] - a[0]) * n.dir[0] + (b[1] - a[1]) * n.dir[1]) / (len * dlen))
    // Distance dominates; a skewed edge is penalised so a short chamfer at a
    // corner does not outrank the real frontage.
    const score = n.d + (1 - cos) * 40
    if (!best || score < best.score) best = { score, edge: [a, b] }
  }
  return best?.edge ?? null
}

/** Nearest distance from a polygon's vertices and edges to a segment. */
function polygonToSegment(poly: Position[], a: Position, b: Position): number {
  const pts = open(poly)
  let d = Infinity
  for (const p of pts) d = Math.min(d, closestOnSegment(p, a, b).d)
  // Segment endpoints against polygon edges, for a building that overhangs the
  // lot line's extension rather than presenting a vertex to it.
  for (let i = 0; i < pts.length; i++) {
    const q = pts[i], r = pts[(i + 1) % pts.length]
    d = Math.min(d, closestOnSegment(a, q, r).d, closestOnSegment(b, q, r).d)
  }
  return d
}

/**
 * Measures the block face.
 *
 * `blockLots` should be the lots of the subject's block (DC: the same SQUARE).
 * `otherStreetPaths` are every OTHER street near the block, so a corner lot
 * that fronts the cross street is not counted on this face.
 */
export function measureBlockFace(input: {
  subject: BlockLot
  blockLots: BlockLot[]
  streetPaths: Position[][]
  otherStreetPaths?: Position[][]
  footprints: Position[][]
  /** Footprints smaller than this are accessory structures. Default 300 sq ft. */
  minPrincipalSqFt?: number
  source?: string
}): BlockFaceResult {
  const caveats: string[] = [
    'Measured from planimetric building footprints (roof outlines from aerial imagery) to each ' +
    "lot's front lot line. An overhang or porch roof reads nearer the street than the wall.",
    'The footprint layer does not say which buildings are residential; every principal building ' +
    'on the block face is counted.',
  ]
  if (input.source) caveats.push(`Source: ${input.source}.`)
  const result: BlockFaceResult = {
    determined: false, minFt: null, maxFt: null, meanFt: null,
    samples: [], vacantLotIds: [], subjectFrontEdge: null, caveats,
  }
  if (!input.streetPaths.length) {
    caveats.push('No centreline for the fronting street, so the block face cannot be identified.')
    return result
  }

  const subjectSide = sideOf(centroid(input.subject.ring), input.streetPaths)
  result.subjectFrontEdge = frontEdgeOf(input.subject.ring, input.streetPaths)
  const minPrincipal = input.minPrincipalSqFt ?? 300
  const others = input.otherStreetPaths ?? []

  for (const lot of input.blockLots) {
    if (lot.id === input.subject.id) continue
    const c = centroid(lot.ring)
    if (sideOf(c, input.streetPaths) !== subjectSide) continue
    const here = nearestOnPaths(c, input.streetPaths)
    const there = others.length ? nearestOnPaths(c, others) : null
    // A corner lot nearer the cross street fronts the cross street.
    if (!here || (there && there.d < here.d)) continue

    const front = frontEdgeOf(lot.ring, input.streetPaths)
    if (!front) continue
    const onLot = input.footprints
      .filter(fp => pointInPolygon(centroid(fp), lot.ring))
      .map(fp => ({ fp, area: polygonArea(fp) }))
      .filter(x => x.area >= minPrincipal)
      .sort((a, b) => b.area - a.area)
    if (!onLot.length) {
      result.vacantLotIds.push(lot.id)
      continue
    }
    const principal = onLot[0]
    result.samples.push({
      lotId: lot.id,
      setbackFt: Math.round(polygonToSegment(principal.fp, front[0], front[1]) * 10) / 10,
      footprintAreaSqFt: Math.round(principal.area),
    })
  }

  if (result.samples.length < 2) {
    caveats.push(
      `Only ${result.samples.length} building(s) measured on this block face. A range needs at ` +
      'least two; the front setback is an open item for the reviewer.')
    return result
  }
  const vals = result.samples.map(s => s.setbackFt)
  result.determined = true
  result.minFt = Math.min(...vals)
  result.maxFt = Math.max(...vals)
  result.meanFt = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
  return result
}

export interface StructureTypeEvidence {
  structure: 'detached' | 'semi_detached' | 'row'
  /** Distance from the principal building to each side lot line, ft. */
  sideGapsFt: number[]
  footprintAreaSqFt: number
}

/**
 * Detached, semi-detached or row, MEASURED from the existing building.
 *
 * A building within a foot of a side lot line is on it — a party wall read
 * through roof-outline digitising. Two such sides is a row building, one is
 * semi-detached. Returns null when there is no principal building to measure;
 * a vacant lot's structure type is the customer's to state.
 */
export function inferStructureType(
  lotRing: Position[], footprints: Position[][], streetPaths: Position[][],
  opts: { touchFt?: number; minPrincipalSqFt?: number } = {},
): StructureTypeEvidence | null {
  const touch = opts.touchFt ?? 1.0
  const principal = footprints
    .filter(fp => pointInPolygon(centroid(fp), lotRing))
    .map(fp => ({ fp, area: polygonArea(fp) }))
    .filter(x => x.area >= (opts.minPrincipalSqFt ?? 300))
    .sort((a, b) => b.area - a.area)[0]
  if (!principal) return null
  const front = frontEdgeOf(lotRing, streetPaths)
  if (!front) return null
  const fdx = front[1][0] - front[0][0], fdy = front[1][1] - front[0][1]
  const flen = Math.hypot(fdx, fdy) || 1
  const pts = open(lotRing)
  const gaps: number[] = []
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (len < 3) continue
    const cos = Math.abs(((b[0] - a[0]) * fdx + (b[1] - a[1]) * fdy) / (len * flen))
    if (cos > 0.5) continue // front or rear: roughly parallel to the frontage
    gaps.push(Math.round(polygonToSegment(principal.fp, a, b) * 10) / 10)
  }
  const touching = gaps.filter(g => g <= touch).length
  return {
    structure: touching >= 2 ? 'row' : touching === 1 ? 'semi_detached' : 'detached',
    sideGapsFt: gaps,
    footprintAreaSqFt: Math.round(principal.area),
  }
}
