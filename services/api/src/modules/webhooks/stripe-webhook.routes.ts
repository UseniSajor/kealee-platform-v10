/**
 * Stripe Webhook Routes
 * Registers webhook handlers and provides status/health endpoints
 */

import type { FastifyInstance } from 'fastify'
import { registerStripeWebhookHandler } from './stripe-webhook.handler'

/**
 * Register all Stripe webhook routes
 */
export async function registerStripeWebhookRoutes(fastify: FastifyInstance) {
  try {
    // Register main webhook handler
    await registerStripeWebhookHandler(fastify)

    /**
     *  GET /webhooks/stripe/health
     * Health check for Stripe webhook integration
     */
    fastify.get('/webhooks/stripe/health', async (request, reply) => {
      return reply.send({
        status: 'healthy',
        endpoint: '/webhooks/stripe',
        signature_verification: 'enabled',
        api_version: '2024-04-10',
      })
    })

    /**
     * GET /webhooks/stripe/config
     * Get webhook configuration (for admin/debugging)
     * Requires API key authentication
     */
    fastify.get('/webhooks/stripe/config', async (request, reply) => {
      // Check if authenticated
      if (!request.user) {
        return reply.status(403).send({
          error: 'UNAUTHORIZED',
          message: 'Authentication required',
        })
      }

      return reply.send({
        webhook_endpoint: '/webhooks/stripe',
        events: [
          'checkout.session.completed',
          'charge.failed',
          'customer.subscription.updated',
          'customer.subscription.deleted',
        ],
        signature_verification: true,
        webhook_url: `${process.env.API_URL || 'https://api.kealee.com'}/webhooks/stripe`,
      })
    })

    fastify.log.info('✅ Stripe webhook routes registered')
  } catch (error) {
    fastify.log.error('❌ Failed to register Stripe webhook routes:', error)
    throw error
  }
}

export { registerStripeWebhookHandler }
