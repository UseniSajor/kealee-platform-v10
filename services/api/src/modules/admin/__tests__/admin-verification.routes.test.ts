/**
 * admin-verification.routes.test.ts
 *
 * Route-level tests for the admin contractor verification endpoints.
 * Mocks: auth middleware, prismaAny, workflowOrchestratorService,
 *        workflowEventService, workflowStageService, workItemService.
 *
 * Tests HTTP layer: auth enforcement, happy paths, validation, and errors.
 *
 * TO RUN: pnpm --filter services/api test -- admin-verification
 */

import Fastify, { FastifyInstance } from 'fastify'
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { adminVerificationRoutes } from '../admin-verification.routes'
import { errorHandler } from '../../../middleware/error-handler.middleware'

// ─── Auth middleware mocks ─────────────────────────────────────────────────────

const MOCK_ADMIN = { id: 'admin-001', name: 'Admin User', role: 'admin' }

vi.mock('../../../middleware/auth.middleware', () => ({
  authenticateUser: vi.fn(async (req: any, _reply: any) => {
    if (req.headers['x-skip-auth'] === 'true') {
      throw Object.assign(new Error('Unauthorized'), { statusCode: 401 })
    }
    req.user = MOCK_ADMIN
  }),
  requireAdmin: vi.fn(async (_req: any, _reply: any) => {
    // passes for all tests unless overridden
  }),
  requireRole: vi.fn(() => vi.fn()),
}))

// ─── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('../../../utils/prisma-helper', () => ({
  prismaAny: {
    marketplaceProfile:   { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    contractorProfile:    { findMany: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn() },
    rotationQueueEntry:   { findFirst: vi.fn(), updateMany: vi.fn() },
    workflowEvent:        { findFirst: vi.fn(), findMany: vi.fn() },
  },
}))

vi.mock('../../../modules/workflow/workflow-orchestrator.service', () => ({
  workflowOrchestratorService: {
    onVerificationApproved: vi.fn().mockResolvedValue(undefined),
    onVerificationRejected: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../../../modules/workflow/workflow-event.service', () => ({
  workflowEventService: {
    emit: vi.fn().mockResolvedValue({ id: 'evt-001' }),
  },
  WorkflowEventService: {
    buildKey: vi.fn().mockReturnValue('idempotency-key'),
  },
}))

vi.mock('../../../modules/workflow/workflow-stage.service', () => ({
  workflowStageService: {
    getTimeline: vi.fn().mockResolvedValue({ stages: [] }),
  },
}))

vi.mock('../../../modules/workflow/work-item.service', () => ({
  workItemService: {
    getOpenItemsForSubject: vi.fn().mockResolvedValue([]),
    createWorkItem:         vi.fn().mockResolvedValue({ id: 'wi-001' }),
    cancelWorkItem:         vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('bullmq',  () => ({ Queue: vi.fn() }))
vi.mock('ioredis', () => ({ default: vi.fn() }))

import { prismaAny }                      from '../../../utils/prisma-helper'
import { workflowOrchestratorService }    from '../../../modules/workflow/workflow-orchestrator.service'
import { workflowEventService }           from '../../../modules/workflow/workflow-event.service'
import { workItemService }                from '../../../modules/workflow/work-item.service'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const PROFILE_ID = 'profile-001'
const USER_ID    = 'user-001'

const MOCK_PROFILE = {
  id:               PROFILE_ID,
  userId:           USER_ID,
  businessName:     'Smith Construction LLC',
  description:      null,
  specialties:      ['General Contracting'],
  serviceArea:      ['Phoenix AZ'],
  professionalType: 'CONTRACTOR',
  verified:         false,
  acceptingLeads:   false,
  createdAt:        new Date('2026-01-01').toISOString(),
  user: { id: USER_ID, name: 'Jane Smith', email: 'jane@smithco.com' },
  queueEntries: [{
    id:               'qe-001',
    eligibility:      'PENDING_VERIFICATION',
    licenseVerified:  false,
    insuranceVerified: false,
  }],
}

const MOCK_CONTRACTOR = {
  id:           'cp-001',
  userId:       USER_ID,
  businessName: 'Smith Construction LLC',
  email:        'jane@smithco.com',
  phone:        '5550001234',
  address:      '123 Main St',
  city:         'Phoenix',
  state:        'AZ',
  zipCode:      '85001',
  licenseNumber: 'ROC-123456',
  insuranceInfo: { carrier: 'State Farm', expiration: null, allLicenses: ['ROC-123456'] },
  isVerified:   false,
  user:         { name: 'Jane Smith', email: 'jane@smithco.com' },
}

const MOCK_QUEUE_ENTRY = {
  id:               'qe-001',
  profileId:        PROFILE_ID,
  eligibility:      'PENDING_VERIFICATION',
  licenseVerified:  false,
  insuranceVerified: false,
}

// ─── App factory ──────────────────────────────────────────────────────────────

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })
  app.setErrorHandler(errorHandler)
  await app.register(adminVerificationRoutes, { prefix: '/admin' })
  await app.ready()
  return app
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /admin/verification/queue', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildApp() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 200 with contractor list', async () => {
    ;(prismaAny.marketplaceProfile.findMany as any).mockResolvedValueOnce([MOCK_PROFILE])
    ;(prismaAny.marketplaceProfile.count   as any).mockResolvedValueOnce(1)
    ;(prismaAny.contractorProfile.findMany as any).mockResolvedValueOnce([MOCK_CONTRACTOR])
    ;(prismaAny.workflowEvent.findMany     as any).mockResolvedValueOnce([])

    const res = await app.inject({ method: 'GET', url: '/admin/verification/queue' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(Array.isArray(body.contractors)).toBe(true)
    expect(body.pagination.total).toBe(1)
    expect(body.counts).toBeDefined()
  })

  it('returns 200 with empty list', async () => {
    ;(prismaAny.marketplaceProfile.findMany as any).mockResolvedValueOnce([])
    ;(prismaAny.marketplaceProfile.count   as any).mockResolvedValueOnce(0)
    ;(prismaAny.contractorProfile.findMany as any).mockResolvedValueOnce([])
    ;(prismaAny.workflowEvent.findMany     as any).mockResolvedValueOnce([])

    const res = await app.inject({ method: 'GET', url: '/admin/verification/queue?status=APPROVED' })
    expect(res.statusCode).toBe(200)
    expect(res.json().contractors).toHaveLength(0)
  })

  it('returns 500 on DB error', async () => {
    ;(prismaAny.marketplaceProfile.findMany as any).mockRejectedValueOnce(new Error('DB down'))
    const res = await app.inject({ method: 'GET', url: '/admin/verification/queue' })
    expect(res.statusCode).toBe(500)
  })
})

describe('GET /admin/verification/:profileId', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildApp() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 200 with full contractor detail', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce({
      ...MOCK_PROFILE,
      user: { id: USER_ID, name: 'Jane Smith', email: 'jane@smithco.com', createdAt: new Date().toISOString() },
    })
    ;(prismaAny.rotationQueueEntry.findFirst  as any).mockResolvedValueOnce(MOCK_QUEUE_ENTRY)
    ;(prismaAny.workflowEvent.findFirst       as any).mockResolvedValueOnce(null)
    ;(prismaAny.contractorProfile.findFirst   as any).mockResolvedValueOnce(MOCK_CONTRACTOR)
    ;(prismaAny.workflowEvent.findMany        as any).mockResolvedValueOnce([])

    const res = await app.inject({ method: 'GET', url: `/admin/verification/${PROFILE_ID}` })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.profileId).toBe(PROFILE_ID)
    expect(body.businessName).toBe('Smith Construction LLC')
    expect(body.verificationStatus).toBe('PENDING')
    expect(Array.isArray(body.eventHistory)).toBe(true)
  })

  it('returns 404 when profile not found', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(null)
    ;(prismaAny.rotationQueueEntry.findFirst  as any).mockResolvedValueOnce(null)
    ;(prismaAny.workflowEvent.findFirst       as any).mockResolvedValueOnce(null)

    const res = await app.inject({ method: 'GET', url: '/admin/verification/nonexistent' })
    expect(res.statusCode).toBe(404)
  })
})

describe('POST /admin/verification/:profileId/approve', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildApp() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 200 and sets APPROVED', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce({ id: PROFILE_ID, userId: USER_ID })
    ;(prismaAny.rotationQueueEntry.updateMany as any).mockResolvedValueOnce({ count: 1 })
    ;(prismaAny.marketplaceProfile.update     as any).mockResolvedValueOnce({})
    ;(prismaAny.contractorProfile.updateMany  as any).mockResolvedValueOnce({ count: 1 })

    const res = await app.inject({
      method:  'POST',
      url:     `/admin/verification/${PROFILE_ID}/approve`,
      headers: { 'content-type': 'application/json' },
      payload: { note: 'Looks good' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().success).toBe(true)
    expect(res.json().verificationStatus).toBe('APPROVED')
    expect(workflowOrchestratorService.onVerificationApproved).toHaveBeenCalled()
    expect(workflowEventService.emit).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'verification.approved' })
    )
  })

  it('returns 200 without note (note is optional)', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce({ id: PROFILE_ID, userId: USER_ID })
    ;(prismaAny.rotationQueueEntry.updateMany as any).mockResolvedValueOnce({ count: 1 })
    ;(prismaAny.marketplaceProfile.update     as any).mockResolvedValueOnce({})
    ;(prismaAny.contractorProfile.updateMany  as any).mockResolvedValueOnce({ count: 1 })

    const res = await app.inject({
      method:  'POST',
      url:     `/admin/verification/${PROFILE_ID}/approve`,
      headers: { 'content-type': 'application/json' },
      payload: {},
    })
    expect(res.statusCode).toBe(200)
  })

  it('returns 404 when profile not found', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(null)
    const res = await app.inject({
      method:  'POST',
      url:     `/admin/verification/nonexistent/approve`,
      headers: { 'content-type': 'application/json' },
      payload: {},
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('POST /admin/verification/:profileId/reject', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildApp() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 200 on valid rejection', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce({ id: PROFILE_ID, userId: USER_ID })
    ;(prismaAny.rotationQueueEntry.updateMany as any).mockResolvedValueOnce({ count: 1 })
    ;(prismaAny.marketplaceProfile.update     as any).mockResolvedValueOnce({})
    ;(prismaAny.contractorProfile.updateMany  as any).mockResolvedValueOnce({ count: 1 })

    const res = await app.inject({
      method:  'POST',
      url:     `/admin/verification/${PROFILE_ID}/reject`,
      headers: { 'content-type': 'application/json' },
      payload: { note: 'License number not found in state registry' },
    })

    expect(res.statusCode).toBe(200)
    expect(workflowOrchestratorService.onVerificationRejected).toHaveBeenCalled()
    expect(workflowEventService.emit).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'verification.rejected' })
    )
  })

  it('returns 400 when note is missing', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     `/admin/verification/${PROFILE_ID}/reject`,
      headers: { 'content-type': 'application/json' },
      payload: {},
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().error).toMatch(/required/i)
  })

  it('accepts final=true for permanent rejection', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce({ id: PROFILE_ID, userId: USER_ID })
    ;(prismaAny.rotationQueueEntry.updateMany as any).mockResolvedValueOnce({ count: 1 })
    ;(prismaAny.marketplaceProfile.update     as any).mockResolvedValueOnce({})
    ;(prismaAny.contractorProfile.updateMany  as any).mockResolvedValueOnce({ count: 1 })

    const res = await app.inject({
      method:  'POST',
      url:     `/admin/verification/${PROFILE_ID}/reject`,
      headers: { 'content-type': 'application/json' },
      payload: { note: 'Fraudulent license', final: true },
    })
    expect(res.statusCode).toBe(200)
    // Verify rotationQueueEntry was updated to INELIGIBLE
    expect(prismaAny.rotationQueueEntry.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ eligibility: 'INELIGIBLE' }),
      })
    )
  })
})

describe('POST /admin/verification/:profileId/request-info', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildApp() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 200 and creates a work item', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce({ id: PROFILE_ID, userId: USER_ID })
    ;(prismaAny.rotationQueueEntry.updateMany as any).mockResolvedValueOnce({ count: 1 })

    const res = await app.inject({
      method:  'POST',
      url:     `/admin/verification/${PROFILE_ID}/request-info`,
      headers: { 'content-type': 'application/json' },
      payload: { note: 'Please upload a copy of your current insurance certificate' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().verificationStatus).toBe('NEEDS_INFO')
    expect(workItemService.createWorkItem).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'VERIFICATION_REVIEW' })
    )
    expect(workflowEventService.emit).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'verification.needs_info' })
    )
  })

  it('returns 400 when note is missing', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     `/admin/verification/${PROFILE_ID}/request-info`,
      headers: { 'content-type': 'application/json' },
      payload: {},
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('POST /admin/verification/:profileId/suspend', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildApp() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 200 and suspends contractor', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce({ id: PROFILE_ID, userId: USER_ID })
    ;(prismaAny.rotationQueueEntry.updateMany as any).mockResolvedValueOnce({ count: 1 })
    ;(prismaAny.marketplaceProfile.update     as any).mockResolvedValueOnce({})
    ;(prismaAny.contractorProfile.updateMany  as any).mockResolvedValueOnce({ count: 1 })

    const res = await app.inject({
      method:  'POST',
      url:     `/admin/verification/${PROFILE_ID}/suspend`,
      headers: { 'content-type': 'application/json' },
      payload: { note: 'Multiple customer complaints' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().verificationStatus).toBe('SUSPENDED')
    expect(prismaAny.rotationQueueEntry.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { eligibility: 'SUSPENDED' } })
    )
    expect(workflowEventService.emit).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'verification.suspended' })
    )
  })

  it('unsuspends when revert=true', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce({ id: PROFILE_ID, userId: USER_ID })
    ;(prismaAny.rotationQueueEntry.updateMany as any).mockResolvedValueOnce({ count: 1 })
    ;(prismaAny.marketplaceProfile.update     as any).mockResolvedValueOnce({})
    ;(prismaAny.contractorProfile.updateMany  as any).mockResolvedValueOnce({ count: 1 })

    const res = await app.inject({
      method:  'POST',
      url:     `/admin/verification/${PROFILE_ID}/suspend`,
      headers: { 'content-type': 'application/json' },
      payload: { note: 'Issue resolved', revert: true },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().verificationStatus).toBe('PENDING')
    expect(workflowEventService.emit).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'verification.unsuspended' })
    )
  })

  it('returns 400 when note is missing', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     `/admin/verification/${PROFILE_ID}/suspend`,
      headers: { 'content-type': 'application/json' },
      payload: {},
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 404 when profile not found', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(null)
    const res = await app.inject({
      method:  'POST',
      url:     `/admin/verification/nonexistent/suspend`,
      headers: { 'content-type': 'application/json' },
      payload: { note: 'Fraud detected' },
    })
    expect(res.statusCode).toBe(404)
  })
})
