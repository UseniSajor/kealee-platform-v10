/**
 * Municipality from the county, not from a text box.
 *
 * The address locator returns `Place_addr` alone — no city, no ZIP — and the
 * parcel layer carries only OBJECTID, PROP_ID and acreage. Neither can say
 * whether a parcel sits inside incorporated limits, and that decides whether
 * Kealee routes the order to internal staff review.
 *
 * The case that matters most is the third one: a layer that does not answer
 * must never be recorded as a parcel outside every boundary.
 */

import { fetchPgMunicipality } from '../jurisdictions/pgatlas'

const E = 1340380.7
const N = 440181.7

function stub(byLayer: Record<string, unknown>): typeof fetch {
  return (async (url: string) => {
    const u = String(url)
    const layer = u.match(/Administrative\/MapServer\/(\d+)/)?.[1] ?? '?'
    const body = byLayer[layer]
    if (body === 'error') return { ok: false, status: 503 } as unknown as Response
    return { ok: true, status: 200, json: async () => body ?? { features: [] } } as unknown as Response
  }) as unknown as typeof fetch
}

const feature = (name: string, city: string, zip: string) => ({
  features: [{ attributes: { NAME: name, CITY: city, ZIP_CODE: zip } }],
})

describe('fetchPgMunicipality', () => {
  it('reports an incorporated parcel and flags internal staff review', async () => {
    const m = await fetchPgMunicipality(E, N, {
      fetchImpl: stub({ '30': feature('BLADENSBURG', 'Bladensburg', '20710') }),
    })
    expect(m?.incorporated).toBe(true)
    expect(m?.name).toBe('BLADENSBURG')
    expect(m?.internalStaffReviewRequired).toBe(true)
  })

  it('records proximity when the parcel is outside every boundary', async () => {
    // 1005 Rollins Ave is the worked example: a Capitol Heights mailing address
    // and ZIP 20743, outside the town limits. Layer 30 returns nothing, 31 does.
    const m = await fetchPgMunicipality(E, N, {
      fetchImpl: stub({ '31': feature('CAPITOL HEIGHTS', 'Capitol Heights', '20743') }),
    })
    expect(m?.incorporated).toBe(false)
    expect(m?.nearestName).toBe('CAPITOL HEIGHTS')
    expect(m?.nearestWithin).toBe('quarter_mile')
    expect(m?.mailingCity).toBe('Capitol Heights')
    // A mailing city is not a jurisdiction — no internal review is triggered.
    expect(m?.internalStaffReviewRequired).toBe(false)
  })

  it('does not report "outside" when the boundary layer did not answer', async () => {
    // The dangerous conflation. An unanswered query and an unincorporated
    // parcel look identical downstream, and only one of them is a finding.
    const m = await fetchPgMunicipality(E, N, { fetchImpl: stub({ '30': 'error', '31': 'error', '32': 'error' }) })
    expect(m?.incorporated).toBe(false)
    expect(m?.name).toBeNull()
    expect(m?.nearestName).toBeNull()
    expect(m?.internalStaffReviewRequired).toBe(false)
  })

  it('names the county layer as the authority on every answer', async () => {
    const m = await fetchPgMunicipality(E, N, {
      fetchImpl: stub({ '30': feature('RIVERDALE PARK', 'Riverdale Park', '20737') }),
    })
    expect(m?.source.authority).toMatch(/PGAtlas/)
    expect(m?.source.endpoint).toMatch(/Administrative\/MapServer\/30/)
    expect(m?.source.retrievedAt).toBeTruthy()
  })
})
