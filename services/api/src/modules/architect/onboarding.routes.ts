/**
 * Architect Onboarding Routes
 * CRUD for ArchitectOnboarding, DesignTemplate, DesignTemplateInstance,
 * StandardDetail, StandardDetailInstance, PerformanceBenchmark
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

const onboardingCreateSchema = z.object({
  userId: z.string().uuid(),
  totalSteps: z.number().int().min(1).optional(),
})

const onboardingUpdateSchema = z.object({
  currentStep: z.number().int().min(0).optional(),
  completedSteps: z.number().int().min(0).optional(),
  completionPercentage: z.number().min(0).max(100).optional(),
  isCompleted: z.boolean().optional(),
  steps: z.any().optional(),
})

const templateCreateSchema = z.object({
  templateName: z.string().min(1),
  templateCategory: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  templateContent: z.any(),
  templateFileUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  organizationId: z.string().uuid().optional(),
  isPublic: z.boolean().optional(),
  isStandard: z.boolean().optional(),
})

const templateInstantiateSchema = z.object({
  instanceName: z.string().min(1),
  designProjectId: z.string().uuid().optional(),
  customizations: z.any().optional(),
})

const standardDetailCreateSchema = z.object({
  detailNumber: z.string().min(1),
  detailName: z.string().min(1),
  detailCategory: z.string().min(1),
  description: z.string().optional(),
  detailFileUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  applicableCodes: z.array(z.string()).optional(),
  applicableProjectTypes: z.array(z.string()).optional(),
  sourceOrganization: z.string().optional(),
  isPublic: z.boolean().optional(),
})

const benchmarkCreateSchema = z.object({
  designProjectId: z.string().uuid().optional(),
  benchmarkType: z.string().min(1),
  operationName: z.string().min(1),
  operationDuration: z.number().int().min(0),
  fileSize: z.number().int().optional(),
  fileType: z.string().optional(),
  recordCount: z.number().int().optional(),
  concurrentUsers: z.number().int().optional(),
  success: z.boolean().optional(),
  errorMessage: z.string().optional(),
})

const paginationQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  category: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function onboardingRoutes(fastify: FastifyInstance) {
  // Apply auth to all routes
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply)
  })

  // ========================================================================
  // ARCHITECT ONBOARDING
  // ========================================================================

  // GET /onboarding/:userId - Get onboarding status for a user
  fastify.get(
    '/onboarding/:userId',
    {
      preHandler: [
        validateParams(z.object({ userId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { userId } = request.params as { userId: string }

        const onboarding = await (prisma as any).architectOnboarding.findUnique({
          where: { userId },
        })

        if (!onboarding) {
          return reply.code(404).send({ error: 'Onboarding record not found' })
        }

        return reply.send({ data: onboarding })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to fetch onboarding status') })
      }
    }
  )

  // POST /onboarding - Create / start onboarding
  fastify.post(
    '/onboarding',
    {
      preHandler: [validateBody(onboardingCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof onboardingCreateSchema>

        const onboarding = await (prisma as any).architectOnboarding.create({
          data: {
            userId: body.userId,
            totalSteps: body.totalSteps ?? 10,
          },
        })

        return reply.code(201).send({ data: onboarding })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to create onboarding') })
      }
    }
  )

  // PATCH /onboarding/:id - Update onboarding progress
  fastify.patch(
    '/onboarding/:id',
    {
      preHandler: [
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(onboardingUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof onboardingUpdateSchema>

        const updated = await (prisma as any).architectOnboarding.update({
          where: { id },
          data: {
            ...body,
            ...(body.isCompleted ? { completedAt: new Date() } : {}),
          },
        })

        return reply.send({ data: updated })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to update onboarding') })
      }
    }
  )

  // ========================================================================
  // DESIGN TEMPLATES
  // ========================================================================

  // GET /templates - List design templates (filter by category, page/limit)
  fastify.get(
    '/templates',
    {
      preHandler: [validateQuery(paginationQuery)],
    },
    async (request, reply) => {
      try {
        const query = request.query as { page?: string; limit?: string; category?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.category) {
          where.templateCategory = query.category
        }

        const [templates, total] = await Promise.all([
          (prisma as any).designTemplate.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          (prisma as any).designTemplate.count({ where }),
        ])

        return reply.send({
          data: templates,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to list templates') })
      }
    }
  )

  // POST /templates - Create design template
  fastify.post(
    '/templates',
    {
      preHandler: [validateBody(templateCreateSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as z.infer<typeof templateCreateSchema>

        const template = await (prisma as any).designTemplate.create({
          data: {
            ...body,
            tags: body.tags ?? [],
            createdById: user.id,
          },
        })

        return reply.code(201).send({ data: template })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to create template') })
      }
    }
  )

  // POST /templates/:id/instantiate - Create instance from template
  fastify.post(
    '/templates/:id/instantiate',
    {
      preHandler: [
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(templateInstantiateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof templateInstantiateSchema>

        // Verify template exists
        const template = await (prisma as any).designTemplate.findUnique({ where: { id } })
        if (!template) {
          return reply.code(404).send({ error: 'Template not found' })
        }

        // Increment usage count
        await (prisma as any).designTemplate.update({
          where: { id },
          data: { usageCount: { increment: 1 } },
        })

        const instance = await (prisma as any).designTemplateInstance.create({
          data: {
            templateId: id,
            designProjectId: body.designProjectId,
            instanceName: body.instanceName,
            customizations: body.customizations,
            usedById: user.id,
          },
        })

        return reply.code(201).send({ data: instance })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to instantiate template') })
      }
    }
  )

  // ========================================================================
  // STANDARD DETAILS
  // ========================================================================

  // GET /standard-details - List standard details
  fastify.get(
    '/standard-details',
    {
      preHandler: [validateQuery(paginationQuery)],
    },
    async (request, reply) => {
      try {
        const query = request.query as { page?: string; limit?: string; category?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.category) {
          where.detailCategory = query.category
        }

        const [details, total] = await Promise.all([
          (prisma as any).standardDetail.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          (prisma as any).standardDetail.count({ where }),
        ])

        return reply.send({
          data: details,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to list standard details') })
      }
    }
  )

  // POST /standard-details - Create standard detail
  fastify.post(
    '/standard-details',
    {
      preHandler: [validateBody(standardDetailCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof standardDetailCreateSchema>

        const detail = await (prisma as any).standardDetail.create({
          data: {
            ...body,
            applicableCodes: body.applicableCodes ?? [],
            applicableProjectTypes: body.applicableProjectTypes ?? [],
          },
        })

        return reply.code(201).send({ data: detail })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to create standard detail') })
      }
    }
  )

  // ========================================================================
  // PERFORMANCE BENCHMARKS
  // ========================================================================

  // GET /benchmarks - List performance benchmarks
  fastify.get(
    '/benchmarks',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            benchmarkType: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as { page?: string; limit?: string; benchmarkType?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.benchmarkType) {
          where.benchmarkType = query.benchmarkType
        }

        const [benchmarks, total] = await Promise.all([
          (prisma as any).performanceBenchmark.findMany({
            where,
            skip,
            take: limit,
            orderBy: { recordedAt: 'desc' },
          }),
          (prisma as any).performanceBenchmark.count({ where }),
        ])

        return reply.send({
          data: benchmarks,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to list benchmarks') })
      }
    }
  )

  // POST /benchmarks - Create performance benchmark
  fastify.post(
    '/benchmarks',
    {
      preHandler: [validateBody(benchmarkCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof benchmarkCreateSchema>

        const benchmark = await (prisma as any).performanceBenchmark.create({
          data: body,
        })

        return reply.code(201).send({ data: benchmark })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to create benchmark') })
      }
    }
  )
}
