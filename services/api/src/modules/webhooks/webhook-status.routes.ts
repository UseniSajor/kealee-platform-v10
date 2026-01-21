/**
 * Webhook Status Routes
 * Provides endpoints for checking webhook processing status and logs
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prismaAny } from '../../utils/prisma-helper'
import { authenticateUser } from '../auth/auth.middleware'

export async function webhookStatusRoutes(fastify: FastifyInstance) {
  // GET /webhooks/status - Get webhook processing status
  fastify.get(
    '/webhooks/status',
    {
      preHandler: authenticateUser,
      schema: {
        description: 'Get webhook processing status and recent logs',
        tags: ['webhooks'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 10 },
            eventType: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const query = request.query as any
        const { limit = 10, eventType } = { limit: query.limit ? Number(query.limit) : 10, eventType: query.eventType }

        // Query audit logs for webhook-related entries
        const where: any = {
          action: {
            in: ['STRIPE_WEBHOOK_ATTEMPT', 'STRIPE_WEBHOOK_ERROR'],
          },
        }

        // Note: JSON field filtering is done in memory after fetching
        // Prisma's JSON filtering is limited, so we filter client-side

        let logs = await prismaAny.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: eventType ? limit * 2 : limit, // Fetch more if filtering by eventType
          select: {
            id: true,
            action: true,
            entityId: true,
            reason: true,
            after: true,
            createdAt: true,
          },
        })

        // Filter by eventType if provided (client-side filtering for JSON fields)
        if (eventType) {
          logs = logs.filter((log) => {
            const after = log.after as any
            return after?.eventType === eventType
          }).slice(0, limit)
        }

        // Get summary statistics
        const totalAttempts = await prismaAny.auditLog.count({
          where: { action: 'STRIPE_WEBHOOK_ATTEMPT' },
        })

        const totalErrors = await prismaAny.auditLog.count({
          where: { action: 'STRIPE_WEBHOOK_ERROR' },
        })

        const recentErrors = await prismaAny.auditLog.count({
          where: {
            action: 'STRIPE_WEBHOOK_ERROR',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        })

        return reply.send({
          status: 'ok',
          summary: {
            totalAttempts,
            totalErrors,
            recentErrors,
          },
          recentLogs: logs,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to get webhook status',
        })
      }
    }
  )

  // GET /webhooks/status/:eventId - Get status for a specific webhook event
  fastify.get(
    '/webhooks/status/:eventId',
    {
      preHandler: authenticateUser,
      schema: {
        description: 'Get status for a specific webhook event',
        tags: ['webhooks'],
        params: {
          type: 'object',
          properties: {
            eventId: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const params = request.params as any
        const { eventId } = params

        // Find all audit logs related to this event
        const logs = await prismaAny.auditLog.findMany({
          where: {
            entityId: eventId,
            action: {
              in: ['STRIPE_WEBHOOK_ATTEMPT', 'STRIPE_WEBHOOK_ERROR'],
            },
          },
          orderBy: { createdAt: 'desc' },
        })

        if (logs.length === 0) {
          return reply.code(404).send({
            error: 'Webhook event not found',
          })
        }

        // Check if there were any errors
        const hasError = logs.some((log) => log.action === 'STRIPE_WEBHOOK_ERROR')

        return reply.send({
          eventId,
          status: hasError ? 'error' : 'success',
          logs,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to get webhook event status',
        })
      }
    }
  )

  // POST /webhooks/test - Trigger a test webhook event
  fastify.post(
    '/webhooks/test',
    {
      preHandler: authenticateUser,
      schema: {
        description: 'Trigger a test webhook event (for testing purposes)',
        tags: ['webhooks'],
        body: {
          type: 'object',
          required: ['eventType'],
          properties: {
            eventType: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = request.body as any
        const { eventType } = body

        // Validate event type
        const validEventTypes = [
          'checkout.session.completed',
          'customer.subscription.created',
          'customer.subscription.updated',
          'customer.subscription.deleted',
          'invoice.paid',
          'invoice.payment_failed',
          'payment_intent.succeeded',
          'payment_intent.payment_failed',
        ]

        if (!validEventTypes.includes(eventType)) {
          return reply.code(400).send({
            error: `Invalid event type. Must be one of: ${validEventTypes.join(', ')}`,
          })
        }

        // Note: In production, you would typically use Stripe CLI or Stripe API to trigger test events
        // This endpoint is mainly for documentation/logging purposes
        // For actual testing, use: stripe trigger <eventType>

        // Log the test request
        await prismaAny.auditLog.create({
          data: {
            action: 'STRIPE_WEBHOOK_TEST',
            entityType: 'Webhook',
            entityId: `test_${Date.now()}`,
            userId: (request as any).user?.id || 'system',
            reason: `Test webhook triggered: ${eventType}`,
            after: {
              eventType,
              test: true,
              timestamp: new Date().toISOString(),
            },
          },
        })

        return reply.send({
          success: true,
          message: `Test webhook event type requested: ${eventType}`,
          instructions: `To actually trigger this event, run: stripe trigger ${eventType}`,
          note: 'This endpoint logs the test request. Use Stripe CLI or Stripe Dashboard to trigger actual test events.',
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to process test webhook request',
        })
      }
    }
  )
}
