/**
 * bots.routes.ts
 *
 * Fastify HTTP endpoints for KeaBots.
 *
 * Prefix (registered in index.ts): /bots
 *
 * Endpoints:
 *   GET  /bots                              — list all registered bots
 *   POST /bots/:botId/execute               — execute a bot (incl. marketing-bot)
 *   GET  /bots/executions                   — list recent traces (admin)
 *   GET  /bots/executions/:requestId        — get single trace
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { authenticateUser } from '../auth/auth.middleware'
import { requireAdmin } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import { botRegistry } from './bots.registry'
import { getRecentTraces, getTrace } from './bots.logger'
import { checkCostGuard } from './bots.router'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'
import type { BotId } from './bots.types'
import { BOT_IDS } from './bots.ids'
import { enqueueBotJob, getBotJob } from './bots.queue'
import { persistBotConversation } from './bots.conversations'

// ── Schemas ───────────────────────────────────────────────────────────────────

const botIdParam = z.object({
  botId: z.enum(BOT_IDS),
})

const executeBodySchema = z.object({
  data:    z.record(z.unknown()),
  options: z.object({
    tier:        z.enum(['fast', 'standard', 'premium']).optional(),
    model:       z.string().optional(),
    maxTokens:   z.number().int().min(128).max(8192).optional(),
    temperature: z.number().min(0).max(1).optional(),
  }).optional(),
})

const tracesQuerySchema = z.object({
  botId: z.enum(BOT_IDS).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

const traceIdParam = z.object({
  requestId: z.string().uuid(),
})
const executeQuerySchema = z.object({
  sync: z.preprocess(
    value => value === true || value === 'true',
    z.boolean(),
  ).default(false),
})
const jobIdParam = z.object({
  jobId: z.string().min(1),
})

// ── Routes ────────────────────────────────────────────────────────────────────

export async function botsRoutes(fastify: FastifyInstance) {

  /**
   * GET /bots
   * List all registered bots with metadata.
   * Public (no auth) — safe, no data exposed.
   */
  fastify.get('/', async (_request, reply) => {
    return reply.send({ bots: botRegistry.list() })
  })

  /**
   * POST /bots/:botId/execute
   *
   * Execute a bot with arbitrary input data.
   * Rate-limited per user/org (50 calls/hour, 500/day).
   *
   * Body: { data: Record<string,unknown>, options?: BotRunOptions }
   */
  fastify.post(
    '/:botId/execute',
    {
      preHandler: [
        authenticateUser,
        validateParams(botIdParam),
        validateBody(executeBodySchema),
        validateQuery(executeQuerySchema),
      ],
    },
    async (request, reply) => {
      const { botId }  = request.params as { botId: BotId }
      const body       = request.body   as z.infer<typeof executeBodySchema>
      const user       = (request as any).user as { id: string; orgId?: string }
      const { sync } = request.query as z.infer<typeof executeQuerySchema>

      // Cost guard
      const guardKey = user.orgId ?? user.id
      const guard    = checkCostGuard({ key: guardKey })
      if (!guard.allowed) {
        return reply.code(429).send({ error: guard.reason })
      }

      // Look up bot
      const bot = botRegistry.get(botId)
      if (!bot) {
        return reply.code(404).send({ error: `Bot '${botId}' not found` })
      }

      const requestId = randomUUID()

      if (!sync) {
        const queued = await enqueueBotJob(
          botId,
          { data: body.data as Record<string, unknown>, options: body.options },
          {
            userId: user.id,
            orgId: user.orgId,
            sessionId: typeof body.data.sessionId === 'string' ? body.data.sessionId : undefined,
          },
        )
        return reply.code(202).send({
          accepted: true,
          status: 'WAITING',
          ...queued,
        })
      }

      try {
        const context = {
          botId,
          requestId,
          userId: user.id,
          orgId: user.orgId,
          sessionId: typeof body.data.sessionId === 'string' ? body.data.sessionId : undefined,
        }
        const result = await bot.execute(
          { data: body.data as any, options: body.options },
          context,
        )
        await persistBotConversation(body.data, result, context)
        return reply.code(result.success ? 200 : 422).send(result)
      } catch (error: any) {
        fastify.log.error({ error, botId, requestId }, 'Bot execution failed')
        return reply.code(500).send({
          error: sanitizeErrorMessage(error, `Bot ${botId} execution failed`),
        })
      }
    }
  )

  fastify.get(
    '/jobs/:jobId',
    {
      preHandler: [
        authenticateUser,
        validateParams(jobIdParam),
      ],
    },
    async (request, reply) => {
      const { jobId } = request.params as { jobId: string }
      const job = await getBotJob(jobId)
      if (!job) return reply.code(404).send({ error: 'Job not found' })
      return reply.send(job)
    },
  )

  /**
   * GET /bots/executions
   * List recent bot execution traces (admin only).
   * Query: ?botId=lead-bot&limit=50
   */
  fastify.get(
    '/executions',
    {
      preHandler: [
        authenticateUser,
        requireAdmin,
        validateQuery(tracesQuerySchema),
      ],
    },
    async (request, reply) => {
      const { botId, limit } = request.query as z.infer<typeof tracesQuerySchema>
      const traces = await getRecentTraces(limit, botId as BotId | undefined)
      return reply.send({ traces, count: traces.length })
    }
  )

  /**
   * GET /bots/executions/:requestId
   * Get a single execution trace.
   */
  fastify.get(
    '/executions/:requestId',
    {
      preHandler: [
        authenticateUser,
        requireAdmin,
        validateParams(traceIdParam),
      ],
    },
    async (request, reply) => {
      const { requestId } = request.params as { requestId: string }
      const trace = await getTrace(requestId)
      if (!trace) {
        return reply.code(404).send({ error: 'Trace not found' })
      }
      return reply.send({ trace })
    }
  )
}
