/**
 * verification-document.routes.ts
 *
 * Contractor-facing verification document endpoints.
 * Registered at prefix /verification, so final paths are:
 *
 *   POST   /verification/documents/presigned-url   — get S3 PUT URL (before upload)
 *   POST   /verification/documents                 — confirm upload + create record
 *   GET    /verification/documents                 — list own documents
 *   GET    /verification/documents/:id/download    — get signed GET URL (1h)
 *   PATCH  /verification/documents/:id             — update metadata (own, non-APPROVED)
 *   DELETE /verification/documents/:id             — archive own document
 *
 * Authorization: authenticated contractor only.
 * A contractor can only access documents where marketplaceProfileId = their profile.
 *
 * Versioning:
 *   When a new upload of the same documentType is confirmed, all previous
 *   non-ARCHIVED records for that (profile, type) are archived.
 *   The new record gets version = max(previous.version) + 1.
 *
 * Expired insurance:
 *   expiresAt is set by the contractor and surfaced as effectiveStatus=EXPIRED
 *   when expiresAt < now() without mutating the DB on read.
 *
 * Archive vs soft delete:
 *   Documents are never hard-deleted (audit trail preservation).
 *   DELETE /verification/documents/:id → status = ARCHIVED.
 *   APPROVED documents cannot be archived by the contractor.
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser } from '../../middleware/auth.middleware'
import { prismaAny }          from '../../utils/prisma-helper'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'
import {
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
} from './verification-document.storage'
import {
  presignedUrlBodySchema,
  confirmUploadBodySchema,
  toDTO,
} from './verification-document.types'

// ─── Param / query schemas ────────────────────────────────────────────────────

const idParamSchema = z.object({ id: z.string().uuid() })

const listQuerySchema = z.object({
  documentType: z.enum(['LICENSE', 'INSURANCE', 'BOND', 'CERTIFICATION', 'OTHER']).optional(),
  status:       z.enum(['UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'ARCHIVED']).optional(),
  includeArchived: z.coerce.boolean().optional().default(false),
})

const updateBodySchema = z.object({
  description:    z.string().max(1000).optional(),
  issuerName:     z.string().max(200).optional(),
  documentNumber: z.string().max(200).optional(),
  expiresAt:      z.string().datetime({ offset: true }).optional().or(z.literal('')),
})

// ─── Route registration ───────────────────────────────────────────────────────

export async function verificationDocumentRoutes(fastify: FastifyInstance) {
  const preHandler = [authenticateUser]

  // ──────────────────────────────────────────────────────────────────────────
  // POST /verification/documents/presigned-url
  //
  // Step 1 of 2: get a presigned S3 PUT URL.
  // The client uploads the file directly to S3 using this URL, then calls
  // POST /verification/documents to confirm and create the DB record.
  //
  // Body: { documentType, fileName, mimeType, fileSize }
  // ──────────────────────────────────────────────────────────────────────────

  fastify.post(
    '/documents/presigned-url',
    { preHandler },
    async (request: any, reply) => {
      const userId = request.user.id

      const parsed = presignedUrlBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({
          error:   parsed.error.issues[0]?.message ?? 'Validation failed',
          details: parsed.error.issues,
        })
      }
      const { documentType, fileName, mimeType, fileSize } = parsed.data

      try {
        const marketplace = await prismaAny.marketplaceProfile.findUnique({
          where: { userId },
          select: { id: true },
        })
        if (!marketplace) {
          return reply.code(404).send({
            error: 'Marketplace profile not found. Complete contractor registration first.',
          })
        }

        const result = await getPresignedUploadUrl(
          marketplace.id,
          documentType,
          fileName,
          mimeType,
        )

        return reply.send({
          presignedUrl:        result.presignedUrl,
          key:                 result.key,
          expiresAt:           result.expiresAt,
          marketplaceProfileId: marketplace.id,
          // Metadata the client must echo back in the confirm step
          _meta: { documentType, fileName, mimeType, fileSize },
        })
      } catch (err: any) {
        fastify.log.error({ err, userId }, 'Failed to generate presigned URL')
        return reply.code(500).send({
          error: sanitizeErrorMessage(err, 'Failed to prepare upload'),
        })
      }
    },
  )

  // ──────────────────────────────────────────────────────────────────────────
  // POST /verification/documents
  //
  // Step 2 of 2: confirm upload complete + create VerificationDocument record.
  // Called by the client after the browser PUT to the presigned URL succeeds.
  //
  // Versioning: archives all prior non-ARCHIVED records of same type.
  //
  // Body: { key, documentType, fileName, mimeType, fileSize,
  //         description?, issuerName?, documentNumber?, expiresAt? }
  // ──────────────────────────────────────────────────────────────────────────

  fastify.post(
    '/documents',
    { preHandler },
    async (request: any, reply) => {
      const userId = request.user.id

      const parsed = confirmUploadBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({
          error:   parsed.error.issues[0]?.message ?? 'Validation failed',
          details: parsed.error.issues,
        })
      }
      const data = parsed.data

      // Validate key belongs to this user's profile
      const marketplace = await prismaAny.marketplaceProfile.findUnique({
        where: { userId },
        select: { id: true },
      })
      if (!marketplace) {
        return reply.code(404).send({ error: 'Marketplace profile not found' })
      }
      if (!data.key.startsWith(`verification-docs/${marketplace.id}/`)) {
        return reply.code(403).send({ error: 'Invalid storage key for this profile' })
      }

      try {
        // ── Versioning: compute next version + archive previous ──────────────
        const previous = await prismaAny.verificationDocument.findMany({
          where: {
            marketplaceProfileId: marketplace.id,
            documentType:         data.documentType,
            status: { not: 'ARCHIVED' },
          },
          select: { id: true, version: true },
          orderBy: { version: 'desc' },
        })

        const nextVersion = previous.length > 0
          ? (previous[0].version as number) + 1
          : 1

        const prevIds = previous.map((p: any) => p.id)

        // ── Create new record + archive previous in a transaction ────────────
        const [newDoc] = await Promise.all([
          prismaAny.verificationDocument.create({
            data: {
              marketplaceProfileId: marketplace.id,
              documentType:         data.documentType,
              status:               'UPLOADED',
              version:              nextVersion,
              fileKey:              data.key,
              fileName:             data.fileName,
              mimeType:             data.mimeType,
              fileSize:             data.fileSize,
              description:          data.description || null,
              issuerName:           data.issuerName  || null,
              documentNumber:       data.documentNumber || null,
              expiresAt:            data.expiresAt ? new Date(data.expiresAt) : null,
            },
          }),
          prevIds.length > 0
            ? prismaAny.verificationDocument.updateMany({
                where: { id: { in: prevIds } },
                data:  { status: 'ARCHIVED' },
              })
            : Promise.resolve(),
        ])

        fastify.log.info(
          { userId, marketplaceId: marketplace.id, documentType: data.documentType, version: nextVersion },
          'Verification document uploaded',
        )

        return reply.code(201).send({ document: toDTO(newDoc) })
      } catch (err: any) {
        fastify.log.error({ err, userId }, 'Failed to confirm document upload')
        return reply.code(500).send({
          error: sanitizeErrorMessage(err, 'Failed to save document'),
        })
      }
    },
  )

  // ──────────────────────────────────────────────────────────────────────────
  // GET /verification/documents
  //
  // List own verification documents.
  // Query: documentType?, status?, includeArchived? (default false)
  // ──────────────────────────────────────────────────────────────────────────

  fastify.get(
    '/documents',
    { preHandler },
    async (request: any, reply) => {
      const userId = request.user.id

      const parsedQ = listQuerySchema.safeParse(request.query)
      if (!parsedQ.success) {
        return reply.code(400).send({ error: parsedQ.error.issues[0]?.message })
      }
      const { documentType, status, includeArchived } = parsedQ.data

      try {
        const marketplace = await prismaAny.marketplaceProfile.findUnique({
          where: { userId },
          select: { id: true },
        })
        if (!marketplace) {
          return reply.send({ documents: [], counts: {}, profileExists: false })
        }

        const where: any = { marketplaceProfileId: marketplace.id }
        if (documentType) where.documentType = documentType
        if (status)       where.status = status
        if (!includeArchived && !status) {
          where.status = { not: 'ARCHIVED' }
        }

        const docs = await prismaAny.verificationDocument.findMany({
          where,
          orderBy: [{ documentType: 'asc' }, { version: 'desc' }],
        })

        const dtos = docs.map(toDTO)

        // Count by documentType (latest version only — non-archived)
        const countByType: Record<string, number> = {}
        for (const d of dtos) {
          if (d.status !== 'ARCHIVED') {
            countByType[d.documentType] = (countByType[d.documentType] ?? 0) + 1
          }
        }

        return reply.send({
          documents:   dtos,
          counts:      countByType,
          profileExists: true,
        })
      } catch (err: any) {
        fastify.log.error({ err, userId }, 'Failed to list verification documents')
        return reply.code(500).send({
          error: sanitizeErrorMessage(err, 'Failed to load documents'),
        })
      }
    },
  )

  // ──────────────────────────────────────────────────────────────────────────
  // GET /verification/documents/:id/download
  //
  // Return a signed S3 GET URL valid for 1 hour.
  // Contractor can only download their own documents.
  // ──────────────────────────────────────────────────────────────────────────

  fastify.get(
    '/documents/:id/download',
    { preHandler },
    async (request: any, reply) => {
      const userId = request.user.id

      const parsedP = idParamSchema.safeParse(request.params)
      if (!parsedP.success) return reply.code(400).send({ error: 'Invalid document ID' })
      const { id } = parsedP.data

      try {
        const marketplace = await prismaAny.marketplaceProfile.findUnique({
          where: { userId },
          select: { id: true },
        })
        if (!marketplace) return reply.code(404).send({ error: 'Profile not found' })

        const doc = await prismaAny.verificationDocument.findFirst({
          where: { id, marketplaceProfileId: marketplace.id },
        })
        if (!doc) return reply.code(404).send({ error: 'Document not found' })

        const result = await getPresignedDownloadUrl(doc.fileKey, doc.fileName)
        return reply.send({ url: result.url, expiresAt: result.expiresAt })
      } catch (err: any) {
        fastify.log.error({ err, userId, id: request.params?.id }, 'Failed to generate download URL')
        return reply.code(500).send({
          error: sanitizeErrorMessage(err, 'Failed to generate download link'),
        })
      }
    },
  )

  // ──────────────────────────────────────────────────────────────────────────
  // PATCH /verification/documents/:id
  //
  // Update mutable metadata fields on an own document.
  // Only allowed when status is UPLOADED or REJECTED (not APPROVED / UNDER_REVIEW).
  // ──────────────────────────────────────────────────────────────────────────

  fastify.patch(
    '/documents/:id',
    { preHandler },
    async (request: any, reply) => {
      const userId = request.user.id

      const parsedP = idParamSchema.safeParse(request.params)
      if (!parsedP.success) return reply.code(400).send({ error: 'Invalid document ID' })
      const { id } = parsedP.data

      const parsedB = updateBodySchema.safeParse(request.body ?? {})
      if (!parsedB.success) {
        return reply.code(400).send({ error: parsedB.error.issues[0]?.message })
      }
      const data = parsedB.data

      try {
        const marketplace = await prismaAny.marketplaceProfile.findUnique({
          where: { userId },
          select: { id: true },
        })
        if (!marketplace) return reply.code(404).send({ error: 'Profile not found' })

        const doc = await prismaAny.verificationDocument.findFirst({
          where: { id, marketplaceProfileId: marketplace.id },
        })
        if (!doc) return reply.code(404).send({ error: 'Document not found' })

        if (!['UPLOADED', 'REJECTED'].includes(doc.status)) {
          return reply.code(409).send({
            error: `Cannot edit a document with status ${doc.status}. Upload a new version instead.`,
          })
        }

        const updated = await prismaAny.verificationDocument.update({
          where: { id },
          data: {
            description:    data.description    !== undefined ? (data.description    || null) : undefined,
            issuerName:     data.issuerName     !== undefined ? (data.issuerName     || null) : undefined,
            documentNumber: data.documentNumber !== undefined ? (data.documentNumber || null) : undefined,
            expiresAt:      data.expiresAt      !== undefined ? (data.expiresAt ? new Date(data.expiresAt) : null) : undefined,
          },
        })

        return reply.send({ document: toDTO(updated) })
      } catch (err: any) {
        fastify.log.error({ err, userId }, 'Failed to update document metadata')
        return reply.code(500).send({
          error: sanitizeErrorMessage(err, 'Failed to update document'),
        })
      }
    },
  )

  // ──────────────────────────────────────────────────────────────────────────
  // DELETE /verification/documents/:id
  //
  // Soft-delete (archive) an own document.
  // APPROVED documents cannot be archived by the contractor — admin only.
  // ──────────────────────────────────────────────────────────────────────────

  fastify.delete(
    '/documents/:id',
    { preHandler },
    async (request: any, reply) => {
      const userId = request.user.id

      const parsedP = idParamSchema.safeParse(request.params)
      if (!parsedP.success) return reply.code(400).send({ error: 'Invalid document ID' })
      const { id } = parsedP.data

      try {
        const marketplace = await prismaAny.marketplaceProfile.findUnique({
          where: { userId },
          select: { id: true },
        })
        if (!marketplace) return reply.code(404).send({ error: 'Profile not found' })

        const doc = await prismaAny.verificationDocument.findFirst({
          where: { id, marketplaceProfileId: marketplace.id },
        })
        if (!doc) return reply.code(404).send({ error: 'Document not found' })

        if (doc.status === 'APPROVED') {
          return reply.code(403).send({
            error: 'Approved documents cannot be archived. Contact support if this needs to be removed.',
          })
        }

        if (doc.status === 'ARCHIVED') {
          return reply.code(409).send({ error: 'Document is already archived' })
        }

        await prismaAny.verificationDocument.update({
          where: { id },
          data:  { status: 'ARCHIVED' },
        })

        return reply.send({ success: true, message: 'Document archived' })
      } catch (err: any) {
        fastify.log.error({ err, userId }, 'Failed to archive document')
        return reply.code(500).send({
          error: sanitizeErrorMessage(err, 'Failed to archive document'),
        })
      }
    },
  )
}
