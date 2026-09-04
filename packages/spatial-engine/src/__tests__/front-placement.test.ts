/**
 * A dwelling is built TO the front building line.
 *
 * That is what the setback is for, and the yard it leaves behind is the rear
 * yard. Two failures shipped before this was asserted:
 *
 *   1. `largestFittingRectangle` only ever SHRINKS at a fixed centre, so a
 *      front-set centre that could not take the full house collapsed it — a
 *      1,640 sq ft dwelling became 7 sq ft rather than moving back a few feet.
 *   2. The collapse only appeared when STREET geometry was supplied, because
 *      that switches the edge classification. The path with a bare street point
 *      was fine, so the diagnostic scripts and the production path disagreed.
 *
 * The front direction comes from the street. That is why the centrelines are
 * fetched at all.
 */

import { deriveBuildableEnvelope } from '../site-plan/buildable-envelope'
import type { Ring, Position } from '../site-plan/site-twin'

/** 100 x 96 ft lot; the street lies below it, so the south edge is the front. */
const PARCEL: Ring = {
  coordinates: [
    [1340350, 440150], [1340450, 440150], [1340450, 440246],
    [1340350, 440246], [1340350, 440150],
  ],
}
const STREET_POINT: Position = [1340400, 440120]
const STREET_PATH: Position[][] = [[[1340300, 440120], [1340500, 440120]]]

const USE = 'Single-Family Detached Dwelling'
/** RSF-65 as PGAtlas publishes it: front 25, side 8, rear 20. */
const STANDARDS = [
  { standard: 'Front yard depth, min. (ft)', useColumn: USE, numeric: 25 },
  { standard: 'Side yard depth, min. (ft) (2)', useColumn: USE, numeric: 8 },
  { standard: 'Rear yard depth, min. (ft)', useColumn: USE, numeric: 20 },
  { standard: 'Lot coverage, max. (% of net lot area)', useColumn: USE, numeric: 35 },
]

function distToSegment(p: Position, a: Position, b: Position): number {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const L = dx * dx + dy * dy || 1
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L))
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))
}
const distToRing = (p: Position, ring: Position[]): number =>
  Math.min(...ring.slice(0, -1).map((_, i) => distToSegment(p, ring[i], ring[i + 1])))

function envelope(opts: { withStreetPaths: boolean; area: number }) {
  return deriveBuildableEnvelope({
    parcel: PARCEL,
    standards: STANDARDS,
    useColumn: USE,
    streetPoint: STREET_POINT,
    ...(opts.withStreetPaths ? { streetPaths: STREET_PATH } : {}),
    maxFootprintSqFt: opts.area,
  })
}

describe('the dwelling is placed against the front building line', () => {
  it.each([
    ['a bare street point', false],
    ['street centrelines', true],
  ])('keeps the full requested area with %s', (_label, withStreetPaths) => {
    const b = envelope({ withStreetPaths: withStreetPaths as boolean, area: 1640 })
    expect(b.footprint).not.toBeNull()
    // Area is what the customer asked for. Position is what the engine adjusts.
    // 7 sq ft was the observed collapse; anything near it is the same bug.
    expect(b.footprintAreaSqFt).toBeGreaterThan(1500)
  })

  it('puts the FRONT FACE on the building restriction line', () => {
    const b = envelope({ withStreetPaths: true, area: 1640 })
    const ring = b.ring!.coordinates as Position[]
    const on = (b.footprint!.coordinates as Position[])
      .filter(p => distToRing(p, ring) < 1)
    // A rectangle set against the line touches it along a whole face: the two
    // front corners. One is a corner clip; zero is a house adrift in the lot.
    expect(on.length).toBeGreaterThanOrEqual(2)
  })

  it('never draws the dwelling through the setback line', () => {
    // The envelope IS the setback line. Containment is the whole contract.
    const b = envelope({ withStreetPaths: true, area: 1640 })
    const ring = b.ring!.coordinates as Position[]
    const inside = (pt: Position) => {
      let c = false
      for (let i = 0, j = ring.length - 2; i < ring.length - 1; j = i++) {
        const [xi, yi] = ring[i], [xj, yj] = ring[j]
        if (distToRing(pt, ring) < 1e-6) return true
        if ((yi > pt[1]) !== (yj > pt[1])
          && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c
      }
      return c
    }
    for (const pt of b.footprint!.coordinates as Position[]) expect(inside(pt)).toBe(true)
  })
})
