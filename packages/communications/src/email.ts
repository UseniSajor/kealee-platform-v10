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
import type { TenantOutboundBrandingInput } from '@kealee/shared'
import {
  interpolateHtmlVariables,
  interpolateTextVariables,
  renderBrandedEmailHtml,
  resolveTenantEmailEnvelope,
} from './outbound-branding'

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
  /** Explicit professional tenant. When omitted, projectId is resolved to its org. */
  orgId?: string
  userId?: string
  route?: string
  ipAddress?: string
  userAgent?: string
  /** Presentation/sender configuration only; never include provider credentials. */
  branding?: TenantOutboundBrandingInput
}

async function resolveEmailBranding(opts: SendTemplateEmailOptions): Promise<TenantOutboundBrandingInput | undefined> {
  if (opts.branding) return opts.branding
  const db = prisma as any
  const project = !opts.orgId && opts.projectId
    ? await db.project.findUnique({ where: { id: opts.projectId }, select: { orgId: true } })
    : null
  const orgId = opts.orgId ?? project?.orgId
  if (!orgId) return undefined

  const profile = await db.whiteLabelTenantProfile.findFirst({
    where: { orgId, status: 'ACTIVE', org: { status: 'ACTIVE', tenantKind: 'WHITE_LABEL' } },
    select: {
      companyName: true, productName: true, logoUrl: true,
      primaryColor: true, secondaryColor: true, accentColor: true,
      supportName: true, supportEmail: true, supportPhone: true, supportUrl: true,
      emailFromName: true, emailFromAddress: true, emailReplyToAddress: true,
      reportHeader: true, reportFooter: true, legalDisclaimer: true,
      kealeeBrandingVisible: true,
      org: {
        select: {
          whiteLabelDomains: {
            where: { status: 'ACTIVE', isPrimary: true },
            select: { hostname: true },
            take: 1,
          },
        },
      },
    },
  })
  if (!profile) return undefined
  const hostname = profile.org?.whiteLabelDomains?.[0]?.hostname
  const appUrl = hostname ? `https://${hostname}` : undefined
  return {
    companyName: profile.companyName,
    productName: profile.productName,
    logoUrl: profile.logoUrl,
    primaryColor: profile.primaryColor,
    secondaryColor: profile.secondaryColor,
    accentColor: profile.accentColor,
    supportName: profile.supportName,
    supportEmail: profile.supportEmail,
    supportPhone: profile.supportPhone,
    supportUrl: profile.supportUrl,
    appUrl,
    privacyUrl: appUrl ? `${appUrl}/privacy` : undefined,
    unsubscribeUrl: appUrl ? `${appUrl}/unsubscribe` : undefined,
    emailSenderName: profile.emailFromName,
    emailFrom: profile.emailFromAddress,
    emailReplyTo: profile.emailReplyToAddress,
    reportHeader: profile.reportHeader,
    reportFooter: profile.reportFooter,
    legalDisclaimer: profile.legalDisclaimer,
    kealeeBrandingVisible: profile.kealeeBrandingVisible,
  }
}

export interface SendEmailResult {
  messageId: string
  status: 'sent' | 'failed' | 'rate_limited'
}

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
  tags?: Array<{ name: string; value: string }>
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
  const branding = await resolveEmailBranding(opts)
  const subject = interpolateTextVariables(template.subject || template.name, opts.variables)
  const body = interpolateHtmlVariables(template.body, opts.variables)
  const html = wrapInEmailLayout(body, opts.variables.projectName, branding)
  const envelope = resolveTenantEmailEnvelope(branding)

  // 3. Create EmailEvent (QUEUED)
  const emailEvent = await prisma.emailEvent.create({
    data: {
      provider: 'resend',
      route: opts.route || 'unknown',
      template: template.name,
      fromEmail: envelope.from,
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
    from: envelope.from,
    to: [opts.to],
    subject,
    html,
    replyTo: envelope.replyTo,
    tags: [
      { name: 'template', value: template.name },
      { name: 'eventId', value: emailEvent.id },
      ...(opts.projectId ? [{ name: 'projectId', value: opts.projectId }] : []),
      ...(opts.orgId ? [{ name: 'orgId', value: opts.orgId }] : []),
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
 * Send a raw email directly without template. Used for internal system emails.
 * Should only be called from internal automation services, not public endpoints.
 */
export async function sendEmail(
  opts: SendEmailOptions
): Promise<SendEmailResult> {
  const resend = getResend()

  const { data, error } = await resend.emails.send({
    from: opts.from || DEFAULT_FROM,
    to: [opts.to],
    subject: opts.subject,
    html: opts.html,
    replyTo: opts.replyTo || DEFAULT_REPLY_TO,
    tags: opts.tags || [],
  })

  if (error) {
    console.error('[EmailService] Failed to send raw email:', error)
    return { messageId: '', status: 'failed' }
  }

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

export function wrapInEmailLayout(
  bodyHtml: string,
  projectName?: string,
  branding?: TenantOutboundBrandingInput,
): string {
  return renderBrandedEmailHtml({ bodyHtml, projectName, branding })
}
