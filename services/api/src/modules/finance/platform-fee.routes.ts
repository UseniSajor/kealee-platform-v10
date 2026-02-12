/**
 * Platform Fee Routes - Fee tracking and configuration
 * Manages platform fees (design packages, contract commissions, lead sales) and fee configs
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticateUser, requireAdmin, requirePM } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { prisma, Decimal } from '@kealee/database'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const PlatformFeeTypeEnum = z.enum(['DESIGN_PACKAGE', 'CONTRACT_COMMISSION', 'LEAD_SALE'])
const PlatformFeeStatusEnum = z.enum(['PENDING', 'HOLD', 'COLLECTED', 'REFUNDED', 'WAIVED'])

const ListFeesQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  preConProjectId: z.string().uuid().optional(),
  contractId: z.string().uuid().optional(),
  feeType: PlatformFeeTypeEnum.optional(),
  status: PlatformFeeStatusEnum.optional(),
  payerId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const IdParamSchema = z.object({
  id: z.string().uuid(),
})

const ListFeeConfigsQuerySchema = z.object({
  feeType: PlatformFeeTypeEnum.optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const CreateFeeConfigBodySchema = z.object({
  feeType: PlatformFeeTypeEnum,
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  flatFee: z.number().min(0).optional(),
  percentageFee: z.number().min(0).max(1).optional(),
  minimumFee: z.number().min(0).optional(),
  maximumFee: z.number().min(0).optional(),
  tierPricing: z.record(z.number()).optional(),
  isActive: z.boolean().default(true),
  effectiveFrom: z.coerce.date().optional(),
  effectiveUntil: z.coerce.date().optional(),
})

const UpdateFeeConfigBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  flatFee: z.number().min(0).nullable().optional(),
  percentageFee: z.number().min(0).max(1).nullable().optional(),
  minimumFee: z.number().min(0).nullable().optional(),
  maximumFee: z.number().min(0).nullable().optional(),
  tierPricing: z.record(z.number()).nullable().optional(),
  isActive: z.boolean().optional(),
  effectiveFrom: z.coerce.date().optional(),
  effectiveUntil: z.coerce.date().nullable().optional(),
})

// ============================================================================
// ROUTES
// ============================================================================

export async function platformFeeRoutes(fastify: FastifyInstance) {
  // ==========================================================================
  // PLATFORM FEES
  // ==========================================================================

  /**
   * GET /fees
   * List platform fees with filtering and pagination
   */
  fastify.get(
    '/fees',
    {
      preHandler: [
        authenticateUser,
        requirePM,
        validateQuery(ListFeesQuerySchema),
      ],
      schema: {
        tags: ['Finance - Platform Fees'],
        summary: 'List platform fees',
        description: 'List platform fees with optional filtering by project, type, status, and date range',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const filters = ListFeesQuerySchema.parse(request.query)

        const where: any = {}
        if (filters.projectId) where.projectId = filters.projectId
        if (filters.preConProjectId) where.preConProjectId = filters.preConProjectId
        if (filters.contractId) where.contractId = filters.contractId
        if (filters.feeType) where.feeType = filters.feeType
        if (filters.status) where.status = filters.status
        if (filters.payerId) where.payerId = filters.payerId

        // Date range filter
        if (filters.dateFrom || filters.dateTo) {
          where.createdAt = {}
          if (filters.dateFrom) where.createdAt.gte = filters.dateFrom
          if (filters.dateTo) where.createdAt.lte = filters.dateTo
        }

        const skip = (filters.page - 1) * filters.limit

        const [fees, total] = await Promise.all([
          prisma.platformFee.findMany({
            where,
            include: {
              preConProject: {
                select: { id: true, ownerId: true },
              },
            },
            skip,
            take: filters.limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.platformFee.count({ where }),
        ])

        // Calculate totals by status
        const allFees = await prisma.platformFee.findMany({
          where,
          select: { amount: true, status: true, collectedAmount: true },
        })

        let totalPending = new Decimal(0)
        let totalCollected = new Decimal(0)
        let totalRefunded = new Decimal(0)
        let totalWaived = new Decimal(0)
        for (const fee of allFees) {
          switch (fee.status) {
            case 'PENDING':
            case 'HOLD':
              totalPending = totalPending.add(fee.amount)
              break
            case 'COLLECTED':
              totalCollected = totalCollected.add(fee.collectedAmount || fee.amount)
              break
            case 'REFUNDED':
              totalRefunded = totalRefunded.add(fee.amount)
              break
            case 'WAIVED':
              totalWaived = totalWaived.add(fee.amount)
              break
          }
        }

        return reply.send({
          success: true,
          data: fees,
          summary: {
            totalPending,
            totalCollected,
            totalRefunded,
            totalWaived,
            count: allFees.length,
          },
          pagination: {
            total,
            page: filters.page,
            pageSize: filters.limit,
            totalPages: Math.ceil(total / filters.limit),
          },
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to list platform fees',
        })
      }
    }
  )

  /**
   * GET /fees/:id
   * Get a single platform fee
   */
  fastify.get(
    '/fees/:id',
    {
      preHandler: [
        authenticateUser,
        requirePM,
        validateParams(IdParamSchema),
      ],
      schema: {
        tags: ['Finance - Platform Fees'],
        summary: 'Get platform fee by ID',
        description: 'Get a single platform fee with all details',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = IdParamSchema.parse(request.params)

        const fee = await prisma.platformFee.findUnique({
          where: { id },
          include: {
            preConProject: {
              select: { id: true, ownerId: true },
            },
          },
        })

        if (!fee) {
          return reply.code(404).send({
            success: false,
            error: 'Platform fee not found',
          })
        }

        return reply.send({
          success: true,
          data: fee,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to get platform fee',
        })
      }
    }
  )

  // ==========================================================================
  // PLATFORM FEE CONFIGS
  // ==========================================================================

  /**
   * GET /config
   * List platform fee configurations
   */
  fastify.get(
    '/config',
    {
      preHandler: [
        authenticateUser,
        requirePM,
        validateQuery(ListFeeConfigsQuerySchema),
      ],
      schema: {
        tags: ['Finance - Platform Fee Config'],
        summary: 'List fee configurations',
        description: 'List platform fee configurations with optional filtering',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const filters = ListFeeConfigsQuerySchema.parse(request.query)

        const where: any = {}
        if (filters.feeType) where.feeType = filters.feeType
        if (filters.isActive !== undefined) where.isActive = filters.isActive

        const skip = (filters.page - 1) * filters.limit

        const [configs, total] = await Promise.all([
          prisma.platformFeeConfig.findMany({
            where,
            skip,
            take: filters.limit,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.platformFeeConfig.count({ where }),
        ])

        return reply.send({
          success: true,
          data: configs,
          pagination: {
            total,
            page: filters.page,
            pageSize: filters.limit,
            totalPages: Math.ceil(total / filters.limit),
          },
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to list fee configurations',
        })
      }
    }
  )

  /**
   * POST /config
   * Create a new platform fee configuration
   */
  fastify.post(
    '/config',
    {
      preHandler: [
        authenticateUser,
        requireAdmin,
        validateBody(CreateFeeConfigBodySchema),
      ],
      schema: {
        tags: ['Finance - Platform Fee Config'],
        summary: 'Create fee configuration',
        description: 'Create a new platform fee configuration. Fee type must be unique.',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = CreateFeeConfigBodySchema.parse(request.body)

        // Check for existing config with same fee type (unique constraint)
        const existing = await prisma.platformFeeConfig.findUnique({
          where: { feeType: data.feeType as any },
        })
        if (existing) {
          return reply.code(409).send({
            success: false,
            error: `Fee configuration for type '${data.feeType}' already exists. Use PATCH to update it.`,
          })
        }

        // Validate at least one pricing method is set
        if (!data.flatFee && !data.percentageFee && !data.tierPricing) {
          return reply.code(400).send({
            success: false,
            error: 'At least one pricing method must be set: flatFee, percentageFee, or tierPricing',
          })
        }

        // Validate min/max fee relationship
        if (data.minimumFee && data.maximumFee && data.minimumFee > data.maximumFee) {
          return reply.code(400).send({
            success: false,
            error: 'Minimum fee cannot be greater than maximum fee',
          })
        }

        const config = await prisma.platformFeeConfig.create({
          data: {
            feeType: data.feeType as any,
            name: data.name,
            description: data.description,
            flatFee: data.flatFee !== undefined ? new Decimal(data.flatFee) : null,
            percentageFee: data.percentageFee !== undefined ? new Decimal(data.percentageFee) : null,
            minimumFee: data.minimumFee !== undefined ? new Decimal(data.minimumFee) : null,
            maximumFee: data.maximumFee !== undefined ? new Decimal(data.maximumFee) : null,
            tierPricing: data.tierPricing || undefined,
            isActive: data.isActive,
            effectiveFrom: data.effectiveFrom || new Date(),
            effectiveUntil: data.effectiveUntil,
          },
        })

        return reply.code(201).send({
          success: true,
          data: config,
          message: 'Fee configuration created successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to create fee configuration',
        })
      }
    }
  )

  /**
   * PATCH /config/:id
   * Update a platform fee configuration
   */
  fastify.patch(
    '/config/:id',
    {
      preHandler: [
        authenticateUser,
        requireAdmin,
        validateParams(IdParamSchema),
        validateBody(UpdateFeeConfigBodySchema),
      ],
      schema: {
        tags: ['Finance - Platform Fee Config'],
        summary: 'Update fee configuration',
        description: 'Update an existing platform fee configuration',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = IdParamSchema.parse(request.params)
        const data = UpdateFeeConfigBodySchema.parse(request.body)

        const existing = await prisma.platformFeeConfig.findUnique({ where: { id } })
        if (!existing) {
          return reply.code(404).send({
            success: false,
            error: 'Fee configuration not found',
          })
        }

        // Build update data - handle nullable fields carefully
        const updateData: any = {}
        if (data.name !== undefined) updateData.name = data.name
        if (data.description !== undefined) updateData.description = data.description
        if (data.isActive !== undefined) updateData.isActive = data.isActive
        if (data.effectiveFrom !== undefined) updateData.effectiveFrom = data.effectiveFrom

        // Handle nullable Decimal fields
        if (data.flatFee !== undefined) {
          updateData.flatFee = data.flatFee === null ? null : new Decimal(data.flatFee)
        }
        if (data.percentageFee !== undefined) {
          updateData.percentageFee = data.percentageFee === null ? null : new Decimal(data.percentageFee)
        }
        if (data.minimumFee !== undefined) {
          updateData.minimumFee = data.minimumFee === null ? null : new Decimal(data.minimumFee)
        }
        if (data.maximumFee !== undefined) {
          updateData.maximumFee = data.maximumFee === null ? null : new Decimal(data.maximumFee)
        }
        if (data.tierPricing !== undefined) {
          updateData.tierPricing = data.tierPricing === null ? null : data.tierPricing
        }
        if (data.effectiveUntil !== undefined) {
          updateData.effectiveUntil = data.effectiveUntil === null ? null : data.effectiveUntil
        }

        // Validate min/max fee relationship after merge
        const newMinFee = data.minimumFee !== undefined
          ? data.minimumFee
          : (existing.minimumFee ? Number(existing.minimumFee) : null)
        const newMaxFee = data.maximumFee !== undefined
          ? data.maximumFee
          : (existing.maximumFee ? Number(existing.maximumFee) : null)

        if (newMinFee && newMaxFee && newMinFee > newMaxFee) {
          return reply.code(400).send({
            success: false,
            error: 'Minimum fee cannot be greater than maximum fee',
          })
        }

        const config = await prisma.platformFeeConfig.update({
          where: { id },
          data: updateData,
        })

        return reply.send({
          success: true,
          data: config,
          message: 'Fee configuration updated successfully',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.code(error.statusCode || 500).send({
          success: false,
          error: error.message || 'Failed to update fee configuration',
        })
      }
    }
  )
}
