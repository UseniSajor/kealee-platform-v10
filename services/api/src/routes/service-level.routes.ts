/**
 * services/api/src/routes/service-level.routes.ts
 *
 * Service level agreement endpoints:
 * - GET /api/service-level/:type — delivery time estimates
 */

import type { FastifyInstance } from 'fastify'

interface ServiceLevelConfig {
  maxDeliveryTime: number // hours
  currentLoadFactor: number // 0–1
  displayText: string // "Delivery in ~2 hours"
}

const SERVICE_LEVELS: Record<string, Omit<ServiceLevelConfig, 'currentLoadFactor' | 'displayText'>> = {
  design: { maxDeliveryTime: 4 },
  permit: { maxDeliveryTime: 8 },
  estimate: { maxDeliveryTime: 2 },
  concept: { maxDeliveryTime: 6 },
  change_order: { maxDeliveryTime: 12 },
}

export async function serviceLevelRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { type: string } }>('/service-level/:type', async (request, reply) => {
    const { type } = request.params

    const config = SERVICE_LEVELS[type]
    if (!config) {
      return reply.code(400).send({
        error: `Unknown service type: ${type}`,
        validTypes: Object.keys(SERVICE_LEVELS),
      })
    }

    // For now, use static load factor. In production, query queue depth.
    const currentLoadFactor = 0.3 // 30% loaded
    const predictedDeliveryTime = Math.ceil(config.maxDeliveryTime * (1 + currentLoadFactor * 0.5))
    const displayText = `Delivery in ~${predictedDeliveryTime} hours`

    return reply.send({
      serviceType: type,
      maxDeliveryTime: config.maxDeliveryTime,
      currentLoadFactor,
      predictedDeliveryTime,
      displayText,
    })
  })
}
