import { describe, it, expect } from 'vitest'
import { connectorFor } from '../jurisdictions/registry'
import type { JurisdictionDetermination } from '../jurisdictions/determination'
import { dcFrontSetback, dcEnvelope } from '../jurisdictions/dc-zoning'
import { localiseLicensure, licensedSurveyor } from '../jurisdictions/profiles'

const det = (over: Partial<JurisdictionDetermination>): JurisdictionDetermination => ({
  determined: true, code: null, name: null, state: null, countyFips: null, countyName: null, countyCode: null,
  municipality: null, soilSurveyArea: null, matchedAddress: null, longitude: null, latitude: null,
  determinedBy: 'us-census-geocoder', determinedAt: '2026-09-25T00:00:00Z', reason: null, ...over,
})

describe('whose GIS draws a determined jurisdiction', () => {
  it('uses PGAtlas for any lot in Prince George\'s, including a town that zones its own land', () => {
    expect(connectorFor(det({ code: 'prince_georges_md', countyCode: 'prince_georges_md', state: 'MD' })).kind).toBe('pgatlas')
    expect(connectorFor(det({ code: 'laurel_md', countyCode: 'prince_georges_md', state: 'MD' })).kind).toBe('pgatlas')
  })

  it('uses the jurisdiction\'s own connector, and requires its zoning layer', () => {
    const c = connectorFor(det({ code: 'district_of_columbia', countyCode: 'district_of_columbia', state: 'DC' }))
    expect(c).toMatchObject({ kind: 'arcgis', code: 'district_of_columbia', requireZoning: true })
  })

  it('maps a town from its county, without taking the county\'s zoning for it', () => {
    const c = connectorFor(det({ code: 'rockville_md', countyCode: 'montgomery_md', state: 'MD' }))
    expect(c).toMatchObject({ kind: 'arcgis', code: 'montgomery_md', requireZoning: false })
  })

  it('reads every DMV Maryland county from its own GIS', () => {
    for (const code of ['anne_arundel_md', 'frederick_md', 'calvert_md', 'st_marys_md', 'charles_md', 'howard_md']) {
      expect(connectorFor(det({ code, countyCode: code, state: 'MD' }))).toMatchObject({ kind: 'arcgis', code, requireZoning: true })
    }
  })

  it('falls back to the statewide fabric, never to another county', () => {
    expect(connectorFor(det({ code: 'garrett_md', countyCode: 'garrett_md', state: 'MD' }))).toMatchObject({ code: 'maryland_statewide' })
    expect(connectorFor(det({ code: 'manassas_city_va', countyCode: 'manassas_city_va', state: 'VA' }))).toMatchObject({ code: 'virginia_statewide' })
    expect(connectorFor(det({ code: 'alexandria_city_va', countyCode: 'alexandria_city_va', state: 'VA' }))).toMatchObject({ code: 'alexandria_city_va' })
    expect(connectorFor(det({ code: 'new_castle_de', countyCode: 'new_castle_de', state: 'DE' })).kind).toBe('none')
  })

  it('has no connector for an undetermined address', () => {
    expect(connectorFor(det({ determined: false, reason: 'no match' })).kind).toBe('none')
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
