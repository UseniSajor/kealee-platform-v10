/**
 * Clerk Webhook Route
 *
 * Keeps Prisma's User table in sync with Clerk identity events. Clerk is the
 * identity/session provider only — Org/OrgMember/Role/Permission/RolePermission
 * and StaffRoleAssignment stay authoritative in Prisma (see the Clerk
 * implementation plan). This endpoint only ever upserts/reads User rows.
 *
 * Registered as its own route (not swept into the general /webhooks prefix
 * matcher) — several other webhooks under that prefix are intentionally
 * unauthenticated third-party callbacks and must not be affected by, or
 * confused with, this route's signature verification.
 *
 * Fails CLOSED: unlike the GHL/Zoho webhooks elsewhere in this codebase,
 * which silently skip verification when their secret env var is unset, this
 * route refuses (401) if CLERK_WEBHOOK_SECRET is missing or verification
 * throws. See the Clerk plan's Security section for why that distinction
 * matters.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Webhook } from 'svix'
import { prisma } from '@kealee/database'
import { auditService } from '../audit/audit.service'

interface ClerkWebhookEvent {
  type: string
  data: {
    id: string
    email_addresses?: Array<{ id: string; email_address: string }>
    primary_email_address_id?: string
    first_name?: string | null
    last_name?: string | null
    [key: string]: unknown
  }
}

function primaryEmail(data: ClerkWebhookEvent['data']): string | undefined {
  const addresses = data.email_addresses ?? []
  const primary = addresses.find((a) => a.id === data.primary_email_address_id)
  return primary?.email_address ?? addresses[0]?.email_address
}

/**
 * user.created — upsert the User row before anything else touches it.
 * AuditLog.performedBy is a hard FK to User.id, so the upsert must commit
 * before the audit-log write below, not run in parallel with it.
 */
async function handleUserCreated(data: ClerkWebhookEvent['data'], logger: any): Promise<void> {
  const email = primaryEmail(data)
  const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || undefined

  const existing = email
    ? await prisma.user.findUnique({ where: { email } })
    : null

  let user
  if (existing) {
    // A Supabase-authed user is signing in via Clerk for the first time during
    // the coexistence window — link the existing row rather than duplicating it.
    user = await prisma.user.update({
      where: { id: existing.id },
      data: { externalAuthId: data.id, authProvider: 'clerk', name: name ?? existing.name },
    })
  } else {
    user = await prisma.user.create({
      data: {
        email,
        name,
        firstName: data.first_name ?? undefined,
        lastName: data.last_name ?? undefined,
        externalAuthId: data.id,
        authProvider: 'clerk',
      },
    })
  }

  logger.info({ userId: user.id, clerkId: data.id }, 'Clerk user.created synced')

  auditService.log({
    userId: user.id,
    userEmail: user.email ?? undefined,
    action: existing ? 'UPDATE' : 'CREATE',
    entityType: 'USER',
    entityId: user.id,
    description: existing
      ? `Existing user linked to Clerk identity: ${email}`
      : `User created via Clerk: ${email}`,
    category: 'SECURITY',
    severity: 'INFO',
  })
}

async function handleUserUpdated(data: ClerkWebhookEvent['data'], logger: any): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { externalAuthId: data.id } })
  if (!existing) {
    logger.warn({ clerkId: data.id }, 'Clerk user.updated for unknown externalAuthId — ignoring')
    return
  }

  const email = primaryEmail(data)
  const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || undefined

  await prisma.user.update({
    where: { id: existing.id },
    data: {
      email: email ?? existing.email,
      name: name ?? existing.name,
      firstName: data.first_name ?? existing.firstName,
      lastName: data.last_name ?? existing.lastName,
    },
  })

  auditService.log({
    userId: existing.id,
    userEmail: email ?? existing.email ?? undefined,
    action: 'UPDATE',
    entityType: 'USER',
    entityId: existing.id,
    description: `User profile synced from Clerk: ${email ?? existing.email}`,
    category: 'SECURITY',
    severity: 'INFO',
  })
}

export async function registerClerkWebhookRoutes(fastify: FastifyInstance) {
  // Scope a raw-buffer content type parser to just this plugin, same pattern
  // as the Stripe webhook — Svix verification needs the exact raw bytes.
  fastify.register(async (scope) => {
    scope.addContentTypeParser(
      'application/json',
      { parseAs: 'buffer' },
      (_req: FastifyRequest, body: Buffer, done: (err: Error | null, body?: Buffer) => void) => {
        done(null, body)
      }
    )

    scope.post(
      '/webhooks/clerk',
      { bodyLimit: 1000000 },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const secret = process.env.CLERK_WEBHOOK_SECRET

        // Fail closed — do not repeat the GHL/Zoho pattern of silently
        // skipping verification when the secret is unconfigured.
        if (!secret) {
          fastify.log.error('CLERK_WEBHOOK_SECRET is not set — refusing Clerk webhook')
          auditService.log({
            userId: 'system',
            action: 'ACCESS',
            entityType: 'SESSION',
            entityId: 'webhooks/clerk',
            description: 'Clerk webhook rejected: CLERK_WEBHOOK_SECRET not configured',
            category: 'SECURITY',
            severity: 'CRITICAL',
          })
          return reply.status(401).send({ error: 'Webhook not configured' })
        }

        const svixId = request.headers['svix-id'] as string
        const svixTimestamp = request.headers['svix-timestamp'] as string
        const svixSignature = request.headers['svix-signature'] as string

        if (!svixId || !svixTimestamp || !svixSignature) {
          return reply.status(400).send({ error: 'Missing Svix signature headers' })
        }

        const rawBody = request.body as Buffer
        let event: ClerkWebhookEvent
        try {
          const wh = new Webhook(secret)
          event = wh.verify(rawBody, {
            'svix-id': svixId,
            'svix-timestamp': svixTimestamp,
            'svix-signature': svixSignature,
          }) as ClerkWebhookEvent
        } catch (err: any) {
          fastify.log.error({ err }, 'Clerk webhook signature verification failed')
          auditService.log({
            userId: 'system',
            action: 'ACCESS',
            entityType: 'SESSION',
            entityId: 'webhooks/clerk',
            description: `Clerk webhook signature rejected: ${err?.message ?? 'unknown error'}`,
            category: 'SECURITY',
            severity: 'WARNING',
          })
          return reply.status(401).send({ error: 'Signature verification failed' })
        }

        try {
          switch (event.type) {
            case 'user.created':
              await handleUserCreated(event.data, fastify.log)
              break
            case 'user.updated':
              await handleUserUpdated(event.data, fastify.log)
              break
            default:
              fastify.log.info({ eventType: event.type }, 'Unhandled Clerk webhook event type')
          }
          return reply.status(200).send({ received: true })
        } catch (error) {
          fastify.log.error({ err: error }, 'Clerk webhook processing failed')
          return reply.status(500).send({ error: 'Webhook processing failed' })
        }
      }
    )
  })

  fastify.log.info('✅ Clerk webhook routes registered')
}
