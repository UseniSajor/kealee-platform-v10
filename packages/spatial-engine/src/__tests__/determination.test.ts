import { describe, it, expect } from 'vitest'
import { interpretCensusGeographies, countyJurisdictionCode, determinationFrom } from '../jurisdictions/determination'

const census = (county: { STATE: string; COUNTY: string; NAME: string }, place?: { NAME: string; FUNCSTAT: string; LSADC: string; GEOID: string }) => ({
  result: { addressMatches: [{
    matchedAddress: 'X', coordinates: { x: -77, y: 38.9 },
    geographies: { Counties: [county], 'Incorporated Places': place ? [place] : [] },
  }] },
})

describe('county codes', () => {
  it('match the connector codes exactly', () => {
    expect(countyJurisdictionCode('MD', "Prince George's County")).toBe('prince_georges_md')
    expect(countyJurisdictionCode('VA', 'Fairfax County')).toBe('fairfax_va')
    expect(countyJurisdictionCode('VA', 'Fairfax city')).toBe('fairfax_city_va')
    expect(countyJurisdictionCode('DC', 'District of Columbia')).toBe('district_of_columbia')
  })
})

describe('who zones the land', () => {
  it('keeps College Park under Prince George\'s zoning (Regional District Act)', () => {
    const d = interpretCensusGeographies(census(
      { STATE: '24', COUNTY: '033', NAME: "Prince George's County" },
      { NAME: 'College Park city', FUNCSTAT: 'A', LSADC: '25', GEOID: '2418750' }))
    expect(d.code).toBe('prince_georges_md')
    expect(d.municipality).toMatchObject({ name: 'College Park city', zonesOwnLand: false })
  })

  it('gives Laurel and Rockville their own zoning', () => {
    expect(interpretCensusGeographies(census(
      { STATE: '24', COUNTY: '033', NAME: "Prince George's County" },
      { NAME: 'Laurel city', FUNCSTAT: 'A', LSADC: '25', GEOID: '2445900' })).code).toBe('laurel_md')
    const r = interpretCensusGeographies(census(
      { STATE: '24', COUNTY: '031', NAME: 'Montgomery County' },
      { NAME: 'Rockville city', FUNCSTAT: 'A', LSADC: '25', GEOID: '2467675' }))
    expect(r.code).toBe('rockville_md')
    expect(r.countyCode).toBe('montgomery_md')
    expect(r.name).toBe('City of Rockville, Maryland')
  })

  it('gives a Virginia town its own zoning', () => {
    const v = interpretCensusGeographies(census(
      { STATE: '51', COUNTY: '059', NAME: 'Fairfax County' },
      { NAME: 'Vienna town', FUNCSTAT: 'A', LSADC: '43', GEOID: '5181072' }))
    expect(v.code).toBe('vienna_va')
    expect(v.soilSurveyArea).toBe('VA059')
  })

  it('ignores an inactive place and never assumes a county without a match', () => {
    expect(interpretCensusGeographies(census(
      { STATE: '11', COUNTY: '001', NAME: 'District of Columbia' },
      { NAME: 'Washington city', FUNCSTAT: 'N', LSADC: '25', GEOID: '1150000' })).code).toBe('district_of_columbia')
    const none = interpretCensusGeographies({ result: { addressMatches: [] } })
    expect(none.determined).toBe(false)
    expect(none.code).toBeNull()
  })

  it('reads back only a real determination', () => {
    expect(determinationFrom({ determined: true, code: 'x_md', determinedBy: 'us-census-geocoder' })).not.toBeNull()
    expect(determinationFrom({ determined: true, code: 'x_md' })).toBeNull()
    expect(determinationFrom('prince_georges_md')).toBeNull()
  })
})

import { determinationQueryForms } from '../jurisdictions/determination'
describe('query forms', () => {
  it('adds street + ZIP forms for a comma-less, misspelt city', () => {
    const f = determinationQueryForms('1005 rollins ave capital heights md 20743')
    expect(f).toContain('1005 rollins ave, 20743')
  })
  it('takes the first number of a two-number address', () => {
    expect(determinationQueryForms('1005 & 1009 Rollins Ave capital heights 20743')).toContain('1005 Rollins Ave, 20743')
  })
  it('never invents a locality for a bare street', () => {
    expect(determinationQueryForms('5 Hickory St')).toEqual([])
  })
})

describe('no locality, no query', () => {
  it('never reads the house number as a ZIP, and sends nothing without a locality', () => {
    expect(determinationQueryForms('14408 Leonard Calvert Dr')).toEqual([])
    expect(determinationQueryForms('5 Hickory St')).toEqual([])
  })
})
