/**
 * Coverage is a commercial boundary, not a technical one. These tests are
 * about what the platform is allowed to claim.
 */
import { describe, it, expect } from 'vitest'
import {
  JURISDICTION_COVERAGE, coverageFor, servedJurisdictions, dataOnlyJurisdictions,
  preliminaryJurisdictions, drawsPlansIn, assessServiceArea, propertyBlockedMessage,
} from '../jurisdictions/coverage'

describe('the coverage registry', () => {
  it('serves exactly one jurisdiction today', () => {
    // If this fails because a jurisdiction was ADDED, the rule pack had better
    // exist. `rules/` holds pg-certifiable.ts and nothing else.
    expect(servedJurisdictions().map(j => j.code)).toEqual(['prince_georges_md'])
  })

  it('never presents a preliminary jurisdiction as certified', () => {
    // DC, Montgomery, Fairfax and Arlington draw plans from cited, extracted
    // standards. None has a certified rule pack, and each must say so rather
    // than let "we can draw it" read as "it is certified".
    const prelim = preliminaryJurisdictions().map(j => j.code)
    expect(prelim.sort()).toEqual(['arlington_va', 'district_of_columbia', 'fairfax_va', 'montgomery_md'])
    for (const code of prelim) {
      expect(servedJurisdictions().map(j => j.code), code).not.toContain(code)
      expect(coverageFor(code)!.rulePackVersion, code).toBeNull()
      expect(coverageFor(code)!.cannotProduce.join(' '), code).toMatch(/certified rule pack/i)
    }
  })

  it('keeps any data_only jurisdiction honest about what it cannot do', () => {
    for (const j of dataOnlyJurisdictions()) {
      expect(j.cannotProduce.length, j.code).toBeGreaterThan(0)
      expect(j.cannotProduce.join(' '), j.code).toMatch(/dimensional standards/i)
    }
  })

  it('declares the unserved jurisdictions rather than omitting them', () => {
    // An absent entry reads as an oversight. An explicit one is a decision.
    const codes = JURISDICTION_COVERAGE.map(j => j.code)
    expect(codes).toContain('district_of_columbia')
    expect(codes).toContain('fairfax_va')
    expect(codes).toContain('montgomery_md')
  })

  it('never marks a jurisdiction full without a certified rule pack', () => {
    for (const j of JURISDICTION_COVERAGE) {
      if (j.level === 'full') {
        expect(j.rulePackVersion, `${j.code} is full with no rule pack`).toBeTruthy()
        expect(j.gisConnector, `${j.code} is full with no GIS connector`).toBe(true)
      }
    }
  })

  it('draws preliminary plans in DC without calling its standards certified', () => {
    expect(preliminaryJurisdictions().map(j => j.code)).toContain('district_of_columbia')
    const dc = coverageFor('district_of_columbia')!
    expect(dc.rulePackVersion).toBeNull()
    expect(dc.cannotProduce.join(' ')).toMatch(/certified rule pack/i)
    expect(drawsPlansIn('district_of_columbia')).toBe(true)
    expect(drawsPlansIn('arlington_va')).toBe(true)
    expect(drawsPlansIn('howard_md')).toBe(false)
  })

  it('says what it cannot produce even where coverage is full', () => {
    const pg = coverageFor('prince_georges_md')!
    expect(pg.cannotProduce.join(' ')).toMatch(/surveyor/i)
  })
})

describe('service-area assessment', () => {
  it('accepts a Prince George\'s address', () => {
    expect(assessServiceArea('1005 Rollins Ave').served).toBe(true)
    expect(assessServiceArea('14408 Leonard Calvert Dr').served).toBe(true)
  })

  it('accepts DC as a preliminary-plan jurisdiction and says what that means', () => {
    const dc = assessServiceArea('1600 Pennsylvania Ave NW, Washington, DC')
    expect(dc.served).toBe(true)
    expect(dc.level).toBe('preliminary')
    expect(dc.message).toMatch(/not yet certified/)
  })

  it('accepts Arlington and Fairfax, and turns away the rest of Virginia with the reason', () => {
    expect(assessServiceArea('2100 Clarendon Blvd, Arlington, VA 22201').served).toBe(true)
    const va = assessServiceArea('100 Main St, Richmond, VA 23219')
    expect(va.served).toBe(false)
    expect(va.disposition).toBe('refer_or_refund')
    expect(va.message).toMatch(/Virginia/)
  })

  it('accepts Montgomery and warns that later amendments are unreconciled', () => {
    const mc = assessServiceArea('101 Monroe St, Rockville, Montgomery County, MD')
    expect(mc.served).toBe(true)
    expect(mc.message).toMatch(/2014/)
  })

  it('turns away other Maryland counties by name', () => {
    const hc = assessServiceArea('3430 Court House Dr, Ellicott City, Howard County, MD')
    expect(hc.served).toBe(false)
    expect(hc.message).toMatch(/Howard County/)
  })
})

describe('the blocked-property message', () => {
  it('blames the service area when that is the problem', () => {
    const m = propertyBlockedMessage('123 Main St, Richmond, VA', ['123 Main St'])
    expect(m).toMatch(/Virginia/)
    expect(m, 'must not blame the address').not.toMatch(/did not match/)
  })

  it('blames nothing and explains when the address is in area but unmatched', () => {
    const m = propertyBlockedMessage('9999 Nonexistent Way', ['9999 Nonexistent Way'])
    expect(m).toMatch(/did not match/)
    expect(m).toMatch(/minimum score of 90/)
    // And offers the actual remedy rather than leaving a dead end.
    expect(m).toMatch(/recorded plat/)
  })
})
