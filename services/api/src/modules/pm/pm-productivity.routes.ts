import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { pmProductivityService } from './pm-productivity.service'

export async function pmProductivityRoutes(fastify: FastifyInstance) {
  // GET /pm/productivity - Get PM productivity dashboard
  fastify.get(
    '/productivity',
    { preHandler: authenticateUser },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const dashboard = await pmProductivityService.getProductivityDashboard(user.id)
        return reply.send({ dashboard })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(error.statusCode || 500).send({
          error: error.message || 'Failed to get productivity dashboard',
        })
      }
    }
  )
}




