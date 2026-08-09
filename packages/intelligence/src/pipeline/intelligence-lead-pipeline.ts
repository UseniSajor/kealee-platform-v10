import { ruleBasedPropertyIntelligence } from '../agents/rule-based-property-intelligence.js'
import { ruleBasedMarketingIntelligence } from '../agents/rule-based-marketing-intelligence.js'
import { ruleBasedOpportunityScoring } from '../agents/rule-based-opportunity-scoring.js'
import { stubContextBuilderService } from '../services/stubs.js'
import { prismaCampaignRoutingService } from '../services/campaign-routing.service.js'
import { productAssignmentService } from '../services/product-assignment.service.js'
import { buildRoutingContext } from '../routing/property-product-rules.js'
import { complianceGuard } from '../services/compliance-guard.service.js'
import { prismaPropertyTwinService } from '../services/property-twin.service.js'
import { prismaLeadTwinService } from '../services/lead-twin.service.js'
import { loopRunService } from '../services/loop-run.service.js'
import { parcelIngestionService } from '../services/parcel-ingestion.service.js'
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
import type { PropertyIntelligenceInput } from '../schemas/property-intelligence.js'
import type { PropertyIntelligenceOutput } from '../schemas/property-intelligence.js'
import type { MarketingIntelligenceOutput } from '../schemas/marketing-intelligence.js'
import type { OpportunityScoringOutput } from '../schemas/opportunity-scoring.js'
import type { CampaignRoutingResult } from '../services/interfaces.js'
import type { OpportunityPriority } from '../constants/scoring-bands.js'
import type { ProductAssignmentOutput } from '../schemas/product-assignment.js'

export interface IntakeLeadInput {
  leadId: string
  address: string
  email?: string
  phone?: string
  name?: string
  source?: string
  budget?: number
  timeline?: string
  service?: string
  hasPhoto?: boolean
  hasDocuments?: boolean
  propertyType?: string
  parcelId?: string
  jurisdiction?: string
  crmContactId?: string
}

export interface IntelligenceLeadResult {
  leadId: string
  propertyTwinId: string
  leadTwinId: string
  loopRunId: string
  intelligenceScore: number
  recommendedPriority: OpportunityPriority
  audienceSegment: string
  recommendedChannel: string
  topProduct: string
  routed: boolean
  humanReviewRequired: boolean
  reviewReasons: string[]
  property: PropertyIntelligenceOutput
  marketing: MarketingIntelligenceOutput
  opportunity: OpportunityScoringOutput
  routing: CampaignRoutingResult
  productAssignment: ProductAssignmentOutput
  validationErrors: string[]
}

export function isIntelligencePersistenceAvailable(): boolean {
  const url =
    process.env.KEALEE_DB_URL ||
    process.env.DATABASE_URL ||
    process.env.DATABASE_PUBLIC_URL
  return Boolean(url && (url.startsWith('postgresql://') || url.startsWith('postgres://')))
}

export async function scoreIntakeLead(input: IntakeLeadInput): Promise<IntelligenceLeadResult> {
  const validationErrors: string[] = []

  let propertyTwinId: string
  const sample = parcelIngestionService.findSampleByAddress(input.address)
  if (sample) {
    const ingested = await parcelIngestionService.ingest({
      address: sample.address,
      parcelId: sample.parcelId,
      jurisdiction: sample.jurisdiction,
      propertyType: sample.propertyType,
      lotSize: sample.lotSize,
      buildingSize: sample.buildingSize,
      yearBuilt: sample.yearBuilt,
      assessedValue: sample.assessedValue,
      zoning: 'zoning' in sample ? (sample.zoning as Record<string, unknown>) : undefined,
      permitHistory: 'permitHistory' in sample ? [...sample.permitHistory] : undefined,
      ownershipType: 'ownershipType' in sample ? sample.ownershipType : undefined,
      triggerEventId: input.leadId,
    })
    propertyTwinId = ingested.propertyTwin.id!
  } else {
    const twin = await prismaPropertyTwinService.upsert({
      address: input.address,
      parcelId: input.parcelId,
      jurisdiction: input.jurisdiction,
      propertyType: input.propertyType,
      dataSources: ['intake_lead'],
      dataQualityScore: input.parcelId ? 0.65 : 0.5,
    })
    propertyTwinId = twin.id!
  }

  const leadTwin = await prismaLeadTwinService.upsert({
    propertyTwinId,
    crmContactId: input.crmContactId,
    email: input.email,
    phone: input.phone,
    name: input.name,
    sourceChannel: input.source,
    leadType: input.service,
    segment: undefined,
    metadata: { intakeLeadId: input.leadId },
  })

  const loopRun = await loopRunService.create({
    loopType: 'lead_nurture',
    triggerEventType: 'OPPORTUNITY_SCORE_REQUESTED',
    triggerEventId: input.leadId,
    propertyTwinId,
    leadTwinId: leadTwin.id,
    context: { source: input.source, service: input.service },
  })

  const propertyInput: PropertyIntelligenceInput = {
    address: input.address,
    parcelId: input.parcelId ?? sample?.parcelId,
    propertyType: input.propertyType ?? sample?.propertyType,
    lotSize: sample?.lotSize,
    buildingSquareFootage: sample?.buildingSize,
    yearBuilt: sample?.yearBuilt,
    assessedValue: sample?.assessedValue,
    zoning: sample && 'zoning' in sample ? (sample.zoning as Record<string, unknown>) : undefined,
    permitHistory: sample && 'permitHistory' in sample ? [...sample.permitHistory] : undefined,
    serviceIntent: input.service,
    budgetHint: input.budget,
  }

  const context = await stubContextBuilderService.build({
    loopType: 'property_intelligence',
    triggerEventType: 'PARCEL_ANALYZED',
    propertyTwinId,
    leadTwinId: leadTwin.id,
    address: input.address,
    parcelId: propertyInput.parcelId,
  })

  const property = await ruleBasedPropertyIntelligence.analyze(propertyInput, context)
  const propVal = validatePropertyIntelligenceOutput(property)
  if (!propVal.success) validationErrors.push(...propVal.errors)

  await loopRunService.recordStep({
    loopRunId: loopRun.id,
    stepOrder: 1,
    stepName: 'agent',
    agentId: 'PropertyIntelligenceAgent',
    output: property as unknown as Record<string, unknown>,
  })

  await prismaPropertyTwinService.applyAgentOutput(propertyTwinId, property)
  await loopRunService.recordPropertyIntelligenceRun(propertyTwinId, loopRun.id, propertyInput as Record<string, unknown>, property as unknown as Record<string, unknown>, {
    propertySummary: property.propertySummary,
    propertyType: property.propertyType,
    ownershipType: property.ownershipType,
    confidenceScore: property.confidenceScore,
    requiresHumanReview: property.requiresHumanReview,
    dataQualityScore: property.dataQualityScore,
  })

  const marketing = await ruleBasedMarketingIntelligence.recommend(
    {
      propertyTwin: property as unknown as Record<string, unknown>,
      leadTwin: {
        source: input.source,
        budget: input.budget,
        timeline: input.timeline,
        service: input.service,
      },
      sourceChannel: input.source,
    },
    context,
  )
  const mktVal = validateMarketingIntelligenceOutput(marketing)
  if (!mktVal.success) validationErrors.push(...mktVal.errors)

  await loopRunService.recordStep({
    loopRunId: loopRun.id,
    stepOrder: 2,
    stepName: 'agent',
    agentId: 'MarketingIntelligenceAgent',
    output: marketing as unknown as Record<string, unknown>,
  })

  const compliance = await complianceGuard.check({
    audienceSegment: marketing.audienceSegment,
    recommendedMessageAngle: marketing.recommendedMessageAngle,
    crmTags: marketing.crmTags,
  })
  if (!compliance.passed) validationErrors.push(...compliance.violations)

  const opportunity = await ruleBasedOpportunityScoring.score(
    {
      propertyIntelligence: property,
      marketingIntelligence: marketing,
      ownerLeadData: {
        source: input.source,
        budget: input.budget,
        timeline: input.timeline,
        service: input.service,
        hasPhoto: input.hasPhoto,
        hasDocuments: input.hasDocuments,
      },
    },
    context,
  )
  const oppVal = validateOpportunityScoringOutput(opportunity)
  if (!oppVal.success) validationErrors.push(...oppVal.errors)

  await loopRunService.recordStep({
    loopRunId: loopRun.id,
    stepOrder: 3,
    stepName: 'agent',
    agentId: 'OpportunityScoringAgent',
    output: opportunity as unknown as Record<string, unknown>,
  })

  await prismaPropertyTwinService.applyAgentOutput(propertyTwinId, opportunity)
  await loopRunService.recordOpportunityScore(propertyTwinId, loopRun.id, {
    ...opportunity,
    reviewReasons: [
      ...mergeHumanReviewFromPropertyOutput(property).reasons,
      ...mergeHumanReviewFromMarketingOutput(marketing).reasons,
      ...mergeHumanReviewFromOpportunityOutput(opportunity).reasons,
    ],
  })

  const routing = await prismaCampaignRoutingService.route({
    propertyTwinId,
    marketingOutput: marketing,
    opportunityOutput: opportunity,
    loopRunId: loopRun.id,
  })

  const productAssignment = productAssignmentService.assign({
    propertyTwinId,
    loopRunId: loopRun.id,
    productScores: opportunity.productScores,
    propertyContext: buildRoutingContext(propertyInput, {
      hasDocuments: input.hasDocuments,
      hasPlans: input.hasDocuments,
    }),
    totalOpportunityScore: opportunity.totalOpportunityScore,
  })

  if (productAssignment.autoAssigned) {
    await productAssignmentService.persist(
      {
        propertyTwinId,
        loopRunId: loopRun.id,
        productScores: opportunity.productScores,
      },
      productAssignment,
    )
  }

  let reviewReasons = [
    ...mergeHumanReviewFromPropertyOutput(property).reasons,
    ...mergeHumanReviewFromMarketingOutput(marketing).reasons,
    ...mergeHumanReviewFromOpportunityOutput(opportunity).reasons,
  ]
  if (productAssignment.autoAssigned && !productAssignment.requiresHumanReview) {
    reviewReasons = []
  }

  await loopRunService.complete(
    loopRun.id,
    {
      intelligenceScore: opportunity.totalOpportunityScore,
      priority: opportunity.recommendedPriority,
      segment: marketing.audienceSegment,
    },
    reviewReasons.length > 0,
  )

  await prismaLeadTwinService.upsert({
    propertyTwinId,
    crmContactId: input.crmContactId,
    email: input.email,
    phone: input.phone,
    name: input.name,
    sourceChannel: input.source,
    leadType: input.service,
    segment: marketing.audienceSegment,
    complianceFlags: marketing.complianceFlags,
    metadata: { intakeLeadId: input.leadId },
  })

  return {
    leadId: input.leadId,
    propertyTwinId,
    leadTwinId: leadTwin.id!,
    loopRunId: loopRun.id,
    intelligenceScore: opportunity.totalOpportunityScore,
    recommendedPriority: opportunity.recommendedPriority,
    audienceSegment: marketing.audienceSegment,
    recommendedChannel: marketing.recommendedChannel,
    topProduct: productAssignment.assignedProduct,
    routed: routing.routed || productAssignment.autoAssigned,
    humanReviewRequired: reviewReasons.length > 0,
    reviewReasons: [...new Set(reviewReasons)],
    property,
    marketing,
    opportunity,
    routing,
    productAssignment,
    validationErrors,
  }
}
