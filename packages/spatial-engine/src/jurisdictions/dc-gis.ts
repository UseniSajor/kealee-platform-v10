/**
 * District of Columbia — the District's own GIS, read the way PGAtlas is read.
 *
 * Every layer below was probed live on 2026-09-25 against a real residential
 * address (3210 Newark St NW → Square 2079 Lot 0060, R-1B, Cleveland Park
 * Historic District) and answered with real features.
 *
 * WHAT DC PUBLISHES THAT PRINCE GEORGE'S DOES NOT
 *
 *   · RECORD LOTS from the Office of the Surveyor, each carrying the
 *     subdivision BOOK and PAGE it was recorded in and its STATED area. That is
 *     the plat reference, from the District, for every platted lot. Record lots
 *     are read before tax lots so the plat-derived figure is the one drawn.
 *   · BUILDING RESTRICTION LINES, recorded per lot with their offset, typed as
 *     building restriction or Highway Plan (a future street widening).
 *   · BUILDING FOOTPRINTS for the whole District, which is what makes the
 *     contextual front setback of 11-D § 206.2 measurable.
 *
 * TRAPS FOUND WHILE PROBING
 *
 *   · The MAR locator behaves like PG's: "3210 Newark St NW" scores 100; the
 *     same address with ", Washington, DC 20008" scores 79.66 and offers a
 *     different place. Street address alone.
 *   · The QUADRANT is part of the street name. "3210 Newark St" and
 *     "3210 Newark St NW" are different queries, and a DC street name exists in
 *     up to four quadrants, so a shortened form must never drop it.
 *   · A point query carrying `distance=0` returns zero features and no error.
 *
 * VERTICAL DATUM — CONFIRMED, NOT ASSUMED. The District's metadata for
 * "Topography 2 Foot Contours - 2008" (opendata item 80983ecef0804ac8a5386fad8c97bbda)
 * states North American Vertical Datum of 1988, feet. The 2024 lidar contours
 * are also NAVD88 (GEOID18) but in 0.6 m intervals, which do not letter as a
 * 2 ft sheet; the 2008 set is used and its vintage is stated.
 */

import type { Position } from '../site-plan/site-twin'
import {
  type ArcGisJurisdictionConfig, type JurisdictionSite, type JurisdictionParcel,
  resolveJurisdictionSite, queryAtPoint, queryAround, arcgisGet, parcelFromFeature,
  fetchJurisdictionStreets, type JurisdictionStreet, ENGINE_WKID,
} from './arcgis-jurisdiction'
import { measureBlockFace, inferStructureType, type BlockFaceResult, type StructureTypeEvidence } from './block-face-setback'

const DCGIS = 'https://maps2.dcgis.dc.gov/dcgis/rest/services'
const DATA = `${DCGIS}/DCGIS_DATA`

export const DC_ENDPOINTS = {
  marLocator: `${DCGIS}/DCGIS_APPS/DCGIS_MAR/GeocodeServer`,
  recordLots: `${DATA}/Property_and_Land_WebMercator/MapServer/35`,
  taxLots: `${DATA}/Property_and_Land_WebMercator/MapServer/39`,
  parcelLots: `${DATA}/Property_and_Land_WebMercator/MapServer/33`,
  buildingRestrictionLines: `${DATA}/Property_and_Land_WebMercator/MapServer/9`,
  zoning: `${DATA}/Planning_Landuse_and_Zoning_WebMercator/MapServer/3`,
  overlays: `${DATA}/Planning_Landuse_and_Zoning_WebMercator/MapServer/6`,
  historicLandmarks: `${DATA}/Planning_Landuse_and_Zoning_WebMercator/MapServer/23`,
  historicDistricts: `${DATA}/Historic_WebMercator/MapServer/6`,
  roadwayBlocks: `${DATA}/Transportation_WebMercator/MapServer/163`,
  buildingFootprints: `${DATA}/Facility_and_Structure_WebMercator/MapServer/1`,
  addressPoints: `${DATA}/Location_WebMercator/MapServer/0`,
  contours2ft: `${DATA}/Elevation_WebMercator/MapServer/3`,
  spotElevations: `${DATA}/Elevation_WebMercator/MapServer/1`,
} as const

export const DC_CONTOUR_VERTICAL_DATUM = 'NAVD88 (feet)'

const surveyorPlat = (a: Record<string, unknown>): string | null => {
  const book = a.BOOK_NUM != null ? String(a.BOOK_NUM).trim() : ''
  const page = a.PAGE_NUM != null ? String(a.PAGE_NUM).trim() : ''
  return book && page ? `DC Office of the Surveyor, Subdivision Book ${book} Page ${page}` : null
}

const lotAuthority = (kind: string) => `District of Columbia — Office of the Surveyor / OCTO, ${kind}`

export const DC_GIS: ArcGisJurisdictionConfig = {
  code: 'district_of_columbia',
  name: 'District of Columbia',
  state: 'DC',
  locators: [{ name: 'DC Master Address Repository (MAR)', url: DC_ENDPOINTS.marLocator }],
  parcels: [
    {
      url: DC_ENDPOINTS.recordLots, kind: 'record_lot', authority: lotAuthority('Record Lots'),
      idFields: ['SQUARE', 'SUFFIX', 'LOT'], areaField: 'STATEDAREA', platReference: surveyorPlat,
    },
    {
      url: DC_ENDPOINTS.taxLots, kind: 'tax_lot', authority: lotAuthority('Tax Lots'),
      idFields: ['SQUARE', 'SUFFIX', 'LOT'], areaField: 'STATEDAREA', platReference: surveyorPlat,
    },
    {
      url: DC_ENDPOINTS.parcelLots, kind: 'parcel', authority: lotAuthority('Parcel Lots'),
      idFields: ['PAR', 'LOT'], areaField: 'STATEDAREA', platReference: surveyorPlat,
    },
  ],
  zoning: {
    url: DC_ENDPOINTS.zoning, codeFields: ['ZONING', 'ZR16'], descriptionField: 'ZONE_DESCRIPTION',
    urlField: 'ZONING_WEB_URL', authority: 'DC Office of Zoning — Zoning 2016',
  },
  streets: { url: DC_ENDPOINTS.roadwayBlocks, nameFields: ['ROUTENAME'], authority: 'DDOT — Roadway Block' },
  contours: {
    url: DC_ENDPOINTS.contours2ft,
    elevationField: 'ELEVATION',
    intervalFt: 2,
    indexEvery: 5,
    verticalDatum: DC_CONTOUR_VERTICAL_DATUM,
    authority: 'District of Columbia — OCTO',
    layerLabel: 'Elevation/MapServer/3 — Topography 2 Foot Contours (2008)',
    caveats: [
      'Contours are NAVD88 feet, per the District\'s published metadata for the 2008 2-ft ' +
      'topography. They were compiled photogrammetrically in 2008; later grading is not shown.',
      'Contours establish existing grade for design and review. They are not a field-run ' +
      'topographic survey; spot and finished-floor elevations still require one.',
    ],
  },
}

// ── DC-only layers ──────────────────────────────────────────────────────────

export interface DcBuildingRestrictionLine {
  kind: 'building_restriction' | 'highway_plan' | 'alley' | 'unknown'
  /** Offset recorded with the line, in feet, where the District published one. */
  offsetFt: number | null
  path: Position[]
  source: { authority: string; endpoint: string; retrievedAt: string }
}

const BRL_KIND: Record<number, DcBuildingRestrictionLine['kind']> = {
  1: 'alley', 2: 'building_restriction', 3: 'highway_plan',
}

function lotWhere(p: JurisdictionParcel): string | null {
  const a = p.attributes
  if (a.SQUARE == null || a.LOT == null) return null
  const sq = String(a.SQUARE).replace(/'/g, "''")
  const lot = String(a.LOT).replace(/'/g, "''")
  const suffix = a.SUFFIX != null && String(a.SUFFIX).trim()
    ? ` AND SUFFIX = '${String(a.SUFFIX).replace(/'/g, "''")}'` : ''
  return `SQUARE = '${sq}' AND LOT = '${lot}'${suffix} AND STATUS = 1`
}

/** Building restriction and Highway Plan lines RECORDED against this lot. */
export async function fetchDcBuildingRestrictionLines(
  parcel: JurisdictionParcel, opts: { fetchImpl?: typeof fetch } = {},
): Promise<DcBuildingRestrictionLine[]> {
  const where = lotWhere(parcel)
  if (!where) return []
  const payload = await arcgisGet(DC_ENDPOINTS.buildingRestrictionLines, 'query', {
    where, outFields: 'TYPE,OFFSET', returnGeometry: 'true', outSR: String(ENGINE_WKID),
  }, opts.fetchImpl ?? fetch)
  const retrievedAt = new Date().toISOString()
  return (payload.features ?? []).map((f: any) => ({
    kind: BRL_KIND[Number(f.attributes?.TYPE)] ?? 'unknown',
    offsetFt: Number.isFinite(Number(f.attributes?.OFFSET)) && Number(f.attributes?.OFFSET) > 0
      ? Number(f.attributes.OFFSET) : null,
    path: (f.geometry?.paths?.[0] ?? []).map((p: number[]) => [p[0], p[1]] as Position),
    source: { authority: 'DC Office of the Surveyor — Building Restriction Lines', endpoint: DC_ENDPOINTS.buildingRestrictionLines, retrievedAt },
  }))
}

export interface DcHistoricStatus {
  district: string | null
  landmark: string | null
  /** Exterior work needs Historic Preservation Review Board / HPO review. */
  reviewRequired: boolean
  source: { authority: string; endpoint: string; retrievedAt: string }
}

/** Historic district and landmark at the lot. A layer outage is null, never "not historic". */
export async function fetchDcHistoricStatus(
  e: number, n: number, opts: { fetchImpl?: typeof fetch } = {},
): Promise<DcHistoricStatus | null> {
  const doFetch = opts.fetchImpl ?? fetch
  try {
    const [districts, landmarks] = await Promise.all([
      queryAtPoint(DC_ENDPOINTS.historicDistricts, e, n, doFetch, { geometry: false, outFields: 'NAME,STATUS' }),
      queryAtPoint(DC_ENDPOINTS.historicLandmarks, e, n, doFetch, { geometry: false }),
    ])
    const district = districts.find((f: any) => /designated/i.test(String(f.attributes?.STATUS ?? 'Designated')))
    const landmark = landmarks[0]
    const lmName = landmark
      ? String(Object.entries(landmark.attributes ?? {}).find(([k, v]) => /NAME/i.test(k) && v)?.[1] ?? 'Historic landmark')
      : null
    return {
      district: district ? String(district.attributes.NAME) : null,
      landmark: lmName,
      reviewRequired: Boolean(district || landmark),
      source: { authority: 'DC Historic Preservation Office', endpoint: DC_ENDPOINTS.historicDistricts, retrievedAt: new Date().toISOString() },
    }
  } catch {
    return null
  }
}

/** Every current record lot in the subject's square. */
export async function fetchDcSquareLots(
  parcel: JurisdictionParcel, opts: { fetchImpl?: typeof fetch } = {},
): Promise<JurisdictionParcel[]> {
  const a = parcel.attributes
  if (a.SQUARE == null) return []
  const suffix = a.SUFFIX != null && String(a.SUFFIX).trim()
    ? ` AND SUFFIX = '${String(a.SUFFIX).replace(/'/g, "''")}'` : ''
  const layer = DC_GIS.parcels.find(l => l.kind === parcel.kind) ?? DC_GIS.parcels[0]
  const payload = await arcgisGet(layer.url, 'query', {
    where: `SQUARE = '${String(a.SQUARE).replace(/'/g, "''")}'${suffix} AND STATUS = 1`,
    outFields: '*', returnGeometry: 'true', outSR: String(ENGINE_WKID),
  }, opts.fetchImpl ?? fetch)
  return (payload.features ?? [])
    .map((f: any) => parcelFromFeature(f, layer))
    .filter((p: JurisdictionParcel | null): p is JurisdictionParcel => p !== null)
}

/** Street name as the roadway layer spells it, from the matched address: "NEWARK STREET NW" → "NEWARK". */
export function dcStreetToken(matchedAddress: string): { name: string; quadrant: string | null } {
  const s = matchedAddress.toUpperCase().replace(/^\s*\d+[A-Z]?(-\d+)?\s+/, '')
  const quadrant = s.match(/\b(NW|NE|SW|SE)\s*$/)?.[1] ?? null
  const name = s.replace(/\b(NW|NE|SW|SE)\s*$/, '').trim().split(/\s+/)[0] ?? ''
  return { name, quadrant }
}

export interface DcBlockFace {
  /** SQUARE-SUFFIX-LOT of every residential lot on the subject's block face. */
  lotKeys: string[]
  street: string
  blockKey: string
}

const lotKey = (a: Record<string, unknown>) =>
  [a.SQUARE, a.SUFFIX, a.LOT].map(v => (v == null ? '' : String(v).trim())).join('|')

/**
 * The subject's BLOCKFACE, as the District itself records it.
 *
 * 11-B defines "Blockface: the entire front lot line of all building façades
 * of a square between two (2) streets." MAR address points carry the SQUARE
 * and LOT they sit on, the street, whether the address is residential, and
 * the DDOT BLOCKKEY of the roadway block between two intersections. Lots whose
 * address shares the subject's square, street and BLOCKKEY are its blockface.
 *
 * Geometry alone got this wrong on the first live test: Square 2079 fronts
 * Newark St across three roadway blocks and Macomb St behind, and a
 * nearest-street test counted 15 lots where the blockface has 11.
 */
export async function fetchDcBlockFace(
  parcel: JurisdictionParcel, opts: { fetchImpl?: typeof fetch } = {},
): Promise<DcBlockFace | null> {
  const doFetch = opts.fetchImpl ?? fetch
  const a = parcel.attributes
  if (a.SQUARE == null || a.LOT == null) return null
  const q = (v: unknown) => String(v).replace(/'/g, "''")
  const own = await arcgisGet(DC_ENDPOINTS.addressPoints, 'query', {
    where: `SQUARE = '${q(a.SQUARE)}' AND LOT = '${q(a.LOT)}'`,
    outFields: 'STREET_NAME,STREET_TYPE,QUADRANT,BLOCKKEY', returnGeometry: 'false',
  }, doFetch)
  const mine = (own.features ?? [])[0]?.attributes
  if (!mine?.BLOCKKEY || !mine?.STREET_NAME) return null
  const peers = await arcgisGet(DC_ENDPOINTS.addressPoints, 'query', {
    where:
      `SQUARE = '${q(a.SQUARE)}' AND BLOCKKEY = '${q(mine.BLOCKKEY)}' AND ` +
      `STREET_NAME = '${q(mine.STREET_NAME)}' AND RESIDENTIAL_TYPE = 'RESIDENTIAL'`,
    outFields: 'SQUARE,SUFFIX,LOT', returnGeometry: 'false',
  }, doFetch)
  return {
    lotKeys: [...new Set<string>((peers.features ?? []).map((f: any) => lotKey(f.attributes ?? {})))],
    street: String(mine.STREET_NAME),
    blockKey: String(mine.BLOCKKEY),
  }
}

/**
 * 11-D § 206.2: the range of front setbacks of the residential buildings on
 * the subject's blockface, measured from the District's footprints.
 */
export async function measureDcFrontSetback(
  site: JurisdictionSite, opts: { fetchImpl?: typeof fetch } = {},
): Promise<BlockFaceResult | null> {
  if (!site.parcel) return null
  const doFetch = opts.fetchImpl ?? fetch
  const [squareLots, face] = await Promise.all([
    fetchDcSquareLots(site.parcel, opts),
    fetchDcBlockFace(site.parcel, opts),
  ])
  if (!squareLots.length || !face) return null
  const faceLots = squareLots.filter(l => face.lotKeys.includes(lotKey(l.attributes)))

  const xs = faceLots.flatMap(l => l.ring.coordinates.map(c => c[0]))
  const ys = faceLots.flatMap(l => l.ring.coordinates.map(c => c[1]))
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2
  const r = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + 80

  const [streets, footprints] = await Promise.all([
    fetchJurisdictionStreets(DC_GIS, cx, cy, { searchFt: r, fetchImpl: doFetch }),
    queryAround(DC_ENDPOINTS.buildingFootprints, cx, cy, r, doFetch, { outFields: 'OBJECTID' }),
  ])
  // "NEWARK STREET" on the address point, "NEWARK ST NW" on the roadway block.
  const token = face.street.toUpperCase().split(/\s+/)[0]
  const { quadrant } = dcStreetToken(site.address.matchedAddress)
  const fronting = streets
    .filter(s => {
      const n = (s.name ?? '').toUpperCase()
      return n.split(/\s+/)[0] === token && (!quadrant || n.endsWith(quadrant))
    })
    .flatMap(s => s.paths)
  const result = measureBlockFace({
    subject: { id: site.parcel.propId ?? 'subject', ring: site.parcel.ring.coordinates },
    blockLots: faceLots.map(l => ({ id: l.propId ?? '', ring: l.ring.coordinates })),
    streetPaths: fronting,
    footprints: footprints.features.flatMap((f: any) =>
      (f.geometry?.rings ?? []).slice(0, 1).map((ring: number[][]) => ring.map(p => [p[0], p[1]] as Position))),
    source:
      `DC OCTO Building Footprints; blockface from MAR address points (Square ` +
      `${site.parcel.attributes.SQUARE}, ${face.street}, roadway block ${face.blockKey.slice(0, 8)})`,
  })
  result.caveats.push(
    `Blockface: ${faceLots.length} residential lots on ${face.street} in Square ` +
    `${site.parcel.attributes.SQUARE} between the two intersecting streets (11-B, "Blockface").`)
  if (footprints.truncated) {
    result.caveats.push('The footprint query was capped by the server; some buildings on the block may be missing.')
  }
  return result
}

/** The existing building's structure type, from the District's footprints. */
export async function measureDcStructureType(
  site: JurisdictionSite, opts: { fetchImpl?: typeof fetch } = {},
): Promise<StructureTypeEvidence | null> {
  if (!site.parcel) return null
  const ring = site.parcel.ring.coordinates
  const xs = ring.map(c => c[0]), ys = ring.map(c => c[1])
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2
  const r = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + 20
  const fps = await queryAround(DC_ENDPOINTS.buildingFootprints, cx, cy, r, opts.fetchImpl ?? fetch, { outFields: 'OBJECTID' })
  const footprints = fps.features.flatMap((f: any) =>
    (f.geometry?.rings ?? []).slice(0, 1).map((rg: number[][]) => rg.map(p => [p[0], p[1]] as Position)))
  const streets = site.streets.flatMap(s => s.paths)
  return inferStructureType(ring, footprints, streets)
}

export interface DcSite extends JurisdictionSite {
  buildingRestrictionLines: DcBuildingRestrictionLine[] | null
  historic: DcHistoricStatus | null
}

/** Address to lot, zone, streets, recorded BRLs and historic status. */
export async function resolveDcSite(
  address: string, opts: { fetchImpl?: typeof fetch } = {},
): Promise<DcSite | null> {
  const site = await resolveJurisdictionSite(DC_GIS, address, opts)
  if (!site) return null
  const [brls, historic] = await Promise.all([
    site.parcel ? fetchDcBuildingRestrictionLines(site.parcel, opts).catch(() => null) : Promise.resolve([]),
    fetchDcHistoricStatus(site.address.easting2248, site.address.northing2248, opts),
  ])
  return { ...site, buildingRestrictionLines: brls, historic }
}
