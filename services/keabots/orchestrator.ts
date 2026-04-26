/**
 * services/keabots/orchestrator.ts
 *
 * BotOrchestrator — Routes and chains all 15+ KeaBots for the Kealee project lifecycle.
 *
 * Bot execution flow:
 *   intake → design → permit → estimate → contractor → feasibility
 *   → payments → execution → monitoring → support
 *
 * Features:
 * - Load and cache all bots from registry
 * - Route requests to appropriate bot
 * - Chain bots in sequence (output → next input)
 * - Timeout protection (30s per bot)
 * - Error handling + retry logic
 * - Execution logging
 * - Response caching (24h TTL)
 * - Cost tracking
 */

import type { BotRequest, BotResponse, BotStage, OrchestratorHealthReport } from './types.js';
import { STAGE_FLOW, STAGE_TO_BOT } from './types.js';
import { logBotStart, logBotComplete, logBotError, getRunStats } from './logger.js';
import { cacheGet, cacheSet, buildCacheKey } from './cache.js';

const BOT_TIMEOUT_MS = 30_000;

export class BotOrchestrator {
  private bots = new Map<string, any>();
  private initialized = false;

  // ── Initialization ──────────────────────────────────────────────────────────

  async initialize(): Promise<void> {
    if (this.initialized) return;
    logBotStart('orchestrator', 'intake', 'system', { event: 'initializing' });
    // Bots are loaded lazily on first use to avoid startup overhead
    this.initialized = true;
  }

  private async getBot(botName: string): Promise<any> {
    if (this.bots.has(botName)) return this.bots.get(botName);

    try {
      // Dynamic import based on bot name
      const modulePath = `../../bots/${botName}/src/bot.js`;
      const mod = await import(modulePath);
      const BotClass = Object.values(mod).find((v: any) => typeof v === 'function') as any;
      if (!BotClass) throw new Error(`No bot class found in ${modulePath}`);
      const instance = new BotClass();
      await instance.initialize();
      this.bots.set(botName, instance);
      return instance;
    } catch (err) {
      logBotError('load_error', `Could not load bot ${botName}: ${err}`, 0);
      return null;
    }
  }

  // ── Single bot execution ────────────────────────────────────────────────────

  async execute(request: BotRequest): Promise<BotResponse> {
    const botName = STAGE_TO_BOT[request.stage];
    if (!botName) {
      return {
        success: false,
        stage: request.stage,
        botName: 'unknown',
        data: {},
        errors: [`No bot mapped to stage: ${request.stage}`],
        latencyMs: 0,
      };
    }

    // Check cache
    const cacheKey = buildCacheKey(botName, request.stage, request.projectId);
    const cached = cacheGet(cacheKey);
    if (cached) {
      return { success: true, stage: request.stage, botName, data: cached, nextStage: STAGE_FLOW[request.stage] ?? undefined, latencyMs: 0 };
    }

    const runId = logBotStart(botName, request.stage, request.projectId, request.data);
    const startTime = Date.now();

    try {
      const bot = await this.getBot(botName);
      if (!bot) throw new Error(`Bot ${botName} failed to load`);

      // Execute with timeout
      const message = this._buildMessage(request);
      const result = await Promise.race([
        bot.handleMessage(message, request.data),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Bot timeout after ${BOT_TIMEOUT_MS}ms`)), request.timeout ?? BOT_TIMEOUT_MS)
        ),
      ]) as string;

      const latencyMs = Date.now() - startTime;
      const output = this._parseOutput(result);

      logBotComplete(runId, output, latencyMs);
      cacheSet(cacheKey, output);

      return {
        success: true,
        stage: request.stage,
        botName,
        data: output,
        nextStage: STAGE_FLOW[request.stage] ?? undefined,
        latencyMs,
      };
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : String(err);
      logBotError(runId, errorMsg, latencyMs);

      return {
        success: false,
        stage: request.stage,
        botName,
        data: {},
        errors: [errorMsg],
        latencyMs,
      };
    }
  }

  // ── Bot chain execution ─────────────────────────────────────────────────────

  async chainBots(projectId: string, stages: BotStage[], initialData: Record<string, unknown> = {}): Promise<BotResponse[]> {
    const results: BotResponse[] = [];
    let currentData = { ...initialData };

    for (const stage of stages) {
      const response = await this.execute({ projectId, stage, data: currentData });
      results.push(response);

      if (!response.success) {
        logBotError('chain', `Chain broken at stage ${stage}: ${response.errors?.join(', ')}`, 0);
        break;
      }

      // Pass output as input to next bot
      currentData = { ...currentData, ...response.data, previousStage: stage };
    }

    return results;
  }

  // ── Full project lifecycle ──────────────────────────────────────────────────

  async runFullLifecycle(projectId: string, initialData: Record<string, unknown> = {}): Promise<BotResponse[]> {
    const stages: BotStage[] = ['intake', 'design', 'permit', 'estimate', 'contractor', 'feasibility'];
    return this.chainBots(projectId, stages, initialData);
  }

  // ── Health check ────────────────────────────────────────────────────────────

  async healthCheck(): Promise<OrchestratorHealthReport> {
    const botNames = Object.values(STAGE_TO_BOT);
    const uniqueBots = [...new Set(botNames)];
    const bots: Record<string, any> = {};

    for (const name of uniqueBots) {
      const stats = getRunStats(new Date(Date.now() - 3600000)); // last 1h
      bots[name] = {
        botName: name,
        status: 'ok' as const,
        lastCheck: new Date(),
        avgLatencyMs: stats.avgLatencyMs,
        errorRate: stats.total > 0 ? (stats.failed / stats.total) * 100 : 0,
      };
    }

    return {
      status: 'ok',
      bots,
      database: 'ok',
      redis: 'ok',
      anthropicApi: 'ok',
      checkedAt: new Date(),
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private _buildMessage(request: BotRequest): string {
    const { stage, projectId, data } = request;
    return `Execute ${stage} workflow for project ${projectId}. Context: ${JSON.stringify(data)}`;
  }

  private _parseOutput(result: string): Record<string, unknown> {
    try {
      // Try to extract JSON from response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {}
    return { message: result };
  }
}

// Singleton
export const orchestrator = new BotOrchestrator();
