import { describe, it, expect } from 'vitest'
import { configureLogger } from '../middleware/logging.middleware'

describe('Logging', () => {
  describe('Logger Configuration', () => {
    it('should configure logger with default settings', () => {
      const config = configureLogger()
      expect(config.level).toBe('info')
    })

    it('should configure logger with custom log level', () => {
      process.env.LOG_LEVEL = 'debug'
      const config = configureLogger()
      expect(config.level).toBe('debug')
      delete process.env.LOG_LEVEL
    })

    it('should configure pretty logging in development', () => {
      process.env.NODE_ENV = 'development'
      const config = configureLogger()
      expect(config.transport).toBeDefined()
      expect(config.transport?.target).toBe('pino-pretty')
      delete process.env.NODE_ENV
    })

    it('should not use pretty logging in production', () => {
      process.env.NODE_ENV = 'production'
      const config = configureLogger()
      expect(config.transport).toBeUndefined()
      delete process.env.NODE_ENV
    })

    it('should have request serializer', () => {
      const config = configureLogger()
      expect(config.serializers).toBeDefined()
      expect(config.serializers.req).toBeDefined()
      expect(config.serializers.res).toBeDefined()
      expect(config.serializers.err).toBeDefined()
    })
  })
})
