import { describe, it, expect } from 'vitest'
import {
  productAssignmentService,
  routePropertyToProducts,
  buildRoutingContext,
  AUTO_ASSIGN_MIN_PRODUCT_SCORE,
  PRODUCT_ASSIGNMENT_CATALOG,
} from '../index.js'
import type { ProductScores } from '../schemas/shared.js'

function scoresFor(product: keyof ProductScores, value: number): ProductScores {
  const base = {
    designConceptScore: 40,
    estimateDetailedScore: 40,
    permitPackageScore: 40,
    contractorMatchScore: 40,
    pmAdvisoryScore: 40,
    aduFeasibilityScore: 40,
    additionFeasibilityScore: 40,
    basementFinishScore: 40,
    kitchenBathScore: 40,
    developerFeasibilityScore: 40,
    financeScore: 40,
    commercialRenovationScore: 40,
    investorServicesScore: 40,
  }
  return { ...base, [product]: value }
}

describe('Property → Product routing rules', () => {
  it('routes large residential lot to ADU feasibility', () => {
    const result = routePropertyToProducts({
      lotSize: 8000,
      propertyType: 'single_family',
      zoning: { code: 'R-1', aduAllowed: true },
    })
    expect(result.primaryProduct).toBe('adu_feasibility')
  })

  it('routes older home with stale permits to kitchen remodel', () => {
    const result = routePropertyToProducts({
      yearBuilt: 1960,
      permitHistory: [{ date: '2010-01-01' }],
      propertyType: 'single_family',
    })
    expect(result.primaryProduct).toBe('kitchen_bath_remodel')
  })

  it('routes plans uploaded to permit package', () => {
    const result = routePropertyToProducts({ hasPlans: true })
    expect(result.primaryProduct).toBe('permit_package')
  })
})

describe('Automatic product assignment', () => {
  it('auto-assigns kitchen remodel at score 95 with no human review', () => {
    const assignment = productAssignmentService.assign({
      propertyTwinId: 'test',
      productScores: scoresFor('kitchenBathScore', 95),
      propertyContext: buildRoutingContext({
        address: '123 Main',
        yearBuilt: 1965,
        propertyType: 'single_family',
      }),
    })
    expect(assignment.assignedProduct).toBe('kitchen_bath_remodel')
    expect(assignment.productScore).toBe(95)
    expect(assignment.campaign).toBe('Kitchen Remodel')
    expect(assignment.landingPageLabel).toBe('Kitchen Remodel Design Concept')
    expect(assignment.offer).toBe('$299 Design Concept')
    expect(assignment.autoAssigned).toBe(true)
    expect(assignment.requiresHumanReview).toBe(false)
  })

  it('auto-assigns ADU at score 96', () => {
    const assignment = productAssignmentService.assign({
      propertyTwinId: 'test',
      productScores: scoresFor('aduFeasibilityScore', 96),
      propertyContext: { lotSize: 9000, zoning: { code: 'R-2' }, propertyType: 'single_family' },
    })
    expect(assignment.assignedProduct).toBe('adu_feasibility')
    expect(assignment.campaign).toBe('ADU')
    expect(assignment.landingPage).toBe('/intake/adu')
    expect(assignment.offer).toBe('$299 Feasibility Package')
    expect(assignment.bot).toBe('DesignLandBot')
    expect(assignment.autoAssigned).toBe(true)
  })

  it('does not auto-assign below threshold', () => {
    const assignment = productAssignmentService.assign({
      propertyTwinId: 'test',
      productScores: scoresFor('kitchenBathScore', 55),
    })
    expect(assignment.autoAssigned).toBe(false)
  })

  it('defines catalog entry for every Kealee product', () => {
    expect(Object.keys(PRODUCT_ASSIGNMENT_CATALOG).length).toBe(14)
  })

  it('uses AUTO_ASSIGN_MIN_PRODUCT_SCORE of 75', () => {
    expect(AUTO_ASSIGN_MIN_PRODUCT_SCORE).toBe(75)
  })
})
