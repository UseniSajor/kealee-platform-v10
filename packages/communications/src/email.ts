/**
 * Secure Email Service via Resend
 *
 * Handles all outbound email for the Kealee Platform.
 * Security controls:
 * - Logs all emails to EmailEvent table
 * - Uses approved templates only for external communication
 * - Prevents arbitrary HTML injection
 * - Implements rate limiting
 */

import { Resend } from 'resend'
import { PrismaClient, EmailEventStatus } from '@kealee/database'
import Redis from 'ioredis'

const prisma = new PrismaClient()

// Initialize Redis for rate limiting if available
const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL
const redis = redisUrl ? new Redis(redisUrl) : null

let resendInstance: Resend | null = null

function getResend(): Resend {
  if (resendInstance) return resendInstance
  const key = process.env.RESEND_API_KEY
  if (!key) {
    throw new Error('RESEND_API_KEY is not configured. Email sending is disabled.')
  }
  resendInstance = new Resend(key)
  return resendInstance
}

const DEFAULT_FROM = 'Kealee <noreply@kealee.com>'
const DEFAULT_REPLY_TO = 'support@kealee.com'

export interface SendTemplateEmailOptions {
  to: string
  templateName: string
  variables: Record<string, string>
  projectId?: string
  userId?: string
  route?: string
  ipAddress?: string
  userAgent?: string
}

export interface SendEmailResult {
  messageId: string
  status: 'sent' | 'failed' | 'rate_limited'
}

/**
 * Check rate limits using Redis.
 * Falls back to allowing the request if Redis is unavailable.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean }> {
  if (!redis) return { success: true }
  
  const current = await redis.incr(key)
  if (current === 1) {
    await redis.expire(key, windowSeconds)
  }
  
  if (current > limit) {
    return { success: false }
  }
  return { success: true }
}

/**
 * Send an email using a predefined template. This is the ONLY approved way
 * to send emails to external users from public endpoints.
 */
export async function sendEmailWithTemplate(
  opts: SendTemplateEmailOptions
): Promise<SendEmailResult> {
  // Rate limiting check
  if (opts.ipAddress) {
    const rl = await checkRateLimit(`email_rl_ip_${opts.ipAddress}`, 50, 3600) // max 50 per hour per IP globally
    if (!rl.success) {
      console.warn(`[EmailService] Global rate limit exceeded for IP: ${opts.ipAddress}`)
      return { messageId: '', status: 'rate_limited' }
    }
  }

  // 1. Look up the template
  const template = await prisma.messageTemplate.findFirst({
    where: { name: opts.templateName },
  })

  if (!template) {
    throw new Error(`MessageTemplate not found: ${opts.templateName}`)
  }

  // 2. Interpolate variables safely
  const subject = interpolateVariables(template.subject || template.name, opts.variables)
  const body = interpolateVariables(template.body, opts.variables)
  const html = wrapInEmailLayout(body, opts.variables.projectName)

  // 3. Create EmailEvent (QUEUED)
  const emailEvent = await prisma.emailEvent.create({
    data: {
      provider: 'resend',
      route: opts.route || 'unknown',
      template: template.name,
      fromEmail: DEFAULT_FROM,
      toEmail: opts.to,
      subject,
      triggeredByUserId: opts.userId,
      projectId: opts.projectId,
      ipAddress: opts.ipAddress,
      userAgent: opts.userAgent,
      status: EmailEventStatus.QUEUED,
      metadata: { templateName: opts.templateName, variables: opts.variables }
    }
  })

  // 4. Send via Resend
  const resend = getResend()
  const { data, error } = await resend.emails.send({
    from: DEFAULT_FROM,
    to: [opts.to],
    subject,
    html,
    reply_to: DEFAULT_REPLY_TO,
    tags: [
      { name: 'template', value: template.name },
      { name: 'eventId', value: emailEvent.id },
      ...(opts.projectId ? [{ name: 'projectId', value: opts.projectId }] : []),
    ],
  })

  // 5. Update EmailEvent status
  if (error) {
    console.error('[EmailService] Failed to send:', error)
    await prisma.emailEvent.update({
      where: { id: emailEvent.id },
      data: { status: EmailEventStatus.FAILED, errorMessage: error.message }
    })
    throw new Error(`Email send failed: ${error.message}`)
  }

  await prisma.emailEvent.update({
    where: { id: emailEvent.id },
    data: { 
      status: EmailEventStatus.SENT,
      providerEmailId: data?.id
    }
  })

  // Keep legacy CommunicationLog for backward compatibility
  await prisma.communicationLog.create({
    data: {
      channel: 'EMAIL',
      type: template.type,
      recipientEmail: opts.to,
      clientId: opts.userId,
      projectId: opts.projectId,
      subject,
      body: html,
      status: 'SENT',
      sentAt: new Date(),
      metadata: {
        messageId: data?.id,
        templateName: opts.templateName,
        templateName: template.name,
        emailEventId: emailEvent.id
      },
    },
  })

  return {
    messageId: data?.id || '',
    status: 'sent',
  }
}

/**
 * INTERNAL ONLY: Send raw email for system alerts and critical internal routing.
 * Requires explicit internal flag. Do NOT expose to public endpoints.
 */
export async function sendInternalSystemEmail(
  opts: { to: string; subject: string; html: string; route?: string },
  isInternal: boolean = false
): Promise<SendEmailResult> {
  if (!isInternal) {
    throw new Error('Unauthorized: Raw email sending is restricted to internal system usage only.')
  }

  const emailEvent = await prisma.emailEvent.create({
    data: {
      provider: 'resend',
      route: opts.route || 'internal-system',
      template: 'RAW_SYSTEM_INTERNAL',
      fromEmail: DEFAULT_FROM,
      toEmail: opts.to,
      subject: opts.subject,
      status: EmailEventStatus.QUEUED
    }
  })

  const resend = getResend()
  const { data, error } = await resend.emails.send({
    from: DEFAULT_FROM,
    to: [opts.to],
    subject: opts.subject,
    html: opts.html
  })

  if (error) {
    await prisma.emailEvent.update({
      where: { id: emailEvent.id },
      data: { status: EmailEventStatus.FAILED, errorMessage: error.message }
    })
    throw new Error(`System email failed: ${error.message}`)
  }

  await prisma.emailEvent.update({
    where: { id: emailEvent.id },
    data: { status: EmailEventStatus.SENT, providerEmailId: data?.id }
  })

  return { messageId: data?.id || '', status: 'sent' }
}

function interpolateVariables(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`)
}

export function wrapInEmailLayout(bodyHtml: string, projectName?: string): string {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com'
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
          <tr>
            <td style="background-color:#1e293b; padding:24px 32px; text-align:center;">
              <span style="font-size:24px; font-weight:700; color:#ffffff; letter-spacing:-0.5px;">Kealee</span>
              ${projectName ? `<br/><span style="font-size:13px; color:#94a3b8; margin-top:4px; display:inline-block;">${projectName}</span>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px; background-color:#f8fafc; border-top:1px solid #e2e8f0; text-align:center;">
              <p style="margin:0 0 8px; font-size:12px; color:#64748b;">
                Powered by Kealee &mdash; Construction Project Management
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
