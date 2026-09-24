import Fastify from 'fastify'
import { afterEach, describe, expect, it, vi } from 'vitest'
const service = vi.hoisted(() => ({
  setFeatureFlag: vi.fn(), listPartners: vi.fn(), grantEntitlement: vi.fn(), getPortfolioOrg: vi.fn(), listOrgEntitlements: vi.fn(),
}))
vi.mock('../../../middleware/auth', () => ({ authenticateUser: async (request: any) => {
  request.user = { id: 'u', role: request.headers['x-test-role'] || 'CONTRACTOR', platformRole: request.headers['x-test-role'] || 'CONTRACTOR' }
} }))
vi.mock('../enterprise.service', () => ({ ...service,
  listPortfolioOrgs: vi.fn(), createPortfolioOrg: vi.fn(), updatePortfolioOrg: vi.fn(), listTeamMembers: vi.fn(), inviteTeamMember: vi.fn(),
  updateTeamMemberRole: vi.fn(), removeTeamMember: vi.fn(), checkFeatureFlag: vi.fn(), listFeatureFlags: vi.fn(), hasEntitlement: vi.fn(), registerPartner: vi.fn(), deactivatePartner: vi.fn(),
}))
import { enterpriseRoutes } from '../enterprise.routes'
afterEach(() => vi.resetAllMocks())
async function inject(options: Parameters<ReturnType<typeof Fastify>['inject']>[0]) {
  const app = Fastify()
  await app.register(enterpriseRoutes, { prefix: '/enterprise' })
  try { return await app.inject(options as any) } finally { await app.close() }
}
describe('enterprise route authorization', () => {
  it('organization administrators cannot write global flags', async () => {
    const result = await inject({ method: 'PUT', url: '/enterprise/flags', headers: { 'x-test-role': 'ADMIN' }, payload: { flagKey: 'x', enabled: true, scope: 'GLOBAL' } })
    expect(result.statusCode).toBe(403)
    expect(service.setFeatureFlag).not.toHaveBeenCalled()
  })
  it('only platform administrators can grant paid entitlements', async () => {
    const result = await inject({ method: 'POST', url: '/enterprise/orgs/a/entitlements', payload: { featureKey: 'estimating', status: 'ACTIVE' } })
    expect(result.statusCode).toBe(403)
    expect(service.grantEntitlement).not.toHaveBeenCalled()
  })
  it('homeowners cannot enter the enterprise workspace', async () => {
    const result = await inject({ method: 'GET', url: '/enterprise/orgs', headers: { 'x-test-role': 'HOMEOWNER' } })
    expect(result.statusCode).toBe(403)
  })
  it('requires tenant membership before disclosing entitlements', async () => {
    service.getPortfolioOrg.mockRejectedValue(Object.assign(new Error('No access'), { statusCode: 404 }))
    const result = await inject({ method: 'GET', url: '/enterprise/orgs/b/entitlements' })
    expect(result.statusCode).toBe(404)
    expect(service.listOrgEntitlements).not.toHaveBeenCalled()
  })
  it('permits platform owner controls', async () => {
    service.listPartners.mockResolvedValue([])
    const result = await inject({ method: 'GET', url: '/enterprise/partners', headers: { 'x-test-role': 'PLATFORM_OWNER' } })
    expect(result.statusCode).toBe(200)
  })
})
