import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { deliverableService } from './deliverable.service'

const createDeliverableSchema = z.object({
  designProjectId: z.string().uuid(),
  phaseId: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  deliverableType: z.string().min(1),
  dueDate: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  dependsOnId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  associatedFileIds: z.array(z.string().uuid()).optional(),
})

export async function deliverableRoutes(fastify: FastifyInstance) {
  // Create deliverable
  fastify.post(
    '/design-projects/:projectId/deliverables',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
        validateBody(createDeliverableSchema as any),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { projectId } = request.params as { projectId: string }
      const data = request.body as z.infer<typeof createDeliverableSchema>
      const result = await deliverableService.createDeliverable({
        ...data,
        designProjectId: projectId,
        createdById: user.id,
      })
      return reply.send(result)
    }
  )

  // Get deliverable
  fastify.get(
    '/deliverables/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const result = await deliverableService.getDeliverable(id)
      return reply.send(result)
    }
  )

  // List deliverables
  fastify.get(
    '/design-projects/:projectId/deliverables',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const result = await deliverableService.listDeliverables(projectId)
      return reply.send(result)
    }
  )

  // Update deliverable
  fastify.put(
    '/deliverables/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(z.object({
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          status: z.string().optional(),
          dueDate: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
        }) as any),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const data = request.body as any
      const result = await deliverableService.updateDeliverable(id, data)
      return reply.send(result)
    }
  )
}




