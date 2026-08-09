import { describe, it, expect } from 'vitest'
import {
  resolveEnginesForEvent,
  resolveNextEvents,
  validateCapitalIntelligenceOutput,
  validateLeadIntelligenceOutput,
  leadIntelligenceOutputSchema,
  capitalIntelligenceOutputSchema,
  EVENT_ENGINE_MAP,
} from '../index.js'

describe('LoopRouter event mapping', () => {
  it('maps PROPERTY_IMPORTED to property and opportunity engines', () => {
    expect(resolveEnginesForEvent('PROPERTY_IMPORTED')).toEqual(['property', 'opportunity'])
  })

  it('maps FINANCING_INTERESTED to capital engine', () => {
    expect(resolveEnginesForEvent('FINANCING_INTERESTED')).toEqual(['capital'])
  })

  it('maps PROJECT_CREATED to project engine', () => {
    expect(resolveEnginesForEvent('PROJECT_CREATED')).toEqual(['project'])
  })

  it('covers all mapped events', () => {
    expect(Object.keys(EVENT_ENGINE_MAP).length).toBeGreaterThan(5)
  })

  it('resolves next events after property engine', () => {
    expect(resolveNextEvents('property', {})).toContain('OPPORTUNITY_SCORE_REQUESTED')
  })
})

describe('LeadIntelligenceAgent schema', () => {
  it('parses valid output', () => {
    const output = {
      leadSegment: 'homeowner_remodel_candidate',
      intentScore: 72,
      engagementScore: 55,
      salesPriority: 'high',
      recommendedProduct: 'design_concept_validation',
      recommendedSalesAction: 'enqueue_nurture_sequence',
      crmTags: ['web'],
      suppressionFlags: [],
      complianceFlags: [],
      leadTwinUpdates: [],
      nextActions: [{ action: 'update_lead_twin' }],
      confidenceScore: 0.82,
      requiresHumanReview: false,
      scoreExplanation: 'Intent 72 from form submission.',
    }
    expect(leadIntelligenceOutputSchema.parse(output)).toBeDefined()
    expect(validateLeadIntelligenceOutput(output).success).toBe(true)
  })
})

describe('CapitalIntelligenceAgent compliance', () => {
  it('rejects credit approval claims', () => {
    const output = {
      capitalFitScore: 80,
      recommendedLoanProducts: ['heloc'],
      requiredDocuments: [],
      riskFlags: [],
      complianceFlags: [],
      capitalTwinUpdates: [],
      nextActions: [{ action: 'route_lender_package' }],
      confidenceScore: 0.8,
      requiresHumanReview: true,
      scoreExplanation: 'You are pre-approved for this loan.',
    }
    const result = validateCapitalIntelligenceOutput(output)
    expect(result.success).toBe(false)
  })

  it('accepts fit assessment without approval language', () => {
    const output = {
      capitalFitScore: 80,
      recommendedLoanProducts: ['heloc'],
      requiredDocuments: ['income_verification'],
      riskFlags: [],
      complianceFlags: ['not_credit_approval'],
      capitalTwinUpdates: [],
      nextActions: [{ action: 'route_lender_package' }],
      confidenceScore: 0.8,
      requiresHumanReview: true,
      scoreExplanation: 'Capital fit 80/100. Not a credit approval.',
    }
    expect(capitalIntelligenceOutputSchema.parse(output)).toBeDefined()
    expect(validateCapitalIntelligenceOutput(output).success).toBe(true)
  })
})
