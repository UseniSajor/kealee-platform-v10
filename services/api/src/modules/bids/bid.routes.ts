import { FastifyInstance } from 'fastify'
import { bidService } from './bid.service'
import { analyzeBid, generateBidStrategy } from './bid-analysis.service'
import { uploadBidDocument, processBidDocument, listBidDocuments } from './bid-document.service'

export async function bidRoutes(fastify: FastifyInstance) {

  // ── Static routes MUST come before /:id ─────────────────────────────────

  // GET /bids — List all bids with filters
  fastify.get('/', async (request, reply) => {
    const query = request.query as {
      status?: string
      priority?: string
      source?: string
      search?: string
      dueBefore?: string
      dueAfter?: string
      sortBy?: string
      sortOrder?: string
      page?: string
      limit?: string
    }

    const result = await bidService.listBids({
      ...query,
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
    })

    return reply.send(result)
  })

  // GET /bids/pipeline — Dashboard summary
  fastify.get('/pipeline', async (_request, reply) => {
    const result = await bidService.getPipeline()
    return reply.send(result)
  })

  // GET /bids/alerts — Deadline notifications
  fastify.get('/alerts', async (_request, reply) => {
    const result = await bidService.getAlerts()
    return reply.send(result)
  })

  // GET /bids/scan — n8n/KeaBot scan commands
  fastify.get('/scan', async (_request, reply) => {
    const result = bidService.getScanCommands()
    return reply.send(result)
  })

  // ── Param routes ────────────────────────────────────────────────────────

  // GET /bids/:id — Full bid details
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const bid = await bidService.getBid(id)
    return reply.send(bid)
  })

  // POST /bids — Create a new bid
  fastify.post('/', async (request, reply) => {
    const data = request.body as {
      projectName: string
      source?: string
      sourceId?: string
      sourceUrl?: string
      projectNumber?: string
      description?: string
      scope?: string
      location?: string
      county?: string
      state?: string
      ownerName?: string
      gcName?: string
      contactName?: string
      contactEmail?: string
      contactPhone?: string
      estimatedValue?: number
      dueDate?: string
      prebidDate?: string
      prebidLocation?: string
      prebidMandatory?: boolean
      awardDate?: string
      startDate?: string
      isGovernment?: boolean
      isFederal?: boolean
      requiresMBE?: boolean
      requiresDBE?: boolean
      mbeGoalPercent?: number
      dbeGoalPercent?: number
      prevailingWage?: boolean
      bondRequired?: boolean
      notes?: string
      assignedTo?: string
      organizationId?: string
    }

    if (!data.projectName) {
      return reply.code(400).send({ error: 'projectName is required' })
    }

    const bid = await bidService.createBid(data)
    return reply.code(201).send(bid)
  })

  // PATCH /bids/:id — Update a bid
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = request.body as Record<string, any>
    const bid = await bidService.updateBid(id, data)
    return reply.send(bid)
  })

  // POST /bids/:id/activity — Log activity
  fastify.post('/:id/activity', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { action, actor, details } = request.body as {
      action: string
      actor?: string
      details?: any
    }

    if (!action) {
      return reply.code(400).send({ error: 'action is required' })
    }

    const activity = await bidService.logActivity(id, action, actor, details)
    return reply.code(201).send(activity)
  })

  // PATCH /bids/:id/checklist/:step — Update checklist item
  fastify.patch('/:id/checklist/:step', async (request, reply) => {
    const { id, step } = request.params as { id: string; step: string }
    const { status, notes } = request.body as { status: string; notes?: string }

    if (!status) {
      return reply.code(400).send({ error: 'status is required' })
    }

    const item = await bidService.updateChecklistItem(id, parseInt(step), status, notes)
    return reply.send(item)
  })

  // POST /bids/:id/evaluate — Score a bid
  fastify.post('/:id/evaluate', async (request, reply) => {
    const { id } = request.params as { id: string }
    const result = await bidService.evaluateBid(id)
    return reply.send(result)
  })

  // POST /bids/:id/proposal — Generate proposal
  fastify.post('/:id/proposal', async (request, reply) => {
    const { id } = request.params as { id: string }
    const result = await bidService.generateProposal(id)
    return reply.send(result)
  })

  // POST /bids/:id/sub-request — Create sub-request
  fastify.post('/:id/sub-request', async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = request.body as {
      subName: string
      trade: string
      contactName?: string
      contactEmail?: string
      contactPhone?: string
      requestedAmount?: number
      dueDate?: string
      notes?: string
    }

    if (!data.subName || !data.trade) {
      return reply.code(400).send({ error: 'subName and trade are required' })
    }

    const subRequest = await bidService.createSubRequest(id, data)
    return reply.code(201).send(subRequest)
  })

  // ── AI Analysis & Strategy ────────────────────────────────────────────────

  // POST /bids/:id/analyze — AI bid analysis
  fastify.post('/:id/analyze', async (request, reply) => {
    const { id } = request.params as { id: string }
    const result = await analyzeBid(id)
    return reply.send(result)
  })

  // POST /bids/:id/strategy — AI strategy generation
  fastify.post('/:id/strategy', async (request, reply) => {
    const { id } = request.params as { id: string }
    const result = await generateBidStrategy(id)
    return reply.send(result)
  })

  // ── Document Management ───────────────────────────────────────────────────

  // GET /bids/:id/documents — List bid documents
  fastify.get('/:id/documents', async (request, reply) => {
    const { id } = request.params as { id: string }
    const documents = await listBidDocuments(id)
    return reply.send(documents)
  })

  // POST /bids/:id/documents/upload — Upload a document (multipart)
  fastify.post('/:id/documents/upload', async (request, reply) => {
    const { id } = request.params as { id: string }

    let fileBuffer: Buffer | null = null
    let filename = 'upload'
    let mimeType = 'application/octet-stream'
    let type = 'OTHER'
    let notes = ''

    const parts = request.parts()
    for await (const part of parts) {
      if (part.type === 'file') {
        fileBuffer = await part.toBuffer()
        filename = part.filename || 'upload'
        mimeType = part.mimetype || 'application/octet-stream'
      } else {
        // field
        const value = part.value as string
        if (part.fieldname === 'type') type = value
        if (part.fieldname === 'notes') notes = value
      }
    }

    if (!fileBuffer) {
      return reply.code(400).send({ error: 'No file uploaded' })
    }

    const doc = await uploadBidDocument({
      bidId: id,
      file: fileBuffer,
      filename,
      mimeType,
      type,
      notes,
    })

    return reply.code(201).send(doc)
  })

  // POST /bids/:id/documents/:docId/process — AI document processing
  fastify.post('/:id/documents/:docId/process', async (request, reply) => {
    const { id, docId } = request.params as { id: string; docId: string }
    const result = await processBidDocument(id, docId)
    return reply.send(result)
  })
}
