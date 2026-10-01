/**
 * Environmental Site Design to the Maximum Extent Practicable — the sizing a
 * Prince George's DPIE Site Development Concept Plan is reviewed against.
 *
 * This is what changed between a 2009 approval and a 2026 one. The 2007
 * Stormwater Management Act and the 2009 Maryland Stormwater Design Manual,
 * Chapter 5, replaced "treat the first inch" with a RAINFALL TARGET: the depth
 * P_E at which the developed site's runoff curve number falls to that of woods
 * in good condition. The target rises with imperviousness and falls with soil
 * permeability, so it is read from Table 5.3 for the drainage area's hydrologic
 * soil group and percent impervious — not assumed at 1.0 in.
 *
 *   Rv    = 0.05 + 0.009 · I                      (I in percent)
 *   ESDv  = P_E · Rv · A / 12                     (cubic feet, A in square feet)
 *   Rev   = S · Rv · A / 12                       (S: A 0.38, B 0.26, C 0.13, D 0.07 in)
 *
 * Source: MDE, 2000 Maryland Stormwater Design Manual, Supplement 1 (2009),
 * Chapter 5, Table 5.3 "Rainfall Targets/Runoff Curve Number Reductions used
 * for ESD", pp. 5.21–5.22 (docs/site-plan-reference/mde/). Each row below is
 * the first P_E at which the row's reduced RCN reaches woods in good condition
 * (A 38, B 55, C 70, D 77), read cell by cell from the published table. Where a
 * row never reaches it inside the table the largest tabulated P_E (2.6 in) is
 * returned and `targetMet` is false — that residue goes to structural practices.
 */

export type HydrologicSoilGroup = 'A' | 'B' | 'C' | 'D'

/** [percent impervious upper bound, target P_E in inches] per HSG. */
const TABLE_5_3: Record<HydrologicSoilGroup, [number, number][]> = {
  A: [[15, 1.0], [20, 1.2], [25, 1.6], [30, 1.6], [35, 1.8], [40, 1.8], [45, 1.8], [50, 1.8], [55, 2.0],
      [60, 2.0], [65, 2.2], [70, 2.2], [75, 2.2], [80, 2.4], [85, 2.4], [90, 2.6], [95, 2.6], [100, 2.6]],
  B: [[15, 1.0], [20, 1.2], [25, 1.6], [30, 1.6], [35, 1.8], [40, 1.8], [45, 1.8], [50, 1.8], [55, 1.8],
      [60, 2.0], [65, 2.0], [70, 2.2], [75, 2.2], [80, 2.2], [85, 2.2], [90, 2.4], [95, 2.6], [100, 2.6]],
  C: [[20, 1.0], [25, 1.2], [30, 1.6], [35, 1.6], [40, 1.8], [45, 1.8], [50, 1.8], [55, 1.8], [60, 2.0],
      [65, 2.0], [70, 2.0], [75, 2.0], [80, 2.0], [85, 2.0], [90, 2.0], [95, 2.2], [100, 2.2]],
  D: [[20, 1.0], [25, 1.2], [30, 1.2], [35, 1.6], [40, 1.6], [45, 1.8], [50, 1.8], [55, 1.8], [60, 1.8],
      [65, 1.8], [70, 1.8], [75, 1.8], [80, 1.8], [85, 1.8], [90, 1.8], [95, 2.0], [100, 2.0]],
}

/** Soil specific recharge factor S, inches (MDE Manual Ch. 2, Rev). */
export const RECHARGE_FACTOR_IN: Record<HydrologicSoilGroup, number> = { A: 0.38, B: 0.26, C: 0.13, D: 0.07 }

export const MDE_TABLE_5_3_CITATION =
  'MDE Stormwater Design Manual (2000, Supp. 1 2009), Ch. 5, Table 5.3 — rainfall targets for ESD'

/**
 * Target rainfall P_E for a drainage area. `percentImpervious` is taken at the
 * NEXT TABULATED ROW UP — the conservative reading; the Manual permits
 * interpolation, which a reviewer may accept but never requires.
 */
export function rainfallTargetPe(percentImpervious: number, hsg: HydrologicSoilGroup): {
  peIn: number; row: number; targetMet: boolean
} {
  const rows = TABLE_5_3[hsg]
  const I = Math.max(0, Math.min(100, percentImpervious))
  for (const [lim, pe] of rows) {
    if (I <= lim + 1e-9) return { peIn: pe, row: lim, targetMet: true }
  }
  return { peIn: rows[rows.length - 1][1], row: 100, targetMet: false }
}

export interface EsdSizing {
  areaSqFt: number
  imperviousSqFt: number
  percentImpervious: number
  hsg: HydrologicSoilGroup
  peIn: number
  rv: number
  esdvCf: number
  revCf: number
  citation: string
}

/** ESD volume and recharge volume for one drainage area. */
export function sizeEsd(areaSqFt: number, imperviousSqFt: number, hsg: HydrologicSoilGroup): EsdSizing {
  const I = areaSqFt > 0 ? (100 * imperviousSqFt) / areaSqFt : 0
  const { peIn } = rainfallTargetPe(I, hsg)
  const rv = 0.05 + 0.009 * I
  return {
    areaSqFt, imperviousSqFt, percentImpervious: Number(I.toFixed(1)), hsg,
    peIn, rv: Number(rv.toFixed(4)),
    esdvCf: Math.round((peIn * rv * areaSqFt) / 12),
    revCf: Math.round((RECHARGE_FACTOR_IN[hsg] * rv * areaSqFt) / 12),
    citation: MDE_TABLE_5_3_CITATION,
  }
}

/**
 * The governing hydrologic soil group for a drainage area: the least permeable
 * group covering it, with dual groups (B/D, C/D) read as their drained class
 * only where an underdrain is provided — here, conservatively, the second
 * letter.
 */
export function governingHsg(groups: (string | null | undefined)[]): HydrologicSoilGroup {
  const order: HydrologicSoilGroup[] = ['A', 'B', 'C', 'D']
  let worst = 0
  for (const g of groups) {
    if (!g) continue
    const letter = g.includes('/') ? g.split('/').pop()! : g
    const i = order.indexOf(letter.trim().toUpperCase() as HydrologicSoilGroup)
    if (i > worst) worst = i
  }
  return order[worst]
}
