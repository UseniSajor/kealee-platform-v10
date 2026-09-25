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
import { measureBlockFace, type BlockFaceResult, type StructureTypeEvidence } from './block-face-setback'
import {
  MONTGOMERY_GIS, FAIRFAX_GIS, ARLINGTON_GIS, montgomeryDetachedHousesAround, montgomeryRecordPlat,
  virginiaConstraintsOn, type EnvironmentalFinding,
} from './dmv-counties-gis'
import { countyStandard } from './county-zoning'
import { queryAround, parcelFromFeature, type JurisdictionParcel } from './arcgis-jurisdiction'

export const PG_CODE = 'prince_georges_md'

/** Jurisdictions with a working connector, other than PG. Add one here when its config is verified live. */
export const JURISDICTION_CONNECTORS: Record<string, ArcGisJurisdictionConfig> = {
  [DC_GIS.code]: DC_GIS,
  [MONTGOMERY_GIS.code]: MONTGOMERY_GIS,
  [FAIRFAX_GIS.code]: FAIRFAX_GIS,
  [ARLINGTON_GIS.code]: ARLINGTON_GIS,
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

export interface EstablishedBuildingLine {
  /** Average front setback of the qualifying detached houses. */
  averageFt: number | null
  /** 2+ houses and more than half set back beyond the zone minimum. */
  applies: boolean
  sampleCount: number
  basis: string
}

export interface JurisdictionFindings {
  buildingRestrictionLines?: DcBuildingRestrictionLine[] | null
  historic?: DcHistoricStatus | null
  blockFace?: BlockFaceResult | null
  structure?: StructureTypeEvidence | null
  /** Montgomery §4.4.1.A. */
  establishedBuildingLine?: EstablishedBuildingLine | null
  /** The recorded plat covering the lot, where the county indexes plats. */
  recordPlat?: { plat: string; link: string | null; recorded: string | null } | null
  /** Chesapeake Bay / RPA / local historic district touching the lot. */
  constraints?: EnvironmentalFinding[] | null
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
      if (code === MONTGOMERY_GIS.code) {
        const [ebl, plat] = await Promise.all([
          soft(measureEstablishedBuildingLine(site, opts), 'established building line'),
          soft(montgomeryRecordPlat(site.address.easting2248, site.address.northing2248, opts), 'record plat index'),
        ])
        Object.assign(findings, { establishedBuildingLine: ebl, recordPlat: plat })
        return
      }
      if (code === FAIRFAX_GIS.code || code === ARLINGTON_GIS.code) {
        findings.constraints = await virginiaConstraintsOn(code, site.parcel!.ring.coordinates, opts)
        return
      }
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

/**
 * Montgomery §4.4.1.A, measured.
 *
 * The qualifying houses are detached houses (M-NCPPC building land use
 * "Single Family Detached") on lots within 300 ft of the subject, on the same
 * side of the SAME street, not fronting another street. The line applies when
 * at least two qualify and more than half are set back beyond the zone
 * minimum; it is then their average. The ordinance requires the permit
 * figure to come from a sealed survey — this is the drafter's measurement of
 * what that survey will find, stated as such.
 */
export async function measureEstablishedBuildingLine(
  site: JurisdictionSite, opts: { fetchImpl?: typeof fetch } = {},
): Promise<EstablishedBuildingLine | null> {
  if (!site.parcel || !site.zoning) return null
  const std = countyStandard(MONTGOMERY_GIS.code, site.zoning.zoneCode)
  if (!std || !['R-200', 'R-90', 'R-60', 'R-40'].includes(std.zone)) {
    return { averageFt: null, applies: false, sampleCount: 0, basis: `§4.4.1.A does not apply in ${site.zoning.zoneCode}` }
  }
  const doFetch = opts.fetchImpl ?? fetch
  const ring = site.parcel.ring.coordinates
  const xs = ring.map(c => c[0]), ys = ring.map(c => c[1])
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2
  const reach = 300 + Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2
  const layer = MONTGOMERY_GIS.parcels.find(l => l.kind === site.parcel!.kind) ?? MONTGOMERY_GIS.parcels[0]
  const [lots, houses] = await Promise.all([
    queryAround(layer.url, cx, cy, reach, doFetch).then(r => r.features
      .map((f: any) => parcelFromFeature(f, layer))
      .filter((p: JurisdictionParcel | null): p is JurisdictionParcel => p !== null)),
    montgomeryDetachedHousesAround(cx, cy, reach + 60, opts),
  ])
  const token = site.address.matchedAddress.toUpperCase().replace(/^\s*\d+[A-Z]?\s+/, '').split(/\s+/)[0] ?? ''
  const fronting = site.streets.filter(s => (s.name ?? '').toUpperCase().split(/\s+/)[0] === token).flatMap(s => s.paths)
  const other = site.streets.filter(s => (s.name ?? '').toUpperCase().split(/\s+/)[0] !== token).flatMap(s => s.paths)
  const r = measureBlockFace({
    subject: { id: site.parcel.propId ?? 'subject', ring },
    blockLots: lots.map(l => ({ id: l.propId ?? '', ring: l.ring.coordinates })),
    streetPaths: fronting, otherStreetPaths: other, footprints: houses,
    source: 'M-NCPPC building footprints (detached houses) and parcels',
  })
  const n = r.samples.length
  const beyond = r.samples.filter(x => x.setbackFt > std.frontFt).length
  const applies = n >= 2 && beyond > n / 2
  return {
    averageFt: r.meanFt,
    applies,
    sampleCount: n,
    basis: `${beyond} of ${n} set back beyond ${std.frontFt} ft, within 300 ft on the same side`,
  }
}
