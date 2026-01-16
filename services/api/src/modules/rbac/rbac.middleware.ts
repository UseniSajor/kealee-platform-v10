import { FastifyRequest, FastifyReply } from 'fastify'
import { rbacService } from './rbac.service'

/**
 * Middleware to check if user has a specific permission in an organization
 * Usage: preHandler: requirePermission('create_project', 'orgId')
 */
export function requirePermission(
  permissionKey: string,
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

      const hasPermission = await rbacService.userHasPermission(
        user.id,
        orgId,
        permissionKey
      )

      if (!hasPermission) {
        return reply.code(403).send({
          error: `Permission denied: ${permissionKey}`,
        })
      }

      // Attach orgId to request for use in route handlers
      ;(request as any).orgId = orgId
    } catch (error: any) {
      return reply.code(500).send({
        error: error.message || 'Permission check failed',
      })
    }
  }
}

/**
 * Middleware to check if user has any of the specified permissions
 * Usage: preHandler: requireAnyPermission(['create_project', 'edit_project'], 'orgId')
 */
export function requireAnyPermission(
  permissionKeys: string[],
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

      const hasPermission = await rbacService.userHasAnyPermission(
        user.id,
        orgId,
        permissionKeys
      )

      if (!hasPermission) {
        return reply.code(403).send({
          error: `Permission denied: requires one of [${permissionKeys.join(', ')}]`,
        })
      }

      ;(request as any).orgId = orgId
    } catch (error: any) {
      return reply.code(500).send({
        error: error.message || 'Permission check failed',
      })
    }
  }
}

/**
 * Middleware to check if user is a member of the organization
 * Usage: preHandler: requireOrgMember('orgId')
 */
export function requireOrgMember(orgIdParam: string = 'orgId') {
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

      const membership = await rbacService.getUserRole(user.id, orgId)

      if (!membership) {
        return reply.code(403).send({
          error: 'User is not a member of this organization',
        })
      }

      // Attach membership info to request
      ;(request as any).orgId = orgId
      ;(request as any).orgMembership = membership
    } catch (error: any) {
      return reply.code(500).send({
        error: error.message || 'Organization membership check failed',
      })
    }
  }
}
