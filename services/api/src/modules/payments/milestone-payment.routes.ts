/**
 * Milestone Payment Routes
 * Handles milestone payment processing with Stripe Connect
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { milestonePaymentService } from './milestone-payment.service'
import { stripeConnectService } from './stripe-connect.service'
import { paymentReportingService } from './payment-reporting.service'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

const releasePaymentSchema = z.object({
  skipHoldback: z.boolean().optional(),
  notes: z.string().optional(),
})

const confirmPaymentSchema = z.object({
  paymentMethodId: z.string().optional(),
})

const refundSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().optional(),
})

export async function milestonePaymentRoutes(fastify: FastifyInstance) {
  // POST /payments/milestones/:milestoneId/release - Release payment for milestone
  fastify.post(
    '/milestones/:milestoneId/release',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ milestoneId: z.string().uuid() })),
        validateBody(releasePaymentSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { milestoneId } = request.params as { milestoneId: string }
        const { skipHoldback, notes } = (request.body as { skipHoldback?: boolean; notes?: string }) || {}

        const result = await milestonePaymentService.releaseMilestonePayment(milestoneId, user.id, {
          skipHoldback,
          notes,
        })

        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to release payment'),
        })
      }
    }
  )

  // POST /payments/confirm - Confirm payment intent
  fastify.post(
    '/confirm',
    {
      preHandler: [authenticateUser, validateBody(confirmPaymentSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { paymentIntentId } = request.body as { paymentIntentId: string }

        if (!paymentIntentId) {
          return reply.code(400).send({ error: 'paymentIntentId is required' })
        }

        const result = await milestonePaymentService.confirmPayment(paymentIntentId, user.id)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to confirm payment'),
        })
      }
    }
  )

  // POST /payments/:paymentIntentId/refund - Process refund
  fastify.post(
    '/:paymentIntentId/refund',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ paymentIntentId: z.string() })),
        validateBody(refundSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { paymentIntentId } = request.params as { paymentIntentId: string }
        const { amount, reason } = (request.body as { amount?: number; reason?: string }) || {}

        const result = await milestonePaymentService.processRefund(paymentIntentId, user.id, {
          amount,
          reason,
        })

        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to process refund'),
        })
      }
    }
  )

  // GET /payments/:paymentIntentId - Get payment details
  fastify.get(
    '/:paymentIntentId',
    {
      preHandler: [authenticateUser, validateParams(z.object({ paymentIntentId: z.string() }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { paymentIntentId } = request.params as { paymentIntentId: string }

        const result = await milestonePaymentService.getPaymentDetails(paymentIntentId, user.id)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to get payment details'),
        })
      }
    }
  )

  // Stripe Connect endpoints

  // POST /payments/connect/accounts - Create Connect account
  fastify.post(
    '/connect/accounts',
    {
      preHandler: [
        authenticateUser,
        validateBody(
          z.object({
            email: z.string().email(),
            country: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { email, country } = request.body as { email: string; country?: string }

        const result = await stripeConnectService.createConnectAccount(user.id, email, country)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create Connect account'),
        })
      }
    }
  )

  // GET /payments/connect/accounts/status - Get Connect account status
  fastify.get(
    '/connect/accounts/status',
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const result = await stripeConnectService.getConnectAccountStatus(user.id)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to get account status'),
        })
      }
    }
  )

  // POST /payments/connect/accounts/links - Create account link
  fastify.post(
    '/connect/accounts/links',
    {
      preHandler: [
        authenticateUser,
        validateBody(
          z.object({
            type: z.enum(['onboarding', 'update']).optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { type } = (request.body as { type?: 'onboarding' | 'update' }) || {}

        const result = await stripeConnectService.createAccountLink(user.id, type || 'onboarding')
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to create account link'),
        })
      }
    }
  )

  // Payment reporting endpoints

  // GET /payments/reports/revenue - Get platform revenue report
  fastify.get(
    '/reports/revenue',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { startDate, endDate, orgId } = request.query as {
          startDate?: string
          endDate?: string
          orgId?: string
        }

        const result = await paymentReportingService.getPlatformRevenueReport(user.id, {
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          orgId,
        })

        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to get revenue report'),
        })
      }
    }
  )

  // GET /payments/reports/revenue/csv - Export revenue report as CSV
  fastify.get(
    '/reports/revenue/csv',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { startDate, endDate, orgId } = request.query as {
          startDate?: string
          endDate?: string
          orgId?: string
        }

        const csv = await paymentReportingService.exportRevenueReportCSV(user.id, {
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          orgId,
        })

        reply.type('text/csv')
        reply.header('Content-Disposition', `attachment; filename="revenue-report-${new Date().toISOString().split('T')[0]}.csv"`)
        return reply.send(csv)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to export revenue report'),
        })
      }
    }
  )

  // GET /payments/reports/contractors/:contractorId - Get payments by contractor
  fastify.get(
    '/reports/contractors/:contractorId',
    {
      preHandler: [authenticateUser, validateParams(z.object({ contractorId: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { contractorId } = request.params as { contractorId: string }
        const { startDate, endDate } = request.query as {
          startDate?: string
          endDate?: string
        }

        const result = await paymentReportingService.getPaymentsByContractor(user.id, contractorId, {
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        })

        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: sanitizeErrorMessage(error, 'Failed to get contractor payments'),
        })
      }
    }
  )
}
