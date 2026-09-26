/**
 * A jurisdiction's own ArcGIS services, read the way PGAtlas is read.
 *
 * `pgatlas.ts` was written for one county and hardcodes its layers. Every
 * other DMV jurisdiction publishes the same KINDS of layer — a locator, a
 * parcel fabric, zoning, street centrelines, contours — on the same ArcGIS
 * REST interface, under different URLs and field names. This module is the
 * PGAtlas reading discipline with the URLs and field names lifted into a
 * config, so a jurisdiction is added by describing it, not by copying code.
 *
 * THE RULES CARRIED OVER FROM PG, EACH LEARNED ON A REAL ORDER
 *
 *   · An ArcGIS error arrives inside HTTP 200. The body is always parsed and
 *     `{"error":…}` is UNAVAILABLE, never "no match". (PG's retired locator.)
 *   · The locator is given the street address ALONE and must score >= 90. A
 *     weaker match is a different street. (PG's composite at 77.)
 *   · A layer that does not answer yields NO feature — never a fabricated
 *     parcel, zone or contour, because a fabricated one renders like a real one.
 *   · Every value carries the endpoint and the time it was read.
 *
 * ONE CRS FOR THE WHOLE ENGINE: EPSG:2248, NAD83 / Maryland State Plane, US
 * survey feet. Every downstream stage — envelope, sheets, CAD — works in it.
 * ArcGIS servers reproject on request (`outSR`), so each jurisdiction is READ
 * in 2248 regardless of what it stores. For DC that is native: the District's
 * own coordinate system (EPSG:26985) is the same Maryland Lambert projection in
 * metres. For Northern Virginia it is a reprojection into a neighbouring
 * zone; Fairfax and Arlington sit inside the zone's standard parallels
 * (38°18'–39°27'N), where the grid scale error is under 1:15,000 — about
 * 0.03 ft across a 400 ft lot. Grid north differs from Virginia North grid
 * north by the convergence between the zones' central meridians, which is why
 * a Virginia plat's basis of bearings is rotated explicitly, never assumed.
 */

import type { Position, Ring } from '../site-plan/site-twin'
import { fetch3depContours } from './usgs-3dep'

export const ENGINE_WKID = 2248

export interface LocatorConfig {
  /** Short name recorded as provenance: "MAR", "county composite". */
  name: string
  url: string
  /**
   * The single-line input field. Most locators take `SingleLine`;
   * Montgomery's MARPLOI takes `Street` and answers 400 to anything else.
   */
  param?: string
  /**
   * Rejects candidates that score well and are still the wrong thing. VGIN
   * returns an INTERPOLATED street-range candidate at the same score 100 as
   * the real address point, and covers the whole Commonwealth, so Arlington
   * accepts only point addresses in Arlington County.
   */
  acceptCandidate?: (candidate: { address: string; attributes: Record<string, unknown> }) => boolean
}

export interface ParcelLayerConfig {
  url: string
  /**
   * What the polygon IS. A record lot is drawn from a recorded subdivision
   * plat; a tax lot is an assessment convenience. Tried in the order given,
   * record lots first, so the plat-derived figure wins where both exist.
   */
  kind: 'record_lot' | 'tax_lot' | 'parcel'
  authority: string
  /** Attribute(s) forming the parcel identifier, joined with a space. */
  idFields: string[]
  /** Area attribute in square feet; computed from the ring when absent. */
  areaField?: string
  /** Builds the recorded-plat reference from the attributes, when the layer carries one. */
  platReference?: (attrs: Record<string, unknown>) => string | null
}

export interface ContourLayerConfig {
  url: string
  elevationField: string
  intervalFt: number
  /** Every Nth contour is an index contour. */
  indexEvery: number
  verticalDatum: string
  authority: string
  layerLabel: string
  caveats: string[]
}

export interface ArcGisJurisdictionConfig {
  code: string
  name: string
  state: 'DC' | 'MD' | 'VA'
  locators: LocatorConfig[]
  parcels: ParcelLayerConfig[]
  /** Null for a statewide fabric: the state publishes parcels, not zoning. */
  zoning: { url: string; codeFields: string[]; descriptionField?: string; urlField?: string; authority: string } | null
  /** One or more centreline layers (MD publishes roads split by class). */
  streets: { urls: string[]; nameFields: string[]; authority: string }
  /** County contours, or '3dep' where the county publishes none queryable. */
  contours: ContourLayerConfig | '3dep' | null
  /** Default 90. Never lowered for a shorter address form. */
  minScore?: number
}

export interface JurisdictionAddress {
  matchedAddress: string
  score: number
  easting2248: number
  northing2248: number
  locator: string
  locatorEndpoint: string
  retrievedAt: string
}

export type JurisdictionLocatorOutcome =
  | { kind: 'match'; address: JurisdictionAddress }
  | { kind: 'no_match'; tried: string }
  | { kind: 'below_score'; tried: string; bestScore: number }
  | { kind: 'unavailable'; tried: string; reason: string }

export interface JurisdictionParcel {
  ring: Ring
  areaSqFt: number
  propId: string | null
  kind: ParcelLayerConfig['kind']
  /** Recorded-plat reference from the parcel's own attributes, when published. */
  platReference: string | null
  attributes: Record<string, unknown>
  source: { authority: string; endpoint: string; retrievedAt: string }
}

export interface JurisdictionZoning {
  zoneCode: string
  groupName: string | null
  classUrl: string | null
  source: { authority: string; endpoint: string; retrievedAt: string }
}

export interface JurisdictionStreet {
  name: string | null
  paths: Position[][]
}

export class ArcGisServiceError extends Error {
  constructor(readonly endpoint: string, message: string) {
    super(message)
    this.name = 'ArcGisServiceError'
  }
}

/**
 * One ArcGIS REST call. Throws on anything that is not a real answer —
 * including an error body inside HTTP 200 — so a caller can tell an outage
 * from an empty result.
 */
export async function arcgisGet(
  endpoint: string, op: string, params: Record<string, string>, doFetch: typeof fetch,
): Promise<any> {
  const p = new URLSearchParams({ ...params, f: 'json' })
  let res: Response
  try {
    res = await doFetch(`${endpoint}/${op}?${p}`, { headers: { accept: 'application/json' } })
  } catch (e) {
    throw new ArcGisServiceError(endpoint, `network error: ${e instanceof Error ? e.message : String(e)}`)
  }
  if (!res.ok) throw new ArcGisServiceError(endpoint, `HTTP ${res.status}`)
  const payload: any = await res.json().catch(() => null)
  if (!payload) throw new ArcGisServiceError(endpoint, 'response was not JSON')
  if (payload.error) {
    throw new ArcGisServiceError(endpoint,
      `service error ${payload.error.code ?? '?'}: ${payload.error.message ?? 'unspecified'}`)
  }
  return payload
}

/**
 * Point query. NOTE the absence of `distance`: DC's server answers a point
 * query carrying `distance=0&units=esriSRUnit_Foot` with ZERO features and no
 * error, which reads exactly like "no parcel here". Pass a buffer only when
 * one is wanted.
 */
export async function queryAtPoint(
  endpoint: string, e: number, n: number, doFetch: typeof fetch,
  opts: { outFields?: string; geometry?: boolean; bufferFt?: number; where?: string } = {},
): Promise<any[]> {
  const params: Record<string, string> = {
    where: opts.where ?? '1=1',
    geometry: `${e},${n}`,
    geometryType: 'esriGeometryPoint',
    inSR: String(ENGINE_WKID), outSR: String(ENGINE_WKID),
    spatialRel: 'esriSpatialRelIntersects',
    outFields: opts.outFields ?? '*',
    returnGeometry: String(opts.geometry ?? true),
  }
  if (opts.bufferFt && opts.bufferFt > 0) {
    params.distance = String(opts.bufferFt)
    params.units = 'esriSRUnit_Foot'
  }
  const payload = await arcgisGet(endpoint, 'query', params, doFetch)
  return Array.isArray(payload.features) ? payload.features : []
}

/** Features intersecting a polygon — does the LOT touch it, not the address point. */
export async function queryIntersecting(
  endpoint: string, ring: Position[], doFetch: typeof fetch, opts: { outFields?: string } = {},
): Promise<any[]> {
  const payload = await arcgisGet(endpoint, 'query', {
    where: '1=1',
    geometry: JSON.stringify({ rings: [ring.map(p => [p[0], p[1]])], spatialReference: { wkid: ENGINE_WKID } }),
    geometryType: 'esriGeometryPolygon',
    inSR: String(ENGINE_WKID),
    spatialRel: 'esriSpatialRelIntersects',
    outFields: opts.outFields ?? '*',
    returnGeometry: 'false',
  }, doFetch)
  return Array.isArray(payload.features) ? payload.features : []
}

/** Envelope query around a point. `truncated` is true when the server capped the answer. */
export async function queryAround(
  endpoint: string, e: number, n: number, radiusFt: number, doFetch: typeof fetch,
  opts: { outFields?: string; where?: string } = {},
): Promise<{ features: any[]; truncated: boolean }> {
  const payload = await arcgisGet(endpoint, 'query', {
    where: opts.where ?? '1=1',
    geometry: [e - radiusFt, n - radiusFt, e + radiusFt, n + radiusFt].join(','),
    geometryType: 'esriGeometryEnvelope',
    inSR: String(ENGINE_WKID), outSR: String(ENGINE_WKID),
    spatialRel: 'esriSpatialRelIntersects',
    outFields: opts.outFields ?? '*',
    returnGeometry: 'true',
  }, doFetch)
  return {
    features: Array.isArray(payload.features) ? payload.features : [],
    truncated: payload.exceededTransferLimit === true,
  }
}

export async function queryLocator(
  locator: LocatorConfig, address: string, minScore: number, doFetch: typeof fetch,
): Promise<JurisdictionLocatorOutcome> {
  let payload: any
  try {
    payload = await arcgisGet(locator.url, 'findAddressCandidates', {
      [locator.param ?? 'SingleLine']: address, outSR: String(ENGINE_WKID), maxLocations: '5',
      ...(locator.acceptCandidate ? { outFields: '*' } : {}),
    }, doFetch)
  } catch (e) {
    return { kind: 'unavailable', tried: locator.url, reason: e instanceof Error ? e.message : String(e) }
  }
  if (!Array.isArray(payload.candidates)) {
    return { kind: 'unavailable', tried: locator.url, reason: 'response carried no candidates array' }
  }
  const best = payload.candidates
    .filter((c: any) => typeof c?.score === 'number' && c?.location)
    .filter((c: any) => !locator.acceptCandidate ||
      locator.acceptCandidate({ address: String(c.address ?? ''), attributes: c.attributes ?? {} }))
    .sort((a: any, b: any) => b.score - a.score)[0]
  if (!best) return { kind: 'no_match', tried: locator.url }
  if (best.score < minScore) return { kind: 'below_score', tried: locator.url, bestScore: best.score }
  return {
    kind: 'match',
    address: {
      matchedAddress: String(best.address),
      score: best.score,
      easting2248: best.location.x,
      northing2248: best.location.y,
      locator: locator.name,
      locatorEndpoint: locator.url,
      retrievedAt: new Date().toISOString(),
    },
  }
}

/** Geocodes on each configured locator in turn; the first match at or above the minimum wins. */
export async function geocodeJurisdiction(
  cfg: ArcGisJurisdictionConfig, address: string, opts: { fetchImpl?: typeof fetch } = {},
): Promise<{ match: JurisdictionAddress | null; outcomes: JurisdictionLocatorOutcome[] }> {
  const doFetch = opts.fetchImpl ?? fetch
  const outcomes: JurisdictionLocatorOutcome[] = []
  for (const locator of cfg.locators) {
    const o = await queryLocator(locator, address, cfg.minScore ?? 90, doFetch)
    outcomes.push(o)
    if (o.kind === 'match') return { match: o.address, outcomes }
  }
  return { match: null, outcomes }
}

function ringArea(pts: number[][]): number {
  let a = 0
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]
  }
  return Math.abs(a / 2)
}

export function parcelFromFeature(
  f: any, layer: ParcelLayerConfig,
): JurisdictionParcel | null {
  const rings: number[][][] | undefined = f?.geometry?.rings
  if (!rings?.length) return null
  // The largest ring is the lot; smaller ones are holes or slivers.
  const outer = [...rings].sort((a, b) => ringArea(b) - ringArea(a))[0]
  const a: Record<string, unknown> = f.attributes ?? {}
  const id = layer.idFields
    .map(k => a[k]).filter(v => v != null && String(v).trim() !== '')
    .map(v => String(v).trim().replace(/\s+/g, ' ')).join(' ')
  const statedArea = layer.areaField ? Number(a[layer.areaField]) : NaN
  return {
    ring: { coordinates: outer.map(c => [c[0], c[1]] as Position) },
    areaSqFt: Number.isFinite(statedArea) && statedArea > 0 ? statedArea : ringArea(outer),
    propId: id || null,
    kind: layer.kind,
    platReference: layer.platReference?.(a) ?? null,
    attributes: a,
    source: { authority: layer.authority, endpoint: layer.url, retrievedAt: new Date().toISOString() },
  }
}

/** The lot at a point, from the first parcel layer that has one. */
export async function fetchJurisdictionParcel(
  cfg: ArcGisJurisdictionConfig, e: number, n: number, opts: { fetchImpl?: typeof fetch } = {},
): Promise<JurisdictionParcel | null> {
  const doFetch = opts.fetchImpl ?? fetch
  for (const layer of cfg.parcels) {
    const features = await queryAtPoint(layer.url, e, n, doFetch)
    const parcel = features.length ? parcelFromFeature(features[0], layer) : null
    if (parcel) return parcel
  }
  return null
}

function firstField(a: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = a[k]
    if (v != null && String(v).trim() !== '') return String(v).trim()
  }
  return null
}

export async function fetchJurisdictionZoning(
  cfg: ArcGisJurisdictionConfig, e: number, n: number, opts: { fetchImpl?: typeof fetch } = {},
): Promise<JurisdictionZoning | null> {
  const doFetch = opts.fetchImpl ?? fetch
  if (!cfg.zoning) return null
  const features = await queryAtPoint(cfg.zoning.url, e, n, doFetch, { geometry: false })
  const a = features[0]?.attributes
  if (!a) return null
  const zoneCode = firstField(a, cfg.zoning.codeFields)
  if (!zoneCode) return null
  return {
    zoneCode,
    groupName: cfg.zoning.descriptionField ? firstField(a, [cfg.zoning.descriptionField]) : null,
    classUrl: cfg.zoning.urlField ? firstField(a, [cfg.zoning.urlField]) : null,
    source: { authority: cfg.zoning.authority, endpoint: cfg.zoning.url, retrievedAt: new Date().toISOString() },
  }
}

export async function fetchJurisdictionStreets(
  cfg: ArcGisJurisdictionConfig, e: number, n: number,
  opts: { searchFt?: number; fetchImpl?: typeof fetch } = {},
): Promise<JurisdictionStreet[]> {
  const doFetch = opts.fetchImpl ?? fetch
  const features = (await Promise.all(cfg.streets.urls.map(u =>
    queryAround(u, e, n, opts.searchFt ?? 300, doFetch).then(r => r.features)))).flat()
  return features.map((f: any) => ({
    name: firstField(f.attributes ?? {}, cfg.streets.nameFields),
    paths: (f.geometry?.paths ?? []).map((p: number[][]) => p.map(pt => [pt[0], pt[1]] as Position)),
  })).filter((s: JurisdictionStreet) => s.paths.length > 0)
}

/** Nearest vertex on the street network: a point on the fronting street. */
export function nearestStreetPointOf(streets: JurisdictionStreet[], e: number, n: number): Position | null {
  let best: Position | null = null
  let bestD = Infinity
  for (const s of streets) for (const path of s.paths) for (const pt of path) {
    const d = Math.hypot(pt[0] - e, pt[1] - n)
    if (d < bestD) { bestD = d; best = [pt[0], pt[1]] }
  }
  return best
}

export async function fetchJurisdictionAdjacentParcels(
  cfg: ArcGisJurisdictionConfig, subject: JurisdictionParcel, opts: { fetchImpl?: typeof fetch; searchFt?: number } = {},
): Promise<JurisdictionParcel[]> {
  const doFetch = opts.fetchImpl ?? fetch
  const layer = cfg.parcels.find(l => l.kind === subject.kind) ?? cfg.parcels[0]
  const xs = subject.ring.coordinates.map(c => c[0])
  const ys = subject.ring.coordinates.map(c => c[1])
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2
  const half = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2
  const { features } = await queryAround(layer.url, cx, cy, half + (opts.searchFt ?? 10), doFetch)
  return features
    .map((f: any) => parcelFromFeature(f, layer))
    .filter((p: JurisdictionParcel | null): p is JurisdictionParcel => p !== null && p.propId !== subject.propId)
}

export interface JurisdictionContour {
  elevationFt: number
  featureCode: number
  label: string
  weight: 'index' | 'intermediate'
  depression: boolean
  hidden: boolean
  path: [number, number][]
}

export interface JurisdictionContourResult {
  contours: JurisdictionContour[]
  elevationsFt: number[]
  intervalFt: number
  verticalDatum: string
  truncated: boolean
  caveats: string[]
  source: { authority: string; endpoint: string; retrievedAt: string; layer: string }
}

/** Contours around a site. Same shape as `fetchPgContours`, so the stages read either. */
export async function fetchJurisdictionContours(
  cfg: ArcGisJurisdictionConfig, e: number, n: number,
  opts: { radiusFt?: number; fetchImpl?: typeof fetch } = {},
): Promise<JurisdictionContourResult | null> {
  const c = cfg.contours
  if (!c) return null
  if (c === '3dep') {
    return fetch3depContours(e, n, {
      radiusFt: opts.radiusFt ?? 120, fetchImpl: opts.fetchImpl,
      authorityNote: `${cfg.name} publishes no queryable contours with a stated datum.`,
    })
  }
  const doFetch = opts.fetchImpl ?? fetch
  const { features, truncated } = await queryAround(
    c.url, e, n, opts.radiusFt ?? 120, doFetch, { outFields: c.elevationField })
  const contours: JurisdictionContour[] = []
  for (const f of features) {
    const z = Number(f?.attributes?.[c.elevationField])
    if (!Number.isFinite(z)) continue
    const index = Math.abs(z / (c.intervalFt * c.indexEvery) - Math.round(z / (c.intervalFt * c.indexEvery))) < 1e-6
    for (const path of f?.geometry?.paths ?? []) {
      contours.push({
        elevationFt: z, featureCode: 0,
        label: index ? 'Index contour' : 'Intermediate contour',
        weight: index ? 'index' : 'intermediate',
        depression: false, hidden: false,
        path: path.map((p: number[]) => [p[0], p[1]] as [number, number]),
      })
    }
  }
  const caveats = [...c.caveats]
  if (truncated) {
    caveats.push(
      `The service capped this response at ${features.length} features. The contour set is ` +
      'INCOMPLETE and must not be used to establish grade.')
  }
  return {
    contours,
    elevationsFt: [...new Set(contours.map(x => x.elevationFt))].sort((a, b) => a - b),
    intervalFt: c.intervalFt,
    verticalDatum: c.verticalDatum,
    truncated,
    caveats,
    source: { authority: c.authority, endpoint: c.url, retrievedAt: new Date().toISOString(), layer: c.layerLabel },
  }
}

export interface JurisdictionSite {
  jurisdictionCode: string
  address: JurisdictionAddress
  parcel: JurisdictionParcel | null
  zoning: JurisdictionZoning | null
  streetPoint: Position | null
  streets: JurisdictionStreet[]
}

/** Address to lot, zone and fronting streets, from the jurisdiction's own services. */
export async function resolveJurisdictionSite(
  cfg: ArcGisJurisdictionConfig, address: string, opts: { fetchImpl?: typeof fetch } = {},
): Promise<JurisdictionSite | null> {
  const { match } = await geocodeJurisdiction(cfg, address, opts)
  if (!match) return null
  const { easting2248: e, northing2248: n } = match
  const [parcel, zoning, streets] = await Promise.all([
    fetchJurisdictionParcel(cfg, e, n, opts),
    fetchJurisdictionZoning(cfg, e, n, opts),
    fetchJurisdictionStreets(cfg, e, n, opts).catch(() => [] as JurisdictionStreet[]),
  ])
  return {
    jurisdictionCode: cfg.code,
    address: match, parcel, zoning, streets,
    streetPoint: nearestStreetPointOf(streets, e, n),
  }
}
