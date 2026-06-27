import { prisma, Prisma } from '@kealee/database'
import type { KealeeProduct } from '../constants/products.js'
import type { ProductScores } from '../schemas/shared.js'
import {
  AUTO_ASSIGN_MIN_PRODUCT_SCORE,
  AUTO_ASSIGN_NO_REVIEW_MIN_SCORE,
  getProductAssignment,
  PRODUCT_ASSIGNMENT_CATALOG,
} from '../constants/product-assignment-catalog.js'
import { PRODUCT_TO_KEY } from '../scoring/opportunity-model.js'
import type { ProductAssignmentOutput } from '../schemas/product-assignment.js'
import type { PropertyRoutingContext } from '../routing/property-product-rules.js'
import { routePropertyToProducts } from '../routing/property-product-rules.js'

export interface AssignProductInput {
  propertyTwinId: string
  loopRunId?: string
  productScores: ProductScores
  propertyContext?: PropertyRoutingContext
  totalOpportunityScore?: number
  forceProduct?: KealeeProduct
}

const SCORE_KEY_TO_PRODUCT = Object.fromEntries(
  Object.entries(PRODUCT_TO_KEY).map(([product, key]) => [key, product]),
) as Record<string, KealeeProduct>

function topProductByScore(scores: ProductScores): { product: KealeeProduct; score: number } {
  let bestKey: keyof ProductScores = 'designConceptScore'
  let best = 0
  for (const [key, value] of Object.entries(scores) as [keyof ProductScores, number][]) {
    if (value > best) {
      best = value
      bestKey = key
    }
  }
  const product = SCORE_KEY_TO_PRODUCT[bestKey] ?? 'design_concept_validation'
  return { product, score: best }
}

export class ProductAssignmentService {
  assign(input: AssignProductInput): ProductAssignmentOutput {
    const ruleRoute = input.propertyContext
      ? routePropertyToProducts(input.propertyContext)
      : null

    const scored = topProductByScore(input.productScores)
    let product = input.forceProduct ?? scored.product
    let productScore = scored.score

    if (ruleRoute && ruleRoute.matchedRules.length > 0) {
      const ruleProduct = ruleRoute.primaryProduct
      const ruleScoreKey = PRODUCT_TO_KEY[ruleProduct]
      const ruleScore = ruleScoreKey ? input.productScores[ruleScoreKey] : 0
      if (ruleScore >= scored.score * 0.85 || scored.score < AUTO_ASSIGN_MIN_PRODUCT_SCORE) {
        product = ruleProduct
        productScore = Math.max(ruleScore, scored.score)
      }
    }

    const def = getProductAssignment(product)
    const autoAssigned = productScore >= AUTO_ASSIGN_MIN_PRODUCT_SCORE
    const requiresHumanReview =
      !autoAssigned || (productScore < AUTO_ASSIGN_NO_REVIEW_MIN_SCORE && product === 'developer_feasibility')

    const explanation = [
      `${def.displayName} scored ${productScore}/100.`,
      autoAssigned
        ? `Auto-assigned: Campaign "${def.campaign}", Landing "${def.landingPageLabel}", Offer "${def.offer}".`
        : `Score below ${AUTO_ASSIGN_MIN_PRODUCT_SCORE} — nurture only, no auto-route.`,
      ruleRoute?.matchedRules.length
        ? `Matched rules: ${ruleRoute.matchedRules.map((r) => r.characteristic).join('; ')}.`
        : '',
    ]
      .filter(Boolean)
      .join(' ')

    return {
      assignedProduct: product,
      productScore,
      displayName: def.displayName,
      campaign: def.campaign,
      landingPage: def.landingPage,
      landingPageLabel: def.landingPageLabel,
      offer: def.offer,
      offerPriceUsd: def.offerPriceUsd,
      bot: def.bot,
      nurtureSequence: def.nurtureSequence,
      nextServiceInJourney: def.nextServiceInJourney,
      crmPipelineStage: def.crmPipelineStage,
      matchedRuleIds: ruleRoute?.matchedRules.map((r) => r.id) ?? [],
      autoAssigned,
      requiresHumanReview,
      assignmentExplanation: explanation,
      confidenceScore: Math.min(0.98, 0.7 + productScore / 200),
      crmTags: [
        `product:${product}`,
        `campaign:${def.campaign.toLowerCase().replace(/\s+/g, '_')}`,
        `bot:${def.bot}`,
        autoAssigned ? 'auto_assigned' : 'manual_nurture',
      ],
      crmCustomFields: {
        intelligence_assigned_product: product,
        intelligence_campaign: def.campaign,
        intelligence_landing_page: def.landingPage,
        intelligence_offer: def.offer,
        intelligence_bot: def.bot,
        intelligence_product_score: String(productScore),
        intelligence_pipeline_stage: def.crmPipelineStage,
        ...(def.nextServiceInJourney
          ? { intelligence_next_service: def.nextServiceInJourney }
          : {}),
      },
    }
  }

  async persist(
    input: AssignProductInput,
    assignment: ProductAssignmentOutput,
  ): Promise<{ campaignRecommendationId: string }> {
    const recommendation = await prisma.campaignRecommendation.create({
      data: {
        propertyTwinId: input.propertyTwinId,
        loopRunId: input.loopRunId,
        recommendedCampaign: assignment.campaign,
        recommendedChannel: assignment.autoAssigned ? 'email' : 'none',
        recommendedOffer: assignment.offer,
        recommendedMessageAngle: `${assignment.displayName} — ${assignment.landingPageLabel}`,
        salesPriority: assignment.productScore >= AUTO_ASSIGN_NO_REVIEW_MIN_SCORE ? 'immediate' : 'high',
        nurtureSequence: assignment.nurtureSequence,
        suppressionFlags: assignment.autoAssigned ? [] : ['below_auto_assign_threshold'],
        complianceFlags: [],
        confidenceScore: assignment.confidenceScore,
        requiresHumanReview: assignment.requiresHumanReview,
        metadata: {
          productAssignment: assignment,
          autoAssigned: assignment.autoAssigned,
          landingPage: assignment.landingPage,
          bot: assignment.bot,
          matchedRuleIds: assignment.matchedRuleIds,
        } as Prisma.InputJsonValue,
      },
    })

    await prisma.propertyTwin.update({
      where: { id: input.propertyTwinId },
      data: {
        recommendedProducts: [assignment.assignedProduct],
        metadata: {
          lastProductAssignment: assignment,
          assignedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    })

    return { campaignRecommendationId: recommendation.id }
  }

  listCatalog() {
    return Object.values(PRODUCT_ASSIGNMENT_CATALOG)
  }
}

export const productAssignmentService = new ProductAssignmentService()
