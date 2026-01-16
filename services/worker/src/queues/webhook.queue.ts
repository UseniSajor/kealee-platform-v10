import { BaseQueue, BaseJobData } from './base.queue'
import { WebhookJobData } from '../types/webhook.types'

/**
 * Webhook queue for delivering webhooks to external endpoints
 */
export class WebhookQueue extends BaseQueue<WebhookJobData> {
  constructor() {
    super('webhook', {
      defaultJobOptions: {
        attempts: 5, // More attempts for webhook delivery
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5 second delay
        },
        removeOnComplete: {
          age: 7 * 24 * 3600, // Keep completed webhooks for 7 days
          count: 5000,
        },
        removeOnFail: {
          age: 30 * 24 * 3600, // Keep failed webhooks for 30 days
        },
      },
    })
  }

  /**
   * Add a webhook delivery job to the queue
   */
  async deliverWebhook(data: WebhookJobData) {
    return this.add('deliver-webhook', data, {
      priority: data.metadata?.priority || 0,
      attempts: data.retries || 5,
    })
  }

  /**
   * Add a webhook with custom retry configuration
   */
  async deliverWebhookWithRetries(
    url: string,
    body: any,
    options?: Partial<WebhookJobData>
  ) {
    return this.deliverWebhook({
      url,
      method: 'POST',
      body,
      ...options,
    })
  }
}

// Singleton instance
export const webhookQueue = new WebhookQueue()
