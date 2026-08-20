/**
 * Prince George's County, Maryland — zoning and site-constraint connector.
 *
 * Authority: Maryland-National Capital Park and Planning Commission (M-NCPPC),
 * Prince George's County Planning Department. Permits: DPIE.
 *
 * ─── The 2022 ordinance ───────────────────────────────────────────────────────
 * Prince George's County replaced its Zoning Ordinance effective 1 April 2022.
 * The county publishes BOTH ordinances as separate layers, and picking the wrong
 * one silently encodes a superseded legal standard:
 *
 *   layer 59  "Zoning (Full Description)"        → CURRENT (2022 ordinance)
 *   layer 65  "Zoning Prior (Full Description)"  → PRIOR (pre-2022)
 *
 * The older `Map_Services/C_I_Z` "Plan 2035 Zoning" service also still serves
 * pre-2022 classes (R-55, C-M, U-L-I). Do not use it for compliance.
 *
 * The prior layer is retained deliberately: nonconforming-use and vested-rights
 * analysis needs to know what the parcel was zoned before April 2022.
 *
 * ─── Coordinate reference system ──────────────────────────────────────────────
 * These services publish in EPSG:2248 (NAD83 / Maryland State Plane, US survey
 * feet) and do NOT honour `inSR=4326` — a WGS84 point silently returns zero
 * features rather than an error. Callers must supply coordinates already in
 * 2248. Reprojection must go through PROJ/proj4 or an authoritative geometry
 * service; never hand-roll a datum shift.
 *
 * Verified live 2026-08-20.
 */

/** ArcGIS server root for M-NCPPC PG County Planning. */
export const PG_GIS_ROOT =
  'https://gisdata.pgplanning.org/arcgis/rest/services'

/**
 * The seeded jurisdiction record points at `pgcgis.mypgc.us`, which no longer
 * resolves. Kept here so the stale value is greppable when the seed is fixed.
 */
export const PG_GIS_ROOT_DEPRECATED = 'https://pgcgis.mypgc.us'

/** EPSG:2248 — NAD83 / Maryland State Plane, US survey feet. */
export const PG_CRS = 'EPSG:2248'
export const PG_CRS_WKID = 2248
export const PG_LINEAR_UNIT = 'usSurveyFoot'
export const PG_HORIZONTAL_DATUM = 'NAD83'

/**
 * The 2022 ordinance took effect on this date. Any compliance finding must be
 * stamped with the ordinance version it was evaluated against.
 */
export const PG_ZONING_ORDINANCE_2022_EFFECTIVE = '2022-04-01'

export type PgOrdinanceVersion = 'current_2022' | 'prior_pre_2022'

interface PgLayer {
  service: string
  layerId: number
  title: string
}

export const PG_LAYERS = {
  zoningCurrent: {
    service: 'Applications/ZoningCertificationLetter',
    layerId: 59,
    title: 'Zoning (Full Description)',
  },
  zoningPrior: {
    service: 'Applications/ZoningCertificationLetter',
    layerId: 65,
    title: 'Zoning Prior (Full Description)',
  },
  addressPoint: {
    service: 'Applications/ZoningCertificationLetter',
    layerId: 0,
    title: 'Address Point',
  },
  chesapeakeBayCriticalArea: {
    service: 'Applications/ZoningCertificationLetter',
    layerId: 12,
    title: 'Chesapeake Bay Critical Area Overlay (2015)',
  },
  transitDistrictOverlay: {
    service: 'Applications/ZoningCertificationLetter',
    layerId: 14,
    title: 'Transit District Overlay',
  },
  zoningMapAmendment: {
    service: 'Applications/ZoningCertificationLetter',
    layerId: 26,
    title: 'Zoning Map Amendment',
  },
  esaWetlands: {
    service: 'Applications/Stream_and_Wetland_Buffer_Identifier',
    layerId: 0,
    title: 'ESA Wetlands',
  },
  esaStream: {
    service: 'Applications/Stream_and_Wetland_Buffer_Identifier',
    layerId: 2,
    title: 'ESA Stream',
  },
  primaryBufferWetlands: {
    service: 'Applications/Stream_and_Wetland_Buffer_Identifier',
    layerId: 3,
    title: 'Primary Buffer - Wetlands',
  },
  environmentalStrategyArea4: {
    service: 'Applications/Stream_and_Wetland_Buffer_Identifier',
    layerId: 6,
    title: 'Environmental Strategy Areas 4',
  },
  easements: {
    service: 'Applications/Easement_Viewer',
    layerId: 0,
    title: 'Easement Viewer',
  },
} as const satisfies Record<string, PgLayer>

export type PgLayerKey = keyof typeof PG_LAYERS

// ── Zone class registry (2022 ordinance) ────────────────────────────────────
//
// Enumerated from the live layer on 2026-08-20 (36 distinct CLASS values).
// This registry records WHICH zones exist and how the county groups them.
//
// It deliberately carries NO dimensional standards — setbacks, lot area, height,
// density, coverage. Those live in Subtitle 27 and are not published by this GIS
// service. Inventing them would violate the prohibition on fabricating
// regulatory values. `dimensionalStandardsVerified: false` below is the honest
// state until each zone's standards are transcribed from the ordinance text and
// signed off by a reviewer.

export type PgZoneCategory =
  | 'rural_agricultural_open_space'
  | 'residential'
  | 'commercial_industrial'
  | 'transit_activity_center'
  | 'mixed_use_comprehensive_design'
  | 'planned_development'

/** Maps the layer's numeric ZONE_TYPE to a readable category. */
export const PG_ZONE_TYPE_CATEGORY: Record<number, PgZoneCategory> = {
  1: 'rural_agricultural_open_space',
  2: 'residential',
  3: 'commercial_industrial',
  4: 'transit_activity_center',
  5: 'mixed_use_comprehensive_design',
  6: 'planned_development',
}

/**
 * Every base zone class in the 2022 ordinance, as published by M-NCPPC.
 *
 * Enumerated live 2026-08-20: the layer returns 36 distinct CLASS/ZONE_TYPE rows,
 * of which 32 carry a real class and 4 are null/empty (a data-quality artifact in
 * the county layer, spanning ZONE_TYPE 1, 3, 4 and 5). A null CLASS means the
 * polygon carries no zoning answer — treat it as unknown and route to review, not
 * as unzoned.
 *
 * `__tests__/pg-zone-registry.test.ts` asserts this list still matches the live
 * service, so a county amendment that adds or retires a zone fails a test rather
 * than silently mis-validating a project.
 */
export const PG_ZONE_CLASSES_2022: Record<PgZoneCategory, readonly string[]> = {
  rural_agricultural_open_space: ['AG', 'AR', 'ROS'],
  residential: ['RE', 'RR', 'RSF-A', 'RSF-65', 'RSF-95', 'RMF-12', 'RMF-20', 'RMF-48'],
  commercial_industrial: ['CGO', 'CN', 'CS', 'IE', 'IH'],
  transit_activity_center: [
    'NAC', 'TAC-C', 'TAC-E',
    'LTO-C', 'LTO-E',
    'RTO-L-C', 'RTO-L-E', 'RTO-H-C', 'RTO-H-E',
  ],
  mixed_use_comprehensive_design: ['LCD', 'LMUTC', 'LMXC', 'RMH'],
  planned_development: ['NAC-PD', 'R-PD', 'RTO-PD'],
}

export const PG_ALL_ZONE_CLASSES_2022: readonly string[] =
  Object.values(PG_ZONE_CLASSES_2022).flat()

export function isCurrentPgZoneClass(zoneClass: string): boolean {
  return PG_ALL_ZONE_CLASSES_2022.includes(zoneClass.toUpperCase().trim())
}

export function pgZoneCategory(zoneClass: string): PgZoneCategory | null {
  const target = zoneClass.toUpperCase().trim()
  for (const [category, classes] of Object.entries(PG_ZONE_CLASSES_2022)) {
    if (classes.includes(target)) return category as PgZoneCategory
  }
  return null
}

// ── Query ───────────────────────────────────────────────────────────────────

export interface PgFeatureHit {
  layer: PgLayerKey
  layerTitle: string
  attributes: Record<string, unknown>
}

export interface PgQueryProvenance {
  authority: string
  serviceUrl: string
  layerTitle: string
  crs: string
  linearUnit: string
  horizontalDatum: string
  /** Absent by design — this service publishes no elevation. */
  verticalDatum: null
  retrievedAt: string
  /** Which ordinance the zoning answer was evaluated against. */
  ordinanceVersion?: PgOrdinanceVersion
  ordinanceEffectiveDate?: string
  /** Level 1 per the reliability model: preliminary GIS, never a field survey. */
  reliabilityLevel: 1
  notForPermitOrConstruction: true
}

export interface PgPointQueryOptions {
  /**
   * Search radius in US survey feet. A geocoded address usually lands on the
   * street centerline, so a strict point-in-polygon test returns nothing.
   * Any hit found via a buffer is a candidate requiring confirmation, not an
   * answer.
   */
  searchRadiusFeet?: number
  fetchImpl?: typeof fetch
}

const DEFAULT_SEARCH_RADIUS_FEET = 150

function layerUrl(layer: PgLayer): string {
  return `${PG_GIS_ROOT}/${layer.service}/MapServer/${layer.layerId}`
}

/**
 * Query one PG County layer at a point expressed in EPSG:2248.
 *
 * Returns an exact-hit result when the point falls inside a polygon, otherwise
 * buffered candidates. The distinction is preserved so callers can require
 * confirmation rather than presenting a guess as fact.
 */
export async function queryPgLayerAtPoint(
  layerKey: PgLayerKey,
  easting2248: number,
  northing2248: number,
  options: PgPointQueryOptions = {},
): Promise<{ exact: boolean; hits: PgFeatureHit[]; provenance: PgQueryProvenance }> {
  const layer = PG_LAYERS[layerKey]
  const doFetch = options.fetchImpl ?? fetch

  const provenance: PgQueryProvenance = {
    authority: "M-NCPPC Prince George's County Planning Department",
    serviceUrl: layerUrl(layer),
    layerTitle: layer.title,
    crs: PG_CRS,
    linearUnit: PG_LINEAR_UNIT,
    horizontalDatum: PG_HORIZONTAL_DATUM,
    verticalDatum: null,
    retrievedAt: new Date().toISOString(),
    reliabilityLevel: 1,
    notForPermitOrConstruction: true,
  }
  if (layerKey === 'zoningCurrent') {
    provenance.ordinanceVersion = 'current_2022'
    provenance.ordinanceEffectiveDate = PG_ZONING_ORDINANCE_2022_EFFECTIVE
  } else if (layerKey === 'zoningPrior') {
    provenance.ordinanceVersion = 'prior_pre_2022'
  }

  async function run(params: URLSearchParams): Promise<PgFeatureHit[]> {
    const res = await doFetch(`${layerUrl(layer)}/query?${params.toString()}`, {
      headers: { accept: 'application/json' },
    })
    if (!res.ok) return []
    const payload = (await res.json()) as {
      features?: { attributes?: Record<string, unknown> }[]
      error?: unknown
    }
    if (payload.error || !Array.isArray(payload.features)) return []
    return payload.features.map(feature => ({
      layer: layerKey,
      layerTitle: layer.title,
      attributes: feature.attributes ?? {},
    }))
  }

  // `where=1=1` is required alongside the geometry filter — several ArcGIS
  // services return zero features for a geometry-only query.
  const common = {
    where: '1=1',
    geometryType: 'esriGeometryPoint',
    inSR: String(PG_CRS_WKID),
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'false',
    f: 'json',
  }

  const exactHits = await run(
    new URLSearchParams({ ...common, geometry: `${easting2248},${northing2248}` }),
  )
  if (exactHits.length > 0) return { exact: true, hits: exactHits, provenance }

  const radius = options.searchRadiusFeet ?? DEFAULT_SEARCH_RADIUS_FEET
  const buffered = await run(
    new URLSearchParams({
      ...common,
      geometry: `${easting2248},${northing2248}`,
      distance: String(radius),
      units: 'esriSRUnit_Foot',
    }),
  )
  return { exact: false, hits: buffered, provenance }
}

/** Standard disclosure required on any output derived from these layers. */
export const PG_LEVEL_1_DISCLOSURE =
  'PRELIMINARY—BASED ON GIS/LIDAR DATA—NOT FOR PERMIT OR CONSTRUCTION. ' +
  "Source: M-NCPPC Prince George's County GIS. This is not a boundary survey " +
  'and does not establish property lines, easements, or elevations.'
