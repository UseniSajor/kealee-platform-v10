import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ verify: vi.fn(), findUser: vi.fn(), findProject: vi.fn() }))
vi.mock('@clerk/backend', () => ({ verifyToken: mocks.verify }))
vi.mock('../../utils/prisma-helper', () => ({ prismaAny: { user: { findFirst: mocks.findUser }, project: { findFirst: mocks.findProject } } }))
import {
  authenticateUser,
  requirePlatformAdmin,
  requireProjectMembership,
  requireRole,
  requireSelectedOrganizationRole,
} from '../auth.middleware'
function reply() {
  const result = { code: vi.fn(), send: vi.fn() }
  result.code.mockReturnValue(result)
  result.send.mockReturnValue(result)
  return result
}
const memberships = [{ orgId: 'a', roleKey: 'ADMIN', org: { id: 'a', status: 'ACTIVE' } }]
beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('CLERK_SECRET_KEY', 'test')
  mocks.verify.mockResolvedValue({ sub: 'clerk-user' })
  mocks.findUser.mockResolvedValue({ id: 'u', status: 'ACTIVE', role: 'CONTRACTOR', orgMemberships: memberships })
})
describe('authenticated identity versus organization permission', () => {
  it('does not promote organization admin to global admin', async () => {
    const request: any = { headers: { authorization: 'Bearer token', 'x-kealee-org-id': 'a' } }
    await authenticateUser(request, reply() as any)
    expect(request.user.role).toBe('CONTRACTOR')
    expect(request.user.organizationRole).toBe('ADMIN')
    const response = reply()
    await requireRole(['admin'])(request, response as any)
    expect(response.code).toHaveBeenCalledWith(403)
  })

  it('does not allow an organization admin into the Kealee control plane', async () => {
    const request: any = { user: { id: 'u', role: 'CONTRACTOR', platformRole: 'CONTRACTOR', organizationId: 'a', organizationRole: 'ADMIN' } }
    const response = reply()
    await requirePlatformAdmin(request, response as any)
    expect(response.code).toHaveBeenCalledWith(403)
  })

  it('allows a verified organization admin only into its selected professional context', async () => {
    const request: any = { user: { id: 'u', role: 'CONTRACTOR', organizationId: 'a', organizationRole: 'ADMIN' } }
    const response = reply()
    await requireSelectedOrganizationRole(['owner', 'admin'])(request, response as any)
    expect(response.code).not.toHaveBeenCalled()

    request.user.organizationId = null
    await requireSelectedOrganizationRole(['owner', 'admin'])(request, response as any)
    expect(response.code).toHaveBeenCalledWith(403)
  })
  it('leaves personal requests without tenant context', async () => {
    const request: any = { headers: { authorization: 'Bearer token' } }
    await authenticateUser(request, reply() as any)
    expect(request.user.organizationId).toBeNull()
  })
  it('denies an explicit foreign organization', async () => {
    const request: any = { headers: { authorization: 'Bearer token', 'x-kealee-org-id': 'b' } }
    const response = reply()
    await authenticateUser(request, response as any)
    expect(response.code).toHaveBeenCalledWith(403)
    expect(request.user).toBeUndefined()
  })
  it('keeps homeowners project-scoped without organization privileges', async () => {
    mocks.findUser.mockResolvedValue({ id: 'h', email: 'h@example.com', role: 'HOMEOWNER', status: 'ACTIVE', orgMemberships: memberships })
    mocks.findProject.mockResolvedValue({ id: 'shared-project' })
    const request: any = { headers: { authorization: 'Bearer token' }, params: { projectId: 'shared-project' } }
    const response = reply()
    await authenticateUser(request, response as any)
    await requireProjectMembership()(request, response as any)
    expect(request.user.organizationId).toBeNull()
    expect(mocks.findProject.mock.calls[0][0].where.OR).toContainEqual({ client: { email: 'h@example.com' } })
    expect(mocks.findProject.mock.calls[0][0].where.OR.some((entry: any) => entry.orgId)).toBe(false)
    expect(response.code).not.toHaveBeenCalled()
  })
})
