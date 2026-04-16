/**
 * Analytics Dashboard Routes
 * Provides funnel metrics, conversion tracking, and revenue analytics
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { funnelAnalyticsService } from '../services/funnel-analytics.service'

export async function analyticsDashboardRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/v1/analytics/funnel/:serviceType
   * Get funnel metrics for a service (concept, estimation, permits)
   */
  fastify.get<{ Params: { serviceType: string }; Querystring: { days?: string } }>(
    '/api/v1/analytics/funnel/:serviceType',
    async (request: FastifyRequest<{ Params: { serviceType: string }; Querystring: { days?: string } }>, reply: FastifyReply) => {
      try {
        const { serviceType } = request.params
        const days = parseInt(request.query.days || '30', 10)

        if (!['concept', 'estimation', 'permits'].includes(serviceType)) {
          return reply.status(400).send({
            status: 'error',
            message: 'Invalid service type',
          })
        }

        const summary = await funnelAnalyticsService.getFunnelSummary(
          serviceType as 'concept' | 'estimation' | 'permits',
          days
        )

        return reply.send({
          status: 'success',
          data: summary,
        })
      } catch (error) {
        console.error('Funnel analytics error:', error)
        return reply.status(500).send({
          status: 'error',
          message: 'Failed to retrieve funnel metrics',
        })
      }
    }
  )

  /**
   * GET /api/v1/analytics/dashboard/summary
   * Get comprehensive dashboard summary across all services
   */
  fastify.get<{ Querystring: { days?: string } }>(
    '/api/v1/analytics/dashboard/summary',
    async (request: FastifyRequest<{ Querystring: { days?: string } }>, reply: FastifyReply) => {
      try {
        const days = parseInt(request.query.days || '30', 10)

        const conceptFunnel = await funnelAnalyticsService.getFunnelSummary('concept', days)
        const estimationFunnel = await funnelAnalyticsService.getFunnelSummary('estimation', days)
        const permitsFunnel = await funnelAnalyticsService.getFunnelSummary('permits', days)

        // Calculate aggregate metrics
        const totalViews = (conceptFunnel?.metrics?.views || 0) +
                          (estimationFunnel?.metrics?.views || 0) +
                          (permitsFunnel?.metrics?.views || 0)
        const totalConversions = (conceptFunnel?.metrics?.conversions || 0) +
                                (estimationFunnel?.metrics?.conversions || 0) +
                                (permitsFunnel?.metrics?.conversions || 0)
        const totalRevenue = (conceptFunnel?.metrics?.totalRevenue || 0) +
                            (estimationFunnel?.metrics?.totalRevenue || 0) +
                            (permitsFunnel?.metrics?.totalRevenue || 0)
        const overallConversionRate = totalViews > 0 ? ((totalConversions / totalViews) * 100).toFixed(2) : '0'

        return reply.send({
          status: 'success',
          data: {
            period: `${days} days`,
            aggregateMetrics: {
              totalViews,
              totalConversions,
              totalRevenue: totalRevenue.toFixed(2),
              overallConversionRate: `${overallConversionRate}%`,
              averageOrderValue: totalConversions > 0 ? (totalRevenue / totalConversions).toFixed(2) : '0',
            },
            byService: {
              concept: conceptFunnel?.metrics || {},
              estimation: estimationFunnel?.metrics || {},
              permits: permitsFunnel?.metrics || {},
            },
            insights: [
              {
                title: 'Best Performing Service',
                value: getBestService(conceptFunnel, estimationFunnel, permitsFunnel),
                details: 'Highest conversion rate across all funnel stages',
              },
              {
                title: 'Average Order Value',
                value: `$${(totalConversions > 0 ? totalRevenue / totalConversions : 0).toFixed(2)}`,
                details: 'Average price per conversion',
              },
              {
                title: 'Total Revenue',
                value: `$${totalRevenue.toFixed(2)}`,
                details: `Generated from ${totalConversions} conversions in ${days} days`,
              },
            ],
          },
        })
      } catch (error) {
        console.error('Dashboard summary error:', error)
        return reply.status(500).send({
          status: 'error',
          message: 'Failed to retrieve dashboard summary',
        })
      }
    }
  )

  /**
   * POST /api/v1/analytics/track
   * Track a funnel event (for client-side tracking)
   */
  fastify.post<{ Body: any }>(
    '/api/v1/analytics/track',
    async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
      try {
        const { eventType, sessionId, email, serviceType, tier, jurisdiction, finalPrice, metadata } = request.body

        if (!eventType || !sessionId) {
          return reply.status(400).send({
            status: 'error',
            message: 'Missing required fields: eventType, sessionId',
          })
        }

        const result = await funnelAnalyticsService.trackEvent({
          eventType,
          sessionId,
          intakeId: metadata?.intakeId,
          email,
          serviceType,
          tier,
          finalPrice,
          metadata,
        })

        return reply.send({
          status: 'success',
          data: result,
        })
      } catch (error) {
        console.error('Event tracking error:', error)
        // Don't fail the request - analytics should never break the main flow
        return reply.send({
          status: 'success',
          data: { tracked: false, reason: 'backend tracking unavailable' },
        })
      }
    }
  )

  console.log('✅ Analytics dashboard routes registered')
}

function getBestService(
  conceptFunnel: any,
  estimationFunnel: any,
  permitsFunnel: any
): string {
  const services = [
    { name: 'Concept', rate: parseFloat(conceptFunnel?.metrics?.conversionRate?.replace('%', '') || '0') },
    { name: 'Estimation', rate: parseFloat(estimationFunnel?.metrics?.conversionRate?.replace('%', '') || '0') },
    { name: 'Permits', rate: parseFloat(permitsFunnel?.metrics?.conversionRate?.replace('%', '') || '0') },
  ]

  return services.reduce((best, current) => (current.rate > best.rate ? current : best)).name
}

export default analyticsDashboardRoutes
