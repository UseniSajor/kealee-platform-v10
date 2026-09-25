import { describe, it, expect } from 'vitest'
import { measureBlockFace, frontEdgeOf, type BlockLot } from '../jurisdictions/block-face-setback'
import type { Position } from '../site-plan/site-twin'

// A street along y = 0 running east. Lots 50 ft wide, 150 ft deep, north of
// it, with their front lot lines 25 ft back from the centreline (a 50 ft ROW).
const street: Position[][] = [[[-100, 0], [600, 0]]]
const lot = (i: number, north = true): BlockLot => {
  const x0 = i * 50, y0 = north ? 25 : -25, y1 = north ? 175 : -175
  return { id: `L${i}${north ? 'n' : 's'}`, ring: [[x0, y0], [x0 + 50, y0], [x0 + 50, y1], [x0, y1], [x0, y0]] }
}
const house = (i: number, setback: number, north = true, w = 30, d = 40): Position[] => {
  const x0 = i * 50 + 10
  const y0 = north ? 25 + setback : -25 - setback
  const y1 = north ? y0 + d : y0 - d
  return [[x0, y0], [x0 + w, y0], [x0 + w, y1], [x0, y1], [x0, y0]]
}

describe('measureBlockFace', () => {
  it('reports the range of front setbacks on the same side of the street', () => {
    const lots = [0, 1, 2, 3, 4].map(i => lot(i))
    const r = measureBlockFace({
      subject: lots[2], blockLots: lots, streetPaths: street,
      footprints: [house(0, 20), house(1, 24), house(3, 30), house(4, 22)],
    })
    expect(r.determined).toBe(true)
    expect(r.minFt).toBe(20)
    expect(r.maxFt).toBe(30)
    expect(r.samples).toHaveLength(4)
    expect(r.meanFt).toBe(24)
  })

  it('ignores the other side of the street', () => {
    const north = [0, 1, 2].map(i => lot(i))
    const south = [0, 1, 2].map(i => lot(i, false))
    const r = measureBlockFace({
      subject: north[1], blockLots: [...north, ...south], streetPaths: street,
      footprints: [house(0, 20), house(2, 22), house(0, 5, false), house(2, 60, false)],
    })
    expect(r.samples.map(s => s.lotId).sort()).toEqual(['L0n', 'L2n'])
    expect([r.minFt, r.maxFt]).toEqual([20, 22])
  })

  it('takes the principal building, not the garage at the back', () => {
    const lots = [0, 1, 2].map(i => lot(i))
    const garage: Position[] = [[10, 140], [30, 140], [30, 160], [10, 160], [10, 140]]
    const r = measureBlockFace({
      subject: lots[1], blockLots: lots, streetPaths: street,
      footprints: [house(0, 18), garage, house(2, 26)],
    })
    expect(r.samples.find(s => s.lotId === 'L0n')!.setbackFt).toBe(18)
  })

  it('does not count a corner lot that fronts the cross street', () => {
    const lots = [0, 1, 2].map(i => lot(i))
    // Cross street just west of lot 0, nearer its centroid than the main street.
    const cross: Position[][] = [[[-5, -100], [-5, 300]]]
    const r = measureBlockFace({
      subject: lots[1], blockLots: lots, streetPaths: street, otherStreetPaths: cross,
      footprints: [house(0, 2), house(2, 26)],
    })
    expect(r.samples.map(s => s.lotId)).toEqual(['L2n'])
    expect(r.determined).toBe(false)
  })

  it('states a range only with two or more measured neighbours, and names the vacant lots', () => {
    const lots = [0, 1, 2].map(i => lot(i))
    const r = measureBlockFace({ subject: lots[1], blockLots: lots, streetPaths: street, footprints: [house(0, 20)] })
    expect(r.determined).toBe(false)
    expect(r.minFt).toBeNull()
    expect(r.vacantLotIds).toEqual(['L2n'])
    expect(r.caveats.join(' ')).toMatch(/open item/)
  })

  it('finds the front edge of the subject lot', () => {
    const e = frontEdgeOf(lot(1).ring, street)!
    expect(e.every(p => p[1] === 25)).toBe(true)
  })
})
