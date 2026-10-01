/**
 * The SWM concept report a Prince George's DPIE Site Development Concept Plan
 * is reviewed against — checklist section D (D-1, D-3, D-4, D-10).
 *
 * ESD to the MEP (esd-mep.ts) answers the water-quality and recharge volumes.
 * The report has to say the rest: which way the site drains, where it leaves,
 * what the 100-year storm does there before and after, and whether that
 * outfall will hold. The checklist puts it plainly — "100-yr existing and
 * proposed runoff" at each point of investigation, and a downstream analysis
 * with 10-year control if the receiving system is inadequate.
 *
 * METHOD  NRCS TR-55 graphical peak discharge (hydraulics/tr55.ts) per POI:
 *   - drainage area   the POI's share of the tract (poi.ts, D8 on the existing
 *                     2-ft contours)
 *   - cover           existing: tree canopy as woods, the rest open space;
 *                     proposed: impervious from the BMP table, the LOD less
 *                     impervious as lawn, the canopy outside the LOD kept
 *   - Tc              the routed longest path to the POI: 100 ft sheet flow,
 *                     the remainder shallow concentrated (unpaved)
 *   - rainfall        NOAA Atlas 14 24-hr depths retrieved FOR THIS SITE,
 *                     Type II distribution
 *
 * NO ESD CREDIT is taken against the 100-year storm. Table 5.3's curve-number
 * reduction is a water-quality device; carrying it into the 100-year comparison
 * would understate the post-development peak, and a reviewer would strike it.
 *
 * This is concept-level: the mapping is 2-ft, the cover split is by area, and
 * a field-run survey resets the flow paths. The report says so.
 */
import type { HydrologicSoilGroup } from './esd-mep'
import type { PoiAnalysis } from './poi'
import { compositeCurveNumber, peakDischarge, timeOfConcentration, type TcSegment } from '../hydraulics/tr55'

/** TR-55 Table 2-2a/2-2c runoff curve numbers used here, by HSG. */
const CN: Record<'woods' | 'openSpace' | 'impervious', Record<HydrologicSoilGroup, number>> = {
  woods: { A: 30, B: 55, C: 70, D: 77 },          // woods, good condition
  openSpace: { A: 39, B: 61, C: 74, D: 80 },      // open space / lawn, good (> 75% grass cover)
  impervious: { A: 98, B: 98, C: 98, D: 98 },     // paved, roofs, driveways
}

export interface Rainfall24hr {
  /** Depth, in, keyed by return period (yr). Must carry 2, 10 and 100. */
  depthsIn: Record<number, number>
  citation: string
}

export interface CoverSplit { woodsSqFt: number; openSqFt: number; impSqFt: number; cn: number }
export interface PeakRow { yr: number; rainfallIn: number; preCfs: number; postCfs: number; preRunoffCf: number; postRunoffCf: number }
export interface PoiHydrology {
  poi: string
  /** Drainage area at the POI: the tract's share plus the off-site land draining onto it. */
  areaSqFt: number
  /** Of areaSqFt, the off-site part (open space, existing and proposed). */
  offsiteSqFt?: number
  existing: CoverSplit
  proposed: CoverSplit
  tc: { existingHr: number; proposedHr: number; lengthFt: number; slope: number; segments: TcSegment[] }
  peaks: PeakRow[]
  outfall: { section: string; slope: number; q10Cfs: number; q100Cfs: number; v10Fps: number; v100Fps: number; d100Ft: number; permissibleFps: number; stable: boolean; protection: string }
}

export interface SwmConceptReport {
  method: string
  rainfall: Rainfall24hr
  hsg: HydrologicSoilGroup
  pois: PoiHydrology[]
  narrative: Record<'D-1' | 'D-3' | 'D-4' | 'D-10', string[]>
  /** What the report cannot answer from the engine's data; carried to the checklist. */
  outstanding: string[]
}

/** Normal depth in a trapezoidal channel by bisection on Manning's equation. */
function normalDepth(q: number, b: number, z: number, n: number, s: number): { d: number; v: number } {
  if (q <= 0) return { d: 0, v: 0 }
  const qOf = (d: number) => {
    const A = d * (b + z * d), P = b + 2 * d * Math.sqrt(1 + z * z)
    return (1.486 / n) * A * Math.pow(A / P, 2 / 3) * Math.sqrt(s)
  }
  let lo = 0, hi = 10
  for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (qOf(m) < q) lo = m; else hi = m }
  const d = (lo + hi) / 2
  return { d, v: q / (d * (b + z * d)) }
}

export function swmConceptReport(input: {
  tractSqFt: number
  poi: PoiAnalysis
  hsg: HydrologicSoilGroup
  rainfall: Rainfall24hr
  /** Existing tree canopy on the tract, sf. Null: none recorded — all existing pervious taken as open space. */
  woodsSqFt: number | null
  existingImpSqFt?: number
  proposedImpSqFt: number
  /** Limit of disturbance inside the tract, sf. */
  lodOnSiteSqFt: number
  /** Receiving system at the outfall, e.g. "the MD 210 roadside ditch (SHA)". */
  receiving: string
  esdvReqCf: number
  esdvProvCf: number
  practices: number
  /** Swale section at the outfall: bottom width ft, side slope z:1, Manning n. */
  outfallSection?: { bottomFt: number; z: number; n: number; label: string }
  permissibleFps?: number
  /** Off-site land draining onto the tract, sf. Carried in every POI's flow as open space (existing and proposed). */
  offsiteSqFt?: number
  /** The roadside swale the development builds: its run to the outfall and its (least) grade. */
  swale?: { lengthFt: number; slope: number }
}): SwmConceptReport {
  const { hsg, rainfall } = input
  for (const yr of [2, 10, 100]) {
    if (!(rainfall.depthsIn[yr] > 0)) throw new Error(`swm concept: no ${yr}-yr 24-hr rainfall for this site`)
  }
  const A = input.tractSqFt
  const woodsPre = Math.min(A, Math.max(0, input.woodsSqFt ?? 0))
  const impPre = Math.min(A - woodsPre, Math.max(0, input.existingImpSqFt ?? 0))
  const impPost = Math.min(A, input.proposedImpSqFt)
  const lod = Math.min(A, Math.max(input.lodOnSiteSqFt, impPost))
  // Canopy outside the LOD is kept. Where the LOD's position against the
  // canopy is unknown, the cleared share is taken proportionally.
  const woodsPost = Math.max(0, woodsPre * (1 - lod / A))
  // Off-site inflow is in the drainage area of record for the POI: the flow
  // the outfall carries includes it, before and after, as open space.
  const off = Math.max(0, input.offsiteSqFt ?? 0)
  const At = A + off
  const cnOf = (w: number, i: number) => compositeCurveNumber([
    { label: 'woods', fraction: w / At, curveNumber: CN.woods[hsg] },
    { label: 'open space', fraction: Math.max(0, At - w - i) / At, curveNumber: CN.openSpace[hsg] },
    { label: 'impervious', fraction: i / At, curveNumber: CN.impervious[hsg] },
  ]).curveNumber
  const cnPre = cnOf(woodsPre, impPre), cnPost = cnOf(woodsPost, impPost)
  const sec = input.outfallSection ?? { bottomFt: 2, z: 3, n: 0.035, label: 'grass-lined roadside swale, 2-ft bottom, 3:1 sides, n = 0.035' }
  const vPerm = input.permissibleFps ?? 4.0

  const pois: PoiHydrology[] = input.poi.pois.map(p => {
    const area = At * p.share
    const L = Math.max(100, p.longestFlowFt ?? Math.sqrt(area))
    const slope = Math.max(0.005, (p.longestFlowDropFt ?? 0) / L)
    const segs = (n: number): TcSegment[] => [
      { kind: 'sheet', label: `sheet flow, ${n === 0.4 ? 'woods (light underbrush)' : 'dense grass'}`, lengthFt: 100, slopeFtPerFt: slope, manningN: n },
      { kind: 'shallow', label: 'shallow concentrated, unpaved', lengthFt: L - 100, slopeFtPerFt: slope, paved: false },
    ]
    const p2 = rainfall.depthsIn[2]
    // The existing path starts in woods where the tract is mostly wooded; the
    // proposed one starts on lawn.
    const tcPre = timeOfConcentration(segs(woodsPre / A > 0.5 ? 0.4 : 0.24), p2)
    // Proposed: lawn, then overland to the street, then the length of the
    // roadside swale to the outfall at its grade (TR-55 channel flow, the
    // swale section running 1 ft deep).
    const swaleR = (() => { const d = 1, a = d * (sec.bottomFt + sec.z * d), w = sec.bottomFt + 2 * d * Math.sqrt(1 + sec.z * sec.z); return a / w })()
    const tcPost = timeOfConcentration(input.swale
      ? [...segs(0.24), { kind: 'channel', label: `roadside swale, ${sec.bottomFt}-ft bottom, ${sec.z}:1, n = ${sec.n}`, lengthFt: input.swale.lengthFt, slopeFtPerFt: input.swale.slope, manningN: sec.n, hydraulicRadiusFt: swaleR }]
      : segs(0.24), p2)
    const sqMi = area / 27878400
    const peaks: PeakRow[] = Object.keys(rainfall.depthsIn).map(Number).filter(yr => [1, 2, 10, 100].includes(yr)).sort((a, b) => a - b).map(yr => {
      const P = rainfall.depthsIn[yr]
      const pre = peakDischarge({ areaSqMi: sqMi, curveNumber: cnPre, rainfallIn: P, tcHr: tcPre.tcHr, label: `${yr}-yr existing` })
      const post = peakDischarge({ areaSqMi: sqMi, curveNumber: cnPost, rainfallIn: P, tcHr: tcPost.tcHr, label: `${yr}-yr proposed` })
      return {
        yr, rainfallIn: P,
        preCfs: Number(pre.peakCfs.toFixed(2)), postCfs: Number(post.peakCfs.toFixed(2)),
        preRunoffCf: Math.round((pre.runoffIn / 12) * area), postRunoffCf: Math.round((post.runoffIn / 12) * area),
      }
    })
    const q10 = peaks.find(r => r.yr === 10)!.postCfs, q100 = peaks.find(r => r.yr === 100)!.postCfs
    // The outfall reach is the swale, so its velocity is checked at the
    // swale's grade, and at BOTH the 10- and the 100-yr flow.
    const sOut = input.swale?.slope ?? slope
    const n10 = normalDepth(q10, sec.bottomFt, sec.z, sec.n, sOut), n100 = normalDepth(q100, sec.bottomFt, sec.z, sec.n, sOut)
    const stable = n10.v <= vPerm && n100.v <= vPerm
    return {
      poi: p.id, areaSqFt: Math.round(area), offsiteSqFt: Math.round(off * p.share),
      existing: { woodsSqFt: Math.round(woodsPre * p.share), openSqFt: Math.round((A - woodsPre - impPre) * p.share), impSqFt: Math.round(impPre * p.share), cn: Number(cnPre.toFixed(1)) },
      proposed: { woodsSqFt: Math.round(woodsPost * p.share), openSqFt: Math.round((A - woodsPost - impPost) * p.share), impSqFt: Math.round(impPost * p.share), cn: Number(cnPost.toFixed(1)) },
      tc: { existingHr: Number(tcPre.tcHr.toFixed(3)), proposedHr: Number(tcPost.tcHr.toFixed(3)), lengthFt: Math.round(L), slope: Number(slope.toFixed(4)), segments: tcPost.segments },
      peaks,
      outfall: {
        section: sec.label, slope: Number(sOut.toFixed(4)), q10Cfs: q10, q100Cfs: q100,
        v10Fps: Number(n10.v.toFixed(2)), v100Fps: Number(n100.v.toFixed(2)), d100Ft: Number(n100.d.toFixed(2)),
        permissibleFps: vPerm, stable,
        protection: stable
          ? `10-yr velocity ${n10.v.toFixed(2)} ft/s and 100-yr velocity ${n100.v.toFixed(2)} ft/s are within ${vPerm.toFixed(1)} ft/s for a grass-lined channel; rock outlet protection where the swale meets ${input.receiving}.`
          : n10.v <= vPerm
            ? `10-yr velocity ${n10.v.toFixed(2)} ft/s is within ${vPerm.toFixed(1)} ft/s, but the 100-yr velocity ${n100.v.toFixed(2)} ft/s exceeds it: line the outfall reach with permanent turf reinforcement matting rated for at least ${n100.v.toFixed(1)} ft/s, and provide rock outlet protection where the swale meets ${input.receiving}.`
            : `10-yr velocity ${n10.v.toFixed(2)} ft/s exceeds ${vPerm.toFixed(1)} ft/s for a grass-lined channel: line the outfall reach with riprap on geotextile and provide rock outlet protection where the swale meets ${input.receiving}.`,
      },
    }
  })

  const fmt = (n: number) => Math.round(n).toLocaleString('en-US')
  const ac = (sf: number) => (sf / 43560).toFixed(2)
  const lines100 = pois.map(h => {
    const r = h.peaks.find(x => x.yr === 100)!
    return `${h.poi}: ${ac(h.areaSqFt)} ac${h.offsiteSqFt ? ` (incl. ${ac(h.offsiteSqFt)} ac off site)` : ''}, CN ${h.existing.cn} → ${h.proposed.cn}, Tc ${h.tc.existingHr} → ${h.tc.proposedHr} hr; 100-yr ${r.preCfs.toFixed(1)} → ${r.postCfs.toFixed(1)} cfs (${r.postCfs >= r.preCfs ? '+' : ''}${(r.postCfs - r.preCfs).toFixed(1)} cfs), runoff ${fmt(r.preRunoffCf)} → ${fmt(r.postRunoffCf)} cf.`
  })
  const outstanding = [
    `Downstream adequacy of ${input.receiving} for the 10- and 100-yr flows at each POI, using field survey and available County/SHA drainage records, at technical design. If inadequate, quantity control and/or conveyance improvements are required (checklist D-10).`,
    'POIs, flow paths and the time of concentration are computed on M-NCPPC 2-ft topography.',
  ]
  const narrative: SwmConceptReport['narrative'] = {
    'D-1': [
      woodsPre > 0
        ? `Natural resources: there are no streams, wetlands, 100-yr floodplain or PMA on the property. Woodland (${fmt(woodsPre)} sf) is conserved outside the limit of disturbance shown on the sediment control plan.`
        : 'Natural resources: there are no environmental features on the property — no streams, wetlands, 100-yr floodplain, PMA or woodland. Disturbance is held to the limit shown on the sediment control plan.',
      `Natural flow patterns: the tract falls toward Jennifer Drive and leaves at ${pois.length === 1 ? 'one point of investigation' : `${pois.length} points of investigation`}, which the proposed grading keeps; no drainage is diverted between POIs.`,
      `Impervious reduction: rural open section (24-ft pavement, no curb and gutter); side-load courts kept to the turning area at each garage. Proposed impervious ${fmt(impPost)} sf (${(100 * impPost / A).toFixed(1)}%).`,
      `ESD to the MEP: ${input.practices} practices — micro-bioretention (M-6) on each lot and roadside dry swales with check dams (M-8) in the R/W. ESDv required ${fmt(input.esdvReqCf)} cf, provided ${fmt(input.esdvProvCf)} cf (MDE Manual Ch. 5, Table 5.3, HSG ${hsg}).`,
      'ESC integration: practice footprints are kept out of the sediment-trapping sequence and are built last, after the contributing area is stabilized; sediment control is shown on C-500.',
    ],
    'D-3': pois.map(h => `${h.poi} lies where the Estates Court swales and overland flow leave the tract, discharging to ${input.receiving}. The outfall is not on a mapped stream or within a mapped 100-yr floodplain. Field survey and County acceptance are required; no direct discharge point to MD 210 is proposed.`),
    'D-4': pois.map(h => `${h.poi}: ${h.outfall.protection} Normal depth at the 100-yr flow ${h.outfall.d100Ft} ft in the ${h.outfall.section} at ${(100 * h.outfall.slope).toFixed(1)}% slope. Upstream inflow from off site (${ac(input.poi.offsiteAreaSqFt)} ac) enters as sheet flow along the tract line, is carried by the swales and is included in the POI flows and the velocity check above; no concentrated inflow point needs stabilization.`),
    'D-10': [
      `ESDv required and provided per POI: BMP Summary Table (C-000). Rainfall: ${rainfall.citation}.`,
      ...lines100,
      'No ESD credit is taken in the 100-yr comparison (conservative). ESD to the MEP satisfies channel protection where the Table 5.3 target is met.',
      ...outstanding.slice(0, 1),
    ],
  }
  return {
    method: `NRCS TR-55 graphical peak discharge, Type II 24-hr; CN from TR-55 Table 2-2 (HSG ${hsg}: woods ${CN.woods[hsg]}, open space ${CN.openSpace[hsg]}, impervious 98); Tc by TR-55 segments along the routed longest path; no ESD credit on the 100-yr.`,
    rainfall, hsg, pois, narrative, outstanding,
  }
}
