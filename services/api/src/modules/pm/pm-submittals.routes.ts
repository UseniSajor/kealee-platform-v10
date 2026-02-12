import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { z } from 'zod'
import { submittalService } from './pm-submittals.service'

export async function pmSubmittalsRoutes(fastify: FastifyInstance) {
  // GET / - List submittals
  fastify.get(
    '/',
    {
      preHandler: [
        authenticateUser,
        validateQuery(z.object({
          projectId: z.string().uuid(),
          status: z.string().optional(),
          type: z.string().optional(),
          assignedTo: z.string().uuid().optional(),
          specSection: z.string().optional(),
          search: z.string().optional(),
          page: z.coerce.number().default(1),
          limit: z.coerce.number().default(25),
        })),
      ],
    },
    async (request, reply) => {
      const query = request.query as any
      const result = await submittalService.list(query)
      return reply.send(result)
    }
  )

  // GET /stats - Get submittal statistics
  fastify.get(
    '/stats',
    {
      preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid() }))],
    },
    async (request, reply) => {
      const { projectId } = request.query as { projectId: string }
      const stats = await submittalService.getStats(projectId)
      return reply.send({ stats })
    }
  )

  // GET /log - Get submittal log sorted by number
  fastify.get(
    '/log',
    {
      preHandler: [authenticateUser, validateQuery(z.object({ projectId: z.string().uuid() }))],
    },
    async (request, reply) => {
      const { projectId } = request.query as { projectId: string }
      const submittals = await submittalService.getLog(projectId)
      return reply.send({ submittals })
    }
  )

  // GET /:id - Get submittal by ID
  fastify.get(
    '/:id',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const submittal = await submittalService.getById(id)
      return reply.send({ submittal })
    }
  )

  // POST / - Create submittal
  fastify.post(
    '/',
    {
      preHandler: [
        authenticateUser,
        validateBody(z.object({
          projectId: z.string().uuid(),
          title: z.string().min(1),
          description: z.string().optional(),
          type: z.enum(['PRODUCT_DATA', 'SHOP_DRAWING', 'SAMPLE', 'MOCK_UP', 'DESIGN_MIX', 'TEST_REPORT', 'CERTIFICATE', 'MAINTENANCE_DATA']).optional(),
          specSection: z.string().optional(),
          assignedToId: z.string().uuid().optional(),
          dueDate: z.string().optional(),
          contractorId: z.string().uuid().optional(),
          subcontractorName: z.string().optional(),
          copies: z.number().int().positive().optional(),
          remarks: z.string().optional(),
        })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user
      const body = request.body as any
      const submittal = await submittalService.create({ ...body, createdById: user.id })
      return reply.code(201).send({ submittal })
    }
  )

  // PATCH /:id - Update submittal
  fastify.patch(
    '/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          type: z.string().optional(),
          specSection: z.string().optional(),
          assignedToId: z.string().uuid().optional(),
          dueDate: z.string().optional(),
          contractorId: z.string().uuid().optional(),
          subcontractorName: z.string().optional(),
          copies: z.number().int().positive().optional(),
          remarks: z.string().optional(),
        })),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = request.body as any
      const submittal = await submittalService.update(id, body)
      return reply.send({ submittal })
    }
  )

  // DELETE /:id - Soft delete submittal
  fastify.delete(
    '/:id',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await submittalService.softDelete(id)
      return reply.send({ success: true })
    }
  )

  // POST /:id/submit - Submit for review
  fastify.post(
    '/:id/submit',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const submittal = await submittalService.submit(id)
      return reply.send({ submittal })
    }
  )

  // POST /:id/review - Add review
  fastify.post(
    '/:id/review',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({
          status: z.enum(['APPROVED', 'APPROVED_AS_NOTED', 'REJECTED', 'REVISE_RESUBMIT']),
          comments: z.string().optional(),
          stampUrl: z.string().url().optional(),
        })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user
      const { id } = request.params as { id: string }
      const body = request.body as any
      const review = await submittalService.addReview({
        submittalId: id,
        reviewerId: user.id,
        ...body,
      })
      return reply.code(201).send({ review })
    }
  )

  // POST /:id/resubmit - Resubmit after rejection
  fastify.post(
    '/:id/resubmit',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string().uuid() }))],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const submittal = await submittalService.resubmit(id)
      return reply.send({ submittal })
    }
  )
}
