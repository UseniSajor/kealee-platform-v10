/**
 * Kealee Platform v30 API routes
 * Spec: Kealee Platform Agents/v30/KEALEE-v30-COMPLETE-MASTER-SPEC.md Part 4
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '@kealee/database'
import {
  analyzeV30Intake,
  calculateV30PackagePrice,
  isV30Enabled,
  runV30ParallelGeneration,
  type V30IntakeFormAnswers,
} from '@kealee/kealee-agent-stack'

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
})

const generateBodySchema = z.object({
  packageId: z.string().min(1),
  inputData: z.record(z.unknown()).optional(),
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

    const { projectId, userId, answers } = parsed.data
    const analysis = analyzeV30Intake(answers as V30IntakeFormAnswers)
    const features = analysis.suggestedFeatures
    const { featureAddons, totalPrice } = calculateV30PackagePrice(analysis.estimatedCost, features)

    let packageId: string | undefined

    try {
      const intake = await prisma.v30IntakeResponse.upsert({
        where: { projectId },
        create: {
          projectId,
          userId,
          propertyType: answers.propertyType,
          primaryScope: answers.primaryScope,
          budgetRange: answers.budgetRange,
          timeline: answers.timeline,
          location: answers.location,
          squareFeet: answers.squareFeet,
          yearBuilt: answers.yearBuilt,
          utilities: answers.utilities ?? {},
          codeConsiderations: answers.codeConsiderations,
          scopeComplexity: analysis.scopeComplexity,
          riskLevel: analysis.riskLevel,
          estimatedCost: analysis.estimatedCost,
          estimatedDays: analysis.estimatedDays,
          analysisJson: analysis.analysisJson,
          status: 'ANALYZED',
          analyzedAt: new Date(),
        },
        update: {
          propertyType: answers.propertyType,
          primaryScope: answers.primaryScope,
          budgetRange: answers.budgetRange,
          timeline: answers.timeline,
          location: answers.location,
          squareFeet: answers.squareFeet,
          yearBuilt: answers.yearBuilt,
          utilities: answers.utilities ?? {},
          codeConsiderations: answers.codeConsiderations,
          scopeComplexity: analysis.scopeComplexity,
          riskLevel: analysis.riskLevel,
          estimatedCost: analysis.estimatedCost,
          estimatedDays: analysis.estimatedDays,
          analysisJson: analysis.analysisJson,
          status: 'ANALYZED',
          analyzedAt: new Date(),
        },
      })

      const pkg = await prisma.v30CustomPackage.upsert({
        where: { projectId },
        create: {
          intakeResponseId: intake.id,
          projectId,
          userId,
          features,
          basePrice: analysis.estimatedCost,
          featureAddons,
          totalPrice,
          status: 'QUOTED',
        },
        update: { features, basePrice: analysis.estimatedCost, featureAddons, totalPrice, status: 'QUOTED' },
      })
      packageId = pkg.id

      await prisma.project.update({
        where: { id: projectId },
        data: { v30Status: 'INTAKE', packageFeatures: features, packageType: 'custom' },
      }).catch(() => undefined)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Database error'
      fastify.log.warn({ err: message }, '[v30/intake] persistence skipped — run v30 migration')
    }

    return reply.code(201).send({
      projectId,
      packageId,
      analysis,
      package: { features, basePrice: analysis.estimatedCost, featureAddons, totalPrice },
    })
  })

  fastify.get('/intake/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    const projectId = (request.params as { projectId?: string }).projectId
    if (!projectId) return reply.code(400).send({ error: 'projectId required' })

    try {
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

  fastify.post('/project/:projectId/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    const projectId = (request.params as { projectId?: string }).projectId
    if (!projectId) return reply.code(400).send({ error: 'projectId required' })

    const parsed = generateBodySchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid body', issues: parsed.error.flatten() })
    }

    const result = await runV30ParallelGeneration(
      projectId,
      parsed.data.packageId,
      { projectId, ...(parsed.data.inputData ?? {}) },
    )

    return reply.code(202).send(result)
  })

  fastify.get('/status', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ enabled: isV30Enabled(), version: '3.0', parallelBots: 10 })
  })
}
