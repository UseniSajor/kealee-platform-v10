import { describe, it, expect } from 'vitest'
import { computeOpportunityScore } from '../scoring/opportunity-model.js'
import type { PropertyIntelligenceOutput } from '../schemas/property-intelligence.js'

const property: PropertyIntelligenceOutput = {
  propertySummary: 'Test property',
  propertyType: 'single_family',
  ownershipType: 'owner_occupied',
  likelyUseCases: ['remodel'],
  developmentPotential: 'medium',
  renovationPotential: 'high',
  permitRisk: 'low',
  zoningRisk: 'low',
  physicalRisk: 'low',
  dataQualityScore: 0.8,
  recommendedKealeeProducts: ['kitchen_bath_remodel'],
  digitalTwinUpdates: [],
  nextActions: [{ action: 'score' }],
  confidenceScore: 0.85,
  requiresHumanReview: false,
}

describe('opportunity scoring model', () => {
  it('scores hot leads highly', () => {
    const result = computeOpportunityScore({
      property,
      lead: { source: 'meta', budget: 60000, timeline: 'asap', service: 'permit', hasDocuments: true },
    })
    expect(result.totalOpportunityScore).toBeGreaterThanOrEqual(75)
    expect(result.recommendedPriority).toMatch(/immediate|high/)
  })

  it('suppresses cold low-budget leads', () => {
    const result = computeOpportunityScore({
      property,
      lead: { source: 'direct', budget: 500, timeline: '3plus-months' },
    })
    expect(result.totalOpportunityScore).toBeLessThan(50)
    expect(result.recommendedPriority).toBe('suppress')
  })

  it('identifies top product', () => {
    const result = computeOpportunityScore({
      property,
      lead: { source: 'google', budget: 40000, timeline: '1-month', service: 'permit' },
    })
    expect(result.topProduct).toBeDefined()
    expect(result.scoreExplanation).toContain('Top product')
  })
})
