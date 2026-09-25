import { describe, it, expect } from 'vitest'
import { dcEnvelope, parseDcZone, dcTablesMissing } from '../jurisdictions/dc-zoning'
import { dcTable, dcRowsForZone } from '../jurisdictions/dc-dimensional-standards.generated'

describe('DC zone parsing', () => {
  it('splits base and geographic modifiers, and maps R-1A/R-1B onto the R-1 table rows', () => {
    const z = parseDcZone('R-1A/TS/NO')
    expect(z).toMatchObject({ base: 'R-1A', modifiers: ['TS', 'NO'], family: 'R-1', subtitle: 'D' })
  })

  it('accepts the pre-2023 spelling R-1-B', () => {
    expect(parseDcZone('R-1-B').base).toBe('R-1B')
  })
})

describe('the extracted tables — regressions for each trap found', () => {
  it('has every table the assembler reads', () => {
    expect(dcTablesMissing()).toEqual([])
  })

  it('keeps D § 211.1 (pervious surface) out of D § 210.1 (lot occupancy)', () => {
    // The heading of D § 211.1 sits at the foot of one page and its body on
    // the next; merged, R-1 read as 50% lot occupancy instead of 40%.
    const occ = dcTable('D § 210.1')!
    expect(occ.rows.map(r => r[2])).not.toContain('50')
    const perv = dcTable('D § 211.1')!
    expect(dcRowsForZone(perv, 'R-1').find(r => /All Other/.test(r[1] ?? ''))?.[2]).toBe('50')
  })

  it('keeps the rows after a reprinted heading (G § 210.1 MU-4 through MU-15)', () => {
    const t = dcTable('G § 210.1')!
    expect(dcRowsForZone(t, 'MU-15')).toHaveLength(1)
    expect(dcRowsForZone(t, 'MU-4')[0][1]).toBe('60 75 (IZ)')
  })

  it('splits a second table out of a grid it was merged into (E § 4904.1)', () => {
    expect(dcTable('E § 4903.1')!.rows).toHaveLength(1)
    expect(dcTable('E § 4904.1')!.rows.length).toBeGreaterThan(0)
  })
})

describe('R zones (Subtitle D)', () => {
  it('assembles an R-1B detached envelope from four tables and the side-yard prose', () => {
    const e = dcEnvelope('R-1B')
    expect(e.computable).toBe(true)
    expect(e.front.mode).toBe('block_range')
    expect(e.sideYard).toMatchObject({ value: 8, citation: '11-D § 208.2' })
    expect(e.sideYardCount).toBe(2)
    expect(e.rearYard).toMatchObject({ value: 25, citation: '11-D § 207.1' })
    expect(e.lotOccupancyPct.value).toBe(40)
    expect(e.heightFt.value).toBe(40)
    expect(e.stories.value).toBe(3)
    expect(e.perviousPct?.value).toBe(50)
    expect(e.minLotWidthFt?.value).toBe(50)
    expect(e.minLotAreaSqFt?.value).toBe(5000)
  })

  it('gives an R-3 row building 60% occupancy and no side yards', () => {
    const e = dcEnvelope('R-3', { structure: 'row' })
    expect(e.lotOccupancyPct.value).toBe(60)
    expect(e.sideYard.value).toBe(0)
    expect(e.sideYardCount).toBe(0)
  })

  it('gives an R-3 semi-detached building one 5 ft side yard, R-2 one 8 ft', () => {
    expect(dcEnvelope('R-3', { structure: 'semi_detached' }).sideYard.value).toBe(5)
    expect(dcEnvelope('R-2', { structure: 'semi_detached' }).sideYard.value).toBe(8)
  })

  it('applies Forest Hills: 24 ft aggregate side yards and 30% occupancy', () => {
    const e = dcEnvelope('R-1B/FH')
    expect(e.sideYardAggregate?.value).toBe(24)
    expect(e.lotOccupancyPct).toMatchObject({ value: 30, citation: '11-D § 404.1' })
    expect(e.perviousPct?.value).toBe(50)
  })

  it('applies Wesley Heights: front setback is the block average, not the range', () => {
    expect(dcEnvelope('R-1A/WH').front.mode).toBe('block_average')
  })

  it('sets R-1A/CBUT occupancy from lot area, and refuses to guess without it', () => {
    expect(dcEnvelope('R-1A/CBUT', { lotAreaSqFt: 6000 }).lotOccupancyPct.value).toBe(40)
    expect(dcEnvelope('R-1A/CBUT', { lotAreaSqFt: 9500 }).lotOccupancyPct.value).toBe(30)
    const unknown = dcEnvelope('R-1A/CBUT')
    expect(unknown.lotOccupancyPct.value).toBeNull()
    expect(unknown.computable).toBe(false)
  })

  it('applies R-3/GT: 5 ft side yards and a front setback matched to a neighbour', () => {
    const e = dcEnvelope('R-3/GT')
    expect(e.sideYard.value).toBe(5)
    expect(e.front.mode).toBe('adjacent_match')
  })
})

describe('RF, RA and MU zones', () => {
  it('RF-1 detached: 5 ft side yards, 20 ft rear, 60% occupancy, 35 ft', () => {
    const e = dcEnvelope('RF-1')
    expect(e.computable).toBe(true)
    expect(e.sideYard.value).toBe(5)
    expect(e.rearYard.value).toBe(20)
    expect(e.lotOccupancyPct.value).toBe(60)
    expect(e.heightFt.value).toBe(35)
  })

  it('RA-1: no front setback required, 8 ft sides for a one-family house, 20 ft rear', () => {
    const e = dcEnvelope('RA-1')
    expect(e.front.mode).toBe('none_required')
    expect(e.sideYard.value).toBe(8)
    expect(e.rearYard.printed).toBe('20 ft.')
    expect(e.rearYard.value).toBe(20)
    expect(e.computable).toBe(true)
  })

  it('refuses to reduce a height-formula rear yard to its floor (RA-2)', () => {
    const e = dcEnvelope('RA-2')
    expect(e.rearYard.value).toBeNull()
    expect(e.computable).toBe(false)
    expect(e.reason).toMatch(/rear yard/)
  })

  it('MU-4: 15 ft rear, and the matter-of-right occupancy rather than the IZ bonus', () => {
    const e = dcEnvelope('MU-4')
    expect(e.rearYard.value).toBe(15)
    expect(e.lotOccupancyPct.value).toBe(60)
    expect(e.cautions.join(' ')).toMatch(/Inclusionary Zoning/)
  })

  it('does not assemble zones outside D–G', () => {
    expect(dcEnvelope('PDR-1').computable).toBe(false)
  })
})
