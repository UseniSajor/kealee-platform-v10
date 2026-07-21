/**
 * Portfolio Routes
 * CRUD for Portfolio, PortfolioItem, ContractorProject
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

const portfolioCreateSchema = z.object({
  profileId: z.string().uuid(),
  projectName: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  imageUrls: z.array(z.string().url()).optional(),
  completedAt: z.string().datetime().optional(),
})

const portfolioUpdateSchema = z.object({
  projectName: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().min(1).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  completedAt: z.string().datetime().optional(),
})

const portfolioItemCreateSchema = z.object({
  projectName: z.string().optional(),
  projectType: z.string().optional(),
  description: z.string().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  thumbnailUrl: z.string().url().optional(),
  completedDate: z.string().datetime().optional(),
  location: z.string().optional(),
  projectValue: z.number().min(0).optional(),
  squareFootage: z.number().int().optional(),
  displayOrder: z.number().int().optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  metadata: z.any().optional(),
})

const contractorProjectCreateSchema = z.object({
  contractorId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  projectName: z.string().min(1),
  projectType: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  contractValue: z.number().min(0).optional(),
  role: z.string().optional(),
})

const paginationQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function portfolioRoutes(fastify: FastifyInstance) {
  // Apply auth to all routes
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply)
  })

  // ========================================================================
  // PORTFOLIOS (MarketplaceProfile-based)
  // ========================================================================

  // GET /portfolios - List portfolios (filter by contractorId → profileId)
  fastify.get(
    '/portfolios',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            contractorId: z.string().uuid().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as { page?: string; limit?: string; contractorId?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.contractorId) where.profileId = query.contractorId

        const [portfolios, total] = await Promise.all([
          (prisma as any).portfolio.findMany({
            where,
            skip,
            take: limit,
            orderBy: { completedAt: 'desc' },
          }),
          (prisma as any).portfolio.count({ where }),
        ])

        return reply.send({
          data: portfolios,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to list portfolios') })
      }
    }
  )

  // GET /portfolios/:id - Single portfolio with items
  fastify.get(
    '/portfolios/:id',
    {
      preHandler: [validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }

        const portfolio = await (prisma as any).portfolio.findUnique({
          where: { id },
          include: {
            profile: { select: { id: true, businessName: true } },
          },
        })

        if (!portfolio) {
          return reply.code(404).send({ error: 'Portfolio not found' })
        }

        return reply.send({ data: portfolio })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to fetch portfolio') })
      }
    }
  )

  // POST /portfolios - Create portfolio
  fastify.post(
    '/portfolios',
    {
      preHandler: [validateBody(portfolioCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof portfolioCreateSchema>

        const portfolio = await (prisma as any).portfolio.create({
          data: {
            ...body,
            imageUrls: body.imageUrls ?? [],
            completedAt: body.completedAt ? new Date(body.completedAt) : undefined,
          },
        })

        return reply.code(201).send({ data: portfolio })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to create portfolio') })
      }
    }
  )

  // PATCH /portfolios/:id - Update portfolio
  fastify.patch(
    '/portfolios/:id',
    {
      preHandler: [
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(portfolioUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof portfolioUpdateSchema>

        const updated = await (prisma as any).portfolio.update({
          where: { id },
          data: {
            ...body,
            completedAt: body.completedAt ? new Date(body.completedAt) : undefined,
          },
        })

        return reply.send({ data: updated })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to update portfolio') })
      }
    }
  )

  // POST /portfolios/:id/items - Add item to portfolio (PortfolioItem)
  fastify.post(
    '/portfolios/:id/items',
    {
      preHandler: [
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(portfolioItemCreateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id: contractorId } = request.params as { id: string }
        const body = request.body as z.infer<typeof portfolioItemCreateSchema>

        const item = await (prisma as any).portfolioItem.create({
          data: {
            ...body,
            contractorId,
            imageUrls: body.imageUrls ?? [],
            completedDate: body.completedDate ? new Date(body.completedDate) : undefined,
          },
        })

        return reply.code(201).send({ data: item })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to add portfolio item') })
      }
    }
  )

  // DELETE /portfolios/:id/items/:itemId - Remove item from portfolio
  fastify.delete(
    '/portfolios/:id/items/:itemId',
    {
      preHandler: [
        validateParams(
          z.object({
            id: z.string().uuid(),
            itemId: z.string().uuid(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const { itemId } = request.params as { id: string; itemId: string }

        await (prisma as any).portfolioItem.delete({
          where: { id: itemId },
        })

        return reply.code(204).send()
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to remove portfolio item') })
      }
    }
  )

  // ========================================================================
  // CONTRACTOR PROJECTS
  // ========================================================================

  // GET /contractor-projects - List contractor projects
  fastify.get(
    '/contractor-projects',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            contractorId: z.string().uuid().optional(),
            status: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; contractorId?: string; status?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.contractorId) where.contractorId = query.contractorId
        if (query.status) where.status = query.status

        const [projects, total] = await Promise.all([
          (prisma as any).contractorProject.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          (prisma as any).contractorProject.count({ where }),
        ])

        return reply.send({
          data: projects,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: sanitizeErrorMessage(error, 'Failed to list contractor projects') })
      }
    }
  )

  // POST /contractor-projects - Create contractor project
  fastify.post(
    '/contractor-projects',
    {
      preHandler: [validateBody(contractorProjectCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof contractorProjectCreateSchema>

        const project = await (prisma as any).contractorProject.create({
          data: {
            ...body,
            startDate: body.startDate ? new Date(body.startDate) : undefined,
            endDate: body.endDate ? new Date(body.endDate) : undefined,
          },
        })

        return reply.code(201).send({ data: project })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error, 'Failed to create contractor project') })
      }
    }
  )
}
