import { describe, expect, it } from 'vitest'
import { routeHouseConnections } from '../site-plan/house-connections'
import type { Position } from '../site-plan/site-twin'

// Street along y = 0 (R/W y -30..0 below the lot), lot y 0..150, house 50 ft
// wide set back 40 ft. Water main at y = -10, sewer at y = -20.
const lot: Position[] = [[0, 0], [100, 0], [100, 150], [0, 150], [0, 0]]
const row: Position[] = [[-50, -30], [150, -30], [150, 0], [-50, 0], [-50, -30]]
const house: Position[] = [[25, 40], [75, 40], [75, 80], [25, 80], [25, 40]]
const waterMain: Position[] = [[-50, -10], [150, -10]]
const sewerMain: Position[] = [[-50, -20], [150, -20]]
const minX = (l: Position[]) => Math.min(l[0][0], l[1][0])
const maxX = (l: Position[]) => Math.max(l[0][0], l[1][0])

describe('routeHouseConnections', () => {
  it('runs both services square to the mains, 10 ft apart, from the front wall', () => {
    const r = routeHouseConnections({ dwelling: house, allowed: [lot, row], waterMain, sewerMain, obstacles: [] })!
    expect(r).not.toBeNull()
    expect(r.water[0][1]).toBeCloseTo(-10)
    expect(r.sewer[0][1]).toBeCloseTo(-20)
    expect(Math.abs(r.water[1][0] - r.sewer[1][0])).toBeCloseTo(10)
    expect(r.water[1][1]).toBeCloseTo(40)
  })

  it('keeps both services 3 ft clear of a driveway in front of the house', () => {
    // a 12-ft drive and its apron from x 44..56, house face to the street edge
    const drive: Position[] = [[44, -5], [56, -5], [56, 40], [44, 40], [44, -5]]
    const r = routeHouseConnections({
      dwelling: house, allowed: [lot, row], waterMain, sewerMain,
      obstacles: [{ label: 'drive', ring: drive }],
    })!
    expect(r).not.toBeNull()
    for (const l of [r.water, r.sewer]) expect(maxX(l) <= 41 || minX(l) >= 59).toBe(true)
    expect(r.minClearanceFt).toBeGreaterThanOrEqual(3)
  })

  it('never routes through a neighbouring lot, and gives up rather than invent a route', () => {
    // paving across the whole frontage: there is no clear way to the street
    const slab: Position[] = [[-50, -5], [150, -5], [150, 30], [-50, 30], [-50, -5]]
    const r = routeHouseConnections({
      dwelling: house, allowed: [lot, row], waterMain, sewerMain,
      obstacles: [{ label: 'slab', ring: slab }],
    })
    expect(r).toBeNull()
  })
})
