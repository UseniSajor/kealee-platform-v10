import {
  CANONICAL_PRICE_CENTS,
  CONCEPT_PACKAGE_FULFILLMENT,
  INTAKE_PRICE_CENTS,
  INTAKE_TIER_PRICE_CENTS,
} from '@kealee/core-rules'

describe('retail concept pricing', () => {
  test('bathroom outcomes use the canonical competitive price ladder', () => {
    expect(INTAKE_TIER_PRICE_CENTS.bathroom_remodel?.[1]?.cents).toBe(15_900)
    expect(INTAKE_TIER_PRICE_CENTS.bathroom_remodel?.[2]?.cents).toBe(34_900)
    expect(INTAKE_TIER_PRICE_CENTS.bathroom_remodel?.[3]?.cents).toBe(69_900)
    expect(INTAKE_PRICE_CENTS.bathroom_remodel.cents).toBe(CANONICAL_PRICE_CENTS.concept.bath)
  })

  test('kitchen outcomes use the canonical competitive price ladder', () => {
    expect(INTAKE_TIER_PRICE_CENTS.kitchen_remodel?.[1]?.cents).toBe(19_900)
    expect(INTAKE_TIER_PRICE_CENTS.kitchen_remodel?.[2]?.cents).toBe(44_900)
    expect(INTAKE_TIER_PRICE_CENTS.kitchen_remodel?.[3]?.cents).toBe(89_900)
    expect(INTAKE_PRICE_CENTS.kitchen_remodel.cents).toBe(CANONICAL_PRICE_CENTS.concept.kitchen)
  })

  test('concept fulfillment has one orchestrator and a human release gate', () => {
    expect(CONCEPT_PACKAGE_FULFILLMENT.orchestrationAgent).toBe('design')
    expect(CONCEPT_PACKAGE_FULFILLMENT.releaseGate).toBe('human_review')
    expect(CONCEPT_PACKAGE_FULFILLMENT.contributingAgents.estimate).toContain('BOM')
    expect(CONCEPT_PACKAGE_FULFILLMENT.contributingAgents.permit).toContain('AHJ checklist')
  })
})
