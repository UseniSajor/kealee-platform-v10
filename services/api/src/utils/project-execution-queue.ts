/**
 * services/api/src/utils/project-execution-queue.ts
 *
 * Project Execution Queue Utility
 * Provides project execution queue functionality for webhooks and other services
 */

import { Queue } from 'bullmq'
import IORedis from 'ioredis'

export interface ProjectExecutionJobData {
  outputId: string
  type: 'design' | 'permit' | 'estimate' | 'concept' | 'change_order'
  intakeId?: string
  orderId?: string
  projectId?: string
  metadata?: Record<string, unknown>
}

let projectExecutionQueueSingleton: Queue<ProjectExecutionJobData> | null = null

export function getProjectExecutionQueue(): Queue<ProjectExecutionJobData> {
  if (projectExecutionQueueSingleton) return projectExecutionQueueSingleton

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    throw new Error('REDIS_URL is required for project execution queue — cannot start without Redis')
  }

  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null, // required by BullMQ blocking connections
  })

  projectExecutionQueueSingleton = new Queue<ProjectExecutionJobData>(
    'project.execution',
    { connection: connection as any }
  ) as Queue<ProjectExecutionJobData, any, string, ProjectExecutionJobData, any, string>

  return projectExecutionQueueSingleton
}
