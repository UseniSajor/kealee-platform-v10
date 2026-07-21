/**
 * AiActionLog
 *
 * Append-only audit log of every orchestration decision.
 * Dual-storage: in-memory ring buffer (last 2000 entries) +
 * JSON snapshots to disk under docs/runtime-snapshots/action-log/.
 *
 * TODO_DB_TABLE: Persist to AiActionLog Prisma table once schema is extended.
 */

import * as fs from "fs";
import * as path from "path";
import { customAlphabet } from "nanoid";

import type { AiActionRecord, ActionType, DecisionOutcome, RiskLevel, AuthorityLevel } from "./types";

const alpha = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);
const createId = (prefix: string) => `${prefix}_${alpha()}`;

// ─── Config ───────────────────────────────────────────────────────────────────

const RING_BUFFER_SIZE = 2000;
const SNAPSHOT_DIR = path.join(
  process.cwd(),
  "docs",
  "runtime-snapshots",
  "action-log",
);

// ─── Log ─────────────────────────────────────────────────────────────────────

export class AiActionLog {
  private buffer: AiActionRecord[] = [];

  record(params: {
    sessionId: string;
    taskId?: string;
    projectId?: string;
    actionType: ActionType;
    actionTarget?: string;
    outcome: DecisionOutcome;
    riskLevel: RiskLevel;
    confidence: number;
    reasoning: string;
    warnings: string[];
    engineResults?: {
      confidenceScore?: number;
      riskScore?: number;
      authorityRequired?: AuthorityLevel;
      authorityHeld?: AuthorityLevel;
    };
    metadata?: Record<string, unknown>;
  }): AiActionRecord {
    const record: AiActionRecord = {
      id: createId("act"),
      recordedAt: new Date().toISOString(),
      ...params,
    };

    // Ring buffer
    this.buffer.push(record);
    if (this.buffer.length > RING_BUFFER_SIZE) {
      this.buffer.shift();
    }

    // Async snapshot (fire-and-forget — never blocks the decision path)
    this._snapshot(record).catch(() => {/* swallow */});

    return record;
  }

  /** Return the N most recent entries across all sessions */
  getRecent(limit = 50): AiActionRecord[] {
    return this.buffer.slice(-limit).reverse();
  }

  /** Return entries for a specific session */
  getBySession(sessionId: string, limit = 50): AiActionRecord[] {
    return this.buffer
      .filter((r) => r.sessionId === sessionId)
      .slice(-limit)
      .reverse();
  }

  /** Aggregate stats for the last N entries */
  getStats(limit = 500): {
    total: number;
    byOutcome: Record<DecisionOutcome, number>;
    byRiskLevel: Record<RiskLevel, number>;
    autoExecuteRate: number;
    escalationRate: number;
    blockRate: number;
  } {
    const entries = this.buffer.slice(-limit);
    const byOutcome: Record<DecisionOutcome, number> = {
      AUTO_EXECUTE: 0,
      REQUIRE_APPROVAL: 0,
      ESCALATE: 0,
      BLOCK: 0,
    };
    const byRiskLevel: Record<RiskLevel, number> = {
      LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0,
    };

    for (const e of entries) {
      byOutcome[e.outcome]++;
      byRiskLevel[e.riskLevel]++;
    }

    const total = entries.length || 1;
    return {
      total: entries.length,
      byOutcome,
      byRiskLevel,
      autoExecuteRate: byOutcome.AUTO_EXECUTE / total,
      escalationRate: byOutcome.ESCALATE / total,
      blockRate: byOutcome.BLOCK / total,
    };
  }

  // ─── Snapshot ───────────────────────────────────────────────────────────────

  private async _snapshot(record: AiActionRecord): Promise<void> {
    try {
      const dateDir = path.join(SNAPSHOT_DIR, record.recordedAt.slice(0, 10));
      fs.mkdirSync(dateDir, { recursive: true });
      fs.writeFileSync(
        path.join(dateDir, `${record.id}.json`),
        JSON.stringify(record, null, 2),
        "utf-8",
      );
    } catch {
      // Non-fatal — snapshot is best-effort
    }
  }
}

/** Singleton instance shared across the process */
export const aiActionLog = new AiActionLog();
