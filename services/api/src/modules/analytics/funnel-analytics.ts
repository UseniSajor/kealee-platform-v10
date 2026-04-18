/**
 * Analytics & Conversion Tracking
 * Tracks user journey through the intake and service chain
 * Provides insights on funnel performance and conversion rates
 */

import type { FastifyInstance, FastifyRequest } from 'fastify'
import { prisma } from '@kealee/database'
import { RedisClient } from '@kealee/redis'
import type { ConversionEvent } from '@kealee/database'

// ============================================================================
// EVENT TYPES
// ============================================================================

export const ANALYTICS_EVENTS = {
  // Concept events
  CONCEPT_STARTED: 'concept.started',
  CONCEPT_COMPLETED: 'concept.completed',
  CONCEPT_IMAGES_UPLOADED: 'concept.images_uploaded',
  CONCEPT_CHECKOUT_INITIATED: 'concept.checkout_initiated',
  CONCEPT_PAID: 'concept.paid',

  // Zoning events
  ZONING_STARTED: 'zoning.started',
  ZONING_COMPLETED: 'zoning.completed',
  ZONING_CHECKOUT_INITIATED: 'zoning.checkout_initiated',
  ZONING_PAID: 'zoning.paid',

  // Estimation events
  ESTIMATION_STARTED: 'estimation.started',
  ESTIMATION_COMPLETED: 'estimation.completed',
  ESTIMATION_CHECKOUT_INITIATED: 'estimation.checkout_initiated',
  ESTIMATION_PAID: 'estimation.paid',

  // Permit events
  PERMIT_STARTED: 'permit.started',
  PERMIT_COMPLETED: 'permit.completed',
  PERMIT_MANAGED_SELECTED: 'permit.managed_selected',
  PERMIT_AUTHORIZATION_PROVIDED: 'permit.authorization_provided',
  PERMIT_CHECKOUT_INITIATED: 'permit.checkout_initiated',
  PERMIT_PAID: 'permit.paid',

  // Routing events
  ROUTED_TO_ARCHITECT: 'routed.architect',
  ROUTED_TO_ENGINEER: 'routed.engineer',

  // Chain completion
  CHAIN_COMPLETED: 'chain.completed',
} as const

// ============================================================================
// ANALYTICS SERVICE
// ============================================================================

export class AnalyticsService {
  private redis: any

  constructor(redis: any) {
    this.redis = redis
  }

  /**
   * Track an analytics event
   */
  async trackEvent(
    funnelSessionId: string,
    event: ConversionEvent,
    metadata?: Record<string, any>
  ): Promise<void> {
    const timestamp = new Date().toISOString()

    // Store event in Redis for real-time tracking
    const eventKey = `analytics:event:${funnelSessionId}:${event}`
    await this.redis.setex(
      eventKey,
      86400 * 30, // 30-day retention
      JSON.stringify({
        event,
        timestamp,
        metadata,
      })
    )

    // Add to session event list
    const sessionKey = `analytics:session:${funnelSessionId}`
    const sessionData = await this.redis.get(sessionKey)
    const existingEvents = sessionData ? JSON.parse(sessionData) : []

    await this.redis.setex(
      sessionKey,
      86400 * 30,
      JSON.stringify([
        ...existingEvents,
        {
          event,
          timestamp,
          metadata,
        },
      ])
    )

    // Persist to database asynchronously
    setImmediate(async () => {
      try {
        const funnel = await prisma.conversionFunnel.findFirst({
          where: { funnelSessionId },
        })

        if (funnel) {
          const existingEvents = (funnel.events as ConversionEvent[]) || []
          const existingTimestamps = (funnel.eventTimestamps as Record<string, string>) || {}

          const updatedEvents = [...new Set([...existingEvents, event])]
          const updatedTimestamps = {
            ...existingTimestamps,
            [event]: timestamp,
          }

          // Calculate completion flags
          const data: any = {
            events: updatedEvents,
            eventTimestamps: updatedTimestamps,
            lastEventAt: new Date(timestamp),
          }

          if (event.includes('concept') && event.includes('paid')) {
            data.conceptCompleted = true
          }
          if (event.includes('zoning') && event.includes('paid')) {
            data.zoningCompleted = true
          }
          if (event.includes('estimation') && event.includes('paid')) {
            data.estimationCompleted = true
          }
          if (event.includes('permit') && event.includes('paid')) {
            data.permitCompleted = true
          }

          if (
            data.conceptCompleted &&
            data.zoningCompleted &&
            data.estimationCompleted &&
            data.permitCompleted
          ) {
            data.fullChainCompleted = true
          }

          await prisma.conversionFunnel.update({
            where: { funnelSessionId },
            data,
          })
        }
      } catch (error) {
        console.error('Failed to persist analytics event:', error)
      }
    })
  }

  /**
   * Get session analytics summary
   */
  async getSessionAnalytics(funnelSessionId: string) {
    const funnel = await prisma.conversionFunnel.findFirst({
      where: { funnelSessionId },
    })

    if (!funnel) {
      return null
    }

    const events = (funnel.events as ConversionEvent[]) || []
    const timestamps = (funnel.eventTimestamps as Record<string, string>) || {}

    // Calculate funnel completion
    const completionStages = {
      concept: events.some(e => e.includes('concept') && e.includes('paid')),
      zoning: events.some(e => e.includes('zoning') && e.includes('paid')),
      estimation: events.some(e => e.includes('estimation') && e.includes('paid')),
      permit: events.some(e => e.includes('permit') && e.includes('paid')),
    }

    const completionCount = Object.values(completionStages).filter(Boolean).length

    return {
      funnelSessionId,
      source: funnel.source,
      campaign: funnel.campaign,
      medium: funnel.medium,
      events,
      timestamps,
      completionStages,
      completionPercentage: (completionCount / 4) * 100,
      fullChainCompleted: funnel.fullChainCompleted,
      totalRevenue: funnel.totalRevenue,
      timeInFunnel: funnel.firstEventAt && funnel.lastEventAt
        ? Math.round((new Date(funnel.lastEventAt).getTime() - new Date(funnel.firstEventAt).getTime()) / 1000)
        : null,
      createdAt: funnel.createdAt,
      updatedAt: funnel.updatedAt,
    }
  }

  /**
   * Get funnel conversion rates
   */
  async getFunnelStats(
    filters?: {
      source?: string
      startDate?: Date
      endDate?: Date
    }
  ) {
    const query: any = {}
    if (filters?.source) query.source = filters.source
    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {}
      if (filters?.startDate) query.createdAt.gte = filters.startDate
      if (filters?.endDate) query.createdAt.lte = filters.endDate
    }

    const funnels = await prisma.conversionFunnel.findMany({
      where: query,
    })

    const stats = {
      totalSessions: funnels.length,
      conceptStarts: funnels.filter(f => (f.events as ConversionEvent[]).some(e => e.includes('concept.started'))).length,
      conceptCompletions: funnels.filter(f => f.conceptCompleted).length,
      zoningCompletions: funnels.filter(f => f.zoningCompleted).length,
      estimationCompletions: funnels.filter(f => f.estimationCompleted).length,
      permitCompletions: funnels.filter(f => f.permitCompleted).length,
      fullChainCompletions: funnels.filter(f => f.fullChainCompleted).length,
      totalRevenue: funnels.reduce((sum, f) => sum + (f.totalRevenue || 0), 0),

      conversionRates: {
        conceptToZoning: funnels.filter(f => f.conceptCompleted && f.zoningCompleted).length / Math.max(funnels.filter(f => f.conceptCompleted).length, 1),
        zoningToEstimation: funnels.filter(f => f.zoningCompleted && f.estimationCompleted).length / Math.max(funnels.filter(f => f.zoningCompleted).length, 1),
        estimationToPermit: funnels.filter(f => f.estimationCompleted && f.permitCompleted).length / Math.max(funnels.filter(f => f.estimationCompleted).length, 1),
        fullChainConversion: funnels.filter(f => f.fullChainCompleted).length / Math.max(funnels.length, 1),
      },

      averageTimeInFunnel: funnels
        .map(f => f.lastEventAt && f.firstEventAt
          ? Math.round((new Date(f.lastEventAt).getTime() - new Date(f.firstEventAt).getTime()) / 1000)
          : 0
        )
        .reduce((sum, t) => sum + t, 0) / Math.max(funnels.length, 1),

      averageOrderValue: funnels.filter(f => f.totalRevenue)
        .reduce((sum, f) => sum + (f.totalRevenue || 0), 0) / Math.max(funnels.filter(f => f.totalRevenue).length, 1),
    }

    return stats
  }

  /**
   * Track page view
   */
  async trackPageView(
    funnelSessionId: string,
    page: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const pageViewKey = `analytics:pageview:${funnelSessionId}:${page}`
    await this.redis.incr(pageViewKey)

    // Expire after 30 days
    await this.redis.expire(pageViewKey, 86400 * 30)
  }

  /**
   * Track user timing/performance
   */
  async trackTiming(
    funnelSessionId: string,
    event: string,
    durationMs: number
  ): Promise<void> {
    const timingKey = `analytics:timing:${funnelSessionId}:${event}`
    await this.redis.lpush(
      timingKey,
      JSON.stringify({
        duration: durationMs,
        timestamp: new Date().toISOString(),
      })
    )

    // Keep last 100 records
    await this.redis.ltrim(timingKey, 0, 99)
    await this.redis.expire(timingKey, 86400 * 30)
  }
}

// ============================================================================
// ANALYTICS ROUTES
// ============================================================================

export async function registerAnalyticsRoutes(fastify: FastifyInstance) {
  const redis = await RedisClient.getInstance()
  const analytics = new AnalyticsService(redis)

  /**
   * GET /analytics/funnel/{funnelSessionId}
   * Get analytics for a specific funnel session
   */
  fastify.get<{ Params: { funnelSessionId: string } }>(
    '/analytics/funnel/:funnelSessionId',
    async (request, reply) => {
      try {
        const { funnelSessionId } = request.params
        const sessionAnalytics = await analytics.getSessionAnalytics(funnelSessionId)

        if (!sessionAnalytics) {
          return reply.status(404).send({
            error: 'NOT_FOUND',
            message: 'Funnel session not found',
          })
        }

        return reply.send(sessionAnalytics)
      } catch (error) {
        fastify.log.error(error)
        throw error
      }
    }
  )

  /**
   * GET /analytics/stats
   * Get aggregated funnel statistics
   */
  fastify.get<{ Querystring: { source?: string; startDate?: string; endDate?: string } }>(
    '/analytics/stats',
    { preHandler: [async (request, reply) => {
      // Add authorization check here if needed
      if (!process.env.ANALYTICS_SECRET_KEY || request.query.apiKey !== process.env.ANALYTICS_SECRET_KEY) {
        return reply.status(403).send({ error: 'UNAUTHORIZED' })
      }
    }] },
    async (request, reply) => {
      try {
        const { source, startDate, endDate } = request.query as any

        const stats = await analytics.getFunnelStats({
          source,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        })

        return reply.send(stats)
      } catch (error) {
        fastify.log.error(error)
        throw error
      }
    }
  )

  fastify.log.info('Analytics routes registered')
}
