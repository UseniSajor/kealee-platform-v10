/**
 * Hydraulics — checked against closed-form answers and published examples.
 *
 * Every test here compares against something computable by hand or printed in
 * a reference, not against whatever the code happened to produce first.
 */
import {
  type CrossSection,
  criticalWsel,
  froudeAt,
  hydraulicsAt,
  invertOf,
  normalWsel,
  waterEdges,
} from '../hydraulics/cross-section'
import { compareProfiles, solveProfile } from '../hydraulics/standard-step'
import {
  type CulvertBarrel,
  RCP_GROOVE_END_HEADWALL,
  RCP_SQUARE_EDGE_HEADWALL,
  analyseCulvert,
  barrelArea,
  circularAreaAt,
  criticalDepth,
  inletControl,
  outletControl,
} from '../hydraulics/culvert-hds5'
import {
  compositeCurveNumber,
  peakDischarge,
  retentionS,
  runoffDepthIn,
  sheetFlowHr,
  shallowConcentratedFps,
  timeOfConcentration,
  unitPeakDischarge,
} from '../hydraulics/tr55'

/** A 20 ft wide rectangular channel with 10 ft vertical walls. */
const rect = (n = 0.03): CrossSection => ({
  id: 'rect',
  riverStationFt: 0,
  points: [
    { stationFt: -60, elevationFt: 20 },
    { stationFt: -10, elevationFt: 10 },
    { stationFt: -10, elevationFt: 0 },
    { stationFt: 10, elevationFt: 0 },
    { stationFt: 10, elevationFt: 10 },
    { stationFt: 60, elevationFt: 20 },
  ],
  leftBankStationFt: -10,
  rightBankStationFt: 10,
  manningNLeft: n,
  manningNChannel: n,
  manningNRight: n,
  downstreamReachLengthFt: null,
})

/** A trapezoid: 20 ft bottom, 2:1 sides, no vertical faces. */
const trap = (n = 0.03): CrossSection => ({
  id: 'trap',
  riverStationFt: 0,
  points: [
    { stationFt: -70, elevationFt: 20 },
    { stationFt: -30, elevationFt: 10 },
    { stationFt: -10, elevationFt: 0 },
    { stationFt: 10, elevationFt: 0 },
    { stationFt: 30, elevationFt: 10 },
    { stationFt: 70, elevationFt: 20 },
  ],
  leftBankStationFt: -30,
  rightBankStationFt: 30,
  manningNLeft: n,
  manningNChannel: n,
  manningNRight: n,
  downstreamReachLengthFt: null,
})

describe('cross-section geometry', () => {
  it('gets area, top width and wetted perimeter of a rectangle right', () => {
    const h = hydraulicsAt(rect(), 4)
    expect(h.areaSqFt).toBeCloseTo(20 * 4, 6)
    expect(h.topWidthFt).toBeCloseTo(20, 6)
    // two 4 ft walls plus a 20 ft bed
    expect(h.wettedPerimeterFt).toBeCloseTo(28, 6)
    expect(h.hydraulicDepthFt).toBeCloseTo(4, 6)
  })

  it('counts a vertical bank face in the wetted perimeter', () => {
    // Without the vertical faces the perimeter would read 20 ft, the hydraulic
    // radius would be 40 percent too large and the conveyance 25 percent high.
    const withWalls = hydraulicsAt(rect(), 4).wettedPerimeterFt
    expect(withWalls).toBeCloseTo(28, 6)
  })

  it('computes conveyance as Manning does, on a section with no vertical faces', () => {
    // Trapezoid at depth 4: bottom 20, 2:1 sides -> top width 20 + 2*8 = 36.
    const h = hydraulicsAt(trap(0.03), 4)
    const A = ((20 + 36) / 2) * 4
    const P = 20 + 2 * Math.hypot(8, 4)
    expect(h.areaSqFt).toBeCloseTo(A, 6)
    expect(h.topWidthFt).toBeCloseTo(36, 6)
    expect(h.wettedPerimeterFt).toBeCloseTo(P, 6)
    const expected = (1.486 / 0.03) * A * Math.pow(A / P, 2 / 3)
    expect(h.conveyance).toBeCloseTo(expected, 4)
  })

  it('finds normal depth that reproduces the discharge', () => {
    const xs = rect(0.03)
    const S = 0.01
    const ws = normalWsel(xs, 300, S)
    const q = hydraulicsAt(xs, ws).conveyance * Math.sqrt(S)
    expect(q).toBeCloseTo(300, 1)
  })

  it('finds critical depth matching the rectangular closed form', () => {
    // yc = (q^2/g)^(1/3) with q the unit discharge. Kept below the 10 ft walls
    // so the section is still rectangular at critical depth.
    const Q = 400
    const qUnit = Q / 20
    const yc = Math.pow((qUnit * qUnit) / 32.174, 1 / 3)
    const ws = criticalWsel(rect(), Q)
    expect(ws).toBeCloseTo(yc, 2)
    expect(froudeAt(rect(), ws, Q)).toBeCloseTo(1, 1)
  })

  it('alpha is 1 when all the flow is in one uniform subsection', () => {
    expect(hydraulicsAt(rect(), 4).alpha).toBeCloseTo(1, 6)
  })

  it('alpha exceeds 1 when a rough overbank carries part of the flow', () => {
    const xs: CrossSection = { ...rect(), manningNLeft: 0.15, manningNRight: 0.15 }
    expect(hydraulicsAt(xs, 14).alpha).toBeGreaterThan(1.05)
  })

  it('locates the water edges, and reports null where the section is overtopped', () => {
    const e = waterEdges(rect(), 5)
    expect(e.leftFt).toBeCloseTo(-10, 6)
    expect(e.rightFt).toBeCloseTo(10, 6)
    expect(waterEdges(rect(), 25).leftFt).toBeNull()
  })

  it('ineffective flow removes conveyance but keeps storage area', () => {
    const wide: CrossSection = { ...rect(), ineffective: { leftOfFt: -10, rightOfFt: 10 } }
    const a = hydraulicsAt(rect(), 14)
    const b = hydraulicsAt(wide, 14)
    expect(b.areaSqFt).toBeCloseTo(a.areaSqFt, 6)
    expect(b.conveyance).toBeLessThan(a.conveyance)
  })
})

describe('standard step profile', () => {
  const prism = (rs: number, dsLen: number | null, drop: number): CrossSection => ({
    ...rect(0.03),
    id: `RS ${rs}`,
    riverStationFt: rs,
    points: rect().points.map((p) => ({ ...p, elevationFt: p.elevationFt + drop })),
    downstreamReachLengthFt: dsLen == null ? null : { left: dsLen, channel: dsLen, right: dsLen },
  })

  it('holds normal depth down a uniform prismatic channel', () => {
    const S = 0.004
    const L = 200
    const sections = [0, 1, 2, 3, 4].map((i) => prism(i * L, i === 0 ? null : L, i * L * S))
    const r = solveProfile({
      sections,
      dischargeCfs: 300,
      boundary: { kind: 'normal-depth', slopeFtPerFt: S, note: 'test' },
      label: 'test',
    })
    // depth should stay at normal depth the whole way
    const d0 = r.points[0].wselFt - r.points[0].invertFt
    for (const p of r.points) {
      expect(p.wselFt - p.invertFt).toBeCloseTo(d0, 2)
    }
    expect(r.criticalDefaults).toHaveLength(0)
  })

  it('draws an M1 backwater above a raised downstream water surface', () => {
    const S = 0.004
    const L = 200
    const sections = [0, 1, 2, 3, 4].map((i) => prism(i * L, i === 0 ? null : L, i * L * S))
    const normal = normalWsel(sections[0], 300, S)
    const r = solveProfile({
      sections,
      dischargeCfs: 300,
      boundary: { kind: 'known-wsel', wselFt: normal + 3, note: 'test' },
      label: 'test',
    })
    const depths = r.points.map((p) => p.wselFt - p.invertFt)
    // depth decays back toward normal going upstream, and stays above it
    for (let i = 1; i < depths.length; i++) expect(depths[i]).toBeLessThan(depths[i - 1])
    for (const d of depths) expect(d).toBeGreaterThan(normal - invertOf(sections[0]) - 0.01)
  })

  it('energy balances across every reach', () => {
    const S = 0.004
    const L = 200
    const sections = [0, 1, 2].map((i) => prism(i * L, i === 0 ? null : L, i * L * S))
    const r = solveProfile({
      sections,
      dischargeCfs: 300,
      boundary: { kind: 'normal-depth', slopeFtPerFt: S, note: 'test' },
      label: 'test',
    })
    for (let i = 1; i < r.points.length; i++) {
      const up = r.points[i]
      const dn = r.points[i - 1]
      const loss = up.energyLossFt ?? 0
      // upstream energy = downstream energy + friction + local losses (local is
      // zero in a prismatic channel at steady depth)
      expect(up.energyGradeFt).toBeGreaterThan(dn.energyGradeFt)
      expect(up.energyGradeFt - dn.energyGradeFt).toBeCloseTo(loss, 1)
    }
  })

  it('reports no rise when two identical profiles are compared', () => {
    const S = 0.004
    const L = 200
    const sections = [0, 1, 2].map((i) => prism(i * L, i === 0 ? null : L, i * L * S))
    const args = {
      sections,
      dischargeCfs: 300,
      boundary: { kind: 'normal-depth' as const, slopeFtPerFt: S, note: 'test' },
      label: 'test',
    }
    const cmp = compareProfiles(solveProfile(args), solveProfile(args))
    expect(cmp.maxRiseFt).toBeCloseTo(0, 6)
    expect(cmp.noRise).toBe(true)
  })
})

describe('culvert — HDS-5', () => {
  const barrel = (D: number, inlet = RCP_SQUARE_EDGE_HEADWALL): CulvertBarrel => ({
    shape: 'circular',
    riseFt: D,
    barrels: 1,
    lengthFt: 100,
    manningN: 0.012,
    inletInvertFt: 100,
    outletInvertFt: 99,
    inlet,
  })

  it('gets circular geometry right', () => {
    expect(circularAreaAt(4, 4)).toBeCloseTo(Math.PI * 4, 6)
    expect(circularAreaAt(2, 4)).toBeCloseTo((Math.PI * 16) / 8, 6)
    expect(barrelArea(barrel(4))).toBeCloseTo(Math.PI * 4, 6)
  })

  it('critical depth satisfies the Froude-1 condition in the barrel', () => {
    const b = barrel(4)
    const dc = criticalDepth(b, 40)
    const A = circularAreaAt(dc, 4)
    const T = 2 * Math.sqrt(dc * (4 - dc))
    expect((40 * 40 * T) / (32.174 * A ** 3)).toBeCloseTo(1, 2)
  })

  it('inlet control headwater grows with discharge and matches HDS-5 magnitudes', () => {
    const b = barrel(4)
    const a = inletControl(b, 40)
    const c = inletControl(b, 80)
    expect(c.hwDepthFt).toBeGreaterThan(a.hwDepthFt)
    // At 80 cfs, Q/(A.D^0.5) = 3.18, which is still in the unsubmerged range,
    // and HDS-5 Chart 1 reads HW/D a little above 1 there. Hand calculation:
    // dc = 2.72, HWc/D = 0.980, K.x^M = 0.099, slope term -0.005 -> 1.074.
    expect(c.hwDepthFt / 4).toBeCloseTo(1.07, 1)
    // Push it well past submergence and the ratio climbs into orifice control.
    const sub = inletControl(b, 200)
    expect(sub.hwDepthFt / 4).toBeGreaterThan(2.5)
    expect(sub.hwDepthFt / 4).toBeLessThan(12)
  })

  it('a groove end admits more than a square edge at the same flow', () => {
    const sq = inletControl(barrel(4, RCP_SQUARE_EDGE_HEADWALL), 80)
    const gr = inletControl(barrel(4, RCP_GROOVE_END_HEADWALL), 80)
    expect(gr.hwDepthFt).toBeLessThan(sq.hwDepthFt)
  })

  it('outlet control rises with the tailwater once the tailwater governs', () => {
    const b = barrel(4)
    const low = outletControl(b, 60, 95)
    const high = outletControl(b, 60, 110)
    expect(high.hwElFt).toBeGreaterThan(low.hwElFt)
    expect(high.hwElFt - low.hwElFt).toBeCloseTo(110 - Math.max(95, low.hwElFt - 0), 0)
  })

  it('takes the higher of the two controls as the design headwater', () => {
    const r = analyseCulvert({ barrel: barrel(4), dischargeCfs: 80, tailwaterElFt: 99 })
    expect(r.headwaterElFt).toBeCloseTo(Math.max(r.inlet.hwElFt, r.outlet.hwElFt), 6)
    expect(r.governing).toBe(r.inlet.hwElFt >= r.outlet.hwElFt ? 'inlet' : 'outlet')
  })

  it('balances roadway overtopping so culvert plus weir carries the flow', () => {
    const r = analyseCulvert({
      barrel: barrel(3),
      dischargeCfs: 400,
      tailwaterElFt: 99,
      roadway: { crestElFt: 106, crestLengthFt: 150, weirCoefficient: 2.9 },
    })
    expect(r.overtoppingCfs).toBeGreaterThan(0)
    expect(r.overtoppingCfs).toBeLessThan(400)
    // the headwater must sit above the crest, or nothing would be spilling
    expect(r.headwaterElFt).toBeGreaterThan(106)
    // and the weir discharge must be consistent with the head it reports
    const head = r.headwaterElFt - 106
    expect(2.9 * 150 * Math.pow(head, 1.5)).toBeCloseTo(r.overtoppingCfs, 0)
  })

  it('does not overtop when the road is high above the headwater', () => {
    const r = analyseCulvert({
      barrel: barrel(6),
      dischargeCfs: 60,
      tailwaterElFt: 99,
      roadway: { crestElFt: 130, crestLengthFt: 150, weirCoefficient: 2.9 },
    })
    expect(r.overtoppingCfs).toBe(0)
  })
})

describe('TR-55', () => {
  it('reproduces the retention and runoff relations', () => {
    expect(retentionS(80)).toBeCloseTo(2.5, 6)
    // TR-55 worked example: CN 80, P 6.0 in
    const S = 2.5
    const Q = Math.pow(6 - 0.5, 2) / (6 - 0.5 + S)
    expect(runoffDepthIn(6, 80)).toBeCloseTo(Q, 6)
    expect(runoffDepthIn(6, 80)).toBeCloseTo(3.78, 2)
  })

  it('returns zero runoff below the initial abstraction', () => {
    expect(runoffDepthIn(0.4, 80)).toBe(0)
  })

  it('area-weights the composite curve number', () => {
    const c = compositeCurveNumber([
      { label: 'a', fraction: 0.25, curveNumber: 98 },
      { label: 'b', fraction: 0.75, curveNumber: 74 },
    ])
    expect(c.curveNumber).toBeCloseTo(80, 6)
  })

  it('caps sheet flow at 100 ft', () => {
    const a = sheetFlowHr({ lengthFt: 100, manningN: 0.24, slopeFtPerFt: 0.02, twoYear24hrRainfallIn: 3.1 })
    const b = sheetFlowHr({ lengthFt: 300, manningN: 0.24, slopeFtPerFt: 0.02, twoYear24hrRainfallIn: 3.1 })
    expect(b).toBeCloseTo(a, 10)
  })

  it('uses the published shallow concentrated velocity relations', () => {
    expect(shallowConcentratedFps(0.01, false)).toBeCloseTo(1.61345, 4)
    expect(shallowConcentratedFps(0.01, true)).toBeCloseTo(2.03282, 4)
  })

  it('sums travel times and applies the 0.1 hr floor', () => {
    const t = timeOfConcentration(
      [{ kind: 'shallow', label: 'x', lengthFt: 100, slopeFtPerFt: 0.05 }],
      3.1,
    )
    expect(t.tcHr).toBeCloseTo(0.1, 6)
    expect(t.minimumApplied).toBe(true)
  })

  it('unit peak discharge falls as Tc rises', () => {
    const a = unitPeakDischarge(0.3, 0.2).quCsmIn
    const b = unitPeakDischarge(1.0, 0.2).quCsmIn
    expect(b).toBeLessThan(a)
    // Exhibit 4-II, Type II, Ia/P 0.20: qu at Tc 1 hr is a few hundred csm/in
    expect(b).toBeGreaterThan(100)
    expect(b).toBeLessThan(500)
  })

  it('clamps Ia/P to the published range and says so', () => {
    const r = unitPeakDischarge(0.5, 0.03)
    expect(r.clamped).toBe(true)
    expect(r.iaOverPUsed).toBeCloseTo(0.1, 6)
  })

  it('peak discharge scales with area and runoff', () => {
    const base = peakDischarge({ areaSqMi: 1, curveNumber: 80, rainfallIn: 6, tcHr: 0.5, label: 'x' })
    const twice = peakDischarge({ areaSqMi: 2, curveNumber: 80, rainfallIn: 6, tcHr: 0.5, label: 'x' })
    expect(twice.peakCfs).toBeCloseTo(base.peakCfs * 2, 4)
    expect(base.volumeAcFt).toBeCloseTo((base.runoffIn / 12) * 640, 4)
  })

  it('a pond factor below one reduces the peak proportionally', () => {
    const a = peakDischarge({ areaSqMi: 1, curveNumber: 80, rainfallIn: 6, tcHr: 0.5, label: 'x' })
    const b = peakDischarge({ areaSqMi: 1, curveNumber: 80, rainfallIn: 6, tcHr: 0.5, pondFactor: 0.72, label: 'x' })
    expect(b.peakCfs).toBeCloseTo(a.peakCfs * 0.72, 4)
  })
})
