/**
 * Pre-Construction Extras Routes
 * CRUD for PreConProject, DesignConcept, PreConPhaseHistory,
 * ContractorProfile, ContractorBid
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { prisma } from '@kealee/database'

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const preConProjectCreateSchema = z.object({
  orgId: z.string().uuid().optional(),
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  squareFootage: z.number().int().optional(),
  rooms: z.number().int().optional(),
  floors: z.number().int().optional(),
  features: z.array(z.string()).optional(),
  complexity: z.enum(['BASIC', 'STANDARD', 'PREMIUM', 'LUXURY']).optional(),
})

const preConProjectUpdateSchema = preConProjectCreateSchema.partial()

const designConceptCreateSchema = z.object({
  preConProjectId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().min(1),
  style: z.string().optional(),
  primaryImageUrl: z.string().url().optional(),
  designFiles: z.any().optional(),
  floorPlanUrl: z.string().url().optional(),
  renderingsUrls: z.array(z.string().url()).optional(),
  specificationUrl: z.string().url().optional(),
  estimatedCost: z.number().min(0),
  estimatedTimeline: z.number().int().min(1),
  estimatedLaborCost: z.number().min(0).optional(),
  estimatedMaterialCost: z.number().min(0).optional(),
  features: z.array(z.string()).optional(),
  materials: z.any().optional(),
  finishes: z.any().optional(),
})

const contractorProfileCreateSchema = z.object({
  userId: z.string().uuid(),
  businessName: z.string().min(1),
  licenseNumber: z.string().optional(),
  insuranceInfo: z.any().optional(),
  yearsInBusiness: z.number().int().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  description: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  serviceArea: z.any().optional(),
})

const contractorBidCreateSchema = z.object({
  preConProjectId: z.string().uuid(),
  contractorProfileId: z.string().uuid(),
  bidAmount: z.number().min(0),
  proposedTimeline: z.number().int().min(1),
  proposedStartDate: z.string().datetime().optional(),
  laborCost: z.number().min(0).optional(),
  materialCost: z.number().min(0).optional(),
  overheadCost: z.number().min(0).optional(),
  profitMargin: z.number().min(0).max(100).optional(),
  coverLetter: z.string().optional(),
  proposalDocUrl: z.string().url().optional(),
  portfolioUrls: z.array(z.string().url()).optional(),
  references: z.any().optional(),
})

const paginationQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function preconExtrasRoutes(fastify: FastifyInstance) {
  // Apply auth to all routes
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply)
  })

  // ========================================================================
  // PRE-CON PROJECTS
  // ========================================================================

  // GET /projects - List precon projects (filter by status)
  fastify.get(
    '/projects',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            status: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const query = request.query as { page?: string; limit?: string; status?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = { ownerId: user.id }
        if (query.status) where.status = query.status

        const [projects, total] = await Promise.all([
          (prisma as any).preConProject.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          (prisma as any).preConProject.count({ where }),
        ])

        return reply.send({
          data: projects,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list precon projects' })
      }
    }
  )

  // GET /projects/:id - Single precon project with concepts
  fastify.get(
    '/projects/:id',
    {
      preHandler: [validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }

        const project = await (prisma as any).preConProject.findUnique({
          where: { id },
          include: {
            designConcepts: true,
            bids: {
              include: {
                contractorProfile: {
                  select: { id: true, businessName: true, rating: true },
                },
              },
            },
          },
        })

        if (!project) {
          return reply.code(404).send({ error: 'PreCon project not found' })
        }

        return reply.send({ data: project })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to fetch precon project' })
      }
    }
  )

  // POST /projects - Create precon project
  fastify.post(
    '/projects',
    {
      preHandler: [validateBody(preConProjectCreateSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const body = request.body as z.infer<typeof preConProjectCreateSchema>

        const project = await (prisma as any).preConProject.create({
          data: {
            ...body,
            ownerId: user.id,
            features: body.features ?? [],
          },
        })

        return reply.code(201).send({ data: project })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create precon project' })
      }
    }
  )

  // PATCH /projects/:id - Update precon project
  fastify.patch(
    '/projects/:id',
    {
      preHandler: [
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(preConProjectUpdateSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const body = request.body as z.infer<typeof preConProjectUpdateSchema>

        const updated = await (prisma as any).preConProject.update({
          where: { id },
          data: body,
        })

        return reply.send({ data: updated })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to update precon project' })
      }
    }
  )

  // ========================================================================
  // DESIGN CONCEPTS
  // ========================================================================

  // GET /concepts - List design concepts
  fastify.get(
    '/concepts',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            preConProjectId: z.string().uuid().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as { page?: string; limit?: string; preConProjectId?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.preConProjectId) where.preConProjectId = query.preConProjectId

        const [concepts, total] = await Promise.all([
          (prisma as any).designConcept.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          (prisma as any).designConcept.count({ where }),
        ])

        return reply.send({
          data: concepts,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list design concepts' })
      }
    }
  )

  // POST /concepts - Create design concept
  fastify.post(
    '/concepts',
    {
      preHandler: [validateBody(designConceptCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof designConceptCreateSchema>

        const concept = await (prisma as any).designConcept.create({
          data: {
            ...body,
            renderingsUrls: body.renderingsUrls ?? [],
            features: body.features ?? [],
          },
        })

        return reply.code(201).send({ data: concept })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create design concept' })
      }
    }
  )

  // ========================================================================
  // CONTRACTOR PROFILES
  // ========================================================================

  // GET /profiles - List contractor profiles
  fastify.get(
    '/profiles',
    {
      preHandler: [validateQuery(paginationQuery)],
    },
    async (request, reply) => {
      try {
        const query = request.query as { page?: string; limit?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const [profiles, total] = await Promise.all([
          (prisma as any).contractorProfile.findMany({
            skip,
            take: limit,
            orderBy: { rating: 'desc' },
          }),
          (prisma as any).contractorProfile.count(),
        ])

        return reply.send({
          data: profiles,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list contractor profiles' })
      }
    }
  )

  // POST /profiles - Create contractor profile
  fastify.post(
    '/profiles',
    {
      preHandler: [validateBody(contractorProfileCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof contractorProfileCreateSchema>

        const profile = await (prisma as any).contractorProfile.create({
          data: {
            ...body,
            specialties: body.specialties ?? [],
          },
        })

        return reply.code(201).send({ data: profile })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create contractor profile' })
      }
    }
  )

  // ========================================================================
  // CONTRACTOR BIDS
  // ========================================================================

  // GET /bids - List contractor bids
  fastify.get(
    '/bids',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            preConProjectId: z.string().uuid().optional(),
            status: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as {
          page?: string; limit?: string; preConProjectId?: string; status?: string
        }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = {}
        if (query.preConProjectId) where.preConProjectId = query.preConProjectId
        if (query.status) where.status = query.status

        const [bids, total] = await Promise.all([
          (prisma as any).contractorBid.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              contractorProfile: {
                select: { id: true, businessName: true, rating: true },
              },
            },
          }),
          (prisma as any).contractorBid.count({ where }),
        ])

        return reply.send({
          data: bids,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list contractor bids' })
      }
    }
  )

  // POST /bids - Create contractor bid
  fastify.post(
    '/bids',
    {
      preHandler: [validateBody(contractorBidCreateSchema)],
    },
    async (request, reply) => {
      try {
        const body = request.body as z.infer<typeof contractorBidCreateSchema>

        const bid = await (prisma as any).contractorBid.create({
          data: {
            ...body,
            proposedStartDate: body.proposedStartDate
              ? new Date(body.proposedStartDate)
              : undefined,
            portfolioUrls: body.portfolioUrls ?? [],
          },
        })

        return reply.code(201).send({ data: bid })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: error.message || 'Failed to create contractor bid' })
      }
    }
  )
}
