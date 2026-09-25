/**
 * Montgomery County MD, Fairfax County VA and Arlington County VA — each read
 * from its own GIS, the way PGAtlas and DC are read.
 *
 * Every layer below was probed live on 2026-09-25 against a real address and
 * answered with real features. The blockers recorded in `dmv-endpoints.ts`
 * that morning, and what closed each:
 *
 *   MONTGOMERY  "no parcel layer"    → M-NCPPC Montgomery Planning publishes
 *                                      its parcel fabric (with SDAT account,
 *                                      lot, block, deed liber/folio) on
 *                                      montgomeryplans.org, natively in 2248.
 *                                      MD iMAP's statewide fabric is the
 *                                      fallback.
 *               "no geocoder"        → tools/MARPLOI on mcatlas.org is a
 *                                      point-address locator. It takes the
 *                                      field `Street`, not `SingleLine`, and
 *                                      answers HTTP 400 to SingleLine.
 *               contour datum        → NAVD88 (GEOID12B) feet, stated in the
 *                                      M-NCPPC item for Contours_2ft — the
 *                                      same lidar project as Prince George's.
 *   FAIRFAX     "no contours"        → the county publishes contours only as
 *                                      vector tiles (and one set is NGVD29);
 *                                      terrain comes from USGS 3DEP lidar,
 *                                      with the datum read from the tile.
 *               "MapServer, not a scored locator" → the county HAS a scored
 *                                      locator: mercator/Locators/
 *                                      FairfaxCountyAddresses.
 *   ARLINGTON   "zoning only"        → Arlington publishes its property
 *                                      polygons, streets, RPAs and historic
 *                                      districts as open data; addresses
 *                                      resolve on Virginia's statewide VGIN
 *                                      locator, which lands on Arlington's own
 *                                      address points. Its 2011 contour layer
 *                                      is titled "Test Contours" with no
 *                                      stated datum and is not used — 3DEP.
 */

import type { Position } from '../site-plan/site-twin'
import { type ArcGisJurisdictionConfig, queryAtPoint, queryAround, queryIntersecting } from './arcgis-jurisdiction'

const MCATLAS = 'https://mcatlas.org/arcgis5/rest/services'
const MCPLANS = 'https://montgomeryplans.org/server/rest/services'
const MD_IMAP = 'https://mdgeodata.md.gov/imap/rest/services'
const FFX_EUCLID = 'https://www.fairfaxcounty.gov/euclid/rest/services'
const FFX_MERCATOR = 'https://www.fairfaxcounty.gov/mercator/rest/services'
const FFX_OPEN = 'https://services1.arcgis.com/ioennV6PpG5Xodq0/arcgis/rest/services'
const ARL = 'https://arlgis.arlingtonva.us/arcgis/rest/services/Open_Data'
const VGIN = 'https://vginmaps.vdem.virginia.gov/arcgis/rest/services/Geocoding/VGIN_Composite_Locator/GeocodeServer'

export const MONTGOMERY_GIS: ArcGisJurisdictionConfig = {
  code: 'montgomery_md',
  name: 'Montgomery County',
  state: 'MD',
  locators: [{ name: 'Montgomery County MARPLOI address locator', url: `${MCATLAS}/tools/MARPLOI/GeocodeServer`, param: 'Street' }],
  parcels: [
    {
      url: `${MCPLANS}/Backgrounds/Parcels_by_Land_Use/MapServer/0`, kind: 'parcel',
      authority: 'M-NCPPC Montgomery Planning — parcels (SDAT)',
      idFields: ['ACCT'], areaField: 'SDAT_AREA',
      platReference: a => (a.LOT && a.BLOCK)
        ? `Lot ${String(a.LOT).trim()}, Block ${String(a.BLOCK).trim()}, subdivision ${String(a.SUBDIVISION ?? '').trim()}`
        : null,
    },
    {
      url: `${MD_IMAP}/PlanningCadastre/MD_ParcelBoundaries/MapServer/0`, kind: 'parcel',
      authority: 'Maryland Department of Planning — MD iMAP parcel boundaries',
      idFields: ['ACCTID'], areaField: 'LANDAREA',
      platReference: a => a.PLAT ? `Plat ${a.PLAT}${a.BLOCK ? `, Block ${a.BLOCK}` : ''}${a.LOT ? `, Lot ${a.LOT}` : ''}` : null,
    },
  ],
  zoning: {
    url: `${MCATLAS}/backgrounds/Zoning_background/MapServer/26`, codeFields: ['ZONE_', 'LONGZONE', 'CODE'],
    descriptionField: 'RESIDENTIAL_FLAG', authority: 'Montgomery County / M-NCPPC — Zoning',
  },
  streets: {
    urls: [0, 1, 2, 3].map(i => `${MD_IMAP}/Transportation/MD_RoadCenterlines/MapServer/${i}`),
    nameFields: ['ROADNAMESHA'], authority: 'MDOT SHA — road centerlines',
  },
  contours: {
    url: `${MCATLAS}/backgrounds/Contours_2ft/MapServer/1`,
    elevationField: 'ELEVATION', intervalFt: 2, indexEvery: 5,
    verticalDatum: 'NAVD88 (feet)',
    authority: 'M-NCPPC Montgomery Planning',
    layerLabel: 'backgrounds/Contours_2ft/MapServer/1 — Contours (2-ft, 2023)',
    caveats: [
      'Contours are NAVD88 (GEOID12B) feet, per M-NCPPC\'s published description of the lidar ' +
      'project that produced them.',
      'Lidar-derived contours establish existing grade for design and review. They are not a ' +
      'field-run topographic survey; spot and finished-floor elevations still require one.',
    ],
  },
}

export const FAIRFAX_GIS: ArcGisJurisdictionConfig = {
  code: 'fairfax_va',
  name: 'Fairfax County',
  state: 'VA',
  locators: [{
    name: 'Fairfax County address locator', url: `${FFX_MERCATOR}/Locators/FairfaxCountyAddresses/GeocodeServer`,
    acceptCandidate: c => String(c.attributes.Addr_type ?? 'PointAddress') === 'PointAddress',
  }],
  parcels: [{
    url: `${FFX_EUCLID}/GIS/Property/MapServer/1`, kind: 'parcel',
    authority: 'Fairfax County — parcels', idFields: ['PIN'],
  }],
  zoning: {
    url: `${FFX_EUCLID}/GIS/Zoning/MapServer/0`, codeFields: ['ZONECODE'],
    descriptionField: 'ZONETYPE', authority: 'Fairfax County — zoning districts',
  },
  streets: { urls: [`${FFX_OPEN}/OpenData_A1/FeatureServer/0`], nameFields: ['FULLNAME'], authority: 'Fairfax County — roadway centerlines' },
  contours: '3dep',
}

export const ARLINGTON_GIS: ArcGisJurisdictionConfig = {
  code: 'arlington_va',
  name: 'Arlington County',
  state: 'VA',
  locators: [{
    name: 'VGIN statewide locator (Arlington address points)', url: VGIN,
    acceptCandidate: c =>
      String(c.attributes.Addr_type ?? '') === 'PointAddress' &&
      /arlington/i.test(String(c.attributes.Subregion ?? '')),
  }],
  parcels: [{
    url: `${ARL}/od_REA_Property_Polygons/MapServer/0`, kind: 'parcel',
    authority: 'Arlington County — real estate property polygons', idFields: ['RPCMSTR'],
  }],
  zoning: {
    url: `${ARL}/od_Zoning_Polygons/MapServer/0`, codeFields: ['ZN_DESIG'],
    descriptionField: 'LABEL', authority: 'Arlington County — zoning',
  },
  streets: { urls: [`${ARL}/od_Street_Network/MapServer/0`], nameFields: ['STNAME'], authority: 'Arlington County — street network' },
  contours: '3dep',
}

// ── Findings beyond the lot, zone and terrain ───────────────────────────────

/** Detached houses near a Montgomery lot — the population §4.4.1.A averages over. */
export async function montgomeryDetachedHousesAround(
  e: number, n: number, radiusFt: number, opts: { fetchImpl?: typeof fetch } = {},
): Promise<Position[][]> {
  const { features } = await queryAround(
    `${MCPLANS}/Overlays/Buildings/MapServer/0`, e, n, radiusFt, opts.fetchImpl ?? fetch,
    { where: "LANDUSE = 'Single Family Detached'", outFields: 'OBJECTID' })
  return features.flatMap((f: any) =>
    (f.geometry?.rings ?? []).slice(0, 1).map((r: number[][]) => r.map(p => [p[0], p[1]] as Position)))
}

/** The recorded plat covering a Montgomery lot, with the State Archives link to its image. */
export async function montgomeryRecordPlat(
  e: number, n: number, opts: { fetchImpl?: typeof fetch } = {},
): Promise<{ plat: string; link: string | null; recorded: string | null } | null> {
  const fs = await queryAtPoint(`${MCPLANS}/Overlays/MC_RecordPlat_Index/MapServer/0`, e, n, opts.fetchImpl ?? fetch, { geometry: false })
  const a = fs[0]?.attributes
  if (!a) return null
  return {
    plat: `Montgomery County Plat No. ${a.CLERK_NUMBER}${a.MNCPPC_NUMBER ? ` (M-NCPPC ${a.MNCPPC_NUMBER})` : ''}`,
    link: a.PLAT_LINK ? String(a.PLAT_LINK) : null,
    recorded: Number.isFinite(Number(a.RECORDED_DATE)) && a.RECORDED_DATE != null
      ? new Date(Number(a.RECORDED_DATE)).toISOString().slice(0, 10) : null,
  }
}

export interface EnvironmentalFinding { layer: string; value: string; authority: string }

/**
 * Chesapeake Bay Preservation Area (Fairfax) or Resource Protection Area and
 * historic district (Arlington) touching the LOT. Null on an outage, which is
 * never reported as "none".
 */
export async function virginiaConstraintsOn(
  code: string, lot: Position[], opts: { fetchImpl?: typeof fetch } = {},
): Promise<EnvironmentalFinding[] | null> {
  const doFetch = opts.fetchImpl ?? fetch
  try {
    if (code === 'fairfax_va') {
      const fs = await queryIntersecting(`${FFX_OPEN}/OpenData_S2/FeatureServer/2`, lot, doFetch)
      return fs.map((f: any) => ({
        layer: 'Chesapeake Bay Preservation Area', value: String(f.attributes?.TYPE ?? 'CBPA'),
        authority: 'Fairfax County',
      }))
    }
    if (code === 'arlington_va') {
      const [rpa, hd] = await Promise.all([
        queryIntersecting(`${ARL}/od_Resource_Protection_Area_Polygons/MapServer/0`, lot, doFetch),
        queryIntersecting(`${ARL}/od_Zoning_Historic_District_Polygons/MapServer/0`, lot, doFetch),
      ])
      return [
        ...rpa.map(() => ({ layer: 'Resource Protection Area', value: 'the lot intersects a mapped RPA', authority: 'Arlington County' })),
        ...hd.map((f: any) => ({ layer: 'Local historic district', value: String(f.attributes?.HDNAME ?? 'historic district'), authority: 'Arlington County' })),
      ]
    }
    return []
  } catch {
    return null
  }
}
