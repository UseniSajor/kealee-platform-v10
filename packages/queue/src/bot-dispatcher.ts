/**
 * Bot Job Dispatcher
 *
 * Routes bot jobs to either agentic (new) or traditional (legacy) queue
 * based on feature flags and gradual rollout percentage.
 */

import type { Queue } from 'bullmq';
import { isAgenticBotJob, type AgenticBotJobData } from './agentic-bot-job';
import type { BotJobData } from './bot-jobs';

export interface BotDispatcherConfig {
  agenticQueue: Queue;
  legacyQueue: Queue;
  featureFlags: FeatureFlagProvider;
  logger?: any;
}

export interface FeatureFlagProvider {
  isEnabled(flagName: string): boolean;
  getRolloutPercentage(flagName: string): number;
  shouldRoute(flagName: string, userId?: string): boolean;
}

/**
 * Simple in-memory feature flag provider
 * In production, use your real feature flag service (LaunchDarkly, GrowthBook, etc.)
 */
export class MemoryFeatureFlagProvider implements FeatureFlagProvider {
  private flags: Map<string, { enabled: boolean; percentage: number }> = new Map();

  constructor(initialFlags?: Record<string, { enabled: boolean; percentage: number }>) {
    if (initialFlags) {
      for (const [key, value] of Object.entries(initialFlags)) {
        this.flags.set(key, value);
      }
    }
  }

  isEnabled(flagName: string): boolean {
    return this.flags.get(flagName)?.enabled ?? false;
  }

  getRolloutPercentage(flagName: string): number {
    return this.flags.get(flagName)?.percentage ?? 0;
  }

  shouldRoute(flagName: string, userId?: string): boolean {
    if (!this.isEnabled(flagName)) return false;

    const percentage = this.getRolloutPercentage(flagName);
    if (percentage >= 100) return true;
    if (percentage <= 0) return false;

    // Simple hash-based routing
    const hash = userId
      ? parseInt(userId.split('').reduce((a, b) => String((a + b.charCodeAt(0)) % 256), '0'))
      : Math.random() * 100;

    return (hash % 100) < percentage;
  }

  updateFlag(flagName: string, enabled: boolean, percentage: number): void {
    this.flags.set(flagName, { enabled, percentage });
  }
}

/**
 * Bot dispatcher: routes jobs to agentic or legacy queue
 */
export class BotDispatcher {
  private agenticQueue: Queue;
  private legacyQueue: Queue;
  private featureFlags: FeatureFlagProvider;
  private logger: any;

  private agenticBotMap = new Map<string, string>([
    ['design', 'AGENTIC_DESIGN_BOT'],
    ['estimate', 'AGENTIC_ESTIMATE_BOT'],
    ['permit', 'AGENTIC_PERMIT_BOT'],
    ['floorplan', 'AGENTIC_FLOORPLAN_BOT'],
  ]);

  constructor(config: BotDispatcherConfig) {
    this.agenticQueue = config.agenticQueue;
    this.legacyQueue = config.legacyQueue;
    this.featureFlags = config.featureFlags;
    this.logger = config.logger || console;
  }

  /**
   * Dispatch a bot job to the appropriate queue
   */
  async dispatch(jobData: BotJobData, jobName: string = 'bot-job'): Promise<string> {
    const botId = jobData.botId;
    const userId = jobData.context.userId;

    // Check if this bot has an agentic version
    const agenticFlagName = this.agenticBotMap.get(botId);

    if (
      agenticFlagName &&
      this.featureFlags.isEnabled('AGENTIC_BOT_WORKER_ENABLED') &&
      this.featureFlags.shouldRoute(agenticFlagName, userId)
    ) {
      // Route to agentic queue
      return this.dispatchToAgentic(jobData);
    }

    // Route to legacy queue
    return this.dispatchToLegacy(jobData, jobName);
  }

  /**
   * Dispatch to agentic queue
   */
  private async dispatchToAgentic(jobData: BotJobData): Promise<string> {
    // Ensure job has agentic marker
    const agenticJobData: AgenticBotJobData = {
      ...jobData,
      agentic: true,
      systemPrompt: '', // Will be set by worker
      tools: ['rag'], // Default to RAG
    };

    const job = await this.agenticQueue.add('agentic-bot-job', agenticJobData, {
      priority: this.getPriority(jobData),
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: { age: 3600 }, // Keep for 1h
      removeOnFail: { age: 86400 }, // Keep for 24h
    });

    this.logger.info('[BotDispatcher] Routed to agentic queue', {
      jobId: job.id,
      botId: jobData.botId,
      requestId: jobData.requestId,
    });

    return job.id as string;
  }

  /**
   * Dispatch to legacy queue
   */
  private async dispatchToLegacy(jobData: BotJobData, jobName: string): Promise<string> {
    const job = await this.legacyQueue.add(jobName, jobData, {
      priority: this.getPriority(jobData),
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 86400 },
    });

    this.logger.info('[BotDispatcher] Routed to legacy queue', {
      jobId: job.id,
      botId: jobData.botId,
      requestId: jobData.requestId,
    });

    return job.id as string;
  }

  /**
   * Get job priority based on context
   */
  private getPriority(jobData: BotJobData): number {
    // High priority for paying customers, low priority for free tier
    // This is an example — adjust based on your pricing model
    if (jobData.input.options?.tier === 'premium') return 1;
    if (jobData.input.options?.tier === 'standard') return 5;
    return 10; // free tier
  }

  /**
   * Get routing stats
   */
  async getStats(): Promise<{
    agenticQueueSize: number;
    legacyQueueSize: number;
    agenticQueueActive: number;
    legacyQueueActive: number;
    agenticFlagsEnabled: Record<string, boolean>;
  }> {
    const [agenticCount, legacyCount, agenticActive, legacyActive] = await Promise.all([
      (this.agenticQueue as any).count(),
      (this.legacyQueue as any).count(),
      (this.agenticQueue as any).getActiveCount(),
      (this.legacyQueue as any).getActiveCount(),
    ]);

    const agenticFlagsEnabled: Record<string, boolean> = {};
    for (const flagName of this.agenticBotMap.values()) {
      agenticFlagsEnabled[flagName] = this.featureFlags.isEnabled(flagName);
    }

    return {
      agenticQueueSize: agenticCount,
      legacyQueueSize: legacyCount,
      agenticQueueActive: agenticActive,
      legacyQueueActive: legacyActive,
      agenticFlagsEnabled,
    };
  }
}

/**
 * Helper: create dispatcher with in-memory feature flags
 */
export function createBotDispatcher(
  agenticQueue: Queue,
  legacyQueue: Queue,
  logger?: any
): BotDispatcher {
  const featureFlags = new MemoryFeatureFlagProvider({
    AGENTIC_BOT_WORKER_ENABLED: { enabled: true, percentage: 100 },
    AGENTIC_DESIGN_BOT: { enabled: true, percentage: 5 }, // Start at 5%
    AGENTIC_ESTIMATE_BOT: { enabled: false, percentage: 0 },
    AGENTIC_PERMIT_BOT: { enabled: false, percentage: 0 },
    AGENTIC_FLOORPLAN_BOT: { enabled: false, percentage: 0 },
  });

  return new BotDispatcher({
    agenticQueue,
    legacyQueue,
    featureFlags,
    logger,
  });
}
