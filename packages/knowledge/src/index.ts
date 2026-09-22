/**
 * @kealee/knowledge — Kealee Construction Intelligence, Phase 1.
 *
 *   artifact registry · provenance / lineage · generation records · learning ledger
 *
 *   const k = createKnowledge(prisma)            // any Prisma client with the knowledge models
 *   await k.registry.ingestArtifact({...})
 *   await k.generation.recordGeneration({...})   // outputs are ingested with GENERATED_FROM lineage
 *   await k.provenance.traceLineage(artifactId)  // what produced this, what depended on it
 *
 * Later phases (docs/intelligence/ARCHITECTURE.md): chunking + embeddings +
 * retrieval (2), project memory + IntelligenceContext (3), agent integration
 * (4), feedback (5), workspace capture (6), training examples + datasets (7),
 * evaluations (8), multimodal (9), fine-tuning providers (10).
 */
import { knowledgeDb, type KnowledgeDb } from './db'
import { GenerationRecorder } from './generation'
import { LearningLedger } from './learning'
import { Provenance } from './provenance'
import { KnowledgeRegistry } from './registry'
import { MemoryEventSink, type EventSink } from './events'

export * from './types'
export * from './events'
export * from './policies'
export * from './adapters'
export { KnowledgeRegistry, checksumOf } from './registry'
export { GenerationRecorder } from './generation'
export { Provenance } from './provenance'
export { LearningLedger } from './learning'
export type { KnowledgeDb, Delegate } from './db'

export interface Knowledge {
  registry: KnowledgeRegistry
  generation: GenerationRecorder
  provenance: Provenance
  learning: LearningLedger
  events: EventSink
}

export function createKnowledge(prisma: unknown, opts: { events?: EventSink; log?: (m: string) => void } = {}): Knowledge {
  const db: KnowledgeDb = knowledgeDb(prisma)
  const events = opts.events ?? new MemoryEventSink()
  const registry = new KnowledgeRegistry(db, events, opts.log)
  return { registry, generation: new GenerationRecorder(db, registry, events), provenance: new Provenance(db), learning: new LearningLedger(db), events }
}
