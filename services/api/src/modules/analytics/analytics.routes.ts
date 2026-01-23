/**
 * Analytics Routes
 * Handles performance metrics and user events
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { validateBody } from '../../middleware/validation.middleware'
import { prismaAny } from '../../utils/prisma-helper'

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

export async function analyticsRoutes(fastify: FastifyInstance) {
  // POST /analytics/performance - Track performance metrics
  fastify.post(
    '/analytics/performance',
    {
      schema: {
        description: 'Track performance metrics from frontend',
        tags: ['analytics'],
        body: performanceMetricsSchema,
      },
    },
    async (request, reply) => {
      try {
        const data = request.body as z.infer<typeof performanceMetricsSchema>

        // Store in database
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
          error: error.message || 'Failed to record performance metrics',
        })
      }
    }
  )

  // POST /analytics/events - Track user events
  fastify.post(
    '/analytics/events',
    {
      schema: {
        description: 'Track user events from frontend',
        tags: ['analytics'],
        body: userEventSchema,
      },
    },
    async (request, reply) => {
      try {
        const data = request.body as z.infer<typeof userEventSchema>

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
          // Model might not exist yet - log to console
          console.log('User event (model not migrated yet):', data)
        }

        return reply.send({ success: true })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to record event',
        })
      }
    }
  )

  // GET /analytics/metrics - Get aggregated metrics
  fastify.get(
    '/analytics/metrics',
    {
      schema: {
        description: 'Get aggregated analytics metrics',
        tags: ['analytics'],
      },
    },
    async (request, reply) => {
      try {
        const { startDate, endDate } = request.query as {
          startDate?: string
          endDate?: string
        }

        const where: any = {}
        if (startDate || endDate) {
          where.recordedAt = {}
          if (startDate) where.recordedAt.gte = new Date(startDate)
          if (endDate) where.recordedAt.lte = new Date(endDate)
        }

        // Get performance metrics (if model exists)
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
          // Models might not exist yet
          console.warn('Analytics models not migrated yet:', error.message)
        }

        return reply.send({
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
          events: eventCounts.map((e) => ({
            eventName: e.eventName,
            count: e._count,
          })),
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to get metrics',
        })
      }
    }
  )
}
