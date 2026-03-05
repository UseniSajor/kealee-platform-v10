/**
 * Statement Generation API Routes
 * Handles financial statement generation, scheduling, and delivery
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticateUser, requireRole, type AuthenticatedRequest } from '../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware'
import { StatementGenerationService } from '../modules/reporting/statement-generation.service'
import { sanitizeErrorMessage } from '../utils/sanitize-error'

const statementService = new StatementGenerationService()

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GenerateStatementSchema = z.object({
  recipientId: z.string().uuid(),
  recipientRole: z.enum(['OWNER', 'CONTRACTOR', 'ADMIN']),
  statementType: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM']),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  includeTransactions: z.boolean().default(true),
  includeCharts: z.boolean().default(true),
})

const ListStatementsSchema = z.object({
  recipientId: z.string().uuid().optional(),
  recipientRole: z.enum(['OWNER', 'CONTRACTOR', 'ADMIN']).optional(),
  statementType: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM']).optional(),
  status: z.enum(['GENERATED', 'SENT', 'VIEWED']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const ScheduleStatementSchema = z.object({
  recipientId: z.string().uuid(),
  statementType: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']),
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']),
  dayOfMonth: z.number().int().min(1).max(31),
  deliveryMethod: z.enum(['EMAIL', 'DOWNLOAD', 'BOTH']),
  isActive: z.boolean().default(true),
})

const SendStatementSchema = z.object({
  email: z.string().email().optional(), // Override recipient email
  message: z.string().max(500).optional(), // Custom message
  includeAttachment: z.boolean().default(true),
})

const StatementIdParamSchema = z.object({
  id: z.string().uuid(),
})

const UserIdParamSchema = z.object({
  userId: z.string().uuid(),
})

const VerifyStatementSchema = z.object({
  verificationCode: z.string().optional(),
})

// ============================================================================
// ROLE-BASED ACCESS CONTROL
// ============================================================================

const requireFinanceAccess = requireRole(['admin', 'finance', 'pm'])

// ============================================================================
// ROUTES
// ============================================================================

export async function statementGenerationRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/statements/generate
   * Generate a new financial statement
   */
  fastify.post(
    '/statements/generate',
    {
      preHandler: [authenticateUser, requireFinanceAccess],
      schema: {
        tags: ['Statements'],
        summary: 'Generate a new financial statement',
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const data = GenerateStatementSchema.parse(request.body)

        const result = await statementService.generateStatement(data as any)

        return reply.code(201).send({
          success: true,
          ...result,
          message: 'Statement generated successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to generate statement'),
        })
      }
    }
  )

  /**
   * GET /api/statements
   * List statements with filtering
   */
  fastify.get(
    '/statements',
    {
      preHandler: [authenticateUser],
      schema: {
        tags: ['Statements'],
        summary: 'List statements with filtering',
      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const filters = ListStatementsSchema.parse(request.query)
        const userId = request.user!.id

        // If user is not admin/finance, restrict to their own statements
        const isAdminOrFinance = request.user!.roles?.includes('admin') || request.user!.roles?.includes('finance')
        if (!isAdminOrFinance) {
          filters.recipientId = userId
        }

        // listStatements(recipientId, filters?) — pass recipientId as first arg
        const recipientId = filters.recipientId || userId
        const result = await statementService.listStatements(recipientId, {
          statementType: filters.statementType as any,
          status: filters.status as any,
          startDate: filters.startDate,
          endDate: filters.endDate,
          limit: filters.limit,
          offset: (filters.page - 1) * filters.limit,
        })

        return reply.send({
          success: true,
          ...result,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to list statements'),
        })
      }
    }
  )

  /**
   * GET /api/statements/:id
   * Get statement details
   */
  fastify.get(
    '/statements/:id',
    {
      preHandler: [authenticateUser],
      schema: {
        tags: ['Statements'],
        summary: 'Get statement details',

      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = StatementIdParamSchema.parse(request.params)
        const userId = request.user!.id

        // getStatement(statementId) — takes only one arg
        const statement = await statementService.getStatement(id)

        return reply.send({
          success: true,
          statement,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to get statement'),
        })
      }
    }
  )

  /**
   * GET /api/statements/:id/download
   * Download statement PDF
   */
  fastify.get(
    '/statements/:id/download',
    {
      preHandler: [authenticateUser],
      schema: {
        tags: ['Statements'],
        summary: 'Download statement PDF',

      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = StatementIdParamSchema.parse(request.params)
        const userId = request.user!.id

        // getStatement(statementId) — takes only one arg
        const statement = await statementService.getStatement(id)

        if (!statement.documentUrl) {
          return reply.code(404).send({
            success: false,
            error: 'Statement PDF not yet generated',
          })
        }

        // TODO: Implement actual PDF download
        // For now, return the URL
        return reply.send({
          success: true,
          downloadUrl: statement.documentUrl,
          message: 'PDF download functionality coming soon',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to download statement'),
        })
      }
    }
  )

  /**
   * POST /api/statements/:id/send
   * Send statement via email
   */
  fastify.post(
    '/statements/:id/send',
    {
      preHandler: [authenticateUser, requireFinanceAccess],
      schema: {
        tags: ['Statements'],
        summary: 'Send statement via email',

      },
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const { id } = StatementIdParamSchema.parse(request.params)
        const data = SendStatementSchema.parse(request.body)

        // TODO: Implement email sending
        // For now, just update the status
        // getStatement(statementId) — takes only one arg
        const statement = await statementService.getStatement(id)

        return reply.send({
          success: true,
          message: 'Email sending functionality coming soon',
          statement,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to send statement'),
        })
      }
    }
  )

  // TODO: createSchedule does not exist on StatementGenerationService — comment out until implemented
  // POST /api/statements/schedule
  // Schedule recurring statement generation
  // fastify.post(
  //   '/statements/schedule',
  //   {
  //     preHandler: [authenticateUser, requireFinanceAccess],
  //     schema: {
  //       tags: ['Statements'],
  //       summary: 'Schedule recurring statement generation',
  //       body: ScheduleStatementSchema,
  //     },
  //   },
  //   async (request: AuthenticatedRequest, reply: FastifyReply) => {
  //     try {
  //       const data = ScheduleStatementSchema.parse(request.body)
  //
  //       const schedule = await statementService.createSchedule(data)
  //
  //       return reply.code(201).send({
  //         success: true,
  //         schedule,
  //         message: 'Statement schedule created successfully',
  //       })
  //     } catch (error: any) {
  //       request.log.error(error)
  //       return reply.code(error.statusCode || 500).send({
  //         success: false,
  //         error: sanitizeErrorMessage(error, 'Failed to create statement schedule'),
  //       })
  //     }
  //   }
  // )

  // TODO: getUserSchedules does not exist on StatementGenerationService — comment out until implemented
  // GET /api/statements/schedule/:userId
  // Get statement schedules for a user
  // fastify.get(
  //   '/statements/schedule/:userId',
  //   {
  //     preHandler: [authenticateUser],
  //     schema: {
  //       tags: ['Statements'],
  //       summary: 'Get statement schedules for a user',
  //       params: UserIdParamSchema,
  //     },
  //   },
  //   async (request: AuthenticatedRequest, reply: FastifyReply) => {
  //     try {
  //       const { userId } = UserIdParamSchema.parse(request.params)
  //       const requestingUserId = request.user!.id
  //
  //       // Users can only view their own schedules unless admin
  //       const isAdmin = request.user!.roles?.includes('admin') || request.user!.roles?.includes('finance')
  //       if (!isAdmin && userId !== requestingUserId) {
  //         return reply.code(403).send({
  //           success: false,
  //           error: 'Access denied',
  //         })
  //       }
  //
  //       const schedules = await statementService.getUserSchedules(userId)
  //
  //       return reply.send({
  //         success: true,
  //         schedules,
  //       })
  //     } catch (error: any) {
  //       request.log.error(error)
  //       return reply.code(error.statusCode || 500).send({
  //         success: false,
  //         error: sanitizeErrorMessage(error, 'Failed to get statement schedules'),
  //       })
  //     }
  //   }
  // )

  /**
   * POST /api/statements/verify/:id
   * Verify statement authenticity (public endpoint)
   */
  fastify.post(
    '/statements/verify/:id',
    {
      schema: {
        tags: ['Statements'],
        summary: 'Verify statement authenticity',

      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = StatementIdParamSchema.parse(request.params)
        const data = VerifyStatementSchema.parse(request.body)

        // verifyStatement(statementId) — takes only one arg
        const verification = await statementService.verifyStatement(id)

        return reply.send({
          success: true,
          ...verification,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to verify statement'),
        })
      }
    }
  )
}

