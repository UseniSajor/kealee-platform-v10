/**
 * Webhook Logs Routes
 * Read/retry for WebhookLog, WebhookRetry
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../../middleware/auth.middleware'
import { validateParams, validateQuery } from '../../middleware/validation.middleware'
import { prisma } from '@kealee/database'

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function webhookLogRoutes(fastify: FastifyInstance) {
  // Apply auth to all routes
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply)
  })

  // ========================================================================
  // WEBHOOK LOGS
  // ========================================================================

  // GET /logs - List webhook logs (filter by webhookId, status)
  fastify.get(
    '/logs',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            webhookId: z.string().optional(),
            status: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; webhookId?: string; status?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.webhookId) where.webhookId = query.webhookId
        if (query.status) where.status = query.status

        const [logs, total] = await Promise.all([
          (prisma as any).webhookLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          (prisma as any).webhookLog.count({ where }),
        ])

        return reply.send({
          data: logs,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list webhook logs' })
      }
    }
  )

  // GET /logs/:id - Single log with response details
  fastify.get(
    '/logs/:id',
    {
      preHandler: [validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }

        const log = await (prisma as any).webhookLog.findUnique({
          where: { id },
          include: {
            retries: {
              orderBy: { createdAt: 'desc' },
            },
          },
        })

        if (!log) {
          return reply.code(404).send({ error: 'Webhook log not found' })
        }

        return reply.send({ data: log })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to fetch webhook log' })
      }
    }
  )

  // ========================================================================
  // WEBHOOK RETRIES
  // ========================================================================

  // GET /retries - List retries (filter by webhookLogId)
  fastify.get(
    '/retries',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            webhookLogId: z.string().optional(),
            status: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; webhookLogId?: string; status?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.webhookLogId) where.webhookId = query.webhookLogId
        if (query.status) where.status = query.status

        const [retries, total] = await Promise.all([
          (prisma as any).webhookRetry.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          (prisma as any).webhookRetry.count({ where }),
        ])

        return reply.send({
          data: retries,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list webhook retries' })
      }
    }
  )

  // POST /retries/:logId - Manually retry a webhook
  fastify.post(
    '/retries/:logId',
    {
      preHandler: [validateParams(z.object({ logId: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const { logId } = request.params as { logId: string }

        const log = await (prisma as any).webhookLog.findUnique({ where: { id: logId } })

        if (!log) {
          return reply.code(404).send({ error: 'Webhook log not found' })
        }

        // Create a retry record
        const retry = await (prisma as any).webhookRetry.create({
          data: {
            webhookId: log.webhookId,
            retryCount: log.retryCount + 1,
            scheduledFor: new Date(),
            payload: log.result || {},
            status: 'PENDING',
          },
        })

        // Update the log retry count
        await (prisma as any).webhookLog.update({
          where: { id: logId },
          data: {
            retryCount: { increment: 1 },
            lastAttemptAt: new Date(),
            status: 'PENDING',
          },
        })

        return reply.code(201).send({ data: retry, message: 'Retry scheduled' })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to schedule retry' })
      }
    }
  )
}
