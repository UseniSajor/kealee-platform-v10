/**
 * Environmental site constraints from PG County GIS, with geometry.
 *
 * The existing `queryPgLayerAtPoint` answers "what applies here" and requests
 * `returnGeometry=false`, which is right for a zoning determination and useless
 * for a drawing. This fetches the shapes so streams, wetland buffers and
 * floodplain can appear on an existing-conditions sheet without a survey.
 *
 * ── What PG GIS actually publishes ─────────────────────────────────────────
 *
 * Enumerated across all 59 services on gisdata.pgplanning.org (M-NCPPC) on
 * 2026-08-22:
 *
 *   PRESENT    ESA wetlands, ESA streams, their primary buffers, DPIE
 *              floodplain, and a FEMA 2026 floodplain polygon layer.
 *
 *   ABSENT     Contours, elevation, LiDAR, DEM, terrain — none, under any
 *              name. Also no parcel or cadastral service.
 *
 * The county's own viewer would be the place to look for those, but
 * pgatlas.mypgc.us, gis.mypgc.us and gisdata.mypgc.us all have no DNS record.
 * So terrain for a PG site has to come from MD iMAP or a LiDAR tile, and parcel
 * geometry from statewide MD property data — neither is wired, and neither is
 * faked here.
 *
 * Everything returned is Level 1. County GIS is compiled, not surveyed, and a
 * buffer plotted from a GIS centreline is an indication of where the constraint
 * is, not a delineation of it.
 */

import type { SiteFeature, Ring, Position } from '../site-plan/site-twin'
import type { SourceRecord } from '../site-plan/reliability'
import { PG_CRS, PG_LINEAR_UNIT, PG_HORIZONTAL_DATUM } from './prince-georges-md'

const PG_GIS_ROOT = 'https://gisdata.pgplanning.org/arcgis/rest/services'

/** Verified layer ids. Each was confirmed present on 2026-08-22. */
export const PG_SITE_LAYERS = {
  esaWetlands: {
    service: 'Applications/Stream_and_Wetland_Buffer_Identifier', layerId: 0,
    title: 'ESA Wetlands', kind: 'EnvironmentalBuffer' as const,
    designation: 'ESA wetland',
  },
  esaStream: {
    service: 'Applications/Stream_and_Wetland_Buffer_Identifier', layerId: 2,
    title: 'ESA Stream', kind: 'EnvironmentalBuffer' as const,
    designation: 'ESA stream',
  },
  wetlandBuffer: {
    service: 'Applications/Stream_and_Wetland_Buffer_Identifier', layerId: 3,
    title: 'Primary Buffer — Wetlands', kind: 'EnvironmentalBuffer' as const,
    designation: 'Primary buffer, wetlands',
  },
  streamBufferEsa4: {
    service: 'Applications/Stream_and_Wetland_Buffer_Identifier', layerId: 4,
    title: 'Primary Buffer — Stream/River in ESA 4', kind: 'EnvironmentalBuffer' as const,
    designation: 'Primary buffer, stream/river in ESA 4',
  },
  streamBufferEsa123: {
    service: 'Applications/Stream_and_Wetland_Buffer_Identifier', layerId: 5,
    title: 'Primary Buffer — Stream/River in ESA 1-3', kind: 'EnvironmentalBuffer' as const,
    designation: 'Primary buffer, stream/river in ESA 1-3',
  },
  floodplainDpie: {
    service: 'Applications/ZoningCertificationLetter', layerId: 52,
    title: 'Floodplain (DPIE)', kind: 'Floodplain' as const,
    designation: 'County floodplain (DPIE)',
  },
  floodplainFema: {
    service: 'Applications/ZoningCertificationLetter', layerId: 70,
    title: 'Floodplain FEMA 2026', kind: 'Floodplain' as const,
    designation: 'FEMA floodplain (2026 layer)',
  },
} as const

export type PgSiteLayerKey = keyof typeof PG_SITE_LAYERS

/** Layers that are simply not published by any reachable PG GIS server. */
export const PG_UNAVAILABLE_SITE_DATA = [
  {
    what: 'Contours and elevation',
    detail:
      'No contour, elevation, LiDAR, DEM or terrain service exists on gisdata.pgplanning.org — all 59 ' +
      'services enumerated. The county viewer that might carry it (pgatlas.mypgc.us) has no DNS record. ' +
      'Terrain must come from MD iMAP or a LiDAR tile, processed through the PDAL path.',
  },
  {
    what: 'Parcel boundaries',
    detail:
      'No parcel or cadastral service on gisdata.pgplanning.org, and none in the 72-layer ' +
      'ZoningCertificationLetter service. Maryland parcel geometry is statewide MD iMAP property data.',
  },
] as const

// ── Fetch ───────────────────────────────────────────────────────────────────

interface ArcGisPolygonResponse {
  error?: { message?: string }
  features?: { attributes: Record<string, unknown>; geometry?: { rings?: number[][][]; paths?: number[][][] } }[]
  exceededTransferLimit?: boolean
}

export interface PgSiteDataOptions {
  /** Search box half-width in US survey feet around the point. */
  searchRadiusFeet?: number
  fetchImpl?: typeof fetch
  maxFeaturesPerLayer?: number
}

export interface PgSiteDataResult {
  features: SiteFeature[]
  source: SourceRecord
  /** Layers queried and what came back — including the empty ones. */
  layerResults: {
    layer: PgSiteLayerKey
    title: string
    /** Features the service returned. */
    count: number
    /** Geometry parts actually drawn — a multipart polygon yields many. */
    drawn: number
    /** Parts of a county-wide multipart feature that fall outside the site area. */
    discardedOutOfArea: number
    error: string | null
    truncated: boolean
  }[]
  /** Constraints found, in words, for the missing-information report. */
  findings: string[]
  /** What could not be obtained, so it is never mistaken for "not present". */
  unavailable: typeof PG_UNAVAILABLE_SITE_DATA
}

function envelope(e: number, n: number, r: number): string {
  return `${e - r},${n - r},${e + r},${n + r}`
}

/**
 * Keeps only the parts of a multipart geometry that are near the site.
 *
 * ArcGIS returns the WHOLE feature when any part of it intersects the query
 * envelope, and PG publishes county-wide multipart layers: one "ESA Wetlands"
 * record carries 4,283 parts and three "ESA Stream" records carry 10,668
 * between them. Without this, a query about one lot drags every wetland in the
 * county onto the sheet — unusable to draw and meaningless to read.
 *
 * A part is kept when its bounding box overlaps the search box. That is
 * deliberately generous: a cheap bbox test can keep a part that turns out not
 * to matter, which a reviewer will simply ignore, whereas a stricter test could
 * drop a stream that genuinely crosses the site.
 */
function partNearSite(part: number[][], e: number, n: number, r: number): boolean {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of part) {
    if (p[0] < minX) minX = p[0]
    if (p[0] > maxX) maxX = p[0]
    if (p[1] < minY) minY = p[1]
    if (p[1] > maxY) maxY = p[1]
  }
  return maxX >= e - r && minX <= e + r && maxY >= n - r && minY <= n + r
}

/**
 * Fetches environmental constraints around a point.
 *
 * A layer that errors or is truncated is reported rather than silently
 * contributing nothing: "no wetland found" and "the wetland query failed" lead
 * to very different decisions on a site.
 */
export async function fetchPgSiteConstraints(
  easting2248: number,
  northing2248: number,
  opts: PgSiteDataOptions = {},
): Promise<PgSiteDataResult> {
  const doFetch = opts.fetchImpl ?? fetch
  const radius = opts.searchRadiusFeet ?? 300
  const max = opts.maxFeaturesPerLayer ?? 50
  const retrievedAt = new Date().toISOString()

  const features: SiteFeature[] = []
  const layerResults: PgSiteDataResult['layerResults'] = []
  const findings: string[] = []
  let seq = 0

  for (const key of Object.keys(PG_SITE_LAYERS) as PgSiteLayerKey[]) {
    const layer = PG_SITE_LAYERS[key]
    const url =
      `${PG_GIS_ROOT}/${layer.service}/MapServer/${layer.layerId}/query?` +
      new URLSearchParams({
        where: '1=1',
        geometry: envelope(easting2248, northing2248, radius),
        geometryType: 'esriGeometryEnvelope',
        inSR: '2248',
        outSR: '2248',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: '*',
        returnGeometry: 'true',
        resultRecordCount: String(max),
        f: 'json',
      })

    try {
      const res = await doFetch(url)
      if (!res.ok) {
        layerResults.push({ layer: key, title: layer.title, count: 0, drawn: 0, discardedOutOfArea: 0, error: `HTTP ${res.status}`, truncated: false })
        continue
      }
      const j = (await res.json()) as ArcGisPolygonResponse
      // ArcGIS reports failures in the body with HTTP 200.
      if (j.error) {
        layerResults.push({ layer: key, title: layer.title, count: 0, drawn: 0, discardedOutOfArea: 0, error: j.error.message ?? 'service error', truncated: false })
        continue
      }

      const hits = j.features ?? []
      const before = features.length
      let discarded = 0
      for (const f of hits) {
        const rings = f.geometry?.rings
        const paths = f.geometry?.paths
        if (rings?.length) {
          for (const r of rings) {
            if (!partNearSite(r, easting2248, northing2248, radius)) { discarded++; continue }
            features.push({
              id: `pggis_${key}_${++seq}`,
              sourceId: 'pg-gis-site-data',
              reliabilityLevel: 1,
              crs: PG_CRS,
              revision: 1,
              kind: layer.kind,
              ring: { coordinates: r.map(p => [p[0], p[1]] as Position) } as Ring,
              designation: layer.designation,
              notes:
                `${layer.title} from M-NCPPC GIS. Compiled, not surveyed — this indicates where the ` +
                'constraint is, it does not delineate it. A field delineation governs.',
            } as SiteFeature)
          }
        } else if (paths?.length) {
          for (const path of paths) {
            if (!partNearSite(path, easting2248, northing2248, radius)) { discarded++; continue }
            features.push({
              id: `pggis_${key}_${++seq}`,
              sourceId: 'pg-gis-site-data',
              reliabilityLevel: 1,
              crs: PG_CRS,
              revision: 1,
              kind: layer.kind,
              line: path.map(p => [p[0], p[1]] as Position),
              designation: layer.designation,
              notes: `${layer.title} centreline from M-NCPPC GIS. Compiled, not surveyed.`,
            } as unknown as SiteFeature)
          }
        }
      }

      layerResults.push({
        layer: key, title: layer.title, count: hits.length,
        drawn: features.length - before, discardedOutOfArea: discarded, error: null,
        truncated: Boolean(j.exceededTransferLimit),
      })
      if (hits.length > 0) {
        findings.push(
          `${layer.title}: ${hits.length} feature(s) within ${radius} ft. ` +
          (layer.kind === 'Floodplain'
            ? 'A floodplain touching the site changes the permit path and may require an elevation certificate.'
            : 'A regulated buffer restricts where disturbance may occur; the width is set by ordinance, not by this layer.'),
        )
      }
    } catch (e) {
      layerResults.push({
        layer: key, title: layer.title, count: 0, drawn: 0, discardedOutOfArea: 0,
        error: e instanceof Error ? e.message : String(e), truncated: false,
      })
    }
  }

  const failed = layerResults.filter(l => l.error)
  if (failed.length) {
    findings.push(
      `${failed.length} layer(s) could not be queried (${failed.map(f => f.title).join('; ')}). ` +
      'Absence of a finding from these is not evidence the constraint is absent.',
    )
  }

  return {
    features,
    source: {
      sourceId: 'pg-gis-site-data',
      authority: "M-NCPPC Prince George's County Planning Department",
      dataset: 'Stream and Wetland Buffer Identifier; Zoning Certification Letter floodplain layers',
      url: PG_GIS_ROOT,
      retrievedAt,
      crs: PG_CRS,
      horizontalDatum: PG_HORIZONTAL_DATUM,
      // These layers carry no elevation. Null is meaningful here, not missing.
      verticalDatum: null,
      accuracyClass: 'mapping_grade',
      reliabilityLevel: 1,
      notes:
        `Linear unit ${PG_LINEAR_UNIT}. Environmental constraints only — this server publishes no ` +
        'contour, elevation or parcel data.',
    },
    layerResults,
    findings,
    unavailable: PG_UNAVAILABLE_SITE_DATA,
  }
}
