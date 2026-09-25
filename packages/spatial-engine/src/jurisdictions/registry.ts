/**
 * Which jurisdiction an order is in, and how to read its GIS.
 *
 * JURISDICTION COMES FROM GEOMETRY, NOT FROM TYPING. The order's text is used
 * for one thing only: deciding which jurisdiction's locator to ASK FIRST. The
 * answer is accepted only when that jurisdiction's own locator matches at or
 * above the minimum score AND its own parcel and zoning layers answer at the
 * point — the same proof PG's path has always required.
 *
 * The text can also REFUSE a match. An order that says "Arlington, VA 22207"
 * and matches a same-named street in Prince George's County is the wrong lot
 * however good the score, so a match whose state contradicts a state the
 * order states explicitly is rejected rather than accepted.
 *
 * Prince George's keeps its own path (`pgatlas.ts`, two-locator sweep,
 * municipal boundary). This registry covers everything else.
 */

import type { Position } from '../site-plan/site-twin'
import {
  type ArcGisJurisdictionConfig, type JurisdictionSite, type JurisdictionContourResult,
  resolveJurisdictionSite, fetchJurisdictionContours, fetchJurisdictionAdjacentParcels,
} from './arcgis-jurisdiction'
import {
  DC_GIS, fetchDcBuildingRestrictionLines, fetchDcHistoricStatus, measureDcFrontSetback,
  measureDcStructureType, type DcBuildingRestrictionLine, type DcHistoricStatus,
} from './dc-gis'
import type { BlockFaceResult, StructureTypeEvidence } from './block-face-setback'

export const PG_CODE = 'prince_georges_md'

/** Jurisdictions with a working connector, other than PG. Add one here when its config is verified live. */
export const JURISDICTION_CONNECTORS: Record<string, ArcGisJurisdictionConfig> = {
  [DC_GIS.code]: DC_GIS,
}

export interface AddressHints {
  state: 'DC' | 'MD' | 'VA' | null
  /** Jurisdictions the text points at, most specific first. */
  preferred: string[]
}

const DC_QUADRANT = /\b\d+[A-Z]?\s+.+\s(NW|NE|SW|SE)\b/i

/**
 * Reads what the customer typed for hints. Never decides anything by itself.
 */
export function addressHints(raw: string): AddressHints {
  const a = ` ${raw.toLowerCase().replace(/\s+/g, ' ')} `
  const zip = raw.match(/\b(\d{5})(?:-\d{4})?\b(?!.*\b\d{5}\b)/)?.[1] ?? null
  const z3 = zip ? Number(zip.slice(0, 3)) : null

  let state: AddressHints['state'] = null
  if (/\b(washington,?\s*d\.?\s?c\.?|district of columbia)\b|,\s*dc\b|\bdc\s+\d{5}\b/.test(a)) state = 'DC'
  else if (/\bvirginia\b|,\s*va\b|\bva\s+\d{5}\b/.test(a)) state = 'VA'
  else if (/\bmaryland\b|,\s*md\b|\bmd\s+\d{5}\b/.test(a)) state = 'MD'
  else if (z3 != null) {
    if (z3 === 200 || z3 === 203 || z3 === 204 || z3 === 205) state = 'DC'
    else if (z3 === 201 || (z3 >= 220 && z3 <= 246)) state = 'VA'
    else if (z3 >= 206 && z3 <= 219) state = 'MD'
  }

  const preferred: string[] = []
  if (state === 'DC' || DC_QUADRANT.test(raw)) preferred.push('district_of_columbia')
  if (state === 'VA') {
    if (z3 === 222) preferred.push('arlington_va', 'fairfax_va')
    else preferred.push('fairfax_va', 'arlington_va')
  }
  if (state === 'MD' || state === null) {
    const montgomery = /\b(bethesda|rockville|silver spring|gaithersburg|germantown|potomac|chevy chase|kensington|takoma park|olney|wheaton|damascus|poolesville|clarksburg|montgomery)\b/.test(a)
      || (z3 != null && (z3 === 208 || z3 === 209))
    if (montgomery) preferred.push('montgomery_md')
  }
  return { state, preferred }
}

/**
 * The order in which to ask the jurisdictions. PG stays first when the text
 * says nothing — that is the engine's established behaviour and its only
 * certified jurisdiction — and a hinted jurisdiction goes ahead of it.
 */
export function jurisdictionAttemptOrder(raw: string): string[] {
  const { preferred, state } = addressHints(raw)
  const all = [PG_CODE, ...Object.keys(JURISDICTION_CONNECTORS)]
  const stateOf = (code: string) => code === PG_CODE ? 'MD' : JURISDICTION_CONNECTORS[code]?.state
  const order = [...preferred.filter(c => all.includes(c)), ...all]
  return [...new Set(order)].filter(c => !state || stateOf(c) === state)
}

export interface JurisdictionFindings {
  buildingRestrictionLines?: DcBuildingRestrictionLine[] | null
  historic?: DcHistoricStatus | null
  blockFace?: BlockFaceResult | null
  structure?: StructureTypeEvidence | null
}

export interface ResolvedJurisdictionSite {
  site: JurisdictionSite
  adjacent: { ring: Position[]; areaSqFt: number; propId: string | null }[]
  findings: JurisdictionFindings
}

/**
 * Resolves an address in a non-PG jurisdiction. Null when its locator does not
 * match at the minimum score, or when the parcel and zoning layers do not both
 * answer at the matched point.
 */
export async function resolveInJurisdiction(
  code: string, address: string, opts: { fetchImpl?: typeof fetch; trace?: (msg: string) => void } = {},
): Promise<ResolvedJurisdictionSite | null> {
  const cfg = JURISDICTION_CONNECTORS[code]
  if (!cfg) return null
  const site = await resolveJurisdictionSite(cfg, address, opts)
  if (!site) return null
  // The geometric proof: this jurisdiction's own fabric and zoning answer here.
  if (!site.parcel || !site.zoning) {
    opts.trace?.(`${cfg.name} locator matched "${address}" but its ${!site.parcel ? 'parcel' : 'zoning'} layer did not answer`)
    return null
  }
  const findings: JurisdictionFindings = {}
  const soft = <T>(p: Promise<T>, what: string): Promise<T | null> =>
    p.catch((e: unknown) => { opts.trace?.(`${what} unavailable: ${e instanceof Error ? e.message : String(e)}`); return null })

  const [adjacent] = await Promise.all([
    soft(fetchJurisdictionAdjacentParcels(cfg, site.parcel, opts), 'adjacent parcels'),
    (async () => {
      if (code !== DC_GIS.code) return
      const [brls, historic, blockFace, structure] = await Promise.all([
        soft(fetchDcBuildingRestrictionLines(site.parcel!, opts), 'building restriction lines'),
        fetchDcHistoricStatus(site.address.easting2248, site.address.northing2248, opts),
        soft(measureDcFrontSetback(site, opts), 'blockface'),
        soft(measureDcStructureType(site, opts), 'structure type'),
      ])
      Object.assign(findings, { buildingRestrictionLines: brls, historic, blockFace, structure })
    })(),
  ])
  return {
    site,
    adjacent: (adjacent ?? []).map(p => ({ ring: p.ring.coordinates, areaSqFt: p.areaSqFt, propId: p.propId })),
    findings,
  }
}

export async function fetchContoursIn(
  code: string, e: number, n: number, opts: { radiusFt?: number; fetchImpl?: typeof fetch } = {},
): Promise<JurisdictionContourResult | null> {
  const cfg = JURISDICTION_CONNECTORS[code]
  return cfg ? fetchJurisdictionContours(cfg, e, n, opts) : null
}

/** The zone layer each jurisdiction's zone code came from, for the provenance line. */
export function zoneSourceOf(code: string): string {
  if (code === PG_CODE) return 'PGAtlas Zoning/MapServer/63'
  const cfg = JURISDICTION_CONNECTORS[code]
  return cfg ? `${cfg.zoning.authority} — ${cfg.zoning.url}` : 'unknown'
}

/** The recorded BRL offset that binds the front, where one is recorded as a building restriction. */
export function recordedFrontBrlFt(f: JurisdictionFindings): number | null {
  const offs = (f.buildingRestrictionLines ?? [])
    .filter(b => b.kind === 'building_restriction' && b.offsetFt != null)
    .map(b => b.offsetFt as number)
  return offs.length ? Math.max(...offs) : null
}
