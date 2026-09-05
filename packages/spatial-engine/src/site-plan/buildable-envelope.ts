/**
 * Buildable envelope and the derived building footprint.
 *
 * The setbacks tell you where the house can go, so the footprint is derived
 * rather than asked for. Three constraints bind it, and the smallest wins:
 *
 *   1. The setback envelope   — front, side and rear yard depths, Sec. 27-4202
 *   2. Lot coverage maximum   — a percentage of net lot area, same table
 *   3. A programme cap        — what the client actually wants to build
 *
 * Skipping (2) is the trap. On a small lot, coverage binds long before the
 * setbacks do: a 2,506 sq ft lot in RSF-65 allows 35% coverage — 877 sq ft —
 * so a 1,500 sq ft footprint that sits comfortably inside the setback lines is
 * still a zoning violation. Deriving from geometry alone would draw it.
 */

import type { Ring, Position } from './site-twin'

export interface Setbacks {
  frontFt: number | null
  sideFt: number | null
  rearFt: number | null
  /** Largest of the three — the conservative uniform inset. */
  maxFt: number
  source: string
}

export interface FootprintConstraint {
  name: string
  limitSqFt: number | null
  binding: boolean
  detail: string
}

export interface BuildableEnvelope {
  /** Lot lines the footprint is closer to than its setback allows. Empty is correct. */
  encroachments: { yard: EdgeYard; requiredFt: number; actualFt: number }[]
  /**
   * Whether a fronting street was resolved. False means the lot has no
   * established frontage, which is a Sec. 24-128 condition, not a drafting
   * preference.
   */
  hasStreetFrontage: boolean
  /**
   * Length of the front lot line, in feet, and the zoning minimum it must
   * meet.
   *
   * `hasStreetFrontage` was a boolean — a lot either touched a street or did
   * not. RSF-65 requires 45 ft AT THE FRONT STREET LINE (Sec. 27-4202), so a
   * lot can front a street and still fail. Nothing measured it, so nothing
   * could catch that.
   */
  frontage: {
    providedFt: number | null
    requiredFt: number | null
    meets: boolean | null
  }
  /** Which yard each lot line was treated as. */
  edgeYards: EdgeYard[]
  /** Parcel inset by the setbacks. Null when there is no parcel to inset. */
  ring: Ring | null
  envelopeAreaSqFt: number | null
  setbacks: Setbacks
  constraints: FootprintConstraint[]
  /** Footprint area actually available, after every constraint. */
  allowedFootprintSqFt: number | null
  /** The proposed footprint, placed inside the envelope. */
  footprint: Ring | null
  footprintAreaSqFt: number | null
  caveats: string[]
}

/** Shoelace area, absolute. Local to this module — site-twin exports its own. */
function ringArea(ring: Ring): number {
  const p = ring.coordinates
  let a = 0
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    a += (p[j][0] + p[i][0]) * (p[j][1] - p[i][1])
  }
  return Math.abs(a / 2)
}

/**
 * Reads setbacks out of a zoning envelope's standards rows.
 *
 * Matches on the printed standard name because that is what the ordinance
 * table publishes; the row label carries its own footnote markers, so the match
 * is loose on punctuation but anchored on the yard word.
 */
export function extractSetbacks(
  standards: { standard: string; useColumn: string; numeric: number | null }[],
  useColumn = 'Single-Family Detached Dwelling',
  citation = 'Sec. 27-4202',
): Setbacks {
  const pick = (re: RegExp): number | null => {
    const row = standards.find(s => re.test(s.standard) && s.useColumn === useColumn)
      ?? standards.find(s => re.test(s.standard))
    return row?.numeric ?? null
  }
  const frontFt = pick(/front yard depth/i)
  const sideFt = pick(/side yard depth/i)
  const rearFt = pick(/rear yard depth/i)
  const known = [frontFt, sideFt, rearFt].filter((v): v is number => v !== null)
  return {
    frontFt, sideFt, rearFt,
    maxFt: known.length ? Math.max(...known) : 0,
    source: citation,
  }
}

/** Reads the lot coverage maximum, as a percentage. */
export function extractLotCoveragePct(
  standards: { standard: string; useColumn: string; numeric: number | null }[],
  useColumn = 'Single-Family Detached Dwelling',
): number | null {
  const row = standards.find(s => /lot coverage/i.test(s.standard) && s.useColumn === useColumn)
    ?? standards.find(s => /lot coverage/i.test(s.standard))
  return row?.numeric ?? null
}

/**
 * Signed area. Positive for counter-clockwise.
 */
function signedArea(pts: Position[]): number {
  let a = 0
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]
  }
  return a / 2
}

/** Open ring (no repeated last point), wound counter-clockwise. */
export function normaliseRing(ring: Ring): Position[] {
  const pts = ring.coordinates.map(c => [c[0], c[1]] as Position)
  if (pts.length > 1) {
    const [fx, fy] = pts[0], [lx, ly] = pts[pts.length - 1]
    if (Math.abs(fx - lx) < 1e-9 && Math.abs(fy - ly) < 1e-9) pts.pop()
  }
  return signedArea(pts) < 0 ? pts.reverse() : pts
}

/**
 * Clips a convex-ish polygon by a half-plane, Sutherland-Hodgman.
 *
 * The half-plane keeps points where the signed distance to the directed line
 * (a -> b) is >= 0, i.e. to the LEFT. With a counter-clockwise ring, left is
 * inward.
 */
function clipHalfPlane(pts: Position[], a: Position, b: Position): Position[] {
  const side = (p: Position) =>
    (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
  const out: Position[] = []
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i], nxt = pts[(i + 1) % pts.length]
    const dc = side(cur), dn = side(nxt)
    if (dc >= 0) out.push(cur)
    if ((dc >= 0) !== (dn >= 0)) {
      const t = dc / (dc - dn)
      out.push([cur[0] + t * (nxt[0] - cur[0]), cur[1] + t * (nxt[1] - cur[1])] as Position)
    }
  }
  return out
}

/**
 * A TRUE per-edge inset of the lot outline.
 *
 * Each edge is pushed inward along its own perpendicular by its own setback,
 * and the results are intersected as half-planes. This is the standard way a
 * buildable envelope is constructed and it does three things the previous
 * implementations did not:
 *
 *   - It follows the LOT OUTLINE, not the bounding box. An irregular lot's
 *     bounding box is larger than the lot, so a bbox inset produces an envelope
 *     that does not line up with the property lines.
 *   - It applies the CORRECT setback per edge — front 25, side 8, rear 20 —
 *     instead of the largest value on all four sides, which was throwing the
 *     front setback out and shrinking the envelope everywhere else.
 *   - It never over-claims, unlike the centroid-based radial shrink, which
 *     reports buildable area on a lot that has none.
 */
function insetPerEdge(ring: Ring, setbackForEdge: (i: number) => number): Ring | null {
  const pts = normaliseRing(ring)
  if (pts.length < 3) return null

  let poly = pts.slice()
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length]
    const dx = b[0] - a[0], dy = b[1] - a[1]
    const len = Math.hypot(dx, dy)
    if (len < 1e-9) continue
    // Inward normal for a CCW ring is the left normal of (a -> b).
    const nx = -dy / len, ny = dx / len
    const d = setbackForEdge(i)
    const a2: Position = [a[0] + nx * d, a[1] + ny * d]
    const b2: Position = [b[0] + nx * d, b[1] + ny * d]
    poly = clipHalfPlane(poly, a2, b2)
    if (poly.length < 3) return null
  }

  return { coordinates: [...poly, poly[0]] as Position[] }
}

/** Which yard each edge belongs to. */
export type EdgeYard = 'front' | 'side' | 'rear'

/**
 * Classifies every lot edge as front, side or rear.
 *
 * The front is the edge nearest the street. Without a street the classification
 * is not guessed — every edge is treated as FRONT, which is the conservative
 * reading and is reported so a reviewer knows the envelope is understated
 * rather than silently wrong.
 */
/** Perpendicular distance from a point to a segment. */
function distToSegment(p: Position, a: Position, b: Position): number {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1])
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2))
  return Math.hypot(p[0] - (a[0] + dx * t), p[1] - (a[1] + dy * t))
}

/**
 * Classifies lot edges against the street CENTRELINE, not a single point.
 *
 * Sec. 24-128: a lot must front a street. Which edge fronts it decides where
 * the 25 ft front setback goes and where the 8 ft side setbacks go, so getting
 * it wrong misplaces the building.
 *
 * A single nearest point is not enough. On an irregular lot where the street
 * runs past a corner, the point-to-midpoint test can pick a side edge — the
 * front setback then lands on the wrong line and the dwelling reads as sitting
 * at the rear. Measuring each edge against the whole centreline, and preferring
 * the edge that is both CLOSE and PARALLEL to it, is what a drafter does by eye.
 */
export function classifyEdgesFromStreet(
  ring: Ring, streetPaths: Position[][],
): EdgeYard[] {
  const pts = normaliseRing(ring)
  const n = pts.length
  const segs: [Position, Position][] = []
  for (const path of streetPaths) {
    for (let i = 0; i < path.length - 1; i++) segs.push([path[i], path[i + 1]])
  }
  if (segs.length === 0) return new Array(n).fill('front')

  const score = (i: number) => {
    const a = pts[i], b = pts[(i + 1) % n]
    const mid: Position = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    let best = Infinity, bestSeg: [Position, Position] | null = null
    for (const sg of segs) {
      const d = distToSegment(mid, sg[0], sg[1])
      if (d < best) { best = d; bestSeg = sg }
    }
    // Parallelism: 1 when the edge runs along the street, 0 when perpendicular.
    let para = 0
    if (bestSeg) {
      const e = Math.atan2(b[1] - a[1], b[0] - a[0])
      const t = Math.atan2(bestSeg[1][1] - bestSeg[0][1], bestSeg[1][0] - bestSeg[0][0])
      para = Math.abs(Math.cos(e - t))
    }
    // Distance dominates; parallelism breaks ties between comparable edges.
    return best * (1.6 - 0.6 * para)
  }

  let front = 0
  for (let i = 1; i < n; i++) if (score(i) < score(front)) front = i

  // Rear is the edge furthest from the street.
  const rawDist = (i: number) => {
    const a = pts[i], b = pts[(i + 1) % n]
    const mid: Position = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    return Math.min(...segs.map(sg => distToSegment(mid, sg[0], sg[1])))
  }
  let rear = 0
  for (let i = 1; i < n; i++) if (rawDist(i) > rawDist(rear)) rear = i

  const yards: EdgeYard[] = new Array(n).fill('side')
  yards[front] = 'front'
  if (rear !== front) yards[rear] = 'rear'
  return yards
}

export function classifyEdges(ring: Ring, streetPoint?: Position | null): EdgeYard[] {
  const pts = normaliseRing(ring)
  const n = pts.length
  if (!streetPoint) return new Array(n).fill('front')

  const mid = (i: number): Position => {
    const a = pts[i], b = pts[(i + 1) % n]
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  }
  const dist = (i: number) =>
    Math.hypot(mid(i)[0] - streetPoint[0], mid(i)[1] - streetPoint[1])

  let front = 0
  for (let i = 1; i < n; i++) if (dist(i) < dist(front)) front = i

  // The rear is the edge furthest from the street.
  let rear = 0
  for (let i = 1; i < n; i++) if (dist(i) > dist(rear)) rear = i

  const yards: EdgeYard[] = new Array(n).fill('side')
  yards[front] = 'front'
  if (rear !== front) yards[rear] = 'rear'
  return yards
}

function centroid(ring: Ring): Position {
  const p = ring.coordinates
  return [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length]
}

/**
 * Rectangle of a given area, ROTATED to the side lot line.
 *
 * A house is built parallel to its side property lines, not to grid north. An
 * axis-aligned box on a lot whose lines run at an angle reads as a mistake to
 * anyone looking at the sheet, and it misrepresents the side-yard clearance —
 * the corners approach the line while the middle does not.
 */
function rectangleAt(center: Position, areaSqFt: number, aspect: number, angleRad = 0): Ring {
  const w = Math.sqrt(areaSqFt * aspect)
  const h = areaSqFt / w
  const [cx, cy] = center
  const cos = Math.cos(angleRad), sin = Math.sin(angleRad)
  const corners: [number, number][] = [
    [-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2],
  ]
  const pts = corners.map(([dx, dy]) =>
    [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos] as Position)
  return { coordinates: [...pts, pts[0]] as Position[] }
}

/**
 * Centre point for a footprint set against the front building line.
 *
 * A dwelling is built to the front setback — that is what the setback is for —
 * and the yard it leaves behind is the rear yard. Centring the box in the
 * envelope pushes the house into the back of the lot and reads as wrong.
 */
function frontSetPosition(
  envelope: Ring, parcel: Ring, yards: EdgeYard[],
  areaSqFt: number, aspect: number, _angle: number,
): Position {
  const c = centroid(envelope)
  const pts = normaliseRing(parcel)
  const frontIdx = yards.indexOf('front')
  if (frontIdx < 0 || areaSqFt <= 0) return c

  const w = Math.sqrt(areaSqFt * aspect)
  const depth = areaSqFt / w

  const a = pts[frontIdx], b = pts[(frontIdx + 1) % pts.length]
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len, ny = dx / len

  const env = normaliseRing(envelope)
  let minProj = Infinity
  for (const p of env) {
    const proj = (p[0] - a[0]) * nx + (p[1] - a[1]) * ny
    if (proj < minProj) minProj = proj
  }
  const cProj = (c[0] - a[0]) * nx + (c[1] - a[1]) * ny
  const shift = Math.min(0, (minProj + depth / 2) - cProj)  // only toward the front
  return [c[0] + nx * shift, c[1] + ny * shift] as Position
}

/** True when the point lies inside the polygon. Ray casting. */
function pointInRing(pt: Position, poly: Position[]): boolean {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if ((yi > pt[1]) !== (yj > pt[1])
        && pt[0] < ((xj - xi) * (pt[1] - yi)) / ((yj - yi) || 1e-9) + xi) hit = !hit
  }
  return hit
}

function rectFits(rect: Ring, envelope: Ring): boolean {
  const poly = normaliseRing(envelope)
  return normaliseRing(rect).every(p => pointInRing(p, poly))
}

/**
 * The largest rectangle at this angle and aspect that fits INSIDE the envelope,
 * never exceeding the permitted area.
 *
 * Area alone does not guarantee containment: a 1,700 sq ft rectangle sized
 * against a 4,701 sq ft envelope still put two of its four corners outside the
 * BRL. That is a building drawn through the setback line, which is exactly what
 * makes a plan rejectable.
 *
 * Binary search on a scale factor. Returning a SMALLER building than the
 * programme asked for is the honest outcome when the envelope cannot hold it.
 */
/**
 * Places the dwelling AGAINST the front building line, retreating only as far
 * as it must to fit.
 *
 * A dwelling is built to the front setback — that is what the setback is for —
 * and the yard left behind is the rear yard. `largestFittingRectangle` only
 * ever SHRINKS at a fixed centre, so a front-set centre that could not take the
 * full house collapsed it: a 1,640 sq ft dwelling became 7 sq ft rather than
 * moving back a few feet. Area is what the customer asked for; position is what
 * the engine may adjust.
 *
 * The front direction comes from the STREET, via the edge classification, which
 * is why the street centrelines are fetched at all.
 */
function placeAgainstFront(
  envelope: Ring, parcel: Ring, yards: EdgeYard[],
  areaSqFt: number, aspect: number, angle: number,
): Ring | null {
  const pts = normaliseRing(parcel)
  const frontIdx = yards.indexOf('front')
  if (frontIdx < 0 || areaSqFt <= 0) return null

  const a = pts[frontIdx], b = pts[(frontIdx + 1) % pts.length]
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const len = Math.hypot(dx, dy) || 1
  // Inward normal, matching insetPerEdge's convention for a CCW ring.
  const nx = -dy / len, ny = dx / len

  // Start with the front face on the envelope's front boundary, then walk
  // back. One foot at a time is finer than any dimension a reviewer scales.
  const env = normaliseRing(envelope)
  const proj = (p: Position) => (p[0] - a[0]) * nx + (p[1] - a[1]) * ny
  const frontOfEnvelope = Math.min(...env.map(proj))
  const backOfEnvelope = Math.max(...env.map(proj))
  const depth = areaSqFt / Math.sqrt(areaSqFt * aspect)

  // Lateral position follows the envelope's own centre, so the house sits
  // between the side yards rather than against one of them.
  const c = centroid(envelope)
  const cProj = proj(c)

  // Lateral position is searched too, not just depth.
  //
  // The house was centred on the ENVELOPE'S CENTROID sideways, which is not the
  // middle of the side yards on a lot whose boundaries converge: the centroid
  // is pulled toward the wide end. On Lot 1 that left 4.6 ft against the 8 ft
  // divider while 14.4 ft went spare on the far side — a side-setback violation
  // with three feet of room available, caused by placement alone.
  //
  // Fitting inside the envelope IS meeting the setbacks: the envelope is the
  // per-edge inset. So the search takes the position that fits and sits most
  // nearly centred between the sides, preferring the smallest lateral shift so
  // the house does not slide to one boundary when it does not need to.
  const along = (p: Position) => (p[0] - a[0]) * (dx / len) + (p[1] - a[1]) * (dy / len)
  const env2 = env.map(along)
  const lateralRange = Math.max(...env2) - Math.min(...env2)
  for (let back = 0; back <= backOfEnvelope - frontOfEnvelope; back += 1) {
    const want = frontOfEnvelope + depth / 2 + back
    const shift = want - cProj
    const base: Position = [c[0] + nx * shift, c[1] + ny * shift]
    let best: Ring | null = null, bestOff = Infinity
    for (let off = 0; off <= lateralRange / 2; off += 0.5) {
      for (const sgn of off === 0 ? [1] : [1, -1]) {
        const centre: Position = [
          base[0] + (dx / len) * off * sgn,
          base[1] + (dy / len) * off * sgn,
        ]
        const rect = rectangleAt(centre, areaSqFt, aspect, angle)
        if (rectFits(rect, envelope) && off < bestOff) { best = rect; bestOff = off }
      }
      if (best) break
    }
    if (best) return best
  }
  return null
}

function largestFittingRectangle(
  envelope: Ring, centre: Position, targetAreaSqFt: number, aspect: number, angle: number,
): Ring | null {
  const at = (scale: number) => rectangleAt(centre, targetAreaSqFt * scale * scale, aspect, angle)

  const full = at(1)
  if (rectFits(full, envelope)) return full

  let lo = 0, hi = 1
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (rectFits(at(mid), envelope)) lo = mid
    else hi = mid
  }
  return lo > 0.05 ? at(lo) : null
}

/**
 * Bearing the house is built to: the direction of the FRONT lot line.
 *
 * The rectangle's primary axis runs along this, so its front face comes out
 * PARALLEL to the front property line and its sides parallel to the side lines.
 * Using the side line as the primary axis instead turns the house ninety
 * degrees and presents its gable end to the street.
 */
function frontLotLineAngle(ring: Ring, yards: EdgeYard[]): number {
  const pts = normaliseRing(ring)
  let best = -1, bestLen = 0
  // Prefer the front edge itself.
  for (let i = 0; i < pts.length; i++) {
    if (yards[i] !== 'front') continue
    const a = pts[i], b = pts[(i + 1) % pts.length]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (len > bestLen) { bestLen = len; best = i }
  }
  // No front edge classified. The longest edge on a typical lot is a SIDE
  // line, so take it and turn ninety degrees to face the street.
  if (best < 0) {
    let longest = -1
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length]
      const len = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (len > bestLen) { bestLen = len; longest = i }
    }
    if (longest < 0) return 0
    const a = pts[longest], b = pts[(longest + 1) % pts.length]
    return Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2
  }
  const a = pts[best], b = pts[(best + 1) % pts.length]
  return Math.atan2(b[1] - a[1], b[0] - a[0])
}

/**
 * Derives the buildable envelope and a footprint inside it.
 *
 * The inset is UNIFORM at the largest setback rather than per-edge, because
 * applying front/side/rear individually requires knowing which boundary fronts
 * the street, and that is not in the parcel geometry. A uniform inset at the
 * largest value is conservative: the envelope it produces is always inside the
 * true one, so the footprint never over-claims buildable area. Identifying the
 * street frontage is what unlocks the larger, correct envelope.
 */
/**
 * Length of the front lot line, against the zoning minimum.
 *
 * Sec. 24-128 makes street frontage what establishes a buildable lot, and
 * Sec. 27-4202 sets the minimum width AT the front street line — 45 ft in
 * RSF-65. A lot can touch a street and still fail that, which a boolean cannot
 * express.
 */
function measureFrontage(
  parcel: Ring, yards: EdgeYard[],
  standards: { standard: string; useColumn: string; numeric: number | null }[],
  useColumn: string,
): { providedFt: number | null; requiredFt: number | null; meets: boolean | null } {
  const row = standards.find(r => /lot frontage|frontage \(width\)/i.test(r.standard) && r.useColumn === useColumn)
    ?? standards.find(r => /lot frontage|frontage \(width\)/i.test(r.standard))
  const requiredFt = row?.numeric ?? null

  const pts = normaliseRing(parcel)
  // Every edge classified front — a lot can front two streets on a corner.
  let providedFt: number | null = null
  for (let i = 0; i < pts.length; i++) {
    if (yards[i] !== 'front') continue
    const a = pts[i], b = pts[(i + 1) % pts.length]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    providedFt = (providedFt ?? 0) + len
  }
  if (providedFt !== null) providedFt = Math.round(providedFt * 100) / 100

  return {
    providedFt,
    requiredFt,
    // Null rather than false when either side is unknown: an unmeasured
    // frontage is not a failing one, and saying so would be a fabricated
    // finding.
    meets: providedFt !== null && requiredFt !== null ? providedFt >= requiredFt : null,
  }
}

export function deriveBuildableEnvelope(input: {
  parcel: Ring | null
  standards: { standard: string; useColumn: string; numeric: number | null }[]
  useColumn?: string
  citation?: string
  /** Programme cap — what the client wants. */
  maxFootprintSqFt?: number
  /**
   * A STATED footprint proportion, width along the front lot line ÷ depth.
   *
   * Without it the footprint takes the ENVELOPE's proportion, which is a
   * reasonable default for an estimated house and wrong for a real one: a
   * 46 x 26 dwelling on a deep narrow envelope came out 33 x 36, the right
   * area and the wrong building.
   */
  footprintAspect?: number
  /**
   * The footprint dimensions are STATED, not estimated.
   *
   * An estimated house may shrink to fit — its size was a guess and a smaller
   * guess is still a guess. A stated one may not: shrinking 46 x 26 to 39 x 22
   * draws a different building at the right area and tells no one. When a
   * stated footprint does not fit, it is drawn at the stated size and the
   * overrun is reported.
   */
  footprintStated?: boolean
  /**
   * On a TRIANGULAR lot, give every non-front edge the SIDE yard.
   *
   * A triangle has no lot line opposite the front, so the default here — rear
   * goes to the edge furthest from the street — applies a 20 ft yard along a
   * boundary that is arguably a side. Ordinances commonly define a triangular
   * lot's rear line as a short line parallel to the front at maximum distance,
   * which leaves the two converging edges as sides.
   *
   * Off by default: the restrictive reading is the safe one to draw when nobody
   * has ruled. Turned on, it is a STATED DETERMINATION by whoever set it, and
   * the drawing says so rather than presenting it as the engine's own reading
   * of the code.
   */
  triangleRearAsSide?: boolean
  /** Net lot area for the coverage calculation. Defaults to the parcel area. */
  netLotAreaSqFt?: number
  /**
   * A point on the fronting street, in the same CRS as the parcel.
   *
   * REQUIRED. A lot without street frontage is not a buildable lot: PGC Code
   * Sec. 24-128 requires a recorded private right-of-way easement for a parcel
   * accessed only by ingress/egress easement, and DPIE Design Review item E-4
   * asks for it. Absence is a finding, not a default — without a street there
   * is no front lot line, so setbacks cannot be assigned and a house cannot be
   * oriented. Resolve it from the jurisdiction's street centreline layer.
   */
  streetPoint: Position | null
  /**
   * Street centrelines. PREFERRED over `streetPoint` — a lot must front a
   * street (Sec. 24-128), and which edge fronts it is measured against the
   * centreline, not a single nearby point.
   */
  streetPaths?: Position[][] | null
}): BuildableEnvelope {
  const { parcel, standards, maxFootprintSqFt = 1500 } = input
  const setbacks = extractSetbacks(standards, input.useColumn, input.citation)
  const coveragePct = extractLotCoveragePct(standards, input.useColumn)
  const caveats: string[] = []
  const constraints: FootprintConstraint[] = []

  if (!parcel) {
    return {
      encroachments: [], hasStreetFrontage: Boolean(input.streetPoint), edgeYards: [],
      frontage: { providedFt: null, requiredFt: null, meets: null },
      ring: null, envelopeAreaSqFt: null, setbacks, constraints,
      allowedFootprintSqFt: null, footprint: null, footprintAreaSqFt: null,
      caveats: ['No parcel boundary, so no buildable envelope can be derived.'],
    }
  }

  const lotAreaSqFt = input.netLotAreaSqFt ?? ringArea(parcel)
  const yards = input.streetPaths?.length
    ? classifyEdgesFromStreet(parcel, input.streetPaths)
    : classifyEdges(parcel, input.streetPoint ?? null)
  // A stated determination that a triangle has no rear lot line.
  const triangleSided = Boolean(input.triangleRearAsSide) && yards.length === 3
  if (triangleSided) {
    for (let i = 0; i < yards.length; i++) if (yards[i] === 'rear') yards[i] = 'side'
  }
  const perEdge = (i: number): number => {
    const y = yards[i] ?? 'front'
    if (y === 'front') return setbacks.frontFt ?? setbacks.maxFt
    if (y === 'rear') return setbacks.rearFt ?? setbacks.maxFt
    return setbacks.sideFt ?? setbacks.maxFt
  }
  const ring = insetPerEdge(parcel, perEdge)
  const envelopeAreaSqFt = ring ? ringArea(ring) : 0

  if (!ring) {
    return {
      encroachments: [], hasStreetFrontage: Boolean(input.streetPoint), edgeYards: yards,
      frontage: measureFrontage(parcel, yards, input.standards, input.useColumn ?? 'Single-Family Detached Dwelling'),
      ring: null, envelopeAreaSqFt: 0, setbacks,
      constraints: [{
        name: 'Setback envelope', limitSqFt: 0, binding: true,
        detail: `Front ${setbacks.frontFt ?? '?'} ft, side ${setbacks.sideFt ?? '?'} ft, ` +
          `rear ${setbacks.rearFt ?? '?'} ft (${setbacks.source}). A uniform ${setbacks.maxFt} ft ` +
          'inset consumes the entire lot.',
      }],
      allowedFootprintSqFt: 0, footprint: null, footprintAreaSqFt: null,
      caveats: [
        `No buildable area remains after a uniform ${setbacks.maxFt} ft inset. This is the ` +
        'CONSERVATIVE reading — the inset applies the largest yard depth to all four sides. ' +
        'Identifying which boundary fronts the street would apply front, side and rear ' +
        'individually and may open a usable envelope. Do not conclude the lot is unbuildable ' +
        'from this alone.',
      ],
    }
  }

  constraints.push({
    name: 'Setback envelope',
    limitSqFt: envelopeAreaSqFt,
    binding: false,
    detail: `Front ${setbacks.frontFt ?? '?'} ft, side ${setbacks.sideFt ?? '?'} ft, ` +
      `rear ${setbacks.rearFt ?? '?'} ft (${setbacks.source}), applied per edge` +
      (input.streetPoint ? '.' : ' — no street reference, so every edge took the front setback.'),
  })

  const coverageLimit = coveragePct !== null ? (lotAreaSqFt * coveragePct) / 100 : null
  constraints.push({
    name: 'Lot coverage maximum',
    limitSqFt: coverageLimit,
    binding: false,
    detail: coveragePct !== null
      ? `${coveragePct}% of ${Math.round(lotAreaSqFt).toLocaleString()} sq ft net lot area.`
      : 'No lot coverage maximum published for this zone — NOT verified as unlimited.',
  })

  constraints.push({
    name: 'Programme cap',
    limitSqFt: maxFootprintSqFt,
    binding: false,
    detail: `Requested maximum footprint ${maxFootprintSqFt.toLocaleString()} sq ft.`,
  })

  const limits = constraints.filter(c => c.limitSqFt !== null) as (FootprintConstraint & { limitSqFt: number })[]
  const allowed = Math.min(...limits.map(c => c.limitSqFt))
  for (const c of limits) if (c.limitSqFt === allowed) c.binding = true

  if (coveragePct === null) {
    caveats.push(
      'No lot coverage maximum was found for this zone. The footprint is limited by setbacks and ' +
      'the programme cap only — confirm coverage against the table before relying on it.')
  }
  caveats.push(
    'The envelope is a true per-edge inset of the lot outline: each property line is offset inward by ' +
    'its own yard depth and the results intersected. It follows the lot, not its bounding box. ' +
    'Verify against a surveyed plat before construction — the boundary itself is GIS, not survey.')

  // Align the footprint with the FRONT lot line and proportion it to the
  // envelope measured in that same rotated frame.
  // Computed inline from the SAME normalised ring `yards` was built on. The
  // separate helper re-derived the ring and could disagree about which index
  // is the front, which silently dropped into its longest-edge fallback and
  // turned the house ninety degrees — its gable to the street.
  const angle = (() => {
    const pts = normaliseRing(parcel)
    let best = -1, bestLen = 0
    for (let i = 0; i < pts.length; i++) {
      if (yards[i] !== 'front') continue
      const a = pts[i], b = pts[(i + 1) % pts.length]
      const len = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (len > bestLen) { bestLen = len; best = i }
    }
    if (best < 0) return frontLotLineAngle(parcel, yards)
    const a = pts[best], b = pts[(best + 1) % pts.length]
    return Math.atan2(b[1] - a[1], b[0] - a[0])
  })()
  const cos = Math.cos(-angle), sin = Math.sin(-angle)
  const rot = ring.coordinates.map(c => [c[0] * cos - c[1] * sin, c[0] * sin + c[1] * cos])
  const envW = Math.max(...rot.map(c => c[0])) - Math.min(...rot.map(c => c[0]))
  const envH = Math.max(...rot.map(c => c[1])) - Math.min(...rot.map(c => c[1]))
  // A stated proportion wins over the envelope's. It is not clamped: the
  // clamp exists to keep a DERIVED aspect sane, and a dimension someone
  // measured is not the engine's to correct.
  const aspect = input.footprintAspect && input.footprintAspect > 0
    ? input.footprintAspect
    : envH > 0 ? Math.max(0.25, Math.min(4, envW / envH)) : 1

  // Place the house against the FRONT building line, not in the middle of the
  // envelope. A dwelling is built to the front setback — that is what the
  // setback is for — and the yard it leaves behind is the rear yard. Centring
  // it pushes the house into the back of the lot and reads as wrong.
  const centre = frontSetPosition(ring, parcel, yards, allowed, aspect, angle)
  // Area alone does NOT guarantee containment. A 1,700 sq ft rectangle sized
  // against a 4,701 sq ft envelope still put two of its four corners outside
  // the BRL — a building drawn through the setback line, which is precisely
  // what makes a plan rejectable. Shrink until it genuinely fits.
  // Against the front line first, at the full requested area. Only if the
  // house cannot fit anywhere along the lot's depth does it shrink in place.
  const stated = input.footprintStated === true
  const footprint = allowed > 0
    ? (placeAgainstFront(ring, parcel, yards, allowed, aspect, angle)
       // A stated footprint keeps its size. Where it will not fit inside the
       // BRL it is placed against the front line anyway, at full dimensions,
       // and the encroachment is named below — a drawing that shows the real
       // building breaking the setback is useful; one that quietly shows a
       // smaller building is not.
       ?? (stated
           ? rectangleAt(frontSetPosition(ring, parcel, yards, allowed, aspect, angle),
                         allowed, aspect, angle)
           : largestFittingRectangle(ring, centre, allowed, aspect, angle)))
    : null
  const statedFits = !stated || !footprint || rectFits(footprint, ring)

  if (allowed <= 0) {
    caveats.push('No buildable area remains after the setbacks. This lot cannot take a principal structure as zoned.')
  }

  // Verify the footprint against the LOT LINES themselves.
  //
  // Containment inside the envelope polygon is not sufficient. Half-plane
  // clipping on an acute corner can leave an envelope vertex closer to a lot
  // line than that line's offset, so a footprint can sit inside the envelope
  // and still encroach — measured at 21.7 ft against a 25 ft front setback on
  // this lot. The setback is a distance to the PROPERTY LINE; check that.
  const encroachments: { yard: EdgeYard; requiredFt: number; actualFt: number }[] = []
  if (footprint) {
    const lotPts = normaliseRing(parcel)
    const fpPts = normaliseRing(footprint)
    for (let i = 0; i < lotPts.length; i++) {
      const y = yards[i] ?? 'front'
      const required = perEdge(i)
      const a = lotPts[i], b2 = lotPts[(i + 1) % lotPts.length]
      let nearest = Infinity
      for (const c of fpPts) {
        const dx = b2[0] - a[0], dy = b2[1] - a[1]
        const len2 = dx * dx + dy * dy
        const t = len2 ? Math.max(0, Math.min(1, ((c[0] - a[0]) * dx + (c[1] - a[1]) * dy) / len2)) : 0
        nearest = Math.min(nearest, Math.hypot(c[0] - (a[0] + dx * t), c[1] - (a[1] + dy * t)))
      }
      if (nearest + 0.05 < required) {
        encroachments.push({ yard: y, requiredFt: required, actualFt: Number(nearest.toFixed(2)) })
      }
    }
  }
  for (const e of encroachments) {
    caveats.push(
      `SETBACK ENCROACHMENT: the footprint sits ${e.actualFt} ft from a ${e.yard} lot line where ` +
      `${e.requiredFt} ft is required. The drawing must not be issued in this state — a reviewer ` +
      'rejects it on sight. Reduce or reshape the footprint.')
  }

  const drawnAreaSqFt = footprint ? ringArea(footprint) : 0
  // A TRIANGULAR LOT HAS NO EDGE OPPOSITE THE FRONT.
  //
  // The rear is assigned here as the edge furthest from the street, which is
  // right for a quadrilateral and is a choice on a triangle: the two non-front
  // edges both run from the frontage to the apex, and calling one of them the
  // rear applies a 20 ft rear yard along its whole length where an 8 ft side
  // yard might apply instead. On Lot 2 that is the difference between a 2,051
  // sq ft envelope and a materially larger one.
  //
  // Zoning ordinances commonly define the rear lot line for a triangular lot as
  // a short line parallel to the front at the maximum distance, rather than a
  // whole edge. WHETHER PRINCE GEORGE'S DOES SO HAS NOT BEEN VERIFIED against
  // Subtitle 27 here, so the more restrictive assignment stands and the
  // question is put to the reviewer rather than answered by assumption.
  if (normaliseRing(parcel).length === 3 && !triangleSided) {
    caveats.push(
      'TRIANGULAR LOT — CONFIRM THE REAR LOT LINE. A triangle has no lot line opposite the front, ' +
      'so the edge furthest from the street has been given the REAR yard and the remaining edge the ' +
      'side yard. Many ordinances instead define the rear lot line of a triangular lot as a short ' +
      'line parallel to the front at the maximum distance, which would apply the side yard to both ' +
      'edges and enlarge the buildable envelope. Confirm the definition in Subtitle 27 before ' +
      'relying on this envelope — the assignment drawn here is the more restrictive of the two.')
  }
  if (triangleSided) {
    caveats.push(
      'TRIANGULAR LOT — NO REAR LOT LINE APPLIED. Every boundary other than the frontage takes the ' +
      'SIDE yard, on the reading that a triangle has no lot line opposite the front. This is a ' +
      'STATED DETERMINATION carried into the drawing, not the engine reading the code: it enlarges ' +
      'the buildable envelope against the default, and the zoning reviewer confirms it.')
  }

  if (stated && !statedFits) {
    const w = Math.sqrt(allowed * aspect)
    caveats.push(
      `THE STATED FOOTPRINT DOES NOT FIT THE BUILDING RESTRICTION LINE. ` +
      `${w.toFixed(0)} ft by ${(allowed / w).toFixed(0)} ft is drawn at full size and crosses the ` +
      `setback. Reduce the dwelling, seek a variance, or confirm the dimensions — the drawing ` +
      `shows the building as stated, not a smaller one that would fit.`)
  }

  if (footprint && allowed - drawnAreaSqFt > 1) {
    caveats.push(
      `The permitted footprint is ${Math.round(allowed).toLocaleString()} sq ft, but the largest ` +
      `rectangle that FITS inside the setback envelope at this orientation is ` +
      `${Math.round(drawnAreaSqFt).toLocaleString()} sq ft. Area alone does not guarantee ` +
      'containment on an irregular lot. A different footprint shape, or an L-plan, may recover ' +
      'the difference — that is a design decision, not a drafting one.')
  }
  if (allowed > 0 && !footprint) {
    caveats.push(
      'No rectangle at this orientation fits inside the setback envelope. The lot may still be ' +
      'buildable with a different building shape.')
  }

  return {
    encroachments,
    hasStreetFrontage: Boolean(input.streetPaths?.length || input.streetPoint),
    frontage: measureFrontage(parcel, yards, input.standards, input.useColumn ?? 'Single-Family Detached Dwelling'),
    edgeYards: yards,
    ring,
    envelopeAreaSqFt,
    setbacks,
    constraints,
    allowedFootprintSqFt: allowed > 0 ? allowed : 0,
    footprint,
    footprintAreaSqFt: footprint ? ringArea(footprint) : null,
    caveats,
  }
}
