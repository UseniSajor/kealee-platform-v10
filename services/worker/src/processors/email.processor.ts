import { Worker, Job } from 'bullmq'
import sgMail from '@sendgrid/mail'
import { redis } from '../config/redis.config'
import { EmailJobData } from '../types/email.types'
import { EMAIL_TEMPLATES } from '../types/email.types'

// Initialize SendGrid
const sendGridApiKey = process.env.SENDGRID_API_KEY
if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey)
} else {
  console.warn('⚠️ SENDGRID_API_KEY not set. Email sending will fail.')
}

// Default from address
const DEFAULT_FROM = process.env.SENDGRID_FROM_EMAIL || 'noreply@kealee.com'
const DEFAULT_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Kealee Platform'

/**
 * Process email template with data
 */
function processTemplate(template: string, data: Record<string, any>): string {
  let processed = template
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    processed = processed.replace(regex, String(value))
  }
  return processed
}

/**
 * Process email job
 */
async function processEmailJob(job: Job<EmailJobData>) {
  const { to, from, subject, text, html, template, templateData, cc, bcc, replyTo, attachments } = job.data

  try {
    // Get template if specified
    let emailSubject = subject
    let emailText = text
    let emailHtml = html

    if (template) {
      const emailTemplate = EMAIL_TEMPLATES[template]
      if (!emailTemplate) {
        throw new Error(`Email template "${template}" not found`)
      }

      emailSubject = processTemplate(emailTemplate.subject, templateData || {})
      emailHtml = processTemplate(emailTemplate.html, templateData || {})
      emailText = emailTemplate.text
        ? processTemplate(emailTemplate.text, templateData || {})
        : undefined
    }

    if (!emailSubject) {
      throw new Error('Email must have a subject')
    }

    if (!emailHtml && !emailText) {
      throw new Error('Email must have either html or text content')
    }

    // Prepare SendGrid message
    const msg: any = {
      to: Array.isArray(to) ? to : [to],
      from: from || `${DEFAULT_FROM_NAME} <${DEFAULT_FROM}>`,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    }

    if (cc) {
      msg.cc = Array.isArray(cc) ? cc : [cc]
    }

    if (bcc) {
      msg.bcc = Array.isArray(bcc) ? bcc : [bcc]
    }

    if (replyTo) {
      msg.replyTo = replyTo
    }

    if (attachments && attachments.length > 0) {
      msg.attachments = attachments.map((att) => ({
        content: att.content,
        filename: att.filename,
        type: att.type || 'application/octet-stream',
        disposition: att.disposition || 'attachment',
      }))
    }

    // Add metadata as custom args
    if (job.data.metadata) {
      msg.customArgs = job.data.metadata
    }

    // Send email via SendGrid
    if (!sendGridApiKey) {
      // In development, log instead of sending
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 [DEV MODE] Email would be sent:', {
          to: msg.to,
          subject: msg.subject,
          from: msg.from,
        })
        return { success: true, messageId: 'dev-mode' }
      }
      throw new Error('SENDGRID_API_KEY not configured')
    }

    const [response] = await sgMail.send(msg)

    console.log(`✅ Email sent successfully: ${job.id}`, {
      to: msg.to,
      subject: msg.subject,
      statusCode: response.statusCode,
    })

    return {
      success: true,
      messageId: response.headers['x-message-id'] || job.id,
      statusCode: response.statusCode,
    }
  } catch (error: any) {
    console.error(`❌ Failed to send email ${job.id}:`, error)
    
    // Re-throw to trigger retry logic
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
      connection: redis as any,
      concurrency: 10, // Process up to 10 emails concurrently
      limiter: {
        max: 100, // Max 100 emails per
        duration: 60000, // 1 minute (SendGrid free tier: 100/day)
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
