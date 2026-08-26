/**
 * USDA soil survey — Sec. 32-130(a)(13).
 *
 * "Soil type as shown on the USDA Soil Survey of Prince George's County or soil
 * type as determined by a professional engineer at the location of each
 * proposed residential building."
 *
 * The approved Yocum Property plan carries a SOILS TABLE with map unit, name,
 * K-factor, hydric rating, hydrologic soil group and drainage class — every
 * column of which SSURGO publishes. This closes the first half of (a)(13). The
 * second half — hydrological characteristics to six feet below a basement floor
 * and depth to the closest aquifer — needs borings and is not available here.
 */

export const SDA_ENDPOINT = 'https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest'

/** Survey area symbols. MD033 is Prince George's County, Maryland. */
export const MD_SURVEY_AREAS: Record<string, string> = {
  prince_georges_md: 'MD033',
  montgomery_md: 'MD031',
  anne_arundel_md: 'MD003',
  charles_md: 'MD017',
  howard_md: 'MD027',
}

export interface SoilMapUnit {
  mapUnitSymbol: string
  mapUnitName: string
  /** Erodibility. Higher means more erodible. */
  kFactor: string | null
  hydricRating: string | null
  /** A, B, C or D — drives runoff assumptions. */
  hydrologicGroup: string | null
  drainageClass: string | null
}

export interface SoilSurveyResult {
  areaSymbol: string
  areaName: string
  units: SoilMapUnit[]
  source: { authority: string; endpoint: string; retrievedAt: string }
  caveat: string
}

export const SOILS_CAVEAT =
  'Soil map units are the USDA SSURGO survey for the county, not a site-specific investigation. ' +
  'Sec. 32-131 requires a soils investigation report whose recommendations are incorporated into ' +
  'the grading plan, and Sec. 32-130(a)(13) additionally requires hydrological characteristics to ' +
  'six feet below any proposed basement floor. Neither comes from SSURGO.'

/**
 * Soil map units for a survey area.
 *
 * Queried by area rather than by point: SSURGO's spatial service is a separate
 * endpoint with its own failure modes, and the table is what the sheet prints.
 * Narrowing to the units actually under the parcel is a later refinement.
 */
export async function fetchSoilMapUnits(
  jurisdictionCode: string,
  opts: { fetchImpl?: typeof fetch; limit?: number } = {},
): Promise<SoilSurveyResult | null> {
  const areaSymbol = MD_SURVEY_AREAS[jurisdictionCode]
  if (!areaSymbol) return null
  const doFetch = opts.fetchImpl ?? fetch
  const limit = opts.limit ?? 8

  // kffact lives on `chorizon`, not `component` — a correlated subquery takes
  // the surface horizon, which is the one erosion control cares about.
  const query =
    `SELECT TOP ${limit} mu.musym, mu.muname, c.hydricrating, c.hydgrp, c.drainagecl, ` +
    `(SELECT TOP 1 ch.kffact FROM chorizon ch WHERE ch.cokey = c.cokey ORDER BY ch.hzdept_r) AS kf ` +
    `FROM legend l ` +
    `INNER JOIN mapunit mu ON mu.lkey = l.lkey ` +
    `LEFT OUTER JOIN component c ON c.mukey = mu.mukey AND c.majcompflag = 'Yes' ` +
    `WHERE l.areasymbol = '${areaSymbol}' ORDER BY mu.musym`

  const res = await doFetch(SDA_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ format: 'JSON', query }),
  })
  if (!res.ok) return null

  const payload = await res.json().catch(() => null) as { Table?: unknown[][] } | null
  const rows = payload?.Table
  if (!Array.isArray(rows) || rows.length === 0) return null

  const cell = (v: unknown) => (v == null || v === '' ? null : String(v))
  return {
    areaSymbol,
    areaName: `${areaSymbol} survey area`,
    units: rows.map(r => ({
      mapUnitSymbol: String(r[0] ?? ''),
      mapUnitName: String(r[1] ?? ''),
      hydricRating: cell(r[2]),
      hydrologicGroup: cell(r[3]),
      drainageClass: cell(r[4]),
      kFactor: cell(r[5]),
    })),
    source: {
      authority: 'USDA NRCS Soil Data Access (SSURGO)',
      endpoint: SDA_ENDPOINT,
      retrievedAt: new Date().toISOString(),
    },
    caveat: SOILS_CAVEAT,
  }
}
