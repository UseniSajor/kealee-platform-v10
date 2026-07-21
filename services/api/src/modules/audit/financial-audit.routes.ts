/**
 * Financial Audit Routes
 * API endpoints for FinancialAuditEntry, AuditReport,
 * and DataRetentionPolicy management.
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@kealee/database'
import { authenticateUser, requireAdmin } from '../../middleware/auth.middleware'
import {
  validateQuery,
  validateParams,
  validateBody,
} from '../../middleware/validation.middleware'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

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

// -- Financial Audit Entries ------------------------------------------------

const financialAuditQuerySchema = paginationSchema.extend({
  auditType: z.string().optional(),
  findingType: z.enum(['PASS', 'DISCREPANCY', 'IRREGULARITY', 'FRAUD']).optional(),
  auditorId: z.string().uuid().optional(),
  journalEntryId: z.string().optional(),
  transactionId: z.string().optional(),
  escrowId: z.string().uuid().optional(),
  isVerified: z.coerce.boolean().optional(),
  isCompliant: z.coerce.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

// -- Audit Reports ----------------------------------------------------------

const auditReportQuerySchema = paginationSchema.extend({
  reportType: z.string().optional(),
  status: z.enum(['DRAFT', 'FINAL', 'ARCHIVED']).optional(),
  generatedBy: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

const createAuditReportSchema = z.object({
  reportType: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  summary: z.string().min(1),
  findings: z.any(), // JSON
  metrics: z.any(), // JSON
  recommendations: z.array(z.string()).default([]),
  sharedWith: z.array(z.string().uuid()).default([]),
  isPublic: z.boolean().default(false),
  metadata: z.any().optional(),
})

// -- Data Retention Policies ------------------------------------------------

const retentionPolicyQuerySchema = paginationSchema.extend({
  isActive: z.coerce.boolean().optional(),
  dataType: z.string().optional(),
})

const createRetentionPolicySchema = z.object({
  dataType: z.string().min(1),
  retentionDays: z.number().int().positive(),
  archiveEnabled: z.boolean().default(true),
  archiveAfterDays: z.number().int().positive(),
  archiveStorage: z.string().default('s3_glacier'),
  deleteAfterDays: z.number().int().positive(),
  requireApproval: z.boolean().default(true),
  regulatoryRequirement: z.string().optional(),
  legalHold: z.boolean().default(false),
  isActive: z.boolean().default(true),
  metadata: z.any().optional(),
})

const updateRetentionPolicySchema = createRetentionPolicySchema.partial()

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function financialAuditRoutes(fastify: FastifyInstance) {
  // All financial-audit routes require admin authentication
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply);
    await requireAdmin(request, reply);
  });

  // ========================================================================
  // FINANCIAL AUDIT ENTRIES
  // ========================================================================

  /**
   * GET /financial
   * List financial audit entries with filtering and pagination.
   */
  fastify.get(
    '/financial',
    { preHandler: [validateQuery(financialAuditQuerySchema)] },
    async (request, reply) => {
      try {
        const {
          page, limit, auditType, findingType, auditorId,
          journalEntryId, transactionId, escrowId,
          isVerified, isCompliant, startDate, endDate,
        } = request.query as z.infer<typeof financialAuditQuerySchema>

        const where: any = {}
        if (auditType) where.auditType = auditType
        if (findingType) where.findingType = findingType
        if (auditorId) where.auditorId = auditorId
        if (journalEntryId) where.journalEntryId = journalEntryId
        if (transactionId) where.transactionId = transactionId
        if (escrowId) where.escrowId = escrowId
        if (isVerified !== undefined) where.isVerified = isVerified
        if (isCompliant !== undefined) where.isCompliant = isCompliant
        if (startDate || endDate) {
          where.auditDate = {}
          if (startDate) where.auditDate.gte = startDate
          if (endDate) where.auditDate.lte = endDate
        }

        const skip = (page - 1) * limit

        const [entries, total] = await Promise.all([
          prisma.financialAuditEntry.findMany({
            where,
            orderBy: { auditDate: 'desc' },
            skip,
            take: limit,
            include: {
              auditor: {
                select: { id: true, email: true, firstName: true, lastName: true },
              },
              verifier: {
                select: { id: true, email: true, firstName: true, lastName: true },
              },
            },
          }),
          prisma.financialAuditEntry.count({ where }),
        ])

        return reply.send({
          success: true,
          data: entries,
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
          error: sanitizeErrorMessage(error, 'Failed to fetch financial audit entries'),
        })
      }
    },
  )

  /**
   * GET /financial/:id
   * Get a single financial audit entry by ID.
   */
  fastify.get(
    '/financial/:id',
    { preHandler: [validateParams(idParamsSchema)] },
    async (request, reply) => {
      try {
        const { id } = request.params as z.infer<typeof idParamsSchema>

        const entry = await prisma.financialAuditEntry.findUnique({
          where: { id },
          include: {
            auditor: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
            verifier: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
        })

        if (!entry) {
          return reply.code(404).send({
            success: false,
            error: 'Financial audit entry not found',
          })
        }

        return reply.send({ success: true, data: entry })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to fetch financial audit entry'),
        })
      }
    },
  )

  // ========================================================================
  // AUDIT REPORTS
  // ========================================================================

  /**
   * GET /reports
   * List audit reports with filtering and pagination.
   */
  fastify.get(
    '/reports',
    { preHandler: [validateQuery(auditReportQuerySchema)] },
    async (request, reply) => {
      try {
        const { page, limit, reportType, status, generatedBy, startDate, endDate } =
          request.query as z.infer<typeof auditReportQuerySchema>

        const where: any = {}
        if (reportType) where.reportType = reportType
        if (status) where.status = status
        if (generatedBy) where.generatedBy = generatedBy
        if (startDate || endDate) {
          where.generatedAt = {}
          if (startDate) where.generatedAt.gte = startDate
          if (endDate) where.generatedAt.lte = endDate
        }

        const skip = (page - 1) * limit

        const [reports, total] = await Promise.all([
          prisma.auditReport.findMany({
            where,
            orderBy: { generatedAt: 'desc' },
            skip,
            take: limit,
            include: {
              generator: {
                select: { id: true, email: true, firstName: true, lastName: true },
              },
            },
          }),
          prisma.auditReport.count({ where }),
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
          error: sanitizeErrorMessage(error, 'Failed to fetch audit reports'),
        })
      }
    },
  )

  /**
   * POST /reports
   * Create a new audit report.
   */
  fastify.post(
    '/reports',
    { preHandler: [validateBody(createAuditReportSchema)] },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof createAuditReportSchema>
        const user = (request as any).user as { id: string }

        const report = await prisma.auditReport.create({
          data: {
            reportType: body.reportType,
            title: body.title,
            description: body.description,
            periodStart: body.periodStart,
            periodEnd: body.periodEnd,
            generatedBy: user.id,
            summary: body.summary,
            findings: body.findings,
            metrics: body.metrics,
            recommendations: body.recommendations,
            sharedWith: body.sharedWith,
            isPublic: body.isPublic,
            metadata: body.metadata,
            status: 'DRAFT',
          },
        })

        return reply.code(201).send({ success: true, data: report })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to create audit report'),
        })
      }
    },
  )

  // ========================================================================
  // DATA RETENTION POLICIES
  // ========================================================================

  /**
   * GET /retention-policies
   * List data retention policies.
   */
  fastify.get(
    '/retention-policies',
    { preHandler: [validateQuery(retentionPolicyQuerySchema)] },
    async (request, reply) => {
      try {
        const { page, limit, isActive, dataType } =
          request.query as z.infer<typeof retentionPolicyQuerySchema>

        const where: any = {}
        if (isActive !== undefined) where.isActive = isActive
        if (dataType) where.dataType = dataType

        const skip = (page - 1) * limit

        const [policies, total] = await Promise.all([
          prisma.dataRetentionPolicy.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.dataRetentionPolicy.count({ where }),
        ])

        return reply.send({
          success: true,
          data: policies,
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
          error: sanitizeErrorMessage(error, 'Failed to fetch retention policies'),
        })
      }
    },
  )

  /**
   * POST /retention-policies
   * Create a new data retention policy.
   */
  fastify.post(
    '/retention-policies',
    { preHandler: [validateBody(createRetentionPolicySchema)] },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof createRetentionPolicySchema>

        // Check for duplicate dataType (unique constraint)
        const existing = await prisma.dataRetentionPolicy.findUnique({
          where: { dataType: body.dataType },
        })
        if (existing) {
          return reply.code(409).send({
            success: false,
            error: `A retention policy for dataType "${body.dataType}" already exists`,
          })
        }

        const policy = await prisma.dataRetentionPolicy.create({
          data: {
            dataType: body.dataType,
            retentionDays: body.retentionDays,
            archiveEnabled: body.archiveEnabled,
            archiveAfterDays: body.archiveAfterDays,
            archiveStorage: body.archiveStorage,
            deleteAfterDays: body.deleteAfterDays,
            requireApproval: body.requireApproval,
            regulatoryRequirement: body.regulatoryRequirement,
            legalHold: body.legalHold,
            isActive: body.isActive,
            metadata: body.metadata,
          },
        })

        return reply.code(201).send({ success: true, data: policy })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to create retention policy'),
        })
      }
    },
  )

  /**
   * PATCH /retention-policies/:id
   * Update an existing data retention policy.
   */
  fastify.patch(
    '/retention-policies/:id',
    {
      preHandler: [
        validateParams(idParamsSchema),
        validateBody(updateRetentionPolicySchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as z.infer<typeof idParamsSchema>
        const body = request.body as z.infer<typeof updateRetentionPolicySchema>

        const existing = await prisma.dataRetentionPolicy.findUnique({ where: { id } })
        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Retention policy not found',
          })
        }

        // If dataType is being changed, check uniqueness
        if (body.dataType && body.dataType !== existing.dataType) {
          const duplicate = await prisma.dataRetentionPolicy.findUnique({
            where: { dataType: body.dataType },
          })
          if (duplicate) {
            return reply.code(409).send({
              success: false,
              error: `A retention policy for dataType "${body.dataType}" already exists`,
            })
          }
        }

        const policy = await prisma.dataRetentionPolicy.update({
          where: { id },
          data: body as any,
        })

        return reply.send({ success: true, data: policy })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to update retention policy'),
        })
      }
    },
  )
}
