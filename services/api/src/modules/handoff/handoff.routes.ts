import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateParams, validateBody } from '../../middleware/validation.middleware'
import { handoffService } from './handoff.service'

const submitSurveySchema = z.object({
  overallRating: z.number().int().min(1).max(5),
  communicationRating: z.number().int().min(1).max(5).optional(),
  qualityRating: z.number().int().min(1).max(5).optional(),
  timelinessRating: z.number().int().min(1).max(5).optional(),
  valueRating: z.number().int().min(1).max(5).optional(),
  whatWentWell: z.string().optional(),
  whatCouldImprove: z.string().optional(),
  additionalComments: z.string().optional(),
  wouldRecommend: z.boolean().optional(),
  recommendationReason: z.string().optional(),
})

export async function handoffRoutes(fastify: FastifyInstance) {
  // Generate handoff package (Prompt 3.8)
  fastify.post(
    '/projects/:projectId/generate',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { projectId } = request.params as { projectId: string }
      const package_ = await handoffService.generateHandoffPackage(projectId, user.id)
      return reply.code(201).send({ package: package_ })
    }
  )

  // Get handoff package (Prompt 3.8)
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
      const package_ = await handoffService.getHandoffPackage(projectId, user.id)
      if (!package_) {
        return reply.code(404).send({ error: 'Handoff package not found' })
      }
      return reply.send({ package: package_ })
    }
  )

  // Deliver handoff package (Prompt 3.8)
  fastify.post(
    '/projects/:projectId/deliver',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { projectId } = request.params as { projectId: string }
      const package_ = await handoffService.deliverHandoffPackage(projectId, user.id)
      return reply.send({ package: package_ })
    }
  )

  // Record download (Prompt 3.8)
  fastify.post(
    '/projects/:projectId/download',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ projectId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { projectId } = request.params as { projectId: string }
      const package_ = await handoffService.recordDownload(projectId, user.id)
      return reply.send({ package: package_ })
    }
  )

  // Get satisfaction survey (Prompt 3.8)
  fastify.get(
    '/packages/:packageId/survey',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ packageId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { packageId } = request.params as { packageId: string }
      const survey = await handoffService.getSatisfactionSurvey(packageId, user.id)
      return reply.send({ survey })
    }
  )

  // Start satisfaction survey (Prompt 3.8)
  fastify.post(
    '/packages/:packageId/survey/start',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ packageId: z.string().uuid() })),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { packageId } = request.params as { packageId: string }
      const survey = await handoffService.startSatisfactionSurvey(packageId, user.id)
      return reply.send({ survey })
    }
  )

  // Submit satisfaction survey (Prompt 3.8)
  fastify.post(
    '/packages/:packageId/survey/submit',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ packageId: z.string().uuid() })),
        validateBody(submitSurveySchema),
      ],
    },
    async (request, reply) => {
      const user = (request as any).user as { id: string }
      const { packageId } = request.params as { packageId: string }
      const survey = await handoffService.submitSatisfactionSurvey(packageId, user.id, request.body as any)
      return reply.send({ survey })
    }
  )
}
