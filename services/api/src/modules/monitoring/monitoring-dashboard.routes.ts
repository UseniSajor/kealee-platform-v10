/**
 * Monitoring Dashboard Routes
 * Provides metrics for monitoring dashboard
 */

import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { monitoringDashboardService } from './monitoring-dashboard.service'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

export async function monitoringDashboardRoutes(fastify: FastifyInstance) {
  // GET /monitoring/dashboard - Get dashboard metrics
  fastify.get(
    '/monitoring/dashboard',
    {
      preHandler: [authenticateUser],
      schema: {
        description: 'Get monitoring dashboard metrics',
        tags: ['monitoring'],
      },
    },
    async (request, reply) => {
      try {
        const { startDate, endDate } = request.query as {
          startDate?: string
          endDate?: string
        }

        const metrics = await monitoringDashboardService.getDashboardMetrics(
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
        )

        return reply.send(metrics)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to get dashboard metrics'),
        })
      }
    }
  )
}
