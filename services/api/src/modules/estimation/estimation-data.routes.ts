/**
 * Estimation Data Routes
 * CRUD for MaterialCost, LaborRate, EquipmentRate,
 * InspectionPreparationItem, InspectionFinding
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { prisma } from '@kealee/database'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const materialCostCreateSchema = z.object({
  costDatabaseId: z.string().uuid(),
  csiCode: z.string().optional(),
  csiDivision: z.number().int().optional(),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().min(1),
  unitCost: z.number().min(0),
  minCost: z.number().min(0).optional(),
  maxCost: z.number().min(0).optional(),
  wasteFactor: z.number().min(1).optional(),
  supplier: z.string().optional(),
  sku: z.string().optional(),
  leadTimeDays: z.number().int().optional(),
  metadata: z.any().optional(),
})

const materialCostUpdateSchema = materialCostCreateSchema.partial()

const laborRateCreateSchema = z.object({
  costDatabaseId: z.string().uuid(),
  trade: z.string().min(1),
  classification: z.string().optional(),
  description: z.string().optional(),
  baseRate: z.number().min(0),
  burdenRate: z.number().min(0).optional(),
  totalRate: z.number().min(0),
  overtimeMultiplier: z.number().min(1).optional(),
  prevailingWage: z.boolean().optional(),
  unionRate: z.boolean().optional(),
  productivityFactor: z.number().min(0).optional(),
  region: z.string().optional(),
  effectiveDate: z.string().datetime().optional(),
  expirationDate: z.string().datetime().optional(),
  metadata: z.any().optional(),
})

const laborRateUpdateSchema = laborRateCreateSchema.partial()

const equipmentRateCreateSchema = z.object({
  costDatabaseId: z.string().uuid(),
  category: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  dailyRate: z.number().min(0),
  weeklyRate: z.number().min(0).optional(),
  monthlyRate: z.number().min(0).optional(),
  operatorRequired: z.boolean().optional(),
  operatorRate: z.number().min(0).optional(),
  fuelCostPerHour: z.number().min(0).optional(),
  mobilizationCost: z.number().min(0).optional(),
  demobilizationCost: z.number().min(0).optional(),
  minRentalDays: z.number().int().min(1).optional(),
  metadata: z.any().optional(),
})

const equipmentRateUpdateSchema = equipmentRateCreateSchema.partial()

const prepItemCreateSchema = z.object({
  inspectionId: z.string().uuid(),
  item: z.string().min(1),
  description: z.string().optional(),
  required: z.boolean().optional(),
  notes: z.string().optional(),
  sortOrder: z.number().int().optional(),
})

const findingCreateSchema = z.object({
  inspectionId: z.string().uuid(),
  type: z.enum(['DEFICIENCY', 'OBSERVATION', 'RECOMMENDATION']),
  severity: z.enum(['MINOR', 'MODERATE', 'MAJOR', 'CRITICAL']).optional(),
  code: z.string().optional(),
  description: z.string().min(1),
  location: z.string().optional(),
  photos: z.array(z.string().url()).optional(),
  requiredAction: z.string().optional(),
  dueDate: z.string().datetime().optional(),
})

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function estimationDataRoutes(fastify: FastifyInstance) {
  // Apply auth to all routes
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply)
  })

  // ========================================================================
  // MATERIAL COSTS
  // ========================================================================

  // GET /materials - List material costs (filter by category, region)
  fastify.get(
    '/materials',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            category: z.string().optional(),
            costDatabaseId: z.string().uuid().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; category?: string; costDatabaseId?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = { isActive: true }
        if (query.category) where.category = query.category
        if (query.costDatabaseId) where.costDatabaseId = query.costDatabaseId

        const [materials, total] = await Promise.all([
          (prisma as any).materialCost.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: 'asc' },
          }),
          (prisma as any).materialCost.count({ where }),
        ])

        return reply.send({
          data: materials,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to list material costs') })
      }
    }
  )

  // POST /materials - Create material cost
  fastify.post(
    '/materials',
    {
      preHandler: [validateBody(materialCostCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof materialCostCreateSchema>

        const material = await (prisma as any).materialCost.create({
          data: body,
        })

        return reply.code(201).send({ data: material })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to create material cost') })
      }
    }
  )

  // PATCH /materials/:id - Update material cost
  fastify.patch(
    '/materials/:id',
    {
      preHandler: [
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(materialCostUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof materialCostUpdateSchema>

        const updated = await (prisma as any).materialCost.update({
          where: { id },
          data: body,
        })

        return reply.send({ data: updated })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to update material cost') })
      }
    }
  )

  // ========================================================================
  // LABOR RATES
  // ========================================================================

  // GET /labor-rates - List labor rates
  fastify.get(
    '/labor-rates',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            trade: z.string().optional(),
            region: z.string().optional(),
            costDatabaseId: z.string().uuid().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; trade?: string; region?: string; costDatabaseId?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = { isActive: true }
        if (query.trade) where.trade = query.trade
        if (query.region) where.region = query.region
        if (query.costDatabaseId) where.costDatabaseId = query.costDatabaseId

        const [rates, total] = await Promise.all([
          (prisma as any).laborRate.findMany({
            where,
            skip,
            take: limit,
            orderBy: { trade: 'asc' },
          }),
          (prisma as any).laborRate.count({ where }),
        ])

        return reply.send({
          data: rates,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to list labor rates') })
      }
    }
  )

  // POST /labor-rates - Create labor rate
  fastify.post(
    '/labor-rates',
    {
      preHandler: [validateBody(laborRateCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof laborRateCreateSchema>

        const rate = await (prisma as any).laborRate.create({
          data: {
            ...body,
            effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : undefined,
            expirationDate: body.expirationDate ? new Date(body.expirationDate) : undefined,
          },
        })

        return reply.code(201).send({ data: rate })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to create labor rate') })
      }
    }
  )

  // PATCH /labor-rates/:id - Update labor rate
  fastify.patch(
    '/labor-rates/:id',
    {
      preHandler: [
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(laborRateUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof laborRateUpdateSchema>

        const updated = await (prisma as any).laborRate.update({
          where: { id },
          data: {
            ...body,
            effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : undefined,
            expirationDate: body.expirationDate ? new Date(body.expirationDate) : undefined,
          },
        })

        return reply.send({ data: updated })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to update labor rate') })
      }
    }
  )

  // ========================================================================
  // EQUIPMENT RATES
  // ========================================================================

  // GET /equipment-rates - List equipment rates
  fastify.get(
    '/equipment-rates',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            category: z.string().optional(),
            costDatabaseId: z.string().uuid().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; category?: string; costDatabaseId?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = { isActive: true }
        if (query.category) where.category = query.category
        if (query.costDatabaseId) where.costDatabaseId = query.costDatabaseId

        const [rates, total] = await Promise.all([
          (prisma as any).equipmentRate.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: 'asc' },
          }),
          (prisma as any).equipmentRate.count({ where }),
        ])

        return reply.send({
          data: rates,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to list equipment rates') })
      }
    }
  )

  // POST /equipment-rates - Create equipment rate
  fastify.post(
    '/equipment-rates',
    {
      preHandler: [validateBody(equipmentRateCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof equipmentRateCreateSchema>

        const rate = await (prisma as any).equipmentRate.create({
          data: body,
        })

        return reply.code(201).send({ data: rate })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to create equipment rate') })
      }
    }
  )

  // PATCH /equipment-rates/:id - Update equipment rate
  fastify.patch(
    '/equipment-rates/:id',
    {
      preHandler: [
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(equipmentRateUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof equipmentRateUpdateSchema>

        const updated = await (prisma as any).equipmentRate.update({
          where: { id },
          data: body,
        })

        return reply.send({ data: updated })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to update equipment rate') })
      }
    }
  )

  // ========================================================================
  // INSPECTION PREPARATION ITEMS
  // ========================================================================

  // GET /prep-items - List inspection preparation items
  fastify.get(
    '/prep-items',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            inspectionId: z.string().uuid().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as { page?: string; limit?: string; inspectionId?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.inspectionId) where.inspectionId = query.inspectionId

        const [items, total] = await Promise.all([
          (prisma as any).inspectionPreparationItem.findMany({
            where,
            skip,
            take: limit,
            orderBy: { sortOrder: 'asc' },
          }),
          (prisma as any).inspectionPreparationItem.count({ where }),
        ])

        return reply.send({
          data: items,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to list preparation items') })
      }
    }
  )

  // POST /prep-items - Create inspection preparation item
  fastify.post(
    '/prep-items',
    {
      preHandler: [validateBody(prepItemCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof prepItemCreateSchema>

        const item = await (prisma as any).inspectionPreparationItem.create({
          data: body,
        })

        return reply.code(201).send({ data: item })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to create preparation item') })
      }
    }
  )

  // ========================================================================
  // INSPECTION FINDINGS
  // ========================================================================

  // GET /findings - List inspection findings (filter by inspectionId)
  fastify.get(
    '/findings',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            inspectionId: z.string().uuid().optional(),
            severity: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; inspectionId?: string; severity?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.inspectionId) where.inspectionId = query.inspectionId
        if (query.severity) where.severity = query.severity

        const [findings, total] = await Promise.all([
          (prisma as any).inspectionFinding.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          (prisma as any).inspectionFinding.count({ where }),
        ])

        return reply.send({
          data: findings,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to list findings') })
      }
    }
  )

  // POST /findings - Create inspection finding
  fastify.post(
    '/findings',
    {
      preHandler: [validateBody(findingCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof findingCreateSchema>

        const finding = await (prisma as any).inspectionFinding.create({
          data: {
            ...body,
            photos: body.photos ?? [],
            dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          },
        })

        return reply.code(201).send({ data: finding })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to create finding') })
      }
    }
  )
}
