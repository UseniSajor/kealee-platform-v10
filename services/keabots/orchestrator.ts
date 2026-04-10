/**
 * services/keabots/orchestrator.ts
 *
 * BotOrchestrator — compatibility shim over the canonical LangGraph supervisor.
 *
 * ARCHITECTURE NOTE
 * ─────────────────
 * All routing and sequencing is now handled by:
 *   services/ai-orchestrator/src/graphs/supervisor.ts  (supervisorGraph)
 *
 * This class translates BotRequest / BotResponse ↔ OrchestratorRunInput / Result
 * so that existing callers of BotOrchestrator continue to work without changes.
 *
 * DO NOT add new routing logic here. Add it to:
 *   services/ai-orchestrator/src/routing/supervisor-routing.ts
 *
 * STAGE_FLOW and STAGE_TO_BOT are deprecated. They remain only to satisfy
 * existing TypeScript callers. The actual routing decision is made by
 * supervisorRoute() in supervisor-routing.ts, not by STAGE_FLOW.
 */

import type {
  BotRequest,
  BotResponse,
  BotStage,
  OrchestratorHealthReport,
} from './types.js';
import { STAGE_FLOW, STAGE_TO_BOT } from './types.js';
import { logBotStart, logBotComplete, logBotError, getRunStats } from './logger.js';

// ─── Stage → LangGraph intent mapping ────────────────────────────────────────
//
// Translates the legacy STAGE_FLOW vocabulary into the intent/phase vocabulary
// that supervisor-routing.ts understands.

const STAGE_TO_INTENT: Record<BotStage, string> = {
  intake:     'start_project',
  design:     'buy_concept',
  permit:     'buy_permit',
  estimate:   'buy_estimate',
  contractor: 'find_contractor',
  feasibility:'feasibility_analysis',
  payments:   'release_milestone',
  execution:  'construction_execution',
  monitoring: 'monitor_project',
  support:    'support_request',
  marketing:  'marketing',
};

const STAGE_TO_PHASE: Record<BotStage, string> = {
  intake:     'discovery',
  design:     'product_selection',
  permit:     'product_selection',
  estimate:   'product_selection',
  contractor: 'product_selection',
  feasibility:'product_selection',
  payments:   'active_project',
  execution:  'active_project',
  monitoring: 'active_project',
  support:    'support',
  marketing:  'discovery',
};

// ─── BotOrchestrator ──────────────────────────────────────────────────────────

export class BotOrchestrator {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    console.log('[BotOrchestrator] Ready (delegating to supervisorGraph)');
    this.initialized = true;
  }

  // ── Single stage execution ──────────────────────────────────────────────────
  //
  // Translates the BotRequest into an OrchestratorRunInput and delegates
  // entirely to runOrchestrator(). The supervisorGraph determines which
  // KeaBot(s) are called and in what order.

  async execute(request: BotRequest): Promise<BotResponse> {
    const botName = STAGE_TO_BOT[request.stage] ?? 'unknown';
    const runId   = logBotStart(botName, request.stage, request.projectId, request.data);
    const startTime = Date.now();

    try {
      // Lazy import to avoid circular deps at startup
      const { runOrchestrator } = await import('@kealee/ai-orchestrator');

      const result = await runOrchestrator({
        threadId:  `bot_${request.stage}_${request.projectId}_${Date.now()}`,
        projectId: request.projectId,
        intent:    STAGE_TO_INTENT[request.stage] as any,
        phase:     STAGE_TO_PHASE[request.stage] as any,
        extra:     request.data as any,
      });

      const latencyMs = Date.now() - startTime;
      const output    = result.finalOutput ?? {};

      logBotComplete(runId, output, latencyMs);

      return {
        success:   true,
        stage:     request.stage,
        botName,
        data:      output,
        nextStage: STAGE_FLOW[request.stage] ?? undefined,
        latencyMs,
      };
    } catch (err) {
      // Fallback: run the KeaBot directly without LangGraph routing.
      // This preserves availability if the orchestrator is misconfigured.
      console.warn(
        `[BotOrchestrator] supervisorGraph unavailable for stage ${request.stage}, ` +
        `falling back to direct bot execution: ${err instanceof Error ? err.message : String(err)}`,
      );
      return this._executeDirect(request, runId, startTime);
    }
  }

  // ── Fallback: direct bot execution ──────────────────────────────────────────
  //
  // Used only when the supervisorGraph is unreachable (e.g. missing env vars
  // during local dev). Should not be the normal code path in production.

  private async _executeDirect(
    request: BotRequest,
    runId: string,
    startTime: number,
  ): Promise<BotResponse> {
    const botName = STAGE_TO_BOT[request.stage];
    if (!botName) {
      return {
        success:  false,
        stage:    request.stage,
        botName:  'unknown',
        data:     {},
        errors:   [`No bot mapped to stage: ${request.stage}`],
        latencyMs: 0,
      };
    }

    try {
      const bot = await this._loadBot(botName);
      if (!bot) throw new Error(`Bot ${botName} failed to load`);

      const message = `Execute ${request.stage} workflow for project ${request.projectId}. Context: ${JSON.stringify(request.data)}`;
      const result = await Promise.race<string>([
        bot.handleMessage(message, request.data),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Bot timeout after ${request.timeout ?? 30_000}ms`)),
            request.timeout ?? 30_000,
          ),
        ),
      ]);

      const latencyMs = Date.now() - startTime;
      const output    = this._parseOutput(result);

      logBotComplete(runId, output, latencyMs);

      return {
        success:   true,
        stage:     request.stage,
        botName,
        data:      output,
        nextStage: STAGE_FLOW[request.stage] ?? undefined,
        latencyMs,
      };
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      const errorMsg  = err instanceof Error ? err.message : String(err);
      logBotError(runId, errorMsg, latencyMs);

      return {
        success:  false,
        stage:    request.stage,
        botName,
        data:     {},
        errors:   [errorMsg],
        latencyMs,
      };
    }
  }

  // ── Chain execution (deprecated) ────────────────────────────────────────────
  //
  // Sequential bot chaining is now handled by the supervisor's subgraph sequencing.
  // This method is kept for backwards compatibility. Each call delegates to execute()
  // which routes through supervisorGraph.

  async chainBots(
    projectId: string,
    stages: BotStage[],
    initialData: Record<string, unknown> = {},
  ): Promise<BotResponse[]> {
    console.warn(
      '[BotOrchestrator] chainBots() is deprecated — use runOrchestrator() directly. ' +
      'Each stage in the chain will route independently through supervisorGraph.',
    );

    const results: BotResponse[] = [];
    let currentData = { ...initialData };

    for (const stage of stages) {
      const response = await this.execute({ projectId, stage, data: currentData });
      results.push(response);

      if (!response.success) break;
      currentData = { ...currentData, ...response.data, previousStage: stage };
    }

    return results;
  }

  // ── Full project lifecycle (deprecated) ─────────────────────────────────────
  //
  // Use runOrchestrator() with intent='start_project' instead.
  // The supervisorGraph will sequence stages based on readiness flags.

  async runFullLifecycle(
    projectId: string,
    initialData: Record<string, unknown> = {},
  ): Promise<BotResponse[]> {
    console.warn(
      '[BotOrchestrator] runFullLifecycle() is deprecated. ' +
      'Use runOrchestrator({ intent: "start_project", projectId }) instead.',
    );
    const stages: BotStage[] = [
      'intake', 'design', 'permit', 'estimate', 'contractor', 'feasibility',
    ];
    return this.chainBots(projectId, stages, initialData);
  }

  // ── Health check ────────────────────────────────────────────────────────────

  async healthCheck(): Promise<OrchestratorHealthReport> {
    const botNames   = [...new Set(Object.values(STAGE_TO_BOT))];
    const stats      = getRunStats(new Date(Date.now() - 3_600_000));
    const bots: Record<string, any> = {};

    for (const name of botNames) {
      bots[name] = {
        botName:      name,
        status:       'ok' as const,
        lastCheck:    new Date(),
        avgLatencyMs: stats.avgLatencyMs,
        errorRate:    stats.total > 0 ? (stats.failed / stats.total) * 100 : 0,
      };
    }

    return {
      status:      'ok',
      bots,
      database:    'ok',
      redis:       'ok',
      anthropicApi:'ok',
      checkedAt:   new Date(),
    };
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private _bots = new Map<string, any>();

  private async _loadBot(botName: string): Promise<any> {
    if (this._bots.has(botName)) return this._bots.get(botName);
    try {
      const modulePath = `../../bots/${botName}/src/bot.js`;
      const mod        = await import(modulePath);
      const BotClass   = Object.values(mod).find(
        (v): v is new () => any => typeof v === 'function',
      );
      if (!BotClass) throw new Error(`No bot class found in ${modulePath}`);
      const instance = new BotClass();
      await instance.initialize();
      this._bots.set(botName, instance);
      return instance;
    } catch (err) {
      console.warn(`[BotOrchestrator] Could not load bot ${botName}:`, err);
      return null;
    }
  }

  private _parseOutput(result: string): Record<string, unknown> {
    try {
      const match = result.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {}
    return { message: result };
  }
}

// Singleton
export const orchestrator = new BotOrchestrator();
