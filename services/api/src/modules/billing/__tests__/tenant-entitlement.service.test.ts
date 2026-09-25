import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({
  org: { findUnique: vi.fn() },
  moduleEntitlement: { findUnique: vi.fn(), findMany: vi.fn() },
}))

vi.mock('../../../utils/prisma-helper', () => ({ prismaAny: db }))

import { evaluateTenantPlatformAccess } from '../tenant-entitlement.service'
import { EntitlementService } from '../../entitlements/entitlement.service'

const service = new EntitlementService()

function whiteLabelOrg(overrides: Record<string, unknown> = {}) {
  return {
    id: 'org-pro',
    status: 'ACTIVE',
    tenantKind: 'WHITE_LABEL',
    whiteLabelProfile: { status: 'ACTIVE' },
    whiteLabelPlan: {
      billingStatus: 'ACTIVE',
      currentPeriodEnd: new Date('2030-02-01T00:00:00.000Z'),
    },
    ...overrides,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  db.moduleEntitlement.findUnique.mockResolvedValue({
    enabled: true,
    expiresAt: null,
  })
})

describe('white-label tenant platform access', () => {
  it('does not apply white-label subscription billing to direct/homeowner organizations', async () => {
    db.org.findUnique.mockResolvedValue({
      id: 'org-direct',
      status: 'ACTIVE',
      tenantKind: 'KEALEE_DIRECT',
      whiteLabelProfile: null,
      whiteLabelPlan: null,
    })

    await expect(service.hasModuleAccess('org-direct', 'PROJECTS')).resolves.toBe(true)
  })

  it('fails closed when a professional tenant has no plan', async () => {
    db.org.findUnique.mockResolvedValue(whiteLabelOrg({ whiteLabelPlan: null }))

    const decision = await service.getModuleAccessDecision('org-pro', 'PROJECTS')
    expect(decision).toMatchObject({ hasAccess: false, reason: 'TENANT_PLAN_MISSING' })
    expect(db.moduleEntitlement.findUnique).not.toHaveBeenCalled()
  })

  it.each(['PAST_DUE', 'UNPAID', 'CANCELED', 'PRICE_MISMATCH', 'UNKNOWN'])(
    'fails closed for %s billing',
    async (billingStatus) => {
      db.org.findUnique.mockResolvedValue(whiteLabelOrg({
        whiteLabelPlan: { billingStatus, currentPeriodEnd: null },
      }))

      await expect(service.hasModuleAccess('org-pro', 'PROJECTS')).resolves.toBe(false)
      expect(db.moduleEntitlement.findUnique).not.toHaveBeenCalled()
    },
  )

  it('fails closed after the paid period ends', async () => {
    db.org.findUnique.mockResolvedValue(whiteLabelOrg({
      whiteLabelPlan: {
        billingStatus: 'ACTIVE',
        currentPeriodEnd: new Date('2025-01-01T00:00:00.000Z'),
      },
    }))

    const result = await evaluateTenantPlatformAccess('org-pro', new Date('2025-01-02T00:00:00.000Z'))
    expect(result).toMatchObject({ allowed: false, reason: 'TENANT_BILLING_PERIOD_EXPIRED' })
  })

  it('requires both active tenant billing and an enabled module', async () => {
    db.org.findUnique.mockResolvedValue(whiteLabelOrg())
    db.moduleEntitlement.findUnique.mockResolvedValue({
      enabled: false,
      expiresAt: null,
    })

    const decision = await service.getModuleAccessDecision('org-pro', 'PROJECTS')
    expect(decision).toMatchObject({
      hasAccess: false,
      managedByTenantPlan: true,
      reason: 'MODULE_NOT_ENABLED',
    })
  })

  it('allows an enabled module for an active paid professional tenant', async () => {
    db.org.findUnique.mockResolvedValue(whiteLabelOrg())

    const decision = await service.getModuleAccessDecision('org-pro', 'PROJECTS')
    expect(decision).toMatchObject({
      hasAccess: true,
      managedByTenantPlan: true,
      reason: 'TENANT_ACCESS_ACTIVE',
    })
  })
})
