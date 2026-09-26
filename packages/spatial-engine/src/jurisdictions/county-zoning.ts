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
  /**
   * A front setback set by the neighbours rather than by a number:
   *   contextual_range  — within the range of the abutting developed lots
   *                       sharing the frontage; never more than `capFt`
   *                       required (Alexandria §3-x06(A)(1)).
   *   established_line  — where more than half the lots on that side between
   *                       intersecting streets sit at a different setback,
   *                       conform to it up to `capFt` (Rockville §25.10.05.e.2).
   * `frontFt` is then the figure drawn when the neighbours cannot be measured.
   */
  frontRule?: { kind: 'contextual_range' | 'established_line'; capFt: number; citation: string }
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

// ── Cities, towns and further counties — transcribed 2026-09-25 ─────────────
//
// Each read from the jurisdiction's own current code: Municode's latest
// publication where the jurisdiction publishes there (date of the supplement
// in the citation), the County's attachment otherwise. Single-family detached
// standards only; every other zone is not drawn.

/**
 * Alexandria: side and rear yards are SETBACK RATIOS — horizontal distance to
 * the height of that part of the building (§2-193) — with a floor. Drawn at
 * the zone's 30 ft maximum height, which is the restrictive reading; a lower
 * wall may sit closer, by the ratio.
 */
const alx = (zone: string, section: string, area: number, width: number, cap: number,
  sideRatio: number, sideMin: number, rearMin: number): CountyZoneStandard => {
  const h = 30
  return {
    zone, lotAreaSqFt: area, lotWidthFt: width,
    frontFt: cap,
    sideFt: Math.max(sideMin, Math.round(h * sideRatio * 10) / 10), sideSumFt: null,
    rearFt: Math.max(rearMin, h), coveragePct: null, heightFt: h,
    citation: `Alexandria Zoning Ordinance §${section} (Municode, Supp. 103, 2026-08-14)`,
    notes: [
      `Side yards: setback ratio 1:${Math.round(1 / sideRatio)}, min ${sideMin} ft; rear 1:1, min ${rearMin} ft (§2-193). ` +
      'Drawn at the 30 ft maximum height; a lower wall may sit closer by the ratio.',
      'Floor area ratio, not lot coverage, limits bulk here; the FAR is a design check, not a line on the plan.',
    ],
    frontRule: { kind: 'contextual_range', capFt: cap, citation: `Alexandria Zoning Ordinance §${section}(A)(1); "contextual block face" §2-122.1` },
  }
}

export const ALEXANDRIA_STANDARDS: Record<string, CountyZoneStandard> = {
  'R-20': alx('R-20', '3-106', 20000, 100, 40, 1 / 2, 12, 12),
  'R-12': alx('R-12', '3-206', 12000, 80, 35, 1 / 2, 10, 10),
  'R-8': alx('R-8', '3-306', 8000, 65, 30, 1 / 2, 8, 8),
  'R-5': alx('R-5', '3-406', 5000, 50, 20, 1 / 3, 7, 7),
  'R-2-5': alx('R-2-5', '3-506', 5000, 50, 20, 1 / 3, 7, 7),
}

const CH = 'Charles County Code Ch. 297, Figure VI (Attachment 3, Supp. 8, Jul 2020)'
export const CHARLES_STANDARDS: Record<string, CountyZoneStandard> = {
  'RM': { zone: 'RM', lotAreaSqFt: 12000, lotWidthFt: 60, frontFt: 25, sideFt: 8, sideSumFt: 20, rearFt: 25, coveragePct: 35, heightFt: 36, citation: `${CH}-4`, notes: ['Residential row of the RM schedule.'] },
  'RH': { zone: 'RH', lotAreaSqFt: 8000, lotWidthFt: 50, frontFt: 20, sideFt: 8, sideSumFt: 20, rearFt: 25, coveragePct: 40, heightFt: 36, citation: `${CH}-4`, notes: ['Residential row of the RH schedule.'] },
  'RR': { zone: 'RR', lotAreaSqFt: 30000, lotWidthFt: 100, frontFt: 40, sideFt: 20, sideSumFt: 40, rearFt: 40, coveragePct: 25, heightFt: 36, citation: `${CH}-2`, notes: ['Residential row of the RR schedule.'] },
  'RC': { zone: 'RC', lotAreaSqFt: 130680, lotWidthFt: 120, frontFt: 50, sideFt: 30, sideSumFt: 60, rearFt: 50, coveragePct: null, heightFt: 36, citation: `${CH}-2`, notes: ['Residential row of the RC schedule (3 acres). Lots under 3 acres existing before 2000-10-31 have their own row.'] },
}

const RK = (z: string) => `City of Rockville Code §25.10.05 (Municode, 2026-08-06), ${z} row`
const rk = (zone: string, area: number, width: number, front: number, cap: number, side: number, rear: number, height: number, cov: number): CountyZoneStandard => ({
  zone, lotAreaSqFt: area, lotWidthFt: width, frontFt: front, sideFt: side, sideSumFt: null,
  rearFt: rear, coveragePct: cov, heightFt: height, citation: RK(zone),
  notes: ['Side yard where a street abuts is larger (table column "where street abuts").'],
  frontRule: { kind: 'established_line', capFt: cap, citation: 'City of Rockville Code §25.10.05.e.2' },
})
export const ROCKVILLE_STANDARDS: Record<string, CountyZoneStandard> = {
  'R-400': rk('R-400', 40000, 150, 50, 100, 20, 40, 40, 15),
  'R-200': rk('R-200', 20000, 100, 35, 100, 13, 35, 40, 25),
  'R-150': rk('R-150', 15000, 90, 35, 60, 13, 30, 40, 25),
  'R-90': rk('R-90', 9000, 80, 30, 60, 11, 25, 35, 25),
  'R-75': rk('R-75', 7500, 70, 25, 50, 9, 20, 35, 35),
  'R-60': rk('R-60', 6000, 60, 25, 50, 8, 20, 35, 35),
}

const GB = (s: string) => `City of Gaithersburg Code §${s} (Ord. O-5-24; Municode, 2026-07-17)`
export const GAITHERSBURG_STANDARDS: Record<string, CountyZoneStandard> = {
  'R-90': { zone: 'R-90', lotAreaSqFt: 7500, lotWidthFt: 50, frontFt: 20, sideFt: 5, sideSumFt: null, rearFt: 20, coveragePct: 50, heightFt: 38, citation: GB('24-3.3'), notes: ['Height 38 ft and 3 stories. Width is the minimum lot frontage.'] },
  'R-6': { zone: 'R-6', lotAreaSqFt: 3000, lotWidthFt: 30, frontFt: 10, sideFt: 10, sideSumFt: null, rearFt: 5, coveragePct: 50, heightFt: 38, citation: GB('24-3.4'), notes: ['"At least one side setback: 10 feet" — drawn 10 ft both sides, the restrictive reading.'] },
}

const VN = (s: string) => `Town of Vienna Code §${s} (Ord. of 2024-11-22; Municode, 2026-07-10)`
export const VIENNA_STANDARDS: Record<string, CountyZoneStandard> = {
  'RS-16': { zone: 'RS-16', lotAreaSqFt: 16000, lotWidthFt: 65, frontFt: 35, sideFt: 15, sideSumFt: null, rearFt: 35, coveragePct: 25, heightFt: 35, citation: VN('18-217'), notes: ['2.5 stories max. Corner side yard 25 ft.'] },
  'RS-12.5': { zone: 'RS-12.5', lotAreaSqFt: 12500, lotWidthFt: 65, frontFt: 30, sideFt: 15, sideSumFt: null, rearFt: 35, coveragePct: 25, heightFt: 35, citation: VN('18-218'), notes: ['2.5 stories max.'] },
  'RS-10': { zone: 'RS-10', lotAreaSqFt: 10000, lotWidthFt: 60, frontFt: 25, sideFt: 12, sideSumFt: null, rearFt: 35, coveragePct: 25, heightFt: 35, citation: VN('18-219'), notes: ['2.5 stories max.'] },
}

const HN = (s: string) => `Town of Herndon Code §${s} (Municode, 2026-09-04)`
export const HERNDON_STANDARDS: Record<string, CountyZoneStandard> = {
  'R-15': { zone: 'R-15', lotAreaSqFt: 15000, lotWidthFt: 90, frontFt: 45, sideFt: 15, sideSumFt: null, rearFt: 25, coveragePct: 25, heightFt: 35, citation: HN('78-30.1'), notes: ['Front may be reduced in the HP overlay (§78-60.3(e)); pipestem lots 35 ft.'] },
  'R-10': { zone: 'R-10', lotAreaSqFt: 10000, lotWidthFt: 75, frontFt: 35, sideFt: 10, sideSumFt: null, rearFt: 25, coveragePct: 25, heightFt: 35, citation: HN('78-30.2'), notes: ['Front may be reduced in the HP overlay; pipestem lots 25 ft.'] },
}

const FC = (d: string) => `City of Falls Church Code Ch. 48, Art. IV, ${d} (Municode, 2026-09-11)`
export const FALLS_CHURCH_STANDARDS: Record<string, CountyZoneStandard> = {
  'R-1A': { zone: 'R-1A', lotAreaSqFt: 11250, lotWidthFt: 75, frontFt: 30, sideFt: 15, sideSumFt: null, rearFt: 40, coveragePct: 25, heightFt: 35, citation: FC('Div. 2'), notes: ['Height the lesser of 35 ft or 2½ stories; impervious coverage 35%.'] },
  'R-1B': { zone: 'R-1B', lotAreaSqFt: 7500, lotWidthFt: 60, frontFt: 25, sideFt: 10, sideSumFt: null, rearFt: 30, coveragePct: 25, heightFt: 35, citation: FC('Div. 3'), notes: ['Height the lesser of 35 ft or 2½ stories.'] },
}

const HW = (s: string) => `Howard County Zoning Regulations §${s} (Municode, through Bill 3-2026)`
export const HOWARD_STANDARDS: Record<string, CountyZoneStandard> = {
  'R-20': { zone: 'R-20', lotAreaSqFt: 20000, lotWidthFt: 60, frontFt: 50, sideFt: 10, sideSumFt: null, rearFt: 30, coveragePct: null, heightFt: 34, citation: HW('108.0.D'), notes: ['Front 50 ft from a public street right-of-way; 30 ft where the street was constructed after 1993-10-18 — drawn at 50, the restrictive reading.'] },
  'R-12': { zone: 'R-12', lotAreaSqFt: 12000, lotWidthFt: 60, frontFt: 20, sideFt: 7.5, sideSumFt: null, rearFt: 30, coveragePct: null, heightFt: 34, citation: HW('109.0.D'), notes: ['Semi-detached: 15 ft one side.'] },
}

const PW = (s: string) => `Prince William County Code Ch. 32 (Zoning), §${s} (Municode, Supplement 46); height §32-300.05`
const PW_CORNER = 'Corner lot: 20 ft on the side abutting the side street; corner front and side yards are fixed at building permit.'
const PW_ABUT = 'Principal building 25 ft from a line shared with commercial/office zoning, 35 ft from industrial, or the §32-250.30 buffer if greater.'
export const PRINCE_WILLIAM_STANDARDS: Record<string, CountyZoneStandard> = {
  'A-1': { zone: 'A-1', lotAreaSqFt: 435600, lotWidthFt: 100, frontFt: 35, sideFt: 15, sideSumFt: null, rearFt: 25, coveragePct: null, heightFt: 35, citation: PW('32-301.05, 32-301.06'),
    notes: ['Front 35 ft from the front line, all streets and private access easements.', 'Side may be 10 ft where properties of similar acreage nearby have 10 ft side yards — drawn at 15.', 'New lots 10 acres; 1 acre under §25-6.'] },
  'SR-1': { zone: 'SR-1', lotAreaSqFt: 43560, lotWidthFt: 100, frontFt: 35, sideFt: 10, sideSumFt: null, rearFt: 25, coveragePct: 25, heightFt: 35, citation: PW('32-302.06, 32-302.07'), notes: [PW_CORNER, PW_ABUT] },
  'SR-3': { zone: 'SR-3', lotAreaSqFt: 130680, lotWidthFt: 100, frontFt: 35, sideFt: 10, sideSumFt: null, rearFt: 25, coveragePct: 25, heightFt: 35, citation: PW('32-302.16, 32-302.17'), notes: ['Front 35 ft from the front line and any side street.', PW_ABUT] },
  'SR-5': { zone: 'SR-5', lotAreaSqFt: 217800, lotWidthFt: 100, frontFt: 50, sideFt: 15, sideSumFt: null, rearFt: 25, coveragePct: 25, heightFt: 35, citation: PW('32-302.26, 32-302.27'), notes: [PW_CORNER, PW_ABUT] },
  'R-2': { zone: 'R-2', lotAreaSqFt: 20000, lotWidthFt: 100, frontFt: 35, sideFt: 10, sideSumFt: null, rearFt: 25, coveragePct: 30, heightFt: 35, citation: PW('32-303.05, 32-303.06'), notes: ['Lot width 80 ft on a cul-de-sac.', PW_CORNER, PW_ABUT] },
  'R-4': { zone: 'R-4', lotAreaSqFt: 10000, lotWidthFt: 70, frontFt: 30, sideFt: 10, sideSumFt: null, rearFt: 25, coveragePct: 40, heightFt: 35, citation: PW('32-303.14, 32-303.15'),
    notes: ['Frontage 70 ft (100 ft each street on a corner lot; 45 ft on a cul-de-sac arc with 70 ft at the setback line).', PW_CORNER, PW_ABUT] },
  // Cluster subdivisions — shown on the zoning map as R-2C / R-4C once the preliminary plan is approved.
  'R-2C': { zone: 'R-2C', lotAreaSqFt: 15000, lotWidthFt: 80, frontFt: 30, sideFt: 10, sideSumFt: null, rearFt: 25, coveragePct: 35, heightFt: 35, citation: PW('32-300.61 (cluster schedule)'),
    notes: ['Corner lot width 100 ft; 20 ft on the street side.', '15 ft from an access easement or private street serving five lots or fewer.', '35 ft from a development boundary abutting non-cluster single-family without 15 ft of open space.'] },
  'R-4C': { zone: 'R-4C', lotAreaSqFt: 7500, lotWidthFt: 60, frontFt: 25, sideFt: 10, sideSumFt: null, rearFt: 20, coveragePct: 45, heightFt: 35, citation: PW('32-300.61 (cluster schedule)'),
    notes: ['Corner lot width 80 ft; 20 ft on the street side.', '15 ft from an access easement or private street serving five lots or fewer.', '35 ft from a development boundary abutting non-cluster single-family without 15 ft of open space.'] },
}

const LC = (t: string) => `Loudoun County Zoning Ordinance (adopted 2023-12-13), Table ${t} (online ordinance, read 2026-09-26)`
const LC_OPTION = 'Drawn for the Suburban / Base Density option. A lot recorded under a cluster, compact-cluster or traditional design option has smaller yards — confirm the option on the record plat.'
const LC_SIDE = 'Side yards 12 ft on one side and 9 ft on the other. Either side may be the 12 ft one, so both are drawn at 12 ft — the reading that complies whichever side is chosen.'
const LC_ROAD = 'A greater Road Corridor Setback or Buffer under §7.04.02 governs where it applies.'
const LC_DENSITY = (d: string) => `No minimum lot size; density is capped at ${d}. The area shown is that density figure.`
export const LOUDOUN_STANDARDS: Record<string, CountyZoneStandard> = {
  'R-1': { zone: 'R-1', lotAreaSqFt: 40000, lotWidthFt: 175, frontFt: 35, sideFt: 12, sideSumFt: null, rearFt: 35, coveragePct: 25, heightFt: 40, citation: LC('2.02.05.01-1'), notes: [LC_SIDE, LC_OPTION, LC_ROAD] },
  'R-2': { zone: 'R-2', lotAreaSqFt: 20000, lotWidthFt: 60, frontFt: 25, sideFt: 12, sideSumFt: null, rearFt: 25, coveragePct: 40, heightFt: 40, citation: LC('2.02.05.01-1'), notes: [LC_DENSITY('1 dwelling per 20,000 SF'), LC_SIDE, LC_OPTION, LC_ROAD] },
  'R-3': { zone: 'R-3', lotAreaSqFt: 15000, lotWidthFt: 50, frontFt: 25, sideFt: 12, sideSumFt: null, rearFt: 25, coveragePct: 40, heightFt: 40, citation: LC('2.02.05.01-1'), notes: [LC_DENSITY('1 dwelling per 15,000 SF'), LC_SIDE, LC_OPTION, LC_ROAD] },
  'R-4': { zone: 'R-4', lotAreaSqFt: 10000, lotWidthFt: 50, frontFt: 25, sideFt: 9, sideSumFt: null, rearFt: 25, coveragePct: 35, heightFt: 40, citation: LC('2.02.05.02-1'), notes: [LC_DENSITY('1 dwelling per 10,000 SF'), LC_OPTION, LC_ROAD] },
  'R-8': { zone: 'R-8', lotAreaSqFt: 5445, lotWidthFt: 40, frontFt: 15, sideFt: 8, sideSumFt: null, rearFt: 25, coveragePct: 50, heightFt: 40, citation: LC('2.02.05.03-1'), notes: [LC_DENSITY('8 dwellings per acre'), 'Single-family detached figures.', LC_ROAD] },
  'CR-1': { zone: 'CR-1', lotAreaSqFt: 40000, lotWidthFt: 175, frontFt: 35, sideFt: 12, sideSumFt: null, rearFt: 50, coveragePct: 15, heightFt: 35, citation: LC('2.04.03.03-1'), notes: [LC_SIDE, LC_OPTION, LC_ROAD] },
  'CR-2': { zone: 'CR-2', lotAreaSqFt: 40000, lotWidthFt: 50, frontFt: 25, sideFt: 12, sideSumFt: null, rearFt: 50, coveragePct: 40, heightFt: 35, citation: LC('2.04.03.03-1'), notes: [LC_DENSITY('1 lot per 40,000 SF (base density)'), LC_SIDE, LC_OPTION, LC_ROAD] },
  'CR-3': { zone: 'CR-3', lotAreaSqFt: 40000, lotWidthFt: 50, frontFt: 25, sideFt: 12, sideSumFt: null, rearFt: 50, coveragePct: 40, heightFt: 35, citation: LC('2.04.03.03-1'), notes: [LC_DENSITY('1 lot per 40,000 SF (base density)'), LC_SIDE, LC_OPTION, LC_ROAD] },
  'CR-4': { zone: 'CR-4', lotAreaSqFt: 40000, lotWidthFt: 50, frontFt: 25, sideFt: 12, sideSumFt: null, rearFt: 50, coveragePct: 35, heightFt: 35, citation: LC('2.04.03.03-1'), notes: [LC_DENSITY('1 lot per 40,000 SF (base density)'), LC_SIDE, LC_OPTION, LC_ROAD] },
  'AR-1': { zone: 'AR-1', lotAreaSqFt: 871200, lotWidthFt: 175, frontFt: 35, sideFt: 25, sideSumFt: null, rearFt: 25, coveragePct: 25, heightFt: 35, citation: LC('2.04.01-1'),
    notes: ['Front 25 ft from the property line and 35 ft from a road right-of-way — drawn at 35.', 'Base density division (20 acres); principal/subordinate lots 80,000 SF; cluster lots 15 ft side, 20 ft rear.', 'Coverage 25%, of which only 10% may be residential.'] },
  'AR-2': { zone: 'AR-2', lotAreaSqFt: 1742400, lotWidthFt: 175, frontFt: 35, sideFt: 25, sideSumFt: null, rearFt: 25, coveragePct: 25, heightFt: 35, citation: LC('2.04.02-1'),
    notes: ['Front 25 ft from the property line and 35 ft from a road right-of-way — drawn at 35.', 'Base density division (40 acres); principal/subordinate lots 80,000 SF; cluster lots 15 ft side, 20 ft rear.', 'Coverage 25%, of which only 10% may be residential.'] },
  'A-3': { zone: 'A-3', lotAreaSqFt: 130680, lotWidthFt: 200, frontFt: 35, sideFt: 25, sideSumFt: null, rearFt: 25, coveragePct: 25, heightFt: 35, citation: LC('2.04.03.02-1'), notes: ['25 ft from any property line; 35 ft from any road right-of-way.'] },
  'A-10': { zone: 'A-10', lotAreaSqFt: 435600, lotWidthFt: 200, frontFt: 50, sideFt: 25, sideSumFt: null, rearFt: 25, coveragePct: 25, heightFt: 35, citation: LC('2.04.03.01-1'), notes: ['25 ft from any property line; 50 ft from any road right-of-way.', 'Cluster lots 3 acres.'] },
  'JLMA-1': { zone: 'JLMA-1', lotAreaSqFt: 20000, lotWidthFt: 50, frontFt: 35, sideFt: 9, sideSumFt: null, rearFt: 25, coveragePct: 25, heightFt: 40, citation: LC('2.05.01-1'), notes: [LC_ROAD] },
  'JLMA-2': { zone: 'JLMA-2', lotAreaSqFt: 10000, lotWidthFt: 50, frontFt: 15, sideFt: 8, sideSumFt: null, rearFt: 25, coveragePct: 40, heightFt: 40, citation: LC('2.05.01-1'), notes: [LC_ROAD] },
  'TR-10': { zone: 'TR-10', lotAreaSqFt: 435600, lotWidthFt: 0, frontFt: 20, sideFt: 7, sideSumFt: null, rearFt: 25, coveragePct: null, heightFt: 40, citation: LC('2.03.01-1'), notes: [LC_DENSITY('1 dwelling per 10 acres'), 'Setback adjacent to roads per §7.04.02.'] },
  'TR-3': { zone: 'TR-3', lotAreaSqFt: 130680, lotWidthFt: 0, frontFt: 12, sideFt: 7, sideSumFt: null, rearFt: 25, coveragePct: null, heightFt: 40, citation: LC('2.03.01-1'), notes: [LC_DENSITY('1 dwelling per 3 acres'), 'Setback adjacent to roads per §7.04.02.'] },
  'TR-1': { zone: 'TR-1', lotAreaSqFt: 40000, lotWidthFt: 0, frontFt: 10, sideFt: 5, sideSumFt: null, rearFt: 25, coveragePct: null, heightFt: 40, citation: LC('2.03.01-1'), notes: [LC_DENSITY('1 dwelling per 40,000 SF'), 'Setback adjacent to roads per §7.04.02.'] },
}

const TABLES: Record<string, Record<string, CountyZoneStandard>> = {
  montgomery_md: MONTGOMERY_STANDARDS,
  fairfax_va: FAIRFAX_STANDARDS,
  arlington_va: ARLINGTON_STANDARDS,
  alexandria_city_va: ALEXANDRIA_STANDARDS,
  charles_md: CHARLES_STANDARDS,
  rockville_md: ROCKVILLE_STANDARDS,
  gaithersburg_md: GAITHERSBURG_STANDARDS,
  vienna_va: VIENNA_STANDARDS,
  herndon_va: HERNDON_STANDARDS,
  falls_church_city_va: FALLS_CHURCH_STANDARDS,
  howard_md: HOWARD_STANDARDS,
  prince_william_va: PRINCE_WILLIAM_STANDARDS,
  loudoun_va: LOUDOUN_STANDARDS,
}

/** Jurisdictions whose single-family standards are transcribed here. */
export function hasTranscribedStandards(code: string): boolean {
  return Boolean(TABLES[code])
}

/** The zones transcribed for a jurisdiction, and the ordinance they cite. */
export function transcribedZones(code: string): { zones: string[]; source: string } | null {
  const t = TABLES[code]
  if (!t) return null
  const first = Object.values(t)[0]
  return { zones: Object.keys(t), source: first ? first.citation.replace(/,? ?(Table|§).*$/, '').trim() : '' }
}

/** "R60", "R-60", "r-60 " → "R-60". The map layers spell zones both ways. */
export function normaliseCountyZone(raw: string): string {
  const z = raw.trim().toUpperCase().replace(/\s+/g, '')
  if (/^R2-?7$/.test(z)) return 'R2-7'
  if (/^R-?2-5$/.test(z)) return 'R-2-5'
  const m = z.match(/^(RE|R)-?(\d+C?|[A-Z])$/)
  return m ? `${m[1]}-${m[2]}` : z
}

export function countyStandard(code: string, zone: string): CountyZoneStandard | null {
  const t = TABLES[code]
  if (!t) return null
  // The code as published first: Charles's "RM" is not "R-M". Then the
  // normalised spelling, for layers that drop the hyphen ("R60", "R 8").
  const exact = zone.trim().toUpperCase().replace(/\s+/g, '')
  // Last, a dash between the letters and the number: Loudoun's layer writes
  // "CR1", "JLMA2", "TR10" for the ordinance's CR-1, JLMA-2, TR-10.
  return t[exact] ?? t[normaliseCountyZone(zone)] ?? t[exact.replace(/^([A-Z]+)-?(\d)/, '$1-$2')] ?? null
}

/** The front setback to draw, with a measured contextual line where the ordinance has one. */
export function countyFrontSetback(
  code: string, std: CountyZoneStandard,
  measured: { averageFt: number | null; applies: boolean; sampleCount: number; basis: string; minFt?: number | null; medianFt?: number | null } | null,
): { ft: number; basis: string } {
  const rule = std.frontRule
  if (rule?.kind === 'contextual_range') {
    if (measured && measured.sampleCount >= 1 && measured.minFt != null) {
      const ft = Math.min(measured.minFt, rule.capFt)
      return { ft, basis: `${rule.citation}: within the abutting lots' range (min ${measured.minFt} ft, ${measured.sampleCount} measured; ${measured.basis}); no more than ${rule.capFt} ft required; drawn at ${ft} ft` }
    }
    return { ft: rule.capFt, basis: `${rule.citation}: abutting lots not measurable; drawn at the ${rule.capFt} ft cap — the range of the abutting lots governs and may be less` }
  }
  if (rule?.kind === 'established_line') {
    if (measured?.applies && measured.medianFt != null && measured.medianFt > std.frontFt) {
      const ft = Math.min(measured.medianFt, rule.capFt)
      return { ft, basis: `${rule.citation}: established setback ${measured.medianFt} ft on this block face (${measured.basis}), up to ${rule.capFt} ft; drawn at ${ft} ft` }
    }
    return { ft: std.frontFt, basis: `${std.frontFt} ft (${std.citation}); established setback ${measured ? 'not in effect on this block face' : 'not measured'} (${rule.citation})` }
  }
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
