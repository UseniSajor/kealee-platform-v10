import { FastifyRequest, FastifyReply } from 'fastify'
import { entitlementService } from './entitlement.service'

/**
 * Middleware to check if organization has access to a module
 * Usage: preHandler: requireModuleAccess('m-ops-services', 'orgId')
 */
export function requireModuleAccess(
  moduleKey: string,
  orgIdParam: string = 'orgId'
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user
      if (!user) {
        return reply.code(401).send({
          error: 'Authentication required',
        })
      }

      // Get orgId from params, query, or body
      const orgId =
        (request.params as any)?.[orgIdParam] ||
        (request.query as any)?.[orgIdParam] ||
        (request.body as any)?.[orgIdParam]

      if (!orgId) {
        return reply.code(400).send({
          error: `Organization ID (${orgIdParam}) is required`,
        })
      }

      const hasAccess = await entitlementService.hasModuleAccess(orgId, moduleKey)

      if (!hasAccess) {
        return reply.code(403).send({
          error: `Module access denied: ${moduleKey}. This module is not enabled for your organization.`,
        })
      }

      // Attach orgId and moduleKey to request
      ;(request as any).orgId = orgId
      ;(request as any).moduleKey = moduleKey
    } catch (error: any) {
      return reply.code(500).send({
        error: error.message || 'Module access check failed',
      })
    }
  }
}

/**
 * Middleware to check if organization has access to any of the specified modules
 * Usage: preHandler: requireAnyModuleAccess(['m-ops-services', 'm-marketplace'], 'orgId')
 */
export function requireAnyModuleAccess(
  moduleKeys: string[],
  orgIdParam: string = 'orgId'
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user
      if (!user) {
        return reply.code(401).send({
          error: 'Authentication required',
        })
      }

      const orgId =
        (request.params as any)?.[orgIdParam] ||
        (request.query as any)?.[orgIdParam] ||
        (request.body as any)?.[orgIdParam]

      if (!orgId) {
        return reply.code(400).send({
          error: `Organization ID (${orgIdParam}) is required`,
        })
      }

      const hasAccess = await entitlementService.hasAnyModuleAccess(
        orgId,
        moduleKeys
      )

      if (!hasAccess) {
        return reply.code(403).send({
          error: `Module access denied: requires one of [${moduleKeys.join(', ')}]`,
        })
      }

      ;(request as any).orgId = orgId
    } catch (error: any) {
      return reply.code(500).send({
        error: error.message || 'Module access check failed',
      })
    }
  }
}
