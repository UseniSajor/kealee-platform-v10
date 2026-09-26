/**
 * Single-family dimensional standards for Montgomery, Fairfax and Arlington,
 * HAND-TRANSCRIBED from each county's adopted ordinance with a citation on
 * every value. Not machine-extracted: each of these is a handful of numbers
 * per zone, and every one was read against the source text on 2026-09-25 —
 * including the footnotes, which changed two answers (below).
 *
 * SOURCES
 *
 *   Montgomery  Chapter 59, Division 4.4 standard method, as effective
 *               30 October 2014 (Ord. 17-43 as revised by Ord. 17-52 / ZTA 14-09),
 *               read from M-NCPPC's "with ZTA 9.30.14" Article 59-4, and
 *               RECONCILED on 2026-09-25 against every ZTA the Council lists as
 *               enacted since: 15-09 relabels the height rows; 21-10 and 22-09
 *               change accessory structures only; 25-02 (eff. 2025-11-01) ADDS a
 *               Workforce Housing method on qualifying corridors and leaves the
 *               standard method unchanged; 22-11, 25-13, 26-06 do not touch
 *               §4.4. ZTA 16-07 (pre-1958 lot exemptions) is published only as a
 *               scanned image and was not read; lots recorded before 1958 are
 *               flagged for the reviewer. The consolidated code library itself
 *               answers this environment with a bot challenge.
 *   Fairfax     Chapter 112.1 (zMOD, readopted 2023), §2102, read from the
 *               County's official online code on 2026-09-25. Single-family
 *               dwellings take FIXED setbacks; the "setback relative to height"
 *               tables apply to other principal uses only.
 *   Arlington   Zoning Ordinance effective March 14, 2026: district sections
 *               §5.2–§5.9 for lot area, width and height; §3.2.5 coverage and
 *               §3.2.6 placement for one-family dwellings.
 *
 * FOOTNOTES THAT CHANGED THE NUMBER
 *
 *   · Fairfax R-C and R-E print "40 feet or 50 feet [3]". Footnote [3]: the
 *     larger figure applies only to a dwelling TALLER than 35 ft. A house at
 *     the 35 ft maximum takes the first figure.
 *   · Arlington R-20's lot width is 100 ft, not the 80 ft of R-10 that a
 *     pattern match on the PDF text returned by running into the next section.
 *
 * CONTEXTUAL FRONT SETBACKS, like DC's, exist here too:
 *
 *   · Montgomery §4.4.1.A ESTABLISHED BUILDING LINE (R-200, R-90, R-60, R-40,
 *     new buildings only): where 2+ detached houses within 300 ft on the same
 *     side and between intersecting streets exist and more than half are set
 *     back further than the zone minimum, the front setback is their average.
 *     It can only push the front BACK. Measured here from M-NCPPC building
 *     footprints; the text requires a sealed survey for the permit.
 *   · Arlington §3.2.6.A.1(e): 25 ft from the right-of-way, REDUCIBLE to the
 *     average of the frontage (not below 15 ft) on the Zoning Administrator's
 *     approval of a plat. The matter-of-right 25 ft is drawn; the reduction is
 *     named as available.
 */

import type { DcStandardRow } from './dc-zoning'

export interface CountyZoneStandard {
  zone: string
  lotAreaSqFt: number
  lotWidthFt: number
  frontFt: number
  sideFt: number
  /** Sum of both side setbacks, where the ordinance sets one. */
  sideSumFt: number | null
  rearFt: number
  /** Lot coverage maximum, %, where the ordinance sets one. */
  coveragePct: number | null
  heightFt: number
  citation: string
  notes: string[]
}

const MC = (s: string) => `Montgomery County Code Ch. 59, §${s}`
const FFX = (t: string) => `Fairfax County Code Ch. 112.1, Table ${t}`
const ARL = (s: string) => `Arlington County Zoning Ordinance §${s}; §3.2.5.A; §3.2.6.A`

const MC_PITCHED = 'Height 35 ft to a flat roof; 30 ft to the mean of eaves and ridge of a pitched roof.'
const MC_EBL = 'Front setback may be increased by the Established Building Line, §4.4.1.A.'
const MC_INFILL = 'Lots platted before 1978 and under 25,000 SF may have to satisfy Residential Infill Compatibility, §4.4.1.B.'

export const MONTGOMERY_STANDARDS: Record<string, CountyZoneStandard> = {
  'RE-2': { zone: 'RE-2', lotAreaSqFt: 87120, lotWidthFt: 150, frontFt: 50, sideFt: 17, sideSumFt: 35, rearFt: 35, coveragePct: 25, heightFt: 50, citation: MC('4.4.4.B'), notes: [] },
  'RE-2C': { zone: 'RE-2C', lotAreaSqFt: 87120, lotWidthFt: 150, frontFt: 50, sideFt: 17, sideSumFt: 35, rearFt: 35, coveragePct: 25, heightFt: 50, citation: MC('4.4.5.B'), notes: [] },
  'RE-1': { zone: 'RE-1', lotAreaSqFt: 40000, lotWidthFt: 125, frontFt: 50, sideFt: 17, sideSumFt: 35, rearFt: 35, coveragePct: 15, heightFt: 50, citation: MC('4.4.6.B'), notes: [] },
  'R-200': { zone: 'R-200', lotAreaSqFt: 20000, lotWidthFt: 100, frontFt: 40, sideFt: 12, sideSumFt: 25, rearFt: 30, coveragePct: 25, heightFt: 40, citation: MC('4.4.7.B'),
    notes: ['Height is by lot area: 35 ft under 15,000 SF, 40 ft to 25,000, 45 ft to 40,000, 50 ft above (to the highest point of any roof).', MC_EBL, MC_INFILL] },
  'R-90': { zone: 'R-90', lotAreaSqFt: 9000, lotWidthFt: 75, frontFt: 30, sideFt: 8, sideSumFt: 25, rearFt: 25, coveragePct: 30, heightFt: 35, citation: MC('4.4.8.B'), notes: [MC_PITCHED, MC_EBL, MC_INFILL] },
  'R-60': { zone: 'R-60', lotAreaSqFt: 6000, lotWidthFt: 60, frontFt: 25, sideFt: 8, sideSumFt: 18, rearFt: 20, coveragePct: 35, heightFt: 35, citation: MC('4.4.9.B'), notes: [MC_PITCHED, MC_EBL, MC_INFILL] },
  'R-40': { zone: 'R-40', lotAreaSqFt: 6000, lotWidthFt: 60, frontFt: 25, sideFt: 8, sideSumFt: 18, rearFt: 20, coveragePct: 35, heightFt: 35, citation: MC('4.4.10.B'), notes: [MC_PITCHED, MC_EBL, MC_INFILL] },
}

export const FAIRFAX_STANDARDS: Record<string, CountyZoneStandard> = {
  'R-A': { zone: 'R-A', lotAreaSqFt: 217800, lotWidthFt: 200, frontFt: 60, sideFt: 50, sideSumFt: null, rearFt: 50, coveragePct: null, heightFt: 35, citation: FFX('2102.1'), notes: [] },
  'R-C': { zone: 'R-C', lotAreaSqFt: 217800, lotWidthFt: 200, frontFt: 40, sideFt: 20, sideSumFt: null, rearFt: 25, coveragePct: null, heightFt: 35, citation: FFX('2102.2'),
    notes: ['A dwelling taller than 35 ft (to 40 ft) requires 50 ft setbacks, note [3]. Lots rezoned R-C in July/August 1982 may keep their prior setbacks, note [4].'] },
  'R-E': { zone: 'R-E', lotAreaSqFt: 75000, lotWidthFt: 200, frontFt: 50, sideFt: 20, sideSumFt: null, rearFt: 25, coveragePct: null, heightFt: 35, citation: FFX('2102.3'),
    notes: ['A dwelling taller than 35 ft (to 40 ft) requires 50 ft setbacks, note [3].'] },
  'R-1': { zone: 'R-1', lotAreaSqFt: 36000, lotWidthFt: 150, frontFt: 40, sideFt: 20, sideSumFt: null, rearFt: 25, coveragePct: null, heightFt: 35, citation: FFX('2102.4'), notes: [] },
  'R-2': { zone: 'R-2', lotAreaSqFt: 15000, lotWidthFt: 100, frontFt: 35, sideFt: 15, sideSumFt: null, rearFt: 25, coveragePct: null, heightFt: 35, citation: FFX('2102.5'), notes: ['Average lot area 18,000 SF across a subdivision.'] },
  'R-3': { zone: 'R-3', lotAreaSqFt: 10500, lotWidthFt: 80, frontFt: 30, sideFt: 12, sideSumFt: null, rearFt: 25, coveragePct: null, heightFt: 35, citation: FFX('2102.7'), notes: ['Average lot area 11,500 SF across a subdivision.'] },
  'R-4': { zone: 'R-4', lotAreaSqFt: 8400, lotWidthFt: 70, frontFt: 30, sideFt: 10, sideSumFt: null, rearFt: 25, coveragePct: null, heightFt: 35, citation: FFX('2102.9'), notes: ['Average lot area 8,800 SF across a subdivision.'] },
  'R-5': { zone: 'R-5', lotAreaSqFt: 5000, lotWidthFt: 50, frontFt: 20, sideFt: 8, sideSumFt: null, rearFt: 25, coveragePct: null, heightFt: 35, citation: FFX('2102.11'), notes: ['Single-family detached column.'] },
  'R-8': { zone: 'R-8', lotAreaSqFt: 5000, lotWidthFt: 50, frontFt: 20, sideFt: 8, sideSumFt: null, rearFt: 25, coveragePct: null, heightFt: 35, citation: FFX('2102.13'), notes: ['Single-family detached column.'] },
}

const ARL_FRONT = 'Front 25 ft from the right-of-way line; reducible to the average of the frontage (not below 15 ft; garage 18 ft) on Zoning Administrator approval of a plat, §3.2.6.A.1(e).'
const arlSide = (width: number) =>
  `Side 10 ft, one may be 8 ft; both together at least 30% of the ${width} ft required lot width, §3.2.6.A.2(b).`
const arl = (zone: string, section: string, area: number, width: number, coverage: number, footprintPct: number, footprintCap: number): CountyZoneStandard => ({
  zone, lotAreaSqFt: area, lotWidthFt: width, frontFt: 25,
  // Drawn equal: the larger of 10 ft and half the 30% aggregate.
  sideFt: Math.max(10, Math.round((0.3 * width) / 2 * 10) / 10),
  sideSumFt: Math.round(0.3 * width * 10) / 10,
  rearFt: 25, coveragePct: coverage, heightFt: 35, citation: ARL(section),
  notes: [
    ARL_FRONT, arlSide(width),
    `Main building footprint limited to ${footprintPct}% of the lot and ${footprintCap.toLocaleString()} SF (more with a front porch), §3.2.5.A.`,
  ],
})

export const ARLINGTON_STANDARDS: Record<string, CountyZoneStandard> = {
  'R-20': arl('R-20', '5.2', 20000, 100, 25, 16, 4480),
  'R-10': arl('R-10', '5.3', 10000, 80, 32, 25, 3500),
  'R-8': arl('R-8', '5.5', 8000, 70, 35, 25, 2800),
  'R-6': arl('R-6', '5.6', 6000, 60, 40, 30, 2520),
  'R-5': arl('R-5', '5.7', 5000, 50, 45, 34, 2380),
  'R2-7': arl('R2-7', '5.9', 5000, 50, 40, 30, 2520),
}

const TABLES: Record<string, Record<string, CountyZoneStandard>> = {
  montgomery_md: MONTGOMERY_STANDARDS,
  fairfax_va: FAIRFAX_STANDARDS,
  arlington_va: ARLINGTON_STANDARDS,
}

/** "R60", "R-60", "r-60 " → "R-60". The map layers spell zones both ways. */
export function normaliseCountyZone(raw: string): string {
  const z = raw.trim().toUpperCase().replace(/\s+/g, '')
  if (/^R2-?7$/.test(z)) return 'R2-7'
  const m = z.match(/^(RE|R)-?(\d+C?|[A-Z])$/)
  return m ? `${m[1]}-${m[2]}` : z
}

export function countyStandard(code: string, zone: string): CountyZoneStandard | null {
  return TABLES[code]?.[normaliseCountyZone(zone)] ?? null
}

/** The front setback to draw, with a measured contextual line where the ordinance has one. */
export function countyFrontSetback(
  code: string, std: CountyZoneStandard,
  measured: { averageFt: number | null; applies: boolean; sampleCount: number; basis: string } | null,
): { ft: number; basis: string } {
  if (code === 'montgomery_md' && measured?.applies && measured.averageFt != null && measured.averageFt > std.frontFt) {
    return {
      ft: measured.averageFt,
      basis: `Established Building Line §4.4.1.A: average ${measured.averageFt} ft of ${measured.sampleCount} detached houses (${measured.basis}); zone minimum ${std.frontFt} ft`,
    }
  }
  const tail = code === 'montgomery_md' && measured
    ? `; Established Building Line ${measured.applies ? 'applies but does not exceed the minimum' : 'does not apply'} (${measured.sampleCount} houses measured)`
    : ''
  return { ft: std.frontFt, basis: `${std.frontFt} ft (${std.citation})${tail}` }
}

/** The standards as the engine's rows (same shape as DC's). */
export function countyStandardRows(std: CountyZoneStandard, front: { ft: number; basis: string }): DcStandardRow[] {
  const use = 'Single-Family Detached Dwelling'
  const side = std.sideSumFt != null ? Math.max(std.sideFt, std.sideSumFt / 2) : std.sideFt
  const r = (standard: string, numeric: number | null, printed: string): DcStandardRow =>
    ({ standard, useColumn: use, printed, numeric, footnotes: [] })
  return [
    r('Front yard depth', front.ft, front.basis),
    r('Side yard depth', side, std.sideSumFt != null
      ? `${std.sideFt} ft minimum, ${std.sideSumFt} ft both sides together; drawn ${side} ft each (${std.citation})`
      : `${std.sideFt} ft (${std.citation})`),
    r('Rear yard depth', std.rearFt, `${std.rearFt} ft (${std.citation})`),
    ...(std.coveragePct != null ? [r('Lot coverage', std.coveragePct, `${std.coveragePct}% (${std.citation})`)] : []),
    r('Maximum height (ft)', std.heightFt, `${std.heightFt} ft (${std.citation})`),
    r('Minimum lot width (ft)', std.lotWidthFt, `${std.lotWidthFt} ft (${std.citation})`),
    r('Minimum lot area (sq ft)', std.lotAreaSqFt, `${std.lotAreaSqFt.toLocaleString()} SF (${std.citation})`),
  ]
}
