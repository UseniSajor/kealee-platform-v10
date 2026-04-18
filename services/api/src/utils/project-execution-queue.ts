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
    // If Redis not available, return a mock queue that just logs
    console.warn('⚠️  REDIS_URL not set, project execution queue will log only')
    return {
      add: async (name: string, data: ProjectExecutionJobData) => {
        console.log(
          `📦 Project execution queued (mock): type=${data.type}, outputId=${data.outputId}`
        )
        return {} as any
      },
    } as any
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
