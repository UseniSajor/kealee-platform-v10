/**
 * License Tracking Routes
 * API endpoints for LicenseTracking, InsuranceCertificate,
 * and BondTracking management.
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

// -- Licenses ---------------------------------------------------------------

const licenseQuerySchema = paginationSchema.extend({
  userId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED', 'PENDING']).optional(),
  state: z.string().optional(),
  licenseType: z.string().optional(),
  expiringBefore: z.coerce.date().optional(),
})

const createLicenseSchema = z.object({
  userId: z.string().uuid(),
  licenseType: z.string().min(1),
  licenseNumber: z.string().min(1),
  issuingAuthority: z.string().min(1),
  state: z.string().min(1).max(5),
  county: z.string().optional(),
  issueDate: z.coerce.date(),
  expirationDate: z.coerce.date(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED', 'PENDING']).default('ACTIVE'),
  classifications: z.array(z.string()).default([]),
  documentUrl: z.string().url().optional(),
  verificationSource: z.string().optional(),
  metadata: z.any().optional(),
})

const updateLicenseSchema = createLicenseSchema.partial()

// -- Insurance Certificates -------------------------------------------------

const insuranceQuerySchema = paginationSchema.extend({
  userId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING']).optional(),
  insuranceType: z.string().optional(),
  expiringBefore: z.coerce.date().optional(),
})

const createInsuranceSchema = z.object({
  userId: z.string().uuid(),
  insuranceType: z.string().min(1),
  carrier: z.string().min(1),
  policyNumber: z.string().min(1),
  coverageAmount: z.number().positive(),
  deductible: z.number().optional(),
  perOccurrence: z.number().optional(),
  aggregate: z.number().optional(),
  effectiveDate: z.coerce.date(),
  expirationDate: z.coerce.date(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING']).default('ACTIVE'),
  additionalInsureds: z.array(z.string()).default([]),
  documentUrl: z.string().url().optional(),
  metadata: z.any().optional(),
})

const updateInsuranceSchema = createInsuranceSchema.partial()

// -- Bonds ------------------------------------------------------------------

const bondQuerySchema = paginationSchema.extend({
  userId: z.string().uuid().optional(),
  contractId: z.string().uuid().optional(),
  status: z.string().optional(),
  bondType: z.string().optional(),
  expiringBefore: z.coerce.date().optional(),
})

const createBondSchema = z.object({
  userId: z.string().uuid(),
  contractId: z.string().uuid().optional(),
  bondType: z.string().min(1),
  bondNumber: z.string().min(1),
  suretyCompany: z.string().min(1),
  bondAmount: z.number().positive(),
  effectiveDate: z.coerce.date(),
  expirationDate: z.coerce.date().optional(),
  status: z.string().default('ACTIVE'),
  obligee: z.string().optional(),
  documentUrl: z.string().url().optional(),
  metadata: z.any().optional(),
})

const updateBondSchema = createBondSchema.partial()

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function licenseTrackingRoutes(fastify: FastifyInstance) {
  // All license-tracking routes require admin authentication
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply);
    await requireAdmin(request, reply);
  });

  // ========================================================================
  // LICENSE TRACKING
  // ========================================================================

  /**
   * GET /licenses
   * List contractor licenses with filtering and pagination.
   */
  fastify.get(
    '/licenses',
    { preHandler: [validateQuery(licenseQuerySchema)] },
    async (request, reply) => {
      try {
        const { page, limit, userId, status, state, licenseType, expiringBefore } =
          request.query as z.infer<typeof licenseQuerySchema>

        const where: any = {}
        if (userId) where.userId = userId
        if (status) where.status = status
        if (state) where.state = state
        if (licenseType) where.licenseType = licenseType
        if (expiringBefore) {
          where.expirationDate = { lte: expiringBefore }
        }

        const skip = (page - 1) * limit

        const [licenses, total] = await Promise.all([
          prisma.licenseTracking.findMany({
            where,
            orderBy: { expirationDate: 'asc' },
            skip,
            take: limit,
            include: {
              contractor: {
                select: { id: true, email: true, firstName: true, lastName: true },
              },
            },
          }),
          prisma.licenseTracking.count({ where }),
        ])

        return reply.send({
          success: true,
          data: licenses,
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
          error: sanitizeErrorMessage(error, 'Failed to fetch licenses'),
        })
      }
    },
  )

  /**
   * GET /licenses/:id
   * Get a single license by ID.
   */
  fastify.get(
    '/licenses/:id',
    { preHandler: [validateParams(idParamsSchema)] },
    async (request, reply) => {
      try {
        const { id } = request.params as z.infer<typeof idParamsSchema>

        const license = await prisma.licenseTracking.findUnique({
          where: { id },
          include: {
            contractor: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
        })

        if (!license) {
          return reply.code(404).send({
            success: false,
            error: 'License not found',
          })
        }

        return reply.send({ success: true, data: license })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to fetch license'),
        })
      }
    },
  )

  /**
   * POST /licenses
   * Create a new license record.
   */
  fastify.post(
    '/licenses',
    { preHandler: [validateBody(createLicenseSchema)] },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof createLicenseSchema>

        const license = await prisma.licenseTracking.create({
          data: {
            userId: body.userId,
            licenseType: body.licenseType,
            licenseNumber: body.licenseNumber,
            issuingAuthority: body.issuingAuthority,
            state: body.state,
            county: body.county,
            issueDate: body.issueDate,
            expirationDate: body.expirationDate,
            status: body.status as any,
            classifications: body.classifications,
            documentUrl: body.documentUrl,
            verificationSource: body.verificationSource,
            metadata: body.metadata,
          },
        })

        return reply.code(201).send({ success: true, data: license })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to create license'),
        })
      }
    },
  )

  /**
   * PATCH /licenses/:id
   * Update an existing license record.
   */
  fastify.patch(
    '/licenses/:id',
    {
      preHandler: [
        validateParams(idParamsSchema),
        validateBody(updateLicenseSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as z.infer<typeof idParamsSchema>
        const body = request.body as z.infer<typeof updateLicenseSchema>

        const existing = await prisma.licenseTracking.findUnique({ where: { id } })
        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'License not found',
          })
        }

        const license = await prisma.licenseTracking.update({
          where: { id },
          data: body as any,
        })

        return reply.send({ success: true, data: license })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to update license'),
        })
      }
    },
  )

  // ========================================================================
  // INSURANCE CERTIFICATES
  // ========================================================================

  /**
   * GET /insurance
   * List insurance certificates with filtering and pagination.
   */
  fastify.get(
    '/insurance',
    { preHandler: [validateQuery(insuranceQuerySchema)] },
    async (request, reply) => {
      try {
        const { page, limit, userId, status, insuranceType, expiringBefore } =
          request.query as z.infer<typeof insuranceQuerySchema>

        const where: any = {}
        if (userId) where.userId = userId
        if (status) where.status = status
        if (insuranceType) where.insuranceType = insuranceType
        if (expiringBefore) {
          where.expirationDate = { lte: expiringBefore }
        }

        const skip = (page - 1) * limit

        const [certificates, total] = await Promise.all([
          prisma.insuranceCertificate.findMany({
            where,
            orderBy: { expirationDate: 'asc' },
            skip,
            take: limit,
            include: {
              contractor: {
                select: { id: true, email: true, firstName: true, lastName: true },
              },
            },
          }),
          prisma.insuranceCertificate.count({ where }),
        ])

        return reply.send({
          success: true,
          data: certificates,
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
          error: sanitizeErrorMessage(error, 'Failed to fetch insurance certificates'),
        })
      }
    },
  )

  /**
   * POST /insurance
   * Create a new insurance certificate.
   */
  fastify.post(
    '/insurance',
    { preHandler: [validateBody(createInsuranceSchema)] },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof createInsuranceSchema>

        const certificate = await prisma.insuranceCertificate.create({
          data: {
            userId: body.userId,
            insuranceType: body.insuranceType,
            carrier: body.carrier,
            policyNumber: body.policyNumber,
            coverageAmount: body.coverageAmount,
            deductible: body.deductible,
            perOccurrence: body.perOccurrence,
            aggregate: body.aggregate,
            effectiveDate: body.effectiveDate,
            expirationDate: body.expirationDate,
            status: body.status as any,
            additionalInsureds: body.additionalInsureds,
            documentUrl: body.documentUrl,
            metadata: body.metadata,
          },
        })

        return reply.code(201).send({ success: true, data: certificate })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to create insurance certificate'),
        })
      }
    },
  )

  /**
   * PATCH /insurance/:id
   * Update an existing insurance certificate.
   */
  fastify.patch(
    '/insurance/:id',
    {
      preHandler: [
        validateParams(idParamsSchema),
        validateBody(updateInsuranceSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as z.infer<typeof idParamsSchema>
        const body = request.body as z.infer<typeof updateInsuranceSchema>

        const existing = await prisma.insuranceCertificate.findUnique({ where: { id } })
        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Insurance certificate not found',
          })
        }

        const certificate = await prisma.insuranceCertificate.update({
          where: { id },
          data: body as any,
        })

        return reply.send({ success: true, data: certificate })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to update insurance certificate'),
        })
      }
    },
  )

  // ========================================================================
  // BOND TRACKING
  // ========================================================================

  /**
   * GET /bonds
   * List bonds with filtering and pagination.
   */
  fastify.get(
    '/bonds',
    { preHandler: [validateQuery(bondQuerySchema)] },
    async (request, reply) => {
      try {
        const { page, limit, userId, contractId, status, bondType, expiringBefore } =
          request.query as z.infer<typeof bondQuerySchema>

        const where: any = {}
        if (userId) where.userId = userId
        if (contractId) where.contractId = contractId
        if (status) where.status = status
        if (bondType) where.bondType = bondType
        if (expiringBefore) {
          where.expirationDate = { lte: expiringBefore }
        }

        const skip = (page - 1) * limit

        const [bonds, total] = await Promise.all([
          prisma.bondTracking.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
              contractor: {
                select: { id: true, email: true, firstName: true, lastName: true },
              },
              contract: {
                select: { id: true, status: true, projectId: true },
              },
            },
          }),
          prisma.bondTracking.count({ where }),
        ])

        return reply.send({
          success: true,
          data: bonds,
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
          error: sanitizeErrorMessage(error, 'Failed to fetch bonds'),
        })
      }
    },
  )

  /**
   * POST /bonds
   * Create a new bond record.
   */
  fastify.post(
    '/bonds',
    { preHandler: [validateBody(createBondSchema)] },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof createBondSchema>

        const bond = await prisma.bondTracking.create({
          data: {
            userId: body.userId,
            contractId: body.contractId,
            bondType: body.bondType,
            bondNumber: body.bondNumber,
            suretyCompany: body.suretyCompany,
            bondAmount: body.bondAmount,
            effectiveDate: body.effectiveDate,
            expirationDate: body.expirationDate,
            status: body.status,
            obligee: body.obligee,
            documentUrl: body.documentUrl,
            metadata: body.metadata,
          },
        })

        return reply.code(201).send({ success: true, data: bond })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to create bond'),
        })
      }
    },
  )

  /**
   * PATCH /bonds/:id
   * Update an existing bond record.
   */
  fastify.patch(
    '/bonds/:id',
    {
      preHandler: [
        validateParams(idParamsSchema),
        validateBody(updateBondSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as z.infer<typeof idParamsSchema>
        const body = request.body as z.infer<typeof updateBondSchema>

        const existing = await prisma.bondTracking.findUnique({ where: { id } })
        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Bond not found',
          })
        }

        const bond = await prisma.bondTracking.update({
          where: { id },
          data: body as any,
        })

        return reply.send({ success: true, data: bond })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          success: false,
          error: sanitizeErrorMessage(error, 'Failed to update bond'),
        })
      }
    },
  )
}
