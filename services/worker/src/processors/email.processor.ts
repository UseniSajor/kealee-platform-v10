import { Worker, Job } from 'bullmq'
import { Resend } from 'resend'
import { redis } from '../config/redis.config'
import { EmailJobData } from '../types/email.types'
import { EMAIL_TEMPLATES } from '../types/email.types'

// Lazy-initialize Resend client
let resendClient: Resend | null = null

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not set. Email sending will fail.')
    return null
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'Kealee Platform <noreply@kealee.com>'

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
  const { to, subject, text, html, template, templateData, cc, bcc, replyTo } = job.data

  try {
    // Resolve template if specified
    let emailSubject = subject
    let emailHtml = html
    let emailText = text

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

    const resend = getResendClient()

    if (!resend) {
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 [DEV MODE] Email would be sent:', {
          to,
          subject: emailSubject,
          from: DEFAULT_FROM,
        })
        return { success: true, messageId: 'dev-mode' }
      }
      throw new Error('RESEND_API_KEY not configured')
    }

    const payload: any = {
      from: DEFAULT_FROM,
      to: Array.isArray(to) ? to : [to],
      subject: emailSubject,
      html: emailHtml,
      text: emailText || (emailHtml ? emailHtml.replace(/<[^>]*>/g, '') : undefined),
    }

    if (cc) payload.cc = Array.isArray(cc) ? cc : [cc]
    if (bcc) payload.bcc = Array.isArray(bcc) ? bcc : [bcc]
    if (replyTo) payload.reply_to = replyTo

    const result = await resend.emails.send(payload)

    const emailId = (result as any).data?.id || (result as any).id || job.id

    console.log(`✅ Email sent successfully: ${job.id}`, {
      to: payload.to,
      subject: emailSubject,
      emailId,
    })

    return { success: true, messageId: emailId }
  } catch (error: any) {
    console.error(`❌ Failed to send email ${job.id}:`, error)
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
        duration: 60000, // 200 emails per minute (Resend free: 100/day, paid: 50k+/month)
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
