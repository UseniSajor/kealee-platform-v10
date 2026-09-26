/**
 * The engineering calculation registry.
 *
 * A language model may CHOOSE a calculation, fill its inputs from the model,
 * and EXPLAIN the result. It never performs the arithmetic: every number an
 * engineer sees comes from one of these deterministic functions, and every
 * result carries its method, equation, inputs, units, assumptions and
 * versions so a reviewing professional can check it rather than redo it.
 *
 * Where a function already existed in the engine it is wrapped, not
 * re-implemented (site-plan/engineering.ts, site-plan/swale.ts,
 * hydraulics/culvert-hds5.ts, hydraulics/standard-step.ts).
 */

import {
  CALC_VERSION, peakDischargeRational, timeOfConcentrationKirpich, compositeRunoffCoefficient,
  stoppingSightDistance, RUNOFF_COEFFICIENTS,
} from '../site-plan/engineering'
import { dischargeAt, normalDepth } from '../site-plan/swale'
import { analyseCulvert, RCP_SQUARE_EDGE_HEADWALL, RCP_GROOVE_END_HEADWALL, RCP_GROOVE_END_PROJECTING } from '../hydraulics/culvert-hds5'
import { solveProfile } from '../hydraulics/standard-step'
import type { CrossSection } from '../hydraulics/cross-section'
import { STUDIO_ENGINE_VERSION, type StudioModel, type StudioObject, IMPERVIOUS_TYPES, verticesOf } from './model'
import { polygonArea, minDistance, openRing, lineLength, type XY } from './geometry'

export const STUDIO_CALC_VERSION = `${CALC_VERSION}+studio-1`

export type CalcStatus = 'PASS' | 'FAIL' | 'WARNING' | 'INFO' | 'REQUIRES_INPUT' | 'UNSUPPORTED'
export type CalcReviewStatus = 'NOT_REVIEWED' | 'REVIEWED' | 'REQUIRES_PROFESSIONAL_REVIEW'

export interface CalculationRecord {
  calcId: string
  name: string
  method: string
  equation: string
  reference: string
  inputs: Record<string, unknown>
  units: Record<string, string>
  outputs: Record<string, unknown>
  /** What the inputs were read from — model objects, a stated value, a default. */
  source: string
  assumptions: string[]
  engineVersion: string
  calculationVersion: string
  timestamp: string
  actor: { type: 'user' | 'system' | 'ai'; id: string }
  reviewStatus: CalcReviewStatus
  status: CalcStatus
  /** Model objects the calculation read, so a change to them marks it stale. */
  objectIds: string[]
  message: string
}

export interface CalcContext {
  actor: { type: 'user' | 'system' | 'ai'; id: string }
  model?: StudioModel
  now?: () => string
}

interface CalcDefinition {
  id: string
  name: string
  method: string
  reference: string
  /** Declared inputs with units; a missing required input is REQUIRES_INPUT, never a default. */
  inputs: Record<string, { unit: string; required: boolean; description: string }>
  run(inputs: Record<string, any>, ctx: CalcContext): Omit<CalculationRecord,
    'calcId' | 'name' | 'method' | 'reference' | 'engineVersion' | 'calculationVersion' | 'timestamp' | 'actor' | 'units' | 'inputs'>
    & { inputs?: Record<string, unknown> }
}

const r = (n: number, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp
const G = 32.174

// ── Manning ────────────────────────────────────────────────────────────────

/** Full-flow capacity of a circular pipe, Manning (US units). */
export function pipeFullFlow(diameterIn: number, slopeFtPerFt: number, n: number) {
  const D = diameterIn / 12, A = (Math.PI * D * D) / 4, R = D / 4
  const Q = (1.486 / n) * A * Math.pow(R, 2 / 3) * Math.sqrt(slopeFtPerFt)
  return { qFullCfs: Q, vFullFps: Q / A, areaSqFt: A, hydraulicRadiusFt: R }
}

/** Depth of flow in a circular pipe for Q, by bisection on the partial-flow Manning relation. */
export function pipeNormalDepth(qCfs: number, diameterIn: number, slopeFtPerFt: number, n: number): number | null {
  const D = diameterIn / 12
  const q = (y: number) => {
    const th = 2 * Math.acos(1 - (2 * y) / D)
    const A = (D * D / 8) * (th - Math.sin(th)), P = (D * th) / 2
    return (1.486 / n) * A * Math.pow(A / P, 2 / 3) * Math.sqrt(slopeFtPerFt)
  }
  if (q(0.938 * D) < qCfs) return null // beyond the maximum partial-flow capacity
  let lo = 1e-6, hi = 0.938 * D
  for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; (q(m) < qCfs ? (lo = m) : (hi = m)) }
  return (lo + hi) / 2
}

// ── Surface (grade interpolation) ─────────────────────────────────────────

export interface SurfaceSample { x: number; y: number; z: number; objectId: string }

/** Elevation samples from spot elevations and contour vertices (existing unless stated). */
export function surfaceSamples(model: StudioModel, which: 'existing' | 'proposed' = 'existing'): SurfaceSample[] {
  const out: SurfaceSample[] = []
  for (const o of model.objects) {
    const isProposed = o.status === 'PROPOSED'
    if ((which === 'existing') === isProposed) continue
    if (o.type === 'SpotElevation' && o.geometry.type === 'Point') {
      const z = Number(o.attributes.elevationFt ?? o.geometry.coordinates[2])
      if (Number.isFinite(z)) out.push({ x: o.geometry.coordinates[0], y: o.geometry.coordinates[1], z, objectId: o.id })
    }
    if ((o.type === 'Contour' || o.type === 'Breakline') && o.geometry.type === 'LineString') {
      for (const p of o.geometry.coordinates) {
        const z = Number(o.attributes.elevationFt ?? p[2])
        if (Number.isFinite(z)) out.push({ x: p[0], y: p[1], z, objectId: o.id })
      }
    }
  }
  return out
}

/**
 * Inverse-distance-weighted elevation (power 2, nearest 12 samples). A
 * screening interpolation — the method is stated on every result that uses it,
 * and it is never presented as a surveyed surface.
 */
export function interpolateElevation(samples: SurfaceSample[], x: number, y: number): { z: number; used: SurfaceSample[] } | null {
  if (samples.length < 3) return null
  const withD = samples.map(s => ({ s, d: Math.hypot(s.x - x, s.y - y) })).sort((a, b) => a.d - b.d).slice(0, 12)
  if (withD[0].d < 1e-6) return { z: withD[0].s.z, used: [withD[0].s] }
  let num = 0, den = 0
  for (const { s, d } of withD) { const w = 1 / (d * d); num += w * s.z; den += w }
  return { z: num / den, used: withD.map(w => w.s) }
}

// ── Registry ───────────────────────────────────────────────────────────────

const defs: CalcDefinition[] = []
const def = (d: CalcDefinition) => { defs.push(d); return d }

def({
  id: 'rational_method', name: 'Peak discharge — Rational Method', method: 'Q = C·i·A', reference: 'Rational Method',
  inputs: {
    runoffCoefficient: { unit: '-', required: true, description: 'C, composite' },
    intensityInPerHr: { unit: 'in/hr', required: true, description: 'design storm intensity at tc (NOAA Atlas 14)' },
    areaAcres: { unit: 'ac', required: true, description: 'drainage area' },
    designFlowLimitCfs: { unit: 'cfs', required: false, description: 'optional allowable peak to compare' },
  },
  run(i) {
    const c = peakDischargeRational(i.runoffCoefficient, i.intensityInPerHr, i.areaAcres)
    const over = i.designFlowLimitCfs != null && c.value > i.designFlowLimitCfs
    return {
      equation: c.equation, outputs: { peakFlowCfs: c.value }, source: 'stated inputs',
      assumptions: c.assumptions, reviewStatus: 'NOT_REVIEWED', status: i.areaAcres > 200 ? 'WARNING' : over ? 'FAIL' : 'PASS',
      objectIds: [], message: `Q = ${c.value} cfs` + (i.areaAcres > 200 ? ' — area exceeds the Rational Method range' : ''),
    }
  },
})

def({
  id: 'time_of_concentration', name: 'Time of concentration — Kirpich', method: 'Kirpich (1940)', reference: 'Kirpich (1940)',
  inputs: {
    flowLengthFt: { unit: 'ft', required: true, description: 'hydraulic length' },
    slopeFtPerFt: { unit: 'ft/ft', required: true, description: 'average slope along the flow path' },
  },
  run(i) {
    const c = timeOfConcentrationKirpich(i.flowLengthFt, i.slopeFtPerFt)
    return { equation: c.equation, outputs: { tcMin: c.value }, source: 'stated inputs', assumptions: c.assumptions, reviewStatus: 'NOT_REVIEWED', status: 'INFO', objectIds: [], message: `tc = ${c.value} min` }
  },
})

def({
  id: 'runoff_coefficient', name: 'Composite runoff coefficient', method: 'Area-weighted C', reference: 'Rational Method, composite C',
  inputs: { subAreas: { unit: 'ac', required: false, description: '[{areaAcres, surface|c}]; read from the model when omitted' } },
  run(i, ctx) {
    let subAreas = i.subAreas as { areaAcres: number; surface: string; c?: number }[] | undefined
    let objectIds: string[] = []
    let source = 'stated inputs'
    if (!subAreas && ctx.model) {
      const lot = ctx.model.objects.find(o => o.type === 'ParcelBoundary')
      if (!lot) return { equation: '', outputs: {}, source: 'model', assumptions: [], reviewStatus: 'NOT_REVIEWED', status: 'REQUIRES_INPUT', objectIds: [], message: 'No parcel boundary in the model to take the drainage area from.' }
      const lotSf = polygonArea(lot.geometry)
      const imp = ctx.model.objects.filter(o => IMPERVIOUS_TYPES.has(o.type) && o.status !== 'TO_BE_REMOVED' && o.geometry.type === 'Polygon')
      const roof = imp.filter(o => o.type === 'BuildingFootprint' || o.type === 'Structure').reduce((s, o) => s + polygonArea(o.geometry), 0)
      const pave = imp.filter(o => !(o.type === 'BuildingFootprint' || o.type === 'Structure')).reduce((s, o) => s + polygonArea(o.geometry), 0)
      subAreas = [
        { areaAcres: roof / 43560, surface: 'roof' },
        { areaAcres: pave / 43560, surface: 'pavement' },
        { areaAcres: Math.max(0, lotSf - roof - pave) / 43560, surface: 'lawn_average' },
      ].filter(s => s.areaAcres > 0)
      objectIds = [lot.id, ...imp.map(o => o.id)]
      source = 'model: parcel boundary and impervious objects'
    }
    if (!subAreas?.length) return { equation: '', outputs: {}, source, assumptions: [], reviewStatus: 'NOT_REVIEWED', status: 'REQUIRES_INPUT', objectIds, message: 'No sub-areas.' }
    const c = compositeRunoffCoefficient(subAreas)
    return {
      inputs: { subAreas }, equation: c.equation, outputs: { compositeC: c.value, totalAreaAcres: r(subAreas.reduce((s, a) => s + a.areaAcres, 0), 4) },
      source, assumptions: [...c.assumptions, `Coefficients used: ${JSON.stringify(RUNOFF_COEFFICIENTS)}`],
      reviewStatus: 'NOT_REVIEWED', status: 'INFO', objectIds, message: `C = ${c.value}`,
    }
  },
})

def({
  id: 'manning_open_channel', name: 'Open-channel flow — Manning (trapezoid)', method: "Manning's equation", reference: 'Chow (1959); HEC-15',
  inputs: {
    bottomWidthFt: { unit: 'ft', required: true, description: 'bottom width' },
    sideSlopeZ: { unit: 'H:1V', required: true, description: 'side slope' },
    manningN: { unit: '-', required: true, description: 'roughness' },
    slopeFtPerFt: { unit: 'ft/ft', required: true, description: 'longitudinal slope' },
    depthFt: { unit: 'ft', required: false, description: 'flow depth for capacity' },
    designFlowCfs: { unit: 'cfs', required: false, description: 'flow for normal depth' },
    availableDepthFt: { unit: 'ft', required: false, description: 'channel depth available' },
  },
  run(i) {
    const s = { bottomWidthFt: i.bottomWidthFt, sideSlopeZ: i.sideSlopeZ, manningN: i.manningN }
    const out: Record<string, unknown> = {}
    let status: CalcStatus = 'INFO', msg = ''
    if (i.depthFt != null) { out.capacityCfs = r(dischargeAt(i.depthFt, s, i.slopeFtPerFt)); msg = `capacity ${out.capacityCfs} cfs at ${i.depthFt} ft` }
    if (i.designFlowCfs != null) {
      const yn = normalDepth(i.designFlowCfs, s, i.slopeFtPerFt)
      const A = yn * (s.bottomWidthFt + s.sideSlopeZ * yn)
      out.normalDepthFt = r(yn, 3); out.velocityFps = r(i.designFlowCfs / A)
      if (i.availableDepthFt != null) { status = yn + 0.5 <= i.availableDepthFt ? 'PASS' : 'FAIL'; out.freeboardFt = r(i.availableDepthFt - yn) }
      msg += `${msg ? '; ' : ''}normal depth ${out.normalDepthFt} ft at ${i.designFlowCfs} cfs, V ${out.velocityFps} fps`
    }
    if (!msg) return { equation: '', outputs: {}, source: 'stated inputs', assumptions: [], reviewStatus: 'NOT_REVIEWED', status: 'REQUIRES_INPUT', objectIds: [], message: 'Give a depth (capacity) or a design flow (normal depth).' }
    return {
      equation: 'Q = (1.49/n)·A·R^(2/3)·S^(1/2)', outputs: out, source: 'stated inputs',
      assumptions: ['Uniform, steady flow.', '0.5 ft freeboard required above the design water surface.'],
      reviewStatus: 'NOT_REVIEWED', status, objectIds: [], message: msg,
    }
  },
})

def({
  id: 'swale_capacity', name: 'Swale capacity', method: "Manning's equation, trapezoid", reference: 'site-plan/swale.ts; HEC-15',
  inputs: {
    bottomWidthFt: { unit: 'ft', required: true, description: '' }, sideSlopeZ: { unit: 'H:1V', required: true, description: '' },
    manningN: { unit: '-', required: true, description: '' }, slopeFtPerFt: { unit: 'ft/ft', required: true, description: '' },
    depthFt: { unit: 'ft', required: true, description: 'swale depth' }, designFlowCfs: { unit: 'cfs', required: true, description: '' },
  },
  run(i) {
    const s = { bottomWidthFt: i.bottomWidthFt, sideSlopeZ: i.sideSlopeZ, manningN: i.manningN }
    const cap = dischargeAt(Math.max(0, i.depthFt - 0.5), s, i.slopeFtPerFt)
    const yn = normalDepth(i.designFlowCfs, s, i.slopeFtPerFt)
    const A = yn * (s.bottomWidthFt + s.sideSlopeZ * yn), v = i.designFlowCfs / A
    const status: CalcStatus = cap >= i.designFlowCfs ? (v > 5 ? 'WARNING' : 'PASS') : 'FAIL'
    return {
      equation: 'Q = (1.49/n)·A·R^(2/3)·S^(1/2), capacity at depth − 0.5 ft freeboard',
      outputs: { capacityCfs: r(cap), normalDepthFt: r(yn, 3), velocityFps: r(v) }, source: 'stated inputs',
      assumptions: ['0.5 ft freeboard.', 'Velocity above 5 fps in a grass swale generally needs a lining — flagged as a warning.'],
      reviewStatus: 'NOT_REVIEWED', status, objectIds: [], message: `capacity ${r(cap)} cfs vs ${i.designFlowCfs} cfs design; V ${r(v)} fps`,
    }
  },
})

def({
  id: 'pipe_capacity', name: 'Storm pipe capacity — Manning full flow', method: "Manning's equation, circular", reference: 'FHWA HEC-22 §6',
  inputs: {
    diameterIn: { unit: 'in', required: true, description: 'nominal diameter' },
    slopeFtPerFt: { unit: 'ft/ft', required: true, description: 'pipe slope' },
    manningN: { unit: '-', required: true, description: '0.013 RCP, 0.012 HDPE smooth-wall, 0.024 CMP' },
    designFlowCfs: { unit: 'cfs', required: false, description: 'design flow to compare' },
  },
  run(i) {
    const f = pipeFullFlow(i.diameterIn, i.slopeFtPerFt, i.manningN)
    const out: Record<string, unknown> = { capacityCfs: r(f.qFullCfs), fullVelocityFps: r(f.vFullFps) }
    let status: CalcStatus = 'INFO', msg = `capacity ${r(f.qFullCfs)} cfs, ${r(f.vFullFps)} fps flowing full`
    if (i.designFlowCfs != null) {
      const yn = pipeNormalDepth(i.designFlowCfs, i.diameterIn, i.slopeFtPerFt, i.manningN)
      out.designFlowCfs = i.designFlowCfs
      out.flowRatio = r(i.designFlowCfs / f.qFullCfs, 3)
      out.normalDepthFt = yn == null ? null : r(yn, 3)
      status = f.qFullCfs >= i.designFlowCfs ? (f.vFullFps < 2 ? 'WARNING' : 'PASS') : 'FAIL'
      msg += `; design ${i.designFlowCfs} cfs (${r(100 * i.designFlowCfs / f.qFullCfs, 0)}% of capacity)`
    } else if (f.vFullFps < 2) status = 'WARNING'
    return {
      equation: 'Q = (1.486/n)·A·R^(2/3)·S^(1/2); A = πD²/4, R = D/4', outputs: out, source: 'stated inputs',
      assumptions: ['Full-flow capacity; partial-flow depth by the circular section relation.', '2 fps minimum full-flow velocity for self-cleansing.', 'Inlet/outlet control and HGL are separate checks.'],
      reviewStatus: 'NOT_REVIEWED', status, objectIds: [], message: msg,
    }
  },
})

/** Smallest standard diameter that carries Q. */
export const STANDARD_PIPE_DIAMETERS_IN = [12, 15, 18, 21, 24, 27, 30, 36, 42, 48, 54, 60]
export function sizePipe(qCfs: number, slopeFtPerFt: number, n: number, minDiameterIn = 15): number | null {
  for (const d of STANDARD_PIPE_DIAMETERS_IN) if (d >= minDiameterIn && pipeFullFlow(d, slopeFtPerFt, n).qFullCfs >= qCfs) return d
  return null
}

def({
  id: 'culvert_capacity', name: 'Culvert headwater — HDS-5', method: 'FHWA HDS-5 inlet and outlet control', reference: 'FHWA HDS-5 (2012)',
  inputs: {
    diameterFt: { unit: 'ft', required: true, description: 'barrel diameter' }, lengthFt: { unit: 'ft', required: true, description: '' },
    manningN: { unit: '-', required: true, description: '' }, inletInvertFt: { unit: 'ft', required: true, description: '' },
    outletInvertFt: { unit: 'ft', required: true, description: '' }, dischargeCfs: { unit: 'cfs', required: true, description: '' },
    tailwaterElFt: { unit: 'ft', required: true, description: '' },
    inletEdge: { unit: '-', required: false, description: 'square_edge_headwall | groove_end_headwall | groove_end_projecting' },
    allowableHwOverD: { unit: '-', required: false, description: 'default 1.5' },
  },
  run(i) {
    const inlet = i.inletEdge === 'groove_end_headwall' ? RCP_GROOVE_END_HEADWALL : i.inletEdge === 'groove_end_projecting' ? RCP_GROOVE_END_PROJECTING : RCP_SQUARE_EDGE_HEADWALL
    const res = analyseCulvert({
      barrel: { shape: 'circular', riseFt: i.diameterFt, barrels: 1, lengthFt: i.lengthFt, manningN: i.manningN, inletInvertFt: i.inletInvertFt, outletInvertFt: i.outletInvertFt, inlet },
      dischargeCfs: i.dischargeCfs, tailwaterElFt: i.tailwaterElFt,
    })
    const allow = i.allowableHwOverD ?? 1.5
    return {
      equation: 'HW = max(inlet control, outlet control)',
      outputs: { headwaterElFt: r(res.headwaterElFt), hwOverD: r(res.hwOverD), governing: res.governing, outletVelocityFps: r(res.outletVelocityFps) },
      source: 'stated inputs', assumptions: [`Inlet: ${inlet.label} (${inlet.chart}).`, ...res.notes],
      reviewStatus: 'NOT_REVIEWED', status: res.hwOverD <= allow ? 'PASS' : 'FAIL', objectIds: [],
      message: `HW/D ${r(res.hwOverD)} (${res.governing} control), allowable ${allow}`,
    }
  },
})

def({
  id: 'inlet_capacity', name: 'Grate inlet capacity in a sump — HEC-22', method: 'Weir / orifice, lesser governs', reference: 'FHWA HEC-22 (2009) §4.4.5',
  inputs: {
    grateLengthFt: { unit: 'ft', required: true, description: '' }, grateWidthFt: { unit: 'ft', required: true, description: '' },
    pondingDepthFt: { unit: 'ft', required: true, description: 'allowable depth at the inlet' },
    designFlowCfs: { unit: 'cfs', required: false, description: '' },
    cloggingFactor: { unit: '-', required: false, description: 'fraction of open area lost, default 0.5' },
    location: { unit: '-', required: false, description: 'sump | on_grade' },
  },
  run(i) {
    if (i.location === 'on_grade') {
      return { equation: '', outputs: {}, source: 'stated inputs', assumptions: [], reviewStatus: 'REQUIRES_PROFESSIONAL_REVIEW', status: 'UNSUPPORTED', objectIds: [], message: 'On-grade grate interception needs gutter spread and cross slope (HEC-22 §4.4.2); this engine computes sump inlets only.' }
    }
    const clog = i.cloggingFactor ?? 0.5
    const P = 2 * (i.grateLengthFt + i.grateWidthFt) * (1 - clog)
    const A = i.grateLengthFt * i.grateWidthFt * 0.5 * (1 - clog) // 50% open grate
    const d = i.pondingDepthFt
    const weir = 3.0 * P * Math.pow(d, 1.5)
    const orifice = 0.67 * A * Math.sqrt(2 * G * d)
    const cap = Math.min(weir, orifice)
    const status: CalcStatus = i.designFlowCfs == null ? 'INFO' : cap >= i.designFlowCfs ? 'PASS' : 'FAIL'
    return {
      equation: 'Qw = Cw·P·d^1.5 (Cw 3.0); Qo = Co·A·√(2gd) (Co 0.67); Q = min',
      outputs: { weirCfs: r(weir), orificeCfs: r(orifice), capacityCfs: r(cap), governing: weir < orifice ? 'weir' : 'orifice' },
      source: 'stated inputs', assumptions: [`Clogging factor ${clog} applied to perimeter and open area.`, 'Grate open area taken as 50% of the grate; use the manufacturer figure where known.'],
      reviewStatus: 'NOT_REVIEWED', status, objectIds: [], message: `capacity ${r(cap)} cfs (${weir < orifice ? 'weir' : 'orifice'} governs)`,
    }
  },
})

def({
  id: 'hydraulic_grade_line', name: 'Hydraulic grade line — storm sewer run', method: 'Friction slope + minor losses, downstream to upstream', reference: 'FHWA HEC-22 §7 (simplified energy method)',
  inputs: {
    tailwaterElFt: { unit: 'ft', required: true, description: 'HGL at the outfall' },
    runs: { unit: '-', required: true, description: '[{id, flowCfs, diameterIn, manningN, lengthFt, minorLossK, rimElFt}] downstream first' },
  },
  run(i) {
    let hgl = i.tailwaterElFt
    const rows: Record<string, unknown>[] = []
    let surcharged = 0
    for (const p of i.runs as any[]) {
      const f = pipeFullFlow(p.diameterIn, 0.01, p.manningN)
      const K = (1.486 / p.manningN) * f.areaSqFt * Math.pow(f.hydraulicRadiusFt, 2 / 3)
      const sf = Math.pow(p.flowCfs / K, 2)
      const v = p.flowCfs / f.areaSqFt
      const minor = (p.minorLossK ?? 0.5) * v * v / (2 * G)
      hgl = hgl + sf * p.lengthFt + minor
      const freeboard = p.rimElFt != null ? p.rimElFt - hgl : null
      if (freeboard != null && freeboard < 1) surcharged++
      rows.push({ id: p.id, frictionSlope: r(sf, 5), frictionLossFt: r(sf * p.lengthFt, 3), minorLossFt: r(minor, 3), hglUpstreamFt: r(hgl), freeboardToRimFt: freeboard == null ? null : r(freeboard) })
    }
    return {
      equation: 'HGLup = HGLdn + Sf·L + K·V²/2g ; Sf = (Q/K)², K = (1.486/n)·A·R^(2/3)',
      outputs: { profile: rows }, source: 'stated inputs',
      assumptions: ['Full-flow friction slope applied along each run — conservative where the pipe flows part-full.', 'One lumped minor-loss coefficient per structure; junction losses by the HEC-22 energy method are a professional refinement.', '1 ft minimum freeboard below the rim.'],
      reviewStatus: 'NOT_REVIEWED', status: surcharged ? 'FAIL' : 'PASS', objectIds: (i.runs as any[]).map(p => p.id).filter(Boolean),
      message: surcharged ? `${surcharged} structure(s) within 1 ft of the rim` : `HGL clear of every rim by at least 1 ft`,
    }
  },
})

def({
  id: 'water_surface_profile', name: 'Water-surface profile — standard step', method: 'Standard step (HEC-RAS equations)', reference: 'hydraulics/standard-step.ts; HEC-RAS Hydraulic Reference Manual ch. 2',
  inputs: {
    sections: { unit: '-', required: true, description: 'CrossSection[] downstream first (see hydraulics/cross-section.ts)' },
    dischargeCfs: { unit: 'cfs', required: true, description: '' },
    downstreamWselFt: { unit: 'ft', required: false, description: 'known water surface; otherwise normal depth from boundarySlope' },
    boundarySlope: { unit: 'ft/ft', required: false, description: '' },
  },
  run(i) {
    const boundary = i.downstreamWselFt != null
      ? { kind: 'known-wsel' as const, wselFt: i.downstreamWselFt, note: 'stated' }
      : { kind: 'normal-depth' as const, slopeFtPerFt: i.boundarySlope ?? 0.001, note: 'normal depth' }
    const res = solveProfile({ sections: i.sections as CrossSection[], dischargeCfs: i.dischargeCfs, boundary, label: 'design' })
    return {
      equation: 'WS2 + α2V2²/2g = WS1 + α1V1²/2g + he', outputs: { points: res.points.map(p => ({ id: p.sectionId, wselFt: r(p.wselFt), velocityFps: r(p.velocityFps) })), criticalDefaults: res.criticalDefaults, overtopped: res.overtopped },
      source: 'stated cross sections', assumptions: ['Steady, gradually varied, subcritical flow.', res.boundaryCondition],
      reviewStatus: 'REQUIRES_PROFESSIONAL_REVIEW', status: res.overtopped.length ? 'WARNING' : 'INFO', objectIds: [],
      message: `${res.points.length} sections solved` + (res.overtopped.length ? `; overtopped at ${res.overtopped.join(', ')}` : ''),
    }
  },
})

def({
  id: 'slope', name: 'Slope between two points', method: 'rise / run', reference: 'geometry',
  inputs: { x1: { unit: 'ft', required: true, description: '' }, y1: { unit: 'ft', required: true, description: '' }, z1: { unit: 'ft', required: true, description: '' },
    x2: { unit: 'ft', required: true, description: '' }, y2: { unit: 'ft', required: true, description: '' }, z2: { unit: 'ft', required: true, description: '' } },
  run(i) {
    const run = Math.hypot(i.x2 - i.x1, i.y2 - i.y1)
    if (run < 1e-6) return { equation: '', outputs: {}, source: 'stated inputs', assumptions: [], reviewStatus: 'NOT_REVIEWED', status: 'REQUIRES_INPUT', objectIds: [], message: 'Points coincide.' }
    const s = (i.z2 - i.z1) / run
    return { equation: 'S = Δz / horizontal distance', outputs: { slopePct: r(100 * s), runFt: r(run) }, source: 'stated inputs', assumptions: [], reviewStatus: 'NOT_REVIEWED', status: 'INFO', objectIds: [], message: `${r(100 * s)}% over ${r(run)} ft` }
  },
})

def({
  id: 'grade_interpolation', name: 'Existing grade at a point', method: 'Inverse distance weighting (p = 2, 12 nearest)', reference: 'Shepard (1968)',
  inputs: { x: { unit: 'ft', required: true, description: '' }, y: { unit: 'ft', required: true, description: '' }, surface: { unit: '-', required: false, description: 'existing | proposed' } },
  run(i, ctx) {
    if (!ctx.model) return { equation: '', outputs: {}, source: '', assumptions: [], reviewStatus: 'NOT_REVIEWED', status: 'REQUIRES_INPUT', objectIds: [], message: 'No model.' }
    const samples = surfaceSamples(ctx.model, i.surface === 'proposed' ? 'proposed' : 'existing')
    const z = interpolateElevation(samples, i.x, i.y)
    if (!z) return { equation: '', outputs: {}, source: 'model', assumptions: [], reviewStatus: 'NOT_REVIEWED', status: 'REQUIRES_INPUT', objectIds: [], message: 'Fewer than three elevation samples — no surface to interpolate.' }
    const src = [...new Set(z.used.map(s => s.objectId))]
    return {
      equation: 'z = Σ(zᵢ/dᵢ²) / Σ(1/dᵢ²)', outputs: { elevationFt: r(z.z) }, source: `model: ${src.length} elevation objects`,
      assumptions: ['Interpolated between mapped elevations; accuracy is no better than the contour source (see provenance).'],
      reviewStatus: 'NOT_REVIEWED', status: 'INFO', objectIds: src, message: `${r(z.z)} ft`,
    }
  },
})

def({
  id: 'contour_interpolation', name: 'Contour elevation check', method: 'IDW surface compared with a drawn contour', reference: 'Shepard (1968)',
  inputs: { contourId: { unit: '-', required: true, description: 'Contour object to check' } },
  run(i, ctx) {
    const c = ctx.model?.objects.find(o => o.id === i.contourId)
    if (!ctx.model || !c || c.geometry.type !== 'LineString') return { equation: '', outputs: {}, source: '', assumptions: [], reviewStatus: 'NOT_REVIEWED', status: 'REQUIRES_INPUT', objectIds: [], message: 'Contour not found.' }
    const target = Number(c.attributes.elevationFt)
    const samples = surfaceSamples(ctx.model, c.status === 'PROPOSED' ? 'proposed' : 'existing').filter(s => s.objectId !== c.id)
    const devs = c.geometry.coordinates.map(p => interpolateElevation(samples, p[0], p[1])?.z).filter((z): z is number => z != null).map(z => z - target)
    if (!devs.length) return { equation: '', outputs: {}, source: 'model', assumptions: [], reviewStatus: 'NOT_REVIEWED', status: 'REQUIRES_INPUT', objectIds: [c.id], message: 'No surface to compare against.' }
    const maxDev = Math.max(...devs.map(Math.abs))
    return { equation: 'max |z_surface − z_contour|', outputs: { maxDeviationFt: r(maxDev) }, source: 'model', assumptions: ['Half the contour interval is the usual tolerance.'], reviewStatus: 'NOT_REVIEWED', status: maxDev <= 1 ? 'PASS' : 'WARNING', objectIds: [c.id], message: `contour departs from the surface by up to ${r(maxDev)} ft` }
  },
})

def({
  id: 'cut_fill', name: 'Cut / fill — earthwork volume', method: 'Grid method, 5 ft cells', reference: 'Average-end-area equivalent on a regular grid',
  inputs: { padId: { unit: '-', required: true, description: 'GradingPad object with elevationFt' } },
  run(i, ctx) {
    const pad = ctx.model?.objects.find(o => o.id === i.padId)
    if (!ctx.model || !pad || pad.geometry.type !== 'Polygon') return { equation: '', outputs: {}, source: '', assumptions: [], reviewStatus: 'NOT_REVIEWED', status: 'REQUIRES_INPUT', objectIds: [], message: 'Pad not found.' }
    const padZ = Number(pad.attributes.elevationFt)
    if (!Number.isFinite(padZ)) return { equation: '', outputs: {}, source: '', assumptions: [], reviewStatus: 'NOT_REVIEWED', status: 'REQUIRES_INPUT', objectIds: [pad.id], message: 'Pad has no elevation.' }
    const samples = surfaceSamples(ctx.model, 'existing')
    if (samples.length < 3) return { equation: '', outputs: {}, source: 'model', assumptions: [], reviewStatus: 'NOT_REVIEWED', status: 'REQUIRES_INPUT', objectIds: [pad.id], message: 'No existing surface.' }
    const ring = openRing(pad.geometry.coordinates[0])
    const xs = ring.map(p => p[0]), ys = ring.map(p => p[1]), cell = 5
    let cut = 0, fill = 0
    const inside = (p: XY) => { let h = false; for (let a = 0, b = ring.length - 1; a < ring.length; b = a++) { const [xa, ya] = ring[a], [xb, yb] = ring[b]; if ((ya > p[1]) !== (yb > p[1]) && p[0] < ((xb - xa) * (p[1] - ya)) / ((yb - ya) || 1e-12) + xa) h = !h } return h }
    for (let x = Math.min(...xs) + cell / 2; x < Math.max(...xs); x += cell) for (let y = Math.min(...ys) + cell / 2; y < Math.max(...ys); y += cell) {
      if (!inside([x, y])) continue
      const ez = interpolateElevation(samples, x, y)!.z, dz = padZ - ez
      if (dz > 0) fill += dz * cell * cell; else cut += -dz * cell * cell
    }
    return {
      equation: 'V = Σ |z_pad − z_existing| · cell area', outputs: { cutCy: r(cut / 27, 1), fillCy: r(fill / 27, 1), netCy: r((fill - cut) / 27, 1) },
      source: 'model: pad and existing surface', assumptions: ['Within the pad footprint only; side-slope volumes beyond the pad are not included.', 'Existing surface by IDW between mapped elevations.', 'No shrink/swell factor applied.'],
      reviewStatus: 'NOT_REVIEWED', status: 'INFO', objectIds: [pad.id], message: `cut ${r(cut / 27, 1)} cy, fill ${r(fill / 27, 1)} cy`,
    }
  },
})

function lotOf(model: StudioModel) { return model.objects.find(o => o.type === 'ParcelBoundary' && o.status !== 'SUPERSEDED') }

def({
  id: 'lot_coverage', name: 'Lot coverage', method: 'Σ building footprint / lot area', reference: 'Zoning ordinance (lot coverage)',
  inputs: { maxCoveragePct: { unit: '%', required: false, description: 'defaults to the zoning context' } },
  run(i, ctx) {
    const m = ctx.model, lot = m && lotOf(m)
    if (!m || !lot) return { equation: '', outputs: {}, source: '', assumptions: [], reviewStatus: 'NOT_REVIEWED', status: 'REQUIRES_INPUT', objectIds: [], message: 'No parcel boundary.' }
    const bldg = m.objects.filter(o => (o.type === 'BuildingFootprint' || o.type === 'Structure') && o.status !== 'TO_BE_REMOVED' && o.status !== 'SUPERSEDED')
    const area = bldg.reduce((s, o) => s + polygonArea(o.geometry), 0), lotSf = polygonArea(lot.geometry)
    const pct = 100 * area / lotSf, max = i.maxCoveragePct ?? m.zoning?.coveragePct ?? null
    return {
      equation: 'coverage = Σ A_building / A_lot', outputs: { coveragePct: r(pct), buildingAreaSf: r(area, 0), lotAreaSf: r(lotSf, 0), maxCoveragePct: max },
      source: `model; limit ${m.zoning?.citation ?? 'stated'}`, assumptions: ['Building footprints only; some ordinances also count accessory structures or decks.'],
      reviewStatus: 'NOT_REVIEWED', status: max == null ? 'REQUIRES_INPUT' : pct <= max ? 'PASS' : 'FAIL', objectIds: [lot.id, ...bldg.map(o => o.id)],
      message: `${r(pct)}%` + (max != null ? ` of ${max}% allowed` : ' — no coverage limit in the zoning context'),
    }
  },
})

def({
  id: 'impervious_area', name: 'Impervious area', method: 'Σ impervious polygons', reference: 'Site data',
  inputs: {},
  run(_i, ctx) {
    const m = ctx.model, lot = m && lotOf(m)
    if (!m || !lot) return { equation: '', outputs: {}, source: '', assumptions: [], reviewStatus: 'NOT_REVIEWED', status: 'REQUIRES_INPUT', objectIds: [], message: 'No parcel boundary.' }
    const imp = m.objects.filter(o => IMPERVIOUS_TYPES.has(o.type) && o.geometry.type === 'Polygon' && o.status !== 'TO_BE_REMOVED' && o.status !== 'SUPERSEDED')
    const area = imp.reduce((s, o) => s + polygonArea(o.geometry), 0), lotSf = polygonArea(lot.geometry)
    return { equation: 'A_imp = Σ A_i', outputs: { imperviousSf: r(area, 0), imperviousPct: r(100 * area / lotSf) }, source: 'model', assumptions: ['Line-drawn features (without a polygon) are not counted.'], reviewStatus: 'NOT_REVIEWED', status: 'INFO', objectIds: [lot.id, ...imp.map(o => o.id)], message: `${r(area, 0)} sf (${r(100 * area / lotSf)}%)` }
  },
})

def({
  id: 'setback_clearance', name: 'Setback clearance', method: 'Minimum distance to each lot line, by yard', reference: 'Zoning ordinance (yards)',
  inputs: { buildingId: { unit: '-', required: false, description: 'defaults to every proposed building' } },
  run(i, ctx) {
    const m = ctx.model
    if (!m) return { equation: '', outputs: {}, source: '', assumptions: [], reviewStatus: 'NOT_REVIEWED', status: 'REQUIRES_INPUT', objectIds: [], message: 'No model.' }
    const rows = setbackClearances(m, i.buildingId)
    if (!rows.length) return { equation: '', outputs: {}, source: 'model', assumptions: [], reviewStatus: 'NOT_REVIEWED', status: 'REQUIRES_INPUT', objectIds: [], message: 'No proposed building, or no lot lines classified as front/side/rear.' }
    const fails = rows.filter(x => x.status === 'FAIL')
    return {
      equation: 'clearance = min distance(building, lot line)', outputs: { rows }, source: `model; required yards ${m.zoning?.citation ?? 'stated on the lot lines'}`,
      assumptions: ['Lot lines are classified front/side/rear on the ParcelBoundary edges (attributes.edgeYards).', 'Projections (eaves, steps) are not modelled.'],
      reviewStatus: 'NOT_REVIEWED', status: fails.length ? 'FAIL' : rows.some(x => x.status === 'REQUIRES_INPUT') ? 'REQUIRES_INPUT' : 'PASS',
      objectIds: [...new Set(rows.flatMap(x => [x.buildingId, x.lotId]))],
      message: fails.length ? fails.map(f => `${f.yard} ${f.clearanceFt} ft < ${f.requiredFt} ft`).join('; ') : 'all yards met',
    }
  },
})

export interface SetbackRow { buildingId: string; lotId: string; yard: 'front' | 'side' | 'rear'; edgeIndex: number; requiredFt: number | null; clearanceFt: number; status: 'PASS' | 'FAIL' | 'REQUIRES_INPUT' }

/** Clearance from each proposed building to each classified lot line. */
export function setbackClearances(m: StudioModel, buildingId?: string): SetbackRow[] {
  const lot = lotOf(m)
  if (!lot || lot.geometry.type !== 'Polygon') return []
  const yards = (lot.attributes.edgeYards as ('front' | 'side' | 'rear')[] | undefined) ?? []
  const ring = openRing(lot.geometry.coordinates[0])
  const req = (y: string) => (y === 'front' ? m.zoning?.frontFt : y === 'side' ? m.zoning?.sideFt : m.zoning?.rearFt) ?? null
  const bldgs = m.objects.filter(o => o.type === 'BuildingFootprint' && o.status === 'PROPOSED' && (!buildingId || o.id === buildingId))
  const rows: SetbackRow[] = []
  for (const b of bldgs) {
    const best = new Map<string, SetbackRow>()
    ring.forEach((a, k) => {
      const yard = yards[k]
      if (!yard) return
      const edge = { type: 'LineString' as const, coordinates: [a, ring[(k + 1) % ring.length]] as any }
      const d = r(minDistance(b.geometry, edge))
      const need = req(yard)
      const row: SetbackRow = { buildingId: b.id, lotId: lot.id, yard, edgeIndex: k, requiredFt: need, clearanceFt: d, status: need == null ? 'REQUIRES_INPUT' : d + 0.01 >= need ? 'PASS' : 'FAIL' }
      const prev = best.get(yard)
      if (!prev || d < prev.clearanceFt) best.set(yard, row)
    })
    rows.push(...best.values())
  }
  return rows
}

/** Required horizontal separations, ft. Ten States Standards §38.3 for water/sewer; others are common utility-owner minimums. */
export const UTILITY_SEPARATION_FT: Record<string, number> = {
  'WaterLine|SewerLine': 10, 'WaterLine|Pipe': 5, 'SewerLine|GasLine': 5, 'WaterLine|GasLine': 3,
  'ElectricLine|GasLine': 3, 'ElectricLine|TelecomLine': 1, 'Pipe|SewerLine': 5,
}
export function requiredSeparation(a: string, b: string): number | null {
  return UTILITY_SEPARATION_FT[`${a}|${b}`] ?? UTILITY_SEPARATION_FT[`${b}|${a}`] ?? null
}

def({
  id: 'utility_clearance', name: 'Utility horizontal separation', method: 'Minimum plan distance between utilities', reference: 'Recommended Standards for Water Works (Ten States) §8.8; utility owner standards',
  inputs: {},
  run(_i, ctx) {
    const m = ctx.model
    if (!m) return { equation: '', outputs: {}, source: '', assumptions: [], reviewStatus: 'NOT_REVIEWED', status: 'REQUIRES_INPUT', objectIds: [], message: 'No model.' }
    const utils = m.objects.filter(o => ['WaterLine', 'SewerLine', 'GasLine', 'ElectricLine', 'TelecomLine', 'Pipe'].includes(o.type) && o.status !== 'SUPERSEDED')
    const rows: Record<string, unknown>[] = []
    for (let a = 0; a < utils.length; a++) for (let b = a + 1; b < utils.length; b++) {
      const need = requiredSeparation(utils[a].type, utils[b].type)
      if (need == null) continue
      const d = minDistance(utils[a].geometry, utils[b].geometry)
      rows.push({ a: utils[a].id, b: utils[b].id, types: `${utils[a].type}/${utils[b].type}`, requiredFt: need, clearanceFt: r(d), status: d >= need ? 'PASS' : 'FAIL' })
    }
    const fails = rows.filter(x => x.status === 'FAIL')
    return {
      equation: 'clearance = min plan distance', outputs: { pairs: rows }, source: 'model', assumptions: ['Horizontal only; vertical separation at crossings needs profiles.', 'Existing utility locations are only as good as their source (see provenance).'],
      reviewStatus: 'NOT_REVIEWED', status: fails.length ? 'FAIL' : 'PASS', objectIds: utils.map(u => u.id),
      message: fails.length ? `${fails.length} pair(s) closer than required` : `${rows.length} pair(s) checked`,
    }
  },
})

def({
  id: 'sight_distance', name: 'Stopping sight distance', method: 'AASHTO SSD', reference: 'AASHTO Green Book',
  inputs: { designSpeedMph: { unit: 'mph', required: true, description: '' }, gradePercent: { unit: '%', required: false, description: '' }, availableFt: { unit: 'ft', required: false, description: 'measured available sight distance' } },
  run(i) {
    const c = stoppingSightDistance(i.designSpeedMph, i.gradePercent ?? 0)
    return { equation: c.equation, outputs: { requiredFt: c.value, availableFt: i.availableFt ?? null }, source: 'stated inputs', assumptions: c.assumptions, reviewStatus: 'NOT_REVIEWED', status: i.availableFt == null ? 'REQUIRES_INPUT' : i.availableFt >= c.value ? 'PASS' : 'FAIL', objectIds: [], message: `SSD required ${c.value} ft` + (i.availableFt != null ? `, available ${i.availableFt} ft` : '') }
  },
})

def({
  id: 'ada_slope', name: 'Accessible route slope', method: 'Running and cross slope limits', reference: '2010 ADA Standards §403.3, §405.2',
  inputs: { runningSlopePct: { unit: '%', required: true, description: '' }, crossSlopePct: { unit: '%', required: true, description: '' }, isRamp: { unit: '-', required: false, description: 'true where a ramp with handrails is provided' } },
  run(i) {
    const maxRun = i.isRamp ? 8.33 : 5, ok = Math.abs(i.runningSlopePct) <= maxRun && Math.abs(i.crossSlopePct) <= 2
    return { equation: `running ≤ ${maxRun}% ; cross ≤ 2%`, outputs: { maxRunningPct: maxRun, maxCrossPct: 2 }, source: 'stated inputs', assumptions: ['Federal standard; the jurisdiction may adopt stricter limits.'], reviewStatus: 'NOT_REVIEWED', status: ok ? 'PASS' : 'FAIL', objectIds: [], message: `running ${i.runningSlopePct}%, cross ${i.crossSlopePct}%` }
  },
})

def({
  id: 'driveway_grade', name: 'Driveway grade', method: 'Maximum grade between profile vertices', reference: 'Jurisdiction driveway standard; 15% screening maximum otherwise',
  inputs: { drivewayId: { unit: '-', required: true, description: 'Driveway with a 3D centreline (attributes.centerline) or 3D polygon' }, maxGradePct: { unit: '%', required: false, description: 'default 15' } },
  run(i, ctx) {
    const d = ctx.model?.objects.find(o => o.id === i.drivewayId)
    if (!d) return { equation: '', outputs: {}, source: '', assumptions: [], reviewStatus: 'NOT_REVIEWED', status: 'REQUIRES_INPUT', objectIds: [], message: 'Driveway not found.' }
    const line = drivewayProfile(d, ctx.model!)
    if (!line) return { equation: '', outputs: {}, source: 'model', assumptions: [], reviewStatus: 'NOT_REVIEWED', status: 'REQUIRES_INPUT', objectIds: [d.id], message: 'Driveway has no elevations — set elevations or slope first.' }
    let maxG = 0
    for (let k = 1; k < line.length; k++) {
      const run = Math.hypot(line[k][0] - line[k - 1][0], line[k][1] - line[k - 1][1])
      if (run > 1e-6) maxG = Math.max(maxG, Math.abs((line[k][2] - line[k - 1][2]) / run) * 100)
    }
    const limit = i.maxGradePct ?? 15
    return { equation: 'g = max |Δz/Δs|', outputs: { maxGradePct: r(maxG), limitPct: limit, lengthFt: r(lineLength(line)) }, source: 'model', assumptions: ['Grade between stated vertices; vertical curves are not modelled.'], reviewStatus: 'NOT_REVIEWED', status: maxG <= limit + 1e-9 ? 'PASS' : 'FAIL', objectIds: [d.id], message: `max ${r(maxG)}% (limit ${limit}%)` }
  },
})

/** A driveway's 3D centreline: attributes.centerline, else the 3D polyline itself. */
export function drivewayProfile(d: StudioObject, _m: StudioModel): [number, number, number][] | null {
  const cl = d.attributes.centerline as number[][] | undefined
  const pts = cl ?? (d.geometry.type === 'LineString' ? d.geometry.coordinates : null)
  if (!pts || pts.length < 2 || !pts.every(p => Number.isFinite(p[2]))) return null
  return pts.map(p => [p[0], p[1], p[2]] as [number, number, number])
}

// ── Public API ─────────────────────────────────────────────────────────────

export function listCalculations() {
  return defs.map(d => ({ id: d.id, name: d.name, method: d.method, reference: d.reference, inputs: d.inputs }))
}

/**
 * Runs one registered calculation. Missing required inputs return
 * REQUIRES_INPUT with the names — never a default the caller did not choose.
 */
export function runCalculation(calcId: string, inputs: Record<string, unknown>, ctx: CalcContext): CalculationRecord {
  const d = defs.find(x => x.id === calcId)
  const now = (ctx.now ?? (() => new Date().toISOString()))()
  const base = {
    calcId, engineVersion: STUDIO_ENGINE_VERSION, calculationVersion: STUDIO_CALC_VERSION, timestamp: now, actor: ctx.actor,
  }
  if (!d) {
    return { ...base, name: calcId, method: '', equation: '', reference: '', inputs, units: {}, outputs: {}, source: '', assumptions: [], reviewStatus: 'REQUIRES_PROFESSIONAL_REVIEW', status: 'UNSUPPORTED', objectIds: [], message: `No deterministic calculation "${calcId}" is registered. The engine does not estimate it.` }
  }
  const units = Object.fromEntries(Object.entries(d.inputs).map(([k, v]) => [k, v.unit]))
  const missing = Object.entries(d.inputs).filter(([k, v]) => v.required && (inputs[k] == null || inputs[k] === '')).map(([k]) => k)
  if (missing.length) {
    return { ...base, name: d.name, method: d.method, equation: '', reference: d.reference, inputs, units, outputs: {}, source: '', assumptions: [], reviewStatus: 'NOT_REVIEWED', status: 'REQUIRES_INPUT', objectIds: [], message: `Missing input: ${missing.join(', ')}.` }
  }
  try {
    const res = d.run(inputs as Record<string, any>, ctx)
    return { ...base, name: d.name, method: d.method, reference: d.reference, units, ...res, inputs: res.inputs ?? inputs }
  } catch (e) {
    return { ...base, name: d.name, method: d.method, equation: '', reference: d.reference, inputs, units, outputs: {}, source: '', assumptions: [], reviewStatus: 'NOT_REVIEWED', status: 'REQUIRES_INPUT', objectIds: [], message: e instanceof Error ? e.message : String(e) }
  }
}

export { verticesOf }
