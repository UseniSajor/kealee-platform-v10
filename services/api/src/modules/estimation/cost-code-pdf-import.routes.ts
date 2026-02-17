/**
 * Cost Code PDF Import Routes
 * Upload a PDF cost book, process it with AI, and import structured data.
 *
 * Routes:
 *  POST   /pdf/upload         — Upload PDF and start import job
 *  GET    /pdf/jobs            — List import jobs for the current user
 *  GET    /pdf/jobs/:id        — Get single import job status
 *  DELETE /pdf/jobs/:id        — Cancel / delete an import job
 *  GET    /databases/:id       — Get a cost database with item counts
 *  GET    /databases/:id/items — Get paginated items for a cost database
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../../middleware/auth.middleware'
import { validateQuery } from '../../middleware/validation.middleware'
import { prisma } from '@kealee/database'
import {
  processImportJob,
} from '../../services/cost-code-import.service'

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function costCodePdfImportRoutes(fastify: FastifyInstance) {
  // Require auth on all routes
  fastify.addHook('onRequest', async (request, reply) => {
    await authenticateUser(request, reply)
  })

  // ========================================================================
  // POST /pdf/upload — Upload a PDF and kick off the import pipeline
  // ========================================================================

  fastify.post('/pdf/upload', async (request, reply) => {
    try {
      const data = await request.file()
      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' })
      }

      // Validate file type
      const fileName = data.filename || 'upload.pdf'
      if (!fileName.toLowerCase().endsWith('.pdf')) {
        return reply.code(400).send({ error: 'Only PDF files are supported' })
      }

      // Collect multipart fields
      const fields: Record<string, string> = {}
      if (data.fields) {
        for (const [key, field] of Object.entries(data.fields)) {
          if (field && typeof field === 'object' && 'value' in field) {
            fields[key] = (field as any).value
          }
        }
      }

      const costDatabaseId = fields.costDatabaseId || undefined
      const dbName = fields.name || undefined

      // Read file buffer
      const chunks: Buffer[] = []
      for await (const chunk of data.file) {
        chunks.push(chunk)
      }
      const pdfBuffer = Buffer.concat(chunks)

      // Validate file size (50MB max)
      if (pdfBuffer.length > 50 * 1024 * 1024) {
        return reply.code(400).send({ error: 'File size must be less than 50MB' })
      }

      // Get authenticated user
      const user = (request as any).user
      const userId = user?.id
      if (!userId) {
        return reply.code(401).send({ error: 'User not authenticated' })
      }

      // If a database name was given but no ID, create one now
      let finalDbId = costDatabaseId
      if (!finalDbId && dbName) {
        const db = await (prisma as any).costDatabase.create({
          data: {
            name: dbName,
            region: fields.region || 'National',
            type: 'IMPORTED',
            version: new Date().toISOString().split('T')[0],
            source: `PDF Import: ${fileName}`,
          },
        })
        finalDbId = db.id
      }

      // Create import job record
      const job = await (prisma as any).costCodeImportJob.create({
        data: {
          userId,
          costDatabaseId: finalDbId || undefined,
          fileName,
          fileSize: pdfBuffer.length,
          mimeType: 'application/pdf',
          status: 'PENDING',
          progress: 0,
        },
      })

      // Start processing in background (non-blocking)
      processImportJob(job.id, pdfBuffer).catch((err: any) => {
        fastify.log.error(err, `Background import job ${job.id} failed`)
      })

      return reply.code(201).send({
        success: true,
        data: {
          jobId: job.id,
          status: 'PENDING',
          fileName,
          fileSize: pdfBuffer.length,
          costDatabaseId: finalDbId || null,
        },
      })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: error.message || 'Failed to start PDF import' })
    }
  })

  // ========================================================================
  // GET /pdf/jobs — List import jobs for current user
  // ========================================================================

  fastify.get(
    '/pdf/jobs',
    {
      preHandler: [
        validateQuery(
          z.object({
            page: z.string().optional(),
            limit: z.string().optional(),
            status: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const query = request.query as { page?: string; limit?: string; status?: string }
        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20', 10)))
        const skip = (page - 1) * limit

        const where: any = { userId: user.id }
        if (query.status) where.status = query.status.toUpperCase()

        const [jobs, total] = await Promise.all([
          (prisma as any).costCodeImportJob.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              fileName: true,
              fileSize: true,
              status: true,
              progress: true,
              totalPages: true,
              materialsFound: true,
              laborRatesFound: true,
              equipmentFound: true,
              assembliesFound: true,
              totalImported: true,
              totalSkipped: true,
              errors: true,
              costDatabaseId: true,
              startedAt: true,
              completedAt: true,
              createdAt: true,
            },
          }),
          (prisma as any).costCodeImportJob.count({ where }),
        ])

        return reply.send({
          data: jobs,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list import jobs' })
      }
    }
  )

  // ========================================================================
  // GET /pdf/jobs/:id — Get single import job status
  // ========================================================================

  fastify.get('/pdf/jobs/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const user = (request as any).user

      const job = await (prisma as any).costCodeImportJob.findFirst({
        where: { id, userId: user.id },
      })

      if (!job) {
        return reply.code(404).send({ error: 'Import job not found' })
      }

      return reply.send({ data: job })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: error.message || 'Failed to get import job' })
    }
  })

  // ========================================================================
  // DELETE /pdf/jobs/:id — Delete an import job
  // ========================================================================

  fastify.delete('/pdf/jobs/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const user = (request as any).user

      const job = await (prisma as any).costCodeImportJob.findFirst({
        where: { id, userId: user.id },
      })

      if (!job) {
        return reply.code(404).send({ error: 'Import job not found' })
      }

      await (prisma as any).costCodeImportJob.delete({ where: { id } })

      return reply.send({ success: true })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: error.message || 'Failed to delete import job' })
    }
  })

  // ========================================================================
  // GET /databases/:id — Get cost database detail with counts
  // ========================================================================

  fastify.get('/databases/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const db = await (prisma as any).costDatabase.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              materials: true,
              laborRates: true,
              equipmentRates: true,
              assemblies: true,
            },
          },
        },
      })

      if (!db) {
        return reply.code(404).send({ error: 'Cost database not found' })
      }

      return reply.send({ data: db })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: error.message || 'Failed to get cost database' })
    }
  })

  // ========================================================================
  // GET /databases/:id/items — Paginated items from a cost database
  // ========================================================================

  fastify.get(
    '/databases/:id/items',
    {
      preHandler: [
        validateQuery(
          z.object({
            type: z.string().optional(), // materials | labor | equipment | assemblies
            search: z.string().optional(),
            page: z.string().optional(),
            limit: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const query = request.query as {
          type?: string; search?: string; page?: string; limit?: string
        }

        const page = Math.max(1, parseInt(query.page || '1', 10))
        const limit = Math.min(100, Math.max(1, parseInt(query.limit || '50', 10)))
        const skip = (page - 1) * limit
        const type = query.type || 'materials'
        const search = query.search || ''

        let items: any[] = []
        let total = 0

        switch (type) {
          case 'materials': {
            const where: any = { costDatabaseId: id }
            if (search) {
              where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { csiCode: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ]
            }
            ;[items, total] = await Promise.all([
              (prisma as any).materialCost.findMany({
                where, skip, take: limit,
                orderBy: { csiCode: 'asc' },
              }),
              (prisma as any).materialCost.count({ where }),
            ])
            break
          }
          case 'labor': {
            const where: any = { costDatabaseId: id }
            if (search) {
              where.OR = [
                { trade: { contains: search, mode: 'insensitive' } },
                { classification: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ]
            }
            ;[items, total] = await Promise.all([
              (prisma as any).laborRate.findMany({
                where, skip, take: limit,
                orderBy: { trade: 'asc' },
              }),
              (prisma as any).laborRate.count({ where }),
            ])
            break
          }
          case 'equipment': {
            const where: any = { costDatabaseId: id }
            if (search) {
              where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ]
            }
            ;[items, total] = await Promise.all([
              (prisma as any).equipmentRate.findMany({
                where, skip, take: limit,
                orderBy: { name: 'asc' },
              }),
              (prisma as any).equipmentRate.count({ where }),
            ])
            break
          }
          case 'assemblies': {
            const where: any = { costDatabaseId: id }
            if (search) {
              where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { csiCode: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ]
            }
            ;[items, total] = await Promise.all([
              (prisma as any).assembly.findMany({
                where, skip, take: limit,
                orderBy: { name: 'asc' },
              }),
              (prisma as any).assembly.count({ where }),
            ])
            break
          }
          default:
            return reply.code(400).send({ error: 'Invalid type. Use: materials, labor, equipment, assemblies' })
        }

        return reply.send({
          data: items,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to get database items' })
      }
    }
  )
}
