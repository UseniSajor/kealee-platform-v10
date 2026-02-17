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

      // 3-Tier routing: determine target tier from request
      const requestedTier = (fields.tier || 'ORGANIZATION').toUpperCase()
      const validTiers = ['STANDARD', 'COMMUNITY', 'ORGANIZATION']
      const targetTier = validTiers.includes(requestedTier) ? requestedTier : 'ORGANIZATION'

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

      // ── Admin-only check for STANDARD tier ──────────────────────────
      // Only Kealee admin (super_admin, admin) can upload standard cost books
      const isAdminUpload = targetTier === 'STANDARD'
      if (isAdminUpload) {
        const userRole = user?.role?.toLowerCase() || ''
        const orgMember = user?.orgMember || null
        const memberRole = orgMember?.roleKey?.toLowerCase() || ''
        const isAdmin = ['admin', 'super_admin'].includes(userRole) ||
                        ['admin', 'super_admin'].includes(memberRole)
        if (!isAdmin) {
          return reply.code(403).send({
            error: 'Only Kealee administrators can upload standard cost books',
          })
        }
      }

      // Determine visibility and review status based on tier
      const tierConfig: Record<string, { visibility: string; reviewStatus: string; isStandard: boolean }> = {
        STANDARD:     { visibility: 'PUBLIC',        reviewStatus: 'APPROVED',        isStandard: true },
        COMMUNITY:    { visibility: 'AI_STAFF_ONLY', reviewStatus: 'PENDING_REVIEW',  isStandard: false },
        ORGANIZATION: { visibility: 'ORG_ONLY',      reviewStatus: 'DRAFT',           isStandard: false },
      }
      const config = tierConfig[targetTier] || tierConfig.ORGANIZATION

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
            tier: targetTier,
            visibility: config.visibility,
            reviewStatus: config.reviewStatus,
            isStandard: config.isStandard,
            submittedById: userId,
            tradeCategory: fields.tradeCategory || null,
            projectType: fields.projectType || null,
            methodology: fields.methodology || null,
            organizationId: targetTier === 'ORGANIZATION' ? (fields.organizationId || user?.orgId || null) : null,
          },
        })
        finalDbId = db.id
      }

      // Create import job record with tier routing
      const job = await (prisma as any).costCodeImportJob.create({
        data: {
          userId,
          costDatabaseId: finalDbId || undefined,
          fileName,
          fileSize: pdfBuffer.length,
          mimeType: 'application/pdf',
          status: 'PENDING',
          progress: 0,
          targetTier,
          isAdminUpload,
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
          tier: targetTier,
          visibility: config.visibility,
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

  // ========================================================================
  // GET /databases — List cost databases with tier-aware visibility
  // ========================================================================

  fastify.get(
    '/databases',
    {
      preHandler: [
        validateQuery(
          z.object({
            tier: z.string().optional(),
            visibility: z.string().optional(),
            tradeCategory: z.string().optional(),
            region: z.string().optional(),
            search: z.string().optional(),
          })
        ),
      ],
    },
    async (request, reply) => {
      try {
        const user = (request as any).user
        const userId = user?.id
        const userRole = user?.role?.toLowerCase() || ''
        const orgMember = user?.orgMember || null
        const memberRole = orgMember?.roleKey?.toLowerCase() || ''
        const userOrgId = orgMember?.orgId || user?.orgId || null
        const isAdmin = ['admin', 'super_admin'].includes(userRole) ||
                        ['admin', 'super_admin'].includes(memberRole)
        const isStaff = isAdmin || ['pm', 'pm_supervisor'].includes(memberRole)

        const query = request.query as {
          tier?: string; visibility?: string; tradeCategory?: string;
          region?: string; search?: string
        }

        // Build visibility-aware where clause
        const where: any = { isActive: true }

        // Tier-aware visibility rules:
        // - STANDARD (PUBLIC): visible to everyone
        // - COMMUNITY (AI_STAFF_ONLY): visible to admin/staff only
        // - ORGANIZATION (ORG_ONLY): visible only to the org that owns it
        // - Admin can see everything
        if (!isAdmin) {
          const visibilityOR: any[] = [
            { visibility: 'PUBLIC' },                                      // Standard books: everyone
            { visibility: 'ORG_ONLY', organizationId: userOrgId || '' },   // Org books: own org only
          ]
          if (isStaff) {
            visibilityOR.push({ visibility: 'AI_STAFF_ONLY' })            // Community books: staff only
          }
          where.OR = visibilityOR
        }

        // Optional filters
        if (query.tier) where.tier = query.tier.toUpperCase()
        if (query.tradeCategory) where.tradeCategory = { contains: query.tradeCategory, mode: 'insensitive' }
        if (query.region) where.region = { contains: query.region, mode: 'insensitive' }
        if (query.search) {
          where.AND = [
            ...(where.AND || []),
            {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
                { tradeCategory: { contains: query.search, mode: 'insensitive' } },
              ],
            },
          ]
        }

        // Only show APPROVED community data to non-admins
        if (!isAdmin && !query.tier) {
          where.AND = [
            ...(where.AND || []),
            {
              OR: [
                { tier: 'STANDARD' },
                { tier: 'ORGANIZATION' },
                { tier: 'COMMUNITY', reviewStatus: 'APPROVED' },
              ],
            },
          ]
        }

        const databases = await (prisma as any).costDatabase.findMany({
          where,
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
          orderBy: [
            { isStandard: 'desc' },  // Standard books first
            { tier: 'asc' },
            { name: 'asc' },
          ],
        })

        return reply.send({ data: databases })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to list cost databases' })
      }
    }
  )

  // ========================================================================
  // POST /databases/:id/submit-for-review — Submit community data for admin review
  // ========================================================================

  fastify.post('/databases/:id/submit-for-review', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const user = (request as any).user
      const userId = user?.id

      const db = await (prisma as any).costDatabase.findUnique({ where: { id } })
      if (!db) return reply.code(404).send({ error: 'Cost database not found' })

      // Only the submitter or an admin can submit for review
      if (db.submittedById !== userId) {
        return reply.code(403).send({ error: 'Only the original uploader can submit for review' })
      }

      if (db.tier !== 'COMMUNITY' && db.tier !== 'ORGANIZATION') {
        return reply.code(400).send({ error: 'Only community or organization databases can be submitted for review' })
      }

      const updated = await (prisma as any).costDatabase.update({
        where: { id },
        data: {
          tier: 'COMMUNITY',
          visibility: 'AI_STAFF_ONLY',
          reviewStatus: 'PENDING_REVIEW',
        },
      })

      // Create review record
      await (prisma as any).costDataReview.create({
        data: {
          costDatabaseId: id,
          reviewerId: userId,
          action: 'SUBMITTED',
          previousStatus: db.reviewStatus || 'DRAFT',
          newStatus: 'PENDING_REVIEW',
        },
      })

      return reply.send({ data: updated })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: error.message || 'Failed to submit for review' })
    }
  })

  // ========================================================================
  // POST /databases/:id/review — Admin approve/reject community data
  // ========================================================================

  fastify.post('/databases/:id/review', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const user = (request as any).user
      const userId = user?.id
      const userRole = user?.role?.toLowerCase() || ''
      const memberRole = user?.orgMember?.roleKey?.toLowerCase() || ''
      const isAdmin = ['admin', 'super_admin'].includes(userRole) ||
                      ['admin', 'super_admin'].includes(memberRole)

      if (!isAdmin) {
        return reply.code(403).send({ error: 'Only Kealee administrators can review cost data' })
      }

      const body = request.body as {
        action: string
        notes?: string
        dataQualityScore?: number
        completeness?: number
        accuracy?: number
      }

      const db = await (prisma as any).costDatabase.findUnique({ where: { id } })
      if (!db) return reply.code(404).send({ error: 'Cost database not found' })

      const actionMap: Record<string, string> = {
        approve: 'APPROVED',
        reject: 'REJECTED',
        request_changes: 'DRAFT',
        archive: 'ARCHIVED',
      }

      const newStatus = actionMap[body.action?.toLowerCase()]
      if (!newStatus) {
        return reply.code(400).send({ error: 'Invalid action. Use: approve, reject, request_changes, archive' })
      }

      const updated = await (prisma as any).costDatabase.update({
        where: { id },
        data: {
          reviewStatus: newStatus,
          reviewedById: userId,
          reviewedAt: new Date(),
          reviewNotes: body.notes || null,
        },
      })

      // Create review audit record
      await (prisma as any).costDataReview.create({
        data: {
          costDatabaseId: id,
          reviewerId: userId,
          action: body.action.toUpperCase(),
          previousStatus: db.reviewStatus || 'PENDING_REVIEW',
          newStatus,
          notes: body.notes || null,
          dataQualityScore: body.dataQualityScore || null,
          completeness: body.completeness || null,
          accuracy: body.accuracy || null,
        },
      })

      return reply.send({ data: updated })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: error.message || 'Failed to review cost data' })
    }
  })
}
