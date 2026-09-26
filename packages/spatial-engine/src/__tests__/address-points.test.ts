import { describe, it, expect } from 'vitest'
import { parseStreetAddress, queryAddressPoints, type AddressPointLayerConfig } from '../jurisdictions/arcgis-jurisdiction'
import { parseWfsRef, wfsAtPoint } from '../jurisdictions/wfs-client'

const LAYER: AddressPointLayerConfig = {
  url: 'https://example.test/arcgis/rest/services/Addresses/MapServer/0', authority: 'Test County address points',
  numberField: 'NUM', nameField: 'NAME', typeField: 'TYPE', prefixField: 'PRE', zipField: 'ZIP',
}

/** An ArcGIS query endpoint answering with the given address points. */
const answering = (features: { a: Record<string, unknown>; x: number; y: number }[]) =>
  (async () => new Response(JSON.stringify({
    features: features.map(f => ({ attributes: f.a, geometry: { x: f.x, y: f.y } })),
  }))) as unknown as typeof fetch

describe('street address parsing', () => {
  it('splits number, prefix, name and type', () => {
    expect(parseStreetAddress('12 E Church St')).toEqual({ number: '12', prefix: 'E', name: 'CHURCH', type: 'ST', zip: null })
    expect(parseStreetAddress('3430 Court House Drive, Ellicott City, MD 21043'))
      .toMatchObject({ number: '3430', name: 'COURT HOUSE', type: 'DR', prefix: null, zip: '21043' })
    expect(parseStreetAddress('Lot 7, Main St')).toBeNull()
  })
})

describe('exact address-point match', () => {
  it('lets the directional prefix decide: 12 E Church is not 12 W Church', async () => {
    const pts = answering([
      { a: { NUM: '12', PRE: 'W', NAME: 'CHURCH', TYPE: 'ST' }, x: 1000, y: 1000 },
      { a: { NUM: '12', PRE: 'E', NAME: 'CHURCH', TYPE: 'ST' }, x: 5000, y: 1000 },
    ])
    const o = await queryAddressPoints(LAYER, '12 E Church St', pts)
    expect(o.kind).toBe('match')
    if (o.kind === 'match') expect(o.address.easting2248).toBe(5000)
  })

  it('refuses a street name repeated in two communities rather than guess', async () => {
    const pts = answering([
      { a: { NUM: '100', NAME: 'MAIN', TYPE: 'ST', ZIP: '20678' }, x: 0, y: 0 },
      { a: { NUM: '100', NAME: 'MAIN', TYPE: 'ST', ZIP: '20732' }, x: 90_000, y: 0 },
    ])
    expect((await queryAddressPoints(LAYER, '100 Main St', pts)).kind).toBe('no_match')
    // …and takes the one the order's ZIP names.
    const z = await queryAddressPoints(LAYER, '100 Main St, Prince Frederick, MD 20678', pts)
    expect(z.kind).toBe('match')
  })

  it('accepts several points of one building as one place', async () => {
    const pts = answering([
      { a: { NUM: '5', NAME: 'OAK', TYPE: 'CT' }, x: 100, y: 100 },
      { a: { NUM: '5', NAME: 'OAK', TYPE: 'CT' }, x: 140, y: 120 },
    ])
    expect((await queryAddressPoints(LAYER, '5 Oak Ct', pts)).kind).toBe('match')
  })
})

describe('WFS layers', () => {
  it('reads the geometry column from the reference, because it differs per layer', () => {
    expect(parseWfsRef('wfs:https://g.test/ows#general:Zoning#geom'))
      .toEqual({ endpoint: 'https://g.test/ows', typeName: 'general:Zoning', geometryColumn: 'geom' })
  })

  it('returns features in the ArcGIS shape, and treats an XML exception as an error, not "no features"', async () => {
    const ok = (async () => new Response(JSON.stringify({ features: [
      { properties: { ZONE: 'R-12' }, geometry: { type: 'MultiPolygon', coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 0]]]] } },
    ] }))) as unknown as typeof fetch
    const [f] = await wfsAtPoint('wfs:https://g.test/ows#general:Zoning#geom', 0.5, 0.2, ok)
    expect(f.attributes.ZONE).toBe('R-12')
    expect(f.geometry.rings).toHaveLength(1)

    const xml = (async () => new Response('<ServiceExceptionReport>Illegal property name: SHAPE</ServiceExceptionReport>')) as unknown as typeof fetch
    await expect(wfsAtPoint('wfs:https://g.test/ows#general:Zoning#SHAPE', 0, 0, xml)).rejects.toThrow(/Illegal property/)
  })
})
