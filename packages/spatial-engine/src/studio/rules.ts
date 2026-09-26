/**
 * Design checks over the canonical model.
 *
 * The REQUIREMENT comes from the rule engine (rules/evaluate.ts) through
 * `ZoningContext.requirements`; this file measures the DESIGN against it and
 * keeps the whole trace — rule source, version, effective date, the certified
 * or not state, the measured value and the calculation that measured it — so
 * a professional can click any PASS and see why.
 *
 * A PASS against an uncertified requirement is still a PASS, but it carries
 * `requiredReview`: the geometry complies with a number nobody has certified.
 */

import {
  type StudioModel, type StudioObject, type RequirementRef, requirementFor,
  ENVIRONMENTAL_TYPES, IMPERVIOUS_TYPES, SURVEYED_SOURCES, SOURCE_RELIABILITY,
} from './model'
import { overlapArea, containedIn, isValidGeometry, minDistance, polygonArea } from './geometry'
import { setbackClearances, runCalculation, drivewayProfile, requiredSeparation, pipeFullFlow } from './calculations'

export type RuleStatus = 'PASS' | 'FAIL' | 'WARNING' | 'BLOCKED' | 'REQUIRES_REVIEW' | 'NOT_APPLICABLE'
export type RuleSeverity = 'ERROR' | 'WARNING' | 'INFO'

export interface RuleResult {
  /** Stable across revisions: code + objects, so new/resolved can be diffed. */
  key: string
  code: string
  title: string
  jurisdiction: string | null
  ruleSource: string | null
  ruleVersion: string | null
  effectiveDate: string | null
  citation: string | null
  applicability: 'APPLIES' | 'NOT_APPLICABLE' | 'UNRESOLVED'
  input: Record<string, unknown>
  result: string
  status: RuleStatus
  severity: RuleSeverity
  /** Confidence in the REQUIREMENT (from the rule pack), not in the geometry. */
  confidence: number
  requiredReview: { discipline: string; reason: string } | null
  override: { by: string; reason: string; at: string } | null
  objectIds: string[]
  trace: { required: string | null; measured: string | null; method: string; calcId: string | null }
}

export interface RuleOverride { key: string; by: string; reason: string; at: string }

function reqFields(req: RequirementRef | null) {
  return {
    ruleSource: req?.ruleSource ?? null, ruleVersion: req?.ruleVersion ?? null,
    effectiveDate: req?.effectiveDate ?? null, citation: req?.citation ?? null,
    confidence: req?.confidence ?? 0,
  }
}

function reviewFor(req: RequirementRef | null): RuleResult['requiredReview'] {
  if (!req) return { discipline: 'land_use_planner', reason: 'No requirement determined for this jurisdiction and zone.' }
  if (req.outcome === 'APPLIED_CERTIFIED') return null
  return { discipline: req.reviewDiscipline ?? 'land_use_planner', reason: `Requirement ${req.outcome.replace(/_/g, ' ').toLowerCase()}: ${req.reviewReasons.join(', ') || 'not certified'}` }
}

const live = (o: StudioObject) => o.status !== 'SUPERSEDED' && o.status !== 'TO_BE_REMOVED'

/** Runs every design check. Pure: the same model always yields the same results. */
export function evaluateRules(model: StudioModel, overrides: RuleOverride[] = []): RuleResult[] {
  const out: RuleResult[] = []
  const jur = model.zoning?.jurisdictionCode ?? null
  const push = (r: Omit<RuleResult, 'override' | 'jurisdiction'>) => {
    const ov = overrides.find(o => o.key === r.key) ?? null
    out.push({ ...r, jurisdiction: jur, override: ov ? { by: ov.by, reason: ov.reason, at: ov.at } : null })
  }

  // ── Geometry validity ────────────────────────────────────────────────────
  for (const o of model.objects.filter(live)) {
    const bad = isValidGeometry(o.geometry)
    if (bad) push({
      key: `GEOMETRY_INVALID:${o.id}`, code: 'GEOMETRY_INVALID', title: 'Broken geometry', ...reqFields(null), confidence: 1,
      applicability: 'APPLIES', input: { objectId: o.id, type: o.type }, result: bad, status: 'FAIL', severity: 'ERROR',
      requiredReview: null, objectIds: [o.id], trace: { required: 'valid geometry', measured: bad, method: 'geometry check', calcId: null },
    })
  }

  // ── Setbacks ─────────────────────────────────────────────────────────────
  for (const row of setbackClearances(model)) {
    const req = requirementFor(model.zoning, row.yard)
    const status: RuleStatus = row.status === 'REQUIRES_INPUT' ? 'BLOCKED' : row.status === 'FAIL' ? 'FAIL' : req && req.outcome !== 'APPLIED_CERTIFIED' ? 'REQUIRES_REVIEW' : 'PASS'
    push({
      key: `SETBACK_${row.yard.toUpperCase()}:${row.buildingId}`, code: `SETBACK_${row.yard.toUpperCase()}`,
      title: `${row.yard[0].toUpperCase()}${row.yard.slice(1)} setback`, ...reqFields(req),
      applicability: 'APPLIES', input: { buildingId: row.buildingId, edgeIndex: row.edgeIndex, requiredFt: row.requiredFt, clearanceFt: row.clearanceFt },
      result: row.requiredFt == null ? `No ${row.yard} yard requirement determined` : `${row.clearanceFt} ft provided, ${row.requiredFt} ft required`,
      status, severity: status === 'FAIL' || status === 'BLOCKED' ? 'ERROR' : status === 'REQUIRES_REVIEW' ? 'WARNING' : 'INFO',
      requiredReview: status === 'PASS' ? null : reviewFor(req), objectIds: [row.buildingId, row.lotId],
      trace: { required: row.requiredFt == null ? null : `${row.requiredFt} ft`, measured: `${row.clearanceFt} ft`, method: 'minimum distance, building to classified lot line', calcId: 'setback_clearance' },
    })
  }

  // ── Coverage ─────────────────────────────────────────────────────────────
  const lot = model.objects.find(o => o.type === 'ParcelBoundary' && live(o))
  if (lot && model.objects.some(o => o.type === 'BuildingFootprint' && o.status === 'PROPOSED')) {
    const req = requirementFor(model.zoning, 'coverage')
    const c = runCalculation('lot_coverage', {}, { actor: { type: 'system', id: 'rules' }, model, now: () => '' })
    const pct = Number(c.outputs.coveragePct)
    const status: RuleStatus = !req || req.value == null ? 'NOT_APPLICABLE' : pct > req.value ? 'FAIL' : req.outcome !== 'APPLIED_CERTIFIED' ? 'REQUIRES_REVIEW' : 'PASS'
    push({
      key: `LOT_COVERAGE:${lot.id}`, code: 'LOT_COVERAGE', title: 'Lot coverage', ...reqFields(req),
      applicability: req ? 'APPLIES' : 'NOT_APPLICABLE', input: c.outputs, result: c.message, status,
      severity: status === 'FAIL' ? 'ERROR' : status === 'REQUIRES_REVIEW' ? 'WARNING' : 'INFO',
      requiredReview: status === 'REQUIRES_REVIEW' ? reviewFor(req) : null, objectIds: c.objectIds,
      trace: { required: req?.value != null ? `${req.value}%` : null, measured: `${pct}%`, method: c.equation, calcId: 'lot_coverage' },
    })
  }

  // ── Encroachments ────────────────────────────────────────────────────────
  const buildings = model.objects.filter(o => (o.type === 'BuildingFootprint' || o.type === 'Structure') && o.status === 'PROPOSED')
  const easements = model.objects.filter(o => o.type === 'Easement' && live(o))
  for (const b of buildings) for (const e of easements) {
    const a = overlapArea(b.geometry, e.geometry)
    if (a > 0.5) push({
      key: `EASEMENT_ENCROACHMENT:${b.id}:${e.id}`, code: 'EASEMENT_ENCROACHMENT', title: 'Building in an easement', ...reqFields(null), confidence: 1,
      citation: String(e.attributes.recordReference ?? e.sourceAuthority ?? 'recorded easement'),
      applicability: 'APPLIES', input: { overlapSf: Math.round(a) }, result: `${Math.round(a)} sf of the building lies inside the ${e.attributes.easementType ?? ''} easement`,
      status: 'FAIL', severity: 'ERROR', requiredReview: null, objectIds: [b.id, e.id],
      trace: { required: '0 sf', measured: `${Math.round(a)} sf`, method: 'polygon overlap', calcId: null },
    })
  }
  const envelope = model.objects.find(o => o.type === 'BuildableArea' && live(o))
  if (envelope) for (const b of buildings.filter(x => x.type === 'BuildingFootprint')) {
    const ok = containedIn(b.geometry, envelope.geometry)
    push({
      key: `BUILDABLE_AREA:${b.id}`, code: 'BUILDABLE_AREA', title: 'Building within the buildable area', ...reqFields(requirementFor(model.zoning, 'front')),
      applicability: 'APPLIES', input: {}, result: ok ? 'inside the buildable area' : 'outside the buildable area',
      status: ok ? 'PASS' : 'FAIL', severity: ok ? 'INFO' : 'ERROR', requiredReview: null, objectIds: [b.id, envelope.id],
      trace: { required: 'contained', measured: ok ? 'contained' : 'not contained', method: 'point-in-polygon, every vertex', calcId: null },
    })
  }
  const impervious = model.objects.filter(o => IMPERVIOUS_TYPES.has(o.type) && o.status === 'PROPOSED' && o.geometry.type === 'Polygon')
  for (const env of model.objects.filter(o => ENVIRONMENTAL_TYPES.has(o.type) && live(o))) for (const b of impervious) {
    const a = overlapArea(b.geometry, env.geometry)
    if (a <= 0.5) continue
    const hard = env.type === 'Floodway' || env.type === 'Wetland'
    push({
      key: `ENVIRONMENTAL:${b.id}:${env.id}`, code: 'ENVIRONMENTAL_ENCROACHMENT', title: `${b.type} in ${env.type}`, ...reqFields(null), confidence: SOURCE_RELIABILITY[env.source] / 2,
      citation: env.sourceAuthority, applicability: 'APPLIES', input: { overlapSf: Math.round(a) },
      result: `${Math.round(a)} sf of proposed ${b.type} inside the ${env.type}`, status: hard ? 'FAIL' : 'REQUIRES_REVIEW',
      severity: hard ? 'ERROR' : 'WARNING', requiredReview: { discipline: 'environmental_professional', reason: `${env.type} encroachment needs a permit determination` },
      objectIds: [b.id, env.id], trace: { required: '0 sf', measured: `${Math.round(a)} sf`, method: 'polygon overlap', calcId: null },
    })
  }

  // ── Access ───────────────────────────────────────────────────────────────
  for (const d of model.objects.filter(o => o.type === 'Driveway' && o.status === 'PROPOSED')) {
    const width = Number(d.attributes.widthFt)
    if (Number.isFinite(width)) push({
      key: `DRIVEWAY_WIDTH:${d.id}`, code: 'DRIVEWAY_WIDTH', title: 'Driveway width', ...reqFields(null), confidence: 0.6,
      citation: 'Residential screening minimum 10 ft; the jurisdiction standard governs',
      applicability: 'APPLIES', input: { widthFt: width }, result: `${width} ft`, status: width >= 10 ? 'PASS' : 'FAIL',
      severity: width >= 10 ? 'INFO' : 'ERROR', requiredReview: null, objectIds: [d.id],
      trace: { required: '≥ 10 ft', measured: `${width} ft`, method: 'stated width', calcId: null },
    })
    const limit = Number(d.attributes.maxGradePct ?? model.design?.maxDrivewayGradePct ?? 15)
    const prof = drivewayProfile(d, model)
    if (prof) {
      const c = runCalculation('driveway_grade', { drivewayId: d.id, maxGradePct: limit }, { actor: { type: 'system', id: 'rules' }, model, now: () => '' })
      push({
        key: `DRIVEWAY_GRADE:${d.id}`, code: 'DRIVEWAY_GRADE', title: 'Driveway grade', ...reqFields(null), confidence: 0.6,
        citation: d.attributes.maxGradePct || model.design?.maxDrivewayGradePct ? 'project driveway grade limit' : '15% screening maximum; the jurisdiction standard governs',
        applicability: 'APPLIES', input: c.outputs, result: c.message, status: c.status === 'PASS' ? 'PASS' : 'FAIL',
        severity: c.status === 'PASS' ? 'INFO' : 'ERROR', requiredReview: null, objectIds: [d.id],
        trace: { required: `≤ ${limit}%`, measured: `${c.outputs.maxGradePct}%`, method: c.equation, calcId: 'driveway_grade' },
      })
    }
  }

  // ── Utilities ────────────────────────────────────────────────────────────
  const utils = model.objects.filter(o => ['WaterLine', 'SewerLine', 'GasLine', 'ElectricLine', 'TelecomLine', 'Pipe'].includes(o.type) && live(o))
  for (let a = 0; a < utils.length; a++) for (let b = a + 1; b < utils.length; b++) {
    const need = requiredSeparation(utils[a].type, utils[b].type)
    if (need == null) continue
    const d = minDistance(utils[a].geometry, utils[b].geometry)
    if (d >= need) continue
    push({
      key: `UTILITY_SEPARATION:${utils[a].id}:${utils[b].id}`, code: 'UTILITY_SEPARATION', title: 'Utility separation', ...reqFields(null), confidence: 0.9,
      citation: 'Ten States Standards §8.8 / utility owner minimum', applicability: 'APPLIES', input: { requiredFt: need, clearanceFt: Math.round(d * 100) / 100 },
      result: `${Math.round(d * 10) / 10} ft between ${utils[a].type} and ${utils[b].type}; ${need} ft required`,
      status: 'FAIL', severity: 'ERROR', requiredReview: { discipline: 'professional_engineer', reason: 'reduced separation needs an engineered protection detail or a waiver' },
      objectIds: [utils[a].id, utils[b].id], trace: { required: `${need} ft`, measured: `${Math.round(d * 100) / 100} ft`, method: 'minimum plan distance', calcId: 'utility_clearance' },
    })
  }
  for (const p of model.objects.filter(o => o.type === 'Pipe' && o.status === 'PROPOSED')) {
    const D = Number(p.attributes.diameterIn), S = Number(p.attributes.slopeFtPerFt), n = Number(p.attributes.manningN ?? 0.013)
    const Q = p.attributes.designFlowCfs == null ? null : Number(p.attributes.designFlowCfs)
    if (!Number.isFinite(D) || !Number.isFinite(S) || S <= 0) {
      push({
        key: `PIPE_CAPACITY:${p.id}`, code: 'PIPE_CAPACITY', title: 'Storm pipe capacity', ...reqFields(null), confidence: 1, citation: 'HEC-22',
        applicability: 'APPLIES', input: {}, result: 'Pipe has no diameter or slope', status: 'BLOCKED', severity: 'ERROR',
        requiredReview: null, objectIds: [p.id], trace: { required: null, measured: null, method: 'Manning full flow', calcId: 'pipe_capacity' },
      })
      continue
    }
    const f = pipeFullFlow(D, S, n)
    const status: RuleStatus = Q == null ? 'BLOCKED' : f.qFullCfs >= Q ? (f.vFullFps < 2 ? 'WARNING' : 'PASS') : 'FAIL'
    push({
      key: `PIPE_CAPACITY:${p.id}`, code: 'PIPE_CAPACITY', title: 'Storm pipe capacity', ...reqFields(null), confidence: 1, citation: 'FHWA HEC-22 §6',
      applicability: 'APPLIES', input: { diameterIn: D, slopePct: Math.round(S * 10000) / 100, manningN: n, capacityCfs: Math.round(f.qFullCfs * 100) / 100, designFlowCfs: Q },
      result: Q == null ? 'No design flow on the pipe — run the drainage calculation' : `${Math.round(f.qFullCfs * 100) / 100} cfs capacity, ${Q} cfs design`,
      status, severity: status === 'PASS' ? 'INFO' : status === 'WARNING' ? 'WARNING' : 'ERROR',
      requiredReview: { discipline: 'professional_engineer', reason: 'storm drain design is sealed engineering' }, objectIds: [p.id],
      trace: { required: Q == null ? null : `${Q} cfs`, measured: `${Math.round(f.qFullCfs * 100) / 100} cfs`, method: 'Q = (1.486/n)·A·R^(2/3)·S^(1/2)', calcId: 'pipe_capacity' },
    })
  }

  // ── Provenance ───────────────────────────────────────────────────────────
  for (const o of model.objects.filter(x => x.source === 'AI_INFERRED' && live(x))) push({
    key: `AI_INFERRED:${o.id}`, code: 'AI_INFERRED_UNCONFIRMED', title: 'AI-inferred geometry not confirmed', ...reqFields(null), confidence: o.confidence,
    applicability: 'APPLIES', input: { type: o.type }, result: `${o.type} was inferred, not measured — confirm or replace it before issuance`,
    status: 'REQUIRES_REVIEW', severity: 'WARNING', requiredReview: { discipline: 'drafting', reason: 'AI-inferred data' }, objectIds: [o.id],
    trace: { required: 'measured or record source', measured: 'AI_INFERRED', method: 'provenance', calcId: null },
  })
  if (lot && !SURVEYED_SOURCES.has(lot.source)) push({
    key: `BOUNDARY_NOT_SURVEYED:${lot.id}`, code: 'BOUNDARY_NOT_SURVEYED', title: 'Boundary is not from a survey or plat', ...reqFields(null), confidence: SOURCE_RELIABILITY[lot.source] / 2,
    citation: lot.sourceAuthority, applicability: 'APPLIES', input: { source: lot.source },
    result: `Boundary is ${lot.source.replace(/_/g, ' ').toLowerCase()} — setbacks measured from it are preliminary`,
    status: 'REQUIRES_REVIEW', severity: 'WARNING', requiredReview: { discipline: 'surveyor', reason: 'field verification of the boundary' }, objectIds: [lot.id],
    trace: { required: 'recorded plat or boundary survey', measured: lot.source, method: 'provenance', calcId: null },
  })

  // Overridden FAILs report as overridden, never as passing.
  return out.map(r => (r.override && (r.status === 'FAIL' || r.status === 'REQUIRES_REVIEW') ? { ...r, result: `${r.result} — OVERRIDDEN by ${r.override.by}: ${r.override.reason}` } : r))
}

/** New and resolved findings between two rule runs, keyed by rule key. */
export function diffRules(before: RuleResult[], after: RuleResult[]) {
  const bad = (r: RuleResult) => r.status === 'FAIL' || r.status === 'BLOCKED' || r.status === 'WARNING' || r.status === 'REQUIRES_REVIEW'
  const b = new Map(before.filter(bad).map(r => [r.key, r])), a = new Map(after.filter(bad).map(r => [r.key, r]))
  const changed = after.filter(r => { const p = before.find(x => x.key === r.key); return p && (p.status !== r.status || p.result !== r.result) })
  return {
    newWarnings: [...a.values()].filter(r => !b.has(r.key)),
    resolvedWarnings: [...b.values()].filter(r => !a.has(r.key)),
    changed,
  }
}

export { polygonArea }
