/**
 * admin-verification-documents.routes.ts
 *
 * Admin endpoints for reviewing contractor verification documents.
 * Registered at prefix /admin, so final paths are:
 *
 *   GET   /admin/verification/documents/:profileId           — list docs for a profile
 *   PATCH /admin/verification/documents/:documentId          — review (status + note)
 *   GET   /admin/verification/documents/:documentId/download — signed download URL
 *
 * Authorization: admin or super_admin role only.
 *
 * On APPROVED (LICENSE or INSURANCE):
 *   Optionally updates RotationQueueEntry.licenseVerified / insuranceVerified.
 *   Does NOT automatically approve the contractor — that is a separate
 *   explicit action in admin-verification.routes.ts.
 *
 * On REJECTED:
 *   rejectionReason is required.
 *   The document status is set to REJECTED (contractor can upload a new version).
 *   A verification.document_rejected workflow event is emitted.
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticateUser, requireAdmin } from '../../middleware/auth.middleware'
import { prismaAny }             from '../../utils/prisma-helper'
import { sanitizeErrorMessage }  from '../../utils/sanitize-error'
import { workflowEventService, WorkflowEventService } from '../workflow/workflow-event.service'
import { getPresignedDownloadUrl } from '../verification/verification-document.storage'
import { adminReviewBodySchema, toDTO } from '../verification/verification-document.types'

// ─── Param / query schemas ────────────────────────────────────────────────────

const profileIdParamSchema    = z.object({ profileId:   z.string().uuid() })
const documentIdParamSchema   = z.object({ documentId:  z.string().uuid() })

const listQuerySchema = z.object({
  documentType:   z.enum(['LICENSE', 'INSURANCE', 'BOND', 'CERTIFICATION', 'OTHER']).optional(),
  status:         z.enum(['UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'ARCHIVED']).optional(),
  includeArchived: z.coerce.boolean().optional().default(false),
})

// ─── Route registration ───────────────────────────────────────────────────────

export async function adminVerificationDocumentsRoutes(fastify: FastifyInstance) {
  const preHandler = [authenticateUser, requireAdmin]

  // ──────────────────────────────────────────────────────────────────────────
  // GET /admin/verification/documents/:profileId
  //
  // List all verification documents for a contractor profile.
  // Used by the admin verification detail panel.
  // Query: documentType?, status?, includeArchived?
  // ──────────────────────────────────────────────────────────────────────────

  fastify.get(
    '/verification/documents/:profileId',
    { preHandler },
    async (request: any, reply) => {
      const parsedP = profileIdParamSchema.safeParse(request.params)
      if (!parsedP.success) return reply.code(400).send({ error: 'Invalid profile ID' })
      const { profileId } = parsedP.data

      const parsedQ = listQuerySchema.safeParse(request.query)
      if (!parsedQ.success) return reply.code(400).send({ error: parsedQ.error.issues[0]?.message })
      const { documentType, status, includeArchived } = parsedQ.data

      try {
        // Confirm profile exists
        const profile = await prismaAny.marketplaceProfile.findUnique({
          where: { id: profileId },
          select: { id: true, businessName: true },
        })
        if (!profile) return reply.code(404).send({ error: 'Contractor profile not found' })

        const where: any = { marketplaceProfileId: profileId }
        if (documentType) where.documentType = documentType
        if (status)       where.status = status
        if (!includeArchived && !status) where.status = { not: 'ARCHIVED' }

        const docs = await prismaAny.verificationDocument.findMany({
          where,
          orderBy: [{ documentType: 'asc' }, { version: 'desc' }],
        })

        const dtos = docs.map(toDTO)

        // Counts per documentType x status (for the review panel summary)
        const summary: Record<string, Record<string, number>> = {}
        for (const d of dtos) {
          if (!summary[d.documentType]) summary[d.documentType] = {}
          const s = d.effectiveStatus
          summary[d.documentType][s] = (summary[d.documentType][s] ?? 0) + 1
        }

        return reply.send({
          profileId,
          businessName: profile.businessName,
          documents:    dtos,
          summary,
        })
      } catch (err: any) {
        fastify.log.error({ err, profileId }, 'Failed to list verification documents')
        return reply.code(500).send({
          error: sanitizeErrorMessage(err, 'Failed to load documents'),
        })
      }
    },
  )

  // ──────────────────────────────────────────────────────────────────────────
  // PATCH /admin/verification/documents/:documentId
  //
  // Review a document: set status to UNDER_REVIEW, APPROVED, or REJECTED.
  //
  // Business rules:
  //   - REJECTED requires rejectionReason in body.
  //   - On APPROVED with updateQueueEntry=true:
  //     - LICENSE  → sets RotationQueueEntry.licenseVerified = true
  //     - INSURANCE → sets RotationQueueEntry.insuranceVerified = true
  //   - Emits a verification.document_reviewed workflow event for audit trail.
  // ──────────────────────────────────────────────────────────────────────────

  fastify.patch(
    '/verification/documents/:documentId',
    { preHandler },
    async (request: any, reply) => {
      const adminUser = request.user

      const parsedP = documentIdParamSchema.safeParse(request.params)
      if (!parsedP.success) return reply.code(400).send({ error: 'Invalid document ID' })
      const { documentId } = parsedP.data

      const parsedB = adminReviewBodySchema.safeParse(request.body ?? {})
      if (!parsedB.success) {
        return reply.code(400).send({
          error:   parsedB.error.issues[0]?.message ?? 'Validation failed',
          details: parsedB.error.issues,
        })
      }
      const { status, reviewNote, rejectionReason, updateQueueEntry } = parsedB.data

      // Validate: rejection must have a reason
      if (status === 'REJECTED' && !rejectionReason) {
        return reply.code(400).send({ error: 'rejectionReason is required when rejecting a document' })
      }

      try {
        const doc = await prismaAny.verificationDocument.findUnique({
          where: { id: documentId },
          select: {
            id: true,
            marketplaceProfileId: true,
            documentType: true,
            status: true,
          },
        })
        if (!doc) return reply.code(404).send({ error: 'Document not found' })

        // Prevent re-reviewing already-ARCHIVED documents
        if (doc.status === 'ARCHIVED') {
          return reply.code(409).send({ error: 'Cannot review an archived document' })
        }

        // ── Update the document ────────────────────────────────────────────
        const updated = await prismaAny.verificationDocument.update({
          where: { id: documentId },
          data: {
            status,
            reviewedBy:      adminUser.id,
            reviewedAt:      new Date(),
            reviewNote:      reviewNote || null,
            rejectionReason: status === 'REJECTED' ? (rejectionReason || null) : null,
          },
        })

        // ── Optionally update RotationQueueEntry ──────────────────────────
        if (status === 'APPROVED' && updateQueueEntry) {
          const queueUpdateData: any = {}
          if (doc.documentType === 'LICENSE') {
            queueUpdateData.licenseVerified    = true
            queueUpdateData.licenseVerifiedAt  = new Date()
          } else if (doc.documentType === 'INSURANCE') {
            queueUpdateData.insuranceVerified    = true
            queueUpdateData.insuranceVerifiedAt  = new Date()
          }

          if (Object.keys(queueUpdateData).length > 0) {
            await prismaAny.rotationQueueEntry.updateMany({
              where: {
                profileId:       doc.marketplaceProfileId,
                professionalType: { in: ['CONTRACTOR', 'DESIGN_BUILD'] },
              },
              data: queueUpdateData,
            })
          }
        }

        // ── Emit workflow event (audit trail) ──────────────────────────────
        await workflowEventService.emit({
          eventType:      'verification.document_reviewed',
          subjectType:    'PROFESSIONAL_ASSIGNMENT',
          subjectId:      doc.marketplaceProfileId,
          idempotencyKey: WorkflowEventService.buildKey(
            'verification.document_reviewed',
            'PROFESSIONAL_ASSIGNMENT',
            documentId,
            `${adminUser.id}:${Date.now()}`,
          ),
          payload: {
            documentId,
            documentType:    doc.documentType,
            newStatus:       status,
            reviewedById:    adminUser.id,
            reviewedByName:  adminUser.name,
            reviewNote:      reviewNote ?? null,
            rejectionReason: rejectionReason ?? null,
            updateQueueEntry,
            reviewedAt:      new Date().toISOString(),
          },
        })

        fastify.log.info(
          {
            adminId: adminUser.id,
            documentId,
            documentType: doc.documentType,
            newStatus: status,
          },
          'Verification document reviewed',
        )

        return reply.send({ success: true, document: toDTO(updated) })
      } catch (err: any) {
        fastify.log.error({ err, documentId }, 'Failed to review verification document')
        return reply.code(500).send({
          error: sanitizeErrorMessage(err, 'Review failed'),
        })
      }
    },
  )

  // ──────────────────────────────────────────────────────────────────────────
  // GET /admin/verification/documents/:documentId/download
  //
  // Generate a signed S3 download URL for any document (admin access).
  // Admins can download documents regardless of whose profile they belong to.
  // ──────────────────────────────────────────────────────────────────────────

  fastify.get(
    '/verification/documents/:documentId/download',
    { preHandler },
    async (request: any, reply) => {
      const parsedP = documentIdParamSchema.safeParse(request.params)
      if (!parsedP.success) return reply.code(400).send({ error: 'Invalid document ID' })
      const { documentId } = parsedP.data

      try {
        const doc = await prismaAny.verificationDocument.findUnique({
          where:  { id: documentId },
          select: { id: true, fileKey: true, fileName: true },
        })
        if (!doc) return reply.code(404).send({ error: 'Document not found' })

        const result = await getPresignedDownloadUrl(doc.fileKey, doc.fileName)
        return reply.send({ url: result.url, expiresAt: result.expiresAt })
      } catch (err: any) {
        fastify.log.error({ err, documentId }, 'Failed to generate admin download URL')
        return reply.code(500).send({
          error: sanitizeErrorMessage(err, 'Failed to generate download link'),
        })
      }
    },
  )
}
