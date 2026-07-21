import type { PropertyIntelligenceInput, PropertyIntelligenceOutput } from '../schemas/property-intelligence.js'
import type { MarketingIntelligenceInput, MarketingIntelligenceOutput } from '../schemas/marketing-intelligence.js'
import type { OpportunityScoringInput, OpportunityScoringOutput } from '../schemas/opportunity-scoring.js'
import type { ContextBuilderPayload } from '../schemas/context.js'

export const AGENT_IDS = [
  'PropertyIntelligenceAgent',
  'MarketingIntelligenceAgent',
  'OpportunityScoringAgent',
  'LeadIntelligenceAgent',
  'CapitalIntelligenceAgent',
  'ProjectIntelligenceEngine',
] as const

export type AgentId = (typeof AGENT_IDS)[number]

export type ToolMode = 'context_only' | 'permissioned_tools' | 'orchestrated'

export interface AgentCapability {
  agentId: AgentId
  toolMode: ToolMode
  allowedToolsLater: string[]
  mayWriteToDatabase: false
}

export interface AgentRunRequest<TInput> {
  agentId: AgentId
  loopRunId: string
  context: ContextBuilderPayload
  input: TInput
}

export interface AgentRunResult<TOutput> {
  agentId: AgentId
  loopRunId: string
  output: TOutput
  validated: boolean
  requiresHumanReview: boolean
  reviewReasons: string[]
}

export type PropertyIntelligenceRunRequest = AgentRunRequest<PropertyIntelligenceInput>
export type PropertyIntelligenceRunResult = AgentRunResult<PropertyIntelligenceOutput>

export type MarketingIntelligenceRunRequest = AgentRunRequest<MarketingIntelligenceInput>
export type MarketingIntelligenceRunResult = AgentRunResult<MarketingIntelligenceOutput>

export type OpportunityScoringRunRequest = AgentRunRequest<OpportunityScoringInput>
export type OpportunityScoringRunResult = AgentRunResult<OpportunityScoringOutput>
