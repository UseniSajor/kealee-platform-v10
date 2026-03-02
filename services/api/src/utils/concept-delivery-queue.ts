/**
 * Concept Delivery Queue Utility
 * Provides queue access from the API service for triggering concept generation
 */

import { Queue } from 'bullmq'
import IORedis from 'ioredis'

interface ConceptDeliveryJobData {
  orderId: string
  userId: string
  packageTier: string
  packageName: string
  funnelSessionId: string | null
  customerEmail: string
  customerName: string
}

let conceptDeliveryQueueSingleton: Queue<ConceptDeliveryJobData> | null = null

export function getConceptDeliveryQueue(): Queue<ConceptDeliveryJobData> {
  if (conceptDeliveryQueueSingleton) return conceptDeliveryQueueSingleton

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    // If Redis not available, return a mock queue that just logs
    console.warn('REDIS_URL not set, concept delivery queue will log only')
    return {
      add: async (name: string, data: ConceptDeliveryJobData) => {
        console.log(`[concept-delivery] Job queued (mock): ${data.orderId} - ${data.packageName}`)
        return {} as any
      },
    } as any
  }

  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  })

  conceptDeliveryQueueSingleton = new Queue<ConceptDeliveryJobData>('concept-delivery', {
    connection: connection as any,
  }) as any
  return conceptDeliveryQueueSingleton
}
