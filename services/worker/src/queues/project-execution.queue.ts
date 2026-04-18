/**
 * services/worker/src/queues/project-execution.queue.ts
 *
 * Generic project execution queue for deliverables across all payment types:
 * - Design concepts
 * - Permit packages
 * - Contractor estimates
 * - Change orders
 */

import { BaseQueue, BaseJobData } from './base.queue'

export interface ProjectExecutionJobData extends BaseJobData {
  outputId: string
  type: 'design' | 'permit' | 'estimate' | 'concept' | 'change_order'
  intakeId?: string
  orderId?: string
  projectId?: string
  metadata?: Record<string, unknown>
}

export class ProjectExecutionQueue extends BaseQueue<ProjectExecutionJobData> {
  constructor() {
    super('project.execution', {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          age: 7 * 24 * 3600, // Keep completed jobs for 7 days
        },
      },
    })
  }

  async enqueueExecution(data: ProjectExecutionJobData) {
    return this.add('execute', data, {
      priority: 5,
    })
  }
}

export const projectExecutionQueue = new ProjectExecutionQueue()
