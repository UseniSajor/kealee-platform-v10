import { FastifyInstance } from 'fastify'
import { bidService } from './bid.service'
import { parseEmail, ingestEmail, checkDuplicate } from './bid-ingest.service'
import { sendDailyAlerts } from './bid-notify.service'

export async function bidAutomationRoutes(fastify: FastifyInstance) {

  // ── POST /ingest/email — Parse raw email and create bid ───────────────────

  fastify.post('/ingest/email', async (request, reply) => {
    const email = request.body as {
      from: string
      subject: string
      body: string
      receivedAt?: string
      messageId?: string
    }

    if (!email.from || !email.subject || !email.body) {
      return reply.code(400).send({ error: 'from, subject, and body are required' })
    }

    const result = await ingestEmail(email)
    const statusCode = result.action === 'created' ? 201 : result.action === 'error' ? 500 : 200
    return reply.code(statusCode).send(result)
  })

  // ── POST /ingest/webhook — Receive pre-parsed bid data from n8n ───────────

  fastify.post('/ingest/webhook', async (request, reply) => {
    const data = request.body as {
      projectName: string
      source?: string
      sourceId?: string
      [key: string]: any
    }

    if (!data.projectName) {
      return reply.code(400).send({ error: 'projectName is required' })
    }

    // Check for duplicates before creating
    const { isDuplicate, existingId } = await checkDuplicate({
      projectName: data.projectName,
      source: data.source || 'MANUAL',
      sourceId: data.sourceId,
      dueDate: data.dueDate,
    })

    if (isDuplicate) {
      return reply.send({
        success: true,
        action: 'skipped_duplicate',
        existingBidId: existingId,
      })
    }

    const bid = await bidService.createBid(data)
    return reply.code(201).send({
      success: true,
      action: 'created',
      bidId: bid.id,
      bid,
    })
  })

  // ── POST /ingest/batch — Batch import multiple bids ───────────────────────

  fastify.post('/ingest/batch', async (request, reply) => {
    const { bids } = request.body as { bids: any[] }

    if (!Array.isArray(bids) || bids.length === 0) {
      return reply.code(400).send({ error: 'bids array is required and must not be empty' })
    }

    const results = {
      total: bids.length,
      created: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[],
    }

    for (const bidData of bids) {
      try {
        if (!bidData.projectName) {
          results.errors++
          results.details.push({ projectName: bidData.projectName, action: 'error', error: 'projectName required' })
          continue
        }

        const { isDuplicate, existingId } = await checkDuplicate({
          projectName: bidData.projectName,
          source: bidData.source || 'MANUAL',
          sourceId: bidData.sourceId,
          dueDate: bidData.dueDate,
        })

        if (isDuplicate) {
          results.skipped++
          results.details.push({ projectName: bidData.projectName, action: 'skipped_duplicate', existingBidId: existingId })
          continue
        }

        const bid = await bidService.createBid(bidData)
        results.created++
        results.details.push({ projectName: bidData.projectName, action: 'created', bidId: bid.id })
      } catch (error: any) {
        results.errors++
        results.details.push({ projectName: bidData.projectName, action: 'error', error: error.message })
      }
    }

    return reply.send(results)
  })

  // ── POST /scan/notify — Trigger daily alert email ─────────────────────────

  fastify.post('/scan/notify', async (request, reply) => {
    const { recipientEmail } = (request.body as any) || {}
    const result = await sendDailyAlerts(recipientEmail)
    return reply.send(result)
  })

  // ── GET /scan/logs — List scan run history ────────────────────────────────

  fastify.get('/scan/logs', async (request, reply) => {
    const query = request.query as {
      source?: string
      status?: string
      page?: string
      limit?: string
    }

    const result = await bidService.listScanLogs({
      source: query.source,
      status: query.status,
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
    })

    return reply.send(result)
  })

  // ── GET /scan/logs/:id — Single scan run details ──────────────────────────

  fastify.get('/scan/logs/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const log = await bidService.getScanLog(id)
    return reply.send(log)
  })

  // ── POST /scan/start — Start a manual scan run ───────────────────────────

  fastify.post('/scan/start', async (request, reply) => {
    const { source, runType } = request.body as { source: string; runType?: string }

    if (!source) {
      return reply.code(400).send({ error: 'source is required' })
    }

    const log = await bidService.createScanLog(source, runType || 'MANUAL')
    return reply.code(201).send(log)
  })

  // ── POST /scan/complete — Complete a scan run with results ────────────────

  fastify.post('/scan/complete', async (request, reply) => {
    const { id, status, bidsFound, bidsCreated, bidsSkipped, errors, details } = request.body as {
      id: string
      status: string
      bidsFound?: number
      bidsCreated?: number
      bidsSkipped?: number
      errors?: any
      details?: any
    }

    if (!id || !status) {
      return reply.code(400).send({ error: 'id and status are required' })
    }

    const log = await bidService.completeScanLog(id, {
      status,
      bidsFound,
      bidsCreated,
      bidsSkipped,
      errors,
      details,
    })

    return reply.send(log)
  })
}
