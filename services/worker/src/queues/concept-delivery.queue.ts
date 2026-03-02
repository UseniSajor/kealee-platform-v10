import { BaseQueue } from './base.queue'

export interface ConceptDeliveryJobData {
  orderId: string
  userId: string
  packageTier: string
  packageName: string
  funnelSessionId: string | null
  customerEmail: string
  customerName: string
}

/**
 * Queue for automated concept package generation and delivery
 * Triggered after successful Stripe checkout
 */
export class ConceptDeliveryQueue extends BaseQueue<ConceptDeliveryJobData> {
  constructor() {
    super('concept-delivery', {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000, // Start with 10 second delay (AI generation takes time)
        },
        removeOnComplete: {
          age: 7 * 24 * 3600, // Keep completed jobs for 7 days
          count: 1000,
        },
        removeOnFail: {
          age: 30 * 24 * 3600, // Keep failed jobs for 30 days
        },
      },
    })
  }

  /**
   * Queue a concept package generation job
   */
  async generateConcept(data: ConceptDeliveryJobData) {
    return this.add('generate-concept', data, {
      priority: 1, // High priority — customer is waiting
    })
  }

  /**
   * Queue a regeneration job (admin-triggered)
   */
  async regenerateConcept(data: ConceptDeliveryJobData) {
    return this.add('regenerate-concept', data, {
      priority: 2,
    })
  }
}

// Singleton instance
export const conceptDeliveryQueue = new ConceptDeliveryQueue()
