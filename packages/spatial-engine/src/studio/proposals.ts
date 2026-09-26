/**
 * Proposals: the only path from intent to the canonical model.
 *
 *   intent → commands → validation → execution on a COPY → rules and affected
 *   calculations re-run → preview/diff → human ACCEPT / MODIFY / REJECT →
 *   new revision.
 *
 * A proposal is computed against a base revision. If the model moved on before
 * it was accepted, acceptance is refused as STALE and the proposal must be
 * re-run — a preview is only true of the revision it was computed on.
 */

import { type StudioModel, type StudioObject, STUDIO_ENGINE_VERSION } from './model'
import { type StudioCommand, type ObjectChange, type CommandError, validateCommand, executeCommand, isMaterial, type ExecuteContext } from './commands'
import { evaluateRules, diffRules, type RuleResult, type RuleOverride } from './rules'
import { runCalculation, type CalculationRecord } from './calculations'
import { centroid } from './geometry'

export type StopCondition = 'BLOCKED' | 'REQUIRES_INPUT' | 'REQUIRES_FIELD_VERIFICATION' | 'REQUIRES_PROFESSIONAL_REVIEW'

export interface ProposalPreview {
  added: StudioObject[]
  removed: StudioObject[]
  modified: { before: StudioObject; after: StudioObject; movedBy: { dx: number; dy: number } | null }[]
  affectedDimensions: { id: string; beforeFt: number | null; afterFt: number | null }[]
  affectedCalculations: { calcId: string; before: CalculationRecord | null; after: CalculationRecord }[]
  rules: { newWarnings: RuleResult[]; resolvedWarnings: RuleResult[]; changed: RuleResult[] }
}

export interface Proposal {
  id: string
  projectId: string
  baseRevision: number
  commands: StudioCommand[]
  status: 'PROPOSED' | 'INVALID' | 'ACCEPTED' | 'REJECTED' | 'SUPERSEDED' | 'STALE'
  errors: CommandError[]
  preview: ProposalPreview | null
  material: boolean
  stopConditions: { condition: StopCondition; reason: string }[]
  requestedBy: string
  createdAt: string
  engineVersion: string
}

export interface RevisionRecord {
  revision: number
  revisionId: string
  parentRevision: number
  proposalId: string | null
  commands: StudioCommand[]
  changes: ObjectChange[]
  summary: string
  createdBy: string
  createdAt: string
  engineVersion: string
}

export interface ProposalContext extends ExecuteContext {
  proposalId: string
  /** Calculations previously run on this project; the ones whose objects change are re-run. */
  priorCalculations?: CalculationRecord[]
  overrides?: RuleOverride[]
}

/** Runs commands in sequence on a copy. Never touches the input model. */
export function simulate(model: StudioModel, commands: StudioCommand[], ctx: ExecuteContext): { model: StudioModel; changes: ObjectChange[]; errors: CommandError[] } {
  let m = model
  const changes: ObjectChange[] = []
  const errors: CommandError[] = []
  for (const c of commands) {
    const errs = validateCommand(m, c)
    if (errs.length) { errors.push(...errs); break }
    try {
      const r = executeCommand(m, c, ctx)
      m = r.model; changes.push(...r.changes)
    } catch (e) {
      errors.push({ code: 'EXECUTION_FAILED', message: `${c.action}: ${e instanceof Error ? e.message : String(e)}` })
      break
    }
  }
  return { model: m, changes: mergeChanges(changes), errors }
}

function mergeChanges(changes: ObjectChange[]): ObjectChange[] {
  const byId = new Map<string, ObjectChange>()
  for (const c of changes) {
    const id = (c.after ?? c.before)!.id
    const prev = byId.get(id)
    byId.set(id, { before: prev ? prev.before : c.before, after: c.after })
  }
  return [...byId.values()].filter(c => c.before || c.after)
}

export function propose(model: StudioModel, commands: StudioCommand[], ctx: ProposalContext): Proposal {
  const base: Omit<Proposal, 'status' | 'errors' | 'preview' | 'stopConditions'> = {
    id: ctx.proposalId, projectId: model.projectId, baseRevision: model.revision, commands,
    material: isMaterial(commands), requestedBy: commands[0]?.requestedBy ?? ctx.actorId, createdAt: ctx.now, engineVersion: STUDIO_ENGINE_VERSION,
  }
  if (!commands.length) return { ...base, status: 'INVALID', errors: [{ code: 'NO_COMMANDS', message: 'Nothing to do.' }], preview: null, stopConditions: [{ condition: 'REQUIRES_INPUT', reason: 'The request did not resolve to any command.' }] }
  const sim = simulate(model, commands, ctx)
  if (sim.errors.length) {
    return { ...base, status: 'INVALID', errors: sim.errors, preview: null, stopConditions: sim.errors.map(e => ({ condition: e.code === 'RECORD_GEOMETRY_PROTECTED' ? 'REQUIRES_FIELD_VERIFICATION' as const : 'BLOCKED' as const, reason: e.message })) }
  }
  const before = evaluateRules(model, ctx.overrides), after = evaluateRules(sim.model, ctx.overrides)
  const rules = diffRules(before, after)
  const changedIds = new Set(sim.changes.map(c => (c.after ?? c.before)!.id))
  const preview: ProposalPreview = {
    added: sim.changes.filter(c => !c.before && c.after).map(c => c.after!),
    removed: sim.changes.filter(c => c.before && !c.after).map(c => c.before!),
    modified: sim.changes.filter(c => c.before && c.after).map(c => {
      const b = centroid(c.before!.geometry), a = centroid(c.after!.geometry)
      const dx = a[0] - b[0], dy = a[1] - b[1]
      return { before: c.before!, after: c.after!, movedBy: Math.hypot(dx, dy) > 1e-6 ? { dx: r2(dx), dy: r2(dy) } : null }
    }),
    affectedDimensions: sim.changes.filter(c => (c.after ?? c.before)!.type === 'Dimension').map(c => ({
      id: (c.after ?? c.before)!.id, beforeFt: num(c.before?.attributes.measuredFt), afterFt: c.after?.status === 'SUPERSEDED' ? null : num(c.after?.attributes.measuredFt),
    })),
    affectedCalculations: (ctx.priorCalculations ?? []).filter(k => k.objectIds.some(id => changedIds.has(id))).map(k => ({
      calcId: k.calcId, before: k, after: runCalculation(k.calcId, k.inputs, { actor: { type: 'system', id: 'proposal' }, model: sim.model, now: () => ctx.now }),
    })),
    rules,
  }
  // Default calculations always re-run on a geometric change, so a preview
  // shows coverage and setbacks even when nobody ran them explicitly.
  for (const id of ['lot_coverage', 'setback_clearance']) {
    if (preview.affectedCalculations.some(a => a.calcId === id)) continue
    if (![...changedIds].some(i => { const o = sim.model.objects.find(x => x.id === i) ?? model.objects.find(x => x.id === i); return o && (o.type === 'BuildingFootprint' || o.type === 'ParcelBoundary') })) continue
    preview.affectedCalculations.push({
      calcId: id, before: runCalculation(id, {}, { actor: { type: 'system', id: 'proposal' }, model, now: () => ctx.now }),
      after: runCalculation(id, {}, { actor: { type: 'system', id: 'proposal' }, model: sim.model, now: () => ctx.now }),
    })
  }
  return { ...base, status: 'PROPOSED', errors: [], preview, stopConditions: stopConditionsFor(rules.newWarnings) }
}

/** The findings a proposal introduces that a human must resolve. */
function stopConditionsFor(newWarnings: RuleResult[]): Proposal['stopConditions'] {
  const out: Proposal['stopConditions'] = []
  for (const w of newWarnings) {
    if (w.status === 'BLOCKED') out.push({ condition: 'REQUIRES_INPUT', reason: `${w.title}: ${w.result}` })
    else if (w.code === 'BOUNDARY_NOT_SURVEYED') out.push({ condition: 'REQUIRES_FIELD_VERIFICATION', reason: w.result })
    else if (w.status === 'FAIL' || w.status === 'REQUIRES_REVIEW') out.push({ condition: 'REQUIRES_PROFESSIONAL_REVIEW', reason: `${w.title}: ${w.result}` })
  }
  return out
}

export type AcceptResult =
  | { ok: true; model: StudioModel; revision: RevisionRecord }
  | { ok: false; status: 'STALE' | 'INVALID'; reason: string }

/**
 * Accept a proposal into a new revision. `modified` replaces the command list
 * (the MODIFY path) — it is re-validated and re-executed, never trusted.
 */
export function accept(model: StudioModel, proposal: Proposal, ctx: ExecuteContext & { revisionId: string }, modified?: StudioCommand[]): AcceptResult {
  if (proposal.status !== 'PROPOSED') return { ok: false, status: 'INVALID', reason: `Proposal is ${proposal.status}.` }
  if (proposal.baseRevision !== model.revision) return { ok: false, status: 'STALE', reason: `Proposal was computed on revision ${proposal.baseRevision}; the model is at ${model.revision}. Re-run it.` }
  const cmds = modified ?? proposal.commands
  const sim = simulate(model, cmds, ctx)
  if (sim.errors.length) return { ok: false, status: 'INVALID', reason: sim.errors.map(e => e.message).join(' ') }
  const revision = model.revision + 1
  const stamp = (o: StudioObject) => ({ ...o, revisionId: ctx.revisionId })
  const touched = new Set(sim.changes.map(c => (c.after ?? c.before)!.id))
  const next: StudioModel = {
    ...sim.model, revision, revisionId: ctx.revisionId,
    objects: sim.model.objects.map(o => (touched.has(o.id) ? stamp(o) : o)),
  }
  const changes = sim.changes.map(c => ({ before: c.before, after: c.after ? stamp(c.after) : null }))
  return {
    ok: true, model: next,
    revision: {
      revision, revisionId: ctx.revisionId, parentRevision: model.revision, proposalId: proposal.id, commands: cmds, changes,
      summary: summarise(cmds, changes), createdBy: ctx.actorId, createdAt: ctx.now, engineVersion: STUDIO_ENGINE_VERSION,
    },
  }
}

export function summarise(cmds: StudioCommand[], changes: ObjectChange[]): string {
  const add = changes.filter(c => !c.before).length, del = changes.filter(c => !c.after).length, mod = changes.length - add - del
  return `${cmds.map(c => c.action).join(', ')} — ${add} added, ${mod} modified, ${del} removed`
}

const r2 = (n: number) => Math.round(n * 100) / 100
const num = (v: unknown) => (v == null || !Number.isFinite(Number(v)) ? null : Number(v))
