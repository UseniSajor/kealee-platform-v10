import type { OpportunityScoringService } from '../services/interfaces.js'
import type { OpportunityScoringInput, OpportunityScoringOutput } from '../schemas/opportunity-scoring.js'
import type { ContextBuilderPayload } from '../schemas/context.js'
import { computeOpportunityScore } from '../scoring/opportunity-model.js'

export class RuleBasedOpportunityScoringService implements OpportunityScoringService {
  async score(input: OpportunityScoringInput, _context: ContextBuilderPayload): Promise<OpportunityScoringOutput> {
    const property = input.propertyIntelligence
    const marketing = input.marketingIntelligence
    const lead = (input.ownerLeadData ?? {}) as {
      source?: string
      budget?: number
      timeline?: string
      service?: string
      hasPhoto?: boolean
      hasDocuments?: boolean
    }

    const model = computeOpportunityScore({ property, marketing, lead })
    const products = marketing?.productRouting ?? property.recommendedKealeeProducts

    return {
      totalOpportunityScore: model.totalOpportunityScore,
      productScores: model.productScores,
      urgencyScore: model.urgencyScore,
      revenuePotential: model.revenuePotential,
      conversionLikelihood: model.conversionLikelihood,
      estimatedProjectValue: model.estimatedProjectValue,
      recommendedPriority: model.recommendedPriority,
      recommendedNextAction:
        model.recommendedPriority === 'suppress'
          ? 'archive_or_long_nurture'
          : model.recommendedPriority === 'immediate'
            ? 'sales_call_within_24h'
            : 'enqueue_campaign_sequence',
      dataQualityScore: property.dataQualityScore,
      scoreExplanation: model.scoreExplanation,
      digitalTwinUpdates: [
        {
          field: 'latestScores',
          value: {
            total: model.totalOpportunityScore,
            priority: model.recommendedPriority,
            topProduct: model.topProduct,
          },
        },
      ],
      crmUpdates: {
        lead_score: model.totalOpportunityScore,
        routing_tag: model.recommendedPriority,
        recommended_products: products.slice(0, 3),
        top_product: model.topProduct,
        urgency_score: model.urgencyScore,
      },
      confidenceScore: property.confidenceScore,
      requiresHumanReview:
        property.requiresHumanReview ||
        model.estimatedProjectValue > 250_000 ||
        model.recommendedPriority === 'immediate',
    }
  }
}

export const ruleBasedOpportunityScoring = new RuleBasedOpportunityScoringService()
