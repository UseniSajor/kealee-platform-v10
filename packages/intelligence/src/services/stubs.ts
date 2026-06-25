import type {
  PropertyIntelligenceService,
  MarketingIntelligenceService,
  OpportunityScoringService,
  PropertyTwinService,
  LeadTwinService,
  CampaignRoutingService,
  ContextBuilderService,
} from './interfaces.js'
import type { PropertyIntelligenceInput, PropertyIntelligenceOutput } from '../schemas/property-intelligence.js'
import type { MarketingIntelligenceInput, MarketingIntelligenceOutput } from '../schemas/marketing-intelligence.js'
import type { OpportunityScoringInput, OpportunityScoringOutput } from '../schemas/opportunity-scoring.js'
import type { ContextBuilderPayload } from '../schemas/context.js'
import type { PropertyTwinSnapshot, LeadTwinSnapshot } from '../schemas/twins.js'
import type { CampaignRoutingInput, CampaignRoutingResult } from './interfaces.js'
import type { PropertyTwinUpsertInput, LeadTwinUpsertInput } from './interfaces.js'
import type { IntelligenceLoopType } from '../constants/loop-types.js'
import type { IntelligenceEventType } from '../constants/events.js'
import { stubDataSourceConnector } from './data-source-connector.service.js'

function notImplemented(method: string): never {
  throw new Error(`${method} not implemented — Phase 2+`)
}

export class StubPropertyIntelligenceService implements PropertyIntelligenceService {
  async analyze(_input: PropertyIntelligenceInput, _context: ContextBuilderPayload): Promise<PropertyIntelligenceOutput> {
    notImplemented('PropertyIntelligenceService.analyze')
  }
}

export class StubMarketingIntelligenceService implements MarketingIntelligenceService {
  async recommend(_input: MarketingIntelligenceInput, _context: ContextBuilderPayload): Promise<MarketingIntelligenceOutput> {
    notImplemented('MarketingIntelligenceService.recommend')
  }
}

export class StubOpportunityScoringService implements OpportunityScoringService {
  async score(_input: OpportunityScoringInput, _context: ContextBuilderPayload): Promise<OpportunityScoringOutput> {
    notImplemented('OpportunityScoringService.score')
  }
}

export class StubPropertyTwinService implements PropertyTwinService {
  async getById(_id: string): Promise<PropertyTwinSnapshot | null> {
    notImplemented('PropertyTwinService.getById')
  }
  async getByParcelId(_parcelId: string): Promise<PropertyTwinSnapshot | null> {
    notImplemented('PropertyTwinService.getByParcelId')
  }
  async getByAddress(_address: string): Promise<PropertyTwinSnapshot | null> {
    notImplemented('PropertyTwinService.getByAddress')
  }
  async upsert(_input: PropertyTwinUpsertInput): Promise<PropertyTwinSnapshot> {
    notImplemented('PropertyTwinService.upsert')
  }
  async applyAgentOutput(_propertyTwinId: string, _output: PropertyIntelligenceOutput | OpportunityScoringOutput): Promise<PropertyTwinSnapshot> {
    notImplemented('PropertyTwinService.applyAgentOutput')
  }
}

export class StubLeadTwinService implements LeadTwinService {
  async getById(_id: string): Promise<LeadTwinSnapshot | null> {
    notImplemented('LeadTwinService.getById')
  }
  async upsert(_input: LeadTwinUpsertInput): Promise<LeadTwinSnapshot> {
    notImplemented('LeadTwinService.upsert')
  }
}

export class StubCampaignRoutingService implements CampaignRoutingService {
  async route(input: CampaignRoutingInput): Promise<CampaignRoutingResult> {
    return {
      routed: !input.marketingOutput.suppressionFlags.length,
      channel: input.marketingOutput.recommendedChannel,
      suppressionApplied: input.marketingOutput.suppressionFlags.length > 0,
    }
  }
}

export class StubContextBuilderService implements ContextBuilderService {
  async build(params: {
    loopType: IntelligenceLoopType
    triggerEventType?: IntelligenceEventType
    propertyTwinId?: string
    leadTwinId?: string
    parcelId?: string
    address?: string
  }): Promise<ContextBuilderPayload> {
    const bundle = await stubDataSourceConnector.fetchBundle({
      parcelId: params.parcelId,
      address: params.address,
    })

    return {
      loopType: params.loopType,
      triggerEventType: params.triggerEventType,
      parcelData: bundle.parcelData,
      permitData: bundle.permitData,
      gisData: bundle.gisData,
      censusMarketData: bundle.censusMarketData,
      crmHistory: bundle.crmHistory,
      campaignHistory: bundle.campaignHistory,
      complianceFlags: [],
      retrievedAt: new Date().toISOString(),
    }
  }
}

export const stubPropertyIntelligenceService = new StubPropertyIntelligenceService()
export const stubMarketingIntelligenceService = new StubMarketingIntelligenceService()
export const stubOpportunityScoringService = new StubOpportunityScoringService()
export const stubPropertyTwinService = new StubPropertyTwinService()
export const stubLeadTwinService = new StubLeadTwinService()
export const stubCampaignRoutingService = new StubCampaignRoutingService()
export const stubContextBuilderService = new StubContextBuilderService()
