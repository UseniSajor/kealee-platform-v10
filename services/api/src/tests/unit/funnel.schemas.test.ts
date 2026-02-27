import { describe, it, expect } from 'vitest'
import { createSessionSchema, updateSessionSchema, sessionIdParam } from '../../modules/funnel/funnel.schemas'

describe('Funnel Schemas', () => {
  describe('createSessionSchema', () => {
    it('should accept empty body', () => {
      const result = createSessionSchema.parse({})
      expect(result).toBeDefined()
    })

    it('should accept UTM params', () => {
      const result = createSessionSchema.parse({
        utmParams: {
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'spring',
        },
      })
      expect(result.utmParams?.utm_source).toBe('google')
    })

    it('should accept partial UTM params', () => {
      const result = createSessionSchema.parse({
        utmParams: { utm_source: 'google' },
      })
      expect(result.utmParams?.utm_source).toBe('google')
      expect(result.utmParams?.utm_medium).toBeUndefined()
    })
  })

  describe('updateSessionSchema', () => {
    it('should accept valid user type', () => {
      const result = updateSessionSchema.parse({ userType: 'HOMEOWNER' })
      expect(result.userType).toBe('HOMEOWNER')
    })

    it('should reject invalid user type', () => {
      expect(() => updateSessionSchema.parse({ userType: 'INVALID' })).toThrow()
    })

    it('should accept valid project type', () => {
      const result = updateSessionSchema.parse({ projectType: 'KITCHEN_REMODEL' })
      expect(result.projectType).toBe('KITCHEN_REMODEL')
    })

    it('should accept valid budget range', () => {
      const result = updateSessionSchema.parse({ budget: 'RANGE_50K_100K' })
      expect(result.budget).toBe('RANGE_50K_100K')
    })

    it('should accept valid timeline', () => {
      const result = updateSessionSchema.parse({ timeline: 'ASAP' })
      expect(result.timeline).toBe('ASAP')
    })

    it('should accept step update', () => {
      const result = updateSessionSchema.parse({ currentStep: 3 })
      expect(result.currentStep).toBe(3)
    })

    it('should reject step out of range', () => {
      expect(() => updateSessionSchema.parse({ currentStep: 5 })).toThrow()
      expect(() => updateSessionSchema.parse({ currentStep: -1 })).toThrow()
    })

    it('should accept city/state', () => {
      const result = updateSessionSchema.parse({ city: 'Bethesda', state: 'MD' })
      expect(result.city).toBe('Bethesda')
      expect(result.state).toBe('MD')
    })

    it('should reject state longer than 2 chars', () => {
      expect(() => updateSessionSchema.parse({ state: 'Maryland' })).toThrow()
    })

    it('should accept empty update', () => {
      const result = updateSessionSchema.parse({})
      expect(result).toBeDefined()
    })
  })

  describe('sessionIdParam', () => {
    it('should accept valid UUID', () => {
      const result = sessionIdParam.parse({ sessionId: '550e8400-e29b-41d4-a716-446655440000' })
      expect(result.sessionId).toBe('550e8400-e29b-41d4-a716-446655440000')
    })

    it('should reject non-UUID', () => {
      expect(() => sessionIdParam.parse({ sessionId: 'not-a-uuid' })).toThrow()
    })

    it('should reject empty string', () => {
      expect(() => sessionIdParam.parse({ sessionId: '' })).toThrow()
    })
  })
})
