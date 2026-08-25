/**
 * PGAtlas elevation data — 2-foot contours, slope and DEM.
 *
 * ── Correcting an earlier wrong conclusion ─────────────────────────────────
 *
 * This engine previously recorded that Prince George's County publishes no
 * contour data, and the site-plan product carried "vertical datum NOT
 * ESTABLISHED" as an unavoidable gap. That was wrong. It came from searching
 * only `gisdata.pgplanning.org` — the open-data portal — which genuinely has no
 * elevation layers. PGAtlas itself is a different server:
 *
 *     gisdata.pgplanning.org   open data portal, 57 services, NO elevation
 *     gis.pgatlas.com          PGAtlas proper — Elevation, Property, Zoning,
 *                              Environmental, Easement, WaterSewer, ...
 *
 * The lesson is the same one the EncodePlus and eLaws traps taught: a negative
 * result about a publisher is only as good as the host you asked. Never record
 * "the county does not publish X" on the strength of one server.
 *
 * ── The data ───────────────────────────────────────────────────────────────
 *
 * Elevation/MapServer/1, "Contour - 2 Ft (2023)". Derived from lidar flown over
 * 18 missions on 13 dates between 2016-11-12 and 2018, contours built from a
 * keypoint terrain with breaklines enforced, QC'd by Sanborn including edge
 * matching against Montgomery County.
 *
 * This is what closes Sec. 32-130(a)(5): "contours at one (1) or two (2) foot
 * intervals". Two-foot contours satisfy it directly.
 */

import type { Ring } from '../site-plan/site-twin'

export const PGATLAS_HOST = 'https://gis.pgatlas.com/pgatlas/rest/services'

/**
 * The county's own contour service, same data lineage, different host.
 * Recorded as a fallback so an outage on one does not stop a drawing.
 */
export const PG_COUNTY_CONTOUR_FALLBACK =
  'https://gis.princegeorgescountymd.gov/arcgis/rest/services/Contours/2_5_Ft_Contour/MapServer/0'

export interface PgElevationLayer {
  id: number
  name: string
  /** ArcGIS refuses to draw above this denominator; queries are unaffected. */
  minScale: number
  purpose: string
}

/** Verified against the live service on 2026-08-25. */
export const PG_ELEVATION_LAYERS: PgElevationLayer[] = [
  { id: 1, name: 'Contour - 2 Ft (2023)', minScale: 50_000,
    purpose: 'Existing topography. Satisfies the 1 or 2 ft interval of Sec. 32-130(a)(5).' },
  { id: 0, name: 'Slope (2023)', minScale: 50_000,
    purpose: 'Slope classes — screening for the 32-151 Table 4 limits and 32-161 setbacks.' },
  { id: 3, name: 'Digital Elevation Model (2023)', minScale: 0,
    purpose: 'Raster surface. Source for spot elevations and cross sections — Sec. 32-130(a)(9).' },
  { id: 5, name: 'Shaded Relief (Grayscale) (2023)', minScale: 0, purpose: 'Cartographic backdrop only.' },
  { id: 6, name: 'Shaded Relief (Color) (2023)', minScale: 0, purpose: 'Cartographic backdrop only.' },
  { id: 8, name: 'Ground Control (2020)', minScale: 0,
    purpose: 'Survey control monuments — candidates for the benchmark note.' },
]

export const PG_CONTOUR_LAYER_ID = 1
export const PG_CONTOUR_INTERVAL_FT = 2

/**
 * FEATURE_CODE domain, read from the layer's own renderer rather than assumed.
 *
 * The distinction matters on the drawing: index contours are drawn heavier and
 * carry the elevation label; depression contours take hachures and mean the
 * opposite of what their neighbours imply; hidden contours are obscured
 * (typically under structures or dense canopy) and are less reliable.
 */
export const PG_CONTOUR_FEATURE_CODES: Record<number, {
  label: string
  weight: 'index' | 'intermediate'
  depression: boolean
  hidden: boolean
}> = {
  7101: { label: 'Index Contour', weight: 'index', depression: false, hidden: false },
  7102: { label: 'Intermediate Contour', weight: 'intermediate', depression: false, hidden: false },
  7103: { label: 'Index Depression Contour', weight: 'index', depression: true, hidden: false },
  7104: { label: 'Intermediate Depression Contour', weight: 'intermediate', depression: true, hidden: false },
  7105: { label: 'Index Hidden Contour', weight: 'index', depression: false, hidden: true },
  7106: { label: 'Intermediate Hidden Contour', weight: 'intermediate', depression: false, hidden: true },
  7107: { label: 'Index Hidden Depression Contour', weight: 'index', depression: true, hidden: true },
  7108: { label: 'Intermediate Hidden Depression Contour', weight: 'intermediate', depression: true, hidden: true },
}

/**
 * Vertical datum of the contour data.
 *
 * Published as NAVD88 feet. This is the answer to a question the engine has
 * been carrying unresolved: the DPIE Design Review Checklist item B-6 (last
 * edited 2013) asks for NGVD 1929, but the county's own current elevation data
 * is NAVD88. Drawing NAVD88 contours under an NGVD29 datum note would be a
 * false statement on a sealed drawing.
 *
 * The engine therefore labels what the data actually is and does NOT convert.
 * The NGVD29 conversion is a real transformation (VERTCON) and roughly -0.9 ft
 * in this part of Maryland; applying it silently would be worse than stating
 * the true datum. Confirm current DPIE practice before doing anything else.
 */
export const PG_CONTOUR_VERTICAL_DATUM = 'NAVD88 (feet)'

export const PG_CONTOUR_DATUM_CAVEAT =
  'Contours are NAVD88 feet, from county lidar flown 2016-2018. DPIE Design Review Checklist ' +
  'item B-6 (2013) asks for NGVD 1929. These differ by roughly 0.9 ft in Prince George\'s County. ' +
  'The datum is stated as published and NOT converted — a silent VERTCON shift under a sealed ' +
  'drawing would be a fabricated elevation. Confirm the datum DPIE currently requires.'

export const PG_CONTOUR_ACCURACY_CAVEAT =
  'Lidar-derived 2 ft contours to ASPRS specification, flown 2016-2018. They establish existing ' +
  'grade for design and review. They are not a field-run topographic survey: spot elevations at ' +
  'building corners and finished floor elevations under Sec. 32-130(a)(9) still require one, and ' +
  'HIDDEN contours (feature codes 7105-7108) were obscured at capture and are the least reliable.'

export interface PgContour {
  elevationFt: number
  featureCode: number
  label: string
  weight: 'index' | 'intermediate'
  depression: boolean
  hidden: boolean
  /** Polyline vertices in EPSG:2248. */
  path: [number, number][]
}

export interface PgContourResult {
  contours: PgContour[]
  /** Distinct elevations returned, ascending. */
  elevationsFt: number[]
  intervalFt: number
  verticalDatum: string
  /** True when the service capped the response — the set is incomplete. */
  truncated: boolean
  caveats: string[]
  source: { authority: string; endpoint: string; retrievedAt: string; layer: string }
}

export class PgElevationError extends Error {
  constructor(readonly code: 'HTTP' | 'ARCGIS_ERROR' | 'NOT_JSON' | 'EMPTY', message: string) {
    super(message)
    this.name = 'PgElevationError'
  }
}

/** Query URL for contours intersecting a square around the site. */
export function pgContourQueryUrl(
  easting2248: number, northing2248: number, radiusFt: number,
): string {
  const bbox = [
    easting2248 - radiusFt, northing2248 - radiusFt,
    easting2248 + radiusFt, northing2248 + radiusFt,
  ].join(',')
  const p = new URLSearchParams({
    // ArcGIS requires a where clause alongside a geometry filter.
    where: '1=1',
    geometry: bbox,
    geometryType: 'esriGeometryEnvelope',
    inSR: '2248',
    outSR: '2248',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'ELEVATION,FEATURE_CODE',
    returnGeometry: 'true',
    f: 'json',
  })
  return `${PGATLAS_HOST}/Elevation/MapServer/${PG_CONTOUR_LAYER_ID}/query?${p.toString()}`
}

/**
 * Fetches 2-ft contours around a site.
 *
 * Radius defaults to 120 ft, which covers a typical lot plus the twenty-foot
 * peripheral strip Sec. 32-130(a)(5) requires. Widen it for a larger site — but
 * note maxRecordCount is 1000 and a large radius WILL hit it, which is reported
 * as `truncated` rather than silently returning a partial surface.
 */
export async function fetchPgContours(
  easting2248: number,
  northing2248: number,
  opts: { radiusFt?: number; fetchImpl?: typeof fetch } = {},
): Promise<PgContourResult> {
  const radiusFt = opts.radiusFt ?? 120
  const doFetch = opts.fetchImpl ?? fetch
  const url = pgContourQueryUrl(easting2248, northing2248, radiusFt)
  const retrievedAt = new Date().toISOString()

  const res = await doFetch(url, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new PgElevationError('HTTP', `PGAtlas contour query returned HTTP ${res.status}.`)

  let payload: any
  try { payload = await res.json() } catch {
    throw new PgElevationError('NOT_JSON', 'PGAtlas contour query did not return JSON.')
  }
  // ArcGIS reports errors with HTTP 200, so status alone proves nothing.
  if (payload?.error) {
    throw new PgElevationError('ARCGIS_ERROR',
      `PGAtlas returned an error: ${payload.error.message ?? JSON.stringify(payload.error)}`)
  }

  const features: any[] = payload?.features ?? []
  const contours: PgContour[] = []
  for (const f of features) {
    const a = f?.attributes ?? {}
    const code = Number(a.FEATURE_CODE)
    const meta = PG_CONTOUR_FEATURE_CODES[code]
    for (const path of f?.geometry?.paths ?? []) {
      contours.push({
        elevationFt: Number(a.ELEVATION),
        featureCode: code,
        label: meta?.label ?? `Unknown feature code ${code}`,
        weight: meta?.weight ?? 'intermediate',
        depression: meta?.depression ?? false,
        hidden: meta?.hidden ?? false,
        path: path.map((p: number[]) => [p[0], p[1]] as [number, number]),
      })
    }
  }

  const elevationsFt = [...new Set(contours.map(c => c.elevationFt))].sort((a, b) => a - b)
  const truncated = payload?.exceededTransferLimit === true

  const caveats = [PG_CONTOUR_DATUM_CAVEAT, PG_CONTOUR_ACCURACY_CAVEAT]
  if (truncated) {
    caveats.push(
      `The service capped this response at ${features.length} features. The contour set is ` +
      'INCOMPLETE and must not be used to establish grade. Reduce the radius or page the query.')
  }
  if (contours.some(c => c.hidden)) {
    caveats.push('Hidden contours are present — obscured at lidar capture and the least reliable in the set.')
  }

  return {
    contours,
    elevationsFt,
    intervalFt: PG_CONTOUR_INTERVAL_FT,
    verticalDatum: PG_CONTOUR_VERTICAL_DATUM,
    truncated,
    caveats,
    source: {
      authority: "Prince George's County / M-NCPPC — PGAtlas",
      endpoint: url,
      retrievedAt,
      layer: 'Elevation/MapServer/1 — Contour - 2 Ft (2023)',
    },
  }
}

/** Relief across the returned contours, for a quick read on the terrain. */
export function contourRelief(r: PgContourResult): {
  minFt: number | null; maxFt: number | null; reliefFt: number | null
} {
  if (r.elevationsFt.length === 0) return { minFt: null, maxFt: null, reliefFt: null }
  const minFt = r.elevationsFt[0]
  const maxFt = r.elevationsFt[r.elevationsFt.length - 1]
  return { minFt, maxFt, reliefFt: maxFt - minFt }
}

/** Contours clipped to those intersecting the parcel's bounding box. */
export function contoursOnLot(r: PgContourResult, parcel: Ring): PgContour[] {
  const xs = parcel.coordinates.map(c => c[0])
  const ys = parcel.coordinates.map(c => c[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  return r.contours.filter(c =>
    c.path.some(([x, y]) => x >= minX && x <= maxX && y >= minY && y <= maxY))
}
