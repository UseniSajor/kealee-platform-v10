/**
 * services/api/src/modules/marketplace/guest-checkout.routes.ts
 *
 * Sprint 4A — Anonymous / Guest Checkout
 *
 * POST /marketplace/checkout/guest
 *   - No auth required
 *   - Creates a Stripe Checkout session with guest metadata
 *   - Returns { sessionId, url }
 *   - On session.completed webhook → GuestOrder record is created
 *     (see: stripe-webhook-handler.ts handleCheckoutCompleted)
 *
 * GET /marketplace/checkout/guest/success?session_id=xxx
 *   - Polled by the success page to check order status
 *   - Returns { status, guestOrderId, canClaim }
 */

import { FastifyInstance } from 'fastify'
import Stripe from 'stripe'
import { z } from 'zod'
import { prismaAny } from '../../utils/prisma-helper'
import { createLogger } from '@kealee/observability'

const logger = createLogger('guest-checkout')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const guestCheckoutBodySchema = z.object({
  /** The marketplace item being purchased */
  itemType: z.enum(['FEASIBILITY_REPORT', 'PERMIT_PREP', 'ESTIMATE_PACKAGE', 'MARKETPLACE_SERVICE']),
  itemId:   z.string().uuid().optional(),
  priceId:  z.string().min(1, 'Stripe priceId required'),
  /** Buyer contact info for post-purchase email + account matching */
  email:    z.string().email(),
  name:     z.string().min(1),
  /** Optional project context */
  projectId: z.string().uuid().optional(),
  /** Optional referral / UTM data */
  utmSource: z.string().optional(),
})

export async function guestCheckoutRoutes(fastify: FastifyInstance) {
  // ── POST /checkout/guest ────────────────────────────────────────────────────

  fastify.post<{ Body: z.infer<typeof guestCheckoutBodySchema> }>(
    '/checkout/guest',
    async (request, reply) => {
      const body = guestCheckoutBodySchema.safeParse(request.body)
      if (!body.success) {
        return reply.code(422).send({ error: 'Validation failed', issues: body.error.errors })
      }

      const { itemType, itemId, priceId, email, name, projectId, utmSource } = body.data

      // Generate a short-lived guest token for order tracking
      const guestToken = `gt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          line_items: [
            {
              price:    priceId,
              quantity: 1,
            },
          ],
          customer_email: email,
          metadata: {
            guestToken,
            guestEmail: email,
            guestName:  name,
            itemType,
            itemId:     itemId ?? '',
            projectId:  projectId ?? '',
            utmSource:  utmSource ?? '',
            orderType:  'GUEST',
          },
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace/checkout/success?session_id={CHECKOUT_SESSION_ID}&token=${guestToken}`,
          cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/marketplace/checkout/cancel`,
        })

        logger.info({ guestToken, itemType, email: email.replace(/(?<=.{2}).(?=.*@)/, '*') }, 'Guest checkout session created')

        return reply.code(201).send({
          sessionId:  session.id,
          url:        session.url,
          guestToken,
        })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        logger.error({ err: msg }, 'Failed to create guest checkout session')
        return reply.code(502).send({ error: 'Failed to create checkout session' })
      }
    },
  )

  // ── GET /checkout/guest/success ─────────────────────────────────────────────

  fastify.get<{ Querystring: { session_id?: string; token?: string } }>(
    '/checkout/guest/success',
    async (request, reply) => {
      const { session_id: sessionId, token: guestToken } = request.query

      if (!sessionId && !guestToken) {
        return reply.code(400).send({ error: 'session_id or token required' })
      }

      // Look up GuestOrder by token or session
      const guestOrder = await prismaAny.guestOrder.findFirst({
        where: {
          OR: [
            sessionId  ? { stripeSessionId: sessionId } : undefined,
            guestToken ? { guestToken }                 : undefined,
          ].filter(Boolean),
        },
        select: {
          id:          true,
          status:      true,
          guestEmail:  true,
          itemType:    true,
          guestToken:  true,
          createdAt:   true,
          claimedByUserId: true,
        },
      }).catch(() => null)

      if (!guestOrder) {
        // Session may still be in flight — return pending
        return reply.send({ status: 'PENDING', canClaim: false })
      }

      return reply.send({
        status:       guestOrder.status,
        guestOrderId: guestOrder.id,
        itemType:     guestOrder.itemType,
        canClaim:     !guestOrder.claimedByUserId,
      })
    },
  )

  // ── POST /checkout/guest/claim ───────────────────────────────────────────────
  // Authenticated users call this to claim an anonymous order they just placed

  fastify.post<{ Body: { guestToken: string } }>(
    '/checkout/guest/claim',
    async (request, reply) => {
      const user = (request as any).user as { id: string } | undefined
      if (!user) {
        return reply.code(401).send({ error: 'Authentication required to claim order' })
      }

      const { guestToken } = request.body ?? {}
      if (!guestToken) {
        return reply.code(422).send({ error: 'guestToken required' })
      }

      const updated = await prismaAny.guestOrder.updateMany({
        where: {
          guestToken,
          status:          'FULFILLED',
          claimedByUserId: null,
        },
        data: {
          claimedByUserId: user.id,
          claimedAt:       new Date(),
        },
      }).catch(() => null)

      if (!updated || updated.count === 0) {
        return reply.code(404).send({ error: 'Order not found or already claimed' })
      }

      logger.info({ guestToken, userId: user.id }, 'Guest order claimed by authenticated user')
      return reply.send({ claimed: true })
    },
  )
}
