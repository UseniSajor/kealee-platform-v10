/**
 * A concave lot's envelope. Half-plane clipping extends each edge's line
 * across the whole lot, which is exact for a convex outline and destroys a
 * concave one: a 24 ft pipestem's side lines cut a 19,134 SF Prince William
 * lot (3427 Grouse Ct, GPIN 8293-10-5733) to a 75 SF envelope.
 */
import { describe, it, expect } from 'vitest'
import { deriveBuildableEnvelope } from '../site-plan/buildable-envelope'
import type { Ring, Position } from '../site-plan/site-twin'

const USE = 'Single-Family Detached Dwelling'
const STANDARDS = [
  { standard: 'Front yard depth, min. (ft)', useColumn: USE, numeric: 35 },
  { standard: 'Side yard depth, min. (ft)', useColumn: USE, numeric: 10 },
  { standard: 'Rear yard depth, min. (ft)', useColumn: USE, numeric: 25 },
]

/**
 * A pipestem: a 25 ft stem, 60 ft long, from the street (south) into a
 * 120 x 120 ft body. Stem on x 0–25, body x -40..80, y 60..180.
 */
const PIPESTEM: Ring = {
  coordinates: [
    [0, 0], [25, 0], [25, 60], [80, 60], [80, 180], [-40, 180], [-40, 60], [0, 60], [0, 0],
  ],
}
const STREET: Position[][] = [[[-100, -20], [200, -20]]]

const area = (r: Position[]) => {
  let a = 0
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1]
  return Math.abs(a / 2)
}
function distToSegment(p: Position, a: Position, b: Position): number {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const L = dx * dx + dy * dy || 1
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L))
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))
}

describe('the envelope of a concave (pipestem) lot', () => {
  const env = deriveBuildableEnvelope({ parcel: PIPESTEM, standards: STANDARDS, useColumn: USE, streetPaths: STREET })

  it('keeps the body of the lot buildable', () => {
    expect(env.ring).not.toBeNull()
    // The body is 120 x 120; with 10–35 ft yards well over 4,000 SF remains.
    expect(env.envelopeAreaSqFt!).toBeGreaterThan(4000)
    expect(env.envelopeAreaSqFt!).toBeLessThan(120 * 120)
  })

  it('keeps every envelope vertex at least the side setback from every lot line', () => {
    const lot = PIPESTEM.coordinates as Position[]
    for (const p of (env.ring!.coordinates as Position[])) {
      const d = Math.min(...lot.slice(0, -1).map((_, i) => distToSegment(p, lot[i], lot[i + 1])))
      expect(d).toBeGreaterThanOrEqual(10 - 0.01)
    }
  })

  it('places a house in the body, not a sliver at the neck', () => {
    const e = deriveBuildableEnvelope({
      parcel: PIPESTEM, standards: STANDARDS, useColumn: USE, streetPaths: STREET, maxFootprintSqFt: 6000,
    })
    // 6,000 SF will not fit; the largest that does is well over 2,000 SF.
    expect(e.footprintAreaSqFt!).toBeGreaterThan(2000)
    expect(e.encroachments).toEqual([])
  })

  it('leaves a convex lot to the exact half-plane inset', () => {
    const square: Ring = { coordinates: [[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]] }
    const e = deriveBuildableEnvelope({ parcel: square, standards: STANDARDS, useColumn: USE, streetPaths: STREET })
    // 100 − 10 − 10 wide, 100 − 35 − 25 deep.
    expect(area(e.ring!.coordinates.slice(0, -1) as Position[])).toBeCloseTo(80 * 40, 0)
  })
})
