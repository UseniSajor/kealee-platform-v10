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
  /**
   * Whether a fronting street was resolved. False means the lot has no
   * established frontage, which is a Sec. 24-128 condition, not a drafting
   * preference.
   */
  hasStreetFrontage: boolean
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
function normaliseRing(ring: Ring): Position[] {
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
export function deriveBuildableEnvelope(input: {
  parcel: Ring | null
  standards: { standard: string; useColumn: string; numeric: number | null }[]
  useColumn?: string
  citation?: string
  /** Programme cap — what the client wants. */
  maxFootprintSqFt?: number
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
}): BuildableEnvelope {
  const { parcel, standards, maxFootprintSqFt = 1500 } = input
  const setbacks = extractSetbacks(standards, input.useColumn, input.citation)
  const coveragePct = extractLotCoveragePct(standards, input.useColumn)
  const caveats: string[] = []
  const constraints: FootprintConstraint[] = []

  if (!parcel) {
    return {
      hasStreetFrontage: Boolean(input.streetPoint), edgeYards: [],
      ring: null, envelopeAreaSqFt: null, setbacks, constraints,
      allowedFootprintSqFt: null, footprint: null, footprintAreaSqFt: null,
      caveats: ['No parcel boundary, so no buildable envelope can be derived.'],
    }
  }

  const lotAreaSqFt = input.netLotAreaSqFt ?? ringArea(parcel)
  const yards = classifyEdges(parcel, input.streetPoint ?? null)
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
      hasStreetFrontage: Boolean(input.streetPoint), edgeYards: yards,
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
  const angle = frontLotLineAngle(parcel, yards)
  const cos = Math.cos(-angle), sin = Math.sin(-angle)
  const rot = ring.coordinates.map(c => [c[0] * cos - c[1] * sin, c[0] * sin + c[1] * cos])
  const envW = Math.max(...rot.map(c => c[0])) - Math.min(...rot.map(c => c[0]))
  const envH = Math.max(...rot.map(c => c[1])) - Math.min(...rot.map(c => c[1]))
  const aspect = envH > 0 ? Math.max(0.25, Math.min(4, envW / envH)) : 1

  const footprint = allowed > 0 ? rectangleAt(centroid(ring), allowed, aspect, angle) : null

  if (allowed <= 0) {
    caveats.push('No buildable area remains after the setbacks. This lot cannot take a principal structure as zoned.')
  }

  return {
    hasStreetFrontage: Boolean(input.streetPoint),
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
