/**
 * Indian Queen East — where the water goes, and what it takes to move it.
 *
 * Answers three questions with numbers rather than adjectives:
 *
 *   1. If the floodplain is mitigated, where is the water displaced TO?
 *   2. Should these houses have basements?
 *   3. What would actually get all four lots out of the floodplain?
 *
 * and designs the compensatory storage that any fill option requires.
 *
 *   npx tsx packages/spatial-engine/scripts/floodplain-mitigation.ts
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  type StageRow,
  routeLevelPool,
  scsRunoffHydrograph,
} from '../src/hydraulics/scs-hydrograph'
import {
  type CulvertBarrel,
  RCP_GROOVE_END_HEADWALL,
  RCP_SQUARE_EDGE_HEADWALL,
  BOX_SQUARE_EDGE_HEADWALL,
  analyseCulvert,
} from '../src/hydraulics/culvert-hds5'
import { FORT_FOOTE_24HR_DEPTH_IN } from '../src/hydraulics/tr55'

const PROJ = join(process.cwd(), 'projects', 'indian-queen')
const R = JSON.parse(readFileSync(join(PROJ, 'model', 'indian-queen.floodplain-study-results.json'), 'utf8'))
const SS = JSON.parse(readFileSync(join(PROJ, 'model', 'indian-queen.stage-storage.json'), 'utf8'))
const INU = JSON.parse(readFileSync(join(PROJ, 'model', 'indian-queen.floodplain-inundation.json'), 'utf8'))
const TWIN = JSON.parse(readFileSync(join(PROJ, 'drawings', 'indian-queen-lots-53-56.twin.json'), 'utf8'))

const f = (n: number, d = 2) => n.toFixed(d)
const n0 = (n: number) => Math.round(n).toLocaleString('en-US')

const AREA_SQMI = R.hydrology.watershed.sqMi
const CN = R.hydrology.curveNumber.curveNumber
const TC = R.hydrology.timeOfConcentration.tcHr
const ROAD_EL: number = R.crossing.roadSagElFt
const CREST_FT: number = R.crossing.crestLengthFt
const INV_UP: number = R.crossing.assumedBarrel.inletInvertFt
const INV_DN: number = R.crossing.assumedBarrel.outletInvertFt
const TW100: number = R.existing[3].tailwaterElFt

// ── Crossing options ───────────────────────────────────────────────────────
interface Option {
  label: string
  barrel: CulvertBarrel
  /** Extra weir crest if the road is raised; null keeps the existing sag. */
  roadElFt?: number
}
const circular = (sizeIn: number, barrels = 1, inlet = RCP_GROOVE_END_HEADWALL): CulvertBarrel => ({
  shape: 'circular', riseFt: sizeIn / 12, barrels, lengthFt: 80, manningN: 0.013,
  inletInvertFt: INV_UP, outletInvertFt: INV_DN, inlet,
})
const boxCulvert = (spanFt: number, riseFt: number, barrels = 1): CulvertBarrel => ({
  shape: 'box', riseFt, spanFt, barrels, lengthFt: 80, manningN: 0.013,
  inletInvertFt: INV_UP, outletInvertFt: INV_DN, inlet: BOX_SQUARE_EDGE_HEADWALL,
})

const OPTIONS: Option[] = [
  { label: 'EXISTING 36 in RCP (assumed)', barrel: circular(36, 1, RCP_SQUARE_EDGE_HEADWALL) },
  { label: '48 in RCP', barrel: circular(48) },
  { label: '72 in RCP', barrel: circular(72) },
  { label: 'twin 72 in RCP', barrel: circular(72, 2) },
  { label: '8 x 6 ft box', barrel: boxCulvert(8, 6) },
  { label: '10 x 8 ft box', barrel: boxCulvert(10, 8) },
  { label: 'twin 10 x 8 ft box', barrel: boxCulvert(10, 8, 2) },
  { label: '20 x 8 ft box (bridge-class)', barrel: boxCulvert(20, 8) },
  { label: 'twin 20 x 8 ft box', barrel: boxCulvert(20, 8, 2) },
]

/** Stage-discharge for a crossing: culvert at that head, plus roadway weir. */
function rating(opt: Option): StageRow[] {
  const roadEl = opt.roadElFt ?? ROAD_EL
  const rows: StageRow[] = []
  for (const row of SS.existing as [number, number, number][]) {
    const el = row[0]
    const storage = row[2]
    // Culvert discharge at this headwater: invert the headwater relation.
    let lo = 0
    let hi = 4000
    for (let k = 0; k < 50; k++) {
      const mid = (lo + hi) / 2
      const hw = analyseCulvert({ barrel: opt.barrel, dischargeCfs: mid, tailwaterElFt: TW100 }).headwaterElFt
      if (hw < el) lo = mid
      else hi = mid
    }
    const culvert = (lo + hi) / 2
    const head = el - roadEl
    const weir = head > 0 ? 2.9 * CREST_FT * Math.pow(head, 1.5) : 0
    rows.push({ elevationFt: el, storageCuFt: storage, outflowCfs: culvert + weir })
  }
  return rows
}

// ── Route each option at each storm ────────────────────────────────────────
const STORMS = [10, 25, 50, 100] as const
const routed: Record<string, Record<number, ReturnType<typeof routeLevelPool>>> = {}
const hydro: Record<number, ReturnType<typeof scsRunoffHydrograph>> = {}

for (const p of STORMS) {
  hydro[p] = scsRunoffHydrograph({
    areaSqMi: AREA_SQMI, curveNumber: CN, rainfall24hrIn: FORT_FOOTE_24HR_DEPTH_IN[p], tcHr: TC,
  })
}
for (const opt of OPTIONS) {
  const rt = rating(opt)
  routed[opt.label] = {}
  for (const p of STORMS) routed[opt.label][p] = routeLevelPool({ inflow: hydro[p], rating: rt })
}

console.log('=== INFLOW HYDROGRAPHS (SCS Type II, 24-hr) ===')
for (const p of STORMS) {
  const h = hydro[p]
  console.log(`  ${p}-yr  peak ${n0(h.peakCfs)} cfs at t=${f(h.peakTimeHr, 2)} hr,  volume ${f(h.volumeAcFt, 1)} ac-ft`)
}

console.log('\n=== WHAT THE ROAD EMBANKMENT IS DOING (100-year) ===')
{
  const ex = routed[OPTIONS[0].label][100]
  console.log(`  inflow peak            ${n0(ex.inflowPeakCfs)} cfs`)
  console.log(`  outflow peak           ${n0(ex.outflowPeakCfs)} cfs`)
  console.log(`  attenuation            ${f(100 * (1 - ex.attenuation), 1)}% of the peak is held back`)
  console.log(`  peak stage             EL ${f(ex.peakStageFt)}`)
  console.log(`  storage at peak        ${f(ex.peakStorageAcFt, 2)} ac-ft`)
  console.log(`  outflow peak lags by   ${f(ex.lagHr, 2)} hr`)
}

console.log('\n=== CROSSING OPTIONS — ROUTED, 100-YEAR ===')
console.log('  option                          peak stage   storage    outflow peak   vs existing   road overtops?')
const exOut = routed[OPTIONS[0].label][100].outflowPeakCfs
for (const opt of OPTIONS) {
  const r = routed[opt.label][100]
  const over = r.peakStageFt > (opt.roadElFt ?? ROAD_EL)
  console.log(`  ${opt.label.padEnd(30)}  EL ${f(r.peakStageFt).padStart(6)}  ` +
    `${f(r.peakStorageAcFt, 1).padStart(5)} af  ${n0(r.outflowPeakCfs).padStart(8)} cfs  ` +
    `${(r.outflowPeakCfs - exOut >= 0 ? '+' : '') + n0(r.outflowPeakCfs - exOut)} cfs`.padStart(14) +
    `   ${over ? `YES by ${f(r.peakStageFt - (opt.roadElFt ?? ROAD_EL))} ft` : 'no'}`)
}

// ── What stage would clear each lot? ───────────────────────────────────────
console.log('\n=== WHAT WATER SURFACE WOULD TAKE EACH LOT OUT OF THE FLOODPLAIN? ===')
const model = JSON.parse(readFileSync(join(PROJ, 'model', 'indian-queen.floodplain-model-input.json'), 'utf8'))
const lotMin: Record<string, number> = {}
for (const [addr, ring] of Object.entries(model.lots as Record<string, [number, number][]>)) {
  // lowest modelled ground inside the lot, from the cross sections that cross it
  let lo = Infinity
  for (const s of model.sections) {
    for (const [off, el] of s.existing as [number, number][]) {
      const x = s.x + s.nx * off
      const y = s.y + s.ny * off
      let inside = false
      const r = ring as number[][]
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        if ((r[i][1] > y) !== (r[j][1] > y) &&
            x < ((r[j][0] - r[i][0]) * (y - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) inside = !inside
      }
      if (inside && el < lo) lo = el
    }
  }
  lotMin[addr] = lo
}
const LOTNO: Record<string, string> = {
  '9588 Fort Foote Rd': '53', '9584 Fort Foote Rd': '54',
  '9580 Fort Foote Rd': '55', '9576 Fort Foote Rd': '56',
}
for (const [addr, lo] of Object.entries(lotMin)) {
  console.log(`  LOT ${LOTNO[addr]}  lowest ground EL ${f(lo)}  ->  water surface must fall below EL ${f(lo)} ` +
    `(a drop of ${f(R.existing[3].headwaterElFt - lo)} ft from the present 100-yr EL ${f(R.existing[3].headwaterElFt)})`)
}
const tailFloor = TW100
console.log(`\n  FLOOR ON ANY DROP: the tailwater below the road at Q100 is EL ${f(tailFloor)}. ` +
  `The water surface upstream cannot be lowered below that by ANY crossing, because\n` +
  `  the receiving channel is already that high. The best case is EL ${f(tailFloor)} and the crossing would have to be open.`)

// ── Compensatory storage design ────────────────────────────────────────────
console.log('\n=== COMPENSATORY STORAGE — WHAT IS REQUIRED ===')
const lostCy = INU['100'].reachLostStorageCy
const wsel = INU['100'].wselProposed
console.log(`  Fill below the 100-yr surface, as currently graded: ${n0(lostCy)} cy (${f(lostCy * 27 / 43560, 2)} ac-ft)`)
console.log(`  Design surface EL ${f(wsel)}`)
// available cut: area between the flood surface and the lots' rear ground
const stage = SS.existing as [number, number, number][]
const areaAt = (el: number): number => {
  for (let i = 0; i < stage.length - 1; i++) {
    if (el >= stage[i][0] && el <= stage[i + 1][0]) {
      const t = (el - stage[i][0]) / (stage[i + 1][0] - stage[i][0])
      return stage[i][1] + (stage[i + 1][1] - stage[i][1]) * t
    }
  }
  return stage[stage.length - 1][1]
}
console.log(`  Pond water-surface area at that stage: ${f(areaAt(wsel) / 43560, 2)} ac`)
for (const depth of [1, 2, 3]) {
  const needSf = (lostCy * 27) / depth
  console.log(`    at ${depth} ft of excavation, the cut must cover ${n0(needSf)} sq ft = ${f(needSf / 43560, 2)} ac`)
}

// ── Basement determination ─────────────────────────────────────────────────
console.log('\n=== BASEMENTS ===')
const bldg = TWIN.features.filter((x: any) => x.kind === 'Building').map((b: any) => {
  const r = (b.ring?.coordinates ?? b.ring) as number[][]
  return { cx: r.reduce((s: number, q: number[]) => s + q[0], 0) / r.length, ...b.attributes }
}).sort((a: any, b: any) => b.cx - a.cx)
const lots = ['53', '54', '55', '56']
bldg.forEach((b: any, i: number) => {
  const needFF = wsel + 2
  const bsmt = b.basementElevFt == null
    ? `no basement proposed (${b.foundationType ?? 'elevated'} foundation)`
    : `basement EL ${f(b.basementElevFt)} is ${f(wsel - b.basementElevFt)} ft below the 100-yr surface`
  console.log(`  LOT ${lots[i]}  ${bsmt}; ` +
    `FF ${f(b.finishedFloorElevFt)} vs required ${f(needFF)} (BFE + 2 ft) -> ` +
    `${b.finishedFloorElevFt >= needFF ? 'FF OK' : `FF SHORT BY ${f(needFF - b.finishedFloorElevFt)} ft`}`)
})

const out = {
  generatedAt: new Date().toISOString(),
  inflow: Object.fromEntries(STORMS.map(p => [p, {
    peakCfs: hydro[p].peakCfs, peakTimeHr: hydro[p].peakTimeHr, volumeAcFt: hydro[p].volumeAcFt,
  }])),
  routed: Object.fromEntries(OPTIONS.map(o => [o.label, Object.fromEntries(STORMS.map(p => {
    const r = routed[o.label][p]
    return [p, {
      peakStageFt: r.peakStageFt, peakStorageAcFt: r.peakStorageAcFt,
      outflowPeakCfs: r.outflowPeakCfs, inflowPeakCfs: r.inflowPeakCfs,
      attenuation: r.attenuation, lagHr: r.lagHr,
      overtopsBy: r.peakStageFt - ROAD_EL,
    }]
  }))])),
  lotLowestGroundFt: lotMin,
  tailwaterFloorFt: tailFloor,
  compensatoryStorage: {
    requiredCy: lostCy, requiredAcFt: lostCy * 27 / 43560, designSurfaceFt: wsel,
    cutAreaByDepthSqFt: Object.fromEntries([1, 2, 3].map(d => [d, (lostCy * 27) / d])),
  },
}
writeFileSync(join(PROJ, 'model', 'indian-queen.mitigation-analysis.json'), JSON.stringify(out, null, 1))
console.log('\nwrote projects/indian-queen/model/indian-queen.mitigation-analysis.json')
