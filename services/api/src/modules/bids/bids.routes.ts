import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { bidsService } from './bids.service'
import { bidsRAGService } from './bids-rag.service'
import { authenticateUser } from '../../middleware/auth.middleware'
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware'
import {
  createOpportunityBidSchema,
  updateOpportunityBidSchema,
  listBidsQuerySchema,
} from './bids.types'

export async function opportunityBidsRoutes(fastify: FastifyInstance) {
  // GET /api/bids/opportunities - List opportunity bids
  fastify.get(
    '/opportunities',
    {
      preHandler: [authenticateUser, validateQuery(listBidsQuerySchema)],
    },
    async (request, reply) => {
      try {
        const query = request.query as any
        const result = await bidsService.list(query)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )

  // GET /api/bids/opportunities/pipeline - Get Kanban view
  // NOTE: Must be registered before /:id to avoid matching "pipeline" as an id
  fastify.get(
    '/opportunities/pipeline',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const pipeline = await bidsService.getPipeline()
        return reply.send({ pipeline })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )

  // GET /api/bids/opportunities/:id - Get single bid
  fastify.get(
    '/opportunities/:id',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const bid = await bidsService.getById(id)
        return reply.send({ bid })
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.message.includes('not found') ? 404 : 400
        return reply.code(code).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )

  // POST /api/bids/opportunities - Create new opportunity
  fastify.post(
    '/opportunities',
    {
      preHandler: [authenticateUser, validateBody(createOpportunityBidSchema)],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const body = request.body as any
        const bid = await bidsService.create(body, user?.id)
        return reply.code(201).send({ bid })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )

  // PATCH /api/bids/opportunities/:id - Update bid
  fastify.patch(
    '/opportunities/:id',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string() })),
        validateBody(updateOpportunityBidSchema),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const body = request.body as any
        const bid = await bidsService.update(id, body, user?.id)
        return reply.send({ bid })
      } catch (error: any) {
        fastify.log.error(error)
        const code = error.message.includes('not found') ? 404 : 400
        return reply.code(code).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )

  // POST /api/bids/opportunities/:id/proposal - Generate proposal
  fastify.post(
    '/opportunities/:id/proposal',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const result = await bidsService.generateProposal(id, user?.id)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )

  // POST /api/bids/scan - Trigger manual bid scan
  fastify.post(
    '/scan',
    {
      preHandler: [authenticateUser],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const result = await bidsService.scanForBids(user?.id)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )

  // POST /api/bids/opportunities/:id/documents - Add document
  fastify.post(
    '/opportunities/:id/documents',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string() })),
        validateBody(z.object({
          name: z.string(),
          fileUrl: z.string().url(),
          category: z.string().optional(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const body = request.body as any
        const document = await bidsService.addDocument(id, body, user?.id)
        return reply.code(201).send({ document })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )

  // POST /api/bids/opportunities/:id/subquotes - Add subcontractor quote
  fastify.post(
    '/opportunities/:id/subquotes',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ id: z.string() })),
        validateBody(z.object({
          subName: z.string(),
          trade: z.string(),
          quoteAmount: z.number(),
          notes: z.string().optional(),
        })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { id } = request.params as { id: string }
        const body = request.body as any
        const quote = await bidsService.addSubQuote(id, body, user?.id)
        return reply.code(201).send({ quote })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )

  // PATCH /api/bids/checklist/:itemId - Update checklist item
  fastify.patch(
    '/checklist/:itemId',
    {
      preHandler: [
        authenticateUser,
        validateParams(z.object({ itemId: z.string() })),
        validateBody(z.object({ completed: z.boolean() })),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const { itemId } = request.params as { itemId: string }
        const { completed } = request.body as any
        const item = await bidsService.updateChecklistItem(itemId, completed, user?.id)
        return reply.send({ item })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )

  // ═══════════════════════════════════════════════════════════════
  // RAG / AI Intelligence Routes (Phase 3)
  // ═══════════════════════════════════════════════════════════════

  // POST /api/bids/opportunities/:id/embed - Generate embedding
  fastify.post(
    '/opportunities/:id/embed',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const result = await bidsRAGService.generateEmbedding(id)
        return reply.send(result)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )

  // GET /api/bids/opportunities/:id/similar - Find similar bids
  fastify.get(
    '/opportunities/:id/similar',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const similar = await bidsRAGService.findSimilarBids(id)
        return reply.send({ similar })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )

  // GET /api/bids/opportunities/:id/insights - Get AI insights
  fastify.get(
    '/opportunities/:id/insights',
    {
      preHandler: [authenticateUser, validateParams(z.object({ id: z.string() }))],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const insights = await bidsRAGService.getAIInsights(id)
        return reply.send(insights)
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(400).send({ error: sanitizeErrorMessage(error)})
      }
    }
  )
}
