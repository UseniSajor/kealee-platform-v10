import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateQuery } from '../../middleware/validation.middleware'
import { marketplaceService } from './marketplace.service'

const searchContractorsQuerySchema = z.object({
  specialty: z.string().optional(),
  search: z.string().optional(),
  verifiedOnly: z.string().transform((val) => val === 'true').optional(),
  minRating: z.string().transform((val) => parseFloat(val)).optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).optional(),
  offset: z.string().transform((val) => parseInt(val, 10)).optional(),
})

export async function marketplaceRoutes(fastify: FastifyInstance) {
  // Search contractors (Prompt 2.3)
  fastify.get(
    '/contractors',
    {
      preHandler: [
        authenticateUser,
        validateQuery(searchContractorsQuerySchema),
      ],
    },
    async (request, reply) => {
      const query = request.query as any
      const result = await marketplaceService.searchContractors({
        specialty: query.specialty,
        search: query.search,
        verifiedOnly: query.verifiedOnly,
        minRating: query.minRating,
        limit: query.limit,
        offset: query.offset,
      })
      return reply.send(result)
    }
  )

  // Get contractor profile (Prompt 2.3)
  fastify.get(
    '/contractors/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const profile = await marketplaceService.getContractorProfile(id)
      return reply.send({ profile })
    }
  )

  // Send contractor invitation (Prompt 2.3)
  fastify.post(
    '/contractors/:contractorId/invite',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ contractorId: z.string().uuid() })),
        validateQuery(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { contractorId } = request.params as { contractorId: string }
      const { projectId } = request.query as { projectId: string }
      const result = await marketplaceService.sendContractorInvitation(contractorId, projectId, user.id)
      return reply.code(201).send(result)
    }
  )
}
