import { BaseQueue, BaseJobData } from './base.queue'
import { EmailJobData } from '../types/email.types'

/**
 * Email queue for sending emails via Resend
 */
export class EmailQueue extends BaseQueue<EmailJobData> {
  constructor() {
    super('email', {
      defaultJobOptions: {
        attempts: 5, // More attempts for email delivery
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5 second delay
        },
        removeOnComplete: {
          age: 7 * 24 * 3600, // Keep completed emails for 7 days
          count: 5000,
        },
        removeOnFail: {
          age: 30 * 24 * 3600, // Keep failed emails for 30 days
        },
      },
    })
  }

  /**
   * Add an email job to the queue
   */
  async sendEmail(data: EmailJobData) {
    return this.add('send-email', data, {
      priority: data.metadata?.priority || 0,
    })
  }

  /**
   * Add a templated email job
   */
  async sendTemplatedEmail(
    to: string | string[],
    template: string,
    templateData: Record<string, any>,
    options?: Partial<EmailJobData>
  ) {
    return this.sendEmail({
      to,
      template,
      templateData,
      ...options,
    })
  }
}

// Singleton instance
export const emailQueue = new EmailQueue()
