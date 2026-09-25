import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({
  whiteLabelTenantProfile: { findUnique: vi.fn() },
  tenantDataLifecycleRequest: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  tenantAuditEvent: { create: vi.fn() },
}))

vi.mock('../../../lib/prisma', () => ({ prisma: db }))

import { createTenantDataRequestSchema } from '../white-label.dto'
import {
  assertTenantDeletionConfirmation,
  createTenantDataRequest,
  getTenantDataExport,
} from '../white-label-data-lifecycle.service'

const actor = {
  userId: 'user-1',
  actorType: 'TENANT_ADMIN' as const,
  ipAddress: '127.0.0.1',
}

describe('white-label tenant data lifecycle', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    db.whiteLabelTenantProfile.findUnique.mockResolvedValue({ id: 'profile-1', status: 'ACTIVE' })
    db.tenantDataLifecycleRequest.findFirst.mockResolvedValue(null)
    db.tenantAuditEvent.create.mockResolvedValue({ id: 'audit-1' })
  })

  it('requires a bounded retention period only for retention-change requests', () => {
    expect(() => createTenantDataRequestSchema.parse({ requestType: 'RETENTION_CHANGE' })).toThrow()
    expect(createTenantDataRequestSchema.parse({
      requestType: 'RETENTION_CHANGE',
      requestedRetentionDays: 365,
      reason: 'Contract retention policy update',
    })).toMatchObject({ requestedRetentionDays: 365 })
    expect(() => createTenantDataRequestSchema.parse({
      requestType: 'DATA_DELETION',
      requestedRetentionDays: 30,
      reason: 'Delete the white-label control plane',
    })).toThrow()
  })

  it('auto-approves only a tenant administrator control-plane export', async () => {
    db.tenantDataLifecycleRequest.create.mockImplementation(async ({ data }: any) => ({ id: 'request-1', ...data }))
    const request = await createTenantDataRequest(
      'org-1',
      { requestType: 'DATA_EXPORT', exportExpiresInHours: 24, reason: 'Download our tenant configuration' },
      actor,
      { autoApproveTenantExport: true },
    )

    expect(request.status).toBe('APPROVED')
    expect(request.scope).toBeUndefined()
    expect(db.tenantDataLifecycleRequest.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ orgId: 'org-1', requestType: 'DATA_EXPORT', status: 'APPROVED' }),
    }))
    expect(db.tenantAuditEvent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ orgId: 'org-1', actorType: 'TENANT_ADMIN' }),
    }))
  })

  it('does not auto-approve destructive or retention-changing requests', async () => {
    db.tenantDataLifecycleRequest.create.mockImplementation(async ({ data }: any) => ({ id: 'request-2', ...data }))
    const request = await createTenantDataRequest(
      'org-1',
      { requestType: 'DATA_DELETION', reason: 'End our white-label tenant service' },
      actor,
      { autoApproveTenantExport: true },
    )
    expect(request.status).toBe('REQUESTED')
    expect(request.approvedById).toBeNull()
  })

  it('requires an exact tenant-specific confirmation before destructive deletion', () => {
    expect(() => assertTenantDeletionConfirmation('org-1', 'DELETE org-1')).toThrow(/exactly match/)
    expect(() => assertTenantDeletionConfirmation('org-1', 'DELETE WHITE-LABEL TENANT org-2')).toThrow()
    expect(() => assertTenantDeletionConfirmation('org-1', 'DELETE WHITE-LABEL TENANT org-1')).not.toThrow()
  })

  it('never returns another tenant export', async () => {
    db.tenantDataLifecycleRequest.findFirst.mockResolvedValue(null)
    await expect(getTenantDataExport('org-a', 'request-from-org-b')).rejects.toMatchObject({ statusCode: 404 })
    expect(db.tenantDataLifecycleRequest.findFirst).toHaveBeenCalledWith({
      where: { id: 'request-from-org-b', orgId: 'org-a', requestType: 'DATA_EXPORT' },
    })
  })
})
