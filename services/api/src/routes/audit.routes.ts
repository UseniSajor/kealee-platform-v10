import { FastifyInstance, FastifyRequest } from 'fastify'
import { auditService } from '../modules/audit/audit.service'
import { authenticateUser } from '../middleware/auth.middleware'

// Helper to extract IP and user agent from request
function getRequestMetadata(request: FastifyRequest) {
  const ipAddress =
    (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    request.socket.remoteAddress ||
    'unknown'

  const userAgent = request.headers['user-agent'] || 'unknown'

  return { ipAddress, userAgent }
}

export async function auditRoutes(fastify: FastifyInstance) {
  // POST /audit - Record an audit log
  fastify.post(
    '/',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { action, entityType, entityId, reason, before, after } =
          request.body as {
            action: string
            entityType: string
            entityId: string
            reason?: string
            before?: any
            after?: any
          }

        if (!action || !entityType || !entityId) {
          return reply.code(400).send({
            error: 'Missing required fields: action, entityType, entityId',
          })
        }

        const { ipAddress, userAgent } = getRequestMetadata(request)

        const auditLog = await auditService.recordAudit({
          action,
          entityType,
          entityId,
          userId: user.id,
          reason,
          before,
          after,
          ipAddress,
          userAgent,
        })

        return reply.code(201).send({ auditLog })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to record audit log',
        })
      }
    }
  )

  // GET /audit - Get audit logs with filtering
  fastify.get('/', async (request, reply) => {
    try {
      const {
        action,
        entityType,
        entityId,
        userId,
        startDate,
        endDate,
        page,
        limit,
      } = request.query as {
        action?: string
        entityType?: string
        entityId?: string
        userId?: string
        startDate?: string
        endDate?: string
        page?: string
        limit?: string
      }

      const result = await auditService.getAuditLogs({
        action,
        entityType,
        entityId,
        userId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      })

      return reply.send(result)
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({
        error: error.message || 'Failed to get audit logs',
      })
    }
  })

  // GET /audit/:id - Get audit log by ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const auditLog = await auditService.getAuditById(id)
      return reply.send({ auditLog })
    } catch (error: any) {
      fastify.log.error(error)
      const statusCode = error.message === 'Audit log not found' ? 404 : 500
      return reply.code(statusCode).send({
        error: error.message || 'Failed to get audit log',
      })
    }
  })

  // GET /audit/entity/:entityType/:entityId - Get audit trail for an entity
  fastify.get('/entity/:entityType/:entityId', async (request, reply) => {
    try {
      const { entityType, entityId } = request.params as {
        entityType: string
        entityId: string
      }

      const auditLogs = await auditService.getEntityAuditTrail(
        entityType,
        entityId
      )

      return reply.send({ auditLogs })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({
        error: error.message || 'Failed to get entity audit trail',
      })
    }
  })

  // GET /audit/user/:userId - Get audit logs for a user
  fastify.get('/user/:userId', async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string }
      const { limit } = request.query as { limit?: string }

      const auditLogs = await auditService.getUserAuditLogs(
        userId,
        limit ? { limit: parseInt(limit) } : undefined
      )

      return reply.send({ auditLogs })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({
        error: error.message || 'Failed to get user audit logs',
      })
    }
  })

  // TODO: getAuditLogsByAction does not exist on AuditService — comment out until implemented
  // GET /audit/action/:action - Get audit logs by action
  // fastify.get('/action/:action', async (request, reply) => {
  //   try {
  //     const { action } = request.params as { action: string }
  //     const { limit } = request.query as { limit?: string }
  //
  //     const auditLogs = await auditService.getAuditLogsByAction(
  //       action,
  //       limit ? parseInt(limit) : undefined
  //     )
  //
  //     return reply.send({ auditLogs })
  //   } catch (error: any) {
  //     fastify.log.error(error)
  //     return reply.code(500).send({
  //       error: error.message || 'Failed to get audit logs by action',
  //     })
  //   }
  // })

  // TODO: getPrivilegedActions does not exist on AuditService — comment out until implemented
  // GET /audit/privileged - Get privileged actions
  // fastify.get(
  //   '/privileged',
  //   { preHandler: authenticateUser },
  //   async (request, reply) => {
  //     try {
  //       const { userId, startDate, endDate } = request.query as {
  //         userId?: string
  //         startDate?: string
  //         endDate?: string
  //       }
  //
  //       const auditLogs = await auditService.getPrivilegedActions({
  //         userId,
  //         startDate: startDate ? new Date(startDate) : undefined,
  //         endDate: endDate ? new Date(endDate) : undefined,
  //       })
  //
  //       return reply.send({ auditLogs })
  //     } catch (error: any) {
  //       fastify.log.error(error)
  //       return reply.code(500).send({
  //         error: error.message || 'Failed to get privileged actions',
  //       })
  //     }
  //   }
  // )

  // GET /audit/stats - Get audit statistics
  // NOTE: Service method is getStats(), not getAuditStats()
  fastify.get(
    '/stats',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const { startDate, endDate } = request.query as {
          startDate?: string
          endDate?: string
        }

        const stats = await auditService.getStats({
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        })

        return reply.send({ stats })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to get audit stats',
        })
      }
    }
  )

  // TODO: isPrivilegedAction does not exist on AuditService — comment out until implemented
  // GET /audit/check/:action - Check if action is privileged
  // fastify.get('/check/:action', async (request, reply) => {
  //   try {
  //     const { action } = request.params as { action: string }
  //     const isPrivileged = auditService.isPrivilegedAction(action)
  //
  //     return reply.send({
  //       action,
  //       isPrivileged,
  //       requiresReason: isPrivileged,
  //     })
  //   } catch (error: any) {
  //     fastify.log.error(error)
  //     return reply.code(500).send({
  //       error: error.message || 'Failed to check action',
  //     })
  //   }
  // })
}
