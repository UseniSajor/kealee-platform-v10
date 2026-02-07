/**
 * Upload Routes
 * Handles file uploads for site photos, receipts, and documents.
 *
 * Registered under /api/v1/uploads
 *
 * Routes:
 *   POST /photo          — Single site photo upload
 *   POST /receipt        — Receipt upload (triggers OCR)
 *   POST /document       — Document upload (contract, permit, design, etc.)
 *   POST /photos/batch   — Batch photo upload (up to 20 files)
 *   GET  /project/:projectId/photos — List project photos
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticateUser, AuthenticatedRequest } from '../auth/auth.middleware'
import { prismaAny } from '../../utils/prisma-helper'
import { eventBus } from '../../events/event-bus'
import {
  uploadSitePhoto,
  uploadReceipt,
  uploadDocument,
  getProjectPhotos,
  processReceipt,
  type OnEvent,
  type AnalyzeImageFn,
} from '@kealee/storage'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Bridge the event bus to the @kealee/storage OnEvent callback */
const onEvent: OnEvent = (event, payload) => {
  try {
    eventBus.emit(event as any, payload as any)
  } catch (err) {
    console.error(`[uploads] Failed to emit event ${event}:`, err)
  }
}

/** Validate that the request file is an image */
function isImage(mimetype: string): boolean {
  return /^image\/(jpeg|png|gif|webp|heic|heif|avif)$/.test(mimetype)
}

/** Validate that the request file is an image or PDF */
function isImageOrPdf(mimetype: string): boolean {
  return isImage(mimetype) || mimetype === 'application/pdf'
}

/** Validate that the request file is a document */
function isDocumentType(mimetype: string): boolean {
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/acad',
    'application/dxf',
    'image/jpeg',
    'image/png',
  ]
  return allowed.includes(mimetype)
}

const MAX_PHOTO_SIZE = 20 * 1024 * 1024 // 20 MB
const MAX_RECEIPT_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024 // 50 MB
const MAX_BATCH_FILES = 20

// ---------------------------------------------------------------------------
// Route plugin
// ---------------------------------------------------------------------------

export async function uploadRoutes(fastify: FastifyInstance) {
  // ─── POST /photo ────────────────────────────────────────────────────
  fastify.post(
    '/photo',
    { preHandler: [authenticateUser] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user
      const data = await request.file()

      if (!data) {
        return reply.code(400).send({ error: 'No file provided' })
      }

      const buffer = await data.toBuffer()
      if (buffer.length > MAX_PHOTO_SIZE) {
        return reply.code(400).send({ error: 'File exceeds 20MB limit' })
      }

      if (!isImage(data.mimetype)) {
        return reply.code(400).send({ error: 'File must be an image (JPEG, PNG, WebP, GIF, HEIC)' })
      }

      // Parse form fields
      const fields = data.fields as Record<string, any>
      const projectId = getFieldValue(fields, 'projectId')
      const siteVisitId = getFieldValue(fields, 'siteVisitId')

      if (!projectId) {
        return reply.code(400).send({ error: 'projectId is required' })
      }

      try {
        const result = await uploadSitePhoto(
          {
            projectId,
            siteVisitId: siteVisitId || undefined,
            file: buffer,
            filename: data.filename,
            uploadedBy: user.userId || user.id,
          },
          { prisma: prismaAny, onEvent }
        )

        return reply.code(201).send({
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          documentId: result.documentId,
        })
      } catch (err: any) {
        fastify.log.error(err)
        return reply.code(500).send({ error: err.message || 'Photo upload failed' })
      }
    }
  )

  // ─── POST /receipt ──────────────────────────────────────────────────
  fastify.post(
    '/receipt',
    { preHandler: [authenticateUser] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user
      const data = await request.file()

      if (!data) {
        return reply.code(400).send({ error: 'No file provided' })
      }

      const buffer = await data.toBuffer()
      if (buffer.length > MAX_RECEIPT_SIZE) {
        return reply.code(400).send({ error: 'File exceeds 10MB limit' })
      }

      if (!isImageOrPdf(data.mimetype)) {
        return reply.code(400).send({ error: 'File must be an image or PDF' })
      }

      const fields = data.fields as Record<string, any>
      const projectId = getFieldValue(fields, 'projectId')

      if (!projectId) {
        return reply.code(400).send({ error: 'projectId is required' })
      }

      try {
        const result = await uploadReceipt(
          {
            projectId,
            file: buffer,
            filename: data.filename,
            uploadedBy: user.userId || user.id,
          },
          { prisma: prismaAny, onEvent }
        )

        return reply.code(201).send({
          url: result.url,
          documentId: result.documentId,
        })
      } catch (err: any) {
        fastify.log.error(err)
        return reply.code(500).send({ error: err.message || 'Receipt upload failed' })
      }
    }
  )

  // ─── POST /document ─────────────────────────────────────────────────
  fastify.post(
    '/document',
    { preHandler: [authenticateUser] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user
      const data = await request.file()

      if (!data) {
        return reply.code(400).send({ error: 'No file provided' })
      }

      const buffer = await data.toBuffer()
      if (buffer.length > MAX_DOCUMENT_SIZE) {
        return reply.code(400).send({ error: 'File exceeds 50MB limit' })
      }

      if (!isDocumentType(data.mimetype)) {
        return reply.code(400).send({ error: 'Invalid file type. Accepted: PDF, DOC, DOCX, XLS, XLSX, DWG, DXF, JPEG, PNG' })
      }

      const fields = data.fields as Record<string, any>
      const projectId = getFieldValue(fields, 'projectId')
      const type = getFieldValue(fields, 'type') as 'contract' | 'report' | 'permit' | 'design' | 'other'

      const validTypes = ['contract', 'report', 'permit', 'design', 'other']
      if (!type || !validTypes.includes(type)) {
        return reply.code(400).send({ error: `type is required. Must be one of: ${validTypes.join(', ')}` })
      }

      try {
        const result = await uploadDocument(
          {
            projectId: projectId || undefined,
            type,
            file: buffer,
            filename: data.filename,
            uploadedBy: user.userId || user.id,
          },
          { prisma: prismaAny, onEvent }
        )

        return reply.code(201).send({
          url: result.url,
          documentId: result.documentId,
        })
      } catch (err: any) {
        fastify.log.error(err)
        return reply.code(500).send({ error: err.message || 'Document upload failed' })
      }
    }
  )

  // ─── POST /photos/batch ─────────────────────────────────────────────
  fastify.post(
    '/photos/batch',
    { preHandler: [authenticateUser] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user
      const parts = request.files()

      const uploaded: Array<{ url: string; thumbnailUrl: string; documentId: string }> = []
      const failed: Array<{ filename: string; error: string }> = []

      let projectId: string | undefined
      let siteVisitId: string | undefined
      let count = 0

      for await (const part of parts) {
        // Extract form fields from the first file's fields
        if (!projectId) {
          const fields = part.fields as Record<string, any>
          projectId = getFieldValue(fields, 'projectId')
          siteVisitId = getFieldValue(fields, 'siteVisitId') || undefined
        }

        if (!projectId) {
          return reply.code(400).send({ error: 'projectId is required' })
        }

        count++
        if (count > MAX_BATCH_FILES) {
          failed.push({ filename: part.filename, error: `Exceeded ${MAX_BATCH_FILES} file limit` })
          continue
        }

        try {
          const buffer = await part.toBuffer()

          if (buffer.length > MAX_PHOTO_SIZE) {
            failed.push({ filename: part.filename, error: 'File exceeds 20MB limit' })
            continue
          }

          if (!isImage(part.mimetype)) {
            failed.push({ filename: part.filename, error: 'Not a valid image file' })
            continue
          }

          const result = await uploadSitePhoto(
            {
              projectId,
              siteVisitId,
              file: buffer,
              filename: part.filename,
              uploadedBy: user.userId || user.id,
            },
            { prisma: prismaAny, onEvent }
          )

          uploaded.push({
            url: result.url,
            thumbnailUrl: result.thumbnailUrl,
            documentId: result.documentId,
          })
        } catch (err: any) {
          failed.push({ filename: part.filename, error: err.message || 'Upload failed' })
        }
      }

      if (!projectId) {
        return reply.code(400).send({ error: 'projectId is required' })
      }

      return reply.code(uploaded.length > 0 ? 201 : 400).send({
        uploaded,
        failed,
        total: uploaded.length + failed.length,
      })
    }
  )

  // ─── GET /project/:projectId/photos ─────────────────────────────────
  fastify.get(
    '/project/:projectId/photos',
    { preHandler: [authenticateUser] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { projectId } = request.params as { projectId: string }
      const query = request.query as {
        siteVisitId?: string
        page?: string
        limit?: string
      }

      const page = Math.max(1, parseInt(query.page || '1', 10))
      const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
      const offset = (page - 1) * limit

      try {
        const result = await getProjectPhotos(
          projectId,
          {
            siteVisitId: query.siteVisitId,
            limit,
            offset,
          },
          { prisma: prismaAny }
        )

        return reply.send({
          photos: result.photos,
          total: result.total,
          page,
          limit,
        })
      } catch (err: any) {
        fastify.log.error(err)
        return reply.code(500).send({ error: err.message || 'Failed to fetch photos' })
      }
    }
  )
}

// ---------------------------------------------------------------------------
// Field extraction helper
// ---------------------------------------------------------------------------

/**
 * Extract a string value from multipart form fields.
 * @fastify/multipart wraps each field as { value: string }.
 */
function getFieldValue(fields: Record<string, any>, name: string): string | undefined {
  const field = fields?.[name]
  if (!field) return undefined
  if (typeof field === 'string') return field
  if (typeof field?.value === 'string') return field.value
  return undefined
}
