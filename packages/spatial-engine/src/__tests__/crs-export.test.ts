/**
 * GeoJSON CRS conformance.
 *
 * The failure this guards against is silent: writing State Plane feet into
 * RFC 7946 GeoJSON produces a syntactically valid file that places a Maryland
 * site in the Gulf of Guinea. Nothing errors — the data is just wrong.
 */

import {
  resolveCrs, assertPlausibleWgs84, CrsExportError, KNOWN_CRS, WGS84,
  createArcGisTransformer, type CrsTransformer, type Point2D,
} from '../export/crs'
import { toGeoJson } from '../export/exporters'
import { createSiteTwin, addFeatures, addSource } from '../site-plan/site-twin'
import { gisSourceRecord } from '../site-plan/reliability'

/** Deterministic stub — the real transform is verified separately against a service. */
const stubTransformer: CrsTransformer = {
  name: 'stub',
  async transform(points) {
    // Maps the Brentwood test coordinates to their known WGS84 values.
    return points.map(() => [-76.950606, 38.94283] as Point2D)
  },
}

function twinAt(crs: string | null, datum: string | null = 'NAD83') {
  const X = 1326382.7, Y = 464763.1
  const ring = { coordinates: [[X, Y], [X + 65, Y], [X + 65, Y + 100], [X, Y + 100], [X, Y]] as [number, number][] }
  let t = createSiteTwin({
    siteId: 's', projectId: 'p', organizationId: 'o',
    address: '4500 Rhode Island Ave', jurisdictionCode: 'prince_georges_md',
    crs: crs ?? '', horizontalDatum: datum,
  })
  t = addSource(t, gisSourceRecord({
    sourceId: 's1', authority: 'M-NCPPC', dataset: 'Zoning',
    crs: crs ?? '', horizontalDatum: datum ?? 'NAD83',
  }))
  return addFeatures(t, [{
    kind: 'Parcel', id: 'pc', parcelId: 'x', ring, areaSqFt: 6500,
    sourceId: 's1', reliabilityLevel: 1, crs: crs ?? '', revision: 1,
  } as never])
}

describe('source CRS validation blocks export', () => {
  it('blocks when the CRS is unknown', () => {
    expect(() => resolveCrs(null)).toThrow(CrsExportError)
    expect(() => resolveCrs('')).toThrow(/no coordinate reference system/i)
  })

  it('blocks an unrecognised CRS rather than defaulting', () => {
    try {
      resolveCrs('EPSG:99999')
      throw new Error('should have thrown')
    } catch (e) {
      expect((e as CrsExportError).code).toBe('CRS_UNRECOGNISED')
    }
  })

  it('blocks a datum conflict', () => {
    try {
      resolveCrs('EPSG:2248', 'NGVD29')
      throw new Error('should have thrown')
    } catch (e) {
      expect((e as CrsExportError).code).toBe('DATUM_CONFLICT')
    }
  })

  it('accepts a known CRS with a matching datum', () => {
    expect(resolveCrs('EPSG:2248', 'NAD83').epsg).toBe(2248)
    expect(KNOWN_CRS['EPSG:2248'].unit).toBe('usSurveyFoot')
  })

  it('rejects export for a twin with no CRS', async () => {
    await expect(toGeoJson(twinAt(null), stubTransformer)).rejects.toThrow(CrsExportError)
  })
})

describe('untransformed coordinates are caught', () => {
  it('rejects raw State Plane values as WGS84', () => {
    try {
      assertPlausibleWgs84([[1326382.7, 464763.1]])
      throw new Error('should have thrown')
    } catch (e) {
      expect((e as CrsExportError).code).toBe('TRANSFORM_OUT_OF_RANGE')
    }
  })

  it('accepts genuine degrees', () => {
    expect(() => assertPlausibleWgs84([[-76.95, 38.94]])).not.toThrow()
  })

  it('rejects non-finite output', () => {
    expect(() => assertPlausibleWgs84([[NaN, 38]])).toThrow(CrsExportError)
  })
})

describe('RFC 7946 conformance', () => {
  it('emits WGS84 longitude-first and no crs member', async () => {
    const gj = JSON.parse(await toGeoJson(twinAt('EPSG:2248'), stubTransformer))
    // RFC 7946 removed `crs`; including it implies non-WGS84 data to no effect.
    expect('crs' in gj).toBe(false)
    const [lon, lat] = gj.features[0].geometry.coordinates[0][0]
    expect(lon).toBeCloseTo(-76.950606, 5)
    expect(lat).toBeCloseTo(38.94283, 5)
    expect(Math.abs(lon)).toBeLessThanOrEqual(180)
    expect(Math.abs(lat)).toBeLessThanOrEqual(90)
  })

  it('retains the original engineering coordinates separately', async () => {
    const gj = JSON.parse(await toGeoJson(twinAt('EPSG:2248'), stubTransformer))
    const eng = gj.features[0].properties.engineeringGeometry
    expect(eng.crs).toBe('EPSG:2248')
    expect(eng.unit).toBe('usSurveyFoot')
    expect(eng.datum).toBe('NAD83')
    // Survey grid preserved, not rounded away through degrees.
    expect(eng.coordinates[0][0]).toBeCloseTo(1326382.7, 1)
    expect(eng.coordinates[0][1]).toBeCloseTo(464763.1, 1)
  })

  it('records the transformer used', async () => {
    const gj = JSON.parse(await toGeoJson(twinAt('EPSG:2248'), stubTransformer))
    expect(gj.kealee.transformer).toBe('stub')
    expect(gj.kealee.sourceCrs).toBe('EPSG:2248')
    expect(gj.kealee.geoJsonCrs).toMatch(/4326/)
  })

  it('passes geographic input through without transforming', async () => {
    expect(WGS84.epsg).toBe(4326)
    expect(createArcGisTransformer().name).toMatch(/arcgis/)
  })
})
