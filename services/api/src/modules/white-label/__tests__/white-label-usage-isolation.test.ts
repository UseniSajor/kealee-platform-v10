import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({
  whiteLabelTenantProfile: { findUnique: vi.fn() },
  tenantUsageEvent: { upsert: vi.fn() },
}))

vi.mock('../../../lib/prisma', () => ({ prisma: db }))

import { recordTenantUsage } from '../white-label.service'

describe('white-label usage isolation', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    db.whiteLabelTenantProfile.findUnique.mockResolvedValue({ orgId: 'org-a' })
    db.tenantUsageEvent.upsert.mockResolvedValue({ id: 'event-a', orgId: 'org-a' })
  })

  it('scopes idempotent retries to the tenant', async () => {
    await recordTenantUsage('org-a', {
      metric: 'AGENT_RUN',
      quantity: 1,
      unit: 'run',
      idempotencyKey: 'workflow-123-attempt-1',
    })

    expect(db.tenantUsageEvent.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        orgId_idempotencyKey: {
          orgId: 'org-a',
          idempotencyKey: 'workflow-123-attempt-1',
        },
      },
      create: expect.objectContaining({ orgId: 'org-a' }),
    }))
  })

  it('rejects usage for an unknown white-label tenant before writing', async () => {
    db.whiteLabelTenantProfile.findUnique.mockResolvedValue(null)
    await expect(recordTenantUsage('org-missing', {
      metric: 'AGENT_RUN',
      quantity: 1,
      unit: 'run',
      idempotencyKey: 'workflow-123-attempt-1',
    })).rejects.toMatchObject({ statusCode: 404 })
    expect(db.tenantUsageEvent.upsert).not.toHaveBeenCalled()
  })
})
