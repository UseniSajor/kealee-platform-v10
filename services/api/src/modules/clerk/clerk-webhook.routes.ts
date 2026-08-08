/**
 * Clerk Webhook Handler
 * Syncs Clerk user events to Kealee database
 * Events: user.created, user.updated, user.deleted
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Webhook } from 'svix'
import { prisma } from '@kealee/database'

export async function registerClerkWebhookRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/clerk/webhooks
   * Verify webhook signature and sync user data
   */
  fastify.post<{ Body: any }>('/api/clerk/webhooks', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = request.body
      const headers = request.headers

      // Verify webhook signature
      const wh = new Webhook(process.env.CLERK_WEBHOOK_SIGNING_SECRET || '')
      let event
      try {
        event = wh.verify(JSON.stringify(payload), headers as any)
      } catch (err) {
        console.error('[Clerk Webhook] Invalid signature:', err)
        return reply.status(401).send({ error: 'Invalid signature' })
      }

      // Handle user.created
      if (event.type === 'user.created') {
        const clerkUser = event.data
        console.log('[Clerk Webhook] user.created:', clerkUser.id)

        const existingUser = await prisma.user.findUnique({
          where: { clerkUserId: clerkUser.id },
        })

        if (!existingUser) {
          // Create new user linked to Clerk
          await prisma.user.create({
            data: {
              clerkUserId: clerkUser.id,
              email: clerkUser.email_addresses?.[0]?.email_address || null,
              firstName: clerkUser.first_name || null,
              lastName: clerkUser.last_name || null,
              name: `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim() || null,
              status: 'ACTIVE',
              role: 'USER',
            },
          })
        }
      }

      // Handle user.updated
      if (event.type === 'user.updated') {
        const clerkUser = event.data
        console.log('[Clerk Webhook] user.updated:', clerkUser.id)

        const kealeeUser = await prisma.user.findUnique({
          where: { clerkUserId: clerkUser.id },
        })

        if (kealeeUser) {
          // Update user with latest Clerk data
          await prisma.user.update({
            where: { id: kealeeUser.id },
            data: {
              email: clerkUser.email_addresses?.[0]?.email_address || null,
              firstName: clerkUser.first_name || null,
              lastName: clerkUser.last_name || null,
              name: `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim() || null,
              // Preserve existing Kealee fields (role, status, etc.)
            },
          })
        }
      }

      // Handle user.deleted
      if (event.type === 'user.deleted') {
        const clerkUser = event.data
        console.log('[Clerk Webhook] user.deleted:', clerkUser.id)

        const kealeeUser = await prisma.user.findUnique({
          where: { clerkUserId: clerkUser.id },
        })

        if (kealeeUser) {
          // Archive user instead of deleting (preserve history)
          await prisma.user.update({
            where: { id: kealeeUser.id },
            data: {
              status: 'DELETED',
              // Do NOT delete projects, estimates, payments, or other data
            },
          })

          // Optionally revoke all active sessions
          await prisma.userSession.updateMany({
            where: { userId: kealeeUser.id },
            data: { isRevoked: true },
          })
        }
      }

      // Handle organization.created (if using Clerk Organizations)
      if (event.type === 'organization.created') {
        const clerkOrg = event.data
        console.log('[Clerk Webhook] organization.created:', clerkOrg.id)

        const existingOrg = await prisma.org.findUnique({
          where: { clerkOrgId: clerkOrg.id },
        })

        if (!existingOrg) {
          await prisma.org.create({
            data: {
              clerkOrgId: clerkOrg.id,
              name: clerkOrg.name,
              slug: clerkOrg.slug || clerkOrg.id.substring(0, 16),
              status: 'ACTIVE',
            },
          })
        }
      }

      // Handle organization.deleted
      if (event.type === 'organization.deleted') {
        const clerkOrg = event.data
        console.log('[Clerk Webhook] organization.deleted:', clerkOrg.id)

        const kealeeOrg = await prisma.org.findUnique({
          where: { clerkOrgId: clerkOrg.id },
        })

        if (kealeeOrg) {
          // Archive instead of deleting
          await prisma.org.update({
            where: { id: kealeeOrg.id },
            data: { status: 'DELETED' },
          })
        }
      }

      return reply.status(200).send({ success: true })
    } catch (error) {
      console.error('[Clerk Webhook] Error processing event:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  })
}

/**
 * Register webhook routes
 * Call this in services/api/src/index.ts during fastify setup
 */
export async function setupClerkWebhooks(fastify: FastifyInstance) {
  await registerClerkWebhookRoutes(fastify)
  console.log('[Clerk] Webhooks registered at /api/clerk/webhooks')
}
