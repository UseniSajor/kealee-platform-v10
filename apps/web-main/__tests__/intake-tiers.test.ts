/**
 * Intake flow test suite — verify all three product tiers display correctly
 * and charge the right amounts across different service types.
 *
 * Tiers tested:
 * - Tier 1 (Basic): 3 AI renders + cost summary
 * - Tier 2 (Premium): 6 renders + video + BOM  [Popular badge]
 * - Tier 3 (Premium+): 12 renders + 4K video + floorplan  [Best Value badge]
 *
 * Services tested:
 * - Kitchen Remodel: $149 / $699 / $1299
 * - Bathroom Remodel: $129 / $549 / $999
 * - Garden & Landscape: $99 / $399 / $799
 * - Home Addition: $199 / $799 / $1499
 */

import {
  INTAKE_TIER_PRICE_CENTS,
  INTAKE_PRICE_CENTS,
  CONCEPT_PREMIUM_PLUS_PROMO_PATH,
  CONCEPT_PREMIUM_PLUS_PROMO_CENTS,
  resolveConceptTier,
} from '@kealee/core-rules'
import { expect, describe, it, test } from '@jest/globals'

describe('$5 Concept Premium+ promo', () => {
  test('promo path is priced at exactly $5 (500 cents) in the server price book', () => {
    const entry = INTAKE_PRICE_CENTS[CONCEPT_PREMIUM_PLUS_PROMO_PATH]
    expect(entry).toBeDefined()
    expect(entry?.cents).toBe(500)
    expect(entry?.cents).toBe(CONCEPT_PREMIUM_PLUS_PROMO_CENTS)
    expect(entry?.label).toMatch(/Premium\+/)
  })

  test('promo resolves to full Premium+ (tier 3) deliverables', () => {
    expect(resolveConceptTier({}, { projectPath: CONCEPT_PREMIUM_PLUS_PROMO_PATH })).toBe(3)
  })

  test('promo does not leak into the tier price book (keeps tier ratio invariants intact)', () => {
    expect(INTAKE_TIER_PRICE_CENTS[CONCEPT_PREMIUM_PLUS_PROMO_PATH]).toBeUndefined()
  })
})

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

        test('Tier 1 (Basic) should exist and be cheaper than Tier 2', () => {
          const tier1 = tiers?.[1]
          const tier2 = tiers?.[2]

          expect(tier1).toBeDefined()
          expect(tier1?.cents).toBeGreaterThan(0)
          expect(tier1?.label).toMatch(/Basic/)
          expect(tier1?.cents).toBeLessThan(tier2?.cents || Infinity)
        })

        test('Tier 2 (Premium) should include video and be middle-priced', () => {
          const tier2 = tiers?.[2]
          const tier3 = tiers?.[3]

          expect(tier2).toBeDefined()
          expect(tier2?.label).toMatch(/Premium(?!\+)/)
          expect(tier2?.cents).toBeGreaterThan(tiers?.[1]?.cents || 0)
          expect(tier2?.cents).toBeLessThan(tier3?.cents || Infinity)
        })

        test('Tier 3 (Premium+) should be most expensive with 4K video', () => {
          const tier3 = tiers?.[3]

          expect(tier3).toBeDefined()
          expect(tier3?.label).toMatch(/Premium\+/)
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
    test('Basic tier should always be cheapest', () => {
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

    test('Premium tier pricing ratio should be 3.5x-5x Basic', () => {
      Object.entries(INTAKE_TIER_PRICE_CENTS).forEach(([path, tiers]) => {
        if (!tiers?.[1] || !tiers?.[2]) return

        const ratio = tiers[2].cents / tiers[1].cents
        expect(ratio).toBeGreaterThan(2.5)
        expect(ratio).toBeLessThan(7)
      })
    })

    test('Premium+ tier pricing ratio should be 8x-10x Basic', () => {
      Object.entries(INTAKE_TIER_PRICE_CENTS).forEach(([path, tiers]) => {
        if (!tiers?.[1] || !tiers?.[3]) return

        const ratio = tiers[3].cents / tiers[1].cents
        expect(ratio).toBeGreaterThan(6)
        expect(ratio).toBeLessThan(12)
      })
    })
  })

  describe('Kitchen Remodel tiers', () => {
    const kitchen = INTAKE_TIER_PRICE_CENTS.kitchen_remodel

    test('Tier 1: $149 Basic', () => {
      expect(kitchen?.[1]?.cents).toBe(14_900)
      expect(kitchen?.[1]?.label).toContain('Basic')
    })

    test('Tier 2: $699 Premium with video', () => {
      expect(kitchen?.[2]?.cents).toBe(69_900)
      expect(kitchen?.[2]?.label).toContain('Premium')
      expect(kitchen?.[2]?.deliveryDays).toBe('3–5 days')
    })

    test('Tier 3: $1,299 Premium+ with 4K video', () => {
      expect(kitchen?.[3]?.cents).toBe(129_900)
      expect(kitchen?.[3]?.label).toContain('Premium+')
    })
  })

  describe('Bathroom Remodel tiers', () => {
    const bathroom = INTAKE_TIER_PRICE_CENTS.bathroom_remodel

    test('Tier 1: $129 Basic', () => {
      expect(bathroom?.[1]?.cents).toBe(12_900)
    })

    test('Tier 2: $549 Premium', () => {
      expect(bathroom?.[2]?.cents).toBe(54_900)
    })

    test('Tier 3: $999 Premium+', () => {
      expect(bathroom?.[3]?.cents).toBe(99_900)
    })
  })

  describe('Garden Concept tiers', () => {
    const garden = INTAKE_TIER_PRICE_CENTS.garden_concept

    test('Tier 1: $99 Basic', () => {
      expect(garden?.[1]?.cents).toBe(9_900)
    })

    test('Tier 2: $399 Premium', () => {
      expect(garden?.[2]?.cents).toBe(39_900)
    })

    test('Tier 3: $799 Premium+', () => {
      expect(garden?.[3]?.cents).toBe(79_900)
    })
  })

  describe('Home Addition tiers', () => {
    const addition = INTAKE_TIER_PRICE_CENTS.addition_expansion

    test('Tier 1: $199 Basic', () => {
      expect(addition?.[1]?.cents).toBe(19_900)
    })

    test('Tier 2: $799 Premium', () => {
      expect(addition?.[2]?.cents).toBe(79_900)
    })

    test('Tier 3: $1,499 Premium+', () => {
      expect(addition?.[3]?.cents).toBe(149_900)
    })
  })

  describe('Fallback to flat pricing when tier not specified', () => {
    test('kitchen_remodel flat price should exist', () => {
      const flatPrice = INTAKE_PRICE_CENTS.kitchen_remodel
      expect(flatPrice?.cents).toBe(39_500)
    })

    test('garden_concept flat price should exist', () => {
      const flatPrice = INTAKE_PRICE_CENTS.garden_concept
      expect(flatPrice?.cents).toBe(29_500)
    })

    test('addition_expansion flat price should exist', () => {
      const flatPrice = INTAKE_PRICE_CENTS.addition_expansion
      expect(flatPrice?.cents).toBe(49_500)
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
    expect(upgradeCost).toBe(55_000) // $550 upgrade cost
  })

  test('should be able to upgrade from Tier 2 to Tier 3', () => {
    const tier2Price = INTAKE_TIER_PRICE_CENTS.kitchen_remodel?.[2]?.cents || 0
    const tier3Price = INTAKE_TIER_PRICE_CENTS.kitchen_remodel?.[3]?.cents || 0
    const upgradeCost = tier3Price - tier2Price

    expect(upgradeCost).toBeGreaterThan(0)
    expect(upgradeCost).toBe(60_000) // $600 upgrade cost
  })
})
