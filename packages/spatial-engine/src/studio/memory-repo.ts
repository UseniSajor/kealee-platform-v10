/**
 * In-memory StudioRepository — for tests and local demos. Same contract as the
 * Prisma repository in web-main: revisions are append-only, events are
 * append-only and chained.
 */

import type { StudioModel } from './model'
import type { RevisionRecord } from './proposals'
import type { CalculationRecord } from './calculations'
import type { RuleOverride } from './rules'
import type { IssuanceRecord } from './issuance'
import type { EngineeringEvent } from './telemetry'
import type { ProjectRecord, ProposalRow, StudioRepository } from './service'

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v))

export class MemoryStudioRepository implements StudioRepository {
  projects = new Map<string, ProjectRecord>()
  models = new Map<string, StudioModel>()
  revisions = new Map<string, RevisionRecord[]>()
  proposals = new Map<string, ProposalRow>()
  calcs = new Map<string, CalculationRecord[]>()
  events: EngineeringEvent[] = []
  issuances = new Map<string, IssuanceRecord[]>()
  overrides = new Map<string, RuleOverride[]>()

  seed(p: ProjectRecord, m: StudioModel) { this.projects.set(p.id, clone(p)); this.models.set(p.id, clone(m)) }
  async getProject(id: string) { const p = this.projects.get(id); return p ? clone(p) : null }
  async saveProject(p: ProjectRecord) { this.projects.set(p.id, clone(p)) }
  async getModel(id: string) { const m = this.models.get(id); return m ? clone(m) : null }
  async commitRevision(p: ProjectRecord, m: StudioModel, r: RevisionRecord) {
    const list = this.revisions.get(p.id) ?? []
    if (list.some(x => x.revision === r.revision)) throw new Error(`revision ${r.revision} already exists`)
    this.revisions.set(p.id, [...list, clone(r)]); this.models.set(p.id, clone(m)); this.projects.set(p.id, clone(p))
  }
  async listRevisions(id: string) { return clone(this.revisions.get(id) ?? []) }
  async getProposal(id: string) { const r = this.proposals.get(id); return r ? clone(r) : null }
  async saveProposal(row: ProposalRow) { this.proposals.set(row.proposal.id, clone({ proposal: row.proposal, mode: row.mode, prompt: row.prompt, decidedBy: row.decidedBy, decidedAt: row.decidedAt, decision: row.decision, resultingRevision: row.resultingRevision })) }
  async listProposals(projectId: string, status?: string) { return clone([...this.proposals.values()].filter(r => r.proposal.projectId === projectId && (!status || r.proposal.status === status))) }
  async saveCalculation(projectId: string, _rev: number, rec: CalculationRecord) { this.calcs.set(projectId, [...(this.calcs.get(projectId) ?? []), clone(rec)]) }
  async listCalculations(projectId: string) { return clone(this.calcs.get(projectId) ?? []) }
  async lastEvent(orgId: string) { const e = this.events.filter(x => x.organizationId === orgId).sort((a, b) => b.sequence - a.sequence)[0]; return e ? clone(e) : null }
  async insertEvent(e: EngineeringEvent) { this.events.push(clone(e)) }
  async listEvents(projectId: string) { return clone(this.events.filter(e => e.projectId === projectId)) }
  async latestIssuance(projectId: string) { const l = this.issuances.get(projectId) ?? []; return l.length ? clone(l[l.length - 1]) : null }
  async saveIssuance(rec: IssuanceRecord) {
    const l = this.issuances.get(rec.projectId) ?? []
    const i = l.findIndex(x => x.id === rec.id)
    if (i >= 0) l[i] = clone(rec); else l.push(clone(rec))
    this.issuances.set(rec.projectId, l)
  }
  async listOverrides(projectId: string) { return clone(this.overrides.get(projectId) ?? []) }
  async saveOverride(projectId: string, o: RuleOverride) { this.overrides.set(projectId, [...(this.overrides.get(projectId) ?? []).filter(x => x.key !== o.key), clone(o)]) }
}
