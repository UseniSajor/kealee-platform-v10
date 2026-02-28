/**
 * Analytics Routes
 * Handles performance metrics and user events
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { validateBody, validateQuery } from '../../middleware/validation.middleware'
import { prismaAny } from '../../utils/prisma-helper'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

// ============================================================================
// ZOD SCHEMAS (used ONLY by validateBody/validateQuery)
// DO NOT put Zod schemas inside Fastify route `schema.body/params/querystring`
// ============================================================================

const performanceMetricsSchema = z.object({
  pageLoadTime: z.number().optional(),
  timeToFirstByte: z.number().optional(),
  firstContentfulPaint: z.number().optional(),
  largestContentfulPaint: z.number().optional(),
  cumulativeLayoutShift: z.number().optional(),
  firstInputDelay: z.number().optional(),
  totalBlockingTime: z.number().optional(),
  url: z.string().url(),
  userAgent: z.string().optional(),
  timestamp: z.string().datetime(),
})

const userEventSchema = z.object({
  eventName: z.string().min(1),
  properties: z.record(z.any()).optional(),
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  url: z.string().url(),
  timestamp: z.string().datetime(),
})

const metricsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

// ============================================================================
// ROUTES
// IMPORTANT: This plugin should be registered with a prefix, e.g.
// fastify.register(analyticsRoutes, { prefix: '/analytics' })
// Therefore route paths below should NOT include '/analytics' again.
// ============================================================================

export async function analyticsRoutes(fastify: FastifyInstance) {
  // POST /analytics/performance - Track performance metrics
  fastify.post(
    '/performance',
    {
      preHandler: [validateBody(performanceMetricsSchema)],
      schema: {
        description: 'Track performance metrics from frontend',
        tags: ['analytics'],
        summary: 'Track performance metrics',
      },
    },
    async (request, reply) => {
      try {
        const data = performanceMetricsSchema.parse(request.body)

        await prismaAny.performanceMetric.create({
          data: {
            pageLoadTime: data.pageLoadTime,
            timeToFirstByte: data.timeToFirstByte,
            firstContentfulPaint: data.firstContentfulPaint,
            largestContentfulPaint: data.largestContentfulPaint,
            cumulativeLayoutShift: data.cumulativeLayoutShift,
            firstInputDelay: data.firstInputDelay,
            totalBlockingTime: data.totalBlockingTime,
            url: data.url,
            userAgent: data.userAgent,
            recordedAt: new Date(data.timestamp),
          },
        })

        return reply.send({ success: true })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to record performance metrics'),
        })
      }
    }
  )

  // POST /analytics/events - Track user events
  fastify.post(
    '/events',
    {
      preHandler: [validateBody(userEventSchema)],
      schema: {
        description: 'Track user events from frontend',
        tags: ['analytics'],
        summary: 'Track user events',
      },
    },
    async (request, reply) => {
      try {
        const data = userEventSchema.parse(request.body)

        // Store in database (if model exists)
        try {
          await (prismaAny as any).userEvent.create({
            data: {
              eventName: data.eventName,
              properties: data.properties || {},
              userId: data.userId,
              sessionId: data.sessionId,
              url: data.url,
              recordedAt: new Date(data.timestamp),
            },
          })
        } catch (error: any) {
          // Model might not exist yet - log
          fastify.log.warn({ err: error }, 'UserEvent model not migrated yet; logging event')
          // Keep a safe log line without dumping huge properties
          fastify.log.info({ eventName: data.eventName, url: data.url, userId: data.userId }, 'User event')
        }

        return reply.send({ success: true })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to record event'),
        })
      }
    }
  )

  // GET /analytics/metrics - Get aggregated metrics
  fastify.get(
    '/metrics',
    {
      preHandler: [validateQuery(metricsQuerySchema)],
      schema: {
        description: 'Get aggregated analytics metrics',
        tags: ['analytics'],
        summary: 'Get analytics metrics',
      },
    },
    async (request, reply) => {
      try {
        const { startDate, endDate } = metricsQuerySchema.parse(request.query)

        const where: any = {}
        if (startDate || endDate) {
          where.recordedAt = {}
          if (startDate) where.recordedAt.gte = new Date(startDate)
          if (endDate) where.recordedAt.lte = new Date(endDate)
        }

        let perfMetrics: any = { _avg: {}, _count: 0 }
        let eventCounts: any[] = []

        try {
          perfMetrics = await (prismaAny as any).performanceMetric.aggregate({
            where,
            _avg: {
              pageLoadTime: true,
              timeToFirstByte: true,
              firstContentfulPaint: true,
              largestContentfulPaint: true,
              cumulativeLayoutShift: true,
              firstInputDelay: true,
            },
            _count: true,
          })

          eventCounts = await (prismaAny as any).userEvent.groupBy({
            by: ['eventName'],
            where,
            _count: true,
          })
        } catch (error: any) {
          fastify.log.warn({ err: error }, 'Analytics models not migrated yet')
        }

        return reply.send({
          success: true,
          performance: {
            average: {
              pageLoadTime: perfMetrics._avg.pageLoadTime,
              timeToFirstByte: perfMetrics._avg.timeToFirstByte,
              firstContentfulPaint: perfMetrics._avg.firstContentfulPaint,
              largestContentfulPaint: perfMetrics._avg.largestContentfulPaint,
              cumulativeLayoutShift: perfMetrics._avg.cumulativeLayoutShift,
              firstInputDelay: perfMetrics._avg.firstInputDelay,
            },
            sampleCount: perfMetrics._count,
          },
          events: (eventCounts || []).map((e) => ({
            eventName: e.eventName,
            count: e._count,
          })),
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to get metrics'),
        })
      }
    }
  )
}
