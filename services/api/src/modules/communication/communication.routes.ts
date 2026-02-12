/**
 * Communication Routes
 * CRUD for CommunicationLog, ActivityLog, Issue, DocumentDistribution, ProjectManager
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { prisma } from '@kealee/database'

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const issueCreateSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['DEFECT', 'DELAY', 'QUALITY', 'SAFETY', 'OTHER']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
})

const issueUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  severity: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  resolution: z.string().optional(),
})

const distributionCreateSchema = z.object({
  documentId: z.string().uuid(),
  recipientId: z.string().uuid().optional(),
  recipientEmail: z.string().email(),
  recipientName: z.string().optional(),
  method: z.enum(['EMAIL', 'PORTAL', 'DOCUSIGN']),
  accessLink: z.string().url().optional(),
  accessExpires: z.string().datetime().optional(),
})

const projectManagerAssignSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['PM', 'ASSISTANT_PM', 'SUPERINTENDENT']).optional(),
  isPrimary: z.boolean().optional(),
  pmSubscriptionId: z.string().uuid().optional(),
})

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function communicationRoutes(fastify: FastifyInstance) {
  // Apply auth to all routes
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply)
  })

  // ========================================================================
  // COMMUNICATION LOGS
  // ========================================================================

  // GET /logs - List communication logs (filter by projectId, channel)
  fastify.get(
    '/logs',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            projectId: z.string().uuid().optional(),
            channel: z.string().optional(),
            status: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; projectId?: string; channel?: string; status?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.projectId) where.projectId = query.projectId
        if (query.channel) where.channel = query.channel
        if (query.status) where.status = query.status

        const [logs, total] = await Promise.all([
          (prisma as any).communicationLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          (prisma as any).communicationLog.count({ where }),
        ])

        return reply.send({
          data: logs,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list communication logs' })
      }
    }
  )

  // ========================================================================
  // ACTIVITY LOGS
  // ========================================================================

  // GET /activity - List activity logs (filter by projectId, userId)
  fastify.get(
    '/activity',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            projectId: z.string().uuid().optional(),
            userId: z.string().uuid().optional(),
            category: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; projectId?: string; userId?: string; category?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.projectId) where.projectId = query.projectId
        if (query.userId) where.userId = query.userId
        if (query.category) where.category = query.category

        const [logs, total] = await Promise.all([
          (prisma as any).activityLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          (prisma as any).activityLog.count({ where }),
        ])

        return reply.send({
          data: logs,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list activity logs' })
      }
    }
  )

  // ========================================================================
  // ISSUES
  // ========================================================================

  // GET /issues - List issues (filter by projectId, status, priority)
  fastify.get(
    '/issues',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            projectId: z.string().uuid().optional(),
            status: z.string().optional(),
            severity: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; projectId?: string; status?: string; severity?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.projectId) where.projectId = query.projectId
        if (query.status) where.status = query.status
        if (query.severity) where.severity = query.severity

        const [issues, total] = await Promise.all([
          (prisma as any).issue.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          (prisma as any).issue.count({ where }),
        ])

        return reply.send({
          data: issues,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list issues' })
      }
    }
  )

  // POST /issues - Create issue
  fastify.post(
    '/issues',
    {
      preHandler: [validateBody(issueCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof issueCreateSchema>

        const issue = await (prisma as any).issue.create({
          data: {
            ...body,
            dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          },
        })

        return reply.code(201).send({ data: issue })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create issue' })
      }
    }
  )

  // PATCH /issues/:id - Update issue
  fastify.patch(
    '/issues/:id',
    {
      preHandler: [
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(issueUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof issueUpdateSchema>

        const updateData: any = { ...body }
        if (body.dueDate) updateData.dueDate = new Date(body.dueDate)
        if (body.status === 'RESOLVED') updateData.resolvedAt = new Date()

        const updated = await (prisma as any).issue.update({
          where: { id },
          data: updateData,
        })

        return reply.send({ data: updated })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to update issue' })
      }
    }
  )

  // ========================================================================
  // DOCUMENT DISTRIBUTIONS
  // ========================================================================

  // GET /distributions - List document distributions
  fastify.get(
    '/distributions',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            documentId: z.string().uuid().optional(),
            status: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; documentId?: string; status?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.documentId) where.documentId = query.documentId
        if (query.status) where.status = query.status

        const [distributions, total] = await Promise.all([
          (prisma as any).documentDistribution.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          (prisma as any).documentDistribution.count({ where }),
        ])

        return reply.send({
          data: distributions,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list distributions' })
      }
    }
  )

  // POST /distributions - Create document distribution
  fastify.post(
    '/distributions',
    {
      preHandler: [validateBody(distributionCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof distributionCreateSchema>

        const distribution = await (prisma as any).documentDistribution.create({
          data: {
            ...body,
            accessExpires: body.accessExpires ? new Date(body.accessExpires) : undefined,
          },
        })

        return reply.code(201).send({ data: distribution })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create distribution' })
      }
    }
  )

  // ========================================================================
  // PROJECT MANAGERS
  // ========================================================================

  // GET /project-managers - List project managers
  fastify.get(
    '/project-managers',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            projectId: z.string().uuid().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as { page?: string; limit?: string; projectId?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = { removedAt: null }
        if (query.projectId) where.projectId = query.projectId

        const [managers, total] = await Promise.all([
          (prisma as any).projectManager.findMany({
            where,
            skip,
            take: limit,
            orderBy: { assignedAt: 'desc' },
            include: {
              user: { select: { id: true, name: true, email: true } },
              project: { select: { id: true, name: true } },
            },
          }),
          (prisma as any).projectManager.count({ where }),
        ])

        return reply.send({
          data: managers,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list project managers' })
      }
    }
  )

  // POST /project-managers - Assign PM to project
  fastify.post(
    '/project-managers',
    {
      preHandler: [validateBody(projectManagerAssignSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof projectManagerAssignSchema>

        const manager = await (prisma as any).projectManager.create({
          data: body,
        })

        return reply.code(201).send({ data: manager })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to assign project manager' })
      }
    }
  )
}
