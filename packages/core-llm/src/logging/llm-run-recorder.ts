/**
 * core-llm/logging/llm-run-recorder.ts
 * Records every LLM run with prompt snapshot, context refs, output, and routing metadata.
 *
 * Storage strategy:
 *   1. In-memory ring buffer (last 1000 runs) — always available
 *   2. JSON snapshot files under docs/runtime-snapshots/ — persistent, no DB required
 *
 * TODO_DB_TABLE: add LlmRunLog table to Prisma schema when DB persistence is needed.
 * Schema outline:
 *   model LlmRunLog {
 *     id                String   @id
 *     provider          String
 *     model             String
 *     operation         String
 *     confidence        Float
 *     fallbackUsed      Boolean
 *     sessionId         String?
 *     taskId            String?
 *     projectId         String?
 *     workflowCode      String?
 *     stepCode          String?
 *     actorType         String?
 *     actorId           String?
 *     promptSnapshot    String   @db.Text
 *     retrievedContextRefs String[]
 *     parsedOutput      Json?
 *     error             String?
 *     inputTokens       Int?
 *     outputTokens      Int?
 *     latencyMs         Int
 *     createdAt         DateTime @default(now())
 *   }
 */

import fs from "fs";
import path from "path";
import { LlmRunRecord, ModelRouteDecision, ProviderName } from "../types";
import { createId } from "../utils/ids";

// ─── Ring buffer ──────────────────────────────────────────────────────────────

const MAX_IN_MEMORY = 1000;
const runBuffer: LlmRunRecord[] = [];

// ─── Snapshot path ────────────────────────────────────────────────────────────

const SNAPSHOT_DIR = path.resolve(
  process.env.LLM_SNAPSHOT_DIR ??
  path.join(process.cwd(), "docs", "runtime-snapshots"),
);

function ensureSnapshotDir(): void {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }
}

// ─── Recorder ─────────────────────────────────────────────────────────────────

export interface RecordRunArgs {
  provider: ProviderName;
  model: string;
  operation: LlmRunRecord["operation"];
  routeDecision: ModelRouteDecision;
  confidence: number;
  fallbackUsed: boolean;
  sessionId?: string;
  taskId?: string;
  projectId?: string;
  workflowCode?: string;
  stepCode?: string;
  actorType?: LlmRunRecord["actorType"];
  actorId?: string;
  promptSnapshot: string;
  retrievedContextRefs: string[];
  parsedOutput?: unknown;
  error?: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
}

export function recordRun(args: RecordRunArgs): LlmRunRecord {
  const record: LlmRunRecord = {
    id: createId("llmrun"),
    ...args,
    // Truncate prompt snapshot to 2000 chars for log size control
    promptSnapshot: args.promptSnapshot.slice(0, 2000),
    createdAt: new Date().toISOString(),
  };

  // Add to ring buffer
  runBuffer.push(record);
  if (runBuffer.length > MAX_IN_MEMORY) runBuffer.shift();

  // Async snapshot write — fire and forget, do not block the LLM call
  setImmediate(() => writeSnapshot(record));

  return record;
}

// ─── Snapshot writer ──────────────────────────────────────────────────────────

function writeSnapshot(record: LlmRunRecord): void {
  try {
    ensureSnapshotDir();
    const date = record.createdAt.slice(0, 10); // YYYY-MM-DD
    const dir = path.join(SNAPSHOT_DIR, date);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const file = path.join(dir, `${record.id}.json`);
    fs.writeFileSync(file, JSON.stringify(record, null, 2), "utf8");
  } catch (err) {
    // Never crash KeaCore over a log write failure
    console.warn(`[LlmRunRecorder] Failed to write snapshot: ${(err as Error).message}`);
  }
}

// ─── Query API ────────────────────────────────────────────────────────────────

export function getRecentRuns(limit = 50): LlmRunRecord[] {
  return runBuffer.slice(-limit).reverse();
}

export function getRunsBySession(sessionId: string, limit = 20): LlmRunRecord[] {
  return runBuffer
    .filter((r) => r.sessionId === sessionId)
    .slice(-limit)
    .reverse();
}

export function getRunStats(): {
  total: number;
  byProvider: Record<string, number>;
  avgLatencyMs: number;
  fallbackRate: number;
} {
  const total = runBuffer.length;
  const byProvider: Record<string, number> = {};
  let totalLatency = 0;
  let fallbacks = 0;

  for (const r of runBuffer) {
    byProvider[r.provider] = (byProvider[r.provider] ?? 0) + 1;
    totalLatency += r.latencyMs;
    if (r.fallbackUsed) fallbacks++;
  }

  return {
    total,
    byProvider,
    avgLatencyMs: total > 0 ? Math.round(totalLatency / total) : 0,
    fallbackRate: total > 0 ? fallbacks / total : 0,
  };
}
