/**
 * construction-engagement.routes.test.ts
 *
 * Route-level tests for construction engagement endpoints.
 * Exercises the HTTP layer: auth guard, Zod param/body validation,
 * correct status codes, and error→response mapping.
 *
 * Service behaviour is already covered in construction-engagement.test.ts;
 * here we mock the service and test ONLY the route contract.
 *
 * Pattern:
 *   - Build a minimal Fastify instance per describe block
 *   - Register constructionEngagementRoutes under /marketplace
 *   - Mock authService.verifyToken (no real Supabase needed)
 *   - Mock constructionEngagementService (no DB needed)
 *   - Use fastify.inject() for all assertions
 */

import Fastify, { FastifyInstance } from 'fastify'
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { constructionEngagementRoutes } from '../construction-engagement.routes'
import { errorHandler } from '../../../middleware/error-handler.middleware'

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('../../auth/auth.service', () => ({
  authService: {
    verifyToken: vi.fn().mockResolvedValue({
      id:    'user-test-1',
      email: 'test@kealee.com',
      role:  'OWNER',
    }),
  },
}))

vi.mock('../construction-engagement.service', () => ({
  constructionEngagementService: {
    markConstructionReady:   vi.fn(),
    getReadinessStatus:      vi.fn(),
    getEngagementStatus:     vi.fn(),
    initializeEngagement:    vi.fn(),
    getMilestoneTemplate:    vi.fn(),
  },
}))

import { authService }                      from '../../auth/auth.service'
import { constructionEngagementService }    from '../construction-engagement.service'

// ─── Valid test IDs ───────────────────────────────────────────────────────────

const PROJECT_ID    = '11111111-1111-1111-1111-111111111111'
const LEAD_ID       = '22222222-2222-2222-2222-222222222222'
const CONTRACTOR_ID = '33333333-3333-3333-3333-333333333333'
const OWNER_ID      = '44444444-4444-4444-4444-444444444444'
const PROFILE_ID    = '55555555-5555-5555-5555-555555555555'

const AUTH_HEADER = { authorization: 'Bearer test-token' }

// ─── Server factory ───────────────────────────────────────────────────────────

async function buildServer(): Promise<FastifyInstance> {
  const fastify = Fastify({ logger: false })
  fastify.setErrorHandler(errorHandler)
  await fastify.register(constructionEngagementRoutes, { prefix: '/marketplace' })
  await fastify.ready()
  return fastify
}

// ─── A. Auth guard ────────────────────────────────────────────────────────────

describe('A — Auth guard', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildServer() })
  afterAll(async  () => { await app.close() })

  it('returns 401 when Authorization header is missing', async () => {
    const res = await app.inject({
      method: 'GET',
      url:    `/marketplace/projects/${PROJECT_ID}/readiness`,
      // no headers
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns 401 when verifyToken throws', async () => {
    ;(authService.verifyToken as any).mockRejectedValueOnce(new Error('expired'))
    const res = await app.inject({
      method:  'GET',
      url:     `/marketplace/projects/${PROJECT_ID}/readiness`,
      headers: AUTH_HEADER,
    })
    expect(res.statusCode).toBe(401)
  })
})

// ─── B. UUID param validation ─────────────────────────────────────────────────

describe('B — UUID param validation', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildServer() })
  afterAll(async  () => { await app.close() })

  it('returns 400 when projectId is not a valid UUID (construction-ready)', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/marketplace/projects/not-a-uuid/construction-ready',
      headers: { ...AUTH_HEADER, 'content-type': 'application/json' },
      payload: {},
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when projectId is not a valid UUID (readiness GET)', async () => {
    const res = await app.inject({
      method:  'GET',
      url:     '/marketplace/projects/bad-id/readiness',
      headers: AUTH_HEADER,
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when leadId is not a valid UUID (engagement GET)', async () => {
    const res = await app.inject({
      method:  'GET',
      url:     '/marketplace/leads/bad-id/engagement',
      headers: AUTH_HEADER,
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when leadId is not a valid UUID (initialize POST)', async () => {
    const res = await app.inject({
      method:   'POST',
      url:      '/marketplace/leads/bad-id/engagement/initialize',
      headers:  { ...AUTH_HEADER, 'content-type': 'application/json' },
      payload:  {
        contractorUserId: CONTRACTOR_ID,
        ownerUserId:      OWNER_ID,
        projectId:        PROJECT_ID,
        contractAmount:   100000,
        profileId:        PROFILE_ID,
      },
    })
    expect(res.statusCode).toBe(400)
  })
})

// ─── C. POST /projects/:projectId/construction-ready ─────────────────────────

describe('C — POST /projects/:projectId/construction-ready', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildServer() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 200 with success payload when service resolves', async () => {
    ;(constructionEngagementService.markConstructionReady as any).mockResolvedValue({
      id: PROJECT_ID, constructionReadiness: 'CONSTRUCTION_READY',
    })

    const res = await app.inject({
      method:  'POST',
      url:     `/marketplace/projects/${PROJECT_ID}/construction-ready`,
      headers: { ...AUTH_HEADER, 'content-type': 'application/json' },
      payload: { reason: 'Plans approved and permits submitted' },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.success).toBe(true)
    expect(body.constructionReadiness).toBe('CONSTRUCTION_READY')
    expect(body.projectId).toBe(PROJECT_ID)
  })

  it('returns 422 when service throws (e.g. phase not ready)', async () => {
    ;(constructionEngagementService.markConstructionReady as any)
      .mockRejectedValue(new Error('PreConProject phase INTAKE is not eligible'))

    const res = await app.inject({
      method:  'POST',
      url:     `/marketplace/projects/${PROJECT_ID}/construction-ready`,
      headers: { ...AUTH_HEADER, 'content-type': 'application/json' },
      payload: {},
    })

    expect(res.statusCode).toBe(422)
    expect(res.json().error).toBeTruthy() // sanitizeErrorMessage forwards the safe error text
  })

  it('returns 400 when reason exceeds 500 chars', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     `/marketplace/projects/${PROJECT_ID}/construction-ready`,
      headers: { ...AUTH_HEADER, 'content-type': 'application/json' },
      payload: { reason: 'x'.repeat(501) },
    })
    expect(res.statusCode).toBe(400)
  })
})

// ─── D. GET /projects/:projectId/readiness ────────────────────────────────────

describe('D — GET /projects/:projectId/readiness', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildServer() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 200 with readiness status object', async () => {
    ;(constructionEngagementService.getReadinessStatus as any).mockResolvedValue({
      projectId:             PROJECT_ID,
      constructionReadiness: 'CONSTRUCTION_READY',
      isReady:               true,
      preConPhase:           'BIDDING_OPEN',
      proxyWouldPass:        true,
    })

    const res = await app.inject({
      method:  'GET',
      url:     `/marketplace/projects/${PROJECT_ID}/readiness`,
      headers: AUTH_HEADER,
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().isReady).toBe(true)
  })

  it('returns 404 when service throws (project not found)', async () => {
    ;(constructionEngagementService.getReadinessStatus as any)
      .mockRejectedValue(new Error('Not found'))

    const res = await app.inject({
      method:  'GET',
      url:     `/marketplace/projects/${PROJECT_ID}/readiness`,
      headers: AUTH_HEADER,
    })

    expect(res.statusCode).toBe(404)
  })
})

// ─── E. GET /leads/:leadId/engagement ────────────────────────────────────────

describe('E — GET /leads/:leadId/engagement', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildServer() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 200 with engagement status', async () => {
    ;(constructionEngagementService.getEngagementStatus as any).mockResolvedValue({
      leadId:   LEAD_ID,
      contract: null,
    })

    const res = await app.inject({
      method:  'GET',
      url:     `/marketplace/leads/${LEAD_ID}/engagement`,
      headers: AUTH_HEADER,
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().leadId).toBe(LEAD_ID)
  })

  it('returns 404 when service throws', async () => {
    ;(constructionEngagementService.getEngagementStatus as any)
      .mockRejectedValue(new Error('Lead not found'))

    const res = await app.inject({
      method:  'GET',
      url:     `/marketplace/leads/${LEAD_ID}/engagement`,
      headers: AUTH_HEADER,
    })

    expect(res.statusCode).toBe(404)
  })
})

// ─── F. POST /leads/:leadId/engagement/initialize ────────────────────────────

describe('F — POST /leads/:leadId/engagement/initialize', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildServer() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  const validBody = {
    contractorUserId: CONTRACTOR_ID,
    ownerUserId:      OWNER_ID,
    projectId:        PROJECT_ID,
    contractAmount:   250000,
    profileId:        PROFILE_ID,
  }

  it('returns 201 on full success (success=true, no errors)', async () => {
    ;(constructionEngagementService.initializeEngagement as any).mockResolvedValue({
      success:           true,
      contractId:        'contract-1',
      milestonesCreated: 7,
      escrowId:          'escrow-1',
      errors:            [],
    })

    const res = await app.inject({
      method:   'POST',
      url:      `/marketplace/leads/${LEAD_ID}/engagement/initialize`,
      headers:  { ...AUTH_HEADER, 'content-type': 'application/json' },
      payload:  validBody,
    })

    expect(res.statusCode).toBe(201)
  })

  it('returns 207 Multi-Status on partial success (success=false, some errors)', async () => {
    ;(constructionEngagementService.initializeEngagement as any).mockResolvedValue({
      success:           false,
      contractId:        'contract-1',
      milestonesCreated: 7,
      escrowId:          undefined,
      errors:            ['Escrow creation failed: Stripe timeout'],
    })

    const res = await app.inject({
      method:   'POST',
      url:      `/marketplace/leads/${LEAD_ID}/engagement/initialize`,
      headers:  { ...AUTH_HEADER, 'content-type': 'application/json' },
      payload:  validBody,
    })

    expect(res.statusCode).toBe(207)
  })

  it('returns 400 when service throws', async () => {
    ;(constructionEngagementService.initializeEngagement as any)
      .mockRejectedValue(new Error('Lead already has an active engagement'))

    const res = await app.inject({
      method:   'POST',
      url:      `/marketplace/leads/${LEAD_ID}/engagement/initialize`,
      headers:  { ...AUTH_HEADER, 'content-type': 'application/json' },
      payload:  validBody,
    })

    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when required body fields are missing', async () => {
    const res = await app.inject({
      method:   'POST',
      url:      `/marketplace/leads/${LEAD_ID}/engagement/initialize`,
      headers:  { ...AUTH_HEADER, 'content-type': 'application/json' },
      payload:  { contractorUserId: CONTRACTOR_ID }, // missing ownerUserId, projectId, etc.
    })

    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when contractAmount is negative', async () => {
    const res = await app.inject({
      method:   'POST',
      url:      `/marketplace/leads/${LEAD_ID}/engagement/initialize`,
      headers:  { ...AUTH_HEADER, 'content-type': 'application/json' },
      payload:  { ...validBody, contractAmount: -1 },
    })

    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when projectCategory is invalid enum value', async () => {
    const res = await app.inject({
      method:   'POST',
      url:      `/marketplace/leads/${LEAD_ID}/engagement/initialize`,
      headers:  { ...AUTH_HEADER, 'content-type': 'application/json' },
      payload:  { ...validBody, projectCategory: 'INVALID_TYPE' },
    })

    expect(res.statusCode).toBe(400)
  })

  it('accepts valid optional projectCategory', async () => {
    ;(constructionEngagementService.initializeEngagement as any).mockResolvedValue({
      success: true, errors: [],
    })

    const res = await app.inject({
      method:   'POST',
      url:      `/marketplace/leads/${LEAD_ID}/engagement/initialize`,
      headers:  { ...AUTH_HEADER, 'content-type': 'application/json' },
      payload:  { ...validBody, projectCategory: 'COMMERCIAL' },
    })

    expect(res.statusCode).toBe(201)
    // Ensure projectCategory was forwarded to service
    expect(constructionEngagementService.initializeEngagement).toHaveBeenCalledWith(
      expect.objectContaining({ projectCategory: 'COMMERCIAL' })
    )
  })
})

// ─── G. GET /engagement/milestone-templates/:category ─────────────────────────

describe('G — GET /engagement/milestone-templates/:category', () => {
  let app: FastifyInstance
  beforeAll(async () => { app = await buildServer() })
  afterAll(async  () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 200 with template for RESIDENTIAL', async () => {
    ;(constructionEngagementService.getMilestoneTemplate as any).mockReturnValue([
      { name: 'Mobilization', pct: 0.10, order: 1 },
      { name: 'Foundation',   pct: 0.15, order: 2 },
    ])

    const res = await app.inject({
      method:  'GET',
      url:     '/marketplace/engagement/milestone-templates/RESIDENTIAL',
      headers: AUTH_HEADER,
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.category).toBe('RESIDENTIAL')
    expect(Array.isArray(body.milestones)).toBe(true)
    expect(typeof body.totalPct).toBe('number')
  })

  it('is case-insensitive (lowercase residential → RESIDENTIAL template)', async () => {
    ;(constructionEngagementService.getMilestoneTemplate as any).mockReturnValue([
      { name: 'Mobilization', pct: 0.10, order: 1 },
    ])

    const res = await app.inject({
      method:  'GET',
      url:     '/marketplace/engagement/milestone-templates/residential',
      headers: AUTH_HEADER,
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().category).toBe('RESIDENTIAL')
  })

  it('returns 400 for an invalid category', async () => {
    const res = await app.inject({
      method:  'GET',
      url:     '/marketplace/engagement/milestone-templates/WAREHOUSE',
      headers: AUTH_HEADER,
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toMatch(/Invalid category/)
  })
})
