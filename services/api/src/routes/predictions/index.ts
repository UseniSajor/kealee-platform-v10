/**
 * Prediction Routes
 *
 * Surfaces predictions from the Predictive Engine (APP-11) to project members.
 *
 * Prefix: /api/v1/predictions
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@kealee/database'
import {
  authenticateUser,
  type AuthenticatedRequest,
} from '../../middleware/auth.middleware'
import { validateParams } from '../../middleware/validation.middleware'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const projectIdParamsSchema = z.object({
  projectId: z.string().uuid(),
})

const predictionIdParamsSchema = z.object({
  id: z.string().uuid(),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function verifyProjectMembership(
  userId: string,
  projectId: string,
): Promise<boolean> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    select: { id: true },
  })
  return !!project
}

function computeRiskLevel(predictions: Array<{ probability: any; impact: string }>): 'low' | 'medium' | 'high' {
  if (predictions.length === 0) return 'low'

  const impactWeights: Record<string, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  }

  let maxScore = 0
  for (const p of predictions) {
    const prob = Number(p.probability)
    const impactWeight = impactWeights[p.impact] ?? 1
    const score = prob * impactWeight
    if (score > maxScore) maxScore = score
  }

  if (maxScore >= 2.0) return 'high'
  if (maxScore >= 1.0) return 'medium'
  return 'low'
}

// ---------------------------------------------------------------------------
// Route plugin
// ---------------------------------------------------------------------------

export async function predictionRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply)
  })

  // -------------------------------------------------------------------------
  // GET /project/:projectId — latest predictions for a project
  // -------------------------------------------------------------------------
  fastify.get(
    '/project/:projectId',
    {
      preHandler: [validateParams(projectIdParamsSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { projectId } = request.params as z.infer<typeof projectIdParamsSchema>

        const isMember = await verifyProjectMembership(user.id, projectId)
        if (!isMember && user.role !== 'admin') {
          return reply.code(403).send({ error: 'Not a member of this project' })
        }

        const predictions = await prisma.prediction.findMany({
          where: { projectId },
          orderBy: { createdAt: 'desc' },
          take: 50,
        })

        const riskLevel = computeRiskLevel(
          predictions.filter((p) => !p.acknowledged),
        )

        return reply.send({
          predictions: predictions.map((p) => ({
            id: p.id,
            projectId: p.projectId,
            type: p.type,
            probability: Number(p.probability),
            confidence: Number(p.confidence),
            impact: p.impact,
            description: p.description,
            factors: p.factors,
            recommendedAction: p.recommendedAction,
            acknowledged: p.acknowledged,
            acknowledgedAt: p.acknowledgedAt?.toISOString() ?? null,
            acknowledgedBy: p.acknowledgedBy,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
          })),
          riskLevel,
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to get predictions' })
      }
    },
  )

  // -------------------------------------------------------------------------
  // POST /acknowledge/:id — mark prediction as acknowledged
  // -------------------------------------------------------------------------
  fastify.post(
    '/acknowledge/:id',
    {
      preHandler: [validateParams(predictionIdParamsSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as AuthenticatedRequest).user!
        const { id } = request.params as z.infer<typeof predictionIdParamsSchema>

        const prediction = await prisma.prediction.findUnique({ where: { id } })
        if (!prediction) {
          return reply.code(404).send({ error: 'Prediction not found' })
        }

        const isMember = await verifyProjectMembership(user.id, prediction.projectId)
        if (!isMember && user.role !== 'admin') {
          return reply.code(403).send({ error: 'Not a member of this project' })
        }

        if (prediction.acknowledged) {
          return reply.code(409).send({ error: 'Prediction already acknowledged' })
        }

        await prisma.prediction.update({
          where: { id },
          data: {
            acknowledged: true,
            acknowledgedAt: new Date(),
            acknowledgedBy: user.id,
          },
        })

        return reply.send({ acknowledged: true })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to acknowledge prediction' })
      }
    },
  )
}
