import { prisma, Prisma } from '@kealee/database'
import type {
  CampaignRoutingService,
  CampaignRoutingInput,
  CampaignRoutingResult,
} from './interfaces.js'
import type { MarketingIntelligenceOutput } from '../schemas/marketing-intelligence.js'

const NURTURE_SEQUENCES: Record<string, string> = {
  homeowner_remodel_candidate: 'standard_nurture_14d',
  adu_candidate: 'adu_education_21d',
  permit_help_candidate: 'permit_urgency_7d',
  developer_feasibility_candidate: 'developer_outreach_10d',
  investor_renovation_candidate: 'investor_flip_14d',
  commercial_ti_candidate: 'commercial_ti_21d',
  nurture_low_intent: 'long_nurture_90d',
}

export class PrismaCampaignRoutingService implements CampaignRoutingService {
  async route(input: CampaignRoutingInput): Promise<CampaignRoutingResult> {
    const marketing = input.marketingOutput
    const suppress = marketing.suppressionFlags.length > 0 || marketing.recommendedChannel === 'none'

    const recommendation = await prisma.campaignRecommendation.create({
      data: {
        propertyTwinId: input.propertyTwinId,
        loopRunId: input.loopRunId,
        recommendedCampaign: marketing.recommendedCampaign,
        recommendedChannel: marketing.recommendedChannel,
        recommendedOffer: marketing.recommendedOffer,
        recommendedMessageAngle: marketing.recommendedMessageAngle,
        salesPriority: marketing.salesPriority,
        nurtureSequence:
          marketing.nurtureSequence ??
          NURTURE_SEQUENCES[marketing.audienceSegment] ??
          'standard_nurture_14d',
        suppressionFlags: marketing.suppressionFlags,
        complianceFlags: marketing.complianceFlags,
        confidenceScore: marketing.confidenceScore,
        requiresHumanReview: marketing.requiresHumanReview,
        metadata: {
          productRouting: marketing.productRouting,
          crmTags: marketing.crmTags,
          opportunityPriority: input.opportunityOutput?.recommendedPriority,
        } as Prisma.InputJsonValue,
      },
    })

    if (!suppress && input.opportunityOutput) {
      await prisma.marketingSegment.create({
        data: {
          propertyTwinId: input.propertyTwinId,
          segmentKey: marketing.audienceSegment,
          audienceSegment: marketing.audienceSegment,
          confidenceScore: marketing.confidenceScore,
          metadata: {
            campaignRecommendationId: recommendation.id,
            channel: marketing.recommendedChannel,
          } as Prisma.InputJsonValue,
        },
      })
    }

    return {
      campaignRecommendationId: recommendation.id,
      routed: !suppress,
      channel: marketing.recommendedChannel,
      suppressionApplied: suppress,
    }
  }

  buildCrmTags(marketing: MarketingIntelligenceOutput): string[] {
    const tags = new Set<string>([
      ...marketing.crmTags,
      `segment:${marketing.audienceSegment}`,
      `priority:${marketing.salesPriority}`,
      `channel:${marketing.recommendedChannel}`,
    ])
    for (const product of marketing.productRouting.slice(0, 2)) {
      tags.add(`product:${product}`)
    }
    if (marketing.suppressionFlags.length) tags.add('suppressed')
    if (marketing.requiresHumanReview) tags.add('needs_review')
    return [...tags]
  }

  buildCrmCustomFields(
    marketing: MarketingIntelligenceOutput,
    opportunityScore?: number,
  ): Record<string, string> {
    return {
      intelligence_segment: marketing.audienceSegment,
      intelligence_campaign: marketing.recommendedCampaign,
      intelligence_channel: marketing.recommendedChannel,
      intelligence_offer: marketing.recommendedOffer,
      intelligence_priority: marketing.salesPriority,
      intelligence_nurture: marketing.nurtureSequence ?? '',
      intelligence_top_product: marketing.productRouting[0] ?? '',
      ...(opportunityScore != null ? { intelligence_score: String(opportunityScore) } : {}),
    }
  }
}

export const prismaCampaignRoutingService = new PrismaCampaignRoutingService()
