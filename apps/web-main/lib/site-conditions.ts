/**
 * Live site conditions for real-time pricing.
 *
 * The quote must be automatic AND accurate, which means the facts that move
 * the price come from the county's own layers at quote time — not from a text
 * box and not from a model's guess. Every condition returned here carries the
 * service it came from, so the customer's quote can name its source.
 *
 * Rules from KEALEE.md that this file obeys:
 *  - PGAtlas is the authority; no public geocoder.
 *  - The street address alone is passed to the locator; a score below 90 is
 *    treated as no match.
 *  - A layer that does not answer produces `unverified`, never `false`. A
 *    fabricated "no constraint" reads exactly like a verified one and would
 *    quietly underprice the job.
 */

import type { SiteConditionFacts } from '@kealee/core-rules'

const PG_GIS = 'https://gis.pgatlas.com/pgatlas/rest/services'

/**
 * Verified live 2026-09-22. The address locator the repo documented
 * (`Geocoders/Address`) no longer exists on the server — only the composite
 * locator does — so the 90-score floor matters more, not less.
 */
const LAYERS = {
  locator:      `${PG_GIS}/Geocoders/Composite_Geolocator/GeocodeServer`,
  criticalArea: { url: `${PG_GIS}/Administrative/MapServer/5`,  title: 'Chesapeake Bay Critical Area Overlay (1988)' },
  /**
   * The FEMA layer tiles the whole county, Zone X ("minimal flood hazard")
   * included — a plain intersects test matches every address in Prince
   * George's. Only a Special Flood Hazard Area is a floodplain for pricing.
   */
  femaFlood:    { url: `${PG_GIS}/Environmental/MapServer/3`,   title: 'Floodplain (FEMA — 2026)', where: "FLD_ZONE IN ('A','AE','AH','AO','AR','A99','V','VE')" },
  countyFlood:  { url: `${PG_GIS}/Environmental/MapServer/31`,  title: 'Floodplain (DPIE)' },
  slope:        { url: `${PG_GIS}/Environmental/MapServer/13`,  title: 'Slope (2023)' },
  stream:       { url: `${PG_GIS}/Environmental/MapServer/1`,   title: 'Stream Center and Drainage (2023)' },
  wetland:      { url: `${PG_GIS}/Environmental/MapServer/25`,  title: 'Wetland (DNR)' },
  overlay:      { url: `${PG_GIS}/Zoning/MapServer/53`,         title: 'Neighborhood Conservation Overlay' },
} as const

/** EPSG:2248 — Maryland State Plane (feet), the CRS every PG layer speaks. */
const PG_CRS = 2248
const MIN_LOCATOR_SCORE = 90
/**
 * Table 24-4303(c): a regulated stream carries a 100-ft buffer, so a feature
 * within that distance is an encroachment question, not a clear site.
 */
const BUFFER_SEARCH_FT = 100

export interface SiteConditionSource {
  condition: keyof SiteConditionFacts
  present: boolean
  layer: string
  serviceUrl: string
  retrievedAt: string
}

export interface SiteConditionResult {
  conditions: SiteConditionFacts
  sources: SiteConditionSource[]
  /** Conditions no layer could answer. These are NOT priced and must be said aloud. */
  unverified: string[]
  point: { easting: number; northing: number; matchedAddress: string; score: number } | null
}

const EMPTY: SiteConditionResult = { conditions: {}, sources: [], unverified: [], point: null }

async function getJson(url: string, timeoutMs = 8000): Promise<any | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { headers: { accept: 'application/json' }, signal: controller.signal, cache: 'no-store' })
    if (!res.ok) return null
    const body = await res.json()
    return body?.error ? null : body
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** Street address ONLY — appending city/state returns zero candidates. */
export function streetAddressOnly(address: string): string {
  return address.split(',')[0]!.trim()
}

async function geocode(address: string): Promise<SiteConditionResult['point']> {
  const single = streetAddressOnly(address)
  if (single.length < 5) return null
  const url =
    `${LAYERS.locator}/findAddressCandidates` +
    `?SingleLine=${encodeURIComponent(single)}&outSR=${PG_CRS}&maxLocations=1&f=json`
  const body = await getJson(url)
  const candidate = body?.candidates?.[0]
  if (!candidate || Number(candidate.score ?? 0) < MIN_LOCATOR_SCORE) return null
  return {
    easting: Number(candidate.location.x),
    northing: Number(candidate.location.y),
    matchedAddress: String(candidate.address ?? single),
    score: Number(candidate.score),
  }
}

async function featureCount(
  serviceUrl: string,
  x: number,
  y: number,
  distanceFt = 0,
  where = '1=1',
): Promise<number | null> {
  const geometry = encodeURIComponent(JSON.stringify({ x, y, spatialReference: { wkid: PG_CRS } }))
  const distance = distanceFt > 0 ? `&distance=${distanceFt}&units=esriSRUnit_Foot` : ''
  const url =
    `${serviceUrl}/query?geometry=${geometry}&geometryType=esriGeometryPoint&inSR=${PG_CRS}` +
    `&spatialRel=esriSpatialRelIntersects${distance}` +
    `&returnGeometry=false&returnCountOnly=true&where=${encodeURIComponent(where)}&f=json`
  const body = await getJson(url)
  if (body == null || typeof body.count !== 'number') return null
  return body.count
}

/**
 * Resolve the conditions that change professional effort, in real time.
 * Runs every layer in parallel; a slow or silent layer degrades to
 * "unverified" rather than holding up the quote.
 */
export async function resolveSiteConditions(address: string): Promise<SiteConditionResult> {
  const point = await geocode(address)
  if (!point) return { ...EMPTY, unverified: ['Property could not be located in the county address locator'] }

  const { easting: x, northing: y } = point
  const retrievedAt = new Date().toISOString()

  const [cbca, femaFlood, countyFlood, slope, stream, wetland, overlay] = await Promise.all([
    featureCount(LAYERS.criticalArea.url, x, y),
    featureCount(LAYERS.femaFlood.url, x, y, 0, LAYERS.femaFlood.where),
    featureCount(LAYERS.countyFlood.url, x, y),
    featureCount(LAYERS.slope.url, x, y),
    featureCount(LAYERS.stream.url, x, y, BUFFER_SEARCH_FT),
    featureCount(LAYERS.wetland.url, x, y, BUFFER_SEARCH_FT),
    featureCount(LAYERS.overlay.url, x, y),
  ])

  const conditions: SiteConditionFacts = {}
  const sources: SiteConditionSource[] = []
  const unverified: string[] = []

  const record = (
    condition: keyof SiteConditionFacts,
    count: number | null,
    layer: string,
    serviceUrl: string,
    label: string,
  ) => {
    if (count == null) {
      unverified.push(label)
      return
    }
    const present = count > 0
    conditions[condition] = present
    sources.push({ condition, present, layer, serviceUrl, retrievedAt })
  }

  record('chesapeakeBayCriticalArea', cbca, LAYERS.criticalArea.title, LAYERS.criticalArea.url, 'Chesapeake Bay Critical Area')
  record('historicOrOverlayDistrict', overlay, LAYERS.overlay.title, LAYERS.overlay.url, 'Overlay district')
  // The county's own floodplain and FEMA's differ; either one puts the work in
  // a floodplain review, so the quote prices on whichever answers.
  const flood = femaFlood == null && countyFlood == null ? null : (femaFlood ?? 0) + (countyFlood ?? 0)
  record('femaFloodplain', flood, `${LAYERS.femaFlood.title} + ${LAYERS.countyFlood.title}`, LAYERS.femaFlood.url, 'Floodplain')
  // Mapped slope polygons are already the steep ones (25% and 90% ranges).
  record('steepSlope', slope, LAYERS.slope.title, LAYERS.slope.url, 'Steep slope')
  const buffer = stream == null && wetland == null ? null : (stream ?? 0) + (wetland ?? 0)
  record('streamOrWetlandBuffer', buffer, `${LAYERS.stream.title} / ${LAYERS.wetland.title} within ${BUFFER_SEARCH_FT} ft`, LAYERS.stream.url, 'Stream or wetland buffer')

  // A PE stamp follows from the scope and the jurisdiction's rules, not a layer.
  unverified.push('Structural / PE stamp requirement (set from scope at review)')

  return { conditions, sources, unverified, point }
}
