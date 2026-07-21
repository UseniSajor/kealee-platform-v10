/**
 * contractor-registration.routes.test.ts
 *
 * Route-level tests for POST /marketplace/contractors/register.
 * Mocks authService + prismaAny + professionalAssignmentService.
 * Tests HTTP layer: validation, success, conflict, and error cases.
 *
 * TO RUN: pnpm --filter services/api test -- contractor-registration
 */

import Fastify, { FastifyInstance } from 'fastify'
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { contractorRegistrationRoutes } from '../contractor-registration.routes'
import { errorHandler } from '../../../middleware/error-handler.middleware'

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('../../auth/auth.service', () => ({
  authService: {
    signup: vi.fn().mockResolvedValue({
      user:    { id: 'user-001', email: 'jane@smithco.com', name: 'Jane Smith' },
      session: { access_token: 'tok_test', refresh_token: 'ref_test' },
    }),
  },
}))

vi.mock('../../../utils/prisma-helper', () => ({
  prismaAny: {
    marketplaceProfile: { create: vi.fn().mockResolvedValue({ id: 'profile-001' }) },
    contractorProfile:  { create: vi.fn().mockResolvedValue({ id: 'cp-001' }) },
  },
}))

vi.mock('../professional-assignment.service', () => ({
  professionalAssignmentService: {
    upsertQueueEntry: vi.fn().mockResolvedValue({ id: 'qe-001', eligibility: 'PENDING_VERIFICATION' }),
  },
}))

vi.mock('bullmq', () => ({ Queue: vi.fn() }))
vi.mock('ioredis',  () => ({ default: vi.fn() }))

import { authService }                      from '../../auth/auth.service'
import { prismaAny }                        from '../../../utils/prisma-helper'
import { professionalAssignmentService }    from '../professional-assignment.service'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VALID_BODY = {
  email:            'jane@smithco.com',
  password:         'Secure1234!',
  firstName:        'Jane',
  lastName:         'Smith',
  companyName:      'Smith Construction LLC',
  phone:            '5550001234',
  address:          '123 Main St',
  city:             'Phoenix',
  state:            'AZ',
  zip:              '85001',
  tradeSpecialties: ['General Contracting'],
  serviceAreas:     ['Phoenix AZ'],
  licenseNumbers:   ['ROC-123456'],
  insuranceCarrier: 'State Farm',
  professionalType: 'CONTRACTOR',
}

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })
  app.setErrorHandler(errorHandler)
  await app.register(contractorRegistrationRoutes, { prefix: '/marketplace' })
  await app.ready()
  return app
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /marketplace/contractors/register', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildApp() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  // ─── A. Happy path ────────────────────────────────────────────────────────

  describe('A — Happy path', () => {
    it('returns 201 with userId, profileId, session, nextStep', async () => {
      ;(authService.signup as any).mockResolvedValueOnce({
        user:    { id: 'user-001', email: 'jane@smithco.com', name: 'Jane Smith' },
        session: { access_token: 'tok_test' },
      })
      ;(prismaAny.marketplaceProfile.create as any).mockResolvedValueOnce({ id: 'profile-001' })
      ;(prismaAny.contractorProfile.create  as any).mockResolvedValueOnce({ id: 'cp-001' })
      ;(professionalAssignmentService.upsertQueueEntry as any).mockResolvedValueOnce({
        id: 'qe-001', eligibility: 'PENDING_VERIFICATION',
      })

      const res = await app.inject({
        method:  'POST',
        url:     '/marketplace/contractors/register',
        headers: { 'content-type': 'application/json' },
        payload: VALID_BODY,
      })

      expect(res.statusCode).toBe(201)
      const body = res.json()
      expect(body.success).toBe(true)
      expect(body.userId).toBe('user-001')
      expect(body.profileId).toBe('profile-001')
      expect(body.nextStep).toBe('pending-verification')
      expect(body.session).toBeDefined()
    })

    it('calls authService.signup with email, password, and full name', async () => {
      ;(prismaAny.marketplaceProfile.create as any).mockResolvedValueOnce({ id: 'profile-001' })
      ;(prismaAny.contractorProfile.create  as any).mockResolvedValueOnce({ id: 'cp-001' })

      await app.inject({
        method: 'POST', url: '/marketplace/contractors/register',
        headers: { 'content-type': 'application/json' },
        payload: VALID_BODY,
      })

      expect(authService.signup).toHaveBeenCalledWith(
        'jane@smithco.com',
        'Secure1234!',
        'Jane Smith',
      )
    })

    it('calls upsertQueueEntry with PENDING (licenseVerified=false, insuranceVerified=false)', async () => {
      ;(prismaAny.marketplaceProfile.create as any).mockResolvedValueOnce({ id: 'profile-001' })
      ;(prismaAny.contractorProfile.create  as any).mockResolvedValueOnce({ id: 'cp-001' })

      await app.inject({
        method: 'POST', url: '/marketplace/contractors/register',
        headers: { 'content-type': 'application/json' },
        payload: VALID_BODY,
      })

      expect(professionalAssignmentService.upsertQueueEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          profileId:        'profile-001',
          professionalType: 'CONTRACTOR',
          licenseVerified:  false,
          insuranceVerified: false,
          softwareAccessOnly: false,
        })
      )
    })

    it('accepts DESIGN_BUILD professionalType', async () => {
      ;(prismaAny.marketplaceProfile.create as any).mockResolvedValueOnce({ id: 'profile-002' })
      ;(prismaAny.contractorProfile.create  as any).mockResolvedValueOnce({ id: 'cp-002' })

      const res = await app.inject({
        method: 'POST', url: '/marketplace/contractors/register',
        headers: { 'content-type': 'application/json' },
        payload: { ...VALID_BODY, professionalType: 'DESIGN_BUILD' },
      })

      expect(res.statusCode).toBe(201)
    })
  })

  // ─── B. Validation errors ─────────────────────────────────────────────────

  describe('B — Validation errors', () => {
    it('returns 400 when email is invalid', async () => {
      const res = await app.inject({
        method: 'POST', url: '/marketplace/contractors/register',
        headers: { 'content-type': 'application/json' },
        payload: { ...VALID_BODY, email: 'not-an-email' },
      })
      expect(res.statusCode).toBe(400)
    })

    it('returns 400 when password is too short', async () => {
      const res = await app.inject({
        method: 'POST', url: '/marketplace/contractors/register',
        headers: { 'content-type': 'application/json' },
        payload: { ...VALID_BODY, password: 'short' },
      })
      expect(res.statusCode).toBe(400)
    })

    it('returns 400 when tradeSpecialties is empty', async () => {
      const res = await app.inject({
        method: 'POST', url: '/marketplace/contractors/register',
        headers: { 'content-type': 'application/json' },
        payload: { ...VALID_BODY, tradeSpecialties: [] },
      })
      expect(res.statusCode).toBe(400)
    })

    it('returns 400 when serviceAreas is empty', async () => {
      const res = await app.inject({
        method: 'POST', url: '/marketplace/contractors/register',
        headers: { 'content-type': 'application/json' },
        payload: { ...VALID_BODY, serviceAreas: [] },
      })
      expect(res.statusCode).toBe(400)
    })

    it('returns 400 when state is not 2 characters', async () => {
      const res = await app.inject({
        method: 'POST', url: '/marketplace/contractors/register',
        headers: { 'content-type': 'application/json' },
        payload: { ...VALID_BODY, state: 'Arizona' },
      })
      expect(res.statusCode).toBe(400)
    })

    it('returns 400 when zip is malformed', async () => {
      const res = await app.inject({
        method: 'POST', url: '/marketplace/contractors/register',
        headers: { 'content-type': 'application/json' },
        payload: { ...VALID_BODY, zip: '123' },
      })
      expect(res.statusCode).toBe(400)
    })

    it('returns 400 when website URL is invalid', async () => {
      const res = await app.inject({
        method: 'POST', url: '/marketplace/contractors/register',
        headers: { 'content-type': 'application/json' },
        payload: { ...VALID_BODY, website: 'not-a-url' },
      })
      expect(res.statusCode).toBe(400)
    })

    it('accepts empty website string (optional)', async () => {
      ;(prismaAny.marketplaceProfile.create as any).mockResolvedValueOnce({ id: 'p1' })
      ;(prismaAny.contractorProfile.create  as any).mockResolvedValueOnce({ id: 'c1' })

      const res = await app.inject({
        method: 'POST', url: '/marketplace/contractors/register',
        headers: { 'content-type': 'application/json' },
        payload: { ...VALID_BODY, website: '' },
      })
      expect(res.statusCode).toBe(201)
    })

    it('returns 400 for missing required fields', async () => {
      const res = await app.inject({
        method: 'POST', url: '/marketplace/contractors/register',
        headers: { 'content-type': 'application/json' },
        payload: { email: 'test@test.com' }, // missing everything else
      })
      expect(res.statusCode).toBe(400)
    })
  })

  // ─── C. Conflict ──────────────────────────────────────────────────────────

  describe('C — Email conflict', () => {
    it('returns 409 when authService.signup throws a uniqueness error', async () => {
      ;(authService.signup as any).mockRejectedValueOnce(
        Object.assign(new Error('User already registered'), { code: '23505' })
      )

      const res = await app.inject({
        method: 'POST', url: '/marketplace/contractors/register',
        headers: { 'content-type': 'application/json' },
        payload: VALID_BODY,
      })

      expect(res.statusCode).toBe(409)
      expect(res.json().error).toMatch(/already exists/)
    })

    it('returns 409 when Supabase says "User already registered"', async () => {
      ;(authService.signup as any).mockRejectedValueOnce(
        new Error('User already registered')
      )

      const res = await app.inject({
        method: 'POST', url: '/marketplace/contractors/register',
        headers: { 'content-type': 'application/json' },
        payload: VALID_BODY,
      })

      expect(res.statusCode).toBe(409)
    })
  })

  // ─── D. Server error ──────────────────────────────────────────────────────

  describe('D — Unexpected error', () => {
    it('returns 400 with safe error message on unexpected DB error', async () => {
      ;(authService.signup as any).mockResolvedValueOnce({
        user: { id: 'user-001' }, session: {},
      })
      ;(prismaAny.marketplaceProfile.create as any).mockRejectedValueOnce(
        new Error('Internal DB error — secret connection string')
      )

      const res = await app.inject({
        method: 'POST', url: '/marketplace/contractors/register',
        headers: { 'content-type': 'application/json' },
        payload: VALID_BODY,
      })

      expect(res.statusCode).toBe(400)
      // Route returns an error string (sanitizeErrorMessage output)
      expect(typeof res.json().error).toBe('string')
    })
  })
})
