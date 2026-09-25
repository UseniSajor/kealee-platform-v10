import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({
  tenantSupportAccessSession: { findFirst: vi.fn(), update: vi.fn() },
  tenantAuditEvent: { create: vi.fn() },
}))

vi.mock('../../../lib/prisma', () => ({ prisma: db }))

import { updateSupportAccess } from '../white-label.service'

const actor = { userId: 'operator-1', actorType: 'PLATFORM_ADMIN' as const }

describe('white-label support access state machine', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    db.tenantAuditEvent.create.mockResolvedValue({ id: 'audit-1' })
    db.tenantSupportAccessSession.update.mockImplementation(async ({ data }: any) => ({ id: 'session-1', ...data }))
  })

  it('does not allow activation before approval', async () => {
    db.tenantSupportAccessSession.findFirst.mockResolvedValue({
      id: 'session-1', orgId: 'org-1', status: 'REQUESTED', expiresAt: new Date(Date.now() + 60_000),
    })
    await expect(updateSupportAccess('org-1', 'session-1', {
      action: 'ACTIVATE', reason: 'Investigating reported tenant issue',
    }, actor)).rejects.toMatchObject({ statusCode: 409 })
    expect(db.tenantSupportAccessSession.update).not.toHaveBeenCalled()
  })

  it('allows the approved-to-active transition and audits the real actor', async () => {
    db.tenantSupportAccessSession.findFirst.mockResolvedValue({
      id: 'session-1', orgId: 'org-1', status: 'APPROVED', approvedById: 'operator-2', expiresAt: new Date(Date.now() + 60_000),
    })
    await updateSupportAccess('org-1', 'session-1', {
      action: 'ACTIVATE', reason: 'Investigating reported tenant issue',
    }, actor)
    expect(db.tenantSupportAccessSession.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'ACTIVE', approvedById: 'operator-2' }),
    }))
    expect(db.tenantAuditEvent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ actorUserId: 'operator-1', actorType: 'PLATFORM_ADMIN' }),
    }))
  })
})
