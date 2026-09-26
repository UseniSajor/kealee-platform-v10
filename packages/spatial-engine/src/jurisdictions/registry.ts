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
import type { JurisdictionDetermination } from './determination'
import {
  MONTGOMERY_GIS, FAIRFAX_GIS, ARLINGTON_GIS, MARYLAND_STATEWIDE_GIS, VIRGINIA_STATEWIDE_GIS,
  montgomeryDetachedHousesAround, montgomeryRecordPlat,
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

/**
 * Whose GIS reads a determined jurisdiction.
 *
 * The DETERMINATION (`determination.ts`, from geometry) says who zones the
 * land. This says whose layers draw the lot, which is not always the same
 * body: a Rockville lot is zoned by the City of Rockville and mapped by
 * Montgomery County; a Howard County lot has no connector of its own and is
 * read from Maryland's statewide fabric. Nothing here chooses a jurisdiction.
 */
export type GisConnector =
  | { kind: 'pgatlas'; code: typeof PG_CODE }
  | { kind: 'arcgis'; code: string; cfg: ArcGisJurisdictionConfig; requireZoning: boolean }
  | { kind: 'none'; reason: string }

export function connectorFor(det: JurisdictionDetermination): GisConnector {
  if (!det.determined || !det.code) return { kind: 'none', reason: det.reason ?? 'jurisdiction not determined' }
  if (det.countyCode === PG_CODE) return { kind: 'pgatlas', code: PG_CODE }
  const own = JURISDICTION_CONNECTORS[det.code]
  if (own) return { kind: 'arcgis', code: own.code, cfg: own, requireZoning: true }
  // A town inside a county with a connector: the county maps it; the town's
  // zoning is not the county's, so the county zone layer is not required.
  const county = det.countyCode ? JURISDICTION_CONNECTORS[det.countyCode] : undefined
  if (county) return { kind: 'arcgis', code: county.code, cfg: county, requireZoning: false }
  if (det.state === 'MD') return { kind: 'arcgis', code: MARYLAND_STATEWIDE_GIS.code, cfg: MARYLAND_STATEWIDE_GIS, requireZoning: false }
  if (det.state === 'VA') return { kind: 'arcgis', code: VIRGINIA_STATEWIDE_GIS.code, cfg: VIRGINIA_STATEWIDE_GIS, requireZoning: false }
  return {
    kind: 'none',
    reason: `${det.name ?? det.code} is outside the states whose parcel fabric this engine reads (DC, MD, VA).`,
  }
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
  code: string, address: string,
  opts: { fetchImpl?: typeof fetch; trace?: (msg: string) => void; cfg?: ArcGisJurisdictionConfig; requireZoning?: boolean } = {},
): Promise<ResolvedJurisdictionSite | null> {
  const cfg = opts.cfg ?? JURISDICTION_CONNECTORS[code]
  if (!cfg) return null
  code = cfg.code
  const site = await resolveJurisdictionSite(cfg, address, opts)
  if (!site) return null
  // The lot must be in this fabric. Zoning is required only where the
  // connector's zone layer IS the zoning authority's.
  const needZoning = opts.requireZoning ?? Boolean(cfg.zoning)
  if (!site.parcel || (needZoning && !site.zoning)) {
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
    ?? [MARYLAND_STATEWIDE_GIS, VIRGINIA_STATEWIDE_GIS].find(c => c.code === code)
  return cfg ? fetchJurisdictionContours(cfg, e, n, opts) : null
}

/** The zone layer each jurisdiction's zone code came from, for the provenance line. */
export function zoneSourceOf(code: string): string {
  if (code === PG_CODE) return 'PGAtlas Zoning/MapServer/63'
  const cfg = JURISDICTION_CONNECTORS[code]
  return cfg?.zoning ? `${cfg.zoning.authority} — ${cfg.zoning.url}` : 'not read — no zoning layer for this authority'
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
