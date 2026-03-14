/**
 * bots.module.ts
 *
 * Barrel export for the KeaBots framework.
 * Import from here in domain code or route files.
 */

export { botRegistry }          from './bots.registry'
export { botsRoutes }           from './bots.routes'
export { callModel, parseJSON, checkCostGuard, isLLMAvailable } from './bots.router'
export { getRecentTraces, getTrace, newRequestId, startStep, recordTrace } from './bots.logger'
export type {
  BotId,
  BotCostProfile,
  ModelTier,
  BotContext,
  BotInput,
  BotOutput,
  BotExecutionTrace,
  BotStep,
  IBot,
  // Bot-specific types
  LeadBotInput,     LeadBotOutput,
  EstimateBotInput, EstimateBotOutput,
  PermitBotInput,   PermitBotOutput,
  ContractorMatchBotInput, ContractorMatchBotOutput,
  ProjectMonitorBotInput,  ProjectMonitorBotOutput,
  SupportBotInput,  SupportBotOutput,
} from './bots.types'
