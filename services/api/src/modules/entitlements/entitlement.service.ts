import { prismaAny } from '../../utils/prisma-helper'

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
    const entitlement = await prismaAny.moduleEntitlement.findUnique({
      where: {
        orgId_moduleKey: {
          orgId,
          moduleKey,
        },
      },
    })

    if (!entitlement) {
      return false
    }

    if (!entitlement.enabled) {
      return false
    }

    // Check if expired
    if (entitlement.expiresAt && entitlement.expiresAt < new Date()) {
      return false
    }

    return true
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

    return entitlements
  }

  // Check if any of the modules are enabled
  async hasAnyModuleAccess(orgId: string, moduleKeys: string[]): Promise<boolean> {
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
    const entitlement = await this.getEntitlement(orgId, moduleKey)

    if (!entitlement) {
      return {
        hasAccess: false,
        enabled: false,
        expired: false,
        expiresAt: null,
      }
    }

    const isExpired = entitlement.expiresAt
      ? entitlement.expiresAt < new Date()
      : false

    const hasAccess = entitlement.enabled && !isExpired

    return {
      hasAccess,
      enabled: entitlement.enabled,
      expired: isExpired,
      expiresAt: entitlement.expiresAt,
      enabledAt: entitlement.enabledAt,
      disabledAt: entitlement.disabledAt,
    }
  }
}

export const entitlementService = new EntitlementService()
