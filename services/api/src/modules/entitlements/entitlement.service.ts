import { prismaAny } from '../../utils/prisma-helper'
import {
  evaluateTenantPlatformAccess,
  type TenantPlatformAccessDecision,
} from '../billing/tenant-entitlement.service'

export type ModuleAccessReason =
  | TenantPlatformAccessDecision['reason']
  | 'MODULE_NOT_ENABLED'
  | 'MODULE_EXPIRED'

export interface ModuleAccessDecision extends Omit<TenantPlatformAccessDecision, 'reason'> {
  hasAccess: boolean
  moduleKey: string
  reason: ModuleAccessReason
  moduleEnabled: boolean
  moduleExpiresAt: Date | null
}

export class EntitlementService {
  // Enable a module for an organization
  async enableModule(
    orgId: string,
    moduleKey: string,
    expiresAt?: Date
  ) {
    const entitlement = await prismaAny.moduleEntitlement.upsert({
      where: {
        orgId_moduleKey: {
          orgId,
          moduleKey,
        },
      },
      create: {
        orgId,
        moduleKey,
        enabled: true,
        enabledAt: new Date(),
        expiresAt,
      },
      update: {
        enabled: true,
        enabledAt: new Date(),
        disabledAt: null,
        expiresAt,
      },
    })

    return entitlement
  }

  // Disable a module for an organization
  async disableModule(orgId: string, moduleKey: string) {
    const entitlement = await prismaAny.moduleEntitlement.update({
      where: {
        orgId_moduleKey: {
          orgId,
          moduleKey,
        },
      },
      data: {
        enabled: false,
        disabledAt: new Date(),
      },
    })

    return entitlement
  }

  // Get module entitlement
  async getEntitlement(orgId: string, moduleKey: string) {
    const entitlement = await prismaAny.moduleEntitlement.findUnique({
      where: {
        orgId_moduleKey: {
          orgId,
          moduleKey,
        },
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    return entitlement
  }

  // Check if organization has access to a module
  async hasModuleAccess(orgId: string, moduleKey: string): Promise<boolean> {
    return (await this.getModuleAccessDecision(orgId, moduleKey)).hasAccess
  }

  /** White-label access is the intersection of an active professional tenant
   * plan and an enabled, unexpired module entitlement. */
  async getModuleAccessDecision(orgId: string, moduleKey: string): Promise<ModuleAccessDecision> {
    const platformAccess = await evaluateTenantPlatformAccess(orgId)
    if (!platformAccess.allowed) {
      return {
        ...platformAccess,
        hasAccess: false,
        moduleKey,
        reason: platformAccess.reason,
        moduleEnabled: false,
        moduleExpiresAt: null,
      }
    }

    const entitlement = await prismaAny.moduleEntitlement.findUnique({
      where: {
        orgId_moduleKey: {
          orgId,
          moduleKey,
        },
      },
    })

    if (!entitlement) {
      return {
        ...platformAccess,
        hasAccess: false,
        moduleKey,
        reason: 'MODULE_NOT_ENABLED',
        moduleEnabled: false,
        moduleExpiresAt: null,
      }
    }

    if (!entitlement.enabled) {
      return {
        ...platformAccess,
        hasAccess: false,
        moduleKey,
        reason: 'MODULE_NOT_ENABLED',
        moduleEnabled: false,
        moduleExpiresAt: entitlement.expiresAt,
      }
    }

    // Check if expired
    if (entitlement.expiresAt && entitlement.expiresAt < new Date()) {
      return {
        ...platformAccess,
        hasAccess: false,
        moduleKey,
        reason: 'MODULE_EXPIRED',
        moduleEnabled: true,
        moduleExpiresAt: entitlement.expiresAt,
      }
    }

    return {
      ...platformAccess,
      hasAccess: true,
      moduleKey,
      reason: platformAccess.reason,
      moduleEnabled: true,
      moduleExpiresAt: entitlement.expiresAt,
    }
  }

  // Get all entitlements for an organization
  async getOrgEntitlements(orgId: string) {
    const entitlements = await prismaAny.moduleEntitlement.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    })

    return entitlements
  }

  // Get all organizations with access to a module
  async getModuleOrgs(moduleKey: string) {
    const entitlements = await prismaAny.moduleEntitlement.findMany({
      where: {
        moduleKey,
        enabled: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        org: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    })

    const decisions = await Promise.all(
      entitlements.map((entitlement: any) => evaluateTenantPlatformAccess(entitlement.orgId))
    )
    return entitlements.filter((_entitlement: any, index: number) => decisions[index].allowed)
  }

  // Check if any of the modules are enabled
  async hasAnyModuleAccess(orgId: string, moduleKeys: string[]): Promise<boolean> {
    const platformAccess = await evaluateTenantPlatformAccess(orgId)
    if (!platformAccess.allowed) return false
    const entitlements = await prismaAny.moduleEntitlement.findMany({
      where: {
        orgId,
        moduleKey: {
          in: moduleKeys,
        },
        enabled: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    })

    return entitlements.length > 0
  }

  // Get enabled modules for an organization
  async getEnabledModules(orgId: string) {
    const platformAccess = await evaluateTenantPlatformAccess(orgId)
    if (!platformAccess.allowed) return []
    const entitlements = await prismaAny.moduleEntitlement.findMany({
      where: {
        orgId,
        enabled: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { moduleKey: 'asc' },
    })

    return entitlements.map((e: any) => e.moduleKey)
  }

  // Update expiration date
  async updateExpiration(orgId: string, moduleKey: string, expiresAt: Date | null) {
    const entitlement = await prismaAny.moduleEntitlement.update({
      where: {
        orgId_moduleKey: {
          orgId,
          moduleKey,
        },
      },
      data: {
        expiresAt,
      },
    })

    return entitlement
  }

  // Get entitlement status (with expiration check)
  async getEntitlementStatus(orgId: string, moduleKey: string) {
    const [entitlement, access] = await Promise.all([
      this.getEntitlement(orgId, moduleKey),
      this.getModuleAccessDecision(orgId, moduleKey),
    ])

    if (!entitlement) {
      return {
        hasAccess: false,
        enabled: false,
        expired: false,
        expiresAt: null,
        reason: access.reason,
        billingStatus: access.billingStatus,
      }
    }

    const isExpired = entitlement.expiresAt
      ? entitlement.expiresAt < new Date()
      : false

    return {
      hasAccess: access.hasAccess,
      enabled: entitlement.enabled,
      expired: isExpired,
      expiresAt: entitlement.expiresAt,
      enabledAt: entitlement.enabledAt,
      disabledAt: entitlement.disabledAt,
      reason: access.reason,
      billingStatus: access.billingStatus,
    }
  }
}

export const entitlementService = new EntitlementService()
