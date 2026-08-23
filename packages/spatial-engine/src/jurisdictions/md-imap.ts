/**
 * Maryland iMAP — statewide parcel boundaries.
 *
 * This is what lets a site plan be drawn without a survey. Prince George's own
 * GIS publishes no parcel service (all 59 services on gisdata.pgplanning.org
 * checked), so parcel geometry for any Maryland county comes from the state.
 *
 * ── Host, and why it matters ───────────────────────────────────────────────
 *
 * `mdgeodata.md.gov` is live. `geodata.md.gov` — the host most documentation
 * cites — currently returns a maintenance page, so code pointed at it fails in
 * a way that looks like "no parcel found" rather than "the server is down".
 * The host is named once here for that reason.
 *
 * ── What this is and is not ────────────────────────────────────────────────
 *
 * A state parcel boundary is a compiled cadastral record assembled from plats
 * and tax maps. It is Level 1: good enough to draw a lot, establish its
 * dimensions approximately, and site a building envelope for review. It is NOT
 * a boundary survey, and every feature says so. In testing, county GIS sat 4.3
 * ft off the surveyed line and that was enough to flip a front setback from
 * compliant to non-compliant.
 */

import type { Ring, Position } from '../site-plan/site-twin'
import type { SourceRecord } from '../site-plan/reliability'

export const MD_IMAP_ROOT = 'https://mdgeodata.md.gov/imap/rest/services'

export const MD_IMAP_LAYERS = {
  parcelBoundaries: {
    service: 'PlanningCadastre/MD_ParcelBoundaries',
    layerId: 0,
    title: 'Maryland Parcel Boundaries',
  },
} as const

/**
 * Elevation on MD iMAP is bathymetry and scanned USGS topo quads — a raster
 * picture of a map, not vector contours. Recorded so nobody re-runs the search.
 */
export const MD_IMAP_NO_CONTOURS = {
  what: 'Vector contours',
  detail:
    'The MD iMAP Elevation folder publishes MD_Bathymetry and MD_USGSTopoQuads only. The topo quads are ' +
    'an ImageServer of scanned map sheets — not vector contours and not a DEM. Terrain for a site plan ' +
    'therefore comes from a LiDAR tile through the PDAL path, not from a web service.',
} as const

/** The attributes worth carrying onto a sheet or into a title block. */
export interface MdParcelAttributes {
  accountId: string | null
  address: string | null
  /** Deed reference. */
  liber: string | null
  folio: string | null
  /** Plat reference. */
  plat: string | null
  platLiber: string | null
  platFolio: string | null
  section: string | null
  block: string | null
  lot: string | null
  taxMap: string | null
  grid: string | null
  parcelNumber: string | null
  /** The county's own zoning string. Indicative; the zoning layer governs. */
  zoning: string | null
  acres: number | null
  landAreaSqFt: number | null
  widthFt: number | null
  depthFt: number | null
  legalDescription: string | null
  jurisdictionCode: string | null
}

export interface MdParcelResult {
  found: boolean
  ring: Ring | null
  /** Additional rings when the parcel is multipart. */
  additionalRings: Ring[]
  attributes: MdParcelAttributes | null
  source: SourceRecord
  /** More than one parcel at the point — the address is ambiguous. */
  candidateCount: number
  error: string | null
  /** Why a caller should not treat this as a survey. */
  caveat: string
}

interface ArcGisFeature {
  attributes: Record<string, unknown>
  geometry?: { rings?: number[][][] }
}

/**
 * Parcels that are not a buildable lot.
 *
 * A geocoded address lands on the street centreline far more often than inside
 * the lot, and the polygon there is the road right-of-way — which in Maryland
 * carries ACCTID 'ROW' and zero acres. It is a real parcel record and a
 * point-in-polygon test returns it happily, so a naive query "succeeds" and
 * hands back a road. Observed on the first live run: 8,579 vertices of street.
 */
function isNonLotParcel(a: Record<string, unknown>): boolean {
  const acct = String(a.ACCTID ?? '').trim().toUpperCase()
  if (acct === 'ROW' || acct === '' || acct === 'NULL') return true
  // Water, railway and similar are recorded the same way.
  if (['WATER', 'RAIL', 'RR'].includes(acct)) return true
  return false
}

/** Rough centroid, for choosing the nearest candidate. */
function centroidOf(rings: number[][][]): [number, number] | null {
  const pts = rings.flat()
  if (!pts.length) return null
  let sx = 0, sy = 0
  for (const p of pts) { sx += p[0]; sy += p[1] }
  return [sx / pts.length, sy / pts.length]
}

const str = (v: unknown): string | null => {
  if (v == null) return null
  const s = String(v).trim()
  return s === '' || s.toUpperCase() === 'NULL' ? null : s
}
const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

function mapAttributes(a: Record<string, unknown>): MdParcelAttributes {
  const legal = [a.LEGAL1, a.LEGAL2, a.LEGAL3].map(str).filter(Boolean).join(' ')
  return {
    accountId: str(a.ACCTID),
    address: str(a.ADDRESS),
    liber: str(a.DR1LIBER),
    folio: str(a.DR1FOLIO),
    plat: str(a.PLAT),
    platLiber: str(a.PLTLIBER),
    platFolio: str(a.PLTFOLIO),
    section: str(a.SECTION),
    block: str(a.BLOCK),
    lot: str(a.LOT),
    taxMap: str(a.MAP),
    grid: str(a.GRID),
    parcelNumber: str(a.PARCEL),
    zoning: str(a.ZONING),
    acres: num(a.ACRES),
    landAreaSqFt: num(a.LANDAREA),
    widthFt: num(a.WIDTH),
    depthFt: num(a.DEPTH),
    legalDescription: legal || null,
    jurisdictionCode: str(a.JURSCODE),
  }
}

export const MD_PARCEL_CAVEAT =
  'Maryland iMAP parcel boundaries are a compiled cadastral record assembled from plats and tax maps, ' +
  'not a boundary survey. Use them to draw the lot and site a building envelope for review; do not ' +
  'scale a setback off them for construction. County GIS has been observed 4.3 ft off the surveyed line, ' +
  'which was enough to flip a front yard from compliant to non-compliant.'

export interface FetchMdParcelOptions {
  fetchImpl?: typeof fetch
  /** Expand to a box of this half-width (ft) when a point hits nothing. */
  fallbackRadiusFeet?: number
}

/**
 * Fetches the parcel containing a point, in EPSG:2248.
 *
 * A geocoded address usually lands on the street centreline rather than inside
 * the lot, so a point-in-polygon test alone returns nothing surprisingly often.
 * On a miss this retries with a small envelope and reports how many candidates
 * it found — more than one means the address is ambiguous and a human must
 * choose, which is very different from "the parcel is this one".
 */
export async function fetchMdParcelAtPoint(
  easting2248: number,
  northing2248: number,
  opts: FetchMdParcelOptions = {},
): Promise<MdParcelResult> {
  const doFetch = opts.fetchImpl ?? fetch
  const layer = MD_IMAP_LAYERS.parcelBoundaries
  const base = `${MD_IMAP_ROOT}/${layer.service}/MapServer/${layer.layerId}/query`
  const retrievedAt = new Date().toISOString()

  const source: SourceRecord = {
    sourceId: 'md-imap-parcels',
    authority: 'Maryland Department of Information Technology — MD iMAP',
    dataset: layer.title,
    url: `${MD_IMAP_ROOT}/${layer.service}/MapServer/${layer.layerId}`,
    retrievedAt,
    crs: 'EPSG:2248',
    horizontalDatum: 'NAD83',
    // Cadastral polygons carry no elevation. Null is meaningful, not missing.
    verticalDatum: null,
    accuracyClass: 'mapping_grade',
    reliabilityLevel: 1,
    notes: MD_PARCEL_CAVEAT,
  }

  const common = {
    where: '1=1',
    inSR: '2248',
    outSR: '2248',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'true',
    resultRecordCount: '5',
    f: 'json',
  }

  async function run(params: Record<string, string>): Promise<ArcGisFeature[] | string> {
    try {
      const res = await doFetch(`${base}?${new URLSearchParams({ ...common, ...params })}`)
      if (!res.ok) return `HTTP ${res.status}`
      const j = (await res.json()) as { error?: { message?: string }; features?: ArcGisFeature[] }
      // ArcGIS reports failures in the body with HTTP 200.
      if (j.error) return j.error.message ?? 'service error'
      return j.features ?? []
    } catch (e) {
      return e instanceof Error ? e.message : String(e)
    }
  }

  const point = await run({
    geometry: `${easting2248},${northing2248}`,
    geometryType: 'esriGeometryPoint',
  })
  if (typeof point === 'string') {
    return { found: false, ring: null, additionalRings: [], attributes: null, source,
             candidateCount: 0, error: point, caveat: MD_PARCEL_CAVEAT }
  }

  let features = point.filter(f => !isNonLotParcel(f.attributes))
  let hitRightOfWay = point.length > 0 && features.length === 0

  // Either nothing was there, or what was there was a road. Both mean the
  // geocode missed the lot, and both are fixed the same way: widen and take the
  // nearest real parcel. `resultRecordCount` is raised because a widened box
  // around a street picks up the ROW plus several neighbours.
  if (features.length === 0) {
    const r = opts.fallbackRadiusFeet ?? 120
    const widened = await run({
      geometry: `${easting2248 - r},${northing2248 - r},${easting2248 + r},${northing2248 + r}`,
      geometryType: 'esriGeometryEnvelope',
      resultRecordCount: '25',
    })
    if (typeof widened === 'string') {
      return { found: false, ring: null, additionalRings: [], attributes: null, source,
               candidateCount: 0, error: widened, caveat: MD_PARCEL_CAVEAT }
    }
    features = widened.filter(f => !isNonLotParcel(f.attributes))
    hitRightOfWay = hitRightOfWay || widened.length > features.length

    // Nearest centroid wins. Any parcel found this way is a CANDIDATE — the
    // geocode did not fall inside it — so the caveat says so and a person
    // confirms before it is relied on.
    if (features.length > 1) {
      features = [...features].sort((a, b) => {
        const ca = centroidOf(a.geometry?.rings ?? [])
        const cb = centroidOf(b.geometry?.rings ?? [])
        const da = ca ? Math.hypot(ca[0] - easting2248, ca[1] - northing2248) : Infinity
        const db = cb ? Math.hypot(cb[0] - easting2248, cb[1] - northing2248) : Infinity
        return da - db
      })
    }
  }

  if (features.length === 0) {
    return {
      found: false, ring: null, additionalRings: [], attributes: null, source,
      candidateCount: 0, error: null,
      caveat: hitRightOfWay
        ? 'The only parcel at this location is a road right-of-way, and no buildable parcel was found ' +
          `within ${opts.fallbackRadiusFeet ?? 120} ft. The address may be wrong, or the geocode may be ` +
          'far from the lot. ' + MD_PARCEL_CAVEAT
        : MD_PARCEL_CAVEAT,
    }
  }

  const first = features[0]
  const rings = (first.geometry?.rings ?? []).map(
    r => ({ coordinates: r.map(p => [p[0], p[1]] as Position) }) as Ring,
  )

  return {
    found: rings.length > 0,
    ring: rings[0] ?? null,
    additionalRings: rings.slice(1),
    attributes: mapAttributes(first.attributes),
    source,
    candidateCount: features.length,
    error: null,
    caveat: [
      hitRightOfWay
        ? 'The geocode landed on a road right-of-way, so this parcel was chosen as the nearest buildable ' +
          'one rather than the one containing the point. Confirm it is the right lot before relying on it.'
        : null,
      features.length > 1
        ? `${features.length} candidate parcels are nearby — confirm which is the subject lot.`
        : null,
      MD_PARCEL_CAVEAT,
    ].filter(Boolean).join(' '),
  }
}
