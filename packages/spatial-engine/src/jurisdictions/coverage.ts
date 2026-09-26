/**
 * What this engine can actually serve, and what it cannot.
 *
 * The platform is marketed for DC · MD · VA. The engine has a certified rule
 * pack for ONE jurisdiction: Prince George's County, Maryland. `rules/` holds
 * `pg-certifiable.ts` and nothing else. `resolveJurisdiction` returns the
 * hardcoded string `prince_georges_md` for every order.
 *
 * Before this module, an order outside PG failed at `resolve_property` with
 * "the county locator did not match <address>". That is TRUE and MISLEADING:
 * the address is usually fine, it is simply in a county whose locator this
 * engine never queried. The customer reads it as "you typed your address
 * wrong" and the operator reads it as a geocoding bug. Neither is what
 * happened.
 *
 * The distinction this module draws:
 *
 *   OUT OF SERVICE AREA  — we do not serve this jurisdiction. Refund or refer.
 *   DATA ONLY            — we can read the county's GIS but have no dimensional
 *                          standards, so we can describe the site and must not
 *                          draw an envelope.
 *   PRELIMINARY          — GIS plus dimensional standards machine-extracted from
 *                          the adopted ordinance, every value cited. A complete
 *                          preliminary plan is drawn and delivered for
 *                          professional review; no certified rule pack exists,
 *                          so compliance is never asserted as certified.
 *   FULL                 — GIS plus a certified rule pack. The product as sold.
 *
 * Adding a jurisdiction to `FULL` requires a rule pack that the maintenance
 * cycle certifies. Adding one to `DATA_ONLY` requires only a working GIS
 * connector. Nothing is added here because a connector URL exists somewhere in
 * the repo — `gis-client.ts` carries endpoints for Arlington, Fairfax,
 * Montgomery and DC, and a connector is not coverage.
 */

import { transcribedZones } from './county-zoning'

export type CoverageLevel = 'full' | 'preliminary' | 'data_only' | 'unserved'

export interface JurisdictionCoverage {
  code: string
  name: string
  state: 'MD' | 'DC' | 'VA'
  level: CoverageLevel
  /** The certified rule pack, when there is one. */
  rulePackVersion: string | null
  /** Whether the engine has a working locator/parcel/zoning connector. */
  gisConnector: boolean
  /** What the engine can honestly produce here. */
  produces: string[]
  /** What it cannot, stated so nobody sells it. */
  cannotProduce: string[]
}

export const JURISDICTION_COVERAGE: JurisdictionCoverage[] = [
  {
    code: 'prince_georges_md',
    name: "Prince George's County",
    state: 'MD',
    level: 'full',
    rulePackVersion: 'pg-2022.1',
    gisConnector: true,
    produces: [
      'Parcel boundary and adjacent parcels from the county fabric',
      'Zoning code and dimensional standards with citations',
      'Building Restriction Lines and buildable envelope',
      'Lot coverage against the zoning table',
      '2-ft existing contours, NAVD88',
      'Soils, floodplain and environmental constraints',
      'Sheet set, CAD and survey data exports',
    ],
    cannotProduce: [
      'A boundary survey — that is a licensed surveyor',
      'Spot and finished-floor elevations without field survey',
    ],
  },
  // Everything below is DECLARED UNSERVED rather than omitted. An absent entry
  // reads as an oversight; an explicit one is a decision with a reason.
  {
    code: 'montgomery_md', name: 'Montgomery County', state: 'MD',
    level: 'preliminary', rulePackVersion: null, gisConnector: true,
    produces: [
      'Parcel from M-NCPPC Montgomery Planning (SDAT account, lot, block), MD iMAP fallback',
      'Recorded plat reference and State Archives link from the M-NCPPC plat index',
      'Zone code and single-family standards for RE-2, RE-2C, RE-1, R-200, R-90, R-60, R-40, cited',
      'Established Building Line (§4.4.1.A) measured from neighbouring detached houses',
      '2-ft existing contours, NAVD88 (GEOID12B)',
      'Soils (SSURGO MD031)',
    ],
    cannotProduce: [
      'The pre-1958 lot exemptions of ZTA 16-07 — published only as a scanned image; the reviewer applies them.',
      'Townhouse, multi-unit, commercial and floating-zone envelopes — not transcribed, not drawn.',
      'Residential Infill Compatibility (§4.4.1.B) determinations.',
      'A certified rule pack, or a boundary survey — that is a licensed surveyor',
    ],
  },
  {
    code: 'district_of_columbia', name: 'District of Columbia', state: 'DC',
    level: 'preliminary', rulePackVersion: null, gisConnector: true,
    produces: [
      'Record lot from the Office of the Surveyor, with its subdivision book and page',
      'Zone code (2016 Regulations) and the dimensional envelope, every value cited to Title 11',
      'Front setback MEASURED from the blockface (11-D § 206.2) and any recorded building restriction line',
      'Historic district and landmark status',
      '2-ft existing contours, NAVD88 (2008 capture, datum per District metadata)',
      'Soils (SSURGO DC001)',
    ],
    cannotProduce: [
      'A certified rule pack — the DC standards are machine-extracted and hand-transcribed, not yet verified by a reviewer.',
      'Envelopes for zones whose yards are height formulas (RA-2 to RA-5, MU-1, MU-2, MU-7 and up) — reported as not computable.',
      'A Zoning Administrator determination of the blockface range — the measured range is evidence for one.',
      'A boundary survey — that is a licensed surveyor',
    ],
  },
  {
    code: 'arlington_va', name: 'Arlington County', state: 'VA',
    level: 'preliminary', rulePackVersion: null, gisConnector: true,
    produces: [
      'Property polygon, zone code and street network from Arlington open data',
      'Address resolution on the VGIN statewide locator, point addresses in Arlington only',
      'One-family standards for R-20, R-10, R-8, R-6, R-5, R2-7 (2026 ordinance), cited',
      'Resource Protection Area and local historic district status',
      '2-ft contours generated from USGS 3DEP lidar, NAVD88 read from the source tile',
    ],
    cannotProduce: [
      'The reduced front setback by frontage average (§3.2.6.A.1(e)) — needs Zoning Administrator approval of a plat; 25 ft is drawn.',
      'Townhouse, multifamily and commercial envelopes — not transcribed, not drawn.',
      'County-published contours: the county layer carries no stated datum and is not used.',
      'A certified rule pack, or a boundary survey — that is a licensed surveyor',
    ],
  },
  {
    code: 'fairfax_va', name: 'Fairfax County', state: 'VA',
    level: 'preliminary', rulePackVersion: null, gisConnector: true,
    produces: [
      'Parcel and zone code from Fairfax County GIS; address on the county locator (point addresses)',
      'Single-family standards for R-A, R-C, R-E, R-1 to R-5, R-8 from Chapter 112.1, cited',
      'Chesapeake Bay Preservation Area status',
      '2-ft contours generated from USGS 3DEP lidar, NAVD88 read from the source tile',
    ],
    cannotProduce: [
      'County contours: Fairfax publishes them only as vector tiles, one set in NGVD29.',
      'Cluster, ADU, PDH/PDC and multifamily envelopes — not transcribed, not drawn.',
      'A determination of which zMOD text governs an application pending since before 2023 — a person decides.',
      'A certified rule pack, or a boundary survey — that is a licensed surveyor',
    ],
  },
]

export function coverageFor(code: string): JurisdictionCoverage | null {
  return JURISDICTION_COVERAGE.find(j => j.code === code) ?? null
}

/**
 * The jurisdictions an order may be ACCEPTED for today.
 *
 * `full` only. This deliberately excludes `data_only`: a jurisdiction whose
 * GIS answers but whose dimensional standards have not been extracted can be
 * described and cannot be drawn to. Treating "we can read the zone code" as
 * "we can sell a site plan" is the mistake this function exists to prevent —
 * a guessed setback produces a non-compliant plan indistinguishable from a
 * compliant one.
 */
export function servedJurisdictions(): JurisdictionCoverage[] {
  return JURISDICTION_COVERAGE.filter(j => j.level === 'full')
}

/**
 * Jurisdictions whose data layer is wired but which cannot be sold.
 *
 * Useful for a feasibility or property-report product, which needs facts
 * rather than a drawing, and for showing what a rule pack would unlock.
 */
export function dataOnlyJurisdictions(): JurisdictionCoverage[] {
  return JURISDICTION_COVERAGE.filter(j => j.level === 'data_only')
}

/** GIS plus cited, machine-extracted standards: preliminary plans for professional review. */
export function preliminaryJurisdictions(): JurisdictionCoverage[] {
  return JURISDICTION_COVERAGE.filter(j => j.level === 'preliminary')
}

/** Whether the engine should draw a plan for an order resolved here. */
export function drawsPlansIn(code: string): boolean {
  const level = coverageFor(code)?.level
  return level === 'full' || level === 'preliminary'
}

/**
 * Coverage for ANY determined jurisdiction.
 *
 * Nothing is refused. An order in a jurisdiction without its own entry is
 * accepted like any other: the lot, terrain and soils are drawn from the
 * county's or the state's GIS, and the zoning envelope — which needs that
 * jurisdiction's ordinance — is prepared by staff and says so. There used to
 * be a text-matching `assessServiceArea` here that turned addresses away by
 * the words typed into them; the jurisdiction is now determined from geometry
 * at intake, and a sale is never declined on it.
 */
export function coverageForDetermined(code: string, name: string | null): JurisdictionCoverage {
  const own = coverageFor(code)
  if (own) return own
  const state = code === 'district_of_columbia' ? 'DC' : code.endsWith('_va') ? 'VA' : 'MD'
  // Standards transcribed from the ordinance (county-zoning.ts): the envelope
  // is drawn for the zones listed, for professional review.
  const t = transcribedZones(code)
  if (t) {
    return {
      code, name: name ?? code, state,
      level: 'preliminary', rulePackVersion: null, gisConnector: true,
      produces: [
        'Parcel, streets and neighbours from the jurisdiction\'s own GIS where it publishes them, else the statewide fabric',
        `Zone code and single-family standards for ${t.zones.join(', ')} — ${t.source}, cited per zone`,
        'Existing contours (county layer or USGS 3DEP lidar), soils (SSURGO), rainfall (NOAA Atlas 14)',
      ],
      cannotProduce: [
        `Envelopes for zones not listed (planned, cluster, townhouse, multifamily, commercial) — prepared by staff from the ${name ?? code} ordinance.`,
        'Proffers, conditions of approval and recorded-plat building lines are not read from the zoning layer — the reviewer checks them.',
        'A certified rule pack, or a boundary survey — that is a licensed surveyor',
      ],
    }
  }
  return {
    code, name: name ?? code, state,
    level: 'data_only', rulePackVersion: null, gisConnector: true,
    produces: [
      'Parcel, streets and neighbours from the county or statewide parcel fabric',
      'Existing contours (county layer or USGS 3DEP lidar), soils (SSURGO), rainfall (NOAA Atlas 14)',
    ],
    cannotProduce: [
      `Dimensional standards for ${name ?? code} are not encoded: the zoning envelope is prepared by staff from its ordinance.`,
      'A certified rule pack, or a boundary survey — that is a licensed surveyor',
    ],
  }
}
