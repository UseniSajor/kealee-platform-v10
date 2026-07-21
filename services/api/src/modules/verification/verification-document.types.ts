/**
 * verification-document.types.ts
 *
 * Shared TypeScript types and Zod schemas for the VerificationDocument system.
 */

import { z } from 'zod'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const DOCUMENT_TYPES = ['LICENSE', 'INSURANCE', 'BOND', 'CERTIFICATION', 'OTHER'] as const
export type  VerificationDocumentType = typeof DOCUMENT_TYPES[number]

export const DOCUMENT_STATUSES = [
  'UPLOADED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'ARCHIVED',
] as const
export type VerificationDocumentStatus = typeof DOCUMENT_STATUSES[number]

/**
 * Allowed MIME types for verification documents.
 * PDF, DOCX, XLSX, images only — no executables or archives.
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const presignedUrlBodySchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES),
  fileName:     z.string().min(1).max(300),
  mimeType:     z.string().refine(
    (v) => ALLOWED_MIME_TYPES.includes(v as any),
    { message: `Allowed types: PDF, DOCX, XLSX, JPEG, PNG, WEBP` },
  ),
  fileSize:     z.number().int().positive().max(MAX_FILE_SIZE_BYTES, 'File must be 20 MB or smaller'),
})

export const confirmUploadBodySchema = z.object({
  key:            z.string().min(1),   // S3 key returned from presigned-url
  documentType:   z.enum(DOCUMENT_TYPES),
  fileName:       z.string().min(1).max(300),
  mimeType:       z.string().min(1),
  fileSize:       z.number().int().positive(),
  description:    z.string().max(1000).optional(),
  issuerName:     z.string().max(200).optional(),
  documentNumber: z.string().max(200).optional(),
  expiresAt:      z.string().datetime({ offset: true }).optional().or(z.literal('')),
})

export const adminReviewBodySchema = z.object({
  status:          z.enum(['UNDER_REVIEW', 'APPROVED', 'REJECTED']),
  reviewNote:      z.string().max(2000).optional(),
  rejectionReason: z.string().max(2000).optional(),
  // When approving LICENSE or INSURANCE, optionally update RotationQueueEntry
  updateQueueEntry: z.boolean().optional().default(false),
})

export type PresignedUrlBody   = z.infer<typeof presignedUrlBodySchema>
export type ConfirmUploadBody  = z.infer<typeof confirmUploadBodySchema>
export type AdminReviewBody    = z.infer<typeof adminReviewBodySchema>

// ─── Response DTOs ────────────────────────────────────────────────────────────

export interface VerificationDocumentDTO {
  id:                   string
  marketplaceProfileId: string
  documentType:         VerificationDocumentType
  status:               VerificationDocumentStatus
  effectiveStatus:      VerificationDocumentStatus  // APPROVED → EXPIRED if expiresAt < now
  version:              number
  fileName:             string
  mimeType:             string
  fileSize:             number
  description:          string | null
  issuerName:           string | null
  documentNumber:       string | null
  expiresAt:            string | null               // ISO
  isExpired:            boolean
  reviewedBy:           string | null
  reviewedAt:           string | null               // ISO
  reviewNote:           string | null
  rejectionReason:      string | null
  createdAt:            string
  updatedAt:            string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute effectiveStatus: if the document is APPROVED but expiresAt is in
 * the past, surface EXPIRED without modifying the DB record on every read.
 * This keeps expired detection cheap (no cron required for UI accuracy).
 */
export function computeEffectiveStatus(
  status: VerificationDocumentStatus,
  expiresAt: Date | null,
): VerificationDocumentStatus {
  if (status === 'APPROVED' && expiresAt && expiresAt < new Date()) {
    return 'EXPIRED'
  }
  return status
}

/**
 * Map a raw Prisma row to a DTO.
 * Never includes the fileKey — that is only returned from the download endpoint.
 */
export function toDTO(doc: any): VerificationDocumentDTO {
  const expiresAt       = doc.expiresAt ?? null
  const effectiveStatus = computeEffectiveStatus(doc.status, expiresAt)
  return {
    id:                   doc.id,
    marketplaceProfileId: doc.marketplaceProfileId,
    documentType:         doc.documentType,
    status:               doc.status,
    effectiveStatus,
    version:              doc.version,
    fileName:             doc.fileName,
    mimeType:             doc.mimeType,
    fileSize:             doc.fileSize,
    description:          doc.description ?? null,
    issuerName:           doc.issuerName ?? null,
    documentNumber:       doc.documentNumber ?? null,
    expiresAt:            expiresAt ? new Date(expiresAt).toISOString() : null,
    isExpired:            effectiveStatus === 'EXPIRED',
    reviewedBy:           doc.reviewedBy ?? null,
    reviewedAt:           doc.reviewedAt ? new Date(doc.reviewedAt).toISOString() : null,
    reviewNote:           doc.reviewNote ?? null,
    rejectionReason:      doc.rejectionReason ?? null,
    createdAt:            new Date(doc.createdAt).toISOString(),
    updatedAt:            new Date(doc.updatedAt).toISOString(),
  }
}
