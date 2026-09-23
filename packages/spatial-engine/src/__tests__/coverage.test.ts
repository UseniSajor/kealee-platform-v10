/**
 * Coverage is a commercial boundary, not a technical one. These tests are
 * about what the platform is allowed to claim.
 */
import { describe, it, expect } from 'vitest'
import {
  JURISDICTION_COVERAGE, coverageFor, servedJurisdictions,
  assessServiceArea, propertyBlockedMessage,
} from '../jurisdictions/coverage'

describe('the coverage registry', () => {
  it('serves exactly one jurisdiction today', () => {
    // If this fails because a jurisdiction was ADDED, the rule pack had better
    // exist. `rules/` holds pg-certifiable.ts and nothing else.
    expect(servedJurisdictions().map(j => j.code)).toEqual(['prince_georges_md'])
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

  it('turns away DC and Virginia with the reason, not a blank refusal', () => {
    const dc = assessServiceArea('1600 Pennsylvania Ave NW, Washington, DC')
    expect(dc.served).toBe(false)
    expect(dc.disposition).toBe('refer_or_refund')
    expect(dc.message).toMatch(/District of Columbia/)

    const va = assessServiceArea('2100 Clarendon Blvd, Arlington, VA 22201')
    expect(va.served).toBe(false)
    expect(va.message).toMatch(/Virginia/)
  })

  it('turns away other Maryland counties by name', () => {
    const mc = assessServiceArea('101 Monroe St, Rockville, Montgomery County, MD')
    expect(mc.served).toBe(false)
    expect(mc.message).toMatch(/Montgomery County/)
  })
})

describe('the blocked-property message', () => {
  it('blames the service area when that is the problem', () => {
    const m = propertyBlockedMessage('123 Main St, Fairfax, VA', ['123 Main St'])
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
