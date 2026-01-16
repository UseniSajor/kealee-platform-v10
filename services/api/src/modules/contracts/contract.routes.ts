import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams } from '../../middleware/validation.middleware'
import { contractService } from './contract.service'

const createContractSchema = z.object({
  projectId: z.string().uuid(),
  templateId: z.string().uuid().nullable().optional(),
  contractorId: z.string().uuid().nullable().optional(),
  terms: z.string().nullable().optional(),
  milestones: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().nullable().optional(),
        amount: z.number().nonnegative(),
      })
    )
    .optional(),
})

const updateContractSchema = z.object({
  contractorId: z.string().uuid().nullable().optional(),
  terms: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'SENT', 'SIGNED', 'ACTIVE', 'CANCELLED', 'ARCHIVED']).optional(),
})

const addMilestoneSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  amount: z.number().nonnegative(),
})

const updateMilestoneSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  amount: z.number().nonnegative().optional(),
})

export async function contractRoutes(fastify: FastifyInstance) {
  // Create contract from template (Prompt 2.2)
  fastify.post(
    '/',
    { preHandler: [authenticateUser, validateBody(createContractSchema)] },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const body = request.body as any
      const contract = await contractService.createContract(body, user.id)
      return reply.code(201).send({ contract })
    }
  )

  // Get contract
  fastify.get(
    '/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const contract = await contractService.getContract(id, user.id)
      return reply.send({ contract })
    }
  )

  // List contracts for a project
  fastify.get(
    '/projects/:projectId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { projectId } = request.params as { projectId: string }
      const contracts = await contractService.listProjectContracts(projectId, user.id)
      return reply.send({ contracts })
    }
  )

  // Update contract
  fastify.patch(
    '/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(updateContractSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const body = request.body as any
      const contract = await contractService.updateContract(id, user.id, body)
      return reply.send({ contract })
    }
  )

  // Add milestone to contract
  fastify.post(
    '/:id/milestones',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string().uuid() })),
        validateBody(addMilestoneSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { id } = request.params as { id: string }
      const body = request.body as any
      const milestone = await contractService.addMilestone(id, user.id, body)
      return reply.code(201).send({ milestone })
    }
  )

  // Update milestone
  fastify.patch(
    '/milestones/:milestoneId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ milestoneId: z.string().uuid() })),
        validateBody(updateMilestoneSchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { milestoneId } = request.params as { milestoneId: string }
      const body = request.body as any
      const milestone = await contractService.updateMilestone(milestoneId, user.id, body)
      return reply.send({ milestone })
    }
  )

  // Delete milestone
  fastify.delete(
    '/milestones/:milestoneId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ milestoneId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { milestoneId } = request.params as { milestoneId: string }
      await contractService.deleteMilestone(milestoneId, user.id)
      return reply.send({ success: true })
    }
  )
}
