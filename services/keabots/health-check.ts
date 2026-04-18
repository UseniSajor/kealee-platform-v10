/**
 * services/keabots/health-check.ts
 * Health check endpoint logic for KeaBots service
 */

import { orchestrator } from './orchestrator.js';
import { BOT_REGISTRY } from './registry.js';
import type { OrchestratorHealthReport } from './types.js';

export async function runHealthCheck(): Promise<OrchestratorHealthReport & { version: string }> {
  const report = await orchestrator.healthCheck();

  // Check all registered bots
  for (const bot of BOT_REGISTRY) {
    if (!report.bots[bot.name]) {
      report.bots[bot.name] = {
        botName: bot.name,
        status: 'ok',
        lastCheck: new Date(),
      };
    }
  }

  // Determine overall status
  const hasOffline = Object.values(report.bots).some(b => b.status === 'offline');
  const hasDegraded = Object.values(report.bots).some(b => b.status === 'degraded');
  report.status = hasOffline ? 'critical' : hasDegraded ? 'degraded' : 'ok';

  return { ...report, version: '1.0.0' };
}

export function formatHealthResponse(report: Awaited<ReturnType<typeof runHealthCheck>>): Record<string, unknown> {
  return {
    status: report.status,
    version: report.version,
    bots: Object.fromEntries(
      Object.entries(report.bots).map(([name, b]) => [name, b.status])
    ),
    database: report.database,
    redis: report.redis,
    anthropic_api: report.anthropicApi,
    checked_at: report.checkedAt.toISOString(),
  };
}
