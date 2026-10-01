import { describe, expect, it } from 'vitest'
import { governingHsg, rainfallTargetPe, sizeEsd } from '../site-plan/esd-mep'

describe('MDE Table 5.3 rainfall targets', () => {
  it('reads the published cells', () => {
    // HSG C: 20% reaches woods (70) at 1.0 in; 25% at 1.2 in; 30% not until 1.6 in.
    expect(rainfallTargetPe(20, 'C').peIn).toBe(1.0)
    expect(rainfallTargetPe(25, 'C').peIn).toBe(1.2)
    expect(rainfallTargetPe(30, 'C').peIn).toBe(1.6)
    // HSG B: 25% needs 1.6 in; HSG D: 30% only 1.2 in.
    expect(rainfallTargetPe(25, 'B').peIn).toBe(1.6)
    expect(rainfallTargetPe(30, 'D').peIn).toBe(1.2)
  })
  it('takes the next row up rather than interpolating down', () => {
    expect(rainfallTargetPe(20.1, 'C').peIn).toBe(1.2)
  })
  it('never returns less than 1.0 in', () => {
    expect(rainfallTargetPe(0, 'A').peIn).toBe(1.0)
  })
})

describe('ESD sizing', () => {
  it('computes Rv, ESDv and Rev', () => {
    // 20,000 sf lot, 3,400 sf impervious (17%), HSG C -> P_E 1.0, Rv 0.203
    const s = sizeEsd(20000, 3400, 'C')
    expect(s.percentImpervious).toBe(17)
    expect(s.peIn).toBe(1.0)
    expect(s.rv).toBeCloseTo(0.203, 3)
    expect(s.esdvCf).toBe(338)
    expect(s.revCf).toBe(44)
  })
  it('governs by the least permeable group, dual groups by their undrained letter', () => {
    expect(governingHsg(['B', 'C'])).toBe('C')
    expect(governingHsg(['B/D', 'A'])).toBe('D')
    expect(governingHsg([])).toBe('A')
  })
})
