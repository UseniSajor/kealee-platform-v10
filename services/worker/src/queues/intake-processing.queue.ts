import { BaseQueue } from './base.queue'

export interface IntakeProcessingJobData {
  intakeId: string
  projectPath: string
  amount: number
  customerEmail: string
  stripeSessionId: string
}

/**
 * Queue for processing paid public intake leads.
 * Triggered by Stripe webhook after checkout.session.completed (source=public_intake)
 */
export class IntakeProcessingQueue extends BaseQueue<IntakeProcessingJobData> {
  constructor() {
    super('intake-processing', {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          age: 7 * 24 * 3600,
          count: 1000,
        },
        removeOnFail: {
          age: 30 * 24 * 3600,
        },
      },
    })
  }

  async processIntake(data: IntakeProcessingJobData) {
    return this.add('process-paid-intake', data, { priority: 1 })
  }
}

export const intakeProcessingQueue = new IntakeProcessingQueue()
