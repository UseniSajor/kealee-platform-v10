/**
 * contractor-profile.routes.test.ts
 *
 * Route-level tests for GET + PATCH /marketplace/contractors/profile.
 * Mocks: authenticateUser, prismaAny, workflowEventService.
 *
 * Tests HTTP layer: auth, happy paths, validation, reverification trigger,
 * 404 on missing profile, and DB errors.
 *
 * TO RUN: pnpm --filter services/api test -- contractor-profile
 */

import Fastify, { FastifyInstance } from 'fastify'
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { contractorProfileRoutes } from '../contractor-profile.routes'
import { errorHandler } from '../../../middleware/error-handler.middleware'

// ─── Auth mock ─────────────────────────────────────────────────────────────────

const MOCK_USER = { id: 'user-001', name: 'Jane Smith', role: 'contractor' }

vi.mock('../../../middleware/auth.middleware', () => ({
  authenticateUser: vi.fn(async (req: any, _reply: any) => {
    req.user = MOCK_USER
  }),
  requireAdmin: vi.fn(),
  requireRole:  vi.fn(() => vi.fn()),
}))

// ─── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('../../../utils/prisma-helper', () => ({
  prismaAny: {
    contractorProfile:  {
      findFirst: vi.fn(),
      update:    vi.fn(),
    },
    marketplaceProfile: {
      findFirst: vi.fn(),
      update:    vi.fn(),
    },
    rotationQueueEntry: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
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

vi.mock('bullmq',  () => ({ Queue: vi.fn() }))
vi.mock('ioredis', () => ({ default: vi.fn() }))

import { prismaAny }           from '../../../utils/prisma-helper'
import { workflowEventService } from '../../../modules/workflow/workflow-event.service'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const USER_ID    = 'user-001'
const PROFILE_ID = 'profile-001'
const MP_ID      = 'mp-001'

const MOCK_CONTRACTOR = {
  id:           PROFILE_ID,
  userId:       USER_ID,
  businessName: 'Smith Construction LLC',
  description:  'Top-tier GC',
  email:        'jane@smithco.com',
  phone:        '5550001234',
  address:      '123 Main St',
  city:         'Phoenix',
  state:        'AZ',
  zipCode:      '85001',
  website:      null,
  yearsInBusiness: 12,
  teamSize:     8,
  emergencyServices: false,
  specialties:      ['General Contracting'],
  serviceCategories: [],
  commercialFocus:  false,
  residentialFocus: true,
  preferredProjectSizes: [],
  serviceRadius: null,
  serviceStates: [],
  serviceCities: [],
  licenseNumber: 'ROC-123456',
  insuranceInfo: { carrier: 'State Farm', expiration: null, allLicenses: ['ROC-123456'] },
  isVerified:   false,
  acceptingBids: false,
  rating:        '0.00',
  reviewCount:   0,
  projectsCompleted: 0,
}

const MOCK_MARKETPLACE = {
  id:             MP_ID,
  userId:         USER_ID,
  businessName:   'Smith Construction LLC',
  description:    null,
  specialties:    ['General Contracting'],
  serviceArea:    ['AZ'],
  verified:       false,
  acceptingLeads: false,
  queueEntries: [{
    id:               'qe-001',
    profileId:        MP_ID,
    eligibility:      'PENDING_VERIFICATION',
    licenseVerified:  false,
    insuranceVerified: false,
  }],
}

const VALID_UPDATE_BODY = {
  businessName:          'Smith Construction LLC',
  tradeSpecialties:      ['General Contracting'],
  serviceCategories:     [],
  commercialFocus:       false,
  residentialFocus:      true,
  preferredProjectSizes: [],
  serviceStates:         ['AZ'],
  serviceCities:         ['Phoenix'],
  serviceRadius:         50,
  // Credential values matching MOCK_CONTRACTOR — no change, no reverification
  licenseNumber:         'ROC-123456',
  allLicenses:           ['ROC-123456'],
  insuranceCarrier:      'State Farm',
  insuranceExpiration:   '',
}

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })
  app.setErrorHandler(errorHandler)
  await app.register(contractorProfileRoutes, { prefix: '/marketplace' })
  await app.ready()
  return app
}

// ─── GET /marketplace/contractors/profile ─────────────────────────────────────

describe('GET /marketplace/contractors/profile', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildApp() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 200 with the contractor profile', async () => {
    ;(prismaAny.contractorProfile.findFirst  as any).mockResolvedValueOnce(MOCK_CONTRACTOR)
    ;(prismaAny.marketplaceProfile.findFirst as any).mockResolvedValueOnce(MOCK_MARKETPLACE)

    const res = await app.inject({ method: 'GET', url: '/marketplace/contractors/profile' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.contractorProfileId).toBe(PROFILE_ID)
    expect(body.businessName).toBe('Smith Construction LLC')
    expect(body.verificationStatus).toBe('PENDING')
    expect(body.licenseNumber).toBe('ROC-123456')
    expect(body.insuranceCarrier).toBe('State Farm')
  })

  it('returns correct verificationStatus for ELIGIBLE + isVerified=true', async () => {
    ;(prismaAny.contractorProfile.findFirst  as any).mockResolvedValueOnce({ ...MOCK_CONTRACTOR, isVerified: true })
    ;(prismaAny.marketplaceProfile.findFirst as any).mockResolvedValueOnce({
      ...MOCK_MARKETPLACE,
      queueEntries: [{ ...MOCK_MARKETPLACE.queueEntries[0], eligibility: 'ELIGIBLE' }],
    })

    const res = await app.inject({ method: 'GET', url: '/marketplace/contractors/profile' })
    expect(res.statusCode).toBe(200)
    expect(res.json().verificationStatus).toBe('APPROVED')
  })

  it('returns 404 when contractor has no profile', async () => {
    ;(prismaAny.contractorProfile.findFirst  as any).mockResolvedValueOnce(null)
    ;(prismaAny.marketplaceProfile.findFirst as any).mockResolvedValueOnce(null)

    const res = await app.inject({ method: 'GET', url: '/marketplace/contractors/profile' })
    expect(res.statusCode).toBe(404)
    expect(res.json().error).toMatch(/not found/i)
  })

  it('returns 500 on DB error', async () => {
    ;(prismaAny.contractorProfile.findFirst as any).mockRejectedValueOnce(new Error('DB timeout'))
    const res = await app.inject({ method: 'GET', url: '/marketplace/contractors/profile' })
    expect(res.statusCode).toBe(500)
  })
})

// ─── PATCH /marketplace/contractors/profile ───────────────────────────────────

describe('PATCH /marketplace/contractors/profile', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildApp() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  function setupMocksForUpdate(overrides: { contractor?: any; marketplace?: any } = {}) {
    const updatedContractor = { ...MOCK_CONTRACTOR, ...(overrides.contractor ?? {}) }
    const updatedMarketplace = { ...MOCK_MARKETPLACE, ...(overrides.marketplace ?? {}) }

    ;(prismaAny.contractorProfile.findFirst  as any)
      .mockResolvedValueOnce(MOCK_CONTRACTOR)         // load existing
      .mockResolvedValueOnce(updatedContractor)        // refresh after update
    ;(prismaAny.marketplaceProfile.findFirst as any)
      .mockResolvedValueOnce(MOCK_MARKETPLACE)         // load existing
      .mockResolvedValueOnce(updatedMarketplace)       // refresh after update
    ;(prismaAny.contractorProfile.update    as any).mockResolvedValueOnce(updatedContractor)
    ;(prismaAny.marketplaceProfile.update   as any).mockResolvedValueOnce(updatedMarketplace)
  }

  it('returns 200 with updated profile and no reverification for non-credential changes', async () => {
    setupMocksForUpdate()

    const res = await app.inject({
      method:  'PATCH',
      url:     '/marketplace/contractors/profile',
      headers: { 'content-type': 'application/json' },
      payload: {
        ...VALID_UPDATE_BODY,
        businessName:    'Smith Construction LLC Updated',
        description:     'New description',
        teamSize:        10,
        emergencyServices: true,
      },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.success).toBe(true)
    expect(body.requiresReverification).toBe(false)
    expect(body.message).toMatch(/successfully/i)
    // Reverification workflow NOT triggered
    expect(workflowEventService.emit).not.toHaveBeenCalled()
    expect(prismaAny.rotationQueueEntry.updateMany).not.toHaveBeenCalled()
  })

  it('triggers reverification when licenseNumber changes', async () => {
    setupMocksForUpdate()

    const res = await app.inject({
      method:  'PATCH',
      url:     '/marketplace/contractors/profile',
      headers: { 'content-type': 'application/json' },
      payload: {
        ...VALID_UPDATE_BODY,
        licenseNumber: 'ROC-NEWLICENSE',  // changed from ROC-123456
      },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.requiresReverification).toBe(true)
    expect(body.message).toMatch(/re-verification/i)
    expect(workflowEventService.emit).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'verification.credentials_updated' })
    )
    expect(prismaAny.rotationQueueEntry.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eligibility:    'PENDING_VERIFICATION',
          licenseVerified: false,
        }),
      })
    )
  })

  it('triggers reverification when insuranceCarrier changes', async () => {
    setupMocksForUpdate()

    const res = await app.inject({
      method:  'PATCH',
      url:     '/marketplace/contractors/profile',
      headers: { 'content-type': 'application/json' },
      payload: {
        ...VALID_UPDATE_BODY,
        insuranceCarrier: 'Allstate',  // changed from State Farm
      },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().requiresReverification).toBe(true)
    expect(workflowEventService.emit).toHaveBeenCalled()
  })

  it('does NOT trigger reverification when insurance is unchanged', async () => {
    setupMocksForUpdate()

    const res = await app.inject({
      method:  'PATCH',
      url:     '/marketplace/contractors/profile',
      headers: { 'content-type': 'application/json' },
      payload: {
        ...VALID_UPDATE_BODY,
        insuranceCarrier: 'State Farm',  // same as existing
        allLicenses:      ['ROC-123456'], // same
        licenseNumber:    'ROC-123456',   // same
      },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().requiresReverification).toBe(false)
    expect(workflowEventService.emit).not.toHaveBeenCalled()
  })

  it('returns 400 when tradeSpecialties is empty', async () => {
    const res = await app.inject({
      method:  'PATCH',
      url:     '/marketplace/contractors/profile',
      headers: { 'content-type': 'application/json' },
      payload: { ...VALID_UPDATE_BODY, tradeSpecialties: [] },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().error).toMatch(/specialty/i)
  })

  it('returns 400 when businessName is empty', async () => {
    const res = await app.inject({
      method:  'PATCH',
      url:     '/marketplace/contractors/profile',
      headers: { 'content-type': 'application/json' },
      payload: { ...VALID_UPDATE_BODY, businessName: '' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when website URL is malformed', async () => {
    const res = await app.inject({
      method:  'PATCH',
      url:     '/marketplace/contractors/profile',
      headers: { 'content-type': 'application/json' },
      payload: { ...VALID_UPDATE_BODY, website: 'not-a-url' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('accepts website as empty string (optional)', async () => {
    setupMocksForUpdate()

    const res = await app.inject({
      method:  'PATCH',
      url:     '/marketplace/contractors/profile',
      headers: { 'content-type': 'application/json' },
      payload: { ...VALID_UPDATE_BODY, website: '' },
    })
    expect(res.statusCode).toBe(200)
  })

  it('returns 404 when contractor profile not found', async () => {
    ;(prismaAny.contractorProfile.findFirst  as any).mockResolvedValueOnce(null)
    ;(prismaAny.marketplaceProfile.findFirst as any).mockResolvedValueOnce(null)

    const res = await app.inject({
      method:  'PATCH',
      url:     '/marketplace/contractors/profile',
      headers: { 'content-type': 'application/json' },
      payload: VALID_UPDATE_BODY,
    })
    expect(res.statusCode).toBe(404)
  })

  it('returns 500 on unexpected DB error', async () => {
    ;(prismaAny.contractorProfile.findFirst  as any).mockRejectedValueOnce(new Error('Connection lost'))
    ;(prismaAny.marketplaceProfile.findFirst as any).mockResolvedValueOnce(null)

    const res = await app.inject({
      method:  'PATCH',
      url:     '/marketplace/contractors/profile',
      headers: { 'content-type': 'application/json' },
      payload: VALID_UPDATE_BODY,
    })
    expect(res.statusCode).toBe(500)
    expect(typeof res.json().error).toBe('string')
  })

  it('updates serviceStates and serviceCities correctly', async () => {
    setupMocksForUpdate()

    const res = await app.inject({
      method:  'PATCH',
      url:     '/marketplace/contractors/profile',
      headers: { 'content-type': 'application/json' },
      payload: {
        ...VALID_UPDATE_BODY,
        serviceStates: ['AZ', 'NV', 'CA'],
        serviceCities: ['Phoenix', 'Las Vegas', 'Los Angeles'],
      },
    })

    expect(res.statusCode).toBe(200)
    expect(prismaAny.contractorProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          serviceStates: ['AZ', 'NV', 'CA'],
          serviceCities: ['Phoenix', 'Las Vegas', 'Los Angeles'],
        }),
      })
    )
  })

  it('updates commercial and residential focus flags', async () => {
    setupMocksForUpdate()

    const res = await app.inject({
      method:  'PATCH',
      url:     '/marketplace/contractors/profile',
      headers: { 'content-type': 'application/json' },
      payload: { ...VALID_UPDATE_BODY, commercialFocus: true, residentialFocus: false },
    })

    expect(res.statusCode).toBe(200)
    expect(prismaAny.contractorProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          commercialFocus:  true,
          residentialFocus: false,
        }),
      })
    )
  })
})
