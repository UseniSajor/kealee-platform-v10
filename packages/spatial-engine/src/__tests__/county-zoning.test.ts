import { describe, it, expect } from 'vitest'
import {
  countyStandard, countyFrontSetback, countyStandardRows, normaliseCountyZone,
} from '../jurisdictions/county-zoning'
import { coverageForDetermined } from '../jurisdictions/coverage'

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


describe('the added jurisdictions', () => {
  it('finds a code as published before normalising it (Charles "RM" is not "R-M")', () => {
    expect(countyStandard('charles_md', 'RM')?.frontFt).toBe(25)
    expect(countyStandard('howard_md', 'R12')?.sideFt).toBe(7.5)
    expect(countyStandard('alexandria_city_va', 'R 8')?.zone).toBe('R-8')
  })

  it('evaluates Alexandria setback ratios at the 30 ft maximum height', () => {
    const s = countyStandard('alexandria_city_va', 'R-8')!
    expect([s.sideFt, s.rearFt]).toEqual([15, 30])
    expect(countyStandard('alexandria_city_va', 'R-5')!.sideFt).toBe(10)
  })

  it('applies Alexandria\'s contextual front, never more than the cap', () => {
    const s = countyStandard('alexandria_city_va', 'R-8')!
    expect(countyFrontSetback('alexandria_city_va', s, { averageFt: 38, minFt: 30.3, applies: true, sampleCount: 2, basis: '' }).ft).toBe(30)
    expect(countyFrontSetback('alexandria_city_va', s, { averageFt: 18, minFt: 12, applies: true, sampleCount: 2, basis: '' }).ft).toBe(12)
  })

  it('applies Rockville\'s established line only where the block face has one', () => {
    const s = countyStandard('rockville_md', 'R-60')!
    expect(countyFrontSetback('rockville_md', s, { averageFt: 40, medianFt: 40, applies: true, sampleCount: 6, basis: '' }).ft).toBe(40)
    expect(countyFrontSetback('rockville_md', s, { averageFt: 70, medianFt: 70, applies: true, sampleCount: 6, basis: '' }).ft).toBe(50)
    expect(countyFrontSetback('rockville_md', s, { averageFt: 26, medianFt: 26, applies: false, sampleCount: 6, basis: '' }).ft).toBe(25)
  })
})

describe('Prince William and Loudoun', () => {
  it('reads Prince William zones as the layer spells them', () => {
    expect(countyStandard('prince_william_va', 'R-4')).toMatchObject({ frontFt: 30, sideFt: 10, rearFt: 25, coveragePct: 40 })
    expect(countyStandard('prince_william_va', 'SR-5')).toMatchObject({ frontFt: 50, sideFt: 15 })
    expect(countyStandard('prince_william_va', 'R-4C')).toMatchObject({ frontFt: 25, rearFt: 20, lotAreaSqFt: 7500 })
    expect(countyStandard('prince_william_va', 'PMR')).toBeNull()
  })

  it('maps Loudoun layer codes (R1, CR1, JLMA2, TR10, A3) to the ordinance zones', () => {
    expect(countyStandard('loudoun_va', 'R1')).toMatchObject({ zone: 'R-1', frontFt: 35, sideFt: 12, rearFt: 35 })
    expect(countyStandard('loudoun_va', 'R4')?.zone).toBe('R-4')
    expect(countyStandard('loudoun_va', 'CR1')?.rearFt).toBe(50)
    expect(countyStandard('loudoun_va', 'JLMA2')?.frontFt).toBe(15)
    expect(countyStandard('loudoun_va', 'TR10')?.zone).toBe('TR-10')
    expect(countyStandard('loudoun_va', 'A3')?.zone).toBe('A-3')
    // Planned districts follow their approved plans, not a table.
    expect(countyStandard('loudoun_va', 'PDH4')).toBeNull()
  })

  it('reports a jurisdiction with transcribed standards as preliminary, not data-only', () => {
    const c = coverageForDetermined('loudoun_va', 'Loudoun County, Virginia')
    expect(c.level).toBe('preliminary')
    expect(c.produces.join(' ')).toContain('CR-1')
    expect(coverageForDetermined('garrett_md', 'Garrett County, Maryland').level).toBe('data_only')
  })
})
