import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../auth/auth.middleware'
import { COMPLIANCE_GATES, checkGate, getAvailableGates, ComplianceError } from '@kealee/compliance'
import { z } from 'zod'
import { validateParams, validateBody } from '../../middleware/validation.middleware'

export async function complianceGatesRoutes(fastify: FastifyInstance) {
  // GET /compliance/gates - Get all available gates
  fastify.get(
    '/gates',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const gates = getAvailableGates()
        return reply.send({ gates })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to get gates',
        })
      }
    }
  )

  // POST /compliance/gates/:gateId/check - Check a specific gate
  fastify.post(
    '/gates/:gateId/check',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ gateId: z.string() })),
        validateBody(z.object({
          projectId: z.string().uuid(),
          milestoneId: z.string().uuid().optional(),
          paymentId: z.string().uuid().optional(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const { gateId } = request.params as { gateId: string }
        const params = request.body as {
          projectId: string
          milestoneId?: string
          paymentId?: string
        }

        const result = await checkGate(gateId, params)

        return reply.send({ result })
      } catch (error: any) {
        if (error instanceof ComplianceError) {
          return reply.code(403).send({
            error: 'Compliance gate failed',
            failedChecks: error.failedChecks,
            message: error.message,
          })
        }

        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to check gate',
        })
      }
    }
  )

  // POST /compliance/gates/:gateId/enforce - Enforce a gate (throws if fails)
  fastify.post(
    '/gates/:gateId/enforce',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ gateId: z.string() })),
        validateBody(z.object({
          projectId: z.string().uuid(),
          milestoneId: z.string().uuid().optional(),
          paymentId: z.string().uuid().optional(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const { gateId } = request.params as { gateId: string }
        const params = request.body as {
          projectId: string
          milestoneId?: string
          paymentId?: string
        }

        const result = await checkGate(gateId, params)

        if (!result.canProceed) {
          return reply.code(403).send({
            error: 'Compliance gate enforcement failed',
            result,
          })
        }

        return reply.send({ success: true, result })
      } catch (error: any) {
        if (error instanceof ComplianceError) {
          return reply.code(403).send({
            error: 'Compliance gate enforcement failed',
            failedChecks: error.failedChecks,
            message: error.message,
          })
        }

        fastify.log.error(error)
        return reply.code(500).send({
          error: error.message || 'Failed to enforce gate',
        })
      }
    }
  )
}
