/**
 * OGC WFS (GeoServer) reads, returned in the ArcGIS feature shape the
 * jurisdiction connectors already consume: `{ attributes, geometry }` with
 * `x/y`, `paths` or `rings`, in EPSG:2248.
 *
 * Why it exists: Howard County, Maryland publishes its GIS through GeoServer
 * (hcgeoserver.howardcountymd.gov), not ArcGIS REST. Its address points,
 * zoning and street centrelines are served natively in EPSG:2248, so nothing
 * is reprojected here.
 *
 * A WFS layer is addressed in a connector config as
 *   `wfs:<ows endpoint>#<typeName>#<geometry column>`
 * e.g. `wfs:https://…/geoserver/general/ows#general:Zoning#geom`. The geometry
 * column differs per layer (Howard: `Shape` on most, `geom` on Zoning), and a
 * CQL filter naming the wrong one fails the whole request.
 */

export interface WfsLayerRef { endpoint: string; typeName: string; geometryColumn: string }

export const isWfs = (url: string): boolean => url.startsWith('wfs:')

export function parseWfsRef(url: string): WfsLayerRef {
  const [endpoint, typeName, geometryColumn] = url.slice(4).split('#')
  if (!endpoint || !typeName || !geometryColumn) throw new Error(`malformed WFS layer reference: ${url}`)
  return { endpoint, typeName, geometryColumn }
}

export class WfsServiceError extends Error {
  constructor(readonly endpoint: string, message: string) {
    super(`${endpoint}: ${message}`)
  }
}

/** GeoJSON geometry → ArcGIS JSON geometry. Multi-geometries are flattened. */
function toArcGisGeometry(g: any): Record<string, unknown> | null {
  if (!g) return null
  switch (g.type) {
    case 'Point': return { x: g.coordinates[0], y: g.coordinates[1] }
    case 'MultiPoint': return g.coordinates.length ? { x: g.coordinates[0][0], y: g.coordinates[0][1] } : null
    case 'LineString': return { paths: [g.coordinates] }
    case 'MultiLineString': return { paths: g.coordinates }
    case 'Polygon': return { rings: g.coordinates }
    case 'MultiPolygon': return { rings: g.coordinates.flat() }
    default: return null
  }
}

async function getFeatures(
  ref: WfsLayerRef, cql: string, doFetch: typeof fetch, maxFeatures = 200,
): Promise<any[]> {
  const params = new URLSearchParams({
    service: 'WFS', version: '1.0.0', request: 'GetFeature', typeName: ref.typeName,
    outputFormat: 'application/json', srsName: 'EPSG:2248', maxFeatures: String(maxFeatures),
    CQL_FILTER: cql,
  })
  let res: Response
  try {
    res = await doFetch(`${ref.endpoint}?${params}`, { headers: { accept: 'application/json' } })
  } catch (e) {
    throw new WfsServiceError(ref.endpoint, `network error: ${e instanceof Error ? e.message : String(e)}`)
  }
  if (!res.ok) throw new WfsServiceError(ref.endpoint, `HTTP ${res.status}`)
  // GeoServer answers a bad filter with HTTP 200 and an XML exception report.
  const text = await res.text()
  let payload: any
  try { payload = JSON.parse(text) } catch {
    throw new WfsServiceError(ref.endpoint, `not JSON: ${text.replace(/\s+/g, ' ').slice(0, 200)}`)
  }
  const features: any[] = Array.isArray(payload?.features) ? payload.features : []
  return features.map(f => ({ attributes: f.properties ?? {}, geometry: toArcGisGeometry(f.geometry) }))
}

/** Features containing a point. */
export function wfsAtPoint(url: string, e: number, n: number, doFetch: typeof fetch, where?: string): Promise<any[]> {
  const ref = parseWfsRef(url)
  const spatial = `INTERSECTS(${ref.geometryColumn},POINT(${e} ${n}))`
  return getFeatures(ref, where && where !== '1=1' ? `${spatial} AND (${where})` : spatial, doFetch, 20)
}

/** Features within an envelope around a point. */
export async function wfsAround(
  url: string, e: number, n: number, radiusFt: number, doFetch: typeof fetch, where?: string,
): Promise<{ features: any[]; truncated: boolean }> {
  const ref = parseWfsRef(url)
  const spatial = `BBOX(${ref.geometryColumn},${e - radiusFt},${n - radiusFt},${e + radiusFt},${n + radiusFt})`
  const max = 500
  const features = await getFeatures(ref, where && where !== '1=1' ? `${spatial} AND (${where})` : spatial, doFetch, max)
  return { features, truncated: features.length >= max }
}

/** Features matching an attribute filter (CQL, which accepts the SQL-92 subset the connectors write). */
export function wfsWhere(url: string, where: string, doFetch: typeof fetch, maxFeatures = 50): Promise<any[]> {
  return getFeatures(parseWfsRef(url), where, doFetch, maxFeatures)
}
