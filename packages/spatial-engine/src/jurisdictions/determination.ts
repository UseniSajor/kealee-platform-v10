/**
 * Which jurisdiction an address is in — decided by GEOMETRY, once, at intake.
 *
 * Before this, nothing decided it. The Stripe webhook regex-matched intake text
 * against twenty Prince George's town names; the engine asked PG first
 * whenever the text was silent. Both are guesses, and a guessed jurisdiction
 * runs one county's rules against another county's lot.
 *
 * THE DETERMINATION
 *
 * The U.S. Census Bureau geocoder matches the address and returns the
 * geographies the point falls in, from TIGER boundaries: the state, the county
 * (or county-equivalent — DC, and Virginia's independent cities), and any
 * INCORPORATED place. Census-designated places ("Bethesda") are not
 * governments and are not returned by that layer, which is the distinction that
 * matters: an incorporated town may zone its own land; a CDP never does.
 *
 * WHO ZONES THE LAND
 *
 *   · DC, and every Virginia county and independent city, zone their own land.
 *   · A Virginia TOWN zones its own land (Vienna, Herndon, Clifton, Leesburg…).
 *   · In Prince George's and Montgomery the Regional District Act puts zoning
 *     with the county (M-NCPPC) EXCEPT in the municipalities that kept their
 *     own: Laurel in Prince George's; Rockville, Gaithersburg, Poolesville,
 *     Barnesville, Brookeville, Laytonsville and Washington Grove in
 *     Montgomery. Every other municipality there (College Park, Takoma Park,
 *     Hyattsville, the Chevy Chase towns) is under county zoning.
 *   · Elsewhere in Maryland an incorporated municipality is treated as zoning
 *     its own land, and the result says to confirm it.
 *
 * The jurisdiction CODE is the zoning authority: `prince_georges_md` for a lot
 * in College Park, `rockville_md` for one in Rockville. The county is recorded
 * alongside, because GIS (parcels, terrain, soils) is published by the county
 * even where the town writes the zoning.
 *
 * Nothing is assumed when the geocoder does not match: the result is
 * `determined: false` with the reason, and the order is still accepted.
 */

import { lonLatFrom2248 } from '../export/transformation-registry'

export const CENSUS_GEOCODER =
  'https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress'

const STATE_BY_FIPS: Record<string, string> = {
  '11': 'DC', '24': 'MD', '51': 'VA', '10': 'DE', '42': 'PA', '54': 'WV',
}

/** Municipalities in PG and Montgomery that kept their own zoning (Regional District Act). */
const RDA_MUNICIPAL_ZONING: Record<string, string[]> = {
  '24033': ['Laurel'],
  '24031': ['Rockville', 'Gaithersburg', 'Poolesville', 'Barnesville', 'Brookeville', 'Laytonsville', 'Washington Grove'],
}

export interface JurisdictionDetermination {
  determined: boolean
  /** The zoning authority. Absent when not determined. */
  code: string | null
  /** As printed: "City of Rockville, Maryland", "District of Columbia". */
  name: string | null
  state: string | null
  /** 5-digit state+county FIPS. */
  countyFips: string | null
  countyName: string | null
  /** County-level code — whose GIS publishes the parcels and terrain. */
  countyCode: string | null
  municipality: { name: string; geoid: string; zonesOwnLand: boolean; confirm: boolean } | null
  /** SSURGO survey area: state + county FIPS (DC001, MD031, VA059, VA600). */
  soilSurveyArea: string | null
  matchedAddress: string | null
  longitude: number | null
  latitude: number | null
  determinedBy: 'us-census-geocoder'
  determinedAt: string
  /** Why it was not determined, when it was not. */
  reason: string | null
}

const slug = (s: string) => s.toLowerCase().replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

/** The county-level jurisdiction code from a Census county record. */
export function countyJurisdictionCode(stateAbbr: string, countyName: string): string {
  if (stateAbbr === 'DC') return 'district_of_columbia'
  const city = / city$/i.test(countyName)
  const base = slug(countyName.replace(/ (County|city)$/i, ''))
  return `${base}${city ? '_city' : ''}_${stateAbbr.toLowerCase()}`
}

function municipalZoning(stateAbbr: string, countyFips: string, placeName: string, lsad: string):
  { zonesOwnLand: boolean; confirm: boolean } {
  const bare = placeName.replace(/ (city|town|village)$/i, '')
  if (stateAbbr === 'DC') return { zonesOwnLand: false, confirm: false }
  if (stateAbbr === 'VA') {
    // Towns (LSAD 43) zone their own land; the county's code does not apply.
    return { zonesOwnLand: lsad === '43' || / town$/i.test(placeName), confirm: false }
  }
  if (stateAbbr === 'MD' && RDA_MUNICIPAL_ZONING[countyFips]) {
    return { zonesOwnLand: RDA_MUNICIPAL_ZONING[countyFips].includes(bare), confirm: false }
  }
  return { zonesOwnLand: true, confirm: true }
}

function displayName(stateAbbr: string, countyName: string, muni: { name: string; zonesOwnLand: boolean } | null): string {
  const stateName = { DC: 'District of Columbia', MD: 'Maryland', VA: 'Virginia' }[stateAbbr] ?? stateAbbr
  if (stateAbbr === 'DC') return 'District of Columbia'
  if (muni?.zonesOwnLand) {
    const m = muni.name.match(/^(.*) (city|town|village)$/i)
    return m ? `${m[2][0].toUpperCase()}${m[2].slice(1)} of ${m[1]}, ${stateName}` : `${muni.name}, ${stateName}`
  }
  return / city$/i.test(countyName)
    ? `City of ${countyName.replace(/ city$/i, '')}, ${stateName}`
    : `${countyName}, ${stateName}`
}

/** Interprets a Census geographies response. Pure, so it is testable without the network. */
export function interpretCensusGeographies(payload: any, now = new Date()): JurisdictionDetermination {
  const base: JurisdictionDetermination = {
    determined: false, code: null, name: null, state: null, countyFips: null, countyName: null,
    countyCode: null, municipality: null, soilSurveyArea: null, matchedAddress: null,
    longitude: null, latitude: null, determinedBy: 'us-census-geocoder', determinedAt: now.toISOString(),
    reason: null,
  }
  const match = payload?.result?.addressMatches?.[0]
  if (!match) return { ...base, reason: 'The Census geocoder found no match for this address.' }
  const county = match.geographies?.Counties?.[0]
  if (!county) return { ...base, matchedAddress: match.matchedAddress ?? null, reason: 'The match carried no county.' }
  const stateAbbr = STATE_BY_FIPS[String(county.STATE)] ?? String(county.STATE)
  const countyFips = `${county.STATE}${county.COUNTY}`
  const countyName = String(county.NAME)
  const countyCode = countyJurisdictionCode(stateAbbr, countyName)

  const place = (match.geographies?.['Incorporated Places'] ?? [])
    .find((p: any) => String(p.FUNCSTAT ?? '') === 'A')
  let municipality: JurisdictionDetermination['municipality'] = null
  if (place && stateAbbr !== 'DC') {
    const z = municipalZoning(stateAbbr, countyFips, String(place.NAME), String(place.LSADC ?? ''))
    municipality = { name: String(place.NAME), geoid: String(place.GEOID), ...z }
  }
  const code = municipality?.zonesOwnLand
    ? `${slug(municipality.name.replace(/ (city|town|village)$/i, ''))}_${stateAbbr.toLowerCase()}`
    : countyCode

  return {
    ...base,
    determined: true,
    code,
    name: displayName(stateAbbr, countyName, municipality),
    state: stateAbbr,
    countyFips, countyName, countyCode,
    municipality,
    soilSurveyArea: `${stateAbbr}${String(county.COUNTY).padStart(3, '0')}`,
    matchedAddress: match.matchedAddress ?? null,
    longitude: Number(match.coordinates?.x) || null,
    latitude: Number(match.coordinates?.y) || null,
  }
}

/**
 * Determines the jurisdiction of an address.
 *
 * The WHOLE address is passed — city, state and ZIP help the Census matcher,
 * unlike a county locator, and nothing is stripped. Never throws.
 */
export async function determineJurisdiction(
  address: string, opts: { fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<JurisdictionDetermination> {
  const doFetch = opts.fetchImpl ?? fetch
  const p = new URLSearchParams({
    address: address.replace(/&amp;/gi, '&').trim(),
    benchmark: 'Public_AR_Current',
    vintage: 'Current_Current',
    layers: 'Counties,Incorporated Places',
    format: 'json',
  })
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = controller ? setTimeout(() => controller.abort(), opts.timeoutMs ?? 8000) : null
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await doFetch(`${CENSUS_GEOCODER}?${p}`, {
        headers: { accept: 'application/json' }, signal: controller?.signal,
      } as RequestInit).catch((e: unknown) => ({ ok: false, status: 0, error: e }) as any)
      if (res.ok) {
        const payload = await res.json().catch(() => null)
        return interpretCensusGeographies(payload)
      }
      if (res.status && res.status < 500) break
    }
    return {
      ...interpretCensusGeographies(null),
      reason: 'The Census geocoder did not answer; the jurisdiction will be determined when the order is processed.',
    }
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/** Determination from a point already in engine coordinates (EPSG:2248). */
export async function determineJurisdictionAtPoint(
  easting2248: number, northing2248: number, opts: { fetchImpl?: typeof fetch } = {},
): Promise<JurisdictionDetermination> {
  const [lon, lat] = lonLatFrom2248(easting2248, northing2248)
  const p = new URLSearchParams({
    x: String(lon), y: String(lat), benchmark: 'Public_AR_Current', vintage: 'Current_Current',
    layers: 'Counties,Incorporated Places', format: 'json',
  })
  const res = await (opts.fetchImpl ?? fetch)(
    `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?${p}`,
  ).catch(() => null)
  const payload = res && res.ok ? await res.json().catch(() => null) : null
  // The coordinates endpoint returns geographies without an address match; wrap it.
  const geos = payload?.result?.geographies
  return interpretCensusGeographies(geos
    ? { result: { addressMatches: [{ matchedAddress: null, coordinates: { x: lon, y: lat }, geographies: geos }] } }
    : null)
}

/** Reads a determination persisted on an order, if it is one. */
export function determinationFrom(v: unknown): JurisdictionDetermination | null {
  if (!v || typeof v !== 'object') return null
  const d = v as Partial<JurisdictionDetermination>
  return d.determinedBy === 'us-census-geocoder' && d.determined === true && typeof d.code === 'string'
    ? d as JurisdictionDetermination
    : null
}
