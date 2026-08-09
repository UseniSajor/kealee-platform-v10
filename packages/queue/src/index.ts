export { KEALEE_QUEUES, type QueueName } from './queue-registry';
export { getRedisConnection, createQueue, createWorker } from './connection';
export type { BotJobData, ChainJobData } from './bot-jobs';
export {
  isAgenticBotJob,
  analyzeAgenticExecution,
  detectSuspiciousActivity,
  formatAgenticJobResult,
  executeAgenticBotJob,
} from './agentic-bot-job';
export type { AgenticBotJobData, AgenticJobResult, AgenticJobMetrics } from './agentic-bot-job';

export { AgenticBotWorker, createAgenticBotHandler } from './agentic-bot-worker';
export type { AgenticBotWorkerConfig } from './agentic-bot-worker';

export { setupAgenticBotWorker, getAgenticBotWorkerHealth, shutdownAgenticBotWorker } from './agentic-bot-worker-setup';
export type { AgenticBotWorkerSetupConfig } from './agentic-bot-worker-setup';

export { BotDispatcher, MemoryFeatureFlagProvider, createBotDispatcher } from './bot-dispatcher';
export type { BotDispatcherConfig, FeatureFlagProvider } from './bot-dispatcher';

export { getAgenticBotHealth, isAgenticBotReadyForProduction, checkAgenticBotAlerts } from './agentic-bot-health';
export type { AgenticBotHealth } from './agentic-bot-health';
