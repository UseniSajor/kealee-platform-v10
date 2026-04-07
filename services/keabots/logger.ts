/**
 * services/keabots/logger.ts
 * Execution logging for KeaBot runs
 */

import type { BotRunLog, BotStage, BotStatus } from './types.js';

let runIdCounter = 0;

function generateRunId(): string {
  return `run_${Date.now()}_${++runIdCounter}`;
}

// In-memory log store (in production: write to Prisma KeaBotRun table)
const runLogs: BotRunLog[] = [];

export function logBotStart(botName: string, stage: BotStage, projectId: string, input: Record<string, unknown>): string {
  const id = generateRunId();
  const log: BotRunLog = {
    id,
    botName,
    stage,
    projectId,
    status: 'running',
    latencyMs: 0,
    input,
    createdAt: new Date(),
  };
  runLogs.push(log);
  console.log(`[KeaBotOrchestrator] START bot=${botName} stage=${stage} project=${projectId} runId=${id}`);
  return id;
}

export function logBotComplete(runId: string, output: Record<string, unknown>, latencyMs: number, cost?: number): void {
  const log = runLogs.find(l => l.id === runId);
  if (log) {
    log.status = 'completed';
    log.output = output;
    log.latencyMs = latencyMs;
    log.cost = cost;
  }
  console.log(`[KeaBotOrchestrator] COMPLETE runId=${runId} latency=${latencyMs}ms cost=${cost ?? 0}`);
}

export function logBotError(runId: string, error: string, latencyMs: number): void {
  const log = runLogs.find(l => l.id === runId);
  if (log) {
    log.status = 'failed';
    log.error = error;
    log.latencyMs = latencyMs;
  }
  console.error(`[KeaBotOrchestrator] FAILED runId=${runId} error=${error} latency=${latencyMs}ms`);
}

export function getRunLogs(botName?: string, limit = 50): BotRunLog[] {
  const filtered = botName ? runLogs.filter(l => l.botName === botName) : runLogs;
  return filtered.slice(-limit).reverse();
}

export function getRunStats(since?: Date): {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  avgLatencyMs: number;
} {
  const logs = since ? runLogs.filter(l => l.createdAt >= since) : runLogs;
  const successful = logs.filter(l => l.status === 'completed').length;
  const failed = logs.filter(l => l.status === 'failed').length;
  const avgLatencyMs = logs.length
    ? Math.round(logs.reduce((sum, l) => sum + l.latencyMs, 0) / logs.length)
    : 0;

  return {
    total: logs.length,
    successful,
    failed,
    successRate: logs.length ? Math.round((successful / logs.length) * 100) : 0,
    avgLatencyMs,
  };
}
