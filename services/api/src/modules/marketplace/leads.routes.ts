import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { leadsService } from './leads.service'

const distributeLeadBodySchema = z.object({
  distributionCount: z.number().int().min(1).max(20).optional(),
})

const listLeadsQuerySchema = z.object({
  stage: z.string().optional(),
  estimatedValueMin: z.string().transform((val) => parseFloat(val)).optional(),
  estimatedValueMax: z.string().transform((val) => parseFloat(val)).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  projectType: z.string().optional(),
  assignedSalesRepId: z.string().uuid().optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).optional(),
  offset: z.string().transform((val) => parseInt(val, 10)).optional(),
})

const updateStageBodySchema = z.object({
  stage: z.enum(['INTAKE', 'QUALIFIED', 'SCOPED', 'QUOTED', 'WON', 'LOST']),
})

const assignSalesRepBodySchema = z.object({
  salesRepId: z.string().uuid(),
})

const awardContractorBodySchema = z.object({
  profileId: z.string().uuid(),
})

const closeLostBodySchema = z.object({
  reason: z.string().min(1),
})

export async function leadsRoutes(fastify: FastifyInstance) {
  // GET /leads - List leads with filtering
  fastify.get(
    '/leads',
    {
      preHandler: [
        authenticateUser,
        validateQuery(listLeadsQuerySchema),
      ],
    },
    async (request, reply) => {
      try {
        const query = request.query as any
        const result = await leadsService.listLeads({
          stage: query.stage,
          estimatedValueMin: query.estimatedValueMin,
          estimatedValueMax: query.estimatedValueMax,
          city: query.city,
          state: query.state,
          projectType: query.projectType,
          assignedSalesRepId: query.assignedSalesRepId,
          limit: query.limit,
          offset: query.offset,
        })
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to list leads',
        })
      }
    }
  )

  // POST /leads/:leadId/distribute - Distribute lead to contractors
  fastify.post(
    '/leads/:leadId/distribute',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ leadId: z.string().uuid() })),
        validateBody(distributeLeadBodySchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { leadId } = request.params as { leadId: string }
        const { distributionCount } = request.body as { distributionCount?: number }

        const result = await leadsService.distributeLead({
          leadId,
          userId: user.id,
          distributionCount,
        })

        if (!result.success) {
          return reply.code(400).send({
            error: result.reason,
            message: result.message,
            details: result,
          })
        }

        return reply.code(200).send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to distribute lead',
        })
      }
    }
  )

  // GET /leads/:leadId - Get lead details
  fastify.get(
    '/leads/:leadId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ leadId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      try {
        const { leadId } = request.params as { leadId: string }
        const lead = await leadsService.getLead(leadId)
        return reply.send({ lead })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(404).send({
          error: error.message || 'Lead not found',
        })
      }
    }
  )

  // PATCH /leads/:leadId/stage - Update lead stage
  fastify.patch(
    '/leads/:leadId/stage',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ leadId: z.string().uuid() })),
        validateBody(updateStageBodySchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { leadId } = request.params as { leadId: string }
        const { stage } = request.body as { stage: string }

        const lead = await leadsService.updateLeadStage(leadId, stage, user.id)
        return reply.send({ lead })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to update lead stage',
        })
      }
    }
  )

  // POST /leads/:leadId/assign-sales-rep - Assign sales rep to lead
  fastify.post(
    '/leads/:leadId/assign-sales-rep',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ leadId: z.string().uuid() })),
        validateBody(assignSalesRepBodySchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { leadId } = request.params as { leadId: string }
        const { salesRepId } = request.body as { salesRepId: string }

        const lead = await leadsService.assignSalesRep(leadId, salesRepId, user.id)
        return reply.send({ lead })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to assign sales rep',
        })
      }
    }
  )

  // POST /leads/:leadId/award-contractor - Award contractor to lead
  fastify.post(
    '/leads/:leadId/award-contractor',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ leadId: z.string().uuid() })),
        validateBody(awardContractorBodySchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { leadId } = request.params as { leadId: string }
        const { profileId } = request.body as { profileId: string }

        const lead = await leadsService.awardContractor(leadId, profileId, user.id)
        return reply.send({ lead })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to award contractor',
        })
      }
    }
  )

  // POST /leads/:leadId/close-lost - Close lead as lost
  fastify.post(
    '/leads/:leadId/close-lost',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ leadId: z.string().uuid() })),
        validateBody(closeLostBodySchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user as { id: string }
        const { leadId } = request.params as { leadId: string }
        const { reason } = request.body as { reason: string }

        const lead = await leadsService.closeLost(leadId, reason, user.id)
        return reply.send({ lead })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({
          error: error.message || 'Failed to close lead',
        })
      }
    }
  )
}
