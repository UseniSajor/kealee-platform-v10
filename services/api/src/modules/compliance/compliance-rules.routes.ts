/**
 * Compliance Rules Routes
 * API endpoints for ComplianceRule, ComplianceCheck, ComplianceReport,
 * and ComplianceAlert management.
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@kealee/database'
import { authenticateUser, requireAdmin } from '../../middleware/auth.middleware'
import {
  validateQuery,
  validateParams,
  validateBody,
}
import { sanitizeErrorMessage } from '../../utils/sanitize-error' from '../../middleware/validation.middleware'

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
})

const idParamsSchema = z.object({
  id: z.string().uuid(),
})

// -- Compliance Rules -------------------------------------------------------

const ruleQuerySchema = paginationSchema.extend({
  type: z
    .enum([
      'STATE_ESCROW', 'AML', 'KYC', 'LICENSING',
      'INSURANCE', 'BOND', 'LIEN_LAW', 'TAX',
    ])
    .optional(),
  isActive: z.coerce.boolean().optional(),
  jurisdiction: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
})

const createRuleSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum([
    'STATE_ESCROW', 'AML', 'KYC', 'LICENSING',
    'INSURANCE', 'BOND', 'LIEN_LAW', 'TAX',
  ]),
  jurisdiction: z.string().default('US'),
  state: z.string().optional(),
  county: z.string().optional(),
  description: z.string().min(1),
  requirements: z.any(), // JSON
  citations: z.string().optional(),
  effectiveDate: z.coerce.date(),
  expirationDate: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  thresholdAmount: z.number().optional(),
  thresholdDays: z.number().int().optional(),
  thresholdPercentage: z.number().optional(),
  metadata: z.any().optional(),
})

const updateRuleSchema = createRuleSchema.partial()

// -- Compliance Checks ------------------------------------------------------

const checkQuerySchema = paginationSchema.extend({
  projectId: z.string().uuid().optional(),
  ruleId: z.string().uuid().optional(),
  status: z.enum(['PASS', 'FAIL', 'PENDING', 'WAIVED', 'EXPIRED']).optional(),
  userId: z.string().uuid().optional(),
  contractId: z.string().uuid().optional(),
})

const runCheckSchema = z.object({
  ruleId: z.string().uuid(),
  checkType: z.string().min(1),
  userId: z.string().uuid().optional(),
  contractId: z.string().uuid().optional(),
  escrowId: z.string().uuid().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  metadata: z.any().optional(),
})

// -- Compliance Reports -----------------------------------------------------

const reportQuerySchema = paginationSchema.extend({
  reportType: z
    .enum(['SAR', 'CTR', 'FORM_1099_NEC', 'FORM_1099_K', 'FORM_1099_MISC'])
    .optional(),
  status: z
    .enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'FILED', 'REJECTED'])
    .optional(),
})

const createReportSchema = z.object({
  reportType: z.enum([
    'SAR', 'CTR', 'FORM_1099_NEC', 'FORM_1099_K', 'FORM_1099_MISC',
  ]),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional(),
  relatedUserId: z.string().uuid().optional(),
  relatedTransactionId: z.string().optional(),
  relatedEscrowId: z.string().uuid().optional(),
  metadata: z.any().optional(),
})

// -- Compliance Alerts ------------------------------------------------------

const alertQuerySchema = paginationSchema.extend({
  alertType: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED']).optional(),
  userId: z.string().uuid().optional(),
  contractId: z.string().uuid().optional(),
})

const updateAlertSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED']),
  resolution: z.string().optional(),
  remediationSteps: z.array(z.string()).optional(),
})

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function complianceRulesRoutes(fastify: FastifyInstance) {
  // All compliance-rules routes require admin authentication
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply);
    await requireAdmin(request, reply);
  });

  // ========================================================================
  // COMPLIANCE RULES
  // ========================================================================

  /**
   * GET /rules
   * List compliance rules with filtering and pagination.
   */
  fastify.get(
    '/rules',
    { preHandler: [validateQuery(ruleQuerySchema)] },
    async (request, reply) => {
      try {
        const { page, limit, type, isActive, jurisdiction, severity } =
          request.query as z.infer<typeof ruleQuerySchema>

        const where: any = {}
        if (type) where.type = type
        if (isActive !== undefined) where.isActive = isActive
        if (jurisdiction) where.jurisdiction = jurisdiction
        if (severity) where.severity = severity

        const skip = (page - 1) * limit

        const [rules, total] = await Promise.all([
          prisma.complianceRule.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: { _count: { select: { checks: true } } },
          }),
          prisma.complianceRule.count({ where }),
        ])

        return reply.send({
          success: true,
          data: rules,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to fetch compliance rules'),
        })
      }
    },
  )

  /**
   * GET /rules/:id
   * Get a single compliance rule by ID.
   */
  fastify.get(
    '/rules/:id',
    { preHandler: [validateParams(idParamsSchema)] },
    async (request, reply) => {
      try {
        const { id } = request.params as z.infer<typeof idParamsSchema>

        const rule = await prisma.complianceRule.findUnique({
          where: { id },
          include: {
            checks: {
              orderBy: { checkDate: 'desc' },
              take: 10,
            },
          },
        })

        if (!rule) {
          return reply.code(404).send({
            success: false,
            error: 'Compliance rule not found',
          })
        }

        return reply.send({ success: true, data: rule })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to fetch compliance rule'),
        })
      }
    },
  )

  /**
   * POST /rules
   * Create a new compliance rule.
   */
  fastify.post(
    '/rules',
    { preHandler: [validateBody(createRuleSchema)] },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof createRuleSchema>

        const rule = await prisma.complianceRule.create({
          data: {
            name: body.name,
            type: body.type as any,
            jurisdiction: body.jurisdiction,
            state: body.state,
            county: body.county,
            description: body.description,
            requirements: body.requirements,
            citations: body.citations,
            effectiveDate: body.effectiveDate,
            expirationDate: body.expirationDate,
            isActive: body.isActive,
            severity: body.severity as any,
            thresholdAmount: body.thresholdAmount,
            thresholdDays: body.thresholdDays,
            thresholdPercentage: body.thresholdPercentage,
            metadata: body.metadata,
          },
        })

        return reply.code(201).send({ success: true, data: rule })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to create compliance rule'),
        })
      }
    },
  )

  /**
   * PATCH /rules/:id
   * Update an existing compliance rule.
   */
  fastify.patch(
    '/rules/:id',
    {
      preHandler: [
        validateParams(idParamsSchema),
        validateBody(updateRuleSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as z.infer<typeof idParamsSchema>
        const body = request.body as z.infer<typeof updateRuleSchema>

        const existing = await prisma.complianceRule.findUnique({ where: { id } })
        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Compliance rule not found',
          })
        }

        const rule = await prisma.complianceRule.update({
          where: { id },
          data: body as any,
        })

        return reply.send({ success: true, data: rule })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to update compliance rule'),
        })
      }
    },
  )

  // ========================================================================
  // COMPLIANCE CHECKS
  // ========================================================================

  /**
   * GET /checks
   * List compliance checks with filtering and pagination.
   */
  fastify.get(
    '/checks',
    { preHandler: [validateQuery(checkQuerySchema)] },
    async (request, reply) => {
      try {
        const { page, limit, ruleId, status, userId, contractId } =
          request.query as z.infer<typeof checkQuerySchema>

        const where: any = {}
        if (ruleId) where.ruleId = ruleId
        if (status) where.status = status
        if (userId) where.userId = userId
        if (contractId) where.contractId = contractId

        const skip = (page - 1) * limit

        const [checks, total] = await Promise.all([
          prisma.complianceCheck.findMany({
            where,
            orderBy: { checkDate: 'desc' },
            skip,
            take: limit,
            include: {
              rule: { select: { id: true, name: true, type: true, severity: true } },
            },
          }),
          prisma.complianceCheck.count({ where }),
        ])

        return reply.send({
          success: true,
          data: checks,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to fetch compliance checks'),
        })
      }
    },
  )

  /**
   * POST /checks
   * Run a new compliance check against a rule.
   */
  fastify.post(
    '/checks',
    { preHandler: [validateBody(runCheckSchema)] },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof runCheckSchema>
        const user = (request as any).user as { id: string }

        // Verify rule exists
        const rule = await prisma.complianceRule.findUnique({
          where: { id: body.ruleId },
        })
        if (!rule) {
          return reply.code(404).send({
            success: false,
            error: 'Compliance rule not found',
          })
        }

        const check = await prisma.complianceCheck.create({
          data: {
            ruleId: body.ruleId,
            checkType: body.checkType,
            userId: body.userId,
            contractId: body.contractId,
            escrowId: body.escrowId,
            entityType: body.entityType,
            entityId: body.entityId,
            status: 'PENDING',
            performedBy: user.id,
            isAutomated: false,
            metadata: body.metadata,
          },
          include: {
            rule: { select: { id: true, name: true, type: true } },
          },
        })

        return reply.code(201).send({ success: true, data: check })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to run compliance check'),
        })
      }
    },
  )

  // ========================================================================
  // COMPLIANCE REPORTS
  // ========================================================================

  /**
   * GET /reports
   * List compliance reports with filtering and pagination.
   */
  fastify.get(
    '/reports',
    { preHandler: [validateQuery(reportQuerySchema)] },
    async (request, reply) => {
      try {
        const { page, limit, reportType, status } =
          request.query as z.infer<typeof reportQuerySchema>

        const where: any = {}
        if (reportType) where.reportType = reportType
        if (status) where.status = status

        const skip = (page - 1) * limit

        const [reports, total] = await Promise.all([
          prisma.complianceReport.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
              relatedUser: {
                select: { id: true, email: true, firstName: true, lastName: true },
              },
            },
          }),
          prisma.complianceReport.count({ where }),
        ])

        return reply.send({
          success: true,
          data: reports,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to fetch compliance reports'),
        })
      }
    },
  )

  /**
   * POST /reports
   * Generate a new compliance report.
   */
  fastify.post(
    '/reports',
    { preHandler: [validateBody(createReportSchema)] },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof createReportSchema>

        const report = await prisma.complianceReport.create({
          data: {
            reportType: body.reportType as any,
            title: body.title,
            description: body.description,
            periodStart: body.periodStart,
            periodEnd: body.periodEnd,
            relatedUserId: body.relatedUserId,
            relatedTransactionId: body.relatedTransactionId,
            relatedEscrowId: body.relatedEscrowId,
            metadata: body.metadata,
            status: 'DRAFT',
          },
        })

        return reply.code(201).send({ success: true, data: report })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to generate compliance report'),
        })
      }
    },
  )

  // ========================================================================
  // COMPLIANCE ALERTS
  // ========================================================================

  /**
   * GET /alerts
   * List compliance alerts with filtering and pagination.
   */
  fastify.get(
    '/alerts',
    { preHandler: [validateQuery(alertQuerySchema)] },
    async (request, reply) => {
      try {
        const { page, limit, alertType, severity, status, userId, contractId } =
          request.query as z.infer<typeof alertQuerySchema>

        const where: any = {}
        if (alertType) where.alertType = alertType
        if (severity) where.severity = severity
        if (status) where.status = status
        if (userId) where.userId = userId
        if (contractId) where.contractId = contractId

        const skip = (page - 1) * limit

        const [alerts, total] = await Promise.all([
          prisma.complianceAlert.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
              user: {
                select: { id: true, email: true, firstName: true, lastName: true },
              },
              resolver: {
                select: { id: true, email: true, firstName: true, lastName: true },
              },
            },
          }),
          prisma.complianceAlert.count({ where }),
        ])

        return reply.send({
          success: true,
          data: alerts,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to fetch compliance alerts'),
        })
      }
    },
  )

  /**
   * PATCH /alerts/:id
   * Update a compliance alert (resolve, escalate, etc.).
   */
  fastify.patch(
    '/alerts/:id',
    {
      preHandler: [
        validateParams(idParamsSchema),
        validateBody(updateAlertSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as z.infer<typeof idParamsSchema>
        const body = request.body as z.infer<typeof updateAlertSchema>
        const user = (request as any).user as { id: string }

        const existing = await prisma.complianceAlert.findUnique({ where: { id } })
        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Compliance alert not found',
          })
        }

        const updateData: any = { status: body.status }

        if (body.status === 'RESOLVED') {
          updateData.resolvedBy = user.id
          updateData.resolvedAt = new Date()
          if (body.resolution) updateData.resolution = body.resolution
        }

        if (body.status === 'ESCALATED') {
          updateData.escalated = true
          updateData.escalatedAt = new Date()
        }

        if (body.remediationSteps) {
          updateData.remediationSteps = body.remediationSteps
        }

        const updated = await prisma.complianceAlert.update({
          where: { id },
          data: updateData,
        })

        return reply.send({ success: true, data: updated })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to update compliance alert'),
        })
      }
    },
  )
}
