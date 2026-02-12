/**
 * Security Routes
 * API endpoints for SecurityAuditLog, SecurityEvent, SecurityAlert,
 * UserSession, and AccessLog management.
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@kealee/database'
import { authenticateUser, requireAdmin } from '../../middleware/auth.middleware'
import { validateQuery, validateParams, validateBody } from '../../middleware/validation.middleware'

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
})

const auditLogQuerySchema = paginationSchema.extend({
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  eventType: z.enum(['API_ACCESS', 'AUTHENTICATION', 'AUTHORIZATION', 'DATA_ACCESS', 'CONFIG_CHANGE']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

const securityEventQuerySchema = paginationSchema.extend({
  type: z.string().optional(),
  severity: z.string().optional(),
  userId: z.string().uuid().optional(),
})

const securityAlertQuerySchema = paginationSchema.extend({
  status: z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED']).optional(),
  severity: z.string().optional(),
  alertType: z.string().optional(),
})

const updateAlertSchema = z.object({
  status: z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED']),
  resolution: z.string().optional(),
})

const sessionQuerySchema = paginationSchema.extend({
  userId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
})

const accessLogQuerySchema = paginationSchema.extend({
  userId: z.string().uuid().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  action: z.enum(['VIEW', 'DOWNLOAD', 'EXPORT', 'PRINT', 'SHARE', 'DELETE']).optional(),
})

const idParamsSchema = z.object({
  id: z.string().uuid(),
})

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function securityRoutes(fastify: FastifyInstance) {
  // All security routes require admin authentication
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply);
    await requireAdmin(request, reply);
  });

  // ========================================================================
  // SECURITY AUDIT LOGS
  // ========================================================================

  /**
   * GET /audit-logs
   * List security audit logs with filtering and pagination.
   */
  fastify.get(
    '/audit-logs',
    { preHandler: [validateQuery(auditLogQuerySchema)] },
    async (request, reply) => {
      try {
        const {
          page, limit, userId, action, eventType, severity, startDate, endDate,
        } = request.query as z.infer<typeof auditLogQuerySchema>

        const where: any = {}
        if (userId) where.userId = userId
        if (action) where.method = action
        if (eventType) where.eventType = eventType
        if (severity) where.severity = severity
        if (startDate || endDate) {
          where.timestamp = {}
          if (startDate) where.timestamp.gte = startDate
          if (endDate) where.timestamp.lte = endDate
        }

        const skip = (page - 1) * limit

        const [logs, total] = await Promise.all([
          prisma.securityAuditLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            skip,
            take: limit,
          }),
          prisma.securityAuditLog.count({ where }),
        ])

        return reply.send({
          success: true,
          data: logs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to fetch security audit logs',
        })
      }
    },
  )

  // ========================================================================
  // SECURITY EVENTS
  // ========================================================================

  /**
   * GET /events
   * List security events with filtering.
   */
  fastify.get(
    '/events',
    { preHandler: [validateQuery(securityEventQuerySchema)] },
    async (request, reply) => {
      try {
        const { page, limit, type, severity, userId } =
          request.query as z.infer<typeof securityEventQuerySchema>

        const where: any = {}
        if (type) where.eventType = type
        if (severity) where.severity = severity
        if (userId) where.userId = userId

        const skip = (page - 1) * limit

        const [events, total] = await Promise.all([
          prisma.securityEvent.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.securityEvent.count({ where }),
        ])

        return reply.send({
          success: true,
          data: events,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to fetch security events',
        })
      }
    },
  )

  // ========================================================================
  // SECURITY ALERTS
  // ========================================================================

  /**
   * GET /alerts
   * List security alerts with optional status filter.
   */
  fastify.get(
    '/alerts',
    { preHandler: [validateQuery(securityAlertQuerySchema)] },
    async (request, reply) => {
      try {
        const { page, limit, status, severity, alertType } =
          request.query as z.infer<typeof securityAlertQuerySchema>

        const where: any = {}
        if (status) where.status = status
        if (severity) where.severity = severity
        if (alertType) where.alertType = alertType

        const skip = (page - 1) * limit

        const [alerts, total] = await Promise.all([
          prisma.securityAlert.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.securityAlert.count({ where }),
        ])

        return reply.send({
          success: true,
          data: alerts,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to fetch security alerts',
        })
      }
    },
  )

  /**
   * PATCH /alerts/:id
   * Update a security alert status (resolve, acknowledge, dismiss).
   */
  fastify.patch(
    '/alerts/:id',
    {
      preHandler: [
        validateParams(idParamsSchema),
        validateBody(updateAlertSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as z.infer<typeof idParamsSchema>
        const body = request.body as z.infer<typeof updateAlertSchema>
        const user = (request as any).user as { id: string }

        const existing = await prisma.securityAlert.findUnique({ where: { id } })
        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Security alert not found',
          })
        }

        const updateData: any = { status: body.status }
        if (body.status === 'RESOLVED') {
          updateData.resolvedBy = user.id
          updateData.resolvedAt = new Date()
        }

        const updated = await prisma.securityAlert.update({
          where: { id },
          data: updateData,
        })

        return reply.send({ success: true, data: updated })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to update security alert',
        })
      }
    },
  )

  // ========================================================================
  // USER SESSIONS
  // ========================================================================

  /**
   * GET /sessions
   * List user sessions with optional filters.
   */
  fastify.get(
    '/sessions',
    { preHandler: [validateQuery(sessionQuerySchema)] },
    async (request, reply) => {
      try {
        const { page, limit, userId, isActive } =
          request.query as z.infer<typeof sessionQuerySchema>

        const where: any = {}
        if (userId) where.userId = userId
        if (isActive !== undefined) where.isActive = isActive

        const skip = (page - 1) * limit

        const [sessions, total] = await Promise.all([
          prisma.userSession.findMany({
            where,
            orderBy: { lastActivity: 'desc' },
            skip,
            take: limit,
            select: {
              id: true,
              userId: true,
              ipAddress: true,
              userAgent: true,
              expiresAt: true,
              lastActivity: true,
              isActive: true,
              isRevoked: true,
              createdAt: true,
              updatedAt: true,
              // Exclude sensitive tokens (sessionToken, refreshToken)
            },
          }),
          prisma.userSession.count({ where }),
        ])

        return reply.send({
          success: true,
          data: sessions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to fetch sessions',
        })
      }
    },
  )

  /**
   * DELETE /sessions/:id
   * Terminate (revoke) a user session.
   */
  fastify.delete(
    '/sessions/:id',
    { preHandler: [validateParams(idParamsSchema)] },
    async (request, reply) => {
      try {
        const { id } = request.params as z.infer<typeof idParamsSchema>

        const session = await prisma.userSession.findUnique({ where: { id } })
        if (!session) {
          return reply.code(404).send({
            success: false,
            error: 'Session not found',
          })
        }

        await prisma.userSession.update({
          where: { id },
          data: {
            isActive: false,
            isRevoked: true,
          },
        })

        return reply.send({
          success: true,
          message: 'Session terminated successfully',
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to terminate session',
        })
      }
    },
  )

  // ========================================================================
  // ACCESS LOGS
  // ========================================================================

  /**
   * GET /access-logs
   * List access logs with filtering and pagination.
   */
  fastify.get(
    '/access-logs',
    { preHandler: [validateQuery(accessLogQuerySchema)] },
    async (request, reply) => {
      try {
        const { page, limit, userId, resourceType, resourceId, action } =
          request.query as z.infer<typeof accessLogQuerySchema>

        const where: any = {}
        if (userId) where.userId = userId
        if (resourceType) where.resourceType = resourceType
        if (resourceId) where.resourceId = resourceId
        if (action) where.action = action

        const skip = (page - 1) * limit

        const [logs, total] = await Promise.all([
          prisma.accessLog.findMany({
            where,
            orderBy: { accessedAt: 'desc' },
            skip,
            take: limit,
            include: {
              user: {
                select: { id: true, email: true, firstName: true, lastName: true },
              },
            },
          }),
          prisma.accessLog.count({ where }),
        ])

        return reply.send({
          success: true,
          data: logs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: error.message || 'Failed to fetch access logs',
        })
      }
    },
  )
}
