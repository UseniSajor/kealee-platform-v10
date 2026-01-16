import { describe, it, expect } from 'vitest'
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
} from '../errors/app.error'

describe('Error Handling', () => {
  describe('Custom Error Classes', () => {
    it('should create AppError with default status code', () => {
      const error = new AppError('Test error')
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(500)
      expect(error.code).toBeUndefined()
    })

    it('should create AppError with custom status code and code', () => {
      const error = new AppError('Test error', 400, 'CUSTOM_ERROR')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('CUSTOM_ERROR')
    })

    it('should create ValidationError', () => {
      const error = new ValidationError('Validation failed', { field: 'email' })
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.details).toEqual({ field: 'email' })
    })

    it('should create AuthenticationError', () => {
      const error = new AuthenticationError()
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('AUTHENTICATION_ERROR')
      expect(error.message).toBe('Authentication required')
    })

    it('should create AuthorizationError', () => {
      const error = new AuthorizationError('Custom message')
      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('AUTHORIZATION_ERROR')
      expect(error.message).toBe('Custom message')
    })

    it('should create NotFoundError with resource and id', () => {
      const error = new NotFoundError('User', 'user-123')
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
      expect(error.message).toBe('User with id user-123 not found')
    })

    it('should create NotFoundError with resource only', () => {
      const error = new NotFoundError('Organization')
      expect(error.statusCode).toBe(404)
      expect(error.message).toBe('Organization not found')
    })

    it('should create ConflictError', () => {
      const error = new ConflictError('Resource already exists')
      expect(error.statusCode).toBe(409)
      expect(error.code).toBe('CONFLICT')
    })

    it('should create RateLimitError', () => {
      const error = new RateLimitError()
      expect(error.statusCode).toBe(429)
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED')
    })
  })
})
