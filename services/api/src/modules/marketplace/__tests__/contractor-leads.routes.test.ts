/**
 * contractor-leads.routes.test.ts
 *
 * Route-level tests for GET /marketplace/contractors/leads.
 * Mocks: authenticateUser, prismaAny.
 *
 * TO RUN: pnpm --filter services/api test -- contractor-leads
 */

import Fastify, { FastifyInstance } from 'fastify'
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { contractorLeadsRoutes } from '../contractor-leads.routes'
import { errorHandler } from '../../../middleware/error-handler.middleware'

// ─── Auth mock ──────────────────────────────────────────────────────────────

const MOCK_USER = { id: 'user-001', name: 'Jane Smith', role: 'contractor' }

vi.mock('../../../middleware/auth.middleware', () => ({
  authenticateUser: vi.fn(async (req: any, _reply: any) => {
    req.user = MOCK_USER
  }),
  requireAdmin: vi.fn(),
  requireRole:  vi.fn(() => vi.fn()),
}))

// ─── Module mocks ────────────────────────────────────────────────────────────

vi.mock('../../../utils/prisma-helper', () => ({
  prismaAny: {
    marketplaceProfile: {
      findUnique: vi.fn(),
      findMany:   vi.fn(),
    },
    professionalAssignment: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('bullmq',  () => ({ Queue: vi.fn() }))
vi.mock('ioredis', () => ({ default: vi.fn() }))

import { prismaAny } from '../../../utils/prisma-helper'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const USER_ID    = 'user-001'
const MP_ID      = 'mp-001'
const LEAD_ID_1  = 'lead-001'
const LEAD_ID_2  = 'lead-002'
const ASSIGN_ID_1 = 'assign-001'
const ASSIGN_ID_2 = 'assign-002'

const NOW = new Date()
const DEADLINE_FUTURE = new Date(NOW.getTime() + 24 * 60 * 60 * 1000)  // +24h
const DEADLINE_PAST   = new Date(NOW.getTime() - 1 * 60 * 60 * 1000)   // -1h

const MOCK_MARKETPLACE = {
  id:     MP_ID,
  userId: USER_ID,
  businessName: 'Smith Construction LLC',
}

const MOCK_PROJECT = {
  id:                   'project-001',
  name:                 'Phoenix Office Build',
  city:                 'Phoenix',
  state:                'AZ',
  constructionReadiness: 'CONSTRUCTION_READY',
}

function makeAssignment(overrides: Partial<{
  id: string
  leadId: string
  status: string
  acceptDeadline: Date
  respondedAt: Date | null
}> = {}) {
  return {
    id:               overrides.id              ?? ASSIGN_ID_1,
    leadId:           overrides.leadId          ?? LEAD_ID_1,
    profileId:        MP_ID,
    professionalType: 'CONTRACTOR',
    sourceType:       'PLATFORM_SERVICE',
    status:           overrides.status          ?? 'PENDING',
    rotationPosition: 0,
    assignedAt:       new Date(NOW.getTime() - 2 * 60 * 60 * 1000),
    acceptDeadline:   overrides.acceptDeadline  ?? DEADLINE_FUTURE,
    respondedAt:      overrides.respondedAt     ?? null,
    forwardedAt:      null,
    declineReason:    null,
    adminOverride:    false,
    adminNote:        null,
    createdAt:        new Date(),
    updatedAt:        new Date(),
    lead: {
      id:             overrides.leadId ?? LEAD_ID_1,
      category:       'General Contracting',
      description:    'Office renovation project',
      location:       '456 Commerce Blvd, Phoenix AZ',
      city:           'Phoenix',
      state:          'AZ',
      projectType:    'office_renovation',
      sqft:           '5000',
      qualityTier:    'mid',
      estimatedValue: '250000',
      budget:         '220000',
      stage:          'OPEN',
      project:        MOCK_PROJECT,
    },
  }
}

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })
  app.setErrorHandler(errorHandler)
  await app.register(contractorLeadsRoutes, { prefix: '/marketplace' })
  await app.ready()
  return app
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GET /marketplace/contractors/leads', () => {
  let app: FastifyInstance

  beforeAll(async () => { app = await buildApp() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 200 with empty state when no marketplace profile exists', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(null)

    const res = await app.inject({ method: 'GET', url: '/marketplace/contractors/leads' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.assignments).toHaveLength(0)
    expect(body.profileExists).toBe(false)
    expect(body.counts.total).toBe(0)
  })

  it('returns 200 with assignments when profile exists', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MARKETPLACE)
    ;(prismaAny.professionalAssignment.findMany as any).mockResolvedValueOnce([makeAssignment()])

    const res = await app.inject({ method: 'GET', url: '/marketplace/contractors/leads' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.profileExists).toBe(true)
    expect(body.assignments).toHaveLength(1)
    expect(body.assignments[0].assignmentId).toBe(ASSIGN_ID_1)
    expect(body.assignments[0].status).toBe('PENDING')
    expect(body.assignments[0].isActive).toBe(true)
  })

  it('includes lead and project details in each assignment', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MARKETPLACE)
    ;(prismaAny.professionalAssignment.findMany as any).mockResolvedValueOnce([makeAssignment()])

    const res = await app.inject({ method: 'GET', url: '/marketplace/contractors/leads' })
    const { assignments } = res.json()

    const a = assignments[0]
    expect(a.category).toBe('General Contracting')
    expect(a.estimatedValue).toBe(250000)
    expect(a.budget).toBe(220000)
    expect(a.sqft).toBe(5000)
    expect(a.projectName).toBe('Phoenix Office Build')
    expect(a.constructionReadiness).toBe('CONSTRUCTION_READY')
  })

  it('marks PENDING assignment with past deadline as isExpired=true', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MARKETPLACE)
    ;(prismaAny.professionalAssignment.findMany as any).mockResolvedValueOnce([
      makeAssignment({ acceptDeadline: DEADLINE_PAST, status: 'PENDING' }),
    ])

    const res = await app.inject({ method: 'GET', url: '/marketplace/contractors/leads' })
    const { assignments } = res.json()

    expect(assignments[0].isExpired).toBe(true)
    expect(assignments[0].isActive).toBe(true) // still "active" (not officially expired yet)
  })

  it('marks EXPIRED assignment as isExpired=true and isActive=false', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MARKETPLACE)
    ;(prismaAny.professionalAssignment.findMany as any).mockResolvedValueOnce([
      makeAssignment({ status: 'EXPIRED' }),
    ])

    const res = await app.inject({ method: 'GET', url: '/marketplace/contractors/leads' })
    const { assignments } = res.json()

    expect(assignments[0].isExpired).toBe(true)
    expect(assignments[0].isActive).toBe(false)
  })

  it('marks ACCEPTED assignment as isActive=true and isExpired=false', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MARKETPLACE)
    ;(prismaAny.professionalAssignment.findMany as any).mockResolvedValueOnce([
      makeAssignment({ status: 'ACCEPTED' }),
    ])

    const res = await app.inject({ method: 'GET', url: '/marketplace/contractors/leads' })
    const { assignments } = res.json()

    expect(assignments[0].isActive).toBe(true)
    expect(assignments[0].isExpired).toBe(false)
  })

  it('returns correct counts for multiple assignments', async () => {
    const assignments = [
      makeAssignment({ id: 'a1', status: 'PENDING' }),
      makeAssignment({ id: 'a2', status: 'ACCEPTED' }),
      makeAssignment({ id: 'a3', status: 'DECLINED' }),
      makeAssignment({ id: 'a4', status: 'EXPIRED' }),
      makeAssignment({ id: 'a5', status: 'FORFEITED' }),
    ]
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MARKETPLACE)
    ;(prismaAny.professionalAssignment.findMany as any).mockResolvedValueOnce(assignments)

    const res = await app.inject({ method: 'GET', url: '/marketplace/contractors/leads' })
    const { counts } = res.json()

    expect(counts.pending).toBe(1)
    expect(counts.accepted).toBe(1)
    expect(counts.active).toBe(2)
    expect(counts.history).toBe(3)
    expect(counts.total).toBe(5)
  })

  it('sorts PENDING before ACCEPTED before history', async () => {
    const assignments = [
      makeAssignment({ id: 'a1', status: 'DECLINED' }),
      makeAssignment({ id: 'a2', status: 'ACCEPTED' }),
      makeAssignment({ id: 'a3', status: 'PENDING' }),
    ]
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MARKETPLACE)
    ;(prismaAny.professionalAssignment.findMany as any).mockResolvedValueOnce(assignments)

    const res = await app.inject({ method: 'GET', url: '/marketplace/contractors/leads' })
    const ids = res.json().assignments.map((a: any) => a.assignmentId)

    expect(ids[0]).toBe('a3') // PENDING first
    expect(ids[1]).toBe('a2') // ACCEPTED second
    expect(ids[2]).toBe('a1') // DECLINED last
  })

  it('sorts multiple PENDING assignments by acceptDeadline ASC', async () => {
    const sooner = new Date(NOW.getTime() + 6  * 60 * 60 * 1000)  // +6h
    const later  = new Date(NOW.getTime() + 30 * 60 * 60 * 1000)  // +30h

    const assignments = [
      makeAssignment({ id: 'a-later',  status: 'PENDING', acceptDeadline: later }),
      makeAssignment({ id: 'a-sooner', status: 'PENDING', acceptDeadline: sooner }),
    ]
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MARKETPLACE)
    ;(prismaAny.professionalAssignment.findMany as any).mockResolvedValueOnce(assignments)

    const res = await app.inject({ method: 'GET', url: '/marketplace/contractors/leads' })
    const ids = res.json().assignments.map((a: any) => a.assignmentId)

    expect(ids[0]).toBe('a-sooner') // expires sooner → shown first
    expect(ids[1]).toBe('a-later')
  })

  it('filters to active-only when tab=active', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MARKETPLACE)
    ;(prismaAny.professionalAssignment.findMany as any).mockResolvedValueOnce([
      makeAssignment({ id: 'a1', status: 'PENDING' }),
      makeAssignment({ id: 'a2', status: 'ACCEPTED' }),
    ])

    const res = await app.inject({
      method: 'GET',
      url:    '/marketplace/contractors/leads?tab=active',
    })

    expect(res.statusCode).toBe(200)
    // DB call should have been made with status filter
    expect(prismaAny.professionalAssignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['PENDING', 'ACCEPTED'] },
        }),
      }),
    )
  })

  it('filters to history-only when tab=history', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MARKETPLACE)
    ;(prismaAny.professionalAssignment.findMany as any).mockResolvedValueOnce([
      makeAssignment({ id: 'a1', status: 'DECLINED' }),
    ])

    const res = await app.inject({
      method: 'GET',
      url:    '/marketplace/contractors/leads?tab=history',
    })

    expect(res.statusCode).toBe(200)
    expect(prismaAny.professionalAssignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['DECLINED', 'EXPIRED', 'FORFEITED'] },
        }),
      }),
    )
  })

  it('returns 400 for invalid tab value', async () => {
    const res = await app.inject({
      method: 'GET',
      url:    '/marketplace/contractors/leads?tab=invalid',
    })
    expect(res.statusCode).toBe(400)
  })

  it('respects limit query param', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MARKETPLACE)
    ;(prismaAny.professionalAssignment.findMany as any).mockResolvedValueOnce([])

    await app.inject({ method: 'GET', url: '/marketplace/contractors/leads?limit=10' })

    expect(prismaAny.professionalAssignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 }),
    )
  })

  it('includes lead with null project gracefully', async () => {
    const noProjectAssignment = {
      ...makeAssignment(),
      lead: { ...makeAssignment().lead, project: null },
    }
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MARKETPLACE)
    ;(prismaAny.professionalAssignment.findMany as any).mockResolvedValueOnce([noProjectAssignment])

    const res = await app.inject({ method: 'GET', url: '/marketplace/contractors/leads' })
    const { assignments } = res.json()

    expect(assignments[0].projectId).toBeNull()
    expect(assignments[0].constructionReadiness).toBeNull()
  })

  it('returns 500 on DB error', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockRejectedValueOnce(
      new Error('DB connection lost'),
    )

    const res = await app.inject({ method: 'GET', url: '/marketplace/contractors/leads' })
    expect(res.statusCode).toBe(500)
    expect(typeof res.json().error).toBe('string')
  })

  it('returns marketplaceProfileId in response', async () => {
    ;(prismaAny.marketplaceProfile.findUnique as any).mockResolvedValueOnce(MOCK_MARKETPLACE)
    ;(prismaAny.professionalAssignment.findMany as any).mockResolvedValueOnce([])

    const res = await app.inject({ method: 'GET', url: '/marketplace/contractors/leads' })
    expect(res.json().marketplaceProfileId).toBe(MP_ID)
  })
})
