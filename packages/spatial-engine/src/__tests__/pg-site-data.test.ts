/**
 * PG County environmental site data.
 *
 * The behaviour that matters is clipping. PG publishes county-wide multipart
 * layers — one ESA Wetlands record carries 4,283 parts — and ArcGIS returns the
 * whole feature when any part intersects the query box. Without clipping, a
 * question about one lot drags every wetland in the county onto the sheet.
 */

import {
  fetchPgSiteConstraints, PG_SITE_LAYERS, PG_UNAVAILABLE_SITE_DATA,
} from '../jurisdictions/pg-site-data'

const E = 1326382.7, N = 464763.1

/** A county-wide multipart polygon: one part near the site, many far away. */
function multipartResponse(nearParts: number, farParts: number) {
  const near = Array.from({ length: nearParts }, (_, i) => ([
    [E + i, N], [E + i + 10, N], [E + i + 10, N + 10], [E + i, N + 10], [E + i, N],
  ]))
  const far = Array.from({ length: farParts }, (_, i) => ([
    [E + 500_000 + i, N + 500_000], [E + 500_010 + i, N + 500_000],
    [E + 500_010 + i, N + 500_010], [E + 500_000 + i, N + 500_010], [E + 500_000 + i, N + 500_000],
  ]))
  return { features: [{ attributes: { OBJECTID: 1 }, geometry: { rings: [...near, ...far] } }] }
}

function stubFetch(body: unknown, ok = true, status = 200) {
  return (async () => ({ ok, status, json: async () => body })) as unknown as typeof fetch
}

describe('clipping county-wide multipart geometry', () => {
  it('keeps only the parts near the site', async () => {
    const r = await fetchPgSiteConstraints(E, N, {
      searchRadiusFeet: 300,
      fetchImpl: stubFetch(multipartResponse(3, 900)),
    })
    // Seven layers are queried and each returns the same stub, so 3 near parts
    // survive per layer and the 900 distant ones are discarded.
    const layer = r.layerResults[0]
    expect(layer.count).toBe(1)
    expect(layer.drawn).toBe(3)
    expect(layer.discardedOutOfArea).toBe(900)
  })

  it('reports discards rather than hiding them', async () => {
    const r = await fetchPgSiteConstraints(E, N, {
      searchRadiusFeet: 300, fetchImpl: stubFetch(multipartResponse(1, 50)),
    })
    for (const l of r.layerResults) expect(l.discardedOutOfArea).toBe(50)
  })

  it('draws nothing when every part is far away', async () => {
    const r = await fetchPgSiteConstraints(E, N, {
      searchRadiusFeet: 300, fetchImpl: stubFetch(multipartResponse(0, 20)),
    })
    expect(r.features).toHaveLength(0)
  })
})

describe('failures are reported, not silently empty', () => {
  it('records an HTTP failure per layer', async () => {
    const r = await fetchPgSiteConstraints(E, N, { fetchImpl: stubFetch({}, false, 503) })
    expect(r.layerResults.every(l => l.error === 'HTTP 503')).toBe(true)
    expect(r.findings.join(' ')).toMatch(/not evidence the constraint is absent/i)
  })

  it('catches an ArcGIS error carried in a 200 body', async () => {
    const r = await fetchPgSiteConstraints(E, N, {
      fetchImpl: stubFetch({ error: { message: 'Invalid geometry' } }),
    })
    expect(r.layerResults.every(l => l.error === 'Invalid geometry')).toBe(true)
    expect(r.features).toHaveLength(0)
  })

  it('does not throw when a layer rejects', async () => {
    const boom = (async () => { throw new Error('socket hang up') }) as unknown as typeof fetch
    const r = await fetchPgSiteConstraints(E, N, { fetchImpl: boom })
    expect(r.layerResults.every(l => l.error === 'socket hang up')).toBe(true)
  })
})

describe('what the layers are and are not', () => {
  it('covers streams, wetlands, their buffers and both floodplains', () => {
    const kinds = Object.values(PG_SITE_LAYERS).map(l => l.kind)
    expect(kinds.filter(k => k === 'EnvironmentalBuffer')).toHaveLength(5)
    expect(kinds.filter(k => k === 'Floodplain')).toHaveLength(2)
  })

  it('records contours and parcels as unavailable rather than absent', () => {
    // "We did not find a contour" and "this server publishes no contours" are
    // different statements, and only one of them is true here.
    const what = PG_UNAVAILABLE_SITE_DATA.map(u => u.what).join(' ')
    expect(what).toMatch(/Contours and elevation/)
    expect(what).toMatch(/Parcel boundaries/)
    const detail = PG_UNAVAILABLE_SITE_DATA.map(u => u.detail).join(' ')
    expect(detail).toMatch(/all 59 services enumerated/i)
    expect(detail).toMatch(/MD iMAP/i)
  })

  it('marks everything Level 1 with no vertical datum', async () => {
    const r = await fetchPgSiteConstraints(E, N, { fetchImpl: stubFetch(multipartResponse(1, 0)) })
    expect(r.source.reliabilityLevel).toBe(1)
    expect(r.source.accuracyClass).toBe('mapping_grade')
    // These layers carry no elevation; null is meaningful, not missing.
    expect(r.source.verticalDatum).toBeNull()
    expect(r.features[0].notes).toMatch(/Compiled, not surveyed/i)
  })
})
