/**
 * Email Queue Utility
 * Provides email queue functionality for webhooks and other services
 */

import { Queue } from 'bullmq'
import IORedis from 'ioredis'

type EmailJobData = {
  to: string | string[]
  subject: string
  template?: string
  text?: string
  html?: string
  data?: Record<string, any>
  metadata?: Record<string, any>
}

let emailQueueSingleton: Queue<EmailJobData> | null = null

export function getEmailQueue(): Queue<EmailJobData> {
  if (emailQueueSingleton) return emailQueueSingleton

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    // If Redis not available, return a mock queue that just logs
    console.warn('⚠️  REDIS_URL not set, email queue will log only')
    return {
      add: async (name: string, data: EmailJobData) => {
        console.log(`📧 Email queued (mock): ${data.subject} to ${Array.isArray(data.to) ? data.to.join(', ') : data.to}`)
        return {} as any
      },
    } as any
  }

  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null, // required by BullMQ blocking connections
  })

  emailQueueSingleton = new Queue<EmailJobData>('email', { 
    connection: connection as any 
  }) as Queue<EmailJobData, any, string, EmailJobData, any, string>
  return emailQueueSingleton
}
