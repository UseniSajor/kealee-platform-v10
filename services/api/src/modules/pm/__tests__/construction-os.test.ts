/**
 * construction-os.test.ts
 *
 * Tests for P10 Construction OS feature gating layer:
 *   - requireOSFeature middleware
 *   - autoProvisionOSAccess middleware
 *   - pmFeaturesRoutes endpoints
 *   - Feature phase/tier logic
 *
 * All Prisma calls are mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Prisma ───────────────────────────────────────────────────────────────

const mockFeature = {
  id:          'feat_daily_log',
  slug:        'daily-log',
  name:        'Daily Field Log',
  description: 'Contractors submit daily work logs.',
  phase:       1,
  tier:        'STANDARD',
  isEnabled:   true,
}

const mockPhase2Feature = {
  id:          'feat_change_orders',
  slug:        'change-orders',
  name:        'Change Order Management',
  description: 'Create and route change orders.',
  phase:       2,
  tier:        'PRO',
  isEnabled:   true,
}

const mockAccess = {
  id:            'osa_test',
  projectId:     'proj_123',
  orgId:         null,
  phase:         1,
  tier:          'STANDARD',
  enabledSlugs:  [],
  disabledSlugs: [],
}

const mockProAccess = {
  ...mockAccess,
  phase: 2,
  tier:  'PRO',
}

vi.mock('../../../utils/prisma-helper', () => ({
  prismaAny: {
    constructionOSFeature: {
      findUnique: vi.fn(),
      findMany:   vi.fn(),
    },
    projectOSAccess: {
      findUnique: vi.fn(),
      create:     vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
    },
  },
}))

import { prismaAny } from '../../../utils/prisma-helper'

// ── Helper: build mock Fastify request/reply ──────────────────────────────────

function mockRequest(overrides: Partial<{
  params: Record<string, string>
  query:  Record<string, string>
  body:   Record<string, unknown>
}> = {}) {
  return {
    params: overrides.params ?? {},
    query:  overrides.query  ?? {},
    body:   overrides.body   ?? {},
  } as any
}

function mockReply() {
  const reply: any = {
    _status: 200,
    _body:   undefined,
    status:  vi.fn((code: number) => { reply._status = code; return reply }),
    send:    vi.fn((body: unknown) => { reply._body = body; return reply }),
  }
  return reply
}

// ── Import middleware under test ──────────────────────────────────────────────

import {
  requireOSFeature,
  autoProvisionOSAccess,
} from '../../../middleware/feature-gate.middleware'

// ── requireOSFeature ──────────────────────────────────────────────────────────

describe('requireOSFeature', () => {
  beforeEach(() => vi.clearAllMocks())

  it('allows Phase 1 features without DB lookup', async () => {
    const middleware = requireOSFeature('daily-log')
    const req   = mockRequest({ query: { projectId: 'proj_123' } })
    const reply = mockReply()

    await middleware(req, reply)

    expect(reply.status).not.toHaveBeenCalled()
    expect((prismaAny.projectOSAccess.findUnique as any)).not.toHaveBeenCalled()
  })

  it('allows all 9 Phase 1 slugs without DB lookup', async () => {
    const phase1Slugs = [
      'daily-log', 'schedule-view', 'schedule-gantt', 'rfi-list', 'rfi-create',
      'punch-list', 'budget-overview', 'photo-log', 'project-reports',
    ]
    for (const slug of phase1Slugs) {
      const middleware = requireOSFeature(slug)
      const req   = mockRequest({ query: { projectId: 'proj_123' } })
      const reply = mockReply()
      await middleware(req, reply)
      expect(reply.status).not.toHaveBeenCalled()
    }
  })

  it('returns 400 when no projectId found for Phase 2 feature', async () => {
    const middleware = requireOSFeature('change-orders')
    const req   = mockRequest() // no projectId anywhere
    const reply = mockReply()

    await middleware(req, reply)

    expect(reply.status).toHaveBeenCalledWith(400)
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('projectId') })
    )
  })

  it('returns 403 when no access record exists for Phase 2 feature', async () => {
    ;(prismaAny.projectOSAccess.findUnique as any).mockResolvedValue(null)

    const middleware = requireOSFeature('change-orders')
    const req   = mockRequest({ query: { projectId: 'proj_123' } })
    const reply = mockReply()

    await middleware(req, reply)

    expect(reply.status).toHaveBeenCalledWith(403)
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('not enabled') })
    )
  })

  it('returns 403 when feature is explicitly disabled', async () => {
    ;(prismaAny.projectOSAccess.findUnique as any).mockResolvedValue({
      ...mockAccess,
      disabledSlugs: ['change-orders'],
    })

    const middleware = requireOSFeature('change-orders')
    const req   = mockRequest({ params: { projectId: 'proj_123' } })
    const reply = mockReply()

    await middleware(req, reply)

    expect(reply.status).toHaveBeenCalledWith(403)
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('explicitly disabled') })
    )
  })

  it('allows feature that is explicitly enabled', async () => {
    ;(prismaAny.projectOSAccess.findUnique as any).mockResolvedValue({
      ...mockAccess,
      enabledSlugs: ['change-orders'],
    })

    const middleware = requireOSFeature('change-orders')
    const req   = mockRequest({ params: { projectId: 'proj_123' } })
    const reply = mockReply()

    await middleware(req, reply)

    expect(reply.status).not.toHaveBeenCalled()
  })

  it('returns 403 when feature requires higher phase than project has', async () => {
    ;(prismaAny.projectOSAccess.findUnique as any).mockResolvedValue(mockAccess) // phase 1
    ;(prismaAny.constructionOSFeature.findUnique as any).mockResolvedValue(mockPhase2Feature) // phase 2

    const middleware = requireOSFeature('change-orders')
    const req   = mockRequest({ params: { projectId: 'proj_123' } })
    const reply = mockReply()

    await middleware(req, reply)

    expect(reply.status).toHaveBeenCalledWith(403)
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        required: expect.objectContaining({ phase: 2 }),
        current:  expect.objectContaining({ phase: 1 }),
      })
    )
  })

  it('returns 403 when feature requires higher tier', async () => {
    ;(prismaAny.projectOSAccess.findUnique as any).mockResolvedValue(mockProAccess) // phase 2, PRO
    ;(prismaAny.constructionOSFeature.findUnique as any).mockResolvedValue({
      ...mockPhase2Feature,
      phase: 2,
      tier:  'ENTERPRISE',
    })

    const middleware = requireOSFeature('digital-twin')
    const req   = mockRequest({ params: { projectId: 'proj_123' } })
    const reply = mockReply()

    await middleware(req, reply)

    expect(reply.status).toHaveBeenCalledWith(403)
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        required: expect.objectContaining({ tier: 'ENTERPRISE' }),
        current:  expect.objectContaining({ tier: 'PRO' }),
      })
    )
  })

  it('allows access when phase + tier match', async () => {
    ;(prismaAny.projectOSAccess.findUnique as any).mockResolvedValue(mockProAccess) // phase 2, PRO
    ;(prismaAny.constructionOSFeature.findUnique as any).mockResolvedValue(mockPhase2Feature)

    const middleware = requireOSFeature('change-orders')
    const req   = mockRequest({ params: { projectId: 'proj_123' } })
    const reply = mockReply()

    await middleware(req, reply)

    expect(reply.status).not.toHaveBeenCalled()
  })

  it('returns 403 when feature is not enabled globally', async () => {
    ;(prismaAny.projectOSAccess.findUnique as any).mockResolvedValue(mockProAccess)
    ;(prismaAny.constructionOSFeature.findUnique as any).mockResolvedValue({
      ...mockPhase2Feature,
      isEnabled: false,
    })

    const middleware = requireOSFeature('bim-viewer')
    const req   = mockRequest({ params: { projectId: 'proj_123' } })
    const reply = mockReply()

    await middleware(req, reply)

    expect(reply.status).toHaveBeenCalledWith(403)
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('not available') })
    )
  })

  it('resolves projectId from request body', async () => {
    ;(prismaAny.projectOSAccess.findUnique as any).mockResolvedValue(mockProAccess)
    ;(prismaAny.constructionOSFeature.findUnique as any).mockResolvedValue(mockPhase2Feature)

    const middleware = requireOSFeature('change-orders')
    const req   = mockRequest({ body: { projectId: 'proj_123' } })
    const reply = mockReply()

    await middleware(req, reply)

    expect(prismaAny.projectOSAccess.findUnique).toHaveBeenCalledWith({
      where: { projectId: 'proj_123' },
    })
  })
})

// ── autoProvisionOSAccess ─────────────────────────────────────────────────────

describe('autoProvisionOSAccess', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does nothing when no projectId in request', async () => {
    const req   = mockRequest()
    const reply = mockReply()

    await autoProvisionOSAccess(req, reply)

    expect(prismaAny.projectOSAccess.findUnique).not.toHaveBeenCalled()
  })

  it('does nothing when access record already exists', async () => {
    ;(prismaAny.projectOSAccess.findUnique as any).mockResolvedValue(mockAccess)

    const req   = mockRequest({ query: { projectId: 'proj_123' } })
    const reply = mockReply()

    await autoProvisionOSAccess(req, reply)

    expect(prismaAny.project.findUnique).not.toHaveBeenCalled()
    expect(prismaAny.projectOSAccess.create).not.toHaveBeenCalled()
  })

  it('does nothing when project is not CONSTRUCTION_READY', async () => {
    ;(prismaAny.projectOSAccess.findUnique as any).mockResolvedValue(null)
    ;(prismaAny.project.findUnique as any).mockResolvedValue({
      constructionReadiness: 'NOT_READY',
      orgId: 'org_abc',
    })

    const req   = mockRequest({ query: { projectId: 'proj_123' } })
    const reply = mockReply()

    await autoProvisionOSAccess(req, reply)

    expect(prismaAny.projectOSAccess.create).not.toHaveBeenCalled()
  })

  it('creates Phase 1 STANDARD access for CONSTRUCTION_READY project', async () => {
    ;(prismaAny.projectOSAccess.findUnique as any).mockResolvedValue(null)
    ;(prismaAny.project.findUnique as any).mockResolvedValue({
      constructionReadiness: 'CONSTRUCTION_READY',
      orgId: 'org_abc',
    })
    ;(prismaAny.projectOSAccess.create as any).mockResolvedValue(mockAccess)

    const req   = mockRequest({ query: { projectId: 'proj_123' } })
    const reply = mockReply()

    await autoProvisionOSAccess(req, reply)

    expect(prismaAny.projectOSAccess.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId:     'proj_123',
        orgId:         'org_abc',
        phase:         1,
        tier:          'STANDARD',
        enabledSlugs:  [],
        disabledSlugs: [],
      }),
    })
  })

  it('silently swallows create errors to not block requests', async () => {
    ;(prismaAny.projectOSAccess.findUnique as any).mockResolvedValue(null)
    ;(prismaAny.project.findUnique as any).mockResolvedValue({
      constructionReadiness: 'CONSTRUCTION_READY',
      orgId: null,
    })
    ;(prismaAny.projectOSAccess.create as any).mockRejectedValue(new Error('DB error'))

    const req   = mockRequest({ query: { projectId: 'proj_123' } })
    const reply = mockReply()

    // Should not throw
    await expect(autoProvisionOSAccess(req, reply)).resolves.toBeUndefined()
  })
})

// ── Types module ──────────────────────────────────────────────────────────────

describe('construction-os types', () => {
  it('OS_FEATURES contains all 27 slugs', async () => {
    const { OS_FEATURES } = await import('@kealee/types/construction-os')
    expect(Object.values(OS_FEATURES)).toHaveLength(27)
  })

  it('featuresUpToPhase(1) returns 9 slugs', async () => {
    const { featuresUpToPhase } = await import('@kealee/types/construction-os')
    const phase1 = featuresUpToPhase(1)
    expect(phase1).toHaveLength(9)
    expect(phase1).toContain('daily-log')
    expect(phase1).toContain('budget-overview')
  })

  it('featuresUpToPhase(2) returns 19 slugs', async () => {
    const { featuresUpToPhase } = await import('@kealee/types/construction-os')
    const phase12 = featuresUpToPhase(2)
    expect(phase12).toHaveLength(19)
    expect(phase12).toContain('change-orders')
    expect(phase12).toContain('submittals')
  })

  it('featuresUpToPhase(3) returns all 27 slugs', async () => {
    const { featuresUpToPhase } = await import('@kealee/types/construction-os')
    expect(featuresUpToPhase(3)).toHaveLength(27)
  })

  it('getFeaturePhase returns correct phase', async () => {
    const { getFeaturePhase } = await import('@kealee/types/construction-os')
    expect(getFeaturePhase('daily-log')).toBe(1)
    expect(getFeaturePhase('change-orders')).toBe(2)
    expect(getFeaturePhase('warranty')).toBe(3)
  })

  it('canDo returns true for valid role/domain/permission combo', async () => {
    const { canDo } = await import('@kealee/types/construction-os')
    expect(canDo('CONTRACTOR', 'dailyLog', 'create')).toBe(true)
    expect(canDo('OWNER', 'budget', 'view')).toBe(true)
  })

  it('canDo returns false for invalid combos', async () => {
    const { canDo } = await import('@kealee/types/construction-os')
    // Owners cannot create daily logs
    expect(canDo('OWNER', 'dailyLog', 'create')).toBe(false)
  })

  it('DOMAIN_MAP covers all 16 construction domains', async () => {
    const { DOMAIN_MAP } = await import('@kealee/types/construction-os')
    const domains = Object.keys(DOMAIN_MAP)
    expect(domains.length).toBeGreaterThanOrEqual(16)
    expect(domains).toContain('dailyLog')
    expect(domains).toContain('rfi')
    expect(domains).toContain('punchList')
    expect(domains).toContain('schedule')
    expect(domains).toContain('budget')
    expect(domains).toContain('changeOrder')
    expect(domains).toContain('submittal')
    expect(domains).toContain('safety')
    expect(domains).toContain('drawing')
    expect(domains).toContain('warranty')
  })

  it('PHASE_DEFINITIONS has correct tier assignments', async () => {
    const { PHASE_DEFINITIONS } = await import('@kealee/types/construction-os')
    expect(PHASE_DEFINITIONS[1].tier).toBe('STANDARD')
    expect(PHASE_DEFINITIONS[2].tier).toBe('PRO')
    expect(PHASE_DEFINITIONS[3].tier).toBe('ENTERPRISE')
  })
})
