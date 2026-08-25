/**
 * PGAtlas — the county's own GIS, and the primary source for a PG site plan.
 *
 * gis.pgatlas.com carries an address locator, the parcel fabric, the zoning
 * layer and the environmental layers, all for Prince George's County. It is
 * more authoritative here than the statewide MD iMAP fabric and far better than
 * a public geocoder: the locator scores an exact county address 100, where OSM
 * Nominatim returned nothing at all for the same street.
 *
 * Not to be confused with gisdata.pgplanning.org, the open-data portal, which
 * is a different server with no elevation and no locator.
 */

import type { Ring, Position } from '../site-plan/site-twin'

export const PGATLAS_ROOT = 'https://gis.pgatlas.com/pgatlas/rest/services'

export const PGATLAS_ENDPOINTS = {
  addressLocator: `${PGATLAS_ROOT}/Geocoders/Address/GeocodeServer`,
  compositeLocator: `${PGATLAS_ROOT}/Geocoders/Composite_Geolocator/GeocodeServer`,
  parcels: `${PGATLAS_ROOT}/Property/MapServer/15`,
  zoning: `${PGATLAS_ROOT}/Zoning/MapServer/63`,
  contours2ft: `${PGATLAS_ROOT}/Elevation/MapServer/1`,
} as const

export interface PgAtlasAddress {
  matchedAddress: string
  /** Locator score, 0-100. */
  score: number
  easting2248: number
  northing2248: number
}

/**
 * Geocodes against the county locator.
 *
 * `minScore` defaults to 90. The composite locator will happily return a
 * different street at score 77 — asked for "1005 Rollins Ave, Capitol Heights"
 * it offered "1005 Capitol Heights Boulevard" — so a weak match is rejected
 * rather than silently siting the plan on the wrong lot.
 *
 * Pass the street address alone. The locator matches "1005 Rollins Ave" at 100
 * and returns nothing for the same address with city and ZIP appended.
 */
export async function geocodePgAtlas(
  address: string,
  opts: { minScore?: number; fetchImpl?: typeof fetch; locator?: string } = {},
): Promise<PgAtlasAddress | null> {
  const minScore = opts.minScore ?? 90
  const doFetch = opts.fetchImpl ?? fetch
  const p = new URLSearchParams({
    SingleLine: address, outSR: '2248', maxLocations: '5', f: 'json',
  })
  const base = opts.locator ?? PGATLAS_ENDPOINTS.addressLocator
  const res = await doFetch(`${base}/findAddressCandidates?${p}`, { headers: { accept: 'application/json' } })
  if (!res.ok) return null
  const payload: any = await res.json().catch(() => null)
  if (!payload || payload.error) return null

  const best = (payload.candidates ?? [])
    .filter((c: any) => typeof c?.score === 'number')
    .sort((a: any, b: any) => b.score - a.score)[0]
  if (!best || best.score < minScore) return null

  return {
    matchedAddress: best.address,
    score: best.score,
    easting2248: best.location.x,
    northing2248: best.location.y,
  }
}

async function queryAtPoint(
  endpoint: string, e: number, n: number, outFields: string, geometry: boolean,
  doFetch: typeof fetch,
): Promise<any> {
  const p = new URLSearchParams({
    where: '1=1',
    geometry: `${e},${n}`,
    geometryType: 'esriGeometryPoint',
    inSR: '2248', outSR: '2248',
    spatialRel: 'esriSpatialRelIntersects',
    outFields, returnGeometry: String(geometry), f: 'json',
  })
  const res = await doFetch(`${endpoint}/query?${p}`, { headers: { accept: 'application/json' } })
  if (!res.ok) return null
  const payload: any = await res.json().catch(() => null)
  // ArcGIS reports errors with HTTP 200.
  return payload?.error ? null : payload
}

export interface PgAtlasParcel {
  ring: Ring
  areaSqFt: number
  propId: string | null
  source: { authority: string; endpoint: string; retrievedAt: string }
}

/** The lot polygon at a point, from the county parcel fabric. */
export async function fetchPgAtlasParcel(
  easting2248: number, northing2248: number,
  opts: { fetchImpl?: typeof fetch } = {},
): Promise<PgAtlasParcel | null> {
  const doFetch = opts.fetchImpl ?? fetch
  const payload = await queryAtPoint(
    PGATLAS_ENDPOINTS.parcels, easting2248, northing2248, '*', true, doFetch)
  const f = payload?.features?.[0]
  const rings = f?.geometry?.rings
  if (!rings?.length) return null
  const a = f.attributes ?? {}
  return {
    ring: { coordinates: rings[0].map((c: number[]) => [c[0], c[1]] as Position) },
    areaSqFt: Number(a['SHAPE.AREA'] ?? 0),
    propId: a.PROP_ID != null ? String(a.PROP_ID) : null,
    source: {
      authority: "Prince George's County / M-NCPPC — PGAtlas Property",
      endpoint: PGATLAS_ENDPOINTS.parcels,
      retrievedAt: new Date().toISOString(),
    },
  }
}

export interface PgAtlasZoning {
  zoneCode: string
  groupName: string | null
  /** Ordinance section link the layer itself publishes. */
  classUrl: string | null
  source: { authority: string; endpoint: string; retrievedAt: string }
}

/**
 * The zone at a point.
 *
 * Removes the need for a caller to supply a zone code, which was previously a
 * hand-entered argument and therefore a place to be wrong. The layer joins a
 * code table, so attribute keys are qualified (`ARCDBA.Zoning_Py.CLASS`); the
 * lookup is by suffix so a schema rename does not silently return nothing.
 */
export async function fetchPgAtlasZoning(
  easting2248: number, northing2248: number,
  opts: { fetchImpl?: typeof fetch } = {},
): Promise<PgAtlasZoning | null> {
  const doFetch = opts.fetchImpl ?? fetch
  const payload = await queryAtPoint(
    PGATLAS_ENDPOINTS.zoning, easting2248, northing2248, '*', false, doFetch)
  const attrs = payload?.features?.[0]?.attributes
  if (!attrs) return null

  const bySuffix = (suffix: string): string | null => {
    const key = Object.keys(attrs).find(k => k.toUpperCase().endsWith(suffix))
    const v = key ? attrs[key] : null
    return v == null || v === '' ? null : String(v)
  }
  const zoneCode = bySuffix('.CLASS') ?? bySuffix('.CODE')
  if (!zoneCode) return null

  return {
    zoneCode,
    groupName: bySuffix('.GROUPNAME'),
    classUrl: bySuffix('.CLASS_URL'),
    source: {
      authority: "Prince George's County / M-NCPPC — PGAtlas Zoning",
      endpoint: PGATLAS_ENDPOINTS.zoning,
      retrievedAt: new Date().toISOString(),
    },
  }
}

export interface PgAtlasSite {
  address: PgAtlasAddress
  parcel: PgAtlasParcel | null
  zoning: PgAtlasZoning | null
}

/** Address to lot, zone and position in one call. */
export async function resolvePgAtlasSite(
  address: string,
  opts: { minScore?: number; fetchImpl?: typeof fetch } = {},
): Promise<PgAtlasSite | null> {
  const geo = await geocodePgAtlas(address, opts)
  if (!geo) return null
  const [parcel, zoning] = await Promise.all([
    fetchPgAtlasParcel(geo.easting2248, geo.northing2248, opts),
    fetchPgAtlasZoning(geo.easting2248, geo.northing2248, opts),
  ])
  return { address: geo, parcel, zoning }
}
