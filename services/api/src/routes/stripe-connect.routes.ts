/**
 * Stripe Connect API Routes
 * Handles contractor onboarding, payout management, and webhooks
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticateUser, requireRole } from '../middleware/auth.middleware'
import { ConnectOnboardingService } from '../modules/stripe-connect/connect-onboarding.service'
import { PayoutService } from '../modules/stripe-connect/payout.service'
import { ConnectWebhookHandler } from '../modules/stripe-connect/connect-webhook.handler'
import type { AuthenticatedRequest } from '../types/auth.types'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateConnectedAccountSchema = z.object({
  accountType: z.enum(['STANDARD', 'EXPRESS']).default('EXPRESS'),
  businessType: z.enum(['individual', 'company', 'non_profit']).optional(),
  country: z.string().length(2).optional(), // ISO 2-letter country code
  platformFeePercentage: z.number().min(0).max(30).optional(), // Max 30%
})

const GenerateOnboardingLinkSchema = z.object({
  returnUrl: z.string().url(),
  refreshUrl: z.string().url(),
})

const UpdateTaxInformationSchema = z.object({
  taxClassification: z.string(),
  taxId: z.string(), // Should be encrypted in production
  taxFormStatus: z.enum(['W9_COLLECTED', 'W8BEN_COLLECTED', 'PENDING']),
})

const CreatePayoutSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).optional().default('USD'),
  method: z.enum(['STANDARD', 'INSTANT']).optional().default('STANDARD'),
  milestoneId: z.string().uuid().optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

const ListPayoutsQuerySchema = z.object({
  status: z
    .enum(['PENDING', 'PAID', 'FAILED', 'CANCELED'])
    .optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

const ListAccountsQuerySchema = z.object({
  status: z
    .enum(['PENDING', 'ACTIVE', 'RESTRICTED', 'DISABLED'])
    .optional(),
  hasCompletedOnboarding: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

// ============================================================================
// ROUTES
// ============================================================================

export async function stripeConnectRoutes(fastify: FastifyInstance) {
  // Apply authentication to all routes (except webhook)
  fastify.addHook('onRequest', async (request, reply) => {
    // Skip auth for webhook route
    if (request.url.startsWith('/webhooks/stripe-connect')) {
      return
    }
    await authenticateUser(request as AuthenticatedRequest, reply)
  })

  // ==========================================================================
  // CONNECTED ACCOUNT ROUTES
  // ==========================================================================

  /**
   * POST /api/connect/accounts
   * Create a connected account for contractor
   */
  fastify.post('/accounts', {
    schema: {
      body: CreateConnectedAccountSchema,
      tags: ['Stripe Connect'],
      summary: 'Create connected account',
      security: [{ bearerAuth: [] }],
    },
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const user = request.user
      if (!user) {
        return reply.code(401).send({ error: 'Not authenticated' })
      }

      const body = CreateConnectedAccountSchema.parse(request.body)

      // Check if user already has a connected account
      const existing = await ConnectOnboardingService.getConnectedAccount(
        user.id
      )
      if (existing) {
        return reply.code(409).send({
          error: 'Connected account already exists',
          connectedAccount: existing,
        })
      }

      const result = await ConnectOnboardingService.createConnectedAccount({
        userId: user.id,
        accountType: body.accountType,
        email: user.email || '',
        country: body.country,
        businessType: body.businessType,
        platformFeePercentage: body.platformFeePercentage,
      })

      return reply.code(201).send({
        connectedAccount: result.connectedAccount,
        message: 'Connected account created successfully',
      })
    },
  })

  /**
   * GET /api/connect/accounts/me
   * Get current user's connected account
   */
  fastify.get('/accounts/me', {
    schema: {
      tags: ['Stripe Connect'],
      summary: 'Get my connected account',
      security: [{ bearerAuth: [] }],
    },
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const user = request.user
      if (!user) {
        return reply.code(401).send({ error: 'Not authenticated' })
      }

      const connectedAccount =
        await ConnectOnboardingService.getConnectedAccount(user.id)

      if (!connectedAccount) {
        return reply.code(404).send({
          error: 'Connected account not found',
          message: 'Please create a connected account first',
        })
      }

      return reply.send({ connectedAccount })
    },
  })

  /**
   * POST /api/connect/accounts/me/onboarding-link
   * Generate onboarding link for current user
   */
  fastify.post('/accounts/me/onboarding-link', {
    schema: {
      body: GenerateOnboardingLinkSchema,
      tags: ['Stripe Connect'],
      summary: 'Generate onboarding link',
      security: [{ bearerAuth: [] }],
    },
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const user = request.user
      if (!user) {
        return reply.code(401).send({ error: 'Not authenticated' })
      }

      const body = GenerateOnboardingLinkSchema.parse(request.body)

      const link = await ConnectOnboardingService.generateOnboardingLink({
        userId: user.id,
        returnUrl: body.returnUrl,
        refreshUrl: body.refreshUrl,
      })

      return reply.send({
        url: link.url,
        expiresAt: link.expiresAt,
        message: 'Onboarding link generated successfully',
      })
    },
  })

  /**
   * POST /api/connect/accounts/me/refresh
   * Refresh account details from Stripe
   */
  fastify.post('/accounts/me/refresh', {
    schema: {
      tags: ['Stripe Connect'],
      summary: 'Refresh account details',
      security: [{ bearerAuth: [] }],
    },
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const user = request.user
      if (!user) {
        return reply.code(401).send({ error: 'Not authenticated' })
      }

      const result = await ConnectOnboardingService.refreshAccountDetails(
        user.id
      )

      return reply.send({
        connectedAccount: result.connectedAccount,
        message: 'Account details refreshed',
      })
    },
  })

  /**
   * GET /api/connect/accounts/me/requirements
   * Get missing account requirements
   */
  fastify.get('/accounts/me/requirements', {
    schema: {
      tags: ['Stripe Connect'],
      summary: 'Get account requirements',
      security: [{ bearerAuth: [] }],
    },
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const user = request.user
      if (!user) {
        return reply.code(401).send({ error: 'Not authenticated' })
      }

      const requirements =
        await ConnectOnboardingService.getAccountRequirements(user.id)

      return reply.send({ requirements })
    },
  })

  /**
   * GET /api/connect/accounts/me/balance
   * Get account balance from Stripe
   */
  fastify.get('/accounts/me/balance', {
    schema: {
      tags: ['Stripe Connect'],
      summary: 'Get account balance',
      security: [{ bearerAuth: [] }],
    },
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const user = request.user
      if (!user) {
        return reply.code(401).send({ error: 'Not authenticated' })
      }

      const balance = await ConnectOnboardingService.getAccountBalance(
        user.id
      )

      return reply.send({ balance })
    },
  })

  /**
   * PUT /api/connect/accounts/me/tax-information
   * Update tax information
   */
  fastify.put('/accounts/me/tax-information', {
    schema: {
      body: UpdateTaxInformationSchema,
      tags: ['Stripe Connect'],
      summary: 'Update tax information',
      security: [{ bearerAuth: [] }],
    },
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const user = request.user
      if (!user) {
        return reply.code(401).send({ error: 'Not authenticated' })
      }

      const body = UpdateTaxInformationSchema.parse(request.body)

      const updated = await ConnectOnboardingService.updateTaxInformation(
        user.id,
        body
      )

      return reply.send({
        connectedAccount: updated,
        message: 'Tax information updated',
      })
    },
  })

  // ==========================================================================
  // PAYOUT ROUTES
  // ==========================================================================

  /**
   * POST /api/connect/payouts
   * Create a payout (for milestone completion)
   */
  fastify.post('/payouts', {
    schema: {
      body: CreatePayoutSchema,
      tags: ['Stripe Connect'],
      summary: 'Create payout',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [requireRole(['admin', 'finance'])],
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const user = request.user
      if (!user) {
        return reply.code(401).send({ error: 'Not authenticated' })
      }

      const body = CreatePayoutSchema.parse(request.body)

      // Get connected account for contractor
      // NOTE: In production, you'd get this from the milestone or project
      const connectedAccount =
        await ConnectOnboardingService.getConnectedAccount(user.id)

      if (!connectedAccount) {
        return reply.code(404).send({
          error: 'Connected account not found',
          message: 'Contractor must set up connected account first',
        })
      }

      const payout = await PayoutService.createPayout({
        connectedAccountId: connectedAccount.id,
        amount: body.amount,
        currency: body.currency,
        method: body.method,
        milestoneId: body.milestoneId,
        initiatedBy: user.id,
        description: body.description,
        metadata: body.metadata,
      })

      // Automatically process payout
      const processed = await PayoutService.processPayout({
        payoutId: payout.id,
        approvedBy: user.id,
      })

      return reply.code(201).send({
        payout: processed,
        message: 'Payout created and processed',
      })
    },
  })

  /**
   * GET /api/connect/payouts
   * List payouts for current user
   */
  fastify.get('/payouts', {
    schema: {
      querystring: ListPayoutsQuerySchema,
      tags: ['Stripe Connect'],
      summary: 'List payouts',
      security: [{ bearerAuth: [] }],
    },
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const user = request.user
      if (!user) {
        return reply.code(401).send({ error: 'Not authenticated' })
      }

      const query = ListPayoutsQuerySchema.parse(request.query)

      // Get user's connected account
      const connectedAccount =
        await ConnectOnboardingService.getConnectedAccount(user.id)

      if (!connectedAccount) {
        return reply.send({ payouts: [], total: 0 })
      }

      const result = await PayoutService.listPayouts({
        connectedAccountId: connectedAccount.id,
        status: query.status,
        limit: query.limit,
        offset: query.offset,
      })

      return reply.send(result)
    },
  })

  /**
   * GET /api/connect/payouts/:id
   * Get single payout details
   */
  fastify.get('/payouts/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      tags: ['Stripe Connect'],
      summary: 'Get payout details',
      security: [{ bearerAuth: [] }],
    },
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const user = request.user
      if (!user) {
        return reply.code(401).send({ error: 'Not authenticated' })
      }

      const { id } = request.params as { id: string }

      const payout = await PayoutService.getPayout(id)

      if (!payout) {
        return reply.code(404).send({ error: 'Payout not found' })
      }

      // Verify user owns this payout (or is admin)
      const connectedAccount =
        await ConnectOnboardingService.getConnectedAccount(user.id)

      if (
        connectedAccount?.id !== payout.connectedAccountId &&
        // TODO: Check if user is admin
        false
      ) {
        return reply.code(403).send({ error: 'Access denied' })
      }

      return reply.send({ payout })
    },
  })

  /**
   * GET /api/connect/payouts/stats/me
   * Get payout statistics for current user
   */
  fastify.get('/payouts/stats/me', {
    schema: {
      tags: ['Stripe Connect'],
      summary: 'Get payout statistics',
      security: [{ bearerAuth: [] }],
    },
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const user = request.user
      if (!user) {
        return reply.code(401).send({ error: 'Not authenticated' })
      }

      const connectedAccount =
        await ConnectOnboardingService.getConnectedAccount(user.id)

      if (!connectedAccount) {
        return reply.send({
          stats: {
            total: 0,
            pending: 0,
            paid: 0,
            failed: 0,
            canceled: 0,
            totalAmount: 0,
            totalFees: 0,
          },
        })
      }

      const stats = await PayoutService.getPayoutStats(connectedAccount.id)

      return reply.send({ stats })
    },
  })

  // ==========================================================================
  // ADMIN ROUTES
  // ==========================================================================

  /**
   * GET /api/connect/admin/accounts
   * List all connected accounts (admin only)
   */
  fastify.get('/admin/accounts', {
    schema: {
      querystring: ListAccountsQuerySchema,
      tags: ['Stripe Connect - Admin'],
      summary: 'List all connected accounts',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [requireRole(['admin'])],
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const query = ListAccountsQuerySchema.parse(request.query)

      const result = await ConnectOnboardingService.listConnectedAccounts({
        status: query.status,
        hasCompletedOnboarding: query.hasCompletedOnboarding,
        limit: query.limit,
        offset: query.offset,
      })

      return reply.send(result)
    },
  })

  // ==========================================================================
  // WEBHOOK ROUTE
  // ==========================================================================

  /**
   * POST /api/connect/webhooks/stripe-connect
   * Handle Stripe Connect webhooks
   */
  fastify.post('/webhooks/stripe-connect', {
    config: {
      rawBody: true, // Required for signature verification
    },
    schema: {
      tags: ['Stripe Connect - Webhooks'],
      summary: 'Stripe Connect webhook endpoint',
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const signature = request.headers['stripe-signature'] as string

      if (!signature) {
        return reply.code(400).send({ error: 'Missing stripe-signature header' })
      }

      const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET!

      try {
        // Verify webhook signature
        const event = ConnectWebhookHandler.verifyWebhookSignature(
          request.rawBody || request.body,
          signature,
          webhookSecret
        )

        // Process webhook
        await ConnectWebhookHandler.processWebhook(event)

        return reply.send({ received: true })
      } catch (error: any) {
        console.error('Webhook error:', error)
        return reply.code(400).send({ error: error.message })
      }
    },
  })
}

