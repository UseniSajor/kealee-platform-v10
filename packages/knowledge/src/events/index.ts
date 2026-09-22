/**
 * Knowledge events (spec §12), in the dot-namespaced form the platform's
 * event bus (`@kealee/core-events`, `EVENT_TYPES_V20`) uses. The registry
 * emits them through an injected `EventSink` so that a caller without Redis —
 * a script, a test — still gets a complete registry; publishing is a
 * side-channel, never a precondition.
 */
export const KNOWLEDGE_EVENTS = {
  artifact: {
    created: 'knowledge.artifact.created',
    versioned: 'knowledge.artifact.versioned',
    processed: 'knowledge.artifact.processed',
  },
  embedding: { created: 'knowledge.embedding.created' },
  fact: { extracted: 'knowledge.fact.extracted', corrected: 'knowledge.fact.corrected' },
  generation: {
    started: 'generation.started',
    completed: 'generation.completed',
    approved: 'generation.approved',
    rejected: 'generation.rejected',
    corrected: 'generation.corrected',
  },
  workspace: {
    sessionStarted: 'workspace.session.started',
    sessionCompleted: 'workspace.session.completed',
    changeAccepted: 'workspace.change.accepted',
    changeRejected: 'workspace.change.rejected',
  },
  outcome: {
    projectCompleted: 'project.completed',
    actualsReceived: 'estimate.actuals.received',
    inspectionCompleted: 'inspection.completed',
    permitApproved: 'permit.approved',
  },
  training: {
    exampleCreated: 'training.example.created',
    examplePromoted: 'training.example.promoted',
    datasetPublished: 'training.dataset.published',
  },
  evaluation: { completed: 'evaluation.completed' },
} as const

export interface KnowledgeEvent {
  type: string
  source: string
  projectId?: string | null
  orgId?: string | null
  entity?: { type: string; id: string }
  payload: Record<string, unknown>
  initiatorType?: 'USER' | 'SYSTEM' | 'AI' | 'BOT'
  initiatorId?: string
}

/** Something that accepts events: the core-events StreamPublisher behind an adapter, or a list in tests. */
export interface EventSink {
  emit(event: KnowledgeEvent): Promise<void>
}

/** Collects events in memory — tests, scripts, and the default when no bus is wired. */
export class MemoryEventSink implements EventSink {
  readonly events: KnowledgeEvent[] = []
  async emit(event: KnowledgeEvent): Promise<void> { this.events.push(event) }
}

/**
 * Wraps `@kealee/core-events` (createEvent + StreamPublisher) without
 * importing it here — the caller passes the two functions in, so this
 * package has no Redis dependency. Failures are logged, never thrown: a bus
 * outage must not lose a registry write.
 */
export function busEventSink(deps: {
  createEvent: (p: { type: string; source: string; projectId?: string; orgId?: string; payload: Record<string, unknown>; entity?: { type: string; id: string }; initiatorType?: string; initiatorId?: string }) => unknown
  publish: (event: unknown) => Promise<unknown>
  log?: (msg: string) => void
}): EventSink {
  return {
    async emit(e) {
      try {
        const env = deps.createEvent({ type: e.type, source: e.source, projectId: e.projectId ?? undefined, orgId: e.orgId ?? undefined, payload: e.payload, entity: e.entity, initiatorType: e.initiatorType, initiatorId: e.initiatorId })
        await deps.publish(env)
      } catch (err) {
        ;(deps.log ?? console.warn)(`[knowledge] event ${e.type} not published: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  }
}
