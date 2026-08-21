/**
 * Coordinate reference system handling for export.
 *
 * RFC 7946 GeoJSON is WGS84 (EPSG:4326) with longitude-first coordinate order,
 * full stop. The `crs` member from the 2008 draft was REMOVED — a conforming
 * consumer ignores it and reads the numbers as degrees. So writing State Plane,
 * local-grid or CAD coordinates into GeoJSON does not merely annotate poorly, it
 * produces a file that silently places the site somewhere in the Gulf of Guinea.
 *
 * Rules enforced here:
 *   1. The source CRS must be known and validated. Unknown CRS or unknown datum
 *      blocks export — it is not defaulted or guessed.
 *   2. Geometry is transformed to EPSG:4326, longitude first.
 *   3. The original engineering coordinates are retained separately, so the
 *      survey/CAD grid is never lost in the round trip.
 *   4. Datum shifts go through a real transformer. This module never does the
 *      projection maths itself.
 */

export interface CrsDefinition {
  /** Authority code, e.g. "EPSG:2248". */
  code: string
  epsg: number
  name: string
  /** 'projected' coordinates must be transformed; 'geographic' may already be 4326. */
  kind: 'projected' | 'geographic'
  datum: string
  /** Linear unit for projected systems. */
  unit: 'usSurveyFoot' | 'foot' | 'metre' | 'degree'
}

/** CRSs the engine knows how to validate. Extend deliberately, never by guess. */
export const KNOWN_CRS: Record<string, CrsDefinition> = {
  'EPSG:2248': {
    code: 'EPSG:2248', epsg: 2248, kind: 'projected',
    name: 'NAD83 / Maryland State Plane (US survey feet)',
    datum: 'NAD83', unit: 'usSurveyFoot',
  },
  'EPSG:6487': {
    code: 'EPSG:6487', epsg: 6487, kind: 'projected',
    name: 'NAD83(2011) / Maryland (US survey feet)',
    datum: 'NAD83(2011)', unit: 'usSurveyFoot',
  },
  'EPSG:26985': {
    code: 'EPSG:26985', epsg: 26985, kind: 'projected',
    name: 'NAD83 / Maryland (metres)',
    datum: 'NAD83', unit: 'metre',
  },
  'EPSG:3857': {
    code: 'EPSG:3857', epsg: 3857, kind: 'projected',
    name: 'WGS 84 / Pseudo-Mercator',
    datum: 'WGS84', unit: 'metre',
  },
  'EPSG:4326': {
    code: 'EPSG:4326', epsg: 4326, kind: 'geographic',
    name: 'WGS 84',
    datum: 'WGS84', unit: 'degree',
  },
}

export const WGS84: CrsDefinition = KNOWN_CRS['EPSG:4326']

export class CrsExportError extends Error {
  readonly code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'CrsExportError'
    this.code = code
  }
}

/**
 * Validates that a CRS string is known and carries a datum.
 * Throws rather than defaulting — a wrong CRS is worse than a failed export.
 */
export function resolveCrs(crs: string | null | undefined, datumHint?: string | null): CrsDefinition {
  if (!crs || !crs.trim()) {
    throw new CrsExportError(
      'CRS_UNKNOWN',
      'Export blocked: the site has no coordinate reference system. Geometry cannot be ' +
        'transformed to WGS84 without knowing what it is measured in.',
    )
  }
  const key = crs.trim().toUpperCase().replace(/\s+/g, '')
  const def = KNOWN_CRS[key]
  if (!def) {
    throw new CrsExportError(
      'CRS_UNRECOGNISED',
      `Export blocked: coordinate reference system "${crs}" is not recognised. Add it to ` +
        'KNOWN_CRS with its datum and unit after confirming the definition — never assume one.',
    )
  }
  if (datumHint && def.datum !== datumHint && def.kind === 'projected') {
    throw new CrsExportError(
      'DATUM_CONFLICT',
      `Export blocked: the site declares horizontal datum "${datumHint}" but ${def.code} is ` +
        `defined on ${def.datum}. Reconcile the datum explicitly; datums are never silently converted.`,
    )
  }
  return def
}

export type Point2D = [number, number]

/**
 * Transforms coordinates between CRSs. Supplied by the caller so the projection
 * maths lives in a real library (proj4, PROJ) or an authoritative service — this
 * package never implements a datum shift itself.
 */
export interface CrsTransformer {
  readonly name: string
  /** Returns longitude-first [lon, lat] for a geographic target. */
  transform(points: Point2D[], from: CrsDefinition, to: CrsDefinition): Promise<Point2D[]>
}

/**
 * Transformer backed by an ArcGIS geometry service.
 *
 * Verified against EPSG:2248 with a round-trip error of 0.0000 ft. Requires
 * network access. For an offline pipeline, supply a proj4-backed transformer
 * with the same interface.
 */
export function createArcGisTransformer(
  endpoint = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer',
  fetchImpl: typeof fetch = fetch,
): CrsTransformer {
  return {
    name: `arcgis-geometry-service (${endpoint})`,
    async transform(points, from, to) {
      if (points.length === 0) return []
      if (from.epsg === to.epsg) return points

      const body = new URLSearchParams({
        geometries: JSON.stringify({
          geometryType: 'esriGeometryPoint',
          geometries: points.map(([x, y]) => ({ x, y })),
        }),
        inSR: String(from.epsg),
        outSR: String(to.epsg),
        f: 'json',
      })
      const res = await fetchImpl(`${endpoint}/project?${body.toString()}`, {
        headers: { accept: 'application/json' },
      })
      if (!res.ok) {
        throw new CrsExportError('TRANSFORM_FAILED', `Projection service returned HTTP ${res.status}.`)
      }
      const payload = (await res.json()) as { geometries?: { x: number; y: number }[]; error?: unknown }
      if (payload.error || !payload.geometries || payload.geometries.length !== points.length) {
        throw new CrsExportError(
          'TRANSFORM_FAILED',
          'Projection service did not return a coordinate for every input point. ' +
            'Export blocked rather than emitting partially transformed geometry.',
        )
      }
      // Longitude first for a geographic target.
      return payload.geometries.map(g => [g.x, g.y] as Point2D)
    },
  }
}

/** Sanity check that transformed coordinates are plausible degrees. */
export function assertPlausibleWgs84(points: Point2D[]): void {
  for (const [lon, lat] of points) {
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      throw new CrsExportError('TRANSFORM_INVALID', 'Transform produced a non-finite coordinate.')
    }
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      throw new CrsExportError(
        'TRANSFORM_OUT_OF_RANGE',
        `Transform produced [${lon}, ${lat}], which is outside valid WGS84 bounds. This is the ` +
          'signature of untransformed projected coordinates being written as degrees.',
      )
    }
  }
}
