import { describe, it, expect } from 'vitest'
import { MARKETING_LEAD_SCENARIOS } from '../fixtures/marketing-lead-scenarios.js'
import { runMarketingLeadPipeline, runAllMarketingLeadScenarios } from '../pipeline/marketing-lead-pipeline.js'

describe('Marketing & lead intelligence pipeline', () => {
  it.each(MARKETING_LEAD_SCENARIOS.map((s) => [s.id, s]))(
    'scenario %s passes full agent pipeline',
    async (_id, scenario) => {
      const result = await runMarketingLeadPipeline(scenario)
      if (!result.passed) {
        console.error(result.errors)
      }
      expect(result.passed, result.errors.join('; ')).toBe(true)
      expect(result.compliancePassed).toBe(true)
      expect(result.property.confidenceScore).toBeGreaterThan(0)
      expect(result.opportunity.scoreExplanation.length).toBeGreaterThan(0)
    },
  )

  it('routes hot leads and suppresses cold leads', async () => {
    const results = await runAllMarketingLeadScenarios(MARKETING_LEAD_SCENARIOS)
    const hot = results.find((r) => r.scenarioId === 'hot-kitchen-remodel-meta')!
    const cold = results.find((r) => r.scenarioId === 'cold-low-budget-direct')!

    expect(hot.routing.routed).toBe(true)
    expect(hot.opportunity.totalOpportunityScore).toBeGreaterThanOrEqual(70)
    expect(cold.routing.routed).toBe(false)
    expect(cold.opportunity.recommendedPriority).toBe('suppress')
    expect(cold.marketing.suppressionFlags.length).toBeGreaterThan(0)
  })

  it('flags developer leads for human review', async () => {
    const dev = await runMarketingLeadPipeline(
      MARKETING_LEAD_SCENARIOS.find((s) => s.id === 'developer-feasibility-referral')!,
    )
    expect(dev.humanReviewRequired).toBe(true)
    expect(dev.marketing.audienceSegment).toBe('developer_feasibility_candidate')
    expect(dev.opportunity.estimatedProjectValue).toBeGreaterThan(250_000)
  })

  it('produces CRM updates with lead_score for all scenarios', async () => {
    const results = await runAllMarketingLeadScenarios(MARKETING_LEAD_SCENARIOS)
    for (const r of results) {
      const crm = r.opportunity.crmUpdates as { lead_score?: number; routing_tag?: string }
      expect(crm.lead_score).toBe(r.opportunity.totalOpportunityScore)
      expect(crm.routing_tag).toBe(r.opportunity.recommendedPriority)
    }
  })

  it('maps permit leads to permit_help segment', async () => {
    const permit = await runMarketingLeadPipeline(
      MARKETING_LEAD_SCENARIOS.find((s) => s.id === 'permit-help-google')!,
    )
    expect(permit.marketing.audienceSegment).toBe('permit_help_candidate')
    expect(permit.property.recommendedKealeeProducts).toContain('permit_package')
  })
})
