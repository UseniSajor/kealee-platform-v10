import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { paymentService } from './payment.service'
import { milestonePaymentRoutes } from './milestone-payment.routes'
import { paymentWebhookRoutes } from './payment-webhook.routes'
import { unifiedPaymentService } from './unified-payment.service'
import { prismaAny } from '../../utils/prisma-helper'

const releasePaymentSchema = z.object({
  skipHoldback: z.boolean().optional(),
  notes: z.string().optional(),
})

export async function paymentRoutes(fastify: FastifyInstance) {
  // Get escrow agreement for project (Prompt 3.4)
  fastify.get(
    '/projects/:projectId/escrow',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { projectId } = request.params as { projectId: string }
      const escrow = await paymentService.getEscrowAgreement(projectId, user.id)
      return reply.send({ escrow })
    }
  )

  // Check if payment can be released (Prompt 3.4)
  fastify.get(
    '/milestones/:milestoneId/can-release',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ milestoneId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { milestoneId } = request.params as { milestoneId: string }
      const result = await paymentService.canReleasePayment(milestoneId, user.id)
      return reply.send(result)
    }
  )

  // Release payment for milestone (Prompt 3.4)
  fastify.post(
    '/milestones/:milestoneId/release-payment',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ milestoneId: z.string().uuid() })),
        validateBody(releasePaymentSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { milestoneId } = request.params as { milestoneId: string }
      const { skipHoldback, notes } = (request.body as { skipHoldback?: boolean; notes?: string }) || {}
      const result = await paymentService.releasePayment(milestoneId, user.id, {
        skipHoldback,
        notes,
      })
      return reply.send({ success: true, ...result })
    }
  )

  // Get payment history (Prompt 3.4)
  fastify.get(
    '/projects/:projectId/payments',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { projectId } = request.params as { projectId: string }
      const query = request.query as {
        limit?: string
        offset?: string
        status?: string
        startDate?: string
        endDate?: string
      }
      const history = await paymentService.getPaymentHistory(projectId, user.id, {
        limit: query.limit ? parseInt(query.limit) : undefined,
        offset: query.offset ? parseInt(query.offset) : undefined,
        status: query.status,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      })
      return reply.send(history)
    }
  )

  // POST /payments/invoices - Generate invoice
  fastify.post(
    '/invoices',
    {
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          orgId: z.string().uuid().optional(),
          subscriptionId: z.string().uuid().optional(),
          amount: z.number().positive(),
          currency: z.string().optional().default('usd'),
          description: z.string().optional(),
          lineItems: z.array(z.object({
            description: z.string(),
            quantity: z.number().positive(),
            unitPrice: z.number().positive(),
            amount: z.number().positive(),
          })),
          dueDate: z.string().optional(),
          metadata: z.record(z.any()).optional(),
        })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const body = request.body as {
        orgId?: string
        subscriptionId?: string
        amount: number
        currency?: string
        description?: string
        lineItems: Array<{
          description: string
          quantity: number
          unitPrice: number
          amount: number
        }>
        dueDate?: string
        metadata?: Record<string, any>
      }
      const invoice = await paymentService.generateInvoice({
        ...body,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      })
      return reply.code(201).send({ invoice })
    }
  )

  // GET /payments/invoices/:id - Get invoice
  fastify.get(
    '/invoices/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const invoice = await prismaAny.invoice.findUnique({
        where: { id },
      })
      if (!invoice) {
        return reply.code(404).send({ error: 'Invoice not found' })
      }
      // TODO: Check user access
      return reply.send({ invoice })
    }
  )

  // POST /payments/intents - Create payment intent with flexible options
  fastify.post(
    '/intents',
    {
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          amount: z.number().positive(),
          currency: z.string().optional().default('usd'),
          description: z.string().optional(),
          customerId: z.string().optional(),
          paymentMethodId: z.string().optional(),
          savePaymentMethod: z.boolean().optional().default(false),
          metadata: z.record(z.any()).optional(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string; email?: string }
        const body = request.body as {
          amount: number
          currency?: string
          description?: string
          customerId?: string
          paymentMethodId?: string
          savePaymentMethod?: boolean
          metadata?: Record<string, any>
        }

        const result = await paymentService.createPaymentIntent({
          ...body,
          currency: body.currency || 'usd', // Ensure currency is always provided
          userId: user.id,
          userEmail: user.email,
        })

        return reply.code(201).send(result)
      } catch (error: any) {
        request.log.error(error)
        // Handle Stripe errors
        if (error.type === 'StripeCardError') {
          return reply.code(400).send({
            error: error.message || 'Card error',
          })
        }
        return reply.code(500).send({
          error: error.message || 'Payment processing failed',
        })
      }
    }
  )

  // GET /payments - Get user payment history
  fastify.get(
    '/',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const query = request.query as {
          limit?: string
          offset?: string
          status?: string
          startDate?: string
          endDate?: string
          startingAfter?: string
        }

        const history = await paymentService.getUserPaymentHistory(user.id, {
          limit: query.limit ? parseInt(query.limit) : undefined,
          offset: query.offset ? parseInt(query.offset) : undefined,
          status: query.status,
          startDate: query.startDate ? new Date(query.startDate) : undefined,
          endDate: query.endDate ? new Date(query.endDate) : undefined,
          startingAfter: query.startingAfter,
        })

        return reply.send(history)
      } catch (error: any) {
        request.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to fetch payments',
        })
      }
    }
  )

  // POST /payments/process - Unified payment processing with idempotency
  fastify.post(
    '/process',
    {
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          type: z.enum(['milestone', 'subscription', 'invoice', 'one_time']),
          amount: z.number().positive(),
          currency: z.string().optional().default('usd'),
          metadata: z.record(z.any()),
          idempotencyKey: z.string().uuid().optional(),
        })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const body = request.body as {
        type: 'milestone' | 'subscription' | 'invoice' | 'one_time'
        amount: number
        currency?: string
        metadata: Record<string, any>
        idempotencyKey?: string
      }
      const result = await unifiedPaymentService.processPayment({
        ...body,
        userId: user.id,
      })
      return reply.send({ result })
    }
  )

  // GET /payments/:id/status - Get payment status
  fastify.get(
    '/:id/status',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const status = await unifiedPaymentService.getPaymentStatus(id, user.id)
      return reply.send({ status })
    }
  )

  // POST /payments/:id/refund - Refund payment
  fastify.post(
    '/:id/refund',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string() })),
        validateBody(z.object({
          amount: z.number().positive().optional(),
          reason: z.string().optional(),
          idempotencyKey: z.string().uuid().optional(),
        }).optional()),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const body = (request.body as {
        amount?: number
        reason?: string
        idempotencyKey?: string
      }) || {}
      const result = await unifiedPaymentService.refundPayment(id, user.id, body)
      return reply.send({ result })
    }
  )

  // POST /payments/payment-methods - Attach payment method to customer
  fastify.post(
    '/payment-methods',
    {
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          customerId: z.string().min(1),
          paymentMethodId: z.string().min(1),
          setAsDefault: z.boolean().optional().default(false),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as {
          customerId: string
          paymentMethodId: string
          setAsDefault?: boolean
        }

        const result = await paymentService.attachPaymentMethod({
          ...body,
          userId: user.id,
        })

        return reply.code(201).send({ paymentMethod: result })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to attach payment method',
        })
      }
    }
  )

  // GET /payments/payment-methods - List payment methods for customer
  fastify.get(
    '/payment-methods',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const query = request.query as { customerId?: string }

        if (!query.customerId) {
          return reply.code(400).send({
            error: 'customerId is required',
          })
        }

        const paymentMethods = await paymentService.listPaymentMethods(
          query.customerId,
          user.id
        )

        return reply.send({ paymentMethods })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to list payment methods',
        })
      }
    }
  )

  // DELETE /payments/payment-methods/:paymentMethodId - Delete payment method
  fastify.delete(
    '/payment-methods/:paymentMethodId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ paymentMethodId: z.string() })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { paymentMethodId } = request.params as { paymentMethodId: string }

        const result = await paymentService.deletePaymentMethod(paymentMethodId, user.id)

        return reply.send(result)
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to delete payment method',
        })
      }
    }
  )

  // POST /payments/payment-methods/:paymentMethodId/set-default - Set default payment method
  fastify.post(
    '/payment-methods/:paymentMethodId/set-default',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ paymentMethodId: z.string() })),
        validateBody(z.object({
          customerId: z.string().min(1),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { paymentMethodId } = request.params as { paymentMethodId: string }
        const body = request.body as { customerId: string }

        const result = await paymentService.setDefaultPaymentMethod(
          body.customerId,
          paymentMethodId,
          user.id
        )

        return reply.send(result)
      } catch (error: any) {
        request.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to set default payment method',
        })
      }
    }
  )

  // Register milestone payment routes
  await fastify.register(milestonePaymentRoutes)

  // Register payment webhook routes
  await fastify.register(paymentWebhookRoutes)
}
