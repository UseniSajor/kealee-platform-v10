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
 * Every base zone class in the 2022 ordinance, with the county's own long names.
 *
 * Enumerated 2026-08-20 from the layer's SUBTYPE CODED-VALUE DOMAINS, which is the
 * authoritative legal list. An earlier version of this file was built from
 * `returnDistinctValues`, which returns only zones that are currently mapped
 * somewhere in the county — that silently omitted TAC-PD, LTO-PD, MU-PD and IE-PD,
 * four Planned Development zones that exist in the ordinance but are not yet
 * applied to any parcel. Never enumerate a legal code list from observed data.
 *
 * `ZONE_TYPE` is the subtype field; the Residential domain sits at field level
 * while the other five sit on their subtypes.
 *
 * These are BASE zones only. Overlay zones (Chesapeake Bay Critical Area,
 * Transit District Overlay, Neighborhood Conservation Overlay, Development
 * District Overlay, Military Installation) are separate layers and stack on top
 * of a base zone — see PG_LAYERS.
 */
export interface PgZone {
  code: string
  /** The county's own description from the layer domain. */
  name: string
  category: PgZoneCategory
}

export const PG_ZONES_2022: readonly PgZone[] = [
  // ZONE_TYPE 1 — Rural and Agricultural
  { code: 'AG',      name: 'Agriculture and Preservation',                       category: 'rural_agricultural_open_space' },
  { code: 'AR',      name: 'Agricultural-Residential',                           category: 'rural_agricultural_open_space' },
  { code: 'ROS',     name: 'Reserved Open Space',                                category: 'rural_agricultural_open_space' },

  // ZONE_TYPE 2 — Residential
  { code: 'RE',      name: 'Residential Estate',                                 category: 'residential' },
  { code: 'RR',      name: 'Residential, Rural',                                 category: 'residential' },
  { code: 'RSF-A',   name: 'Residential, Single-Family - Attached',              category: 'residential' },
  { code: 'RSF-65',  name: 'Residential, Single-Family - 65',                    category: 'residential' },
  { code: 'RSF-95',  name: 'Residential, Single-Family - 95',                    category: 'residential' },
  { code: 'RMF-12',  name: 'Residential, Multifamily-12',                        category: 'residential' },
  { code: 'RMF-20',  name: 'Residential, Multifamily-20',                        category: 'residential' },
  { code: 'RMF-48',  name: 'Residential, Multifamily-48',                        category: 'residential' },

  // ZONE_TYPE 3 — Nonresidential
  { code: 'CN',      name: 'Commercial, Neighborhood',                           category: 'commercial_industrial' },
  { code: 'CS',      name: 'Commercial, Service',                                category: 'commercial_industrial' },
  { code: 'CGO',     name: 'Commercial, General and Office',                     category: 'commercial_industrial' },
  { code: 'IE',      name: 'Industrial, Employment',                             category: 'commercial_industrial' },
  { code: 'IH',      name: 'Industrial, Heavy',                                  category: 'commercial_industrial' },

  // ZONE_TYPE 4 — Transit-Oriented / Activity Center
  { code: 'NAC',     name: 'Neighborhood Activity Center',                       category: 'transit_activity_center' },
  { code: 'TAC-C',   name: 'Town Activity Center - Core',                        category: 'transit_activity_center' },
  { code: 'TAC-E',   name: 'Town Activity Center - Edge',                        category: 'transit_activity_center' },
  { code: 'LTO-C',   name: 'Local Transit-Oriented - Core',                      category: 'transit_activity_center' },
  { code: 'LTO-E',   name: 'Local Transit-Oriented - Edge',                      category: 'transit_activity_center' },
  { code: 'RTO-L-C', name: 'Regional Transit-Oriented, Low-Intensity - Core',    category: 'transit_activity_center' },
  { code: 'RTO-L-E', name: 'Regional Transit-Oriented, Low-Intensity - Edge',    category: 'transit_activity_center' },
  { code: 'RTO-H-C', name: 'Regional Transit-Oriented, High-Intensity - Core',   category: 'transit_activity_center' },
  { code: 'RTO-H-E', name: 'Regional Transit-Oriented, High-Intensity - Edge',   category: 'transit_activity_center' },

  // ZONE_TYPE 5 — Other (legacy comprehensive-design zones carried forward)
  { code: 'RMH',     name: 'Planned Mobile Home Community',                      category: 'mixed_use_comprehensive_design' },
  { code: 'LCD',     name: 'Legacy Comprehensive Design',                        category: 'mixed_use_comprehensive_design' },
  { code: 'LMXC',    name: 'Legacy Mixed-Use Community',                         category: 'mixed_use_comprehensive_design' },
  { code: 'LMUTC',   name: 'Legacy Mixed-Use Town Center',                       category: 'mixed_use_comprehensive_design' },

  // ZONE_TYPE 6 — Planned Development
  { code: 'R-PD',    name: 'Residential Planned Development',                    category: 'planned_development' },
  { code: 'NAC-PD',  name: 'Neighborhood Activity Center Planned Development',   category: 'planned_development' },
  { code: 'TAC-PD',  name: 'Town Activity Center Planned Development',           category: 'planned_development' },
  { code: 'LTO-PD',  name: 'Local Transit-Oriented Planned Development',         category: 'planned_development' },
  { code: 'RTO-PD',  name: 'Regional Transit-Oriented Planned Development',      category: 'planned_development' },
  { code: 'MU-PD',   name: 'Mixed-Use Planned Development',                      category: 'planned_development' },
  { code: 'IE-PD',   name: 'Industrial, Employment Planned Development',         category: 'planned_development' },
]

/**
 * The layer also carries a literal "Not Assigned" coded value meaning
 * "Please Contact M-NCPPC". It is NOT a zone — it means the county has no zoning
 * answer for that polygon. Treat it as unknown and route to review; never read it
 * as unzoned or as permission to proceed.
 */
export const PG_ZONE_NOT_ASSIGNED = 'Not Assigned'

export const PG_ALL_ZONE_CLASSES_2022: readonly string[] = PG_ZONES_2022.map(z => z.code)

export const PG_ZONE_CLASSES_2022: Record<PgZoneCategory, readonly string[]> = {
  rural_agricultural_open_space: PG_ZONES_2022.filter(z => z.category === 'rural_agricultural_open_space').map(z => z.code),
  residential:                   PG_ZONES_2022.filter(z => z.category === 'residential').map(z => z.code),
  commercial_industrial:         PG_ZONES_2022.filter(z => z.category === 'commercial_industrial').map(z => z.code),
  transit_activity_center:       PG_ZONES_2022.filter(z => z.category === 'transit_activity_center').map(z => z.code),
  mixed_use_comprehensive_design: PG_ZONES_2022.filter(z => z.category === 'mixed_use_comprehensive_design').map(z => z.code),
  planned_development:           PG_ZONES_2022.filter(z => z.category === 'planned_development').map(z => z.code),
}

function normalizeZone(zoneClass: string): string {
  return zoneClass.toUpperCase().trim()
}

export function isCurrentPgZoneClass(zoneClass: string): boolean {
  return PG_ALL_ZONE_CLASSES_2022.includes(normalizeZone(zoneClass))
}

/** True when the county explicitly has no zoning answer for the polygon. */
export function isPgZoneNotAssigned(zoneClass: string | null | undefined): boolean {
  if (zoneClass == null) return true
  const v = zoneClass.trim()
  return v === '' || v.toLowerCase() === PG_ZONE_NOT_ASSIGNED.toLowerCase()
}

export function pgZone(zoneClass: string): PgZone | null {
  const target = normalizeZone(zoneClass)
  return PG_ZONES_2022.find(z => z.code === target) ?? null
}

export function pgZoneCategory(zoneClass: string): PgZoneCategory | null {
  return pgZone(zoneClass)?.category ?? null
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
