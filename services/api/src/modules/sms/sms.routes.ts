/**
 * SMS Notification Routes
 *
 * Twilio-based SMS notification system for:
 * - Inspection reminders
 * - Payment confirmations
 * - Emergency site alerts
 * - Crew scheduling notifications
 *
 * Environment Variables:
 *   TWILIO_ACCOUNT_SID   — Twilio account SID
 *   TWILIO_AUTH_TOKEN     — Twilio auth token
 *   TWILIO_PHONE_NUMBER   — Twilio phone number (E.164 format, e.g. +12025551234)
 *
 * POST /send          — Send SMS to a phone number
 * POST /send-user     — Send SMS to a user (looks up phone from profile)
 * POST /send-project  — Send SMS to all project team members
 * POST /send-template — Send templated SMS
 * GET  /status        — Check Twilio configuration status
 * GET  /logs          — Get SMS delivery logs
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser, AuthenticatedRequest } from '../../middleware/auth.middleware'
import { validateBody, validateQuery } from '../../middleware/validation.middleware'
import { prisma } from '@kealee/database'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

const p = prisma as any

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const sendSmsSchema = z.object({
  to: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in E.164 format (e.g. +12025551234)'),
  body: z.string().min(1).max(1600, 'SMS body cannot exceed 1600 characters'),
  projectId: z.string().optional(),
})

const sendUserSmsSchema = z.object({
  userId: z.string(),
  body: z.string().min(1).max(1600),
  projectId: z.string().optional(),
})

const sendProjectSmsSchema = z.object({
  projectId: z.string(),
  body: z.string().min(1).max(1600),
  excludeUserId: z.string().optional(),
})

const sendTemplateSmsSchema = z.object({
  templateName: z.string(),
  to: z.string().regex(/^\+[1-9]\d{1,14}$/).optional(),
  userId: z.string().optional(),
  variables: z.record(z.string()).optional(),
  projectId: z.string().optional(),
})

// ============================================================================
// SMS SERVICE
// ============================================================================

class SmsService {
  private twilio: any = null
  private initialized = false
  private from: string = ''

  /**
   * Lazy-init Twilio client
   */
  private async init() {
    if (this.initialized) return

    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID
      const authToken = process.env.TWILIO_AUTH_TOKEN
      this.from = process.env.TWILIO_PHONE_NUMBER || ''

      if (!accountSid || !authToken || !this.from) {
        console.warn('[SMS] Twilio not configured — SMS notifications disabled')
        console.warn('[SMS] Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER')
        this.initialized = true
        return
      }

      const twilioLib = require('twilio')
      this.twilio = twilioLib(accountSid, authToken)
      this.initialized = true
      console.log('[SMS] Twilio client configured')
    } catch (err) {
      console.warn('[SMS] twilio module not installed — SMS notifications disabled')
      console.warn('[SMS] Run: pnpm add twilio')
      this.initialized = true
    }
  }

  get isConfigured(): boolean {
    return !!this.twilio
  }

  /**
   * Send an SMS message
   */
  async send(to: string, body: string, projectId?: string): Promise<{
    success: boolean
    messageId?: string
    error?: string
  }> {
    await this.init()

    if (!this.twilio) {
      // Graceful degradation — log the message but don't send
      console.warn(`[SMS] Would send to ${to}: "${body.substring(0, 50)}..." (Twilio not configured)`)

      // Still log it to the database
      await this.logMessage(to, body, 'DISABLED', projectId)

      return { success: false, error: 'SMS service not configured' }
    }

    try {
      const message = await this.twilio.messages.create({
        body,
        from: this.from,
        to,
      })

      // Log successful send
      await this.logMessage(to, body, 'SENT', projectId, message.sid)

      return { success: true, messageId: message.sid }
    } catch (err: any) {
      console.error(`[SMS] Failed to send to ${to}:`, err.message)

      // Log failed send
      await this.logMessage(to, body, 'FAILED', projectId, undefined, err.message)

      return { success: false, error: err.message }
    }
  }

  /**
   * Send SMS to a user by looking up their phone number
   */
  async sendToUser(userId: string, body: string, projectId?: string) {
    const user = await p.user.findUnique({
      where: { id: userId },
      select: { phone: true, name: true },
    })

    if (!user?.phone) {
      return { success: false, error: 'User has no phone number on file' }
    }

    // Check user's SMS preferences
    const prefs = await p.notificationPreference.findFirst({
      where: { userId, smsEnabled: true },
    })

    // If user has explicitly disabled SMS, respect that
    const allPrefs = await p.notificationPreference.findMany({
      where: { userId },
    })
    if (allPrefs.length > 0 && !prefs) {
      return { success: false, error: 'User has disabled SMS notifications' }
    }

    return this.send(user.phone, body, projectId)
  }

  /**
   * Send SMS to all project team members
   */
  async sendToProject(projectId: string, body: string, excludeUserId?: string) {
    const project = await p.project.findUnique({
      where: { id: projectId },
      select: { clientId: true, pmId: true, name: true },
    })

    if (!project) {
      return { success: false, error: 'Project not found', results: [] }
    }

    const userIds = [project.clientId, project.pmId].filter(
      (id: string | null): id is string => !!id && id !== excludeUserId
    )

    // Get contractor user IDs
    const contractors = await p.contractorProject?.findMany?.({
      where: { projectId },
      select: { contractorId: true },
    }).catch(() => [])

    if (contractors) {
      for (const c of contractors) {
        if (c.contractorId && c.contractorId !== excludeUserId) {
          userIds.push(c.contractorId)
        }
      }
    }

    const uniqueIds = [...new Set(userIds)]
    const results = await Promise.allSettled(
      uniqueIds.map(id => this.sendToUser(id, body, projectId))
    )

    const sent = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length
    const failed = results.length - sent

    return { success: true, sent, failed, total: results.length }
  }

  /**
   * Send a templated SMS
   */
  async sendTemplate(
    templateName: string,
    to: string | undefined,
    userId: string | undefined,
    variables: Record<string, string> = {},
    projectId?: string
  ) {
    // Look up template from MessageTemplate table
    const template = await p.messageTemplate.findFirst({
      where: {
        name: templateName,
        channel: { in: ['SMS', 'ALL'] },
        isActive: true,
      },
    })

    if (!template) {
      return { success: false, error: `Template "${templateName}" not found` }
    }

    // Replace variables in template body
    let body = template.body
    for (const [key, value] of Object.entries(variables)) {
      body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    }

    if (to) {
      return this.send(to, body, projectId)
    } else if (userId) {
      return this.sendToUser(userId, body, projectId)
    } else {
      return { success: false, error: 'Either to or userId is required' }
    }
  }

  /**
   * Log SMS to CommunicationLog for audit trail
   */
  private async logMessage(
    to: string,
    body: string,
    status: string,
    projectId?: string,
    externalId?: string,
    errorMessage?: string
  ) {
    try {
      await p.communicationLog.create({
        data: {
          projectId: projectId || null,
          type: 'NOTIFICATION',
          channel: 'SMS',
          recipientPhone: to,
          subject: null,
          body,
          status,
          sentAt: status === 'SENT' ? new Date() : null,
          metadata: {
            twilioSid: externalId,
            error: errorMessage,
          },
        },
      })
    } catch (err: any) {
      // Don't fail the SMS send if logging fails
      console.error('[SMS] Failed to log message:', err.message)
    }
  }
}

const smsService = new SmsService()

// ============================================================================
// ROUTES
// ============================================================================

export async function smsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticateUser)

  // GET /status — Check Twilio configuration
  fastify.get('/status', async (request, reply) => {
    const configured = !!process.env.TWILIO_ACCOUNT_SID &&
      !!process.env.TWILIO_AUTH_TOKEN &&
      !!process.env.TWILIO_PHONE_NUMBER

    return reply.send({
      success: true,
      configured,
      from: configured ? process.env.TWILIO_PHONE_NUMBER : undefined,
    })
  })

  // POST /send — Send SMS to a phone number
  fastify.post(
    '/send',
    { preHandler: [validateBody(sendSmsSchema)] },
    async (request, reply) => {
      try {
        const body = sendSmsSchema.parse(request.body)
        const result = await smsService.send(body.to, body.body, body.projectId)

        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ success: false, error: sanitizeErrorMessage(error, 'Failed to send SMS') })
      }
    }
  )

  // POST /send-user — Send SMS to a user by ID
  fastify.post(
    '/send-user',
    { preHandler: [validateBody(sendUserSmsSchema)] },
    async (request, reply) => {
      try {
        const body = sendUserSmsSchema.parse(request.body)
        const result = await smsService.sendToUser(body.userId, body.body, body.projectId)

        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ success: false, error: sanitizeErrorMessage(error, 'Failed to send SMS') })
      }
    }
  )

  // POST /send-project — Send SMS to project team
  fastify.post(
    '/send-project',
    { preHandler: [validateBody(sendProjectSmsSchema)] },
    async (request, reply) => {
      try {
        const body = sendProjectSmsSchema.parse(request.body)
        const result = await smsService.sendToProject(
          body.projectId,
          body.body,
          body.excludeUserId
        )

        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ success: false, error: sanitizeErrorMessage(error, 'Failed to send project SMS') })
      }
    }
  )

  // POST /send-template — Send templated SMS
  fastify.post(
    '/send-template',
    { preHandler: [validateBody(sendTemplateSmsSchema)] },
    async (request, reply) => {
      try {
        const body = sendTemplateSmsSchema.parse(request.body)
        const result = await smsService.sendTemplate(
          body.templateName,
          body.to,
          body.userId,
          body.variables,
          body.projectId
        )

        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ success: false, error: sanitizeErrorMessage(error, 'Failed to send templated SMS') })
      }
    }
  )

  // GET /logs — Get SMS delivery logs
  fastify.get(
    '/logs',
    {
      preHandler: [
        validateQuery(z.object({
          page: z.string().optional(),
          limit: z.string().optional(),
          projectId: z.string().optional(),
          status: z.string().optional(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; projectId?: string; status?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = { channel: 'SMS' }
        if (query.projectId) where.projectId = query.projectId
        if (query.status) where.status = query.status

        const [logs, total] = await Promise.all([
          p.communicationLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          p.communicationLog.count({ where }),
        ])

        return reply.send({
          success: true,
          data: logs,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ success: false, error: sanitizeErrorMessage(error, 'Failed to get SMS logs') })
      }
    }
  )
}

// Export service for use by other modules (push notifications, webhooks, etc.)
export { smsService }
