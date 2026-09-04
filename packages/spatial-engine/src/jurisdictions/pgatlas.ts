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
  streetCenterline: `${PGATLAS_ROOT}/Transportation/MapServer/2`,
  municipalBoundary: `${PGATLAS_ROOT}/Administrative/MapServer/30`,
  municipalBufferQuarterMile: `${PGATLAS_ROOT}/Administrative/MapServer/31`,
  municipalBufferHalfMile: `${PGATLAS_ROOT}/Administrative/MapServer/32`,
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

/**
 * Nearest point on the street centreline network.
 *
 * This is what identifies the FRONT lot line. Without it every edge takes the
 * front setback, which understates the envelope, and the house cannot be
 * oriented to the street.
 */
export async function nearestStreetPoint(
  easting2248: number, northing2248: number,
  opts: { searchFt?: number; fetchImpl?: typeof fetch } = {},
): Promise<Position | null> {
  const r = opts.searchFt ?? 250
  const doFetch = opts.fetchImpl ?? fetch
  const p = new URLSearchParams({
    where: '1=1',
    geometry: [easting2248 - r, northing2248 - r, easting2248 + r, northing2248 + r].join(','),
    geometryType: 'esriGeometryEnvelope',
    inSR: '2248', outSR: '2248',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'OBJECTID', returnGeometry: 'true', f: 'json',
  })
  const res = await doFetch(`${PGATLAS_ENDPOINTS.streetCenterline}/query?${p}`,
    { headers: { accept: 'application/json' } })
  if (!res.ok) return null
  const payload: any = await res.json().catch(() => null)
  if (!payload || payload.error) return null

  let best: Position | null = null
  let bestD = Infinity
  for (const f of payload.features ?? []) {
    for (const path of f?.geometry?.paths ?? []) {
      for (const pt of path) {
        const d = Math.hypot(pt[0] - easting2248, pt[1] - northing2248)
        if (d < bestD) { bestD = d; best = [pt[0], pt[1]] as Position }
      }
    }
  }
  return best
}

export interface PgAtlasStreet {
  name: string | null
  /** Centreline polylines in EPSG:2248. */
  paths: Position[][]
}

/**
 * Street centrelines near the site, with names.
 *
 * A site plan shows the fronting street and letters its name in the
 * right-of-way — the approved Yocum plan does exactly that. It is also how a
 * reviewer confirms the front lot line, which is what assigns the setbacks.
 */
export async function fetchPgAtlasStreets(
  easting2248: number, northing2248: number,
  opts: { searchFt?: number; fetchImpl?: typeof fetch } = {},
): Promise<PgAtlasStreet[]> {
  const r = opts.searchFt ?? 300
  const doFetch = opts.fetchImpl ?? fetch
  const p = new URLSearchParams({
    where: '1=1',
    geometry: [easting2248 - r, northing2248 - r, easting2248 + r, northing2248 + r].join(','),
    geometryType: 'esriGeometryEnvelope',
    inSR: '2248', outSR: '2248',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*', returnGeometry: 'true', f: 'json',
  })
  const res = await doFetch(`${PGATLAS_ENDPOINTS.streetCenterline}/query?${p}`,
    { headers: { accept: 'application/json' } })
  if (!res.ok) return []
  const payload: any = await res.json().catch(() => null)
  if (!payload || payload.error) return []

  return (payload.features ?? []).map((f: any) => {
    const attrs = f.attributes ?? {}
    const nameKey = Object.keys(attrs).find(k =>
      /NAME|STREET|LABEL/i.test(k) && typeof attrs[k] === 'string' && attrs[k].trim())
    return {
      name: nameKey ? String(attrs[nameKey]).trim() : null,
      paths: (f.geometry?.paths ?? []).map((path: number[][]) =>
        path.map(pt => [pt[0], pt[1]] as Position)),
    }
  }).filter((s: PgAtlasStreet) => s.paths.length > 0)
}

export interface PgAtlasSite {
  address: PgAtlasAddress
  parcel: PgAtlasParcel | null
  zoning: PgAtlasZoning | null
  /** Nearest street centreline point — identifies the front lot line. */
  streetPoint: Position | null
  /** Street centrelines to draw and letter in the right-of-way. */
  streets: PgAtlasStreet[]
}

export interface PgAtlasMunicipality {
  /**
   * Whether the parcel sits INSIDE incorporated municipal limits.
   *
   * This is the whole point of the layer. A mailing address is not a
   * jurisdiction: 1005 Rollins Ave carries a Capitol Heights address and ZIP
   * 20743 while sitting outside the town limits.
   */
  incorporated: boolean
  /** Incorporated municipality containing the parcel, when there is one. */
  name: string | null
  /** Nearest municipality when the parcel is outside every boundary. */
  nearestName: string | null
  /** How close that nearest municipality is, when known. */
  nearestWithin: 'quarter_mile' | 'half_mile' | null
  mailingCity: string | null
  zipCode: string | null
  /**
   * Kealee routes an incorporated parcel to INTERNAL STAFF REVIEW.
   *
   * This is a Kealee workflow decision and nothing more. The engine asserts
   * nothing about any municipality's own review process, which varies by town
   * and is not published in a layer.
   */
  internalStaffReviewRequired: boolean
  source: { authority: string; endpoint: string; retrievedAt: string }
}

/**
 * Which municipality a parcel belongs to, from the county rather than a form.
 *
 * The address locator returns `Place_addr` alone — no city, no ZIP — and the
 * parcel layer carries only OBJECTID, PROP_ID and acreage. Neither can answer
 * this, so nothing in the engine could until this layer was wired in.
 */
export async function fetchPgMunicipality(
  easting2248: number, northing2248: number,
  opts: { fetchImpl?: typeof fetch } = {},
): Promise<PgAtlasMunicipality | null> {
  const doFetch = opts.fetchImpl ?? fetch
  const str = (v: unknown): string | null =>
    v == null || v === '' ? null : String(v)

  const inside = await queryAtPoint(
    PGATLAS_ENDPOINTS.municipalBoundary, easting2248, northing2248, '*', false, doFetch)
  const insideAttrs = inside?.features?.[0]?.attributes

  if (insideAttrs) {
    return {
      incorporated: true,
      name: str(insideAttrs.NAME),
      nearestName: null,
      nearestWithin: null,
      mailingCity: str(insideAttrs.CITY),
      zipCode: str(insideAttrs.ZIP_CODE),
      internalStaffReviewRequired: true,
      source: {
        authority: "Prince George's County / M-NCPPC — PGAtlas Municipal Boundary",
        endpoint: PGATLAS_ENDPOINTS.municipalBoundary,
        retrievedAt: new Date().toISOString(),
      },
    }
  }

  // Outside every boundary. The buffers say how close, which is worth
  // recording — a lot a few hundred feet from a town line is where an
  // applicant's assumption about their own jurisdiction is most likely wrong.
  for (const [band, endpoint] of [
    ['quarter_mile', PGATLAS_ENDPOINTS.municipalBufferQuarterMile],
    ['half_mile', PGATLAS_ENDPOINTS.municipalBufferHalfMile],
  ] as const) {
    const near = await queryAtPoint(endpoint, easting2248, northing2248, '*', false, doFetch)
    const attrs = near?.features?.[0]?.attributes
    if (!attrs) continue
    return {
      incorporated: false,
      name: null,
      nearestName: str(attrs.NAME),
      nearestWithin: band,
      mailingCity: str(attrs.CITY),
      zipCode: str(attrs.ZIP_CODE),
      internalStaffReviewRequired: false,
      source: {
        authority: "Prince George's County / M-NCPPC — PGAtlas Municipal Buffer",
        endpoint,
        retrievedAt: new Date().toISOString(),
      },
    }
  }

  return {
    incorporated: false, name: null, nearestName: null, nearestWithin: null,
    mailingCity: null, zipCode: null, internalStaffReviewRequired: false,
    source: {
      authority: "Prince George's County / M-NCPPC — PGAtlas Municipal Boundary",
      endpoint: PGATLAS_ENDPOINTS.municipalBoundary,
      retrievedAt: new Date().toISOString(),
    },
  }
}

/** Address to lot, zone and position in one call. */
export async function resolvePgAtlasSite(
  address: string,
  opts: { minScore?: number; fetchImpl?: typeof fetch } = {},
): Promise<PgAtlasSite | null> {
  const geo = await geocodePgAtlas(address, opts)
  if (!geo) return null
  const [parcel, zoning, streetPoint, streets] = await Promise.all([
    fetchPgAtlasParcel(geo.easting2248, geo.northing2248, opts),
    fetchPgAtlasZoning(geo.easting2248, geo.northing2248, opts),
    nearestStreetPoint(geo.easting2248, geo.northing2248, opts),
    fetchPgAtlasStreets(geo.easting2248, geo.northing2248, opts),
  ])
  return { address: geo, parcel, zoning, streetPoint, streets }
}
