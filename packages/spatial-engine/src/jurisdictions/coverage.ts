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
 *   DATA ONLY            — we can read the county's GIS but have no certified
 *                          rule pack, so we can describe the site and must not
 *                          assert compliance.
 *   FULL                 — GIS plus a certified rule pack. The product as sold.
 *
 * Adding a jurisdiction to `FULL` requires a rule pack that the maintenance
 * cycle certifies. Adding one to `DATA_ONLY` requires only a working GIS
 * connector. Nothing is added here because a connector URL exists somewhere in
 * the repo — `gis-client.ts` carries endpoints for Arlington, Fairfax,
 * Montgomery and DC, and a connector is not coverage.
 */

export type CoverageLevel = 'full' | 'data_only' | 'unserved'

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
    level: 'unserved', rulePackVersion: null, gisConnector: false,
    produces: [],
    cannotProduce: ['No certified rule pack and no verified locator. Not sold.'],
  },
  {
    code: 'district_of_columbia', name: 'District of Columbia', state: 'DC',
    level: 'unserved', rulePackVersion: null, gisConnector: false,
    produces: [],
    cannotProduce: ['DCRA/DOB zoning regulations are not encoded. Not sold.'],
  },
  {
    code: 'arlington_va', name: 'Arlington County', state: 'VA',
    level: 'unserved', rulePackVersion: null, gisConnector: false,
    produces: [],
    cannotProduce: ['No certified rule pack. Not sold.'],
  },
  {
    code: 'fairfax_va', name: 'Fairfax County', state: 'VA',
    level: 'unserved', rulePackVersion: null, gisConnector: false,
    produces: [],
    cannotProduce: ['No certified rule pack. Not sold.'],
  },
]

export function coverageFor(code: string): JurisdictionCoverage | null {
  return JURISDICTION_COVERAGE.find(j => j.code === code) ?? null
}

/** The jurisdictions an order may be accepted for today. */
export function servedJurisdictions(): JurisdictionCoverage[] {
  return JURISDICTION_COVERAGE.filter(j => j.level !== 'unserved')
}

export interface ServiceAreaVerdict {
  served: boolean
  level: CoverageLevel
  /** Customer-facing sentence. Never blames the address when the area is the issue. */
  message: string
  /** What the operator should do. */
  disposition: 'proceed' | 'refer_or_refund'
}

/**
 * Decides whether an address is in the service area BEFORE the locator runs.
 *
 * This is a coarse text check on state and county, deliberately: it exists to
 * catch the obvious out-of-area order early and give it an honest message. It
 * is NOT a jurisdiction determination — that comes from geometry
 * (`Administrative/MapServer/30`), never from typing, and the engine's own
 * rules say so. A `served: true` here means "worth asking the county", not
 * "this parcel is in Prince George's County".
 */
export function assessServiceArea(rawAddress: string): ServiceAreaVerdict {
  const a = rawAddress.toLowerCase()

  const outOfState = [
    { pattern: /\b(washington,?\s*d\.?c\.?|district of columbia)\b/, name: 'the District of Columbia' },
    { pattern: /\b(virginia|,\s*va\b|\bva\s+2\d{4})\b/, name: 'Virginia' },
  ]
  for (const o of outOfState) {
    if (o.pattern.test(a)) {
      return {
        served: false, level: 'unserved', disposition: 'refer_or_refund',
        message:
          `This engine serves Prince George's County, Maryland. The address given is in ` +
          `${o.name}, which is not yet covered — the zoning rules there are not encoded, ` +
          `so a plan drawn for it could not be checked for compliance.`,
      }
    }
  }

  const otherMdCounty = [
    { pattern: /\bmontgomery\b/, name: 'Montgomery County' },
    { pattern: /\bhoward county\b/, name: 'Howard County' },
    { pattern: /\banne arundel\b/, name: 'Anne Arundel County' },
    { pattern: /\bbaltimore\b/, name: 'Baltimore' },
    { pattern: /\bcharles county\b/, name: 'Charles County' },
    { pattern: /\bfrederick county\b/, name: 'Frederick County' },
  ]
  for (const o of otherMdCounty) {
    if (o.pattern.test(a)) {
      return {
        served: false, level: 'unserved', disposition: 'refer_or_refund',
        message:
          `This engine serves Prince George's County, Maryland. The address given appears ` +
          `to be in ${o.name}, which is not yet covered.`,
      }
    }
  }

  return {
    served: true, level: 'full', disposition: 'proceed',
    message: "Within the Prince George's County service area, pending the county locator.",
  }
}

/**
 * The message a BLOCKED property resolution should carry.
 *
 * Separates "we do not serve this area" from "the county has no such address",
 * because they need different actions and the second one blames the customer.
 */
export function propertyBlockedMessage(address: string, triedForms: string[]): string {
  const area = assessServiceArea(address)
  if (!area.served) return area.message
  return (
    `The Prince George's County locator did not match "${address}" at or above the minimum ` +
    `score of 90 (tried: ${triedForms.map(f => `"${f}"`).join(', ')}). A weak match would site ` +
    `the plan on the wrong lot, so none is accepted. If the address is correct and new, the ` +
    `county's address point may not be published yet — a recorded plat resolves it.`
  )
}
