import { FastifyInstance } from 'fastify'
import { entitlementService } from './entitlement.service'
import { authenticateUser } from '../auth/auth.middleware'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

export async function entitlementRoutes(fastify: FastifyInstance) {
  // POST /entitlements/orgs/:orgId/modules/:moduleKey/enable - Enable module
  fastify.post(
    '/orgs/:orgId/modules/:moduleKey/enable',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const { orgId, moduleKey } = request.params as {
          orgId: string
          moduleKey: string
        }
        const { expiresAt } = request.body as {
          expiresAt?: string
        }

        const entitlement = await entitlementService.enableModule(
          orgId,
          moduleKey,
          expiresAt ? new Date(expiresAt) : undefined
        )

        return reply.code(201).send({ entitlement })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to enable module'),
        })
      }
    }
  )

  // POST /entitlements/orgs/:orgId/modules/:moduleKey/disable - Disable module
  fastify.post(
    '/orgs/:orgId/modules/:moduleKey/disable',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const { orgId, moduleKey } = request.params as {
          orgId: string
          moduleKey: string
        }

        const entitlement = await entitlementService.disableModule(orgId, moduleKey)

        return reply.send({ entitlement })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to disable module'),
        })
      }
    }
  )

  // GET /entitlements/orgs/:orgId/modules/:moduleKey - Get entitlement
  fastify.get(
    '/orgs/:orgId/modules/:moduleKey',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const { orgId, moduleKey } = request.params as {
          orgId: string
          moduleKey: string
        }

        const entitlement = await entitlementService.getEntitlement(orgId, moduleKey)

        if (!entitlement) {
          return reply.code(404).send({
            error: 'Module entitlement not found',
          })
        }

        return reply.send({ entitlement })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to get entitlement'),
        })
      }
    }
  )

  // GET /entitlements/orgs/:orgId/modules/:moduleKey/status - Get entitlement status
  fastify.get(
    '/orgs/:orgId/modules/:moduleKey/status',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const { orgId, moduleKey } = request.params as {
          orgId: string
          moduleKey: string
        }

        const status = await entitlementService.getEntitlementStatus(orgId, moduleKey)

        return reply.send({ status })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to get entitlement status'),
        })
      }
    }
  )

  // GET /entitlements/orgs/:orgId - Get all entitlements for organization
  fastify.get(
    '/orgs/:orgId',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const { orgId } = request.params as { orgId: string }

        const entitlements = await entitlementService.getOrgEntitlements(orgId)

        return reply.send({ entitlements })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to get entitlements'),
        })
      }
    }
  )

  // GET /entitlements/orgs/:orgId/enabled - Get enabled modules for organization
  fastify.get(
    '/orgs/:orgId/enabled',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const { orgId } = request.params as { orgId: string }

        const modules = await entitlementService.getEnabledModules(orgId)

        return reply.send({ modules })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to get enabled modules'),
        })
      }
    }
  )

  // GET /entitlements/modules/:moduleKey/orgs - Get all orgs with module access
  fastify.get(
    '/modules/:moduleKey/orgs',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const { moduleKey } = request.params as { moduleKey: string }

        const entitlements = await entitlementService.getModuleOrgs(moduleKey)

        return reply.send({ entitlements })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to get organizations'),
        })
      }
    }
  )

  // PUT /entitlements/orgs/:orgId/modules/:moduleKey/expiration - Update expiration
  fastify.put(
    '/orgs/:orgId/modules/:moduleKey/expiration',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const { orgId, moduleKey } = request.params as {
          orgId: string
          moduleKey: string
        }
        const { expiresAt } = request.body as {
          expiresAt: string | null
        }

        const entitlement = await entitlementService.updateExpiration(
          orgId,
          moduleKey,
          expiresAt ? new Date(expiresAt) : null
        )

        return reply.send({ entitlement })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to update expiration'),
        })
      }
    }
  )

  // POST /entitlements/check - Check module access
  fastify.post(
    '/check',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const { orgId, moduleKey } = request.body as {
          orgId: string
          moduleKey: string
        }

        if (!orgId || !moduleKey) {
          return reply.code(400).send({
            error: 'Missing required fields: orgId, moduleKey',
          })
        }

        const hasAccess = await entitlementService.hasModuleAccess(orgId, moduleKey)
        const status = await entitlementService.getEntitlementStatus(orgId, moduleKey)

        return reply.send({
          ...status,
          hasAccess, // Override status.hasAccess with the direct value
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, 'Failed to check module access'),
        })
      }
    }
  )
}
