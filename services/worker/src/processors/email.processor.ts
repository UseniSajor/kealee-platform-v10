import { Worker, Job } from 'bullmq'
import { redis } from '../config/redis.config'
import { EmailJobData } from '../types/email.types'
import { sendEmailWithTemplate, sendInternalSystemEmail, checkRateLimit } from '@kealee/communications'

/**
 * Process email job securely via Centralized Email Service
 */
async function processEmailJob(job: Job<EmailJobData>) {
  const { to, subject, text, html, template, templateData, cc, bcc, replyTo } = job.data

  try {
    // 1. Idempotency Check
    const idempotencyKey = `email_job_processed_${job.id}`
    const alreadyProcessed = await redis.setnx(idempotencyKey, '1')
    if (alreadyProcessed === 0) {
      console.log(`✅ Email job ${job.id} already processed (idempotency).`)
      return { success: true, messageId: 'already-processed' }
    }
    // Expire idempotency key after 7 days
    await redis.expire(idempotencyKey, 60 * 60 * 24 * 7)

    // 2. Rate Limits (Max 5 attempts per job)
    const attempts = job.attemptsMade || 0
    if (attempts >= 5) {
      throw new Error(`Email job ${job.id} exceeded maximum retry attempts.`)
    }

    if (template) {
      // Use approved DB templates
      const result = await sendEmailWithTemplate({
        to: Array.isArray(to) ? to[0] : to,
        templateName: template,
        variables: templateData || {},
        route: 'worker/email.processor'
      })
      return result
    } else if (html || text) {
      // Fallback for internal system emails ONLY
      // This is restricted by the centralized EmailService which logs to EmailEvent
      const result = await sendInternalSystemEmail({
        to: Array.isArray(to) ? to[0] : to,
        subject: subject || 'System Notification',
        html: html || text || '',
        route: 'worker/email.processor'
      }, true)
      return result
    } else {
      throw new Error('Email job must contain either a template or html/text (for internal system).')
    }
  } catch (error: any) {
    console.error(`❌ Failed to send email ${job.id}:`, error)
    // Clear idempotency key on failure so it can be retried
    await redis.del(`email_job_processed_${job.id}`)
    throw new Error(`Email send failed: ${error.message}`)
  }
}

/**
 * Create email worker
 */
export function createEmailWorker(): Worker<EmailJobData> {
  const worker = new Worker<EmailJobData>(
    'email',
    async (job) => {
      return processEmailJob(job)
    },
    {
      connection: redis,
      concurrency: 10,
      limiter: {
        max: 200,
        duration: 60000,
      },
    }
  )

  worker.on('completed', (job) => {
    console.log(`✅ Email job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`❌ Email job ${job?.id} failed:`, err.message)
  })

  worker.on('error', (err) => {
    console.error('❌ Email worker error:', err)
  })

  return worker
}
