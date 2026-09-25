/**
 * Verified GIS endpoints for the DMV jurisdictions beyond Prince George's.
 *
 * WHAT THIS IS AND IS NOT
 *
 * This is the DATA LAYER: where each jurisdiction publishes its parcels,
 * zoning, contours and addresses. Every endpoint below was probed live on
 * 2026-09-25 and answered with real layer metadata — not assumed from a
 * documentation page.
 *
 * It is NOT a rule pack. Prince George's is served because it has BOTH:
 *
 *   1. these endpoints, and
 *   2. `pg-dimensional-standards.generated.ts` — 79 KB machine-extracted from
 *      the adopted Zoning Ordinance, giving the setback, coverage and height
 *      standards PER ZONE AND PER USE TYPE, with footnote markers deliberately
 *      retained because "45 (4)" is not the number 45.
 *
 * Nobody has extracted (2) for DC, Montgomery or Fairfax. Until someone does,
 * these jurisdictions can be DESCRIBED — parcel located, zone code read,
 * terrain fetched — and their setbacks CANNOT BE COMPUTED. A buildable
 * envelope drawn from a guessed setback renders exactly like a correct one and
 * nothing downstream can tell them apart, which is the single worst failure
 * this engine can produce.
 *
 * So `coverage.ts` lists them as `data_only`. Promoting one to `full` requires
 * its dimensional table, extracted from the adopted ordinance and checked by a
 * person. That is a real piece of work per jurisdiction, not a config change.
 *
 * THE PG ASSUMPTION DOES NOT TRANSFER. "PG is similar to the rest of the DMV"
 * is true of the PROCESS — county GIS, a zoning ordinance, a plat, setbacks —
 * and false of the NUMBERS. DC has no counties and uses a wholly different
 * zone taxonomy (RA, RF, MU) under the 2016 Zoning Regulations. Montgomery
 * rewrote its ordinance in 2014. Fairfax adopted zMOD in 2021 and had it
 * voided and reinstated. Their zone codes do not correspond to PG's and their
 * yard depths differ.
 */

import { drawsPlansIn } from './coverage'

export interface JurisdictionGisEndpoints {
  code: string
  name: string
  state: 'DC' | 'MD' | 'VA'
  /** Who publishes the zoning. */
  authority: string
  /** Layer carrying zone codes. Verified live. */
  zoning: string
  /** Layer carrying the parcel fabric. Null where none was found. */
  parcels: string | null
  /** Contour layer, with its interval. Null where the jurisdiction publishes none. */
  contours: { url: string; intervalFt: number; note: string } | null
  /** Spot elevations, where published separately. */
  spotElevations: string | null
  /** Address locator or address layer. */
  addresses: string | null
  /** True when the server presents a certificate that fails strict validation. */
  tlsQuirk?: boolean
  /** Probed and answering as of this date. */
  verifiedOn: string
  /** What is still missing before this jurisdiction can be SOLD. */
  blockers: string[]
}

const DCGIS = 'https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA'
const MCATLAS = 'https://mcatlas.org/arcgis5/rest/services'
const FAIRFAX = 'https://www.fairfaxcounty.gov/euclid/rest/services'
const ARLGIS = 'https://arlgis.arlingtonva.us/arcgis/rest/services'

export const DMV_GIS_ENDPOINTS: JurisdictionGisEndpoints[] = [
  {
    code: 'district_of_columbia',
    name: 'District of Columbia',
    state: 'DC',
    authority: 'DC Office of Zoning / OCTO',
    zoning: `${DCGIS}/Planning_Landuse_and_Zoning_WebMercator/MapServer/3`,
    parcels: `${DCGIS}/Property_and_Land_WebMercator/MapServer/33`,
    contours: {
      url: `${DCGIS}/Elevation_WebMercator/MapServer/3`,
      intervalFt: 2,
      note: 'Topography - 2 Foot Contours. Same interval PG publishes, so the ' +
            'sheet conventions carry over. Datum NOT yet confirmed — do not ' +
            'assume NAVD88 because PG is NAVD88.',
    },
    spotElevations: `${DCGIS}/Elevation_WebMercator/MapServer/1`,
    addresses: 'https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_APPS/DCGIS_MAR/GeocodeServer',
    verifiedOn: '2026-09-25',
    // Resolved 2026-09-25: the MAR GeocodeServer is in DCGIS_APPS, not
    // DCGIS_DATA; the contour datum is NAVD88 feet per the District's own
    // metadata; the standards are extracted (dc-zoning.ts). Connector: dc-gis.ts.
    blockers: [],
  },
  {
    code: 'montgomery_md',
    name: 'Montgomery County',
    state: 'MD',
    authority: 'Montgomery County DPS / M-NCPPC',
    zoning: `${MCATLAS}/backgrounds/Zoning_background/MapServer/26`,
    parcels: null,
    contours: {
      url: `${MCATLAS}/backgrounds/Contours_2ft/MapServer/0`,
      intervalFt: 2,
      note: 'Contours (2-ft, 2023). A 2020 vintage also exists at ' +
            'backgrounds/contours_2ft_2020. Layer 0 is the 1:4,800-and-coarser ' +
            'scale band and layer 1 the finer one — pick by scale, not by habit.',
    },
    spotElevations: null,
    addresses: `${MCATLAS}/backgrounds/Address_Labels/MapServer`,
    // mcatlas.org has presented a certificate name mismatch; the existing
    // gis-client already carries a bypass flag for it.
    tlsQuirk: true,
    verifiedOn: '2026-09-25',
    blockers: [
      'No dimensional standards extracted. Montgomery rewrote its zoning ' +
      'ordinance in 2014; its zone codes and yard depths are its own.',
      'NO PARCEL LAYER FOUND in the backgrounds folder. Without a parcel ' +
      'boundary the engine cannot draw a lot, which makes this jurisdiction ' +
      'unusable for site plans until one is located.',
      'Address_Labels is a label layer, not a geocoder. Address resolution is ' +
      'unsolved here.',
    ],
  },
  {
    code: 'fairfax_va',
    name: 'Fairfax County',
    state: 'VA',
    authority: 'Fairfax County Department of Planning and Development',
    zoning: `${FAIRFAX}/GIS/Zoning/MapServer/0`,
    parcels: `${FAIRFAX}/GIS/Property/MapServer/1`,
    contours: null,
    spotElevations: null,
    addresses: `${FAIRFAX}/GIS/MasterAddressRepository/MapServer/0`,
    verifiedOn: '2026-09-25',
    blockers: [
      'No dimensional standards extracted. Fairfax adopted zMOD in 2021, had ' +
      'it voided by the courts in 2023 and readopted it — which version governs ' +
      'a given application is a question a person must answer.',
      'NO CONTOUR LAYER FOUND. Without terrain the engine cannot show existing ' +
      'grade, and the disturbance and grading sheets have no basis.',
      'MasterAddressRepository is a MapServer layer, not a GeocodeServer. It ' +
      'can be queried by attribute but does not score candidate matches the way ' +
      "PG's locator does, so the minimum-score rule has no equivalent yet.",
    ],
  },
  {
    code: 'arlington_va',
    name: 'Arlington County',
    state: 'VA',
    authority: 'Arlington County Zoning',
    zoning: `${ARLGIS}/Public_Maps/Zoning_Map/MapServer/0`,
    parcels: null,
    contours: null,
    spotElevations: null,
    addresses: null,
    verifiedOn: '2026-09-25',
    blockers: [
      'Only the zoning layer is verified. No parcel, contour or address service ' +
      'has been located.',
      'No dimensional standards extracted.',
    ],
  },
]

export function dmvEndpointsFor(code: string): JurisdictionGisEndpoints | null {
  return DMV_GIS_ENDPOINTS.find(j => j.code === code) ?? null
}

/**
 * What a jurisdiction can honestly produce today.
 *
 * Deliberately conservative: a jurisdiction without a parcel layer cannot draw
 * a lot, and one without dimensional standards cannot place a setback. Both
 * are hard stops, not degraded modes, because the degraded output is
 * indistinguishable from the real thing.
 */
export function capabilityOf(j: JurisdictionGisEndpoints): {
  canLocateParcel: boolean
  canReadZoneCode: boolean
  canShowTerrain: boolean
  canComputeSetbacks: boolean
  sellable: boolean
} {
  const canLocateParcel = Boolean(j.parcels)
  const canReadZoneCode = Boolean(j.zoning)
  const canShowTerrain = Boolean(j.contours)
  // True only where dimensional standards have been extracted and a
  // connector reads the site — i.e. coverage draws plans there.
  const canComputeSetbacks = drawsPlansIn(j.code)
  return {
    canLocateParcel,
    canReadZoneCode,
    canShowTerrain,
    canComputeSetbacks,
    sellable: canLocateParcel && canReadZoneCode && canComputeSetbacks,
  }
}
