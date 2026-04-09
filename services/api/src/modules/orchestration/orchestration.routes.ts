/**
 * orchestration.routes.ts
 *
 * API routes for the Kealee LangGraph orchestration layer.
 *
 * POST /api/v1/orchestrate/run   — run orchestrator for a thread
 * GET  /api/v1/orchestrate/state/:threadId — get current thread state
 * POST /api/v1/orchestrate/webhook/purchase — Stripe purchase completion trigger
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'

const runInputSchema = z.object({
  threadId:          z.string().min(1),
  userId:            z.string().optional(),
  orgId:             z.string().optional(),
  role:              z.enum(["homeowner","land_owner","developer","contractor","architect","ops","admin","unknown"]).optional(),
  intent:            z.enum(["start_project","land_analysis","get_concept","get_estimate","get_permit","find_contractor","manage_construction","support_request","contractor_growth","developer_pipeline","browse","unknown"]).optional(),
  phase:             z.enum(["discovery","intake","product_selection","checkout","delivery","readiness_review","contractor_match","construction","closeout","support"]).optional(),
  projectId:         z.string().optional(),
  address:           z.string().optional(),
  projectType:       z.string().optional(),
  currentProductSku: z.string().optional(),
  paymentStatus:     z.enum(["none","pending","completed","failed","refunded"]).optional(),
  readiness:         z.record(z.boolean()).optional(),
  extra:             z.record(z.unknown()).optional(),
})

const purchaseWebhookSchema = z.object({
  stripeSessionId: z.string(),
  productSku:      z.string(),
  userId:          z.string().optional(),
  projectId:       z.string().optional(),
  threadId:        z.string().optional(),
  amount:          z.number().optional(),
  currency:        z.string().optional(),
})

export async function orchestrationRoutes(fastify: FastifyInstance) {
  // ── POST /run ────────────────────────────────────────────────────────────────
  fastify.post('/run', async (request, reply) => {
    try {
      const parsed = runInputSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({
          error: 'Invalid input',
          details: parsed.error.flatten(),
        })
      }

      // Dynamic import to avoid long startup time
      const { runOrchestrator } = await import('@kealee/ai-orchestrator')
      const result = await runOrchestrator(parsed.data as Parameters<typeof runOrchestrator>[0])

      fastify.log.info({
        event: 'orchestrator.run.completed',
        threadId: result.threadId,
        phase: result.phase,
        subgraph: result.activeSubgraph,
      })

      return reply.send({ ok: true, result })
    } catch (error: unknown) {
      fastify.log.error({ error, event: 'orchestrator.run.failed' })
      return reply.code(500).send({
        error: 'Orchestrator run failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // ── GET /state/:threadId ──────────────────────────────────────────────────────
  fastify.get('/state/:threadId', async (request, reply) => {
    try {
      const { threadId } = request.params as { threadId: string }
      const { supervisorGraph } = await import('@kealee/ai-orchestrator')
      const state = await supervisorGraph.getState({ configurable: { thread_id: threadId } })
      return reply.send({ ok: true, state: state.values })
    } catch (error: unknown) {
      fastify.log.error({ error, event: 'orchestrator.state.failed' })
      return reply.code(500).send({ error: 'Failed to retrieve thread state' })
    }
  })

  // ── POST /webhook/purchase ────────────────────────────────────────────────────
  // Called internally after Stripe checkout.session.completed webhook is processed
  fastify.post('/webhook/purchase', {
    config: { allowInternalOnly: true },
  }, async (request, reply) => {
    try {
      const parsed = purchaseWebhookSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Invalid payload' })
      }

      const { stripeSessionId, productSku, userId, projectId, threadId, amount, currency } = parsed.data
      const tid = threadId ?? `stripe_${stripeSessionId}`

      const { runOrchestrator, emitEvent, buildEvent } = await import('@kealee/ai-orchestrator')

      // Emit purchase event
      await emitEvent(buildEvent('orchestrator.purchase.completed', tid, {
        productSku,
        stripeSessionId,
        amount,
        currency,
      }, { userId, projectId }))

      // Resume orchestrator in delivery phase
      const result = await runOrchestrator({
        threadId: tid,
        userId,
        projectId,
        currentProductSku: productSku as Parameters<typeof runOrchestrator>[0]['currentProductSku'],
        paymentStatus: 'completed',
        phase: 'delivery',
        extra: { purchasedProducts: [productSku] },
      })

      fastify.log.info({
        event: 'orchestrator.purchase.activated',
        threadId: tid,
        productSku,
        phase: result.phase,
      })

      return reply.send({ ok: true, threadId: tid, result })
    } catch (error: unknown) {
      fastify.log.error({ error, event: 'orchestrator.purchase.activation.failed' })
      return reply.code(500).send({ error: 'Purchase activation failed' })
    }
  })

  // ── POST /readiness/:projectId ────────────────────────────────────────────────
  fastify.get('/readiness/:projectId', async (request, reply) => {
    try {
      const { projectId } = request.params as { projectId: string }
      const { detectBlockers, deriveContractorReadiness, PRODUCT_CATALOG } = await import('@kealee/ai-orchestrator')

      // Build a minimal state to evaluate readiness
      // In production this would load from DB
      const minimalState = {
        projectId,
        blockers: [] as string[],
        readiness: {
          landReady: false, conceptReady: false, estimateReady: false,
          permitReady: false, contractorReady: false, constructionReady: false, payoutReady: false,
        },
        role: 'homeowner' as const,
        intent: 'unknown' as const,
        phase: 'discovery' as const,
        purchasedProducts: [] as string[],
        upsellCandidates: [],
        risks: [] as string[],
        toolResults: [],
        messages: [],
        stylePreferences: [],
        uploadedAssets: [],
      }

      return reply.send({ ok: true, projectId, readiness: minimalState.readiness, blockers: [] })
    } catch (error: unknown) {
      fastify.log.error({ error })
      return reply.code(500).send({ error: 'Failed to get readiness state' })
    }
  })
}
