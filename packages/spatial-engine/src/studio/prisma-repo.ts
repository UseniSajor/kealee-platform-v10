/**
 * Prisma-backed StudioRepository, shared by web-main and the worker so the
 * studio_* tables are written one way. The client is injected (`db`), so this
 * package takes no dependency on @kealee/database.
 *
 * Tables: packages/database/schema-src/foundation/site-plan-studio.prisma.
 * studio_revisions and studio_engineering_events are append-only in the
 * database itself (trigger) — this code only ever inserts into them.
 */

import type { StudioModel, StudioObject } from './model'
import type { RevisionRecord, Proposal } from './proposals'
import type { CalculationRecord } from './calculations'
import type { RuleOverride } from './rules'
import type { IssuanceRecord } from './issuance'
import { appendEvent, type EngineeringEvent } from './telemetry'
import type { ProjectRecord, ProposalRow, StudioRepository } from './service'
import type { GeneratorResult } from './generator'

type Db = any

const json = <T>(v: T): T => JSON.parse(JSON.stringify(v ?? null))
const d = (s: string | null | undefined) => (s ? new Date(s) : null)
const iso = (v: Date | string | null | undefined) => (v == null ? null : v instanceof Date ? v.toISOString() : v)

function objectRow(o: StudioObject) {
  return {
    id: o.id, organizationId: o.organizationId, workspaceId: o.workspaceId, projectId: o.projectId, type: o.type,
    geometry: json(o.geometry), attributes: json(o.attributes), layer: o.layer, discipline: o.discipline, source: o.source,
    sourceDate: o.sourceDate, sourceAccuracy: o.sourceAccuracy, sourceAuthority: o.sourceAuthority, confidence: o.confidence,
    createdBy: o.createdBy, createdAt: new Date(o.createdAt), modifiedBy: o.modifiedBy, modifiedAt: new Date(o.modifiedAt),
    revisionId: o.revisionId, status: o.status,
  }
}
function fromObjectRow(r: any): StudioObject {
  return { ...r, createdAt: iso(r.createdAt)!, modifiedAt: iso(r.modifiedAt)! }
}

function projectRow(p: ProjectRecord, m?: StudioModel) {
  return {
    id: p.id, organizationId: p.organizationId, workspaceId: p.workspaceId, name: p.name, address: p.address,
    jurisdictionCode: p.jurisdictionCode, licenceState: p.licenceState, state: p.state, currentRevision: p.currentRevision,
    workflowId: p.workflowId, aiGenerated: p.aiGenerated, previouslySubmitted: p.previouslySubmitted, facts: json(p.facts),
    sheets: p.sheets ? json(p.sheets) : null, traditionalEstimateHours: p.traditionalEstimateHours, isDemo: p.isDemo, createdById: p.createdBy,
    ...(m ? { currentRevisionId: m.revisionId, crs: m.crs, verticalDatum: m.verticalDatum, zoning: m.zoning ? json(m.zoning) : null, design: m.design ? json(m.design) : null } : {}),
  }
}

export class PrismaStudioRepository implements StudioRepository {
  constructor(private readonly db: Db) {}

  async getProject(id: string): Promise<ProjectRecord | null> {
    const r = await this.db.studioProject.findUnique({ where: { id } })
    if (!r) return null
    return {
      id: r.id, organizationId: r.organizationId, workspaceId: r.workspaceId, name: r.name, address: r.address, jurisdictionCode: r.jurisdictionCode,
      licenceState: r.licenceState, state: r.state, currentRevision: r.currentRevision, workflowId: r.workflowId, aiGenerated: r.aiGenerated,
      previouslySubmitted: r.previouslySubmitted, facts: r.facts, sheets: r.sheets ?? null, traditionalEstimateHours: r.traditionalEstimateHours,
      isDemo: r.isDemo, createdBy: r.createdById, createdAt: iso(r.createdAt)!, updatedAt: iso(r.updatedAt)!,
    }
  }

  async saveProject(p: ProjectRecord) {
    const row = projectRow(p)
    await this.db.studioProject.update({ where: { id: p.id }, data: { ...row, id: undefined } })
  }

  async getModel(projectId: string): Promise<StudioModel | null> {
    const p = await this.db.studioProject.findUnique({ where: { id: projectId } })
    if (!p) return null
    const objs = await this.db.studioObject.findMany({ where: { projectId } })
    return {
      organizationId: p.organizationId, workspaceId: p.workspaceId, projectId, revision: p.currentRevision, revisionId: p.currentRevisionId,
      crs: p.crs, verticalDatum: p.verticalDatum, units: 'US_SURVEY_FT', zoning: p.zoning ?? null, design: p.design ?? undefined,
      objects: objs.map(fromObjectRow),
    }
  }

  /** Creates a project with its first revision. Used by the generator bridge and the demo seed. */
  async createProject(p: ProjectRecord, m: StudioModel, revisions: RevisionRecord[]) {
    await this.db.$transaction([
      this.db.studioProject.create({ data: projectRow(p, m) }),
      ...(m.objects.length ? [this.db.studioObject.createMany({ data: m.objects.map(objectRow) })] : []),
      ...revisions.map(r => this.db.studioRevision.create({ data: revisionRow(p, r) })),
    ])
  }

  async commitRevision(p: ProjectRecord, m: StudioModel, r: RevisionRecord) {
    const ops: any[] = []
    for (const ch of r.changes) {
      const id = (ch.after ?? ch.before)!.id
      if (!ch.after) ops.push(this.db.studioObject.deleteMany({ where: { id, projectId: p.id } }))
      else ops.push(this.db.studioObject.upsert({ where: { id }, create: objectRow(ch.after), update: { ...objectRow(ch.after), id: undefined } }))
    }
    ops.push(this.db.studioRevision.create({ data: revisionRow(p, r) }))
    // Optimistic concurrency: the project row moves only from the revision this change was built on.
    ops.push(this.db.studioProject.updateMany({ where: { id: p.id, currentRevision: r.parentRevision }, data: { ...projectRow(p, m), id: undefined } }))
    const res = await this.db.$transaction(ops)
    if ((res[res.length - 1] as { count: number }).count !== 1) throw new Error(`revision ${r.revision} lost a race with another change`)
  }

  async listRevisions(projectId: string): Promise<RevisionRecord[]> {
    const rows = await this.db.studioRevision.findMany({ where: { projectId }, orderBy: { revision: 'asc' } })
    return rows.map((r: any) => ({ revision: r.revision, revisionId: r.revisionId, parentRevision: r.parentRevision, proposalId: r.proposalId, commands: r.commands, changes: r.changes, summary: r.summary, createdBy: r.createdBy, createdAt: iso(r.createdAt)!, engineVersion: r.engineVersion }))
  }

  async getProposal(id: string): Promise<ProposalRow | null> {
    const r = await this.db.studioProposal.findUnique({ where: { id } })
    return r ? this.proposalFromRow(r) : null
  }

  private proposalFromRow(r: any): ProposalRow {
    const proposal: Proposal = {
      id: r.id, projectId: r.projectId, baseRevision: r.baseRevision, commands: r.commands, status: r.status, errors: r.errors,
      preview: r.preview, material: r.material, stopConditions: r.stopConditions, requestedBy: r.requestedBy, createdAt: iso(r.createdAt)!, engineVersion: r.engineVersion,
    }
    return { proposal, mode: r.mode, prompt: r.prompt, decidedBy: r.decidedBy, decidedAt: iso(r.decidedAt), decision: r.decision, resultingRevision: r.resultingRevision }
  }

  async saveProposal(row: ProposalRow & { organizationId: string; workspaceId: string }) {
    const p = row.proposal
    const data = {
      organizationId: row.organizationId, workspaceId: row.workspaceId, projectId: p.projectId, baseRevision: p.baseRevision, status: p.status,
      commands: json(p.commands), errors: json(p.errors), preview: p.preview ? json(p.preview) : null, material: p.material, stopConditions: json(p.stopConditions),
      mode: row.mode, prompt: row.prompt, requestedBy: p.requestedBy, engineVersion: p.engineVersion, createdAt: new Date(p.createdAt),
      decision: row.decision, decidedBy: row.decidedBy, decidedAt: d(row.decidedAt), resultingRevision: row.resultingRevision,
    }
    await this.db.studioProposal.upsert({ where: { id: p.id }, create: { id: p.id, ...data }, update: data })
  }

  async listProposals(projectId: string, status?: string) {
    const rows = await this.db.studioProposal.findMany({ where: { projectId, ...(status ? { status } : {}) }, orderBy: { createdAt: 'desc' }, take: 50 })
    return rows.map((r: any) => this.proposalFromRow(r))
  }

  async saveCalculation(projectId: string, revision: number, rec: CalculationRecord, ids: { organizationId: string; workspaceId: string }) {
    await this.db.studioCalculation.create({ data: { organizationId: ids.organizationId, workspaceId: ids.workspaceId, projectId, revision, calcId: rec.calcId, status: rec.status, record: json(rec) } })
  }

  async listCalculations(projectId: string): Promise<CalculationRecord[]> {
    // The latest record per calculation id is the current one.
    const rows = await this.db.studioCalculation.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' }, take: 200 })
    const seen = new Set<string>(), out: CalculationRecord[] = []
    for (const r of rows) if (!seen.has(r.calcId)) { seen.add(r.calcId); out.push(r.record) }
    return out
  }

  async lastEvent(organizationId: string): Promise<EngineeringEvent | null> {
    const r = await this.db.studioEngineeringEvent.findFirst({ where: { organizationId }, orderBy: { sequence: 'desc' } })
    return r ? eventFromRow(r) : null
  }

  async insertEvent(e: EngineeringEvent) {
    await this.db.studioEngineeringEvent.create({ data: { ...json(e), occurredAt: new Date(e.occurredAt) } })
  }

  async listEvents(projectId: string): Promise<EngineeringEvent[]> {
    const rows = await this.db.studioEngineeringEvent.findMany({ where: { projectId }, orderBy: { sequence: 'asc' }, take: 2000 })
    return rows.map(eventFromRow)
  }

  async latestIssuance(projectId: string): Promise<IssuanceRecord | null> {
    const r = await this.db.studioIssuance.findFirst({ where: { projectId }, orderBy: { createdAt: 'desc' } })
    return r ? { ...r, preparedAt: iso(r.preparedAt)!, invalidatedAt: iso(r.invalidatedAt) } : null
  }

  async saveIssuance(rec: IssuanceRecord) {
    const data = { ...json(rec), preparedAt: new Date(rec.preparedAt), invalidatedAt: d(rec.invalidatedAt) }
    await this.db.studioIssuance.upsert({ where: { id: rec.id }, create: data, update: { ...data, id: undefined } })
  }

  async listOverrides(projectId: string): Promise<RuleOverride[]> {
    const rows = await this.db.studioRuleOverride.findMany({ where: { projectId } })
    return rows.map((r: any) => ({ key: r.ruleKey, by: r.overriddenBy, reason: r.reason, at: iso(r.overriddenAt)! }))
  }

  async saveOverride(projectId: string, o: RuleOverride, ids: { organizationId: string; workspaceId: string }) {
    const data = { organizationId: ids.organizationId, workspaceId: ids.workspaceId, projectId, ruleKey: o.key, overriddenBy: o.by, reason: o.reason, overriddenAt: new Date(o.at) }
    await this.db.studioRuleOverride.upsert({ where: { projectId_ruleKey: { projectId, ruleKey: o.key } }, create: data, update: data })
  }
}

function revisionRow(p: ProjectRecord, r: RevisionRecord) {
  return {
    organizationId: p.organizationId, workspaceId: p.workspaceId, projectId: p.id, revision: r.revision, revisionId: r.revisionId,
    parentRevision: r.parentRevision, proposalId: r.proposalId, commands: json(r.commands), changes: json(r.changes), summary: r.summary,
    createdBy: r.createdBy, createdAt: new Date(r.createdAt), engineVersion: r.engineVersion,
  }
}

function eventFromRow(r: any): EngineeringEvent {
  return { ...r, occurredAt: iso(r.occurredAt)! }
}

/**
 * Persists a generated plan as a Studio project, so the professional review of
 * a Kealee-generated plan (workflow A) happens in the same model the
 * professional would draft in. Idempotent per workflow.
 */
export async function persistGeneratedProject(db: Db, result: GeneratorResult, meta: {
  workflowId: string; name: string; address: string | null; jurisdictionCode: string | null; licenceState: string | null
  facts: ProjectRecord['facts']; sheets: ProjectRecord['sheets']; now: string
}): Promise<{ projectId: string; created: boolean }> {
  const existing = await db.studioProject.findFirst({ where: { workflowId: meta.workflowId }, select: { id: true } })
  if (existing) return { projectId: existing.id, created: false }
  const repo = new PrismaStudioRepository(db)
  const m = result.model
  // The generated workspace is a real workspace, not an orphaned string on
  // the project. A later invitation can attach the drafter/engineer to it.
  await db.studioWorkspace.upsert({
    where: { id: m.workspaceId },
    create: { id: m.workspaceId, organizationId: m.organizationId, name: 'Site Plan Production', createdById: 'kealee-generator' },
    update: {},
  })
  const p: ProjectRecord = {
    id: m.projectId, organizationId: m.organizationId, workspaceId: m.workspaceId, name: meta.name, address: meta.address,
    jurisdictionCode: meta.jurisdictionCode, licenceState: meta.licenceState, state: 'DRAFTING', currentRevision: m.revision,
    workflowId: meta.workflowId, aiGenerated: true, previouslySubmitted: false, facts: meta.facts, sheets: meta.sheets,
    traditionalEstimateHours: null, isDemo: false, createdBy: 'kealee-generator', createdAt: meta.now, updatedAt: meta.now,
  }
  try {
    await repo.createProject(p, m, result.revisions)
  } catch (e: any) {
    // Project ids are deterministic per workflow. If two retries reached this
    // point together, the winner is the idempotent result for both callers.
    if (e?.code === 'P2002' || /unique/i.test(String(e?.message))) {
      const won = await db.studioProject.findFirst({ where: { workflowId: meta.workflowId }, select: { id: true } })
      if (won) return { projectId: won.id, created: false }
    }
    throw e
  }
  // The generator's stage-by-stage record joins the same audit chain as every human action.
  for (const e of result.events) {
    for (let attempt = 0; ; attempt++) {
      const prev = await repo.lastEvent(m.organizationId)
      const ev = appendEvent(prev, { ...e, projectId: p.id }, e.occurredAt ?? meta.now)
      try { await repo.insertEvent(ev); break } catch (err: any) {
        if (attempt >= 4 || !(err?.code === 'P2002' || /unique/i.test(String(err?.message)))) throw err
      }
    }
  }
  return { projectId: p.id, created: true }
}
