import { Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'
import { logger } from '../lib/logger'

/**
 * Email Processor
 * Handles all email delivery via queue
 * Falls back to console if SendGrid unavailable
 */

export interface EmailJob {
  to: string
  from?: string
  subject: string
  template: 'payment-confirmed' | 'processing-started' | 'results-ready' | 'generic'
  data: Record<string, any>
  retryCount?: number
}

// SendGrid client (optional)
let sendGridClient: any = null
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY

if (SENDGRID_API_KEY) {
  try {
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(SENDGRID_API_KEY)
    sendGridClient = sgMail
    logger.info('SendGrid initialized for email delivery')
  } catch (err) {
    logger.warn('SendGrid not available, falling back to console:', err)
  }
}

/**
 * Email templates
 */
const EMAIL_TEMPLATES: Record<string, (data: any) => { subject: string; html: string }> = {
  'payment-confirmed': (data) => ({
    subject: `Payment Confirmed: ${data.orderType || 'Order'} #${data.orderId || ''}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payment Confirmed</h2>
        <p>Hi ${data.customerName || 'there'},</p>
        <p>Your payment of $${data.amount || 0} has been received.</p>
        <p><strong>Order Details:</strong></p>
        <ul>
          <li>Order ID: ${data.orderId || 'N/A'}</li>
          <li>Type: ${data.orderType || 'N/A'}</li>
          <li>Amount: $${data.amount || 0}</li>
        </ul>
        <p>We'll get started on your ${data.orderType?.toLowerCase() || 'project'} right away.</p>
        <p>Questions? Contact us at support@kealee.com</p>
      </div>
    `
  }),

  'processing-started': (data) => ({
    subject: `Processing Started: ${data.projectType || 'Project'} #${data.projectId || ''}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Processing Started</h2>
        <p>Hi ${data.customerName || 'there'},</p>
        <p>Your ${data.projectType?.toLowerCase() || 'project'} is now being processed.</p>
        <p><strong>Project Details:</strong></p>
        <ul>
          <li>Project ID: ${data.projectId || 'N/A'}</li>
          <li>Type: ${data.projectType || 'N/A'}</li>
          <li>Status: Processing</li>
          <li>Expected completion: ${data.expectedDate || 'TBD'}</li>
        </ul>
        <p>You'll receive updates as we progress.</p>
        <p>Questions? Contact us at support@kealee.com</p>
      </div>
    `
  }),

  'results-ready': (data) => ({
    subject: `Your Results Are Ready: ${data.projectType || 'Project'} #${data.projectId || ''}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Results Ready</h2>
        <p>Hi ${data.customerName || 'there'},</p>
        <p>Your ${data.projectType?.toLowerCase() || 'project'} results are ready!</p>
        <p><strong>Project Details:</strong></p>
        <ul>
          <li>Project ID: ${data.projectId || 'N/A'}</li>
          <li>Type: ${data.projectType || 'N/A'}</li>
          <li>Status: Complete</li>
          <li>Download link: <a href="${data.downloadLink || '#'}">Get Your Results</a></li>
        </ul>
        <p>Next steps: ${data.nextSteps || 'Review your results and let us know if you have any questions.'}</p>
        <p>Questions? Contact us at support@kealee.com</p>
      </div>
    `
  }),

  'generic': (data) => ({
    subject: data.subject || 'Message from Kealee',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${data.heading || 'Update'}</h2>
        <p>${data.body || 'No content'}</p>
        <p>Questions? Contact us at support@kealee.com</p>
      </div>
    `
  })
}

/**
 * Send email via SendGrid or console
 */
async function sendEmail(emailData: EmailJob): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const template = EMAIL_TEMPLATES[emailData.template] || EMAIL_TEMPLATES['generic']
  const { subject, html } = template(emailData.data)

  const message = {
    to: emailData.to,
    from: emailData.from || 'noreply@kealee.com',
    subject,
    html,
  }

  try {
    if (sendGridClient) {
      // Try SendGrid first
      const response = await sendGridClient.send(message)
      const messageId = response[0]?.headers?.['x-message-id'] || 'unknown'
      logger.info(`Email sent via SendGrid: ${messageId} → ${emailData.to}`)
      return { success: true, messageId }
    } else {
      // Fallback to console
      logger.warn(`SendGrid unavailable, logging email to console: ${emailData.to}`)
      console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EMAIL (CONSOLE FALLBACK)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To: ${message.to}
From: ${message.from}
Subject: ${message.subject}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${message.html}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `)
      return { success: true, messageId: 'console-logged' }
    }
  } catch (error) {
    logger.error(`Failed to send email to ${emailData.to}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Process email jobs from queue
 */
export async function setupEmailProcessor(redis: Redis) {
  const emailQueue = 'email'

  const worker = new Worker(
    emailQueue,
    async (job: Job<EmailJob>) => {
      logger.info(`Processing email job: ${job.id} → ${job.data.to}`)

      try {
        const result = await sendEmail(job.data)

        if (result.success) {
          logger.info(`Email job completed: ${job.id} (messageId: ${result.messageId})`)
          return { success: true, messageId: result.messageId }
        } else {
          throw new Error(result.error || 'Email send failed')
        }
      } catch (error) {
        logger.error(`Email job failed: ${job.id}`, error)

        // Retry logic
        const attempt = (job.attemptsMade ?? 0) + 1
        if (attempt < 3) {
          logger.info(`Retrying email job ${job.id} (attempt ${attempt}/3)`)
          throw error // BullMQ will retry
        } else {
          logger.error(`Email job ${job.id} failed after 3 attempts`)
          return { success: false, error: error instanceof Error ? error.message : 'Failed' }
        }
      }
    },
    {
      connection: redis,
      concurrency: 5,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      }
    }
  )

  // Event handlers
  worker.on('completed', (job) => {
    logger.info(`Email job completed: ${job.id}`)
  })

  worker.on('failed', (job, error) => {
    logger.error(`Email job failed: ${job?.id}`, error)
  })

  worker.on('error', (error) => {
    logger.error('Email worker error:', error)
  })

  logger.info('Email processor initialized and listening')
  return worker
}

/**
 * Export queue helper function for adding emails
 */
export function getEmailQueue(redis: Redis) {
  const { Queue } = require('bullmq')
  return new Queue('email', { connection: redis })
}

/**
 * Helper to queue an email
 */
export async function queueEmail(redis: Redis, emailData: EmailJob): Promise<string> {
  const queue = getEmailQueue(redis)
  const job = await queue.add('send-email', emailData, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  })
  logger.info(`Email queued: ${job.id} → ${emailData.to}`)
  return job.id
}
