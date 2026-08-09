/**
 * Agentic Bot Queue Worker
 *
 * Handles multi-step agentic bot execution in queue workers.
 * Persists execution history and tool metadata for audit trail.
 *
 * Usage in queue worker:
 * ```
 * const worker = new AgenticBotWorker(botRegistry, observability, db);
 * await worker.handle(job);
 * ```
 */

import type { Job } from 'bullmq';
import {
  isAgenticBotJob,
  analyzeAgenticExecution,
  detectSuspiciousActivity,
  formatAgenticJobResult,
  type AgenticBotJobData,
  type AgenticJobResult,
} from './agentic-bot-job';
// Inline minimal interfaces to avoid workspace coupling
interface BotRegistry {
  get(botId: string): { handleMessage: (msg: string, ctx: Record<string, unknown>) => Promise<unknown>; name: string } | undefined;
}
interface AgenticObservability {
  recordExecution(botName: string, metrics: { success: boolean; durationMs: number; iterations: number; toolCalls: number; outputLength: number }): Promise<void>;
  recordError(error: Error, ctx: { requestId: string; botId: string }): Promise<void>;
}
// Use any for PrismaClient to avoid deep import chain
type PrismaClient = any;

export interface AgenticBotWorkerConfig {
  botRegistry: BotRegistry;
  observability?: AgenticObservability;
  db?: PrismaClient;
  logger?: any;
}

export class AgenticBotWorker {
  private botRegistry: BotRegistry;
  private observability: AgenticObservability;
  private db: PrismaClient | null;
  private logger: any;

  constructor(config: AgenticBotWorkerConfig) {
    this.botRegistry = config.botRegistry;
    this.observability = config.observability || { recordExecution: async () => {}, recordError: async () => {} } as any;
    this.db = config.db || null;
    this.logger = config.logger || console;
  }

  /**
   * Handle agentic bot job
   */
  async handle(job: Job<AgenticBotJobData>): Promise<void> {
    if (!isAgenticBotJob(job.data)) {
      this.logger.warn(`Job ${job.id} is not agentic, skipping AgenticBotWorker`);
      return;
    }

    const startTime = Date.now();
    const jobData = job.data as AgenticBotJobData;

    try {
      this.logger.info(`[AgenticBotWorker] Starting job ${jobData.requestId} for bot ${jobData.botId}`);

      // Get bot from registry
      const bot = this.botRegistry.get(jobData.botId);
      if (!bot) {
        throw new Error(`Bot not found: ${jobData.botId}`);
      }

      // Build session context
      const context = {
        sessionId: jobData.context.sessionId || `session_${jobData.requestId}`,
        userId: jobData.context.userId,
        orgId: jobData.context.orgId,
      };

      // Execute bot with agentic framework
      const result = await bot.handleMessage(
        (jobData.input.data.message as string | undefined) || JSON.stringify(jobData.input.data),
        { ...context, projectId: jobData.input.data.projectId as string | undefined }
      );

      // Parse result if JSON
      let parsedResult: any = result;
      try {
        if (typeof result === 'string' && result.startsWith('{')) {
          parsedResult = JSON.parse(result);
        }
      } catch {
        // Not JSON, keep as string
      }

      // Record metrics
      await this.observability.recordExecution(bot.name, {
        success: true,
        durationMs: Date.now() - startTime,
        iterations: (parsedResult as any)?.totalIterations || 1,
        toolCalls: Array.isArray((parsedResult as any)?.toolHistory) ? (parsedResult as any).toolHistory.length : 0,
        outputLength: JSON.stringify(result).length,
      });

      // Persist to database if available
      if (this.db) {
        await this.persistExecution(jobData, {
          requestId: jobData.requestId,
          success: true,
          durationMs: Date.now() - startTime,
          finalText: JSON.stringify(parsedResult),
          toolHistory: (parsedResult as any)?.toolHistory || [],
          totalIterations: (parsedResult as any)?.totalIterations || 1,
          status: 'completed',
          error: undefined,
          timestamp: new Date().toISOString(),
        });
      }

      this.logger.info(
        `[AgenticBotWorker] ✅ Job ${jobData.requestId} completed in ${Date.now() - startTime}ms`
      );

      // Update job progress
      await job.updateProgress(100);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error(`[AgenticBotWorker] ❌ Job ${jobData.requestId} failed:`, error.message);

      // Record error
      await this.observability.recordError(error, {
        requestId: jobData.requestId,
        botId: jobData.botId,
      });

      // Persist failure to database if available
      if (this.db) {
        await this.persistExecution(jobData, {
          requestId: jobData.requestId,
          success: false,
          durationMs: Date.now() - startTime,
          finalText: '',
          toolHistory: [],
          totalIterations: 0,
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }

      throw error;
    }
  }

  /**
   * Persist execution to database
   */
  private async persistExecution(
    jobData: AgenticBotJobData,
    result: AgenticJobResult
  ): Promise<void> {
    if (!this.db) return;

    try {
      const metrics = analyzeAgenticExecution(result);
      const warnings = detectSuspiciousActivity(result, metrics);
      const formattedResult = formatAgenticJobResult(result, metrics, warnings);

      await this.db.agenticJobExecution.create({
        data: {
          requestId: jobData.requestId,
          botId: jobData.botId,
          sessionId: jobData.context.sessionId || `session_${jobData.requestId}`,
          userId: jobData.context.userId,
          orgId: jobData.context.orgId,
          projectId: jobData.input.data.projectId as string | undefined,
          systemPrompt: jobData.systemPrompt,
          userMessage: (jobData.input.data.message as string | undefined) || JSON.stringify(jobData.input.data),
          finalOutput: result.finalText,
          status: result.status,
          success: result.success,
          totalIterations: result.totalIterations,
          durationMs: result.durationMs,
          error: result.error,
          toolHistory: result.toolHistory as any,
          toolMetrics: metrics as any,
          warnings,
          completedAt: new Date(),
        },
      });

      this.logger.info(
        `[AgenticBotWorker] Persisted execution ${jobData.requestId} to database`
      );
    } catch (err) {
      this.logger.error(`[AgenticBotWorker] Failed to persist execution:`, err);
      // Don't throw — allow job to complete even if persistence fails
    }
  }
}

/**
 * Create worker handler function for BullMQ
 *
 * Usage:
 * ```
 * const queue = new Queue('agentic-bots', { connection });
 * const worker = new Worker('agentic-bots', createAgenticBotHandler(config), { connection });
 * ```
 */
export function createAgenticBotHandler(config: AgenticBotWorkerConfig) {
  const botWorker = new AgenticBotWorker(config);

  return async (job: Job<AgenticBotJobData>) => {
    return botWorker.handle(job);
  };
}
