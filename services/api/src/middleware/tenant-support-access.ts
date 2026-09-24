import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../lib/prisma'

const db = prisma as any

declare module 'fastify' {
  interface FastifyRequest {
    tenantSupportAccess?: {
      sessionId: string
      orgId: string
      permissions: string[]
      expiresAt: Date
    }
  }
}

/**
 * Requires an active, time-bounded support session for an operation performed
 * inside a professional tenant. This is intentionally separate from platform
 * administration: being a Kealee admin does not itself authorize entry into a
 * customer's runtime context.
 */
export function requireTenantSupportAccess(permission: string) {
  return async function tenantSupportAccessGuard(request: FastifyRequest, reply: FastifyReply) {
    const user = (request as any).user
    const tenantId = (request.params as any)?.tenantId ?? request.headers['x-kealee-support-tenant-id']
    if (!user?.id || typeof tenantId !== 'string') {
      return reply.code(403).send({ error: 'Tenant support context is required' })
    }

    const role = String(user.role ?? '').toUpperCase()
    if (!['ADMIN', 'SUPER_ADMIN', 'PLATFORM_OWNER', 'OPS_ADMIN'].includes(role)) {
      return reply.code(403).send({ error: 'Platform administrator access is required' })
    }

    const now = new Date()
    const session = await db.tenantSupportAccessSession.findFirst({
      where: {
        orgId: tenantId,
        requestedById: user.id,
        status: 'ACTIVE',
        startsAt: { lte: now },
        expiresAt: { gt: now },
        OR: [
          { permissions: { has: permission } },
          { permissions: { has: 'TENANT_ADMIN' } },
        ],
      },
      orderBy: { expiresAt: 'desc' },
    })

    if (!session) {
      return reply.code(403).send({ error: `Active tenant support permission ${permission} is required` })
    }

    request.tenantSupportAccess = {
      sessionId: session.id,
      orgId: tenantId,
      permissions: session.permissions,
      expiresAt: session.expiresAt,
    }

    await db.tenantAuditEvent.create({
      data: {
        orgId: tenantId,
        actorUserId: user.id,
        actorType: 'PLATFORM_SUPPORT',
        action: 'SUPPORT_ACCESS_USED',
        resourceType: 'TENANT_SUPPORT_ACCESS',
        resourceId: session.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        metadata: { permission, method: request.method, route: request.routeOptions.url },
      },
    })
  }
}
