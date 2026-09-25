import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ user: null as any }))
const service = vi.hoisted(() => ({
  enableModule: vi.fn(),
  disableModule: vi.fn(),
  getEntitlement: vi.fn(),
  getEntitlementStatus: vi.fn(),
  getOrgEntitlements: vi.fn(),
  getEnabledModules: vi.fn(),
  getModuleOrgs: vi.fn(),
  updateExpiration: vi.fn(),
  hasModuleAccess: vi.fn(),
}))

vi.mock('../../../middleware/auth.middleware', () => ({
  authenticateUser: async (request: any, reply: any) => {
    if (!state.user) return reply.code(401).send({ error: 'Not authenticated' })
    request.user = state.user
  },
  requirePlatformAdmin: async (request: any, reply: any) => {
    if (!['PLATFORM_OWNER', 'SUPER_ADMIN', 'OPS_ADMIN'].includes(request.user?.platformRole)) {
      return reply.code(403).send({ error: 'Platform administrator access is required' })
    }
  },
}))
vi.mock('../../../middleware/tenant-context', () => ({
  isPlatformRole: (role?: string) => ['PLATFORM_OWNER', 'SUPER_ADMIN', 'OPS_ADMIN'].includes(role || ''),
}))
vi.mock('../entitlement.service', () => ({ entitlementService: service }))

import { entitlementRoutes } from '../entitlement.routes'

async function inject(options: { method: string; url: string; payload?: unknown }) {
  const app = Fastify()
  await app.register(entitlementRoutes)
  const response = await app.inject(options)
  await app.close()
  return response
}

describe('entitlement route tenant security', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.user = { id: 'tenant-admin', role: 'CONTRACTOR', platformRole: 'CONTRACTOR', organizationId: 'org-a' }
    service.enableModule.mockResolvedValue({ id: 'entitlement-1' })
    service.getOrgEntitlements.mockResolvedValue([])
  })

  it('prevents a tenant administrator from granting paid modules', async () => {
    const response = await inject({ method: 'POST', url: '/orgs/org-a/modules/estimating/enable', payload: {} })
    expect(response.statusCode).toBe(403)
    expect(service.enableModule).not.toHaveBeenCalled()
  })

  it('prevents a member from reading another organization entitlements', async () => {
    const response = await inject({ method: 'GET', url: '/orgs/org-b' })
    expect(response.statusCode).toBe(403)
    expect(service.getOrgEntitlements).not.toHaveBeenCalled()
  })

  it('allows the selected member to read its organization entitlements', async () => {
    const response = await inject({ method: 'GET', url: '/orgs/org-a' })
    expect(response.statusCode).toBe(200)
    expect(service.getOrgEntitlements).toHaveBeenCalledWith('org-a')
  })

  it('allows a Kealee platform operator to grant modules', async () => {
    state.user = { id: 'operator', role: 'OPS_ADMIN', platformRole: 'OPS_ADMIN', organizationId: null }
    const response = await inject({ method: 'POST', url: '/orgs/org-a/modules/estimating/enable', payload: {} })
    expect(response.statusCode).toBe(201)
    expect(service.enableModule).toHaveBeenCalledWith('org-a', 'estimating', undefined)
  })
})
