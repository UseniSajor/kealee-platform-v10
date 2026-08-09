import type { MarketingLeadFixture } from '../fixtures/marketing-lead-scenarios.js'
import { ruleBasedPropertyIntelligence } from '../agents/rule-based-property-intelligence.js'
import { ruleBasedMarketingIntelligence } from '../agents/rule-based-marketing-intelligence.js'
import { ruleBasedOpportunityScoring } from '../agents/rule-based-opportunity-scoring.js'
import { stubContextBuilderService, stubCampaignRoutingService } from '../services/stubs.js'
import { complianceGuard } from '../services/compliance-guard.service.js'
import {
  validatePropertyIntelligenceOutput,
  validateMarketingIntelligenceOutput,
  validateOpportunityScoringOutput,
} from '../validation/output-validator.js'
import {
  mergeHumanReviewFromPropertyOutput,
  mergeHumanReviewFromMarketingOutput,
  mergeHumanReviewFromOpportunityOutput,
} from '../validation/human-review.js'
import type { PropertyIntelligenceOutput } from '../schemas/property-intelligence.js'
import type { MarketingIntelligenceOutput } from '../schemas/marketing-intelligence.js'
import type { OpportunityScoringOutput } from '../schemas/opportunity-scoring.js'
import type { CampaignRoutingResult } from '../services/interfaces.js'

export interface MarketingLeadPipelineResult {
  scenarioId: string
  label: string
  passed: boolean
  errors: string[]
  property: PropertyIntelligenceOutput
  marketing: MarketingIntelligenceOutput
  opportunity: OpportunityScoringOutput
  routing: CampaignRoutingResult
  humanReviewRequired: boolean
  reviewReasons: string[]
  compliancePassed: boolean
}

export async function runMarketingLeadPipeline(
  scenario: MarketingLeadFixture,
): Promise<MarketingLeadPipelineResult> {
  const errors: string[] = []

  const context = await stubContextBuilderService.build({
    loopType: 'property_intelligence',
    triggerEventType: 'PROPERTY_IMPORTED',
    address: scenario.property.address,
    parcelId: scenario.property.parcelId,
  })

  const property = await ruleBasedPropertyIntelligence.analyze(
    {
      ...scenario.property,
      serviceIntent: scenario.lead.service,
      budgetHint: scenario.lead.budget,
    },
    context,
  )
  const propertyValidation = validatePropertyIntelligenceOutput(property)
  if (!propertyValidation.success) errors.push(...propertyValidation.errors)

  const marketing = await ruleBasedMarketingIntelligence.recommend(
    {
      propertyTwin: property as unknown as Record<string, unknown>,
      leadTwin: scenario.lead as Record<string, unknown>,
      sourceChannel: scenario.lead.source,
      crmStatus: scenario.lead.crmStatus,
    },
    context,
  )
  const marketingValidation = validateMarketingIntelligenceOutput(marketing)
  if (!marketingValidation.success) errors.push(...marketingValidation.errors)

  const compliance = await complianceGuard.check({
    audienceSegment: marketing.audienceSegment,
    recommendedMessageAngle: marketing.recommendedMessageAngle,
    crmTags: marketing.crmTags,
  })
  if (!compliance.passed) errors.push(...compliance.violations)

  const opportunity = await ruleBasedOpportunityScoring.score(
    {
      propertyIntelligence: property,
      marketingIntelligence: marketing,
      ownerLeadData: scenario.lead,
    },
    context,
  )
  const opportunityValidation = validateOpportunityScoringOutput(opportunity)
  if (!opportunityValidation.success) errors.push(...opportunityValidation.errors)

  const routing = await stubCampaignRoutingService.route({
    propertyTwinId: 'test',
    marketingOutput: marketing,
    opportunityOutput: opportunity,
  })

  const reviewReasons = [
    ...mergeHumanReviewFromPropertyOutput(property).reasons,
    ...mergeHumanReviewFromMarketingOutput(marketing).reasons,
    ...mergeHumanReviewFromOpportunityOutput(opportunity).reasons,
  ]
  const humanReviewRequired = reviewReasons.length > 0

  const { expect: exp } = scenario
  if (marketing.audienceSegment !== exp.segment) {
    errors.push(`segment: expected ${exp.segment}, got ${marketing.audienceSegment}`)
  }
  if (opportunity.totalOpportunityScore < exp.minOpportunityScore) {
    errors.push(`score too low: ${opportunity.totalOpportunityScore} < ${exp.minOpportunityScore}`)
  }
  if (opportunity.totalOpportunityScore > exp.maxOpportunityScore) {
    errors.push(`score too high: ${opportunity.totalOpportunityScore} > ${exp.maxOpportunityScore}`)
  }
  if (opportunity.recommendedPriority !== exp.priority) {
    errors.push(`priority: expected ${exp.priority}, got ${opportunity.recommendedPriority}`)
  }
  if (routing.routed !== exp.shouldRoute) {
    errors.push(`routing: expected routed=${exp.shouldRoute}, got ${routing.routed}`)
  }
  const topProduct =
    marketing.productRouting[0] ?? property.recommendedKealeeProducts[0]
  if (topProduct !== exp.topProduct) {
    errors.push(`topProduct: expected ${exp.topProduct}, got ${topProduct}`)
  }

  return {
    scenarioId: scenario.id,
    label: scenario.label,
    passed: errors.length === 0,
    errors,
    property,
    marketing,
    opportunity,
    routing,
    humanReviewRequired,
    reviewReasons: [...new Set(reviewReasons)],
    compliancePassed: compliance.passed,
  }
}

export async function runAllMarketingLeadScenarios(
  scenarios: MarketingLeadFixture[],
): Promise<MarketingLeadPipelineResult[]> {
  return Promise.all(scenarios.map(runMarketingLeadPipeline))
}
