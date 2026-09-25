import { describe, it, expect } from 'vitest'
import { addressHints, jurisdictionAttemptOrder } from '../jurisdictions/registry'
import { dcFrontSetback, dcEnvelope } from '../jurisdictions/dc-zoning'
import { localiseLicensure, licensedSurveyor } from '../jurisdictions/profiles'

describe('jurisdiction routing hints', () => {
  it('asks PG first when the text says nothing — the established behaviour', () => {
    expect(jurisdictionAttemptOrder('1005 Rollins Ave')[0]).toBe('prince_georges_md')
  })

  it('asks DC first for a quadrant, a DC ZIP or "Washington, DC"', () => {
    expect(jurisdictionAttemptOrder('3210 Newark St NW')[0]).toBe('district_of_columbia')
    expect(jurisdictionAttemptOrder('3210 Newark St, Washington, DC 20008')[0]).toBe('district_of_columbia')
  })

  it('never asks a jurisdiction in a state the order contradicts', () => {
    expect(jurisdictionAttemptOrder('1005 Rollins Ave, Capitol Heights, MD 20743')).not.toContain('district_of_columbia')
    expect(jurisdictionAttemptOrder('3210 Newark St NW, Washington, DC 20008')).not.toContain('prince_georges_md')
  })

  it('reads state from ZIP when nothing else is typed', () => {
    expect(addressHints('100 Main St 22207').state).toBe('VA')
    expect(addressHints('100 Main St 20743').state).toBe('MD')
    expect(addressHints('100 Main St 20008').state).toBe('DC')
  })
})

describe('DC front setback determination', () => {
  const env = dcEnvelope('R-1B')
  const bf = { determined: true, minFt: 9.3, maxFt: 29.9, meanFt: 20.2, sampleCount: 8 }

  it('draws the more restrictive of the blockface minimum and a recorded BRL', () => {
    expect(dcFrontSetback(env, bf, 15).ft).toBe(15)
    expect(dcFrontSetback(env, bf, null).ft).toBe(9.3)
  })

  it('reports, and does not resolve, a BRL beyond the blockface maximum', () => {
    const r = dcFrontSetback(env, bf, 35)
    expect(r.conflict).toMatch(/Zoning Administrator/)
  })

  it('has no number when neither a measurement nor a recorded line exists', () => {
    expect(dcFrontSetback(env, { ...bf, determined: false, sampleCount: 1 }, null).ft).toBeNull()
  })
})

describe('licensure follows the jurisdiction', () => {
  it('keeps PG text and localises DC and Virginia', () => {
    expect(localiseLicensure('Maryland Professional Engineer', 'prince_georges_md')).toBe('Maryland Professional Engineer')
    expect(localiseLicensure('Maryland Professional Engineer', 'district_of_columbia')).toBe('District of Columbia Professional Engineer')
    expect(licensedSurveyor('fairfax_va')).toBe('Virginia licensed land surveyor')
  })
})
