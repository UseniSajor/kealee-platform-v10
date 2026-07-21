import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser, requireRole } from '../auth/auth.middleware'
import { validateParams, validateBody, validateQuery } from '../../middleware/validation.middleware'
import { financingService } from './financing.service'
import { lenderService } from './lender.service'

const applySchema = z.object({
  projectId: z.string().uuid(),
  requestedAmount: z.number().positive(),
  termMonths: z.number().int().positive().optional(),
  lenderName: z.string().optional(),
  loanOfficer: z.string().optional(),
})

const reviewSchema = z.object({
  approved: z.boolean(),
  approvedAmount: z.number().positive().optional(),
  interestRate: z.number().min(0).max(100).optional(),
  termMonths: z.number().int().positive().optional(),
  loanNumber: z.string().optional(),
  reason: z.string().optional(),
})

const disburseSchema = z.object({
  milestoneId: z.string().uuid(),
  amount: z.number().positive(),
})

export async function financingRoutes(fastify: FastifyInstance) {
  // ============================================
  // FINANCING APPLICATION ENDPOINTS
  // ============================================

  // Submit financing application (project owner)
  fastify.post(
    '/apply',
    {
      preHandler: [authenticateUser, validateBody(applySchema)],
    },
    async (request, reply) => {
      const user = (request as any).user as { userId: string }
      const body = request.body as z.infer<typeof applySchema>
      const application = await financingService.submitApplication(body, user.userId)
      return reply.code(201).send({ application })
    }
  )

  // Get all financing applications (lender/admin)
  fastify.get(
    '/applications',
    {
      preHandler: [authenticateUser, requireRole(['LENDER', 'ADMIN'])],
    },
    async (request, reply) => {
      const { status } = request.query as { status?: string }
      const applications = await financingService.getApplications(status)
      return reply.send({ applications })
    }
  )

  // Get single financing application
  fastify.get(
    '/applications/:applicationId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ applicationId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { userId: string }
      const { applicationId } = request.params as { applicationId: string }
      const application = await financingService.getApplication(applicationId, user.userId)
      return reply.send({ application })
    }
  )

  // Review financing application (lender)
  fastify.post(
    '/applications/:applicationId/review',
    {
      preHandler: [
        authenticateUser,
        requireRole(['LENDER', 'ADMIN']),
        validateParams(z.object({ applicationId: z.string().uuid() })),
        validateBody(reviewSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { userId: string }
      const { applicationId } = request.params as { applicationId: string }
      const body = request.body as z.infer<typeof reviewSchema>
      const application = await financingService.reviewApplication(applicationId, user.userId, body)
      return reply.send({ application })
    }
  )

  // Fund financing application (lender)
  fastify.post(
    '/applications/:applicationId/fund',
    {
      preHandler: [
        authenticateUser,
        requireRole(['LENDER', 'ADMIN']),
        validateParams(z.object({ applicationId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { userId: string }
      const { applicationId } = request.params as { applicationId: string }
      const application = await financingService.fundApplication(applicationId, user.userId)
      return reply.send({ application })
    }
  )

  // Disburse payment (lender)
  fastify.post(
    '/applications/:applicationId/disburse',
    {
      preHandler: [
        authenticateUser,
        requireRole(['LENDER', 'ADMIN']),
        validateParams(z.object({ applicationId: z.string().uuid() })),
        validateBody(disburseSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { userId: string }
      const { applicationId } = request.params as { applicationId: string }
      const { milestoneId, amount } = request.body as z.infer<typeof disburseSchema>
      const payment = await financingService.disbursePayment(
        applicationId,
        milestoneId,
        amount,
        user.userId
      )
      return reply.code(201).send({ payment })
    }
  )

  // Get payment history for project
  fastify.get(
    '/projects/:projectId/payments',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { userId: string }
      const { projectId } = request.params as { projectId: string }
      const history = await financingService.getPaymentHistory(projectId, user.userId)
      return reply.send(history)
    }
  )
}

export async function lenderRoutes(fastify: FastifyInstance) {
  // ============================================
  // LENDER DASHBOARD ENDPOINTS
  // ============================================

  // Get lender dashboard
  fastify.get(
    '/dashboard',
    {
      preHandler: [authenticateUser, requireRole(['LENDER', 'ADMIN'])],
    },
    async (request, reply) => {
      const user = (request as any).user as { userId: string }
      const dashboard = await lenderService.getDashboard(user.userId)
      return reply.send({ data: dashboard })
    }
  )

  // Get portfolio report
  fastify.get(
    '/portfolio',
    {
      preHandler: [authenticateUser, requireRole(['LENDER', 'ADMIN'])],
    },
    async (request, reply) => {
      const user = (request as any).user as { userId: string }
      const report = await lenderService.getPortfolioReport(user.userId)
      return reply.send({ data: report })
    }
  )

  // Get risk assessment for application
  fastify.get(
    '/risk/:applicationId',
    {
      preHandler: [
        authenticateUser,
        requireRole(['LENDER', 'ADMIN']),
        validateParams(z.object({ applicationId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const { applicationId } = request.params as { applicationId: string }
      const assessment = await lenderService.getRiskAssessment(applicationId)
      return reply.send({ data: assessment })
    }
  )
}
