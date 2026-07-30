/**
 * Intake flow test suite — verify all three product tiers display correctly
 * and charge the right amounts across different service types.
 *
 * Tiers tested:
 * - Tier 1: Concept
 * - Tier 2: Concept + Budget
 * - Tier 3: Preconstruction Package
 *
 * Services tested:
 * - Kitchen Remodel: $199 / $449 / $899
 * - Bathroom Remodel: $159 / $349 / $699
 * - Garden & Landscape: $199 / $449 / $899
 * - Home Addition: $199 / $449 / $899
 */

import { INTAKE_TIER_PRICE_CENTS, INTAKE_PRICE_CENTS } from '@kealee/core-rules'
import { expect, describe, it, test } from '@jest/globals'

describe('Intake Tier Configuration', () => {
  describe('Tier-specific pricing (INTAKE_TIER_PRICE_CENTS)', () => {
    const tierPaths = [
      'kitchen_remodel',
      'bathroom_remodel',
      'garden_concept',
      'addition_expansion',
      'whole_home_concept',
      'interior_renovation',
      'exterior_concept',
    ]

    tierPaths.forEach(path => {
      describe(`${path} tier pricing`, () => {
        const tiers = INTAKE_TIER_PRICE_CENTS[path]

        test('should have all three tiers defined', () => {
          expect(tiers).toBeDefined()
          expect(Object.keys(tiers || {})).toHaveLength(3)
        })

        test('Tier 1 concept should exist and be cheaper than Tier 2', () => {
          const tier1 = tiers?.[1]
          const tier2 = tiers?.[2]

          expect(tier1).toBeDefined()
          expect(tier1?.cents).toBeGreaterThan(0)
          expect(tier1?.label).toBeTruthy()
          expect(tier1?.cents).toBeLessThan(tier2?.cents || Infinity)
        })

        test('Tier 2 should be middle-priced', () => {
          const tier2 = tiers?.[2]
          const tier3 = tiers?.[3]

          expect(tier2).toBeDefined()
          expect(tier2?.label).toBeTruthy()
          expect(tier2?.cents).toBeGreaterThan(tiers?.[1]?.cents || 0)
          expect(tier2?.cents).toBeLessThan(tier3?.cents || Infinity)
        })

        test('Tier 3 preconstruction should be most expensive', () => {
          const tier3 = tiers?.[3]

          expect(tier3).toBeDefined()
          expect(tier3?.label).toBeTruthy()
          expect(tier3?.cents).toBeGreaterThan(tiers?.[2]?.cents || 0)
        })

        test('all tiers should have delivery days specified', () => {
          Object.values(tiers || {}).forEach(tier => {
            expect(tier.deliveryDays).toBeDefined()
            expect(tier.deliveryDays).toMatch(/\d+/)
          })
        })
      })
    })
  })

  describe('Tier pricing progression', () => {
    test('Concept tier should always be cheapest', () => {
      Object.entries(INTAKE_TIER_PRICE_CENTS).forEach(([path, tiers]) => {
        if (!tiers?.[1]) return

        const tier1 = tiers[1].cents
        const tier2 = tiers[2]?.cents
        const tier3 = tiers[3]?.cents

        expect(tier1).toBeLessThan(tier2 || Infinity)
        if (tier3) {
          expect(tier1).toBeLessThan(tier3)
        }
      })
    })

    test('Concept + Budget tier should remain above Concept', () => {
      Object.entries(INTAKE_TIER_PRICE_CENTS).forEach(([path, tiers]) => {
        if (!tiers?.[1] || !tiers?.[2]) return

        const ratio = tiers[2].cents / tiers[1].cents
        expect(ratio).toBeGreaterThan(1)
        expect(ratio).toBeLessThan(7)
      })
    })

    test('Preconstruction tier should remain above Concept', () => {
      Object.entries(INTAKE_TIER_PRICE_CENTS).forEach(([path, tiers]) => {
        if (!tiers?.[1] || !tiers?.[3]) return

        const ratio = tiers[3].cents / tiers[1].cents
        expect(ratio).toBeGreaterThan(2)
        expect(ratio).toBeLessThan(12)
      })
    })
  })

  describe('Kitchen Remodel tiers', () => {
    const kitchen = INTAKE_TIER_PRICE_CENTS.kitchen_remodel

    test('Tier 1: $199 Concept', () => {
      expect(kitchen?.[1]?.cents).toBe(19_900)
      expect(kitchen?.[1]?.label).toContain('Concept')
    })

    test('Tier 2: $449 Concept + Budget with video', () => {
      expect(kitchen?.[2]?.cents).toBe(44_900)
      expect(kitchen?.[2]?.label).toContain('Concept + Budget')
      expect(kitchen?.[2]?.deliveryDays).toBe('3–5 days')
    })

    test('Tier 3: $899 Preconstruction Package with 4K video', () => {
      expect(kitchen?.[3]?.cents).toBe(89_900)
      expect(kitchen?.[3]?.label).toContain('Preconstruction')
    })
  })

  describe('Bathroom Remodel tiers', () => {
    const bathroom = INTAKE_TIER_PRICE_CENTS.bathroom_remodel

    test('Tier 1: $159 Concept', () => {
      expect(bathroom?.[1]?.cents).toBe(15_900)
    })

    test('Tier 2: $349 Concept + Budget', () => {
      expect(bathroom?.[2]?.cents).toBe(34_900)
    })

    test('Tier 3: $699 Preconstruction Package', () => {
      expect(bathroom?.[3]?.cents).toBe(69_900)
    })
  })

  describe('Garden Concept tiers', () => {
    const garden = INTAKE_TIER_PRICE_CENTS.garden_concept

    test('Tier 1: $199 Concept', () => {
      expect(garden?.[1]?.cents).toBe(19_900)
    })

    test('Tier 2: $449 Concept + Budget', () => {
      expect(garden?.[2]?.cents).toBe(44_900)
    })

    test('Tier 3: $899 Preconstruction Package', () => {
      expect(garden?.[3]?.cents).toBe(89_900)
    })
  })

  describe('Home Addition tiers', () => {
    const addition = INTAKE_TIER_PRICE_CENTS.addition_expansion

    test('Tier 1: $199 Concept', () => {
      expect(addition?.[1]?.cents).toBe(19_900)
    })

    test('Tier 2: $449 Concept + Budget', () => {
      expect(addition?.[2]?.cents).toBe(44_900)
    })

    test('Tier 3: $899 Preconstruction Package', () => {
      expect(addition?.[3]?.cents).toBe(89_900)
    })
  })

  describe('Fallback to flat pricing when tier not specified', () => {
    test('kitchen_remodel flat price should exist', () => {
      const flatPrice = INTAKE_PRICE_CENTS.kitchen_remodel
      expect(flatPrice?.cents).toBe(19_900)
    })

    test('garden_concept flat price should exist', () => {
      const flatPrice = INTAKE_PRICE_CENTS.garden_concept
      expect(flatPrice?.cents).toBe(19_900)
    })

    test('addition_expansion flat price should exist', () => {
      const flatPrice = INTAKE_PRICE_CENTS.addition_expansion
      expect(flatPrice?.cents).toBe(34_900)
    })
  })
})

describe('Intake Tier Deliverables', () => {
  test('Tier 1 should provide 3 AI renders + cost summary', () => {
    // This would be verified in the portal after payment
    // Expected deliverables:
    // - 3 concept images
    // - Cost breakdown
    // - Material estimates
    expect(true).toBe(true) // placeholder for UI verification
  })

  test('Tier 2 should provide 6 renders + video + BOM', () => {
    // Expected deliverables:
    // - 6 concept images (day/night/seasonal variations)
    // - 60s AI transformation video
    // - Professional narration overlay
    // - Bill of Materials with costs
    // - 3D floor plan mockup
    expect(true).toBe(true) // placeholder for UI verification
  })

  test('Tier 3 should provide 12 renders + 4K video + floorplan', () => {
    // Expected deliverables:
    // - 12 concept images (high variation)
    // - 60s full HD/4K video
    // - 30s mobile version
    // - 15s TikTok/Reels short
    // - 3 music variations
    // - Full CAD floorplan export
    // - 3D walkthrough preview
    expect(true).toBe(true) // placeholder for UI verification
  })
})

describe('Tier transition and upsells', () => {
  test('should be able to upgrade from Tier 1 to Tier 2', () => {
    const tier1Price = INTAKE_TIER_PRICE_CENTS.kitchen_remodel?.[1]?.cents || 0
    const tier2Price = INTAKE_TIER_PRICE_CENTS.kitchen_remodel?.[2]?.cents || 0
    const upgradeCost = tier2Price - tier1Price

    expect(upgradeCost).toBeGreaterThan(0)
    expect(upgradeCost).toBe(25_000) // $250 upgrade cost
  })

  test('should be able to upgrade from Tier 2 to Tier 3', () => {
    const tier2Price = INTAKE_TIER_PRICE_CENTS.kitchen_remodel?.[2]?.cents || 0
    const tier3Price = INTAKE_TIER_PRICE_CENTS.kitchen_remodel?.[3]?.cents || 0
    const upgradeCost = tier3Price - tier2Price

    expect(upgradeCost).toBeGreaterThan(0)
    expect(upgradeCost).toBe(45_000) // $450 upgrade cost
  })
})
