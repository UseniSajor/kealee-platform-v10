import type { IntelligenceEventType } from '../constants/events.js'
import type { IntelligenceEngineTypeName } from '../constants/loop-types.js'
import { engineToLoopType } from '../constants/loop-types.js'
import { fetchPhase6DataBundle } from '../connectors/phase6-connectors.js'
import type { ContextBuilderPayload } from '../schemas/context.js'

export interface ContextBuildParams {
  engine: IntelligenceEngineTypeName
  triggerEvent: IntelligenceEventType
  propertyTwinId?: string
  leadTwinId?: string
  projectTwinId?: string
  capitalTwinId?: string
  parcelId?: string
  address?: string
  jurisdiction?: string
  orgId?: string
  snapshots?: {
    propertyTwin?: Record<string, unknown>
    leadTwin?: Record<string, unknown>
    projectTwin?: Record<string, unknown>
    capitalTwin?: Record<string, unknown>
  }
}

export class IntelligenceContextBuilder {
  async build(params: ContextBuildParams): Promise<ContextBuilderPayload> {
    const bundle = await fetchPhase6DataBundle({
      parcelId: params.parcelId,
      address: params.address,
      jurisdiction: params.jurisdiction,
    })

    return {
      loopType: engineToLoopType(params.engine),
      triggerEventType: params.triggerEvent,
      propertyTwin: params.snapshots?.propertyTwin,
      leadTwin: params.snapshots?.leadTwin,
      parcelData: bundle.parcelData,
      permitData: bundle.permitData,
      gisData: bundle.gisData,
      censusMarketData: bundle.censusMarketData,
      crmHistory: bundle.crmHistory,
      campaignHistory: bundle.campaignHistory,
      serviceCatalog: bundle.serviceCatalog,
      complianceFlags: bundle.complianceFlags,
      retrievedAt: new Date().toISOString(),
    }
  }
}

export const intelligenceContextBuilder = new IntelligenceContextBuilder()
