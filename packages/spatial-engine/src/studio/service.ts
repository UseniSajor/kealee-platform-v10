/**
 * The Studio service — every action any interface can take, authorised here.
 *
 * API routes are thin: they resolve the caller to an `Actor` and call one of
 * these methods. Capability checks, licence checks, state gates, the
 * proposal/accept discipline, issuance invalidation and the audit log all live
 * in this one place, so a new interface (a CLI, a worker, a partner API)
 * cannot skip them by accident.
 */

import { randomUUID } from 'node:crypto'
import type { StudioModel } from './model'
import { STUDIO_ENGINE_VERSION } from './model'
import { type Actor, type Capability, type ProjectState, type CopilotMode, authorize, checkTransition, stateAfterMutation, MODE_CAPABILITY } from './access'
import { type StudioCommand } from './commands'
import { propose, accept, type Proposal, type RevisionRecord } from './proposals'
import { runCalculation, listCalculations, type CalculationRecord } from './calculations'
import { evaluateRules, type RuleOverride, type RuleResult } from './rules'
import { compileIntent, type CompiledIntent } from './intent'
import { interpretRedline, type Markup } from './redline'
import { productionChecklist, draftingIssues, readiness, type ProjectFacts, type SheetAudit } from './qa'
import { prepareIssuance, approveIssuance, executeIssuance, invalidateIssuance, type IssuanceRecord, type SignatureVerifier, type ExecutionMethod } from './issuance'
import { importRecords } from './import'
import type { StudioObject } from './model'
import { appendEvent, type EngineeringEvent, type NewEvent, betaMetrics } from './telemetry'

export interface ProjectRecord {
  id: string
  organizationId: string
  workspaceId: string
  name: string
  address: string | null
  jurisdictionCode: string | null
  /** The state whose licences govern professional acts on this project. */
  licenceState: string | null
  state: ProjectState
  currentRevision: number
  workflowId: string | null
  aiGenerated: boolean
  previouslySubmitted: boolean
  facts: ProjectFacts
  sheets: SheetAudit | null
  traditionalEstimateHours: number | null
  isDemo: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ProposalRow { proposal: Proposal; mode: string | null; prompt: string | null; decidedBy: string | null; decidedAt: string | null; decision: 'ACCEPTED' | 'MODIFIED' | 'REJECTED' | null; resultingRevision: number | null }

export interface StudioRepository {
  getProject(id: string): Promise<ProjectRecord | null>
  saveProject(p: ProjectRecord): Promise<void>
  getModel(projectId: string): Promise<StudioModel | null>
  /** Writes the new object state and the immutable revision together. */
  commitRevision(project: ProjectRecord, model: StudioModel, revision: RevisionRecord): Promise<void>
  listRevisions(projectId: string): Promise<RevisionRecord[]>
  getProposal(id: string): Promise<ProposalRow | null>
  saveProposal(row: ProposalRow & { organizationId: string; workspaceId: string }): Promise<void>
  listProposals(projectId: string, status?: string): Promise<ProposalRow[]>
  saveCalculation(projectId: string, revision: number, rec: CalculationRecord, ids: { organizationId: string; workspaceId: string }): Promise<void>
  listCalculations(projectId: string): Promise<CalculationRecord[]>
  lastEvent(organizationId: string): Promise<EngineeringEvent | null>
  insertEvent(e: EngineeringEvent): Promise<void>
  listEvents(projectId: string): Promise<EngineeringEvent[]>
  latestIssuance(projectId: string): Promise<IssuanceRecord | null>
  saveIssuance(rec: IssuanceRecord): Promise<void>
  listOverrides(projectId: string): Promise<RuleOverride[]>
  saveOverride(projectId: string, o: RuleOverride, ids: { organizationId: string; workspaceId: string }): Promise<void>
}

export class StudioError extends Error {
  constructor(public readonly status: 400 | 403 | 404 | 409 | 422, message: string) { super(message) }
}

export interface ServiceDeps {
  repo: StudioRepository
  llm?: Parameters<typeof compileIntent>[1]
  verifier?: SignatureVerifier | null
  now?: () => Date
  newId?: () => string
}

export class StudioService {
  private readonly repo: StudioRepository
  private readonly now: () => Date
  private readonly newId: () => string
  constructor(private readonly deps: ServiceDeps) {
    this.repo = deps.repo
    this.now = deps.now ?? (() => new Date())
    this.newId = deps.newId ?? (() => randomUUID())
  }

  // ── Access ──────────────────────────────────────────────────────────────

  private async load(actor: Actor, projectId: string, cap: Capability) {
    const project = await this.repo.getProject(projectId)
    if (!project) throw new StudioError(404, 'Project not found.')
    const a = authorize(actor, cap, { projectId, state: project.licenceState }, this.now())
    if (!a.allowed) throw new StudioError(403, a.reason)
    const model = await this.repo.getModel(projectId)
    if (!model) throw new StudioError(404, 'Project model not found.')
    return { project, model, licenceId: a.licenceId }
  }

  private async log(e: Omit<NewEvent, 'id' | 'occurredAt'> & { occurredAt?: string }): Promise<EngineeringEvent> {
    const prev = await this.repo.lastEvent(e.organizationId)
    const ev = appendEvent(prev, { ...e, id: this.newId() }, this.now().toISOString())
    await this.repo.insertEvent(ev)
    return ev
  }

  private eventBase(actor: Actor, p: ProjectRecord): Omit<NewEvent, 'id' | 'eventType'> {
    return {
      organizationId: p.organizationId, workspaceId: p.workspaceId, projectId: p.id, userId: actor.userId, role: actor.role, actorType: actor.type,
      mode: null, origin: null, prompt: null, selectedObjectIds: [], aiInterpretation: null, proposedCommands: null, validationResults: null,
      decision: null, manualEdits: null, resultingRevision: p.currentRevision, proposalId: null, rulesVersion: null, durationMs: null, detail: null,
    }
  }

  // ── Read ────────────────────────────────────────────────────────────────

  async getProject(actor: Actor, projectId: string) {
    const { project, model } = await this.load(actor, projectId, 'VIEW_PROJECT')
    const overrides = await this.repo.listOverrides(projectId)
    const rules = evaluateRules(model, overrides)
    const calcs = await this.repo.listCalculations(projectId)
    const checklist = productionChecklist(model, rules, calcs, project.facts, project.sheets)
    const iss = await this.repo.latestIssuance(projectId)
    return {
      project, model, rules, calculations: calcs, checklist, draftingIssues: draftingIssues(model, project.sheets),
      readiness: readiness(model, project.state, checklist, rules, calcs, iss ? (iss.state === 'INVALIDATED' || iss.revision !== model.revision ? 'INVALIDATED' : iss.state) : 'NONE', project.aiGenerated),
      issuance: iss, proposals: await this.repo.listProposals(projectId, 'PROPOSED'), revisions: await this.repo.listRevisions(projectId),
      calculationCatalog: listCalculations(),
    }
  }

  // ── Proposals ───────────────────────────────────────────────────────────

  /** Drawing-tool path: typed commands straight from the canvas. Same pipeline as the AI. */
  async proposeCommands(actor: Actor, projectId: string, commands: StudioCommand[], meta: { mode?: string | null; prompt?: string | null } = {}) {
    const { project, model } = await this.load(actor, projectId, 'PROPOSE_CHANGE')
    // The server stamps who asked; a client cannot propose in someone else's name
    // or claim a GENERATOR/IMPORT origin.
    const cmds = commands.map(c => ({ ...c, requestedBy: actor.userId, origin: (c.origin === 'AI' || c.origin === 'REDLINE') ? c.origin : 'TOOL' as const }))
    return this.createProposal(actor, project, model, cmds, meta)
  }

  private async createProposal(actor: Actor, project: ProjectRecord, model: StudioModel, cmds: StudioCommand[], meta: { mode?: string | null; prompt?: string | null; interpretation?: unknown }) {
    const now = this.now().toISOString()
    const p = propose(model, cmds, { proposalId: this.newId(), newId: this.newId, now, actorId: actor.userId, priorCalculations: await this.repo.listCalculations(project.id), overrides: await this.repo.listOverrides(project.id) })
    await this.repo.saveProposal({ proposal: p, mode: meta.mode ?? null, prompt: meta.prompt ?? null, decidedBy: null, decidedAt: null, decision: null, resultingRevision: null, organizationId: project.organizationId, workspaceId: project.workspaceId })
    await this.log({ ...this.eventBase(actor, project), eventType: 'PROPOSAL_CREATED', proposalId: p.id, mode: meta.mode ?? null, prompt: meta.prompt ?? null, origin: cmds[0]?.origin ?? null,
      aiInterpretation: meta.interpretation ?? null, proposedCommands: cmds, validationResults: p.preview?.rules ?? p.errors,
      selectedObjectIds: [...new Set(cmds.flatMap(c => (c as any).objectIds ?? ((c as any).objectId ? [(c as any).objectId] : [])))] })
    return p
  }

  /** ACCEPT / MODIFY / REJECT. Only a person with ACCEPT_CHANGE commits to the model. */
  async decide(actor: Actor, projectId: string, proposalId: string, decision: 'ACCEPT' | 'MODIFY' | 'REJECT', modified?: StudioCommand[], startedAtMs?: number) {
    const { project, model } = await this.load(actor, projectId, decision === 'REJECT' ? 'PROPOSE_CHANGE' : 'ACCEPT_CHANGE')
    const row = await this.repo.getProposal(proposalId)
    if (!row || row.proposal.projectId !== projectId) throw new StudioError(404, 'Proposal not found.')
    if (row.proposal.status !== 'PROPOSED') throw new StudioError(409, `Proposal is ${row.proposal.status}.`)
    const now = this.now().toISOString()
    const duration = startedAtMs ? this.now().getTime() - startedAtMs : null
    if (decision === 'REJECT') {
      await this.repo.saveProposal({ ...row, proposal: { ...row.proposal, status: 'REJECTED' }, decision: 'REJECTED', decidedBy: actor.userId, decidedAt: now, organizationId: project.organizationId, workspaceId: project.workspaceId })
      await this.log({ ...this.eventBase(actor, project), eventType: 'PROPOSAL_REJECTED', proposalId, decision: 'REJECTED', origin: row.proposal.commands[0]?.origin ?? null, durationMs: duration })
      return { status: 'REJECTED' as const }
    }
    const cmds = decision === 'MODIFY' ? (modified ?? []).map(c => ({ ...c, requestedBy: actor.userId, origin: 'TOOL' as const })) : row.proposal.commands
    if (decision === 'MODIFY' && !cmds.length) throw new StudioError(400, 'MODIFY needs the edited commands.')
    const revisionId = this.newId()
    const res = accept(model, row.proposal, { newId: this.newId, now, actorId: actor.userId, revisionId }, decision === 'MODIFY' ? cmds : undefined)
    if (!res.ok) {
      if (res.status === 'STALE') {
        await this.repo.saveProposal({ ...row, proposal: { ...row.proposal, status: 'STALE' }, organizationId: project.organizationId, workspaceId: project.workspaceId })
        await this.log({ ...this.eventBase(actor, project), eventType: 'PROPOSAL_STALE', proposalId })
      }
      throw new StudioError(409, res.reason)
    }
    // A change after a professional acted voids the act.
    const after = stateAfterMutation(project.state)
    const updated: ProjectRecord = { ...project, state: after.state, currentRevision: res.model.revision, updatedAt: now }
    await this.repo.commitRevision(updated, res.model, res.revision)
    await this.repo.saveProposal({ ...row, proposal: { ...row.proposal, status: 'ACCEPTED' }, decision: decision === 'MODIFY' ? 'MODIFIED' : 'ACCEPTED', decidedBy: actor.userId, decidedAt: now, resultingRevision: res.model.revision, organizationId: project.organizationId, workspaceId: project.workspaceId })
    await this.log({ ...this.eventBase(actor, updated), eventType: decision === 'MODIFY' ? 'PROPOSAL_MODIFIED' : 'PROPOSAL_ACCEPTED', proposalId, decision: decision === 'MODIFY' ? 'MODIFIED' : 'ACCEPTED',
      origin: row.proposal.commands[0]?.origin ?? null, manualEdits: decision === 'MODIFY' ? cmds : null, resultingRevision: res.model.revision, durationMs: duration,
      detail: { summary: res.revision.summary, finalGeometry: res.revision.changes.map(c => ({ id: (c.after ?? c.before)!.id, after: c.after?.geometry ?? null })) } })
    if (after.state !== project.state) {
      await this.log({ ...this.eventBase(actor, updated), eventType: 'STATE_TRANSITION', detail: { from: project.state, to: after.state, reason: `revision ${res.model.revision} changed the plan after ${project.state}` } })
    }
    if (after.invalidatesIssuance) {
      const iss = await this.repo.latestIssuance(projectId)
      if (iss && iss.state !== 'INVALIDATED') {
        await this.repo.saveIssuance(invalidateIssuance(iss, res.model.revision, `revision ${res.model.revision} changed the plan`, now))
        await this.log({ ...this.eventBase(actor, updated), eventType: 'ISSUANCE_INVALIDATED', detail: { issuanceId: iss.id, byRevision: res.model.revision } })
      }
    }
    return { status: decision === 'MODIFY' ? 'MODIFIED' as const : 'ACCEPTED' as const, revision: res.revision, state: after.state }
  }

  // ── Copilot ─────────────────────────────────────────────────────────────

  async copilot(actor: Actor, projectId: string, req: { mode: CopilotMode; text: string; selection: string[] }) {
    const { project, model } = await this.load(actor, projectId, MODE_CAPABILITY[req.mode])
    const compiled = await compileIntent({ text: req.text, mode: req.mode, selection: req.selection, model, requestedBy: actor.userId, origin: 'AI' }, this.deps.llm)
    await this.log({ ...this.eventBase(actor, project), eventType: 'PROMPT', mode: req.mode, prompt: req.text, selectedObjectIds: req.selection, aiInterpretation: compiled, origin: 'AI' })
    return this.act(actor, project, model, compiled, req)
  }

  private async act(actor: Actor, project: ProjectRecord, model: StudioModel, compiled: CompiledIntent, req: { mode: string; text: string; selection: string[] }) {
    switch (compiled.kind) {
      case 'PROPOSAL': {
        const a = authorize(actor, 'PROPOSE_CHANGE', { projectId: project.id, state: project.licenceState }, this.now())
        if (!a.allowed) throw new StudioError(403, a.reason)
        return { compiled, proposal: await this.createProposal(actor, project, model, compiled.commands, { mode: req.mode, prompt: req.text, interpretation: compiled }) }
      }
      case 'ALTERNATIVES': {
        const proposals = []
        for (const alt of compiled.alternatives) proposals.push({ label: alt.label, proposal: await this.createProposal(actor, project, model, alt.commands, { mode: req.mode, prompt: `${req.text} — ${alt.label}`, interpretation: compiled }) })
        return { compiled, alternatives: proposals }
      }
      case 'CALCULATION': {
        const results: CalculationRecord[] = []
        for (const c of compiled.calculations) {
          // "$calcId.output" wires one result into the next input.
          const inputs = Object.fromEntries(Object.entries(c.inputs).map(([k, v]) => {
            const m = typeof v === 'string' ? v.match(/^\$(\w+)\.(\w+)$/) : null
            return [k, m ? results.find(r => r.calcId === m[1])?.outputs[m[2]] : v]
          }))
          results.push(await this.calculate(actor, project.id, c.calcId, inputs, 'ai'))
        }
        return { compiled, calculations: results }
      }
      case 'CHECK': {
        const rules = evaluateRules(model, await this.repo.listOverrides(project.id)).filter(r => !compiled.codes || compiled.codes.some(c => r.code.startsWith(c)))
        await this.log({ ...this.eventBase(actor, project), eventType: 'CHECK', detail: { codes: compiled.codes, failing: rules.filter(r => r.status === 'FAIL' || r.status === 'BLOCKED').length, errors: rules.filter(r => r.severity === 'ERROR').length } })
        return { compiled, rules }
      }
      default: return { compiled }
    }
  }

  async redline(actor: Actor, projectId: string, markup: Omit<Markup, 'author' | 'createdAt' | 'id'> & { id?: string }) {
    const { project, model } = await this.load(actor, projectId, 'CREATE_REDLINE')
    const mk: Markup = { ...markup, id: markup.id ?? this.newId(), author: actor.userId, createdAt: this.now().toISOString() }
    const interp = await interpretRedline(model, mk, actor.userId, this.deps.llm)
    await this.log({ ...this.eventBase(actor, project), eventType: 'REDLINE', origin: 'REDLINE', prompt: mk.text ?? null, selectedObjectIds: interp.targets, aiInterpretation: interp, detail: { markup: mk } })
    // A reviewer who cannot edit still gets the interpreted proposal, for a drafter or PE to accept.
    if (interp.compiled.kind === 'PROPOSAL') return { interpretation: interp, proposal: await this.createProposal(actor, project, model, interp.compiled.commands, { mode: 'REDLINE', prompt: mk.text ?? null, interpretation: interp }) }
    return { interpretation: interp }
  }

  // ── Calculations and checks ─────────────────────────────────────────────

  async calculate(actor: Actor, projectId: string, calcId: string, inputs: Record<string, unknown>, via: 'user' | 'ai' = 'user') {
    const { project, model } = await this.load(actor, projectId, 'RUN_CALCULATION')
    const rec = runCalculation(calcId, inputs, { actor: { type: via, id: actor.userId }, model, now: () => this.now().toISOString() })
    await this.repo.saveCalculation(projectId, model.revision, rec, project)
    await this.log({ ...this.eventBase(actor, project), eventType: 'CALCULATION', detail: { calcId, status: rec.status, message: rec.message, selectedBy: via } })
    return rec
  }

  async overrideRule(actor: Actor, projectId: string, key: string, reason: string) {
    const { project } = await this.load(actor, projectId, 'OVERRIDE_RULE')
    if (reason.trim().length < 20) throw new StudioError(400, 'An override needs a stated professional basis (at least 20 characters).')
    const o = { key, by: actor.userId, reason: reason.trim(), at: this.now().toISOString() }
    await this.repo.saveOverride(projectId, o, project)
    await this.log({ ...this.eventBase(actor, project), eventType: 'RULE_OVERRIDE', detail: o })
    return o
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────

  async transition(actor: Actor, projectId: string, to: ProjectState) {
    const project = await this.repo.getProject(projectId)
    if (!project) throw new StudioError(404, 'Project not found.')
    const model = await this.repo.getModel(projectId)
    const iss = await this.repo.latestIssuance(projectId)
    const rules = model ? evaluateRules(model, await this.repo.listOverrides(projectId)) : []
    const current = iss && model && iss.revision === model.revision && iss.state !== 'INVALIDATED'
    const t = checkTransition(actor, { projectId, state: project.licenceState }, project.state, to, {
      blockingFindings: rules.filter(r => r.severity === 'ERROR' && !r.override).length,
      hasIssuanceForCurrentRevision: !!current && (iss!.state === 'PREPARED' || iss!.state === 'APPROVED' || iss!.state === 'EXECUTED'),
      issuanceExecuted: !!current && iss!.state === 'EXECUTED',
      previouslySubmitted: project.previouslySubmitted,
    }, this.now())
    if (!t.allowed) throw new StudioError(403, t.reason)
    if (to === 'READY_FOR_SEAL' && iss?.state !== 'APPROVED') throw new StudioError(409, 'The PE must approve the prepared document before it is ready for seal.')
    const updated = { ...project, state: to, previouslySubmitted: project.previouslySubmitted || to === 'SUBMITTED', updatedAt: this.now().toISOString() }
    await this.repo.saveProject(updated)
    await this.log({ ...this.eventBase(actor, updated), eventType: 'STATE_TRANSITION', detail: { from: project.state, to, licenceId: t.licenceId } })
    return updated
  }

  // ── Issuance ────────────────────────────────────────────────────────────

  async prepareIssuance(actor: Actor, projectId: string, document: Uint8Array, documentRef: string | null) {
    const { project, model } = await this.load(actor, projectId, 'PREPARE_SHEETS')
    if (project.state !== 'APPROVED_FOR_ISSUANCE') throw new StudioError(409, 'Issuance is prepared for a plan approved for issuance.')
    const rec = prepareIssuance({ id: this.newId(), organizationId: project.organizationId, projectId, revision: model.revision, revisionId: model.revisionId, document, documentRef, preparedBy: actor.userId, now: this.now().toISOString() })
    await this.repo.saveIssuance(rec)
    await this.log({ ...this.eventBase(actor, project), eventType: 'ISSUANCE_PREPARED', detail: { issuanceId: rec.id, documentHash: rec.documentHash } })
    return rec
  }

  async approveIssuance(actor: Actor, projectId: string, documentHash: string) {
    const { project, model, licenceId } = await this.load(actor, projectId, 'MARK_READY_FOR_SEAL')
    const iss = await this.repo.latestIssuance(projectId)
    if (!iss) throw new StudioError(404, 'No prepared issuance.')
    const r = approveIssuance(iss, { by: actor.userId, authorisedLicenceId: licenceId!, documentHash, currentRevision: model.revision, now: this.now().toISOString() })
    if (!r.ok) throw new StudioError(409, r.reason)
    await this.repo.saveIssuance(r.record)
    await this.log({ ...this.eventBase(actor, project), eventType: 'ISSUANCE_APPROVED', detail: { issuanceId: iss.id, licenceId } })
    return r.record
  }

  async executeIssuance(actor: Actor, projectId: string, signed: Uint8Array, method: ExecutionMethod, signedDocumentRef: string | null) {
    const { project, model, licenceId } = await this.load(actor, projectId, 'SIGN_SEAL')
    const iss = await this.repo.latestIssuance(projectId)
    if (!iss) throw new StudioError(404, 'No issuance.')
    const r = await executeIssuance(iss, { by: actor.userId, authorisedLicenceId: licenceId!, method, signed, signedDocumentRef, verifier: this.deps.verifier ?? null, currentRevision: model.revision, now: this.now().toISOString() })
    if (!r.ok) throw new StudioError(409, r.reason)
    await this.repo.saveIssuance(r.record)
    await this.log({ ...this.eventBase(actor, project), eventType: 'ISSUANCE_EXECUTED', detail: { issuanceId: iss.id, signedDocumentHash: r.record.execution!.signedDocumentHash, method } })
    return r.record
  }

  // ── Import, history, metrics ────────────────────────────────────────────

  async importRecords(actor: Actor, projectId: string, objects: StudioObject[], documentRef: string | null) {
    const { project, model } = await this.load(actor, projectId, 'IMPORT_SOURCE_DATA')
    const survey = authorize(actor, 'IMPORT_SURVEY', { projectId, state: project.licenceState }, this.now()).allowed
    const res = importRecords(model, { objects, importedBy: actor.userId, capabilities: { importSurvey: survey, importSourceData: true }, documentRef, revisionId: this.newId(), now: this.now().toISOString() })
    if (!res.ok) throw new StudioError(403, res.reason)
    const after = stateAfterMutation(project.state)
    const updated = { ...project, state: after.state, currentRevision: res.model.revision, updatedAt: this.now().toISOString() }
    await this.repo.commitRevision(updated, res.model, res.revision)
    await this.log({ ...this.eventBase(actor, updated), eventType: 'IMPORT', resultingRevision: res.model.revision, detail: { count: objects.length, documentRef, discrepancies: res.discrepancies } })
    return res
  }

  async history(actor: Actor, projectId: string) {
    await this.load(actor, projectId, 'VIEW_PROJECT')
    return { revisions: await this.repo.listRevisions(projectId), events: await this.repo.listEvents(projectId) }
  }

  async metrics(actor: Actor, projectId: string) {
    const { project } = await this.load(actor, projectId, 'VIEW_TELEMETRY')
    return betaMetrics(await this.repo.listEvents(projectId), project.traditionalEstimateHours)
  }

  /** Record a sheet render so drafting QA reads the real sheet audit. */
  async recordSheets(actor: Actor, projectId: string, sheets: SheetAudit) {
    const { project } = await this.load(actor, projectId, 'PREPARE_SHEETS')
    const updated = { ...project, sheets, updatedAt: this.now().toISOString() }
    await this.repo.saveProject(updated)
    await this.log({ ...this.eventBase(actor, updated), eventType: 'SHEETS_RENDERED', detail: { sheets: sheets.sheets.map(s => s.id), overprints: sheets.overprints } })
    return updated
  }
}

export const STUDIO_SERVICE_VERSION = STUDIO_ENGINE_VERSION
export type { RuleResult }
