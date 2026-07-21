/**
 * Project Phase History Routes
 * Read-only for ProjectPhaseHistory
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../../middleware/auth.middleware'
import { validateParams, validateQuery } from '../../middleware/validation.middleware'
import { prisma } from '@kealee/database'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function projectHistoryRoutes(fastify: FastifyInstance) {
  // Apply auth to all routes
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply)
  })

  // GET /:projectId/history - List phase history entries for a project
  fastify.get(
    '/:projectId/history',
    {
      preHandler: [
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const { projectId } = request.params as { projectId: string }
        const query = request.query as { page?: string; limit?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        // Find all phases for this project, then get their history
        const phases = await (prisma as any).projectPhase.findMany({
          where: { projectId },
          select: { id: true },
        })

        const phaseIds = phases.map((p: any) => p.id)

        if (phaseIds.length === 0) {
          return reply.send({
            data: [],
            pagination: { page, limit, total: 0, totalPages: 0 },
          })
        }

        const where = { phaseId: { in: phaseIds } }

        const [history, total] = await Promise.all([
          (prisma as any).projectPhaseHistory.findMany({
            where,
            skip,
            take: limit,
            orderBy: { changedAt: 'desc' },
            include: {
              phase: {
                select: { id: true, name: true, status: true },
              },
            },
          }),
          (prisma as any).projectPhaseHistory.count({ where }),
        ])

        return reply.send({
          data: history,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to list phase history') })
      }
    }
  )

  // GET /:projectId/history/:id - Single phase history entry
  fastify.get(
    '/:projectId/history/:id',
    {
      preHandler: [
        validateParams(
          z.object({
            projectId: z.string().uuid(),
            id: z.string().uuid(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { projectId: string; id: string }

        const entry = await (prisma as any).projectPhaseHistory.findUnique({
          where: { id },
          include: {
            phase: {
              select: { id: true, name: true, status: true, projectId: true },
            },
          },
        })

        if (!entry) {
          return reply.code(404).send({ error: 'History entry not found' })
        }

        return reply.send({ data: entry })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to fetch history entry') })
      }
    }
  )
}
