/**
 * checkpointer.ts
 *
 * LangGraph short-term thread persistence.
 *
 * Production strategy:
 * - Use MemorySaver in development / testing
 * - Use PostgresSaver (from @langchain/langgraph-checkpoint-postgres) in production
 *   once the postgres checkpoint table is migrated
 *
 * The checkpointer is passed to compiled graphs via:
 *   graph.compile({ checkpointer })
 *
 * This enables:
 * - Thread-level state persistence across invocations
 * - Resume interrupted workflows
 * - State inspection and replay
 */

import { MemorySaver } from "@langchain/langgraph";

// ─── Default: in-process memory checkpointer ─────────────────────────────────
// Replace with PostgresSaver for production multi-instance deployments.

export function createCheckpointer(): MemorySaver {
  return new MemorySaver();
}

// ─── Singleton for the orchestrator service ───────────────────────────────────

let _checkpointer: MemorySaver | null = null;

export function getCheckpointer(): MemorySaver {
  if (!_checkpointer) {
    _checkpointer = createCheckpointer();
  }
  return _checkpointer;
}

// ─── Thread config builder ────────────────────────────────────────────────────

export function buildThreadConfig(threadId: string) {
  return { configurable: { thread_id: threadId } };
}
