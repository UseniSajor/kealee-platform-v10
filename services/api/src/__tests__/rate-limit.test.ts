import { describe, it, expect } from 'vitest'
import { RATE_LIMIT_CONFIG } from '../middleware/rate-limit.middleware'
import { RateLimitError } from '../errors/app.error'

describe('Rate Limiting', () => {
  describe('Rate Limit Configuration', () => {
    it('should have per-user rate limit config', () => {
      expect(RATE_LIMIT_CONFIG.perUser).toBeDefined()
      expect(RATE_LIMIT_CONFIG.perUser.max).toBe(100)
      expect(RATE_LIMIT_CONFIG.perUser.timeWindow).toBe('1 minute')
    })

    it('should have per-org rate limit config', () => {
      expect(RATE_LIMIT_CONFIG.perOrg).toBeDefined()
      expect(RATE_LIMIT_CONFIG.perOrg.max).toBe(500)
      expect(RATE_LIMIT_CONFIG.perOrg.timeWindow).toBe('1 minute')
    })

    it('should have global rate limit config', () => {
      expect(RATE_LIMIT_CONFIG.global).toBeDefined()
      expect(RATE_LIMIT_CONFIG.global.max).toBe(50)
      expect(RATE_LIMIT_CONFIG.global.timeWindow).toBe('1 minute')
    })
  })

  describe('RateLimitError', () => {
    it('should create rate limit error', () => {
      const error = new RateLimitError('Custom message')
      expect(error.statusCode).toBe(429)
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(error.message).toBe('Custom message')
    })

    it('should create rate limit error with default message', () => {
      const error = new RateLimitError()
      expect(error.statusCode).toBe(429)
      expect(error.message).toBe('Rate limit exceeded')
    })
  })
})
