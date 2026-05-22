/**
 * Kealee Platform v30 API routes
 * Spec: Kealee Platform Agents/v30/zip2/KEALEE-v30-COMPLETE-MASTER-SPEC.md Part 4
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import {
  ensureV30ProjectFromPublicIntake,
  processV30ProjectIntake,
  resolveV30PublicUserId,
} from '@kealee/os-intake'
import {
  getV30ProjectGenerationStatus,
  getV30ProjectWorkspace,
  startV30Generation,
} from '@kealee/os-ai-orch'
import { isV30Enabled, type V30IntakeFormAnswers } from '@kealee/kealee-agent-stack'

const intakeBodySchema = z.object({
  projectId: z.string().min(1),
  userId: z.string().min(1),
  answers: z.object({
    propertyType: z.string(),
    primaryScope: z.string(),
    budgetRange: z.string(),
    timeline: z.string(),
    location: z.string(),
    squareFeet: z.number().positive(),
    yearBuilt: z.string(),
    utilities: z.record(z.boolean()).optional().default({}),
    codeConsiderations: z.array(z.string()).default([]),
  }),
  selectedFeatures: z.array(z.string()).optional(),
})

const generateBodySchema = z.object({
  packageId: z.string().min(1),
  inputData: z.record(z.unknown()).optional(),
})

const publicGenerateBodySchema = z.object({
  intakeLeadId: z.string().min(1),
  projectPath: z.string().min(1),
  clientName: z.string().min(1),
  contactEmail: z.string().email(),
  projectAddress: z.string().min(1),
  answers: z.object({
    propertyType: z.string(),
    primaryScope: z.string(),
    budgetRange: z.string(),
    timeline: z.string(),
    location: z.string(),
    squareFeet: z.number().positive(),
    yearBuilt: z.string(),
    utilities: z.record(z.boolean()).optional().default({}),
    codeConsiderations: z.array(z.string()).default([]),
  }),
  features: z.array(z.string()).min(1),
})

function v30Disabled(reply: FastifyReply) {
  return reply.code(503).send({
    error: 'Kealee v30 is disabled',
    hint: 'Set KEALEE_V30_ENABLED=true on the API service',
  })
}

export async function v30Routes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (_request, reply) => {
    if (!isV30Enabled()) return v30Disabled(reply)
  })

  fastify.post('/intake', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = intakeBodySchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid intake', issues: parsed.error.flatten() })
    }

    try {
      const result = await processV30ProjectIntake({
        projectId: parsed.data.projectId,
        userId: parsed.data.userId,
        answers: parsed.data.answers as V30IntakeFormAnswers,
        selectedFeatures: parsed.data.selectedFeatures,
      })
      return reply.code(201).send(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Database error'
      fastify.log.warn({ err: message }, '[v30/intake] persistence failed — run v30 migration')
      return reply.code(503).send({ error: message, hint: 'Run prisma migrate deploy for v30 tables' })
    }
  })

  fastify.get('/intake/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    const projectId = (request.params as { projectId?: string }).projectId
    if (!projectId) return reply.code(400).send({ error: 'projectId required' })

    try {
      const { prisma } = await import('@kealee/database')
      const row = await prisma.v30IntakeResponse.findUnique({
        where: { projectId },
        include: { customPackage: true },
      })
      if (!row) return reply.code(404).send({ error: 'Intake not found' })
      return reply.send(row)
    } catch {
      return reply.code(404).send({ error: 'v30 tables not available — run prisma migrate deploy' })
    }
  })

  fastify.post('/public-intake/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = publicGenerateBodySchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid body', issues: parsed.error.flatten() })
    }

    const userId = resolveV30PublicUserId()
    if (!userId) {
      return reply.code(503).send({
        error: 'KEALEE_V30_PUBLIC_USER_ID not configured',
        hint: 'Set to a valid User.id for public /get-concept checkouts',
      })
    }

    try {
      const bridge = await ensureV30ProjectFromPublicIntake({
        intakeLeadId: parsed.data.intakeLeadId,
        projectPath: parsed.data.projectPath,
        clientName: parsed.data.clientName,
        contactEmail: parsed.data.contactEmail,
        projectAddress: parsed.data.projectAddress,
        answers: parsed.data.answers as V30IntakeFormAnswers,
        features: parsed.data.features,
        userId,
      })

      const generation = await startV30Generation({
        projectId: bridge.projectId,
        packageId: bridge.packageId,
        sharedInput: {
          intakeLeadId: parsed.data.intakeLeadId,
          projectPath: parsed.data.projectPath,
        },
      })

      return reply.code(202).send({
        ...generation,
        intakeLeadId: parsed.data.intakeLeadId,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      return reply.code(500).send({ error: message })
    }
  })

  fastify.post('/project/:projectId/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    const projectId = (request.params as { projectId?: string }).projectId
    if (!projectId) return reply.code(400).send({ error: 'projectId required' })

    const parsed = generateBodySchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid body', issues: parsed.error.flatten() })
    }

    try {
      const result = await startV30Generation({
        projectId,
        packageId: parsed.data.packageId,
        sharedInput: parsed.data.inputData,
      })
      return reply.code(202).send(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      return reply.code(500).send({ error: message })
    }
  })

  fastify.get('/project/:projectId/status', async (request: FastifyRequest, reply: FastifyReply) => {
    const projectId = (request.params as { projectId?: string }).projectId
    if (!projectId) return reply.code(400).send({ error: 'projectId required' })

    try {
      const status = await getV30ProjectGenerationStatus(projectId)
      return reply.send(status)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Status unavailable'
      return reply.code(503).send({ error: message })
    }
  })

  fastify.get('/project/:projectId/workspace', async (request: FastifyRequest, reply: FastifyReply) => {
    const projectId = (request.params as { projectId?: string }).projectId
    if (!projectId) return reply.code(400).send({ error: 'projectId required' })

    try {
      const workspace = await getV30ProjectWorkspace(projectId)
      const status = await getV30ProjectGenerationStatus(projectId)
      return reply.send({ ...workspace, generation: status })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Workspace unavailable'
      return reply.code(503).send({ error: message })
    }
  })

  fastify.get('/status', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      enabled: isV30Enabled(),
      version: '3.0',
      parallelBots: 9,
      designBot: 'canonical:v30_design_bot_executor',
      services: ['@kealee/os-intake', '@kealee/os-ai-orch', 'services/os-intake', 'services/os-ai-orch'],
    })
  })

  const { v30AdminRoutes } = await import('./v30-admin.routes')
  await fastify.register(v30AdminRoutes)

  const { v30CommandBridgeRoutes } = await import('./v30-command-bridge.routes')
  await fastify.register(v30CommandBridgeRoutes)
}
