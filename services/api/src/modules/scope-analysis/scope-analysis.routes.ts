/**
 * Scope Analysis Routes
 *
 * Registered under /api/v1/scope-analysis
 *
 * Routes:
 *   POST /api/v1/scope-analysis/analyze          — Public scope analysis from description
 *   POST /api/v1/scope-analysis/analyze-detailed  — Auth required, persists to QuickEstimate
 *   POST /api/v1/scope-analysis/refine            — Auth required, refine with user answers
 *   GET  /api/v1/scope-analysis/project-types     — Public, list available project types
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../auth/auth.middleware'
import { validateBody } from '../../middleware/validation.middleware'
import { cacheMiddleware, CACHE_TTL } from '../../middleware/cache.middleware'
import { prismaAny } from '../../utils/prisma-helper'
import { ScopeAnalyzer, getProjectTypes } from '@kealee/estimating'

// Shared service instance
const scopeAnalyzer = new ScopeAnalyzer(prismaAny)

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const analyzeSchema = z.object({
  description: z.string().min(10).max(5000),
  projectType: z.string().optional(),
  sqft: z.number().min(10).max(100000).optional(),
  address: z.string().optional(),
  qualityTier: z.enum(['low', 'mid', 'high']).optional(),
  photoDescriptions: z.array(z.string()).optional(),
})

const analyzeDetailedSchema = z.object({
  description: z.string().min(10).max(5000),
  projectType: z.string().optional(),
  sqft: z.number().min(10).max(100000).optional(),
  address: z.string().optional(),
  qualityTier: z.enum(['low', 'mid', 'high']).optional(),
  photoDescriptions: z.array(z.string()).optional(),
  leadId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
})

const refineSchema = z.object({
  analysisId: z.string().uuid(),
  answers: z.record(z.string(), z.string()),
  additionalContext: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Route plugin
// ---------------------------------------------------------------------------

export async function scopeAnalysisRoutes(fastify: FastifyInstance) {
  // --- POST /analyze -------------------------------------------------------
  // Public endpoint — analyzes a project description and returns scope breakdown
  fastify.post(
    '/analyze',
    { preHandler: [validateBody(analyzeSchema)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as z.infer<typeof analyzeSchema>

      try {
        const result = await scopeAnalyzer.analyzeScope({
          description: body.description,
          projectType: body.projectType,
          sqft: body.sqft,
          address: body.address,
          qualityTier: body.qualityTier,
          photoDescriptions: body.photoDescriptions,
        })

        return reply.send(result)
      } catch (err: any) {
        fastify.log.error(err)
        return reply.code(500).send({ error: err.message || 'Failed to analyze scope' })
      }
    }
  )

  // --- POST /analyze-detailed ----------------------------------------------
  // Auth required — runs scope analysis and persists result to QuickEstimate
  fastify.post(
    '/analyze-detailed',
    { preHandler: [authenticateUser, validateBody(analyzeDetailedSchema)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user
      const body = request.body as z.infer<typeof analyzeDetailedSchema>

      try {
        const result = await scopeAnalyzer.analyzeScope({
          description: body.description,
          projectType: body.projectType,
          sqft: body.sqft,
          address: body.address,
          qualityTier: body.qualityTier,
          photoDescriptions: body.photoDescriptions,
        })

        // Calculate cost breakdown from line items
        const materialTotal = result.lineItems.reduce((sum, item) => sum + item.materialCost, 0)
        const laborTotal = result.lineItems.reduce((sum, item) => sum + item.laborCost, 0)
        const subtotal = result.lineItems.reduce((sum, item) => sum + item.totalCost, 0)
        const overhead = subtotal * (result.pricingMeta.overheadPercent / 100)
        const profit = subtotal * (result.pricingMeta.profitPercent / 100)
        const contingency = subtotal * (result.pricingMeta.contingencyPercent / 100)

        // Persist the analysis as a QuickEstimate record
        const estimate = await prismaAny.quickEstimate.create({
          data: {
            projectId: body.projectId ?? null,
            leadId: body.leadId ?? null,
            createdBy: user.userId || user.id,
            projectType: result.projectType,
            sqft: result.pricingMeta.sqft,
            location: result.pricingMeta.location,
            qualityTier: result.pricingMeta.qualityTier,
            description: body.description,
            materialTotal: materialTotal,
            laborTotal: laborTotal,
            subtotal: subtotal,
            overhead: overhead,
            profit: profit,
            contingency: contingency,
            grandTotal: result.estimatedTotal,
            priceLow: result.priceRange.low,
            priceMid: result.priceRange.mid,
            priceHigh: result.priceRange.high,
            breakdown: result.lineItems,
            assumptions: {
              assumptions: result.assumptions,
              questions: result.clarifyingQuestions,
              summary: result.summary,
              trades: result.tradesRequired,
              duration: result.estimatedDuration,
              confidence: result.confidence,
            },
          },
        })

        // Optionally update the Lead with suggested pricing
        if (body.leadId) {
          await prismaAny.lead.update({
            where: { id: body.leadId },
            data: {
              suggestedPrice: result.estimatedTotal,
              priceRange: result.priceRange,
              projectType: result.projectType,
              sqft: result.pricingMeta.sqft,
              qualityTier: result.pricingMeta.qualityTier,
            },
          }).catch(() => {})
        }

        return reply.code(201).send({ estimate, analysis: result })
      } catch (err: any) {
        fastify.log.error(err)
        return reply.code(400).send({ error: err.message || 'Failed to create detailed analysis' })
      }
    }
  )

  // --- POST /refine --------------------------------------------------------
  // Auth required — refines an existing estimate with user answers
  fastify.post(
    '/refine',
    { preHandler: [authenticateUser, validateBody(refineSchema)] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as z.infer<typeof refineSchema>

      try {
        // Load the original QuickEstimate
        const existing = await prismaAny.quickEstimate.findUnique({
          where: { id: body.analysisId },
        })

        if (!existing) {
          return reply.code(404).send({ error: 'Analysis not found' })
        }

        // Rebuild the ScopeAnalysisResult from stored data
        const assumptions = existing.assumptions as any
        const originalAnalysis = {
          projectType: existing.projectType,
          projectTypeName: existing.projectType,
          summary: assumptions?.summary ?? '',
          estimatedTotal: Number(existing.grandTotal),
          priceRange: {
            low: Number(existing.priceLow),
            mid: Number(existing.priceMid),
            high: Number(existing.priceHigh),
          },
          lineItems: existing.breakdown as any[] ?? [],
          assumptions: assumptions?.assumptions ?? [],
          clarifyingQuestions: assumptions?.questions ?? [],
          estimatedDuration: assumptions?.duration ?? 5,
          tradesRequired: assumptions?.trades ?? [],
          pricingMeta: {
            qualityTier: existing.qualityTier ?? 'mid',
            location: existing.location ?? 'Baltimore',
            sqft: Number(existing.sqft) || 1000,
            overheadPercent: 12,
            profitPercent: 15,
            contingencyPercent: 7,
            regionMultiplier: 1.0,
          },
          confidence: assumptions?.confidence ?? 50,
          aiModelUsed: 'claude-sonnet-4-20250514',
        }

        // Run refinement with user answers
        const refined = await scopeAnalyzer.refineEstimate({
          originalAnalysis,
          answers: body.answers,
          additionalContext: body.additionalContext,
        })

        return reply.send(refined)
      } catch (err: any) {
        fastify.log.error(err)
        return reply.code(400).send({ error: err.message || 'Failed to refine estimate' })
      }
    }
  )

  // --- GET /project-types --------------------------------------------------
  // Public endpoint — returns available project types (cached 1hr — rarely changes)
  fastify.get(
    '/project-types',
    { preHandler: [cacheMiddleware({ ttl: CACHE_TTL.PROJECT_TYPES, key: () => 'project-types' })] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const projectTypes = getProjectTypes()
        return reply.send({ projectTypes })
      } catch (err: any) {
        fastify.log.error(err)
        return reply.code(500).send({ error: err.message || 'Failed to fetch project types' })
      }
    }
  )
}
