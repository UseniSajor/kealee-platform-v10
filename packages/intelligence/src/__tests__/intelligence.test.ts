import { describe, it, expect } from 'vitest'
import {
  propertyIntelligenceOutputSchema,
  marketingIntelligenceOutputSchema,
  opportunityScoringOutputSchema,
  contextBuilderPayloadSchema,
  validatePropertyIntelligenceOutput,
  validateOpportunityScoringOutput,
  scoreToPriority,
  complianceGuard,
  evaluateHumanReview,
  KEALEE_PRODUCTS,
} from '../index.js'

const validPropertyOutput = {
  propertySummary: 'Single-family residential parcel in Arlington, VA.',
  propertyType: 'single_family',
  ownershipType: 'owner_occupied',
  likelyUseCases: ['kitchen remodel', 'adu feasibility'],
  developmentPotential: 'medium',
  renovationPotential: 'high',
  permitRisk: 'low',
  zoningRisk: 'low',
  physicalRisk: 'low',
  dataQualityScore: 0.82,
  recommendedKealeeProducts: ['kitchen_bath_remodel', 'adu_feasibility'],
  digitalTwinUpdates: [],
  nextActions: [{ action: 'schedule_concept_call' }],
  confidenceScore: 0.88,
  requiresHumanReview: false,
}

const validMarketingOutput = {
  audienceSegment: 'homeowner_remodel_candidate',
  recommendedCampaign: 'spring_remodel_2026',
  recommendedChannel: 'email',
  recommendedOffer: 'free_concept_validation',
  recommendedMessageAngle: 'Transform your kitchen with Kealee design support',
  productRouting: ['kitchen_bath_remodel'],
  salesPriority: 'high',
  crmTags: ['remodel', 'homeowner'],
  suppressionFlags: [],
  complianceFlags: [],
  nextActions: [{ action: 'enqueue_nurture_sequence' }],
  confidenceScore: 0.8,
  requiresHumanReview: false,
}

const validOpportunityOutput = {
  totalOpportunityScore: 78,
  productScores: {
    designConceptScore: 75,
    estimateDetailedScore: 70,
    permitPackageScore: 30,
    contractorMatchScore: 70,
    pmAdvisoryScore: 45,
    aduFeasibilityScore: 60,
    additionFeasibilityScore: 55,
    basementFinishScore: 40,
    kitchenBathScore: 82,
    developerFeasibilityScore: 20,
    financeScore: 35,
    commercialRenovationScore: 10,
    investorServicesScore: 15,
  },
  urgencyScore: 65,
  conversionLikelihood: 0.72,
  estimatedProjectValue: 85000,
  recommendedPriority: 'high',
  recommendedNextAction: 'send_kitchen_remodel_offer',
  dataQualityScore: 0.8,
  scoreExplanation: 'Strong kitchen remodel fit based on property age and owner-occupied status.',
  digitalTwinUpdates: [],
  crmUpdates: {},
  confidenceScore: 0.85,
  requiresHumanReview: false,
}

describe('PropertyIntelligenceAgent schema', () => {
  it('parses valid output', () => {
    expect(propertyIntelligenceOutputSchema.parse(validPropertyOutput)).toBeDefined()
  })

  it('rejects unsupported products', () => {
    const result = validatePropertyIntelligenceOutput({
      ...validPropertyOutput,
      recommendedKealeeProducts: ['fake_product'],
    })
    expect(result.success).toBe(false)
  })

  it('requires confidenceScore', () => {
    const { confidenceScore: _, ...rest } = validPropertyOutput
    const result = propertyIntelligenceOutputSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })
})

describe('MarketingIntelligenceAgent schema', () => {
  it('parses valid output', () => {
    expect(marketingIntelligenceOutputSchema.parse(validMarketingOutput)).toBeDefined()
  })
})

describe('OpportunityScoringAgent schema', () => {
  it('parses valid output', () => {
    expect(opportunityScoringOutputSchema.parse(validOpportunityOutput)).toBeDefined()
  })

  it('requires scoreExplanation', () => {
    const result = validateOpportunityScoringOutput({
      ...validOpportunityOutput,
      scoreExplanation: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('ContextBuilder payload', () => {
  it('parses assembled context', () => {
    const payload = contextBuilderPayloadSchema.parse({
      loopType: 'property_intelligence',
      retrievedAt: new Date().toISOString(),
      complianceFlags: [],
    })
    expect(payload.loopType).toBe('property_intelligence')
  })
})

describe('scoring bands', () => {
  it('maps scores to priority bands', () => {
    expect(scoreToPriority(95)).toBe('immediate')
    expect(scoreToPriority(80)).toBe('high')
    expect(scoreToPriority(65)).toBe('nurture')
    expect(scoreToPriority(50)).toBe('low')
    expect(scoreToPriority(25)).toBe('suppress')
  })
})

describe('product recommendations', () => {
  it('includes all spec products', () => {
    expect(KEALEE_PRODUCTS).toContain('permit_package')
    expect(KEALEE_PRODUCTS).toContain('developer_feasibility')
    expect(KEALEE_PRODUCTS.length).toBe(14)
  })
})

describe('compliance guard', () => {
  it('flags protected-class targeting', async () => {
    const result = await complianceGuard.check({
      recommendedMessageAngle: 'Target homeowners by race in this zip code',
    })
    expect(result.passed).toBe(false)
    expect(result.violations.length).toBeGreaterThan(0)
  })

  it('passes compliant messaging', async () => {
    const result = await complianceGuard.check({
      recommendedMessageAngle: 'Kitchen remodel support for owner-occupied homes',
      crmTags: ['remodel', 'homeowner'],
    })
    expect(result.passed).toBe(true)
  })
})

describe('human review flags', () => {
  it('flags low data quality', () => {
    const result = evaluateHumanReview({ dataQualityScore: 0.5, confidenceScore: 0.9 })
    expect(result.requiresHumanReview).toBe(true)
    expect(result.reasons).toContain('data_quality_below_threshold')
  })

  it('flags high project value', () => {
    const result = evaluateHumanReview({
      estimatedProjectValue: 300_000,
      confidenceScore: 0.9,
      dataQualityScore: 0.9,
    })
    expect(result.requiresHumanReview).toBe(true)
    expect(result.reasons).toContain('high_estimated_project_value')
  })
})
