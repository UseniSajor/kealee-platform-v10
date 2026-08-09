import type { PropertyIntelligenceInput, PropertyIntelligenceOutput } from '../schemas/property-intelligence.js'
import type { MarketingIntelligenceInput, MarketingIntelligenceOutput } from '../schemas/marketing-intelligence.js'
import type { OpportunityScoringInput, OpportunityScoringOutput } from '../schemas/opportunity-scoring.js'
import type { ContextBuilderPayload } from '../schemas/context.js'
import type { PropertyTwinSnapshot, LeadTwinSnapshot } from '../schemas/twins.js'
import type { IntelligenceLoopType } from '../constants/loop-types.js'
import type { IntelligenceEventType } from '../constants/events.js'

export interface LoopRunCreateInput {
  loopType: IntelligenceLoopType
  triggerEventType?: IntelligenceEventType
  triggerEventId?: string
  propertyTwinId?: string
  leadTwinId?: string
  orgId?: string
  context?: Record<string, unknown>
}

export interface LoopStepCreateInput {
  loopRunId: string
  stepOrder: number
  stepName: string
  agentId?: string
  input?: Record<string, unknown>
}

export interface PropertyTwinUpsertInput {
  orgId?: string
  parcelId?: string
  address: string
  jurisdiction?: string
  zoning?: Record<string, unknown>
  lotSize?: number
  buildingSize?: number
  yearBuilt?: number
  propertyType?: string
  ownershipType?: string
  assessedValue?: number
  lastSaleDate?: Date
  permitHistory?: Record<string, unknown>[]
  riskFlags?: string[]
  opportunityFlags?: string[]
  recommendedProducts?: string[]
  latestScores?: Record<string, unknown>
  dataSources?: string[]
  dataQualityScore?: number
  propertySummary?: string
  metadata?: Record<string, unknown>
}

export interface LeadTwinUpsertInput {
  orgId?: string
  propertyTwinId?: string
  crmContactId?: string
  email?: string
  phone?: string
  name?: string
  leadType?: string
  segment?: string
  crmStatus?: string
  sourceChannel?: string
  interactionHistory?: Record<string, unknown>
  complianceFlags?: string[]
  metadata?: Record<string, unknown>
}

export interface CampaignRoutingInput {
  propertyTwinId: string
  marketingOutput: MarketingIntelligenceOutput
  opportunityOutput?: OpportunityScoringOutput
  loopRunId?: string
}

export interface CampaignRoutingResult {
  campaignRecommendationId?: string
  routed: boolean
  channel: string
  suppressionApplied: boolean
}

export interface ComplianceCheckInput {
  audienceSegment?: string
  recommendedMessageAngle?: string
  crmTags?: string[]
  targetingCriteria?: Record<string, unknown>
  paidAdSpendRecommendation?: number
  approvedAdSpendThreshold?: number
}

export interface ComplianceCheckResult {
  passed: boolean
  violations: string[]
  flags: string[]
}

export interface DataSourceConnectorOptions {
  parcelId?: string
  address?: string
  jurisdiction?: string
}

export interface DataSourceBundle {
  parcelData?: Record<string, unknown>
  permitData?: Record<string, unknown>[]
  gisData?: Record<string, unknown>
  censusMarketData?: Record<string, unknown>
  crmHistory?: Record<string, unknown>[]
  campaignHistory?: Record<string, unknown>[]
  dataSources: string[]
  dataQualityScore: number
}

export interface PropertyIntelligenceService {
  analyze(input: PropertyIntelligenceInput, context: ContextBuilderPayload): Promise<PropertyIntelligenceOutput>
}

export interface MarketingIntelligenceService {
  recommend(input: MarketingIntelligenceInput, context: ContextBuilderPayload): Promise<MarketingIntelligenceOutput>
}

export interface OpportunityScoringService {
  score(input: OpportunityScoringInput, context: ContextBuilderPayload): Promise<OpportunityScoringOutput>
}

export interface PropertyTwinService {
  getById(id: string): Promise<PropertyTwinSnapshot | null>
  getByParcelId(parcelId: string): Promise<PropertyTwinSnapshot | null>
  getByAddress(address: string): Promise<PropertyTwinSnapshot | null>
  upsert(input: PropertyTwinUpsertInput): Promise<PropertyTwinSnapshot>
  applyAgentOutput(propertyTwinId: string, output: PropertyIntelligenceOutput | OpportunityScoringOutput): Promise<PropertyTwinSnapshot>
}

export interface LeadTwinService {
  getById(id: string): Promise<LeadTwinSnapshot | null>
  upsert(input: LeadTwinUpsertInput): Promise<LeadTwinSnapshot>
}

export interface CampaignRoutingService {
  route(input: CampaignRoutingInput): Promise<CampaignRoutingResult>
}

export interface ComplianceGuardService {
  check(input: ComplianceCheckInput): Promise<ComplianceCheckResult>
}

export interface DataSourceConnectorService {
  fetchBundle(options: DataSourceConnectorOptions): Promise<DataSourceBundle>
}

export interface ContextBuilderService {
  build(params: {
    loopType: IntelligenceLoopType
    triggerEventType?: IntelligenceEventType
    propertyTwinId?: string
    leadTwinId?: string
    parcelId?: string
    address?: string
  }): Promise<ContextBuilderPayload>
}
