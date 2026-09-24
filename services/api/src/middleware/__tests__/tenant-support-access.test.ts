import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  createAudit: vi.fn(),
}))

vi.mock('../../lib/prisma', () => ({
  prisma: {
    tenantSupportAccessSession: { findFirst: mocks.findFirst },
    tenantAuditEvent: { create: mocks.createAudit },
  },
}))

import { requireTenantSupportAccess } from '../tenant-support-access'

function reply() {
  const value: any = {
    statusCode: 200,
    payload: undefined,
    code: vi.fn((statusCode: number) => { value.statusCode = statusCode; return value }),
    send: vi.fn((payload: unknown) => { value.payload = payload; return value }),
  }
  return value
}

function request(role = 'PLATFORM_OWNER') {
  return {
    user: { id: 'admin-1', role },
    params: { tenantId: 'tenant-1' },
    headers: { 'user-agent': 'vitest' },
    ip: '127.0.0.1',
    method: 'GET',
    routeOptions: { url: '/white-label/support/:tenantId/context' },
  } as any
}

describe('tenant support access guard', () => {
  beforeEach(() => vi.resetAllMocks())

  it('requires a matching active session and records each use', async () => {
    mocks.findFirst.mockResolvedValue({
      id: 'support-1',
      permissions: ['TENANT_READ'],
      expiresAt: new Date(Date.now() + 60_000),
    })
    const req = request()
    const res = reply()

    await requireTenantSupportAccess('TENANT_READ')(req, res)

    expect(res.code).not.toHaveBeenCalled()
    expect(req.tenantSupportAccess).toMatchObject({ sessionId: 'support-1', orgId: 'tenant-1' })
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ orgId: 'tenant-1', requestedById: 'admin-1', status: 'ACTIVE' }),
    }))
    expect(mocks.createAudit).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'SUPPORT_ACCESS_USED', orgId: 'tenant-1' }),
    }))
  })

  it('denies access when no active session grants the permission', async () => {
    mocks.findFirst.mockResolvedValue(null)
    const res = reply()
    await requireTenantSupportAccess('TENANT_READ')(request(), res)
    expect(res.statusCode).toBe(403)
    expect(mocks.createAudit).not.toHaveBeenCalled()
  })

  it('does not allow homeowners into professional tenant support context', async () => {
    const res = reply()
    await requireTenantSupportAccess('TENANT_READ')(request('HOMEOWNER'), res)
    expect(res.statusCode).toBe(403)
    expect(mocks.findFirst).not.toHaveBeenCalled()
  })
})
