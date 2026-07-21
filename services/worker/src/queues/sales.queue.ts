import { BaseQueue, BaseJobData } from './base.queue'
import { SalesJobData } from '../types/sales.types'

/**
 * Sales queue for sales task SLA reminders and other sales operations
 */
export class SalesQueue extends BaseQueue<SalesJobData> {
  constructor() {
    super('sales', {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5 second delay
        },
        removeOnComplete: {
          age: 7 * 24 * 3600, // Keep completed jobs for 7 days
          count: 5000,
        },
        removeOnFail: {
          age: 30 * 24 * 3600, // Keep failed jobs for 30 days
        },
      },
    })
  }

  /**
   * Add an SLA reminder job to the queue
   */
  async slaReminder(data: SalesJobData) {
    return this.add('salesTask.slaReminder', data, {
      priority: data.metadata?.priority || 0,
    })
  }
}

// Singleton instance
export const salesQueue = new SalesQueue()
