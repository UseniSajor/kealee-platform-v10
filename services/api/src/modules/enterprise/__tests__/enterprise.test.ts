import { beforeEach, describe, expect, it, vi } from 'vitest'
const db = vi.hoisted(() => ({
  org: { create: vi.fn(), findUniqueOrThrow: vi.fn() },
  orgMember: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  moduleEntitlement: { upsert: vi.fn(), findFirst: vi.fn() },
  systemConfig: { findMany: vi.fn() },
  role: { upsert: vi.fn() }, user: { findUnique: vi.fn() }, $transaction: vi.fn(),
}))
vi.mock('../../../lib/prisma', () => ({ prisma: db }))
import { createPortfolioOrg, inviteTeamMember, updateTeamMemberRole, removeTeamMember,
  checkFeatureFlag, grantEntitlement, hasEntitlement } from '../enterprise.service'
beforeEach(() => vi.resetAllMocks())
describe('canonical enterprise organization boundary', () => {
  it('creates an Org and scoped owner role in one transaction', async () => {
    db.user.findUnique.mockResolvedValue({ role: 'CONTRACTOR', status: 'ACTIVE' })
    db.$transaction.mockImplementation(fn => fn(db))
    db.org.create.mockResolvedValue({ id: 'org-a' })
    db.org.findUniqueOrThrow.mockResolvedValue({ id: 'org-a', name: 'Acme', createdAt: new Date() })
    await createPortfolioOrg({ name: 'Acme' }, 'professional')
    expect(db.orgMember.create).toHaveBeenCalledWith({ data: { orgId: 'org-a', userId: 'professional', roleKey: 'org_owner' } })
  })
  it('rejects a homeowner creating a professional organization', async () => {
    db.user.findUnique.mockResolvedValue({ role: 'HOMEOWNER', status: 'ACTIVE' })
    await expect(createPortfolioOrg({ name: 'Acme' }, 'homeowner')).rejects.toMatchObject({ statusCode: 403 })
    expect(db.$transaction).not.toHaveBeenCalled()
  })
  it('rejects inviting homeowners into professional tenant membership', async () => {
    db.orgMember.findFirst.mockResolvedValue({ roleKey: 'org_owner' })
    db.user.findUnique.mockResolvedValue({ id: 'homeowner', role: 'HOMEOWNER', status: 'ACTIVE' })
    await expect(inviteTeamMember({ orgId: 'org-a', email: 'h@example.com', role: 'VIEWER' }, 'owner')).rejects.toMatchObject({ statusCode: 403 })
    expect(db.orgMember.create).not.toHaveBeenCalled()
  })
  it('cannot update a membership belonging to a different tenant', async () => {
    db.orgMember.findFirst.mockResolvedValueOnce({ roleKey: 'org_admin' }).mockResolvedValueOnce(null)
    await expect(updateTeamMemberRole('org-a', 'member-in-org-b', { role: 'ADMIN' }, 'admin')).rejects.toMatchObject({ statusCode: 404 })
    expect(db.orgMember.findFirst).toHaveBeenLastCalledWith({ where: { id: 'member-in-org-b', orgId: 'org-a' } })
    expect(db.orgMember.update).not.toHaveBeenCalled()
  })
  it('cannot demote or remove organization owners', async () => {
    db.orgMember.findFirst.mockResolvedValue({ roleKey: 'org_owner' })
    await expect(updateTeamMemberRole('org-a', 'owner', { role: 'VIEWER' }, 'admin')).rejects.toMatchObject({ statusCode: 422 })
    await expect(removeTeamMember('org-a', 'owner', 'admin')).rejects.toMatchObject({ statusCode: 422 })
  })
  it('rejects project restrictions instead of silently granting whole-organization access', async () => {
    db.orgMember.findFirst.mockResolvedValue({ roleKey: 'org_owner' })
    db.user.findUnique.mockResolvedValue({ id: 'contractor', role: 'CONTRACTOR', status: 'ACTIVE' })
    await expect(inviteTeamMember({ orgId: 'org-a', email: 'p@example.com', role: 'VIEWER', projectIds: ['p1'] }, 'owner')).rejects.toMatchObject({ statusCode: 422 })
    expect(db.orgMember.create).not.toHaveBeenCalled()
  })
})
describe('entitlements and rollout configuration', () => {
  it('uses ModuleEntitlement as the paid-access source', async () => {
    db.moduleEntitlement.upsert.mockResolvedValue({ id: 'e', orgId: 'org-a', moduleKey: 'estimating', enabled: true })
    const result = await grantEntitlement({ orgId: 'org-a', featureKey: 'estimating', status: 'ACTIVE' })
    expect(result.featureKey).toBe('estimating')
    expect(db.moduleEntitlement.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { orgId_moduleKey: { orgId: 'org-a', moduleKey: 'estimating' } } }))
  })
  it('requires enabled and unexpired entitlement in the requested organization', async () => {
    db.moduleEntitlement.findFirst.mockResolvedValue(null)
    expect(await hasEntitlement('org-b', 'estimating')).toBe(false)
    expect(db.moduleEntitlement.findFirst).toHaveBeenCalledWith({ where: { orgId: 'org-b', moduleKey: 'estimating', enabled: true, OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }] } })
  })
  it('disabled flag remains disabled even when rollout would include the user', async () => {
    db.systemConfig.findMany.mockResolvedValue([{ value: { flagKey: 'beta', scope: 'GLOBAL', enabled: false, rolloutPercent: 99 } }])
    expect(await checkFeatureFlag({ flagKey: 'beta' })).toBe(false)
  })
  it('ignores another tenant flag and applies the global fallback', async () => {
    db.systemConfig.findMany.mockResolvedValue([{ value: { flagKey: 'beta', scope: 'ORG', scopeId: 'org-b', enabled: true } }, { value: { flagKey: 'beta', scope: 'GLOBAL', enabled: false } }])
    expect(await checkFeatureFlag({ flagKey: 'beta', orgId: 'org-a' })).toBe(false)
  })
})
