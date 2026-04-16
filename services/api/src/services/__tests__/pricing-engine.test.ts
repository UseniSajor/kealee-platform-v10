/**
 * Pricing Engine Tests
 * Validates 2023 CTC base costs + 13% inflation
 * Tests dynamic pricing adjustments
 */

import { describe, it, expect } from 'vitest'
import { pricingEngine } from '../pricing-engine.service'

describe('Pricing Engine Service', () => {
  describe('Concept Service Pricing', () => {
    it('should return correct base prices for concept tiers', () => {
      const basic = pricingEngine.calculateFinalPrice({
        serviceType: 'concept',
        tier: 'concept_basic',
      })
      expect(basic.basePrice).toBeGreaterThan(330) // $295 * 1.13 = ~$333
      expect(basic.basePrice).toBeLessThan(350)

      const advanced = pricingEngine.calculateFinalPrice({
        serviceType: 'concept',
        tier: 'concept_advanced',
      })
      expect(advanced.basePrice).toBeGreaterThan(780) // $695 * 1.13 = ~$786
      expect(advanced.basePrice).toBeLessThan(800)

      const full = pricingEngine.calculateFinalPrice({
        serviceType: 'concept',
        tier: 'concept_full',
      })
      expect(full.basePrice).toBeGreaterThan(1680) // $1495 * 1.13 = ~$1690
      expect(full.basePrice).toBeLessThan(1710)
    })

    it('should apply jurisdiction multiplier correctly', () => {
      const dcPrice = pricingEngine.calculateFinalPrice({
        serviceType: 'concept',
        tier: 'concept_advanced',
        jurisdiction: 'Washington, DC',
      })
      const defaultPrice = pricingEngine.calculateFinalPrice({
        serviceType: 'concept',
        tier: 'concept_advanced',
      })
      expect(dcPrice.finalPrice).toBeGreaterThan(defaultPrice.finalPrice)
      expect(dcPrice.adjustments.length).toBeGreaterThan(0)
    })
  })

  describe('Estimation Service Pricing', () => {
    it('should return correct base prices for estimation tiers', () => {
      const detailed = pricingEngine.calculateFinalPrice({
        serviceType: 'estimation',
        tier: 'detailed_estimate',
      })
      expect(detailed.basePrice).toBeGreaterThan(670) // $595 * 1.13
      expect(detailed.basePrice).toBeLessThan(680)
    })

    it('should apply complexity adjustment', () => {
      const lowComplexity = pricingEngine.calculateFinalPrice({
        serviceType: 'estimation',
        tier: 'detailed_estimate',
        complexityScore: 20,
      })
      const highComplexity = pricingEngine.calculateFinalPrice({
        serviceType: 'estimation',
        tier: 'detailed_estimate',
        complexityScore: 85,
      })
      expect(highComplexity.finalPrice).toBeGreaterThan(lowComplexity.finalPrice)
    })

    it('should apply zoning risk adjustment', () => {
      const lowRisk = pricingEngine.calculateFinalPrice({
        serviceType: 'estimation',
        tier: 'detailed_estimate',
        zoningRisk: 'LOW',
      })
      const highRisk = pricingEngine.calculateFinalPrice({
        serviceType: 'estimation',
        tier: 'detailed_estimate',
        zoningRisk: 'HIGH',
      })
      expect(highRisk.finalPrice).toBeGreaterThan(lowRisk.finalPrice)
    })
  })

  describe('Permits Service Pricing', () => {
    it('should return correct base prices for permit tiers', () => {
      const docAssembly = pricingEngine.calculateFinalPrice({
        serviceType: 'permits',
        tier: 'document_assembly',
      })
      expect(docAssembly.basePrice).toBeGreaterThan(550) // $495 * 1.13
      expect(docAssembly.basePrice).toBeLessThan(565)
    })

    it('should apply submission method multiplier', () => {
      const self = pricingEngine.calculateFinalPrice({
        serviceType: 'permits',
        tier: 'submission',
        submissionMethod: 'SELF',
      })
      const managed = pricingEngine.calculateFinalPrice({
        serviceType: 'permits',
        tier: 'submission',
        submissionMethod: 'KEALEE_MANAGED',
      })
      expect(managed.finalPrice).toBeGreaterThan(self.finalPrice)
    })

    it('should apply valuation-based adjustment', () => {
      const small = pricingEngine.calculateFinalPrice({
        serviceType: 'permits',
        tier: 'submission',
        estimatedValuation: 30000,
      })
      const large = pricingEngine.calculateFinalPrice({
        serviceType: 'permits',
        tier: 'submission',
        estimatedValuation: 750000,
      })
      expect(large.finalPrice).toBeGreaterThan(small.finalPrice)
    })
  })

  describe('Landing Page Pricing', () => {
    it('should return starting prices for concept', () => {
      const pricing = pricingEngine.getServiceStartingPrices('concept')
      expect(pricing.serviceType).toBe('concept')
      expect(pricing.startingPrice).toBeGreaterThan(0)
      expect(pricing.startingPriceCopy).toContain('Starting at')
    })

    it('should return starting prices for estimation', () => {
      const pricing = pricingEngine.getServiceStartingPrices('estimation')
      expect(pricing.serviceType).toBe('estimation')
      expect(pricing.startingPrice).toBeGreaterThan(0)
    })

    it('should return starting prices for permits', () => {
      const pricing = pricingEngine.getServiceStartingPrices('permits')
      expect(pricing.serviceType).toBe('permits')
      expect(pricing.startingPrice).toBeGreaterThan(0)
    })
  })

  describe('Pricing Adjustments', () => {
    it('should include explanation for all adjustments', () => {
      const pricing = pricingEngine.calculateFinalPrice({
        serviceType: 'permits',
        tier: 'submission',
        jurisdiction: 'Arlington, VA',
        complexityScore: 75,
        zoningRisk: 'HIGH',
        submissionMethod: 'KEALEE_MANAGED',
        estimatedValuation: 500000,
      })
      expect(pricing.pricingExplanation).toBeTruthy()
      expect(pricing.checkoutDisplayLabel).toBeTruthy()
      expect(pricing.adjustments.length).toBeGreaterThan(0)
    })

    it('should calculate final price correctly', () => {
      const pricing = pricingEngine.calculateFinalPrice({
        serviceType: 'permits',
        tier: 'submission',
      })
      let expectedPrice = pricing.basePrice
      for (const adjustment of pricing.adjustments) {
        expectedPrice += adjustment.amount
      }
      // Account for rounding
      expect(Math.abs(pricing.finalPrice - expectedPrice)).toBeLessThan(0.01)
    })
  })

  describe('Inflation Verification', () => {
    it('should apply 13% inflation to 2023 CTC', () => {
      // Base concept basic: $295 * 1.13 = $333.35
      const inflated = 295 * 1.13
      const pricing = pricingEngine.calculateFinalPrice({
        serviceType: 'concept',
        tier: 'concept_basic',
      })
      expect(Math.abs(pricing.basePrice - inflated)).toBeLessThan(0.01)
    })
  })
})
