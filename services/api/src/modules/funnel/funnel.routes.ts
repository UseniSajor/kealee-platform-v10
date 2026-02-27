import { FastifyInstance } from 'fastify'
import { FunnelService } from './funnel.service'
import { createSessionSchema, updateSessionSchema, sessionIdParam } from './funnel.schemas'

/**
 * Funnel routes — Dynamic Page Generation marketing funnel
 * All endpoints are PUBLIC (no auth required)
 *
 * POST   /sessions                   — Create a new funnel session
 * PATCH  /sessions/:sessionId        — Update session step data
 * GET    /sessions/:sessionId        — Get session state
 * POST   /sessions/:sessionId/generate — Trigger AI page generation
 * GET    /sessions/:sessionId/progress — Poll generation progress
 * GET    /sessions/:sessionId/page    — Get generated page JSON
 */
export async function funnelRoutes(fastify: FastifyInstance) {
  const service = new FunnelService()

  // ─── POST /sessions ────────────────────────────────────────────
  fastify.post(
    '/sessions',
    {
      config: {
        rateLimit: { max: 10, timeWindow: '1 minute' },
      },
    },
    async (request, reply) => {
      try {
        const body = createSessionSchema.parse(request.body || {})

        const session = await service.createSession({
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
          utmSource: body.utmParams?.utm_source,
          utmMedium: body.utmParams?.utm_medium,
          utmCampaign: body.utmParams?.utm_campaign,
        })

        return reply.code(201).send({ id: session.id })
      } catch (err: any) {
        if (err.name === 'ZodError') {
          return reply.code(400).send({ error: 'Invalid request', details: err.errors })
        }
        request.log.error(err)
        return reply.code(500).send({ error: 'Failed to create session' })
      }
    }
  )

  // ─── PATCH /sessions/:sessionId ────────────────────────────────
  fastify.patch(
    '/sessions/:sessionId',
    {
      config: {
        rateLimit: { max: 30, timeWindow: '1 minute' },
      },
    },
    async (request, reply) => {
      try {
        const { sessionId } = sessionIdParam.parse(request.params)
        const data = updateSessionSchema.parse(request.body || {})

        const session = await service.updateSession(sessionId, data)
        return reply.send(session)
      } catch (err: any) {
        if (err.name === 'ZodError') {
          return reply.code(400).send({ error: 'Invalid request', details: err.errors })
        }
        request.log.error(err)
        return reply.code(500).send({ error: 'Failed to update session' })
      }
    }
  )

  // ─── GET /sessions/:sessionId ──────────────────────────────────
  fastify.get(
    '/sessions/:sessionId',
    {
      config: {
        rateLimit: { max: 30, timeWindow: '1 minute' },
      },
    },
    async (request, reply) => {
      try {
        const { sessionId } = sessionIdParam.parse(request.params)
        const session = await service.getSession(sessionId)

        if (!session) {
          return reply.code(404).send({ error: 'Session not found' })
        }

        return reply.send(session)
      } catch (err: any) {
        request.log.error(err)
        return reply.code(500).send({ error: 'Failed to get session' })
      }
    }
  )

  // ─── POST /sessions/:sessionId/generate ────────────────────────
  fastify.post(
    '/sessions/:sessionId/generate',
    {
      config: {
        rateLimit: { max: 2, timeWindow: '1 minute' },
      },
    },
    async (request, reply) => {
      try {
        const { sessionId } = sessionIdParam.parse(request.params)

        // Run generation inline (3-8 seconds is acceptable for MVP)
        const result = await service.generatePage(sessionId)
        return reply.send(result)
      } catch (err: any) {
        if (err.message?.includes('incomplete')) {
          return reply.code(400).send({ error: err.message })
        }
        if (err.message?.includes('not found')) {
          return reply.code(404).send({ error: 'Session not found' })
        }
        request.log.error(err)
        return reply.code(500).send({ error: 'Page generation failed' })
      }
    }
  )

  // ─── GET /sessions/:sessionId/progress ─────────────────────────
  fastify.get(
    '/sessions/:sessionId/progress',
    {
      config: {
        rateLimit: { max: 60, timeWindow: '1 minute' },
      },
    },
    async (request, reply) => {
      try {
        const { sessionId } = sessionIdParam.parse(request.params)
        const progress = await service.getProgress(sessionId)
        return reply.send({ progress })
      } catch (err: any) {
        return reply.send({ progress: 0 })
      }
    }
  )

  // ─── GET /sessions/:sessionId/page ─────────────────────────────
  fastify.get(
    '/sessions/:sessionId/page',
    {
      config: {
        rateLimit: { max: 30, timeWindow: '1 minute' },
      },
    },
    async (request, reply) => {
      try {
        const { sessionId } = sessionIdParam.parse(request.params)
        const page = await service.getPage(sessionId)

        if (!page) {
          return reply.code(404).send({ error: 'Page not ready' })
        }

        return reply.send(page)
      } catch (err: any) {
        request.log.error(err)
        return reply.code(500).send({ error: 'Failed to get page' })
      }
    }
  )
}
