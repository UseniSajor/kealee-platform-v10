/**
 * The learning ledger (spec §12, §22): append-only events other layers read.
 * Phase 1 records; Phase 7 turns approved corrections and outcomes into
 * training candidates.
 */
import type { KnowledgeDb } from '../db'
import type { LearningEventType } from '../types'

export class LearningLedger {
  constructor(private readonly db: KnowledgeDb) {}
  async recordLearningEvent(e: { eventType: LearningEventType; organizationId?: string | null; projectId?: string | null; orderId?: string | null; artifactId?: string | null; generationRunId?: string | null; actor?: { type: string; id: string }; summary: string; payload?: unknown }) {
    return this.db.learningEvent.create({ data: { eventType: e.eventType, organizationId: e.organizationId ?? null, projectId: e.projectId ?? null, orderId: e.orderId ?? null, artifactId: e.artifactId ?? null, generationRunId: e.generationRunId ?? null, actorType: e.actor?.type ?? 'system', actorId: e.actor?.id ?? null, summary: e.summary, payload: e.payload ?? null } })
  }
  async recent(take = 50) { return this.db.learningEvent.findMany({ where: {}, orderBy: { occurredAt: 'desc' }, take }) }
}
