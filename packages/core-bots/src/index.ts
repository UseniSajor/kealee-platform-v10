export { KeaBot } from './keabot-base';
export { BotRegistry } from './bot-registry';
export { callLLMWithFallback, getLLMConfig } from './llm-fallback';
export { getLLMStatus, isLLMHealthy, getRecommendedProvider } from './llm-config';
export type { BotTool, BotConfig, BotMessage, HandoffRequest } from './keabot-base';
export type { LLMResponse, LLMSource } from './llm-fallback';
export type { LLMStatusReport } from './llm-config';

// Orgo: Organizational Structure Layer
export {
  KeaBotRoot,
  Gateway,
  KeaBotExecutor,
  AgentRole,
  ChainStage,
  createObsidianKnowledge,
} from './orgo/orgo-agent-structure';
export type {
  ExecutionContext,
  CacheMetrics,
  ObsidianKnowledge,
  KeaBotChainResult,
} from './orgo/orgo-agent-structure';

// Hermes: Function Routing & Execution Layer
export {
  ClaudeCachedClient,
  CacheMetricsLogger,
  FunctionRouter,
  KheaEventEmitter,
  KheaEvent,
  createCacheableContext,
} from './hermes/hermes-function-routing';
export type {
  CacheMetricsSnapshot,
  ClaudeCallResult,
  CacheMetricsRecord,
  FunctionHandler,
  KheaEventPayload,
  CacheableContext,
} from './hermes/hermes-function-routing';

// Obsidian: Knowledge Base Layer
export {
  ObsidianKnowledgeBase,
  getObsidianKnowledgeBase,
} from './obsidian/obsidian-knowledge-base';
export type {
  ConceptRecord,
  ImageRecord,
  ApprovalRecord,
  PricingRulesRecord,
  PermitBlueprintRecord,
  ApprovalWorkflowRecord,
  ApprovalGate,
  AuditEntry,
} from './obsidian/obsidian-knowledge-base';

// Integration: KealeeAgentSystem bootstrap
export { KealeeAgentSystem } from './integration/kealee-integration-example';
