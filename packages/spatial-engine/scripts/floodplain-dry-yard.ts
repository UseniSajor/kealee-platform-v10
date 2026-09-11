/**
 * How much storage would be needed to keep the rear yards out of the water.
 *
 * The question has a definite answer and it is worth computing rather than
 * asserting, because the number decides whether the rest of the project is
 * worth pursuing.
 *
 * Method: the reach behind Fort Foote Road is a reservoir. For a target peak
 * stage H the crossing can pass Q_out(H) and no more, so everything arriving
 * above that rate has to be held. The storage required is the largest
 * cumulative volume of (inflow − Q_out(H)) over the storm — the standard
 * mass-curve construction, and the same one used to size a detention basin
 * from a hydrograph.
 *
 *   npx tsx packages/spatial-engine/scripts/floodplain-dry-yard.ts
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { scsRunoffHydrograph } from '../src/hydraulics/scs-hydrograph'
import {
  type CulvertBarrel,
  RCP_SQUARE_EDGE_HEADWALL,
  analyseCulvert,
} from '../src/hydraulics/culvert-hds5'
import { FORT_FOOTE_24HR_DEPTH_IN } from '../src/hydraulics/tr55'

const PROJ = join(process.cwd(), 'projects', 'indian-queen')
const R = JSON.parse(readFileSync(join(PROJ, 'model', 'indian-queen.floodplain-study-results.json'), 'utf8'))
const SS = JSON.parse(readFileSync(join(PROJ, 'model', 'indian-queen.stage-storage.json'), 'utf8'))
const MIT = JSON.parse(readFileSync(join(PROJ, 'model', 'indian-queen.mitigation-analysis.json'), 'utf8'))

const f = (n: number, d = 2) => n.toFixed(d)
const n0 = (n: number) => Math.round(n).toLocaleString('en-US')
const ACFT = 43560

const ROAD_EL: number = R.crossing.roadSagElFt
const CREST: number = R.crossing.crestLengthFt
const barrel: CulvertBarrel = {
  shape: 'circular', riseFt: 3, barrels: 1, lengthFt: 80, manningN: 0.013,
  inletInvertFt: R.crossing.assumedBarrel.inletInvertFt,
  outletInvertFt: R.crossing.assumedBarrel.outletInvertFt,
  inlet: RCP_SQUARE_EDGE_HEADWALL,
}
const TW: number = R.existing[3].tailwaterElFt

/** Total discharge the existing crossing passes at a given upstream stage. */
function outflowAt(stage: number): number {
  let lo = 0
  let hi = 4000
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (analyseCulvert({ barrel, dischargeCfs: mid, tailwaterElFt: TW }).headwaterElFt < stage) lo = mid
    else hi = mid
  }
  const culvert = (lo + hi) / 2
  const head = stage - ROAD_EL
  const weir = head > 0 ? 2.9 * CREST * Math.pow(head, 1.5) : 0
  return culvert + weir
}

/** Existing storage available below a stage, cubic feet. */
function storageAt(el: number): number {
  const rows = SS.existing as [number, number, number][]
  if (el <= rows[0][0]) return 0
  for (let i = 0; i < rows.length - 1; i++) {
    if (el >= rows[i][0] && el <= rows[i + 1][0]) {
      const t = (el - rows[i][0]) / (rows[i + 1][0] - rows[i][0])
      return rows[i][2] + (rows[i + 1][2] - rows[i][2]) * t
    }
  }
  return rows[rows.length - 1][2]
}

const STORMS = [10, 100] as const
const TARGETS = [46, 48, 50, 52, 54, 55.5]

console.log('=== STORAGE REQUIRED TO HOLD THE WATER SURFACE AT A TARGET STAGE ===')
console.log(`Existing crossing. Road sag EL ${f(ROAD_EL)}, ${f(CREST, 0)} ft of crest.\n`)

for (const p of STORMS) {
  const h = scsRunoffHydrograph({
    areaSqMi: R.hydrology.watershed.sqMi,
    curveNumber: R.hydrology.curveNumber.curveNumber,
    rainfall24hrIn: FORT_FOOTE_24HR_DEPTH_IN[p],
    tcHr: R.hydrology.timeOfConcentration.tcHr,
  })
  console.log(`${p}-YEAR — inflow peak ${n0(h.peakCfs)} cfs, volume ${f(h.volumeAcFt, 1)} ac-ft`)
  console.log('  target   crossing passes   storage REQUIRED      already there      SHORTFALL')
  for (const t of TARGETS) {
    const qOut = outflowAt(t)
    // Mass curve: the largest running total of inflow above the release rate.
    let run = 0
    let peak = 0
    for (const q of h.qCfs) {
      run += (q - qOut) * h.dtHr * 3600
      if (run < 0) run = 0
      if (run > peak) peak = run
    }
    const have = storageAt(t)
    const short = Math.max(0, peak - have)
    console.log(`  EL ${f(t, 1)}  ${n0(qOut).padStart(8)} cfs  ` +
      `${(f(peak / ACFT, 1) + ' ac-ft').padStart(14)}  ` +
      `${(f(have / ACFT, 1) + ' ac-ft').padStart(14)}  ` +
      `${(f(short / ACFT, 1) + ' ac-ft').padStart(14)}` +
      (short > 0 ? `  = ${n0(short / 27)} cy` : '  — already adequate'))
  }
  console.log()
}

// What that shortfall means as a physical excavation on 1.7 ac of lots
const lotAreaSf = 75178
console.log('=== WHAT THE 100-YEAR SHORTFALL WOULD MEAN ON THE GROUND ===')
const h100 = scsRunoffHydrograph({
  areaSqMi: R.hydrology.watershed.sqMi,
  curveNumber: R.hydrology.curveNumber.curveNumber,
  rainfall24hrIn: FORT_FOOTE_24HR_DEPTH_IN[100],
  tcHr: R.hydrology.timeOfConcentration.tcHr,
})
for (const t of [50, 52]) {
  const qOut = outflowAt(t)
  let run = 0
  let peak = 0
  for (const q of h100.qCfs) {
    run += (q - qOut) * h100.dtHr * 3600
    if (run < 0) run = 0
    if (run > peak) peak = run
  }
  const short = Math.max(0, peak - storageAt(t))
  console.log(`  To hold EL ${f(t, 1)}: ${f(short / ACFT, 1)} ac-ft short = ${n0(short / 27)} cy.`)
  console.log(`     Excavated across all four lots (${n0(lotAreaSf)} sq ft), that is ` +
    `${f(short / lotAreaSf, 1)} ft of depth over every square foot of all four properties.`)
}
console.log()
console.log('=== THE FLOOR NOBODY CAN GET BELOW ===')
console.log(`  Tailwater in the receiving channel at the 100-year: EL ${f(MIT.tailwaterFloorFt)}`)
const lows = MIT.lotLowestGroundFt as Record<string, number>
for (const [addr, lo] of Object.entries(lows)) {
  console.log(`  ${addr.replace(' Fort Foote Rd', '')} lowest rear ground EL ${f(lo)}` +
    (lo <= MIT.tailwaterFloorFt + 1 ? '  <- at or below the downstream water surface' : ''))
}
