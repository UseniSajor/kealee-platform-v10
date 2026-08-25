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
 * Inward inset of the parcel's bounding box, by a perpendicular distance.
 *
 * NOT the centroid-based radial shrink used elsewhere in this package. That
 * method scales vertices toward the centroid, which is not a perpendicular
 * offset and OVER-CLAIMS: a true 25 ft inset of a 50 x 50 lot leaves zero
 * buildable area, while the radial method reports about 225 sq ft. Drawing a
 * footprint in that phantom area would put a building through the setback line.
 *
 * The bounding box is used rather than the parcel outline because a correct
 * polygon offset on an arbitrary lot is a different problem (mitre and
 * self-intersection handling). For a rectangular lot — most lots — the bbox IS
 * the outline. For an irregular lot the bbox is larger than the parcel, so this
 * is reported as approximate and must be checked against the plat.
 */
function insetBoundingBox(ring: Ring, feet: number): Ring | null {
  const xs = ring.coordinates.map(c => c[0])
  const ys = ring.coordinates.map(c => c[1])
  const minX = Math.min(...xs) + feet, maxX = Math.max(...xs) - feet
  const minY = Math.min(...ys) + feet, maxY = Math.max(...ys) - feet
  if (maxX <= minX || maxY <= minY) return null
  return {
    coordinates: [
      [minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY], [minX, minY],
    ] as Position[],
  }
}

function centroid(ring: Ring): Position {
  const p = ring.coordinates
  return [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length]
}

/** Axis-aligned rectangle of a given area, proportioned to the envelope. */
function rectangleAt(center: Position, areaSqFt: number, aspect: number): Ring {
  const w = Math.sqrt(areaSqFt * aspect)
  const h = areaSqFt / w
  const [x, y] = center
  return {
    coordinates: [
      [x - w / 2, y - h / 2], [x + w / 2, y - h / 2],
      [x + w / 2, y + h / 2], [x - w / 2, y + h / 2],
      [x - w / 2, y - h / 2],
    ] as Position[],
  }
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
}): BuildableEnvelope {
  const { parcel, standards, maxFootprintSqFt = 1500 } = input
  const setbacks = extractSetbacks(standards, input.useColumn, input.citation)
  const coveragePct = extractLotCoveragePct(standards, input.useColumn)
  const caveats: string[] = []
  const constraints: FootprintConstraint[] = []

  if (!parcel) {
    return {
      ring: null, envelopeAreaSqFt: null, setbacks, constraints,
      allowedFootprintSqFt: null, footprint: null, footprintAreaSqFt: null,
      caveats: ['No parcel boundary, so no buildable envelope can be derived.'],
    }
  }

  const lotAreaSqFt = input.netLotAreaSqFt ?? ringArea(parcel)
  const ring = insetBoundingBox(parcel, setbacks.maxFt)
  const envelopeAreaSqFt = ring ? ringArea(ring) : 0

  if (!ring) {
    return {
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
      `rear ${setbacks.rearFt ?? '?'} ft (${setbacks.source}). Uniform inset applied at ` +
      `${setbacks.maxFt} ft.`,
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
    'The setback inset is UNIFORM at the largest of the three yard depths, because identifying which ' +
    'boundary fronts the street requires more than the parcel geometry. Applying the LARGEST yard ' +
    'depth to all four sides is the conservative reading of the setbacks; on a shallow lot it can ' +
    'consume the whole envelope, which means "not established", not "unbuildable".')
  caveats.push(
    'The envelope is the parcel BOUNDING BOX inset perpendicular, not a true polygon offset of the ' +
    'lot outline. For a rectangular lot these are the same. For an irregular lot the bounding box is ' +
    'larger than the parcel, so the envelope may extend outside the real boundary — verify against ' +
    'the plat before construction.')

  // Proportion the footprint to the envelope so it sits naturally on the lot.
  const xs = ring.coordinates.map(c => c[0]), ys = ring.coordinates.map(c => c[1])
  const envW = Math.max(...xs) - Math.min(...xs), envH = Math.max(...ys) - Math.min(...ys)
  const aspect = envH > 0 ? Math.max(0.25, Math.min(4, envW / envH)) : 1

  const footprint = allowed > 0 ? rectangleAt(centroid(ring), allowed, aspect) : null

  if (allowed <= 0) {
    caveats.push('No buildable area remains after the setbacks. This lot cannot take a principal structure as zoned.')
  }

  return {
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
