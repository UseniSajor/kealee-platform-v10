/**
 * bots.chain.routes.ts
 *
 * HTTP endpoints for the KeaBots three-stage chain.
 * Prefix (registered in index.ts): /bots
 *
 * Endpoints:
 *   POST /bots/chain/run               — run full Design→Estimate→Permit chain
 *   POST /bots/chain/design/run        — run DesignBot only
 *   POST /bots/chain/estimate/run      — run EstimateBot (requires designRunId in body)
 *   POST /bots/chain/permit/run        — run PermitBot (requires estimateRunId in body)
 *   GET  /bots/chain/runs/:projectId   — list chain runs for a project
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody, validateParams } from '../../middleware/validation.middleware'
import { checkCostGuard } from './bots.router'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'
import {
  runChain,
  runDesignBot,
  runEstimateBot,
  runPermitBot,
  runContractorBot,
  ChainGateError,
  type ChainInput,
  type DesignBotResult,
  type EstimateBotResult,
  type PermitBotResult,
} from './bots.chain'

// ── Schemas ───────────────────────────────────────────────────────────────────

const chainInputSchema = z.object({
  projectId:         z.string().min(1),
  projectType:       z.string().min(1),
  location:          z.string().min(1),
  scope:             z.string().min(1),
  sqft:              z.number().int().positive().optional(),
  budgetUsd:         z.number().nonnegative().optional(),
  jurisdiction:      z.string().optional(),
  zipCode:           z.string().optional(),
  structuralChanges: z.boolean().optional(),
  electricalChanges: z.boolean().optional(),
  plumbingChanges:   z.boolean().optional(),
  hvacChanges:       z.boolean().optional(),
})

const estimateRunSchema = chainInputSchema.extend({
  designResult: z.object({
    botRunId:              z.string(),
    projectType:           z.string(),
    location:              z.string(),
    sqft:                  z.number(),
    budgetUsd:             z.number(),
    ctcTotal:              z.number(),
    ctcRange:              z.tuple([z.number(), z.number()]),
    ctcBreakdown:          z.record(z.number()),
    mepSystem:             z.record(z.unknown()),
    bom:                   z.array(z.unknown()),
    bomItemCount:          z.number(),
    aiConceptCostUsd:      z.number(),
    estimatedTotalCostUsd: z.number(),
    cacheMetrics:          z.object({
      cacheCreationTokens: z.number(),
      cacheReadTokens:     z.number(),
      cacheHit:            z.boolean(),
      savedTokens:         z.number(),
    }),
    durationMs: z.number(),
  }),
})

const permitRunSchema = chainInputSchema.extend({
  estimateResult: z.object({
    botRunId:    z.string(),
    parentRunId: z.string(),
    lineItems:   z.array(z.unknown()),
    totalLow:    z.number(),
    totalHigh:   z.number(),
    assumptions: z.array(z.string()),
    exclusions:  z.array(z.string()),
    confidence:  z.number(),
    cacheMetrics: z.object({
      cacheCreationTokens: z.number(),
      cacheReadTokens:     z.number(),
      cacheHit:            z.boolean(),
      savedTokens:         z.number(),
    }),
    durationMs: z.number(),
  }),
})

const projectIdParam = z.object({
  projectId: z.string().min(1),
})

// ── Helper: extract user guard key ───────────────────────────────────────────

function guardKey(request: { user?: { id: string; orgId?: string } }): string {
  return request.user?.orgId ?? request.user?.id ?? 'anonymous'
}

// ── Output Normalization ──────────────────────────────────────────────────────
// All bot responses must include: summary, recommendations, nextStep,
// conversion_product, confidence — for consistent consumer contract.

function normalizeDesign(r: any) {
  if (!r) return r
  return {
    ...r,
    summary: r.summary ?? `Design analysis complete for ${r.projectType ?? 'your project'} in ${r.location ?? 'your area'}.`,
    recommendations: r.recommendations ?? (r.bom ?? []).slice(0, 3).map((i: any) => String(i.description ?? i)),
    nextStep: r.nextStep ?? 'Review your design concept and proceed to cost estimation.',
    conversion_product: r.conversion_product ?? 'DESIGN_CONCEPT_VALIDATION',
    confidence: r.confidence ?? (r.ctcTotal > 0 ? 'high' : 'medium'),
  }
}

function normalizeEstimate(r: any) {
  if (!r) return r
  const lo = r.totalLow ?? 0
  const hi = r.totalHigh ?? 0
  const conf = typeof r.confidence === 'number'
    ? (r.confidence > 0.8 ? 'high' : r.confidence > 0.5 ? 'medium' : 'low')
    : (r.confidence ?? 'medium')
  return {
    ...r,
    summary: r.summary ?? `Cost estimate: $${lo.toLocaleString()} – $${hi.toLocaleString()}.`,
    recommendations: r.recommendations ?? (r.assumptions ?? []).slice(0, 3),
    nextStep: r.nextStep ?? 'Proceed to permit analysis to validate your project scope.',
    conversion_product: r.conversion_product ?? 'PERMIT_PACKAGE',
    confidence: conf,
  }
}

function normalizePermit(r: any) {
  if (!r) return r
  const score = r.readinessScore ?? 0
  return {
    ...r,
    summary: r.summary ?? `Permit readiness score: ${score}%. ${r.recommendation ?? ''}`.trim(),
    recommendations: r.recommendations ?? (r.issues ?? []).slice(0, 3).map((i: any) => String(i.description ?? i)),
    nextStep: r.nextStep ?? 'Match with a verified contractor to begin permit filing.',
    conversion_product: r.conversion_product ?? 'CONTRACTOR_MATCH',
    confidence: r.confidence ?? (score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low'),
  }
}

function normalizeContractor(r: any) {
  if (!r) return r
  return {
    ...r,
    summary: r.summary ?? `Contractor matching criteria generated for ${r.projectType ?? 'your project'} in ${r.jurisdiction ?? 'your area'}.`,
    recommendations: r.recommendations ?? ['Require licensed, bonded contractor', 'Request 3+ DMV references'],
    nextStep: r.nextStep ?? 'Engage a verified general contractor and mobilize for construction.',
    conversion_product: r.conversion_product ?? 'CONTRACTOR_MATCH',
    confidence: r.confidence ?? 'medium',
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

export async function botsChainRoutes(fastify: FastifyInstance) {

  /**
   * POST /bots/chain/run
   * Run the full DesignBot → EstimateBot → PermitBot chain in one call.
   */
  fastify.post(
    '/chain/run',
    {
      preHandler: [
        authenticateUser,
        validateBody(chainInputSchema),
      ],
    },
    async (request, reply) => {
      const body = request.body as z.infer<typeof chainInputSchema>
      const user = (request as any).user as { id: string; orgId?: string }

      const guard = checkCostGuard({ key: guardKey({ user }), maxPerHour: 10, maxPerDay: 50 })
      if (!guard.allowed) {
        return reply.code(429).send({ error: guard.reason })
      }

      const input: ChainInput = { ...body, userId: user.id, orgId: user.orgId }

      try {
        const raw = await runChain(input)
        const result = {
          ...raw,
          design:     normalizeDesign(raw.design),
          estimate:   normalizeEstimate(raw.estimate),
          permit:     normalizePermit(raw.permit),
          contractor: normalizeContractor(raw.contractor),
        }
        return reply.code(200).send({ success: true, result })
      } catch (err: any) {
        if (err instanceof ChainGateError) {
          return reply.code(422).send({
            error:        err.message,
            stage:        err.stage,
            parentRunId:  err.parentRunId,
            parentStatus: err.parentStatus,
          })
        }
        fastify.log.error({ err, projectId: body.projectId }, 'Chain run failed')
        return reply.code(500).send({ error: sanitizeErrorMessage(err, 'Chain run failed') })
      }
    }
  )

  /**
   * POST /bots/chain/design/run
   * Run DesignBot only. Returns designResult for passing to EstimateBot.
   */
  fastify.post(
    '/chain/design/run',
    {
      preHandler: [
        authenticateUser,
        validateBody(chainInputSchema),
      ],
    },
    async (request, reply) => {
      const body = request.body as z.infer<typeof chainInputSchema>
      const user = (request as any).user as { id: string; orgId?: string }

      const guard = checkCostGuard({ key: guardKey({ user }), maxPerHour: 20, maxPerDay: 100 })
      if (!guard.allowed) {
        return reply.code(429).send({ error: guard.reason })
      }

      const input: ChainInput = { ...body, userId: user.id, orgId: user.orgId }

      try {
        const designResult = await runDesignBot(input)
        return reply.code(200).send({ success: true, result: normalizeDesign(designResult) })
      } catch (err: any) {
        fastify.log.error({ err }, 'DesignBot run failed')
        return reply.code(500).send({ error: sanitizeErrorMessage(err, 'DesignBot run failed') })
      }
    }
  )

  /**
   * POST /bots/chain/estimate/run
   * Run EstimateBot using a prior DesignBot result.
   * Body must include `designResult` (output from /chain/design/run).
   */
  fastify.post(
    '/chain/estimate/run',
    {
      preHandler: [
        authenticateUser,
        validateBody(estimateRunSchema),
      ],
    },
    async (request, reply) => {
      const body = request.body as z.infer<typeof estimateRunSchema>
      const user = (request as any).user as { id: string; orgId?: string }

      const guard = checkCostGuard({ key: guardKey({ user }), maxPerHour: 20, maxPerDay: 100 })
      if (!guard.allowed) {
        return reply.code(429).send({ error: guard.reason })
      }

      const { designResult, ...chainFields } = body
      const input: ChainInput = { ...chainFields, userId: user.id, orgId: user.orgId }

      try {
        const estimateResult = await runEstimateBot(input, designResult as DesignBotResult)
        return reply.code(200).send({ success: true, result: normalizeEstimate(estimateResult) })
      } catch (err: any) {
        if (err instanceof ChainGateError) {
          return reply.code(422).send({
            error:        err.message,
            stage:        err.stage,
            parentRunId:  err.parentRunId,
            parentStatus: err.parentStatus,
          })
        }
        fastify.log.error({ err }, 'EstimateBot run failed')
        return reply.code(500).send({ error: sanitizeErrorMessage(err, 'EstimateBot run failed') })
      }
    }
  )

  /**
   * POST /bots/chain/permit/run
   * Run PermitBot using a prior EstimateBot result.
   * Body must include `estimateResult` (output from /chain/estimate/run).
   */
  fastify.post(
    '/chain/permit/run',
    {
      preHandler: [
        authenticateUser,
        validateBody(permitRunSchema),
      ],
    },
    async (request, reply) => {
      const body = request.body as z.infer<typeof permitRunSchema>
      const user = (request as any).user as { id: string; orgId?: string }

      const guard = checkCostGuard({ key: guardKey({ user }), maxPerHour: 20, maxPerDay: 100 })
      if (!guard.allowed) {
        return reply.code(429).send({ error: guard.reason })
      }

      const { estimateResult, ...chainFields } = body
      const input: ChainInput = { ...chainFields, userId: user.id, orgId: user.orgId }

      try {
        const permitResult = await runPermitBot(input, estimateResult as EstimateBotResult)
        return reply.code(200).send({ success: true, result: normalizePermit(permitResult) })
      } catch (err: any) {
        if (err instanceof ChainGateError) {
          return reply.code(422).send({
            error:        err.message,
            stage:        err.stage,
            parentRunId:  err.parentRunId,
            parentStatus: err.parentStatus,
          })
        }
        fastify.log.error({ err }, 'PermitBot run failed')
        return reply.code(500).send({ error: sanitizeErrorMessage(err, 'PermitBot run failed') })
      }
    }
  )

  /**
   * POST /bots/chain/contractor/run
   * Run ContractorBot using a prior PermitBot result.
   * Body must include `permitResult` (output from /chain/permit/run).
   */
  fastify.post(
    '/chain/contractor/run',
    {
      preHandler: [
        authenticateUser,
        validateBody(chainInputSchema.extend({
          permitResult: z.object({
            botRunId:             z.string(),
            parentRunId:          z.string(),
            jurisdiction:         z.string(),
            zipCode:              z.string(),
            state:                z.string(),
            permits:              z.array(z.unknown()),
            totalPermitCostUsd:   z.number(),
            totalProcessingDays:  z.number(),
            readinessScore:       z.number(),
            issues:               z.array(z.unknown()),
            recommendation:       z.string(),
            jurisdictionCacheHit: z.boolean(),
            cacheMetrics: z.object({
              cacheCreationTokens: z.number(),
              cacheReadTokens:     z.number(),
              cacheHit:            z.boolean(),
              savedTokens:         z.number(),
            }),
            durationMs: z.number(),
          }),
        })),
      ],
    },
    async (request, reply) => {
      const body = request.body as z.infer<typeof chainInputSchema> & { permitResult: PermitBotResult }
      const user = (request as any).user as { id: string; orgId?: string }

      const guard = checkCostGuard({ key: guardKey({ user }), maxPerHour: 20, maxPerDay: 100 })
      if (!guard.allowed) {
        return reply.code(429).send({ error: guard.reason })
      }

      const { permitResult, ...chainFields } = body
      const input: ChainInput = { ...chainFields, userId: user.id, orgId: user.orgId }

      try {
        const contractorResult = await runContractorBot(input, permitResult)
        return reply.code(200).send({ success: true, result: normalizeContractor(contractorResult) })
      } catch (err: any) {
        if (err instanceof ChainGateError) {
          return reply.code(422).send({
            error:        err.message,
            stage:        err.stage,
            parentRunId:  err.parentRunId,
            parentStatus: err.parentStatus,
          })
        }
        fastify.log.error({ err }, 'ContractorBot run failed')
        return reply.code(500).send({ error: sanitizeErrorMessage(err, 'ContractorBot run failed') })
      }
    }
  )

  /**
   * GET /bots/chain/runs/:projectId
   * List all chain runs (all three stages) for a given project.
   * Returns runs grouped by chainOrder.
   */
  fastify.get(
    '/chain/runs/:projectId',
    {
      preHandler: [
        authenticateUser,
        validateParams(projectIdParam),
      ],
    },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }

      // Attempt DB query — returns empty if Prisma not available
      let runs: unknown[] = []
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { PrismaClient } = require('@prisma/client')
        const prisma = new PrismaClient()
        runs = await prisma.keaBotRun.findMany({
          where:   { projectId },
          orderBy: [{ chainOrder: 'asc' }, { createdAt: 'desc' }],
          select: {
            id:               true,
            botType:          true,
            status:           true,
            chainOrder:       true,
            parentRunId:      true,
            modelUsed:        true,
            inputTokens:      true,
            outputTokens:     true,
            cacheMetrics:     true,
            estimatedCostUsd: true,
            durationMs:       true,
            startedAt:        true,
            completedAt:      true,
            errorMessage:     true,
          },
        })
        await prisma.$disconnect()
      } catch {
        // DB not available — return empty list
      }

      return reply.send({ projectId, runs, count: (runs as unknown[]).length })
    }
  )
}
