/**
 * Centralized Authorization Service
 * Handles all permission checks for Clerk + Kealee database
 */

import { PrismaClient } from '@kealee/database'

const prisma = new PrismaClient()

export interface AuthorizationContext {
  clerkUserId: string
  orgId?: string
  projectId?: string
}

export interface AuditLogEntry {
  action: string
  userId: string
  orgId?: string
  projectId?: string
  result: 'ALLOWED' | 'DENIED'
  reason?: string
  timestamp: Date
}

// In-memory audit log (can upgrade to DB)
const auditLog: AuditLogEntry[] = []

/**
 * Verify user exists in Kealee database via Clerk ID
 */
export async function requireAuthenticatedUser(clerkUserId: string) {
  if (!clerkUserId) {
    throw new Error('Not authenticated')
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
  })

  if (!user || user.status !== 'ACTIVE') {
    throw new Error('User not found or inactive')
  }

  return user
}

/**
 * Check if user is member of organization
 */
export async function requireOrganizationMember(clerkUserId: string, orgId: string) {
  const user = await requireAuthenticatedUser(clerkUserId)

  const membership = await prisma.orgMember.findFirst({
    where: {
      userId: user.id,
      orgId,
    },
  })

  if (!membership) {
    logAudit({
      action: 'ORG_ACCESS_DENIED',
      userId: user.id,
      orgId,
      result: 'DENIED',
      reason: 'User not member of organization',
    })
    throw new Error('Not authorized to access this organization')
  }

  return membership
}

/**
 * Check if user has specific role in organization
 */
export async function requireOrganizationRole(
  clerkUserId: string,
  orgId: string,
  allowedRoles: string[] | Set<string>,
) {
  const membership = await requireOrganizationMember(clerkUserId, orgId)
  const user = await prisma.user.findUnique({ where: { clerkUserId } })

  const roles = Array.isArray(allowedRoles) ? new Set(allowedRoles) : allowedRoles
  const hasRole = roles.has(membership.roleKey.toUpperCase())

  if (!hasRole) {
    logAudit({
      action: 'ORG_ROLE_DENIED',
      userId: user!.id,
      orgId,
      result: 'DENIED',
      reason: `User role ${membership.roleKey} not in ${Array.from(roles).join(', ')}`,
    })
    throw new Error('Insufficient permissions for this action')
  }

  return membership
}

/**
 * Check if user can access a specific project
 */
export async function requireProjectAccess(clerkUserId: string, projectId: string) {
  const user = await requireAuthenticatedUser(clerkUserId)

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { org: true },
  })

  if (!project) {
    throw new Error('Project not found')
  }

  // Check org membership
  const membership = await prisma.orgMember.findFirst({
    where: {
      userId: user.id,
      orgId: project.orgId,
    },
  })

  if (!membership) {
    logAudit({
      action: 'PROJECT_ACCESS_DENIED',
      userId: user.id,
      projectId,
      orgId: project.orgId,
      result: 'DENIED',
      reason: 'User not member of project organization',
    })
    throw new Error('Not authorized to access this project')
  }

  return { project, membership }
}

/**
 * Check platform admin (super_admin, operations_admin, etc.)
 */
export async function requirePlatformAdmin(clerkUserId: string, requiredRole?: string) {
  const user = await requireAuthenticatedUser(clerkUserId)
  const platformAdminRoles = new Set(['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN', 'PERMIT_ADMIN'])

  const userRole = (user.role || '').toUpperCase()

  if (!platformAdminRoles.has(userRole)) {
    logAudit({
      action: 'ADMIN_ACCESS_DENIED',
      userId: user.id,
      result: 'DENIED',
      reason: `User role ${user.role} not in admin roles`,
    })
    throw new Error('Admin access required')
  }

  if (requiredRole && userRole !== requiredRole.toUpperCase()) {
    logAudit({
      action: 'ADMIN_ROLE_DENIED',
      userId: user.id,
      result: 'DENIED',
      reason: `Required role ${requiredRole}, user has ${user.role}`,
    })
    throw new Error(`${requiredRole} role required`)
  }

  return user
}

/**
 * Generic resource access check
 */
export async function canAccessResource(
  clerkUserId: string,
  resourceId: string,
  resourceType: 'project' | 'estimate' | 'property' | 'org',
): Promise<boolean> {
  try {
    const user = await requireAuthenticatedUser(clerkUserId)

    switch (resourceType) {
      case 'project':
        await requireProjectAccess(clerkUserId, resourceId)
        return true

      case 'estimate':
        const estimate = await prisma.estimate.findUnique({
          where: { id: resourceId },
          include: { project: { include: { org: true } } },
        })
        if (!estimate) return false
        await requireOrganizationMember(clerkUserId, estimate.project.orgId)
        return true

      case 'property':
        const property = await prisma.property.findUnique({
          where: { id: resourceId },
        })
        if (!property) return false
        await requireOrganizationMember(clerkUserId, property.orgId)
        return true

      case 'org':
        await requireOrganizationMember(clerkUserId, resourceId)
        return true

      default:
        return false
    }
  } catch (error) {
    return false
  }
}

/**
 * Audit logging
 */
function logAudit(entry: Omit<AuditLogEntry, 'timestamp'>) {
  const auditEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date(),
  }

  // Log to console (production: send to external service)
  console.log('[AUDIT]', JSON.stringify(auditEntry))

  // Store in memory (limit to 10000 entries)
  auditLog.push(auditEntry)
  if (auditLog.length > 10000) {
    auditLog.shift()
  }
}

/**
 * Get audit log (for debugging)
 */
export function getAuditLog(options?: { limit?: number; filter?: (entry: AuditLogEntry) => boolean }): AuditLogEntry[] {
  let logs = auditLog
  if (options?.filter) {
    logs = logs.filter(options.filter)
  }
  const limit = options?.limit || 100
  return logs.slice(-limit)
}

/**
 * Clear audit log (admin only)
 */
export function clearAuditLog() {
  auditLog.length = 0
}
