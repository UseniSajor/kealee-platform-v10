import { describe, it, expect } from 'vitest'
import {
  countyStandard, countyFrontSetback, countyStandardRows, normaliseCountyZone,
} from '../jurisdictions/county-zoning'
import { jurisdictionAttemptOrder } from '../jurisdictions/registry'

describe('county zone codes', () => {
  it('reads both spellings the map layers use', () => {
    expect(normaliseCountyZone('R60')).toBe('R-60')
    expect(normaliseCountyZone('r-200 ')).toBe('R-200')
    expect(normaliseCountyZone('RE2C')).toBe('RE-2C')
    expect(normaliseCountyZone('R2-7')).toBe('R2-7')
  })
})

describe('transcribed single-family standards', () => {
  it('Montgomery R-60: 25/8 (18 total)/20, 35% coverage', () => {
    const s = countyStandard('montgomery_md', 'R-60')!
    expect([s.frontFt, s.sideFt, s.sideSumFt, s.rearFt, s.coveragePct]).toEqual([25, 8, 18, 20, 35])
  })

  it('Fairfax R-C takes the 35-ft house figures, not the footnoted 50 ft', () => {
    const s = countyStandard('fairfax_va', 'R-C')!
    expect([s.frontFt, s.sideFt, s.rearFt]).toEqual([40, 20, 25])
  })

  it('Arlington R-20 lot width is 100 ft and side yards follow the 30% aggregate', () => {
    const s = countyStandard('arlington_va', 'R-20')!
    expect(s.lotWidthFt).toBe(100)
    expect(s.sideFt).toBe(15)
    expect(countyStandard('arlington_va', 'R-6')!.sideFt).toBe(10)
  })

  it('draws nothing for a zone that is not transcribed', () => {
    expect(countyStandard('montgomery_md', 'CR-2.0')).toBeNull()
  })
})

describe('Montgomery established building line', () => {
  const s = countyStandard('montgomery_md', 'R-60')!
  it('pushes the front back only when it applies and exceeds the minimum', () => {
    expect(countyFrontSetback('montgomery_md', s, { averageFt: 28.9, applies: true, sampleCount: 7, basis: '' }).ft).toBe(28.9)
    expect(countyFrontSetback('montgomery_md', s, { averageFt: 28.9, applies: false, sampleCount: 3, basis: '' }).ft).toBe(25)
    expect(countyFrontSetback('montgomery_md', s, null).ft).toBe(25)
  })

  it('draws both side yards to the sum where the sum governs', () => {
    const rows = countyStandardRows(countyStandard('montgomery_md', 'R-90')!, { ft: 30, basis: '' })
    expect(rows.find(r => r.standard === 'Side yard depth')!.numeric).toBe(12.5)
  })
})

describe('routing', () => {
  it('asks Montgomery first for a Montgomery city or ZIP, and Arlington first for 222xx', () => {
    expect(jurisdictionAttemptOrder('8700 Bradmoor Dr, Bethesda, MD 20817')[0]).toBe('montgomery_md')
    expect(jurisdictionAttemptOrder('1611 N Kenilworth St, Arlington, VA 22205')[0]).toBe('arlington_va')
    expect(jurisdictionAttemptOrder('3400 Barkley Dr, Fairfax, VA 22031')[0]).toBe('fairfax_va')
  })
})
