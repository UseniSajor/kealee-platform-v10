import type { AgentCapability } from './agents.js'

/** MVP agent capability registry — context_only, no direct DB writes */
export const AGENT_CAPABILITY_REGISTRY: Record<string, AgentCapability> = {
  PropertyIntelligenceAgent: {
    agentId: 'PropertyIntelligenceAgent',
    toolMode: 'context_only',
    allowedToolsLater: ['GISParcelLookup', 'ZoningLookup', 'PermitHistoryLookup'],
    mayWriteToDatabase: false,
  },
  MarketingIntelligenceAgent: {
    agentId: 'MarketingIntelligenceAgent',
    toolMode: 'context_only',
    allowedToolsLater: ['CRMSearch', 'CampaignPerformanceLookup', 'AudienceBuilder'],
    mayWriteToDatabase: false,
  },
  OpportunityScoringAgent: {
    agentId: 'OpportunityScoringAgent',
    toolMode: 'context_only',
    allowedToolsLater: ['ScoringModelService', 'RevenueModelCalculator', 'ComparableProjectLookup'],
    mayWriteToDatabase: false,
  },
  LeadIntelligenceAgent: {
    agentId: 'LeadIntelligenceAgent',
    toolMode: 'context_only',
    allowedToolsLater: ['CRMSearch', 'CampaignPerformanceLookup'],
    mayWriteToDatabase: false,
  },
  CapitalIntelligenceAgent: {
    agentId: 'CapitalIntelligenceAgent',
    toolMode: 'context_only',
    allowedToolsLater: ['EquityEstimator', 'LTVCalculator', 'LoanProductMatcher', 'DrawScheduleCalculator'],
    mayWriteToDatabase: false,
  },
  ProjectIntelligenceEngine: {
    agentId: 'ProjectIntelligenceEngine',
    toolMode: 'orchestrated',
    allowedToolsLater: [
      'EstimateService',
      'PermitRulesService',
      'ContractorBidService',
      'ScheduleRiskService',
    ],
    mayWriteToDatabase: false,
  },
}

export function getAgentCapability(agentId: string): AgentCapability | undefined {
  return AGENT_CAPABILITY_REGISTRY[agentId]
}
