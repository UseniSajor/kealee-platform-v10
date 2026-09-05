/**
 * Nationwide address → jurisdiction → parcel resolution.
 *
 * Coverage hierarchy (docs: nationwide preconstruction launch):
 *   1. Registered jurisdiction parcel service (authoritative geometry)  → 'automated'
 *   2. Federal geocoder jurisdiction identification (all 50 states + DC) → 'data-assisted'
 *   3. Address parsed but not matched by any authority                  → 'manual-review'
 *
 * Hard rule: this module NEVER fabricates zoning, setbacks, lot coverage,
 * permit requirements, fees, or approvals. It reports only what a named source
 * returned, plus an explicit list of what still needs confirmation. Anything
 * unknown comes back as `null` and is surfaced to the customer as an open item.
 */

export type CoverageLevel =
  | 'automated'
  | 'data-assisted'
  | 'manual-review'
  | 'customer-confirmation'

export const COVERAGE_LABELS: Record<CoverageLevel, string> = {
  automated: 'Automated jurisdiction coverage',
  'data-assisted': 'Data-assisted coverage',
  'manual-review': 'Manual review required',
  'customer-confirmation': 'Customer confirmation required',
}

export type ResolutionStatus = 'resolved' | 'needs_review' | 'not_found'

export interface DataSourceRecord {
  /** Human-readable owner of the data, e.g. "U.S. Census Bureau Geocoder". */
  authority: string
  /** What the source supplied. Never a claim beyond the payload. */
  dataset: string
  /** ISO timestamp of retrieval — the "data date" shown to customers. */
  retrievedAt: string
  /** Publication/vintage date when the source declares one. */
  effectiveDate?: string
  url?: string
}

export interface Jurisdiction {
  state: string | null
  stateName: string | null
  county: string | null
  /** Incorporated place or county subdivision, when the source names one. */
  city: string | null
  countyFips: string | null
  stateFips: string | null
}

export interface ScaledParcelGeometry {
  /** Local planar feet, origin at the parcel's south-west extent. */
  vertices: { x: number; y: number }[]
  widthFeet: number
  depthFeet: number
  areaSquareFeet: number
}

export interface ParcelCandidate {
  parcelId: string | null
  scaledGeometry: ScaledParcelGeometry
  attributes?: Record<string, unknown>
}

export interface AddressParcelResolution {
  status: ResolutionStatus
  coverage: CoverageLevel
  coverageLabel: string
  /** 0–1. Reflects source quality only, never guesswork about the project. */
  confidence: number
  standardizedAddress: string | null
  latitude: number | null
  longitude: number | null
  jurisdiction: Jurisdiction
  parcel: ParcelCandidate | null
  parcelCandidates: ParcelCandidate[]
  /** Primary source, kept for the existing intake UI ("Source: X · retrieved Y"). */
  source: DataSourceRecord | null
  dataSources: DataSourceRecord[]
  warnings: string[]
  /** Facts a human must confirm before the deliverable can be relied on. */
  itemsRequiringConfirmation: string[]
  requiresProfessionalVerification: boolean
}

// ── Registered jurisdiction parcel services ─────────────────────────────────
//
// Generic ArcGIS FeatureServer/MapServer adapter. Operators add jurisdictions
// without a code change via KEALEE_PARCEL_SERVICES (JSON array of the same
// shape). Every entry must be a public, authoritative parcel layer.

export interface ParcelServiceConfig {
  /** Matched against the geocoded county FIPS (preferred) or state code. */
  countyFips?: string
  stateFips?: string
  authority: string
  dataset: string
  /** ArcGIS layer query endpoint, without the trailing "/query". */
  layerUrl: string
  /** Field holding the parcel identifier in the layer's attributes. */
  parcelIdField: string
  url?: string
}

const BUILT_IN_PARCEL_SERVICES: ParcelServiceConfig[] = [
  {
    countyFips: '11001', // District of Columbia
    authority: 'DC Office of the Chief Technology Officer (DCGIS)',
    dataset: 'Property and Land — Tax Lots',
    layerUrl:
      'https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Property_and_Land_WebMercator/MapServer/39',
    parcelIdField: 'SSL',
    url: 'https://opendata.dc.gov/',
  },
]

function registeredParcelServices(): ParcelServiceConfig[] {
  const raw = process.env.KEALEE_PARCEL_SERVICES
  if (!raw) return BUILT_IN_PARCEL_SERVICES
  try {
    const extra = JSON.parse(raw) as ParcelServiceConfig[]
    return Array.isArray(extra) ? [...extra, ...BUILT_IN_PARCEL_SERVICES] : BUILT_IN_PARCEL_SERVICES
  } catch {
    console.warn('[site-intelligence] KEALEE_PARCEL_SERVICES is not valid JSON — ignoring')
    return BUILT_IN_PARCEL_SERVICES
  }
}

// ── Geometry helpers ────────────────────────────────────────────────────────

const FEET_PER_DEGREE_LATITUDE = 364_000

/**
 * Projects a WGS84 ring onto a local planar grid in feet. This is a display
 * projection for the intake preview only — it is explicitly not survey grade,
 * and every deliverable repeats that.
 */
function toScaledGeometry(ring: number[][], centroidLat: number): ScaledParcelGeometry | null {
  if (!Array.isArray(ring) || ring.length < 3) return null
  const feetPerDegreeLon = FEET_PER_DEGREE_LATITUDE * Math.cos((centroidLat * Math.PI) / 180)
  const points = ring
    .filter(p => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]))
    .map(([lon, lat]) => ({ x: lon * feetPerDegreeLon, y: lat * FEET_PER_DEGREE_LATITUDE }))
  if (points.length < 3) return null

  const minX = Math.min(...points.map(p => p.x))
  const minY = Math.min(...points.map(p => p.y))
  const vertices = points.map(p => ({ x: p.x - minX, y: p.y - minY }))
  const widthFeet = Math.max(...vertices.map(v => v.x))
  const depthFeet = Math.max(...vertices.map(v => v.y))

  // Shoelace area on the local planar ring.
  let twiceArea = 0
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i]
    const b = vertices[(i + 1) % vertices.length]
    twiceArea += a.x * b.y - b.x * a.y
  }
  const areaSquareFeet = Math.abs(twiceArea) / 2
  if (!Number.isFinite(areaSquareFeet) || areaSquareFeet <= 0) return null

  return { vertices, widthFeet, depthFeet, areaSquareFeet }
}

// ── Step 1: federal geocoder (nationwide) ───────────────────────────────────

interface GeocodeResult {
  standardizedAddress: string
  latitude: number
  longitude: number
  jurisdiction: Jurisdiction
}

const CENSUS_GEOCODER =
  'https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress'

function firstGeography(
  geographies: Record<string, Array<Record<string, unknown>>> | undefined,
  key: string,
): Record<string, unknown> | undefined {
  return geographies?.[key]?.[0]
}

async function geocodeAddress(address: string, signal: AbortSignal): Promise<GeocodeResult | null> {
  const url = `${CENSUS_GEOCODER}?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`
  const res = await fetch(url, { signal, headers: { accept: 'application/json' } })
  if (!res.ok) return null

  const payload = (await res.json()) as {
    result?: {
      addressMatches?: Array<{
        matchedAddress?: string
        coordinates?: { x?: number; y?: number }
        geographies?: Record<string, Array<Record<string, unknown>>>
      }>
    }
  }

  const match = payload.result?.addressMatches?.[0]
  if (!match?.coordinates || typeof match.coordinates.x !== 'number') return null

  const geo = match.geographies
  const state = firstGeography(geo, 'States')
  const county = firstGeography(geo, 'Counties')
  const place = firstGeography(geo, 'Incorporated Places') ?? firstGeography(geo, 'County Subdivisions')

  const stateFips = (state?.STATE as string) ?? null
  const countyCode = (county?.COUNTY as string) ?? null

  return {
    standardizedAddress: match.matchedAddress ?? address,
    latitude: match.coordinates.y as number,
    longitude: match.coordinates.x as number,
    jurisdiction: {
      state: (state?.STUSAB as string) ?? null,
      stateName: (state?.NAME as string) ?? null,
      county: (county?.NAME as string) ?? null,
      city: (place?.NAME as string) ?? null,
      stateFips,
      countyFips: stateFips && countyCode ? `${stateFips}${countyCode}` : null,
    },
  }
}

// ── Step 2: registered parcel service (jurisdiction-specific) ───────────────

/**
 * Radius used when the geocoded point misses every parcel polygon. Federal
 * geocoding interpolates along the street centerline, which lands in the
 * right-of-way rather than inside a lot, so an exact hit test alone finds
 * nothing on most residential addresses.
 */
const PARCEL_SEARCH_RADIUS_METERS = 25

async function queryParcelService(
  service: ParcelServiceConfig,
  lat: number,
  lon: number,
  signal: AbortSignal,
  searchRadiusMeters = 0,
): Promise<ParcelCandidate[]> {
  const params = new URLSearchParams({
    // ArcGIS returns zero features for a spatial-only query on some services;
    // the explicit where clause is required alongside the geometry filter.
    where: '1=1',
    geometry: `${lon},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'json',
  })
  if (searchRadiusMeters > 0) {
    params.set('distance', String(searchRadiusMeters))
    params.set('units', 'esriSRUnit_Meter')
  }
  const res = await fetch(`${service.layerUrl}/query?${params.toString()}`, {
    signal,
    headers: { accept: 'application/json' },
  })
  if (!res.ok) return []

  const payload = (await res.json()) as {
    features?: Array<{
      attributes?: Record<string, unknown>
      geometry?: { rings?: number[][][] }
    }>
    error?: unknown
  }
  if (payload.error || !Array.isArray(payload.features)) return []

  const candidates: ParcelCandidate[] = []
  for (const feature of payload.features.slice(0, 6)) {
    const ring = feature.geometry?.rings?.[0]
    if (!ring) continue
    const scaledGeometry = toScaledGeometry(ring, lat)
    if (!scaledGeometry) continue
    const rawId = feature.attributes?.[service.parcelIdField]
    candidates.push({
      parcelId: rawId == null ? null : String(rawId),
      scaledGeometry,
      attributes: feature.attributes,
    })
  }
  return candidates
}

// ── Public entry point ──────────────────────────────────────────────────────

const BASE_CONFIRMATION_ITEMS = [
  'Zoning district, overlays, and current setback requirements for this parcel',
  'Lot coverage, height, and impervious-surface limits in force at submission',
  'Surveyed property boundaries and easements',
  'Permit type and submission requirements for the intended scope',
]

function emptyJurisdiction(): Jurisdiction {
  return { state: null, stateName: null, county: null, city: null, countyFips: null, stateFips: null }
}

function manualReview(address: string, warnings: string[]): AddressParcelResolution {
  return {
    status: 'not_found',
    coverage: 'manual-review',
    coverageLabel: COVERAGE_LABELS['manual-review'],
    confidence: 0.2,
    standardizedAddress: address || null,
    latitude: null,
    longitude: null,
    jurisdiction: emptyJurisdiction(),
    parcel: null,
    parcelCandidates: [],
    source: null,
    dataSources: [],
    warnings,
    itemsRequiringConfirmation: [
      'Property location and jurisdiction (a Kealee reviewer will confirm these manually)',
      ...BASE_CONFIRMATION_ITEMS,
    ],
    requiresProfessionalVerification: true,
  }
}

/**
 * Resolve a US address to a jurisdiction and, where a registered parcel
 * service covers it, to preliminary parcel geometry.
 *
 * Always resolves — an unmatched address returns a `manual-review` record
 * rather than an error, so nationwide intake is never blocked by data gaps.
 */
export async function resolveAddressParcel(
  address: string,
  options: { timeoutMs?: number } = {},
): Promise<AddressParcelResolution> {
  const trimmed = address.trim()
  if (!trimmed) {
    return manualReview('', ['No address was provided.'])
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 12_000)

  try {
    let geocoded: GeocodeResult | null = null
    try {
      geocoded = await geocodeAddress(trimmed, controller.signal)
    } catch (error) {
      console.warn(
        '[site-intelligence] geocoder unavailable:',
        error instanceof Error ? error.message : error,
      )
      return manualReview(trimmed, [
        'The federal address service did not respond. A Kealee reviewer will identify the jurisdiction manually.',
      ])
    }

    if (!geocoded) {
      return manualReview(trimmed, [
        'This address was not matched by the federal address service. This is common for new construction, rural routes, and recently platted lots.',
        'A Kealee reviewer will identify the jurisdiction manually — your order is not blocked.',
      ])
    }

    const now = new Date().toISOString()
    const geocodeSource: DataSourceRecord = {
      authority: 'U.S. Census Bureau Geocoder',
      dataset: 'Public_AR_Current / Current_Current geographies',
      retrievedAt: now,
      url: 'https://geocoding.geo.census.gov/',
    }

    const dataSources: DataSourceRecord[] = [geocodeSource]
    const warnings: string[] = []
    const itemsRequiringConfirmation = [...BASE_CONFIRMATION_ITEMS]

    // Step 2 — jurisdiction-specific parcel service, when one is registered.
    const services = registeredParcelServices().filter(
      service =>
        (service.countyFips && service.countyFips === geocoded!.jurisdiction.countyFips) ||
        (service.stateFips && service.stateFips === geocoded!.jurisdiction.stateFips),
    )

    let candidates: ParcelCandidate[] = []
    let exactHit = false
    let parcelSource: DataSourceRecord | null = null
    for (const service of services) {
      try {
        // Exact hit first — an unambiguous parcel we can present directly.
        let found = await queryParcelService(
          service,
          geocoded.latitude,
          geocoded.longitude,
          controller.signal,
        )
        let hitWasExact = found.length > 0
        if (found.length === 0) {
          found = await queryParcelService(
            service,
            geocoded.latitude,
            geocoded.longitude,
            controller.signal,
            PARCEL_SEARCH_RADIUS_METERS,
          )
          hitWasExact = false
        }
        if (found.length > 0) {
          candidates = found
          exactHit = hitWasExact
          parcelSource = {
            authority: service.authority,
            dataset: service.dataset,
            retrievedAt: new Date().toISOString(),
            url: service.url,
          }
          dataSources.push(parcelSource)
          break
        }
      } catch (error) {
        console.warn(
          `[site-intelligence] parcel service failed (${service.authority}):`,
          error instanceof Error ? error.message : error,
        )
        warnings.push(
          `${service.authority} did not respond. Parcel geometry will be confirmed by a Kealee reviewer.`,
        )
      }
    }

    if (candidates.length > 0) {
      const unambiguous = exactHit && candidates.length === 1
      warnings.push(
        'Tax/GIS parcel geometry is approximate and may be offset from surveyed boundaries.',
      )
      if (!exactHit) {
        warnings.push(
          'The address point fell in the public right-of-way, so nearby parcels are shown for you to confirm.',
        )
      }
      itemsRequiringConfirmation.unshift('That the matched tax parcel is the project parcel')
      const coverage: CoverageLevel = unambiguous ? 'automated' : 'customer-confirmation'
      return {
        status: 'resolved',
        coverage,
        coverageLabel: COVERAGE_LABELS[coverage],
        confidence: unambiguous ? 0.82 : candidates.length === 1 ? 0.7 : 0.55,
        standardizedAddress: geocoded.standardizedAddress,
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        jurisdiction: geocoded.jurisdiction,
        // A single buffered hit is still a guess until the customer confirms it,
        // but presenting it directly (with the confirm checkbox the intake
        // already renders) is clearer than a one-item candidate list.
        parcel: candidates.length === 1 ? candidates[0] : null,
        parcelCandidates: candidates,
        source: parcelSource,
        dataSources,
        warnings,
        itemsRequiringConfirmation,
        requiresProfessionalVerification: true,
      }
    }

    // Step 3 — jurisdiction identified, no automated parcel geometry.
    warnings.push(
      'Additional property documentation may be needed to complete the site geometry for this location. Our team will let you know what to provide.',
    )
    itemsRequiringConfirmation.unshift(
      'Parcel boundary and lot dimensions (upload a survey or plat if you have one)',
    )

    return {
      status: 'needs_review',
      coverage: 'data-assisted',
      coverageLabel: COVERAGE_LABELS['data-assisted'],
      confidence: 0.55,
      standardizedAddress: geocoded.standardizedAddress,
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
      jurisdiction: geocoded.jurisdiction,
      parcel: null,
      parcelCandidates: [],
      source: geocodeSource,
      dataSources,
      warnings,
      itemsRequiringConfirmation,
      requiresProfessionalVerification: true,
    }
  } finally {
    clearTimeout(timer)
  }
}
