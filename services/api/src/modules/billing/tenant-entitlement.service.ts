import { prismaAny } from '../../utils/prisma-helper'

const ACTIVE_BILLING_STATUSES = new Set(['ACTIVE', 'TRIALING'])

export type TenantPlatformAccessReason =
  | 'DIRECT_ORGANIZATION'
  | 'TENANT_ACCESS_ACTIVE'
  | 'ORGANIZATION_NOT_FOUND'
  | 'ORGANIZATION_INACTIVE'
  | 'TENANT_PROFILE_MISSING'
  | 'TENANT_PROFILE_INACTIVE'
  | 'TENANT_PLAN_MISSING'
  | 'TENANT_BILLING_INACTIVE'
  | 'TENANT_BILLING_PERIOD_EXPIRED'

export interface TenantPlatformAccessDecision {
  allowed: boolean
  managedByTenantPlan: boolean
  reason: TenantPlatformAccessReason
  billingStatus?: string
  currentPeriodEnd?: Date | null
}

/**
 * Determines whether an organization may use its licensed white-label
 * platform. Only WHITE_LABEL organizations are governed by TenantPlan. This
 * deliberately leaves Kealee's direct/homeowner purchases and project billing
 * on their existing, separate authorization paths.
 */
export async function evaluateTenantPlatformAccess(
  orgId: string,
  now = new Date(),
): Promise<TenantPlatformAccessDecision> {
  const org = await prismaAny.org.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      status: true,
      tenantKind: true,
      whiteLabelProfile: { select: { status: true } },
      whiteLabelPlan: {
        select: {
          billingStatus: true,
          currentPeriodEnd: true,
        },
      },
    },
  })

  if (!org) {
    return { allowed: false, managedByTenantPlan: true, reason: 'ORGANIZATION_NOT_FOUND' }
  }

  // A direct Kealee organization is never granted access by a white-label
  // subscription. Its project and homeowner commerce remains independent.
  if (org.tenantKind !== 'WHITE_LABEL') {
    return { allowed: true, managedByTenantPlan: false, reason: 'DIRECT_ORGANIZATION' }
  }

  if (String(org.status).toUpperCase() !== 'ACTIVE') {
    return { allowed: false, managedByTenantPlan: true, reason: 'ORGANIZATION_INACTIVE' }
  }

  if (!org.whiteLabelProfile) {
    return { allowed: false, managedByTenantPlan: true, reason: 'TENANT_PROFILE_MISSING' }
  }

  if (String(org.whiteLabelProfile.status).toUpperCase() !== 'ACTIVE') {
    return { allowed: false, managedByTenantPlan: true, reason: 'TENANT_PROFILE_INACTIVE' }
  }

  if (!org.whiteLabelPlan) {
    return { allowed: false, managedByTenantPlan: true, reason: 'TENANT_PLAN_MISSING' }
  }

  const billingStatus = String(org.whiteLabelPlan.billingStatus).toUpperCase()
  if (!ACTIVE_BILLING_STATUSES.has(billingStatus)) {
    return {
      allowed: false,
      managedByTenantPlan: true,
      reason: 'TENANT_BILLING_INACTIVE',
      billingStatus,
      currentPeriodEnd: org.whiteLabelPlan.currentPeriodEnd,
    }
  }

  const currentPeriodEnd = org.whiteLabelPlan.currentPeriodEnd
    ? new Date(org.whiteLabelPlan.currentPeriodEnd)
    : null
  if (currentPeriodEnd && currentPeriodEnd.getTime() <= now.getTime()) {
    return {
      allowed: false,
      managedByTenantPlan: true,
      reason: 'TENANT_BILLING_PERIOD_EXPIRED',
      billingStatus,
      currentPeriodEnd,
    }
  }

  return {
    allowed: true,
    managedByTenantPlan: true,
    reason: 'TENANT_ACCESS_ACTIVE',
    billingStatus,
    currentPeriodEnd,
  }
}

export function isTenantBillingStatusEntitled(status: string | null | undefined): boolean {
  return ACTIVE_BILLING_STATUSES.has(String(status || '').toUpperCase())
}
