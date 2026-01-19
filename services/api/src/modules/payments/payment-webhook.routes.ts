/**
 * Payment Webhook Routes
 * Handles Stripe payment webhooks
 */

import { FastifyInstance } from 'fastify'
import { paymentWebhookService } from './payment-webhook.service'
import { stripeConnectService } from './stripe-connect.service'
import { getStripe } from '../billing/stripe.client'

export async function paymentWebhookRoutes(fastify: FastifyInstance) {
  // POST /payments/webhooks/stripe - Stripe payment webhooks
  fastify.post(
    '/webhooks/stripe',
    {
      config: { rawBody: true },
    },
    async (request, reply) => {
      try {
        const stripe = getStripe()
        const sig = (request.headers as any)['stripe-signature']
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

        if (!webhookSecret) {
          fastify.log.error('STRIPE_WEBHOOK_SECRET is not set')
          return reply.code(500).send({ error: 'Webhook secret not configured' })
        }

        let event: any

        try {
          // Verify webhook signature
          event = stripe.webhooks.constructEvent(
            (request as any).rawBody || request.body,
            sig,
            webhookSecret
          )
        } catch (err: any) {
          fastify.log.error(`Webhook signature verification failed: ${err.message}`)
          return reply.code(400).send({ error: `Webhook Error: ${err.message}` })
        }

        // Handle payment events
        if (
          event.type.startsWith('payment_intent.') ||
          event.type.startsWith('transfer.') ||
          event.type.startsWith('payout.') ||
          event.type.startsWith('charge.')
        ) {
          await paymentWebhookService.handleWebhook(event)
        }

        // Handle Connect events
        if (event.type.startsWith('account.')) {
          await stripeConnectService.handleConnectWebhook(event)
        }

        return reply.send({ received: true })
      } catch (error: any) {
        fastify.log.error('Payment webhook error:', error)
        // Always return 200 to Stripe even on error
        return reply.send({ received: true, error: error.message })
      }
    }
  )
}
