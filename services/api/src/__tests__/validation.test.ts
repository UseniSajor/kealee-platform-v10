import { describe, it, expect } from 'vitest'
import { signupSchema, loginSchema, createOrgSchema, updateUserSchema } from '../schemas'

describe('Request Validation', () => {
  describe('Auth Schemas', () => {
    it('should validate signup request', () => {
      const valid = signupSchema.parse({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      })
      expect(valid.email).toBe('test@example.com')
      expect(valid.password).toBe('password123')
      expect(valid.name).toBe('Test User')
    })

    it('should reject invalid email in signup', () => {
      expect(() => {
        signupSchema.parse({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
        })
      }).toThrow()
    })

    it('should reject short password in signup', () => {
      expect(() => {
        signupSchema.parse({
          email: 'test@example.com',
          password: 'short',
          name: 'Test User',
        })
      }).toThrow()
    })

    it('should validate login request', () => {
      const valid = loginSchema.parse({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(valid.email).toBe('test@example.com')
      expect(valid.password).toBe('password123')
    })

    it('should reject invalid email in login', () => {
      expect(() => {
        loginSchema.parse({
          email: 'invalid-email',
          password: 'password123',
        })
      }).toThrow()
    })
  })

  describe('Org Schemas', () => {
    it('should validate create org request', () => {
      const valid = createOrgSchema.parse({
        name: 'Test Org',
        slug: 'test-org',
        description: 'Test description',
      })
      expect(valid.name).toBe('Test Org')
      expect(valid.slug).toBe('test-org')
    })

    it('should reject invalid slug format', () => {
      expect(() => {
        createOrgSchema.parse({
          name: 'Test Org',
          slug: 'Invalid Slug!',
          description: 'Test',
        })
      }).toThrow()
    })

    it('should reject invalid logo URL', () => {
      expect(() => {
        createOrgSchema.parse({
          name: 'Test Org',
          slug: 'test-org',
          logo: 'not-a-url',
        })
      }).toThrow()
    })
  })

  describe('User Schemas', () => {
    it('should validate update user request', () => {
      const valid = updateUserSchema.parse({
        name: 'Updated Name',
        phone: '123-456-7890',
      })
      expect(valid.name).toBe('Updated Name')
      expect(valid.phone).toBe('123-456-7890')
    })

    it('should reject invalid avatar URL', () => {
      expect(() => {
        updateUserSchema.parse({
          avatar: 'not-a-url',
        })
      }).toThrow()
    })

    it('should allow empty avatar', () => {
      const valid = updateUserSchema.parse({
        avatar: '',
      })
      expect(valid.avatar).toBe('')
    })
  })
})
