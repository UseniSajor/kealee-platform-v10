import { describe, expect, it } from 'vitest'
import {
  HOME_UPGRADE_BY_SLUG,
  HOME_UPGRADE_PRODUCTS,
  calculateUpgradePlanningRange,
  formatUpgradeRange,
} from '../home-upgrades'

describe('home upgrades catalog', () => {
  it('has unique, indexed product slugs with valid planning ranges', () => {
    const slugs = HOME_UPGRADE_PRODUCTS.map(product => product.slug)

    expect(new Set(slugs).size).toBe(slugs.length)
    for (const product of HOME_UPGRADE_PRODUCTS) {
      expect(HOME_UPGRADE_BY_SLUG[product.slug]).toBe(product)
      expect(product.planningRange.minCents).toBeGreaterThan(0)
      expect(product.planningRange.maxCents).toBeGreaterThan(product.planningRange.minCents)
      expect(product.typicalWeeks.max).toBeGreaterThanOrEqual(product.typicalWeeks.min)
      expect(product.scopeBands.map(scope => scope.id)).toEqual(['focused', 'transformative', 'major'])
    }
  })

  it('calculates the selected scope and options from canonical values', () => {
    const product = HOME_UPGRADE_BY_SLUG['outdoor-living']
    const result = calculateUpgradePlanningRange(product, 'focused', ['pergola', 'outdoor-kitchen'])

    expect(result).toEqual({
      minCents: 3_996_000,
      maxCents: 22_020_000,
      weeks: { min: 4, max: 27 },
      permitLikelihood: 'likely',
    })
  })

  it('ignores unknown option IDs and falls back to the transformative scope', () => {
    const product = HOME_UPGRADE_BY_SLUG['bathroom-comfort-upgrade']
    const result = calculateUpgradePlanningRange(product, 'not-a-scope' as 'focused', ['not-an-option'])

    expect(result.minCents).toBe(product.planningRange.minCents)
    expect(result.maxCents).toBe(product.planningRange.maxCents)
    expect(result.weeks).toEqual(product.typicalWeeks)
  })

  it('raises an unlikely permit assessment to possible when an option needs review', () => {
    const product = HOME_UPGRADE_BY_SLUG['custom-storage-organization']

    expect(calculateUpgradePlanningRange(product, 'transformative', []).permitLikelihood).toBe('unlikely')
    expect(calculateUpgradePlanningRange(product, 'transformative', ['lighting']).permitLikelihood).toBe('possible')
  })

  it('formats whole-dollar planning ranges', () => {
    expect(formatUpgradeRange({ minCents: 1_250_000, maxCents: 7_500_000 })).toBe('$12,500–$75,000')
  })
})
