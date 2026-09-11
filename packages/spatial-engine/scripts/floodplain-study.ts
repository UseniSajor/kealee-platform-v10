/**
 * Indian Queen East, Lots 53-56 — floodplain and hydraulic study.
 *
 * Runs the hydrology, the culvert, the existing and proposed water-surface
 * profiles and the floodplain delineation from one set of inputs, so the
 * report, the tables and the mapped limits cannot disagree with each other.
 *
 *   npx tsx packages/spatial-engine/scripts/floodplain-study.ts
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  type CrossSection,
  hydraulicsAt,
  invertOf,
  waterEdges,
} from '../src/hydraulics/cross-section'
import {
  type DownstreamBoundary,
  type ProfileResult,
  compareProfiles,
  solveProfile,
} from '../src/hydraulics/standard-step'
import {
  type CulvertBarrel,
  RCP_GROOVE_END_HEADWALL,
  RCP_SQUARE_EDGE_HEADWALL,
  analyseCulvert,
  outletScourCheck,
} from '../src/hydraulics/culvert-hds5'
import {
  FORT_FOOTE_24HR_DEPTH_IN,
  FORT_FOOTE_PRECIP_CITATION,
  type TcSegment,
  compositeCurveNumber,
  peakDischarge,
  timeOfConcentration,
} from '../src/hydraulics/tr55'

const OUT = join(process.cwd(), 'output', 'site-plans')
const model = JSON.parse(readFileSync(join(OUT, 'indian-queen.floodplain-model-input.json'), 'utf8'))

const RETURN_PERIODS = [10, 25, 50, 100] as const

// ── Hydrology ──────────────────────────────────────────────────────────────
// Cover fractions measured from the county's own 2023 impervious-surface and
// tree-canopy layers across the delineated watershed; soil groups from the
// NRCS soil survey. Curve numbers are TR-55 Table 2-2a (open space, good
// condition) and 2-2c (woods, good condition) by hydrologic soil group.
const SOIL = model.watershed.soilGroupPct as Record<string, number>
const soilFrac = (g: string): number => (SOIL[g] ?? 0) / 100
// B/D and C/D are dual-group hydric soils. Undrained is the design condition in
// a floodplain, so they are taken at the D value — the conservative reading and
// the one MDE expects where the soil is mapped as frequently flooded.
const fA = soilFrac('A')
const fB = soilFrac('B')
const fC = soilFrac('C')
const fD = soilFrac('D') + soilFrac('B/D') + soilFrac('C/D')

const byGroup = (a: number, b: number, c: number, d: number): number =>
  (fA * a + fB * b + fC * c + fD * d) / (fA + fB + fC + fD)

const impFrac = model.watershed.imperviousPct / 100
const canopyFrac = model.watershed.canopyPct / 100
const openFrac = Math.max(0, 1 - impFrac - canopyFrac)

const cn = compositeCurveNumber([
  { label: 'Impervious (roofs, roads, drives, walks)', fraction: impFrac, curveNumber: 98 },
  { label: 'Woods, good condition', fraction: canopyFrac, curveNumber: byGroup(30, 55, 70, 77) },
  { label: 'Open space / lawn, good condition', fraction: openFrac, curveNumber: byGroup(39, 61, 74, 80) },
])

const tcSegments: TcSegment[] = [
  { kind: 'sheet', label: 'Sheet flow, lawn/woods at the divide', lengthFt: 100, slopeFtPerFt: 0.0284, manningN: 0.24 },
  { kind: 'shallow', label: 'Shallow concentrated, unpaved', lengthFt: 1300, slopeFtPerFt: 0.0136, paved: false },
  { kind: 'channel', label: 'Channel, North Branch Broad Creek', lengthFt: 6424, slopeFtPerFt: 0.01363, manningN: 0.05, hydraulicRadiusFt: 1.2 },
]
const tc = timeOfConcentration(tcSegments, FORT_FOOTE_24HR_DEPTH_IN[2])

const areaSqMi = model.watershed.areaAc / 640
const flows = RETURN_PERIODS.map((yr) =>
  peakDischarge({
    areaSqMi,
    curveNumber: cn.curveNumber,
    rainfallIn: FORT_FOOTE_24HR_DEPTH_IN[yr],
    tcHr: tc.tcHr,
    pondFactor: 1.0,
    label: `${yr}-year`,
  }),
)

// ── Cross sections ─────────────────────────────────────────────────────────
type Raw = {
  rs: number
  x: number
  y: number
  nx: number
  ny: number
  lb: number
  rb: number
  existing: [number, number][]
  proposed: [number, number][]
}
const raws: Raw[] = model.sections

/**
 * Roughness. The channel is a small wooded stream with an irregular bed; the
 * overbanks on this reach are wooded with dense understory on the valley walls
 * and mown lawn where the lots are graded. Chow's tables and HEC-RAS Table 3-1.
 */
const N_CHANNEL = 0.045
const N_OVERBANK_WOODED = 0.10
const N_OVERBANK_LAWN = 0.035

const toSection = (r: Raw, which: 'existing' | 'proposed', downstreamLengthFt: number | null): CrossSection => {
  const pts = r[which].map(([s, e]) => ({ stationFt: s, elevationFt: e }))
  // Lots 53-56 occupy the right overbank upstream of the road; that is where
  // the proposed grading is and where mown lawn replaces woods.
  const graded = which === 'proposed' && r.rs > 0 && r.rs < 320
  return {
    id: `RS ${r.rs >= 0 ? '+' : ''}${r.rs.toFixed(0)}`,
    riverStationFt: r.rs,
    points: pts,
    leftBankStationFt: r.lb,
    rightBankStationFt: r.rb,
    manningNLeft: N_OVERBANK_WOODED,
    manningNChannel: N_CHANNEL,
    manningNRight: graded ? N_OVERBANK_LAWN : N_OVERBANK_WOODED,
    downstreamReachLengthFt:
      downstreamLengthFt == null
        ? null
        : { left: downstreamLengthFt, channel: downstreamLengthFt, right: downstreamLengthFt },
  }
}

const build = (which: 'existing' | 'proposed', filter: (r: Raw) => boolean): CrossSection[] => {
  const sel = raws.filter(filter).sort((a, b) => a.rs - b.rs)
  return sel.map((r, i) => toSection(r, which, i === 0 ? null : r.rs - sel[i - 1].rs))
}

const downstreamOf = (r: Raw) => r.rs < 0
const upstreamOf = (r: Raw) => r.rs > 0

// ── The crossing ───────────────────────────────────────────────────────────
/**
 * The existing culvert has NOT been surveyed. Size, material, inverts and
 * entrance treatment are all unknown; the 36 in assumed here comes from the
 * project record and nothing more. Every headwater in the existing-condition
 * table therefore carries that assumption, and the sensitivity of the answer
 * to it is reported rather than hidden.
 */
const ROAD_SAG_EL: number = model.roadSagEl
const CREST_LENGTH_FT: number = model.crestLen1_5

const invUp = Math.min(...raws.filter((r) => r.rs > 0 && r.rs < 90).map((r) => invertOf(toSection(r, 'existing', null))))
const invDn = Math.min(...raws.filter((r) => r.rs < 0 && r.rs > -90).map((r) => invertOf(toSection(r, 'existing', null))))

const existingBarrel = (sizeIn: number, inlet = RCP_SQUARE_EDGE_HEADWALL): CulvertBarrel => ({
  shape: 'circular',
  riseFt: sizeIn / 12,
  barrels: 1,
  lengthFt: 80,
  manningN: 0.013,
  inletInvertFt: invUp,
  outletInvertFt: invDn,
  inlet,
})

// ── Profiles ───────────────────────────────────────────────────────────────
const DOWNSTREAM_SLOPE = 0.012

function runCondition(which: 'existing' | 'proposed', barrel: CulvertBarrel) {
  const dn = build(which, downstreamOf)
  const up = build(which, upstreamOf)
  const out: {
    period: number
    qCfs: number
    downstream: ProfileResult
    upstream: ProfileResult
    culvert: ReturnType<typeof analyseCulvert>
    tailwaterElFt: number
    headwaterElFt: number
  }[] = []

  for (let i = 0; i < RETURN_PERIODS.length; i++) {
    const q = flows[i].peakCfs
    const boundary: DownstreamBoundary = {
      kind: 'normal-depth',
      slopeFtPerFt: DOWNSTREAM_SLOPE,
      note:
        `Normal depth on the surveyed channel slope of ${(DOWNSTREAM_SLOPE * 100).toFixed(2)} percent, ` +
        'applied 460 ft below the crossing so the boundary assumption has decayed out of the answer at the road.',
    }
    const dnProfile = solveProfile({ sections: dn, dischargeCfs: q, boundary, label: `${RETURN_PERIODS[i]}-yr` })
    const tw = dnProfile.points[dnProfile.points.length - 1].wselFt

    const culvert = analyseCulvert({
      barrel,
      dischargeCfs: q,
      tailwaterElFt: tw,
      roadway: { crestElFt: ROAD_SAG_EL, crestLengthFt: CREST_LENGTH_FT, weirCoefficient: 2.9 },
    })

    const upProfile = solveProfile({
      sections: up,
      dischargeCfs: q,
      boundary: {
        kind: 'known-wsel',
        wselFt: culvert.headwaterElFt,
        note: `Headwater at the Fort Foote Road crossing, ${culvert.governing} control, computed to HDS-5.`,
      },
      label: `${RETURN_PERIODS[i]}-yr`,
    })

    out.push({
      period: RETURN_PERIODS[i],
      qCfs: q,
      downstream: dnProfile,
      upstream: upProfile,
      culvert,
      tailwaterElFt: tw,
      headwaterElFt: culvert.headwaterElFt,
    })
  }
  return out
}

const BARREL_EXISTING = existingBarrel(36, RCP_SQUARE_EDGE_HEADWALL)
const existing = runCondition('existing', BARREL_EXISTING)
const proposed = runCondition('proposed', BARREL_EXISTING)

// ── Culvert alternatives at the 100-year flow ──────────────────────────────
const q100 = flows[flows.length - 1].peakCfs
const tw100 = existing[existing.length - 1].tailwaterElFt
const alternatives = [36, 48, 60, 72, 84, 96].map((sizeIn) => {
  const b = existingBarrel(sizeIn, RCP_GROOVE_END_HEADWALL)
  const r = analyseCulvert({
    barrel: b,
    dischargeCfs: q100,
    tailwaterElFt: tw100,
    roadway: { crestElFt: ROAD_SAG_EL, crestLengthFt: CREST_LENGTH_FT, weirCoefficient: 2.9 },
  })
  return { sizeIn, result: r }
})
const twin72 = (() => {
  const b: CulvertBarrel = { ...existingBarrel(72, RCP_GROOVE_END_HEADWALL), barrels: 2 }
  return {
    label: 'twin 72 in',
    result: analyseCulvert({
      barrel: b,
      dischargeCfs: q100,
      tailwaterElFt: tw100,
      roadway: { crestElFt: ROAD_SAG_EL, crestLengthFt: CREST_LENGTH_FT, weirCoefficient: 2.9 },
    }),
  }
})()

// ── No-rise ────────────────────────────────────────────────────────────────
const rise = RETURN_PERIODS.map((p, i) => ({
  period: p,
  upstream: compareProfiles(existing[i].upstream, proposed[i].upstream),
  downstream: compareProfiles(existing[i].downstream, proposed[i].downstream),
}))

// ── Floodplain limits at each section ──────────────────────────────────────
const limits = RETURN_PERIODS.map((p, i) => {
  const rows: {
    sectionId: string
    rs: number
    wselFt: number
    leftFt: number | null
    rightFt: number | null
    widthFt: number | null
    leftXY: [number, number] | null
    rightXY: [number, number] | null
  }[] = []
  for (const cond of [existing[i].downstream, existing[i].upstream]) {
    for (const pt of cond.points) {
      const raw = raws.find((r) => `RS ${r.rs >= 0 ? '+' : ''}${r.rs.toFixed(0)}` === pt.sectionId)
      if (!raw) continue
      const xy = (off: number | null): [number, number] | null =>
        off == null ? null : [raw.x + raw.nx * off, raw.y + raw.ny * off]
      rows.push({
        sectionId: pt.sectionId,
        rs: raw.rs,
        wselFt: pt.wselFt,
        leftFt: pt.leftEdgeFt,
        rightFt: pt.rightEdgeFt,
        widthFt: pt.leftEdgeFt != null && pt.rightEdgeFt != null ? pt.rightEdgeFt - pt.leftEdgeFt : null,
        leftXY: xy(pt.leftEdgeFt),
        rightXY: xy(pt.rightEdgeFt),
      })
    }
  }
  rows.sort((a, b) => a.rs - b.rs)
  return { period: p, rows }
})

// ── Output ─────────────────────────────────────────────────────────────────
const result = {
  generatedAt: new Date().toISOString(),
  crs: model.crs,
  verticalDatum: model.verticalDatum,
  hydrology: {
    watershed: model.watershed,
    precipitation: { citation: FORT_FOOTE_PRECIP_CITATION, depths: FORT_FOOTE_24HR_DEPTH_IN },
    curveNumber: cn,
    soilGroupsUsed: { A: fA, B: fB, C: fC, D: fD },
    timeOfConcentration: tc,
    flows,
  },
  crossing: {
    roadSagElFt: ROAD_SAG_EL,
    crestLengthFt: CREST_LENGTH_FT,
    assumedBarrel: {
      sizeIn: 36,
      inletInvertFt: invUp,
      outletInvertFt: invDn,
      note: 'ASSUMED. Not surveyed. See the report.',
    },
    alternatives: alternatives.map((a) => ({
      sizeIn: a.sizeIn,
      headwaterElFt: a.result.headwaterElFt,
      governing: a.result.governing,
      hwOverD: a.result.hwOverD,
      overtoppingCfs: a.result.overtoppingCfs,
      outletVelocityFps: a.result.outletVelocityFps,
    })),
    twin72: {
      headwaterElFt: twin72.result.headwaterElFt,
      governing: twin72.result.governing,
      overtoppingCfs: twin72.result.overtoppingCfs,
      outletVelocityFps: twin72.result.outletVelocityFps,
    },
  },
  existing,
  proposed,
  rise,
  limits,
}

writeFileSync(join(OUT, 'indian-queen.floodplain-study-results.json'), JSON.stringify(result, null, 1))

// ── Console summary ────────────────────────────────────────────────────────
const f2 = (n: number) => n.toFixed(2)
console.log('\n=== HYDROLOGY ===')
console.log(`watershed ${model.watershed.areaAc.toFixed(1)} ac (${areaSqMi.toFixed(4)} sq mi), ` +
  `impervious ${model.watershed.imperviousPct.toFixed(1)}%, canopy ${model.watershed.canopyPct.toFixed(1)}%`)
console.log(`soil groups used: A ${(fA * 100).toFixed(1)}  B ${(fB * 100).toFixed(1)}  C ${(fC * 100).toFixed(1)}  D ${(fD * 100).toFixed(1)}`)
console.log(`composite CN ${cn.curveNumber.toFixed(1)}`)
for (const s of tc.segments) {
  console.log(`  Tc ${s.kind.padEnd(8)} ${s.lengthFt.toFixed(0).padStart(5)} ft  ` +
    `S=${(s.slopeFtPerFt * 100).toFixed(2)}%  V=${(s.velocityFps ?? 0).toFixed(2)} fps  Tt=${(s.travelTimeHr ?? 0).toFixed(4)} hr`)
}
console.log(`  Tc total ${tc.tcHr.toFixed(3)} hr (${(tc.tcHr * 60).toFixed(1)} min)`)
for (const f of flows) {
  console.log(`  ${f.label.padEnd(9)} P=${f.rainfallIn.toFixed(2)} in  Q=${f.runoffIn.toFixed(2)} in  ` +
    `Ia/P=${f.iaOverP.toFixed(3)}  qu=${f.quCsmIn.toFixed(0)}  qp=${f.peakCfs.toFixed(0)} cfs`)
  for (const n of f.notes) console.log(`     note: ${n}`)
}

console.log('\n=== CROSSING ===')
console.log(`road sag EL ${f2(ROAD_SAG_EL)}, crest available ${CREST_LENGTH_FT.toFixed(0)} ft`)
console.log(`assumed inverts: inlet ${f2(invUp)}, outlet ${f2(invDn)}`)
console.log('\n  culvert alternatives at Q100 = ' + q100.toFixed(0) + ' cfs:')
for (const a of alternatives) {
  console.log(`    ${String(a.sizeIn).padStart(3)} in  HW EL ${f2(a.result.headwaterElFt)}  ` +
    `${a.result.governing.padEnd(7)} HW/D ${a.result.hwOverD.toFixed(2).padStart(6)}  ` +
    `over road ${a.result.overtoppingCfs.toFixed(0).padStart(5)} cfs  Vout ${a.result.outletVelocityFps.toFixed(1)} fps`)
}
console.log(`    twin 72 in  HW EL ${f2(twin72.result.headwaterElFt)}  over road ${twin72.result.overtoppingCfs.toFixed(0)} cfs`)

for (let i = 0; i < RETURN_PERIODS.length; i++) {
  const e = existing[i]
  console.log(`\n=== ${RETURN_PERIODS[i]}-YEAR, Q = ${e.qCfs.toFixed(0)} cfs ===`)
  console.log(`  tailwater below the road EL ${f2(e.tailwaterElFt)}`)
  console.log(`  ${e.culvert.governing} control; HW EL ${f2(e.headwaterElFt)}; over the road ${e.culvert.overtoppingCfs.toFixed(0)} cfs`)
  console.log('  upstream profile (the ponding area across the lots):')
  for (const p of e.upstream.points) {
    console.log(`    ${p.sectionId.padEnd(8)} invert ${f2(p.invertFt).padStart(6)}  WS ${f2(p.wselFt).padStart(6)}  ` +
      `EGL ${f2(p.energyGradeFt).padStart(6)}  V ${p.velocityFps.toFixed(2).padStart(5)} fps  ` +
      `top width ${p.topWidthFt.toFixed(0).padStart(4)} ft  Fr ${p.froude.toFixed(2)}` +
      (p.criticalDefault ? '  [critical default]' : '') + (p.overtopped ? '  [OVERTOPS SECTION]' : ''))
  }
}

console.log('\n=== NO-RISE, proposed minus existing ===')
for (const r of rise) {
  console.log(`  ${r.period}-yr  upstream max rise ${r.upstream.maxRiseFt >= 0 ? '+' : ''}${r.upstream.maxRiseFt.toFixed(3)} ft ` +
    `at ${r.upstream.maxRiseSection ?? '-'}  | downstream ${r.downstream.maxRiseFt >= 0 ? '+' : ''}${r.downstream.maxRiseFt.toFixed(3)} ft` +
    `  ${r.upstream.noRise && r.downstream.noRise ? 'NO RISE' : 'RISE'}`)
}

const scour = outletScourCheck(existing[existing.length - 1].culvert.outletVelocityFps, {
  label: 'the existing earth channel below the road',
  permissibleFps: 5.0,
})
console.log('\n=== OUTLET ===')
console.log('  ' + scour.finding)
console.log('\nwrote output/site-plans/indian-queen.floodplain-study-results.json')
