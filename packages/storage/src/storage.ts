/**
 * Supabase Storage Service
 * Handles file uploads to Supabase Storage buckets, with specialized functions
 * for site photos, receipts, and documents.
 *
 * Storage Buckets:
 *   1. 'site-photos'  — construction site photos (public read for project members)
 *   2. 'receipts'     — expense receipts for OCR processing (private)
 *   3. 'documents'    — contracts, reports, SOWs, invoices (private)
 *   4. 'profiles'     — user avatars, company logos, portfolio images (public)
 *   5. 'permits'      — permit applications and supporting docs (private)
 *   6. 'designs'      — architectural designs and drawings (private)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { optimizeImage, createThumbnail } from './image-processing'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UploadFileOptions {
  bucket: string
  path: string
  file: Buffer | Blob
  contentType: string
  metadata?: Record<string, string>
}

export interface UploadResult {
  url: string
  path: string
}

export interface SitePhotoUploadOptions {
  projectId: string
  siteVisitId?: string
  file: Buffer
  filename: string
  uploadedBy: string
}

export interface SitePhotoResult {
  url: string
  thumbnailUrl: string
  documentId: string
}

export interface ReceiptUploadOptions {
  projectId: string
  file: Buffer
  filename: string
  uploadedBy: string
}

export interface DocumentUploadOptions {
  projectId?: string
  type: 'contract' | 'report' | 'permit' | 'design' | 'other'
  file: Buffer
  filename: string
  uploadedBy: string
}

export interface UploadDocumentResult {
  url: string
  documentId: string
}

export interface ProjectPhoto {
  id: string
  url: string
  thumbnailUrl: string | null
  createdAt: Date
  siteVisitId: string | null
}

export type OnEvent = (event: string, payload: Record<string, unknown>) => void

// ---------------------------------------------------------------------------
// Storage service
// ---------------------------------------------------------------------------

let supabaseInstance: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

  if (!url || !key) {
    throw new Error(
      'Supabase storage not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    )
  }

  supabaseInstance = createClient(url, key)
  return supabaseInstance
}

/**
 * Sanitize a filename: strip path traversal, replace spaces, limit length.
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .slice(0, 200)
}

// ---------------------------------------------------------------------------
// Core upload
// ---------------------------------------------------------------------------

/**
 * Upload a file to a Supabase Storage bucket.
 */
export async function uploadFile(opts: UploadFileOptions): Promise<UploadResult> {
  const supabase = getSupabase()

  const { error } = await supabase.storage.from(opts.bucket).upload(opts.path, opts.file, {
    contentType: opts.contentType,
    cacheControl: '3600',
    upsert: false,
    // Supabase JS v2 doesn't support a top-level metadata option on upload;
    // we store metadata in the database record instead.
  })

  if (error) {
    throw new Error(`Upload failed (${opts.bucket}/${opts.path}): ${error.message}`)
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(opts.bucket).getPublicUrl(opts.path)

  return { url: publicUrl, path: opts.path }
}

// ---------------------------------------------------------------------------
// Site photos
// ---------------------------------------------------------------------------

/**
 * Upload a construction site photo with automatic optimization and thumbnail.
 *
 * 1. Optimizes to max 2000px wide / 80% JPEG
 * 2. Generates 400px thumbnail
 * 3. Uploads both to 'site-photos' bucket
 * 4. Creates a FileUpload record in the database
 * 5. Publishes 'site_photo.uploaded' event
 */
export async function uploadSitePhoto(
  opts: SitePhotoUploadOptions,
  deps: { prisma: any; onEvent?: OnEvent }
): Promise<SitePhotoResult> {
  const safeName = sanitizeFilename(opts.filename)
  const basePath = `${opts.projectId}/${Date.now()}-${safeName}`
  const thumbPath = `${opts.projectId}/${Date.now()}-${safeName}-thumb.jpg`

  // Optimize image & create thumbnail in parallel
  const [optimized, thumbnail] = await Promise.all([
    optimizeImage(opts.file, { maxWidth: 2000, quality: 80, format: 'jpeg' }),
    createThumbnail(opts.file, 400),
  ])

  // Upload full-size and thumbnail in parallel
  const [fullUpload, thumbUpload] = await Promise.all([
    uploadFile({
      bucket: 'site-photos',
      path: basePath,
      file: optimized,
      contentType: 'image/jpeg',
    }),
    uploadFile({
      bucket: 'site-photos',
      path: thumbPath,
      file: thumbnail,
      contentType: 'image/jpeg',
    }),
  ])

  // Create FileUpload record
  const record = await deps.prisma.fileUpload.create({
    data: {
      fileName: safeName,
      fileUrl: fullUpload.url,
      fileSize: optimized.length,
      mimeType: 'image/jpeg',
      category: 'SITE_PHOTO',
      projectId: opts.projectId,
      uploadedById: opts.uploadedBy,
      uploadedByRole: 'CONTRACTOR', // caller can adjust downstream
      metadata: {
        thumbnailUrl: thumbUpload.url,
        thumbnailPath: thumbPath,
        storagePath: basePath,
        bucket: 'site-photos',
        siteVisitId: opts.siteVisitId ?? null,
      },
    },
  })

  // Publish event
  deps.onEvent?.('site_photo.uploaded', {
    documentId: record.id,
    projectId: opts.projectId,
    url: fullUpload.url,
    siteVisitId: opts.siteVisitId ?? null,
  })

  return {
    url: fullUpload.url,
    thumbnailUrl: thumbUpload.url,
    documentId: record.id,
  }
}

// ---------------------------------------------------------------------------
// Receipts
// ---------------------------------------------------------------------------

/**
 * Upload an expense receipt image.
 *
 * 1. Uploads to 'receipts' bucket
 * 2. Creates a FileUpload record (category RECEIPT)
 * 3. Publishes 'receipt.uploaded' → triggers APP-07 OCR processing
 */
export async function uploadReceipt(
  opts: ReceiptUploadOptions,
  deps: { prisma: any; onEvent?: OnEvent }
): Promise<UploadDocumentResult> {
  const safeName = sanitizeFilename(opts.filename)
  const storagePath = `${opts.projectId}/receipts/${Date.now()}-${safeName}`

  const contentType = detectContentType(opts.filename)

  const result = await uploadFile({
    bucket: 'receipts',
    path: storagePath,
    file: opts.file,
    contentType,
  })

  const record = await deps.prisma.fileUpload.create({
    data: {
      fileName: safeName,
      fileUrl: result.url,
      fileSize: opts.file.length,
      mimeType: contentType,
      category: 'RECEIPT',
      projectId: opts.projectId,
      uploadedById: opts.uploadedBy,
      uploadedByRole: 'CONTRACTOR',
      metadata: {
        storagePath,
        bucket: 'receipts',
      },
    },
  })

  // Publish event → triggers OCR pipeline
  deps.onEvent?.('receipt.uploaded', {
    documentId: record.id,
    projectId: opts.projectId,
    url: result.url,
  })

  return { url: result.url, documentId: record.id }
}

// ---------------------------------------------------------------------------
// Documents (contracts, reports, permits, designs)
// ---------------------------------------------------------------------------

const BUCKET_MAP: Record<string, string> = {
  contract: 'documents',
  report: 'documents',
  permit: 'permits',
  design: 'designs',
  other: 'documents',
}

const CATEGORY_MAP: Record<string, string> = {
  contract: 'CONTRACT',
  report: 'OTHER',
  permit: 'PERMIT_DOCUMENT',
  design: 'DESIGN_FILE',
  other: 'OTHER',
}

/**
 * Upload a document (contract, report, permit, design, etc.).
 */
export async function uploadDocument(
  opts: DocumentUploadOptions,
  deps: { prisma: any; onEvent?: OnEvent }
): Promise<UploadDocumentResult> {
  const safeName = sanitizeFilename(opts.filename)
  const bucket = BUCKET_MAP[opts.type] || 'documents'
  const prefix = opts.projectId || 'general'
  const storagePath = `${prefix}/${opts.type}/${Date.now()}-${safeName}`

  const contentType = detectContentType(opts.filename)

  const result = await uploadFile({
    bucket,
    path: storagePath,
    file: opts.file,
    contentType,
  })

  const category = CATEGORY_MAP[opts.type] || 'OTHER'

  const record = await deps.prisma.fileUpload.create({
    data: {
      fileName: safeName,
      fileUrl: result.url,
      fileSize: opts.file.length,
      mimeType: contentType,
      category,
      projectId: opts.projectId ?? null,
      uploadedById: opts.uploadedBy,
      uploadedByRole: 'CONTRACTOR',
      metadata: {
        storagePath,
        bucket,
        documentType: opts.type,
      },
    },
  })

  return { url: result.url, documentId: record.id }
}

// ---------------------------------------------------------------------------
// Deliverables (Concept, Estimation, Permit PDFs + Images)
// ---------------------------------------------------------------------------

export interface ConceptDeliverableOptions {
  intakeLeadId: string
  conceptImages: Buffer[] // Multiple concept renderings
  pdfContent: Buffer // Generated PDF with summary
  fileName?: string
  uploadedBy: string
}

export interface ConceptDeliverableResult {
  conceptImageUrls: string[]
  pdfUrl: string
  fileUploadIds: string[]
}

/**
 * Upload concept package deliverables (images + PDF)
 * Stores in 'designs' bucket, creates FileUpload records
 */
export async function uploadConceptDeliverable(
  opts: ConceptDeliverableOptions,
  deps: { prisma: any; onEvent?: OnEvent }
): Promise<ConceptDeliverableResult> {
  const prefix = `concept-packages/${opts.intakeLeadId}/${Date.now()}`
  const pdfFileName = opts.fileName || `concept-package-${Date.now()}.pdf`
  const imagePath = `${prefix}/images`
  const pdfPath = `${prefix}/${pdfFileName}`

  // Upload PDF
  const pdfResult = await uploadFile({
    bucket: 'designs',
    path: pdfPath,
    file: opts.pdfContent,
    contentType: 'application/pdf',
  })

  // Upload concept images in parallel
  const imageUrls = await Promise.all(
    opts.conceptImages.map((imgBuffer, idx) =>
      uploadFile({
        bucket: 'designs',
        path: `${imagePath}/concept-${idx + 1}.jpg`,
        file: imgBuffer,
        contentType: 'image/jpeg',
      })
    )
  )

  // Create FileUpload records for PDF + images
  const fileUploadIds: string[] = []

  // Record for PDF
  const pdfRecord = await deps.prisma.fileUpload.create({
    data: {
      fileName: pdfFileName,
      fileUrl: pdfResult.url,
      fileSize: opts.pdfContent.length,
      mimeType: 'application/pdf',
      category: 'DESIGN_FILE',
      conceptServiceLeadId: opts.intakeLeadId,
      uploadedById: opts.uploadedBy,
      uploadedByRole: 'KEALEE_ADMIN',
      metadata: {
        deliverableType: 'concept-pdf',
        storagePath: pdfPath,
        bucket: 'designs',
      },
    },
  })
  fileUploadIds.push(pdfRecord.id)

  // Records for images
  for (let i = 0; i < imageUrls.length; i++) {
    const imgRecord = await deps.prisma.fileUpload.create({
      data: {
        fileName: `concept-rendering-${i + 1}.jpg`,
        fileUrl: imageUrls[i].url,
        fileSize: opts.conceptImages[i].length,
        mimeType: 'image/jpeg',
        category: 'RENDERING',
        conceptServiceLeadId: opts.intakeLeadId,
        uploadedById: opts.uploadedBy,
        uploadedByRole: 'KEALEE_ADMIN',
        metadata: {
          deliverableType: 'concept-image',
          imageIndex: i + 1,
          storagePath: imageUrls[i].path,
          bucket: 'designs',
        },
      },
    })
    fileUploadIds.push(imgRecord.id)
  }

  // Publish event
  deps.onEvent?.('concept.deliverable.uploaded', {
    intakeLeadId: opts.intakeLeadId,
    pdfUrl: pdfResult.url,
    imageUrls: imageUrls.map((r) => r.url),
    fileUploadIds,
  })

  return {
    conceptImageUrls: imageUrls.map((r) => r.url),
    pdfUrl: pdfResult.url,
    fileUploadIds,
  }
}

export interface EstimationDeliverableOptions {
  intakeLeadId: string
  pdfContent: Buffer
  fileName?: string
  uploadedBy: string
}

export interface EstimationDeliverableResult {
  pdfUrl: string
  fileUploadId: string
}

/**
 * Upload estimation package deliverable (PDF)
 * Stores in 'documents' bucket
 */
export async function uploadEstimationDeliverable(
  opts: EstimationDeliverableOptions,
  deps: { prisma: any; onEvent?: OnEvent }
): Promise<EstimationDeliverableResult> {
  const prefix = `estimation-packages/${opts.intakeLeadId}/${Date.now()}`
  const pdfFileName = opts.fileName || `estimate-${Date.now()}.pdf`
  const pdfPath = `${prefix}/${pdfFileName}`

  const pdfResult = await uploadFile({
    bucket: 'documents',
    path: pdfPath,
    file: opts.pdfContent,
    contentType: 'application/pdf',
  })

  const record = await deps.prisma.fileUpload.create({
    data: {
      fileName: pdfFileName,
      fileUrl: pdfResult.url,
      fileSize: opts.pdfContent.length,
      mimeType: 'application/pdf',
      category: 'OTHER',
      estimationServiceLeadId: opts.intakeLeadId,
      uploadedById: opts.uploadedBy,
      uploadedByRole: 'KEALEE_ADMIN',
      metadata: {
        deliverableType: 'estimation-pdf',
        storagePath: pdfPath,
        bucket: 'documents',
      },
    },
  })

  deps.onEvent?.('estimation.deliverable.uploaded', {
    intakeLeadId: opts.intakeLeadId,
    pdfUrl: pdfResult.url,
    fileUploadId: record.id,
  })

  return {
    pdfUrl: pdfResult.url,
    fileUploadId: record.id,
  }
}

export interface PermitDeliverableOptions {
  intakeLeadId: string
  packageFiles: Buffer[] // Permit application, supporting docs, etc.
  fileNames: string[]
  uploadedBy: string
}

export interface PermitDeliverableResult {
  fileUrls: string[]
  fileUploadIds: string[]
}

/**
 * Upload permit package deliverables (application + supporting docs)
 * Stores in 'permits' bucket
 */
export async function uploadPermitDeliverable(
  opts: PermitDeliverableOptions,
  deps: { prisma: any; onEvent?: OnEvent }
): Promise<PermitDeliverableResult> {
  const prefix = `permit-packages/${opts.intakeLeadId}/${Date.now()}`
  const fileUrls: string[] = []
  const fileUploadIds: string[] = []

  // Upload all files in parallel
  const uploads = await Promise.all(
    opts.packageFiles.map((fileBuffer, idx) =>
      uploadFile({
        bucket: 'permits',
        path: `${prefix}/${opts.fileNames[idx] || `permit-doc-${idx + 1}.pdf`}`,
        file: fileBuffer,
        contentType: 'application/pdf',
      })
    )
  )

  // Create FileUpload records
  for (let i = 0; i < uploads.length; i++) {
    const record = await deps.prisma.fileUpload.create({
      data: {
        fileName: opts.fileNames[i] || `permit-doc-${i + 1}.pdf`,
        fileUrl: uploads[i].url,
        fileSize: opts.packageFiles[i].length,
        mimeType: 'application/pdf',
        category: 'PERMIT_DOCUMENT',
        permitServiceLeadId: opts.intakeLeadId,
        uploadedById: opts.uploadedBy,
        uploadedByRole: 'KEALEE_ADMIN',
        metadata: {
          deliverableType: 'permit-doc',
          docIndex: i + 1,
          storagePath: uploads[i].path,
          bucket: 'permits',
        },
      },
    })
    fileUploadIds.push(record.id)
    fileUrls.push(uploads[i].url)
  }

  deps.onEvent?.('permit.deliverable.uploaded', {
    intakeLeadId: opts.intakeLeadId,
    fileUrls,
    fileUploadIds,
  })

  return {
    fileUrls,
    fileUploadIds,
  }
}

// ---------------------------------------------------------------------------
// Signed URLs (for private buckets)
// ---------------------------------------------------------------------------

/**
 * Generate a signed (time-limited) URL for a private file.
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const supabase = getSupabase()

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${error?.message ?? 'unknown error'}`)
  }

  return data.signedUrl
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/**
 * Delete a file from storage and mark the FileUpload record if it exists.
 */
export async function deleteFile(
  bucket: string,
  path: string,
  deps?: { prisma: any }
): Promise<void> {
  const supabase = getSupabase()

  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) {
    throw new Error(`Delete failed (${bucket}/${path}): ${error.message}`)
  }

  // If prisma is provided, try to soft-delete the matching FileUpload record
  if (deps?.prisma) {
    try {
      const record = await deps.prisma.fileUpload.findFirst({
        where: {
          metadata: { path: ['storagePath'], equals: path },
        },
      })
      if (record) {
        await deps.prisma.fileUpload.update({
          where: { id: record.id },
          data: { metadata: { ...(record.metadata as any), deleted: true, deletedAt: new Date().toISOString() } },
        })
      }
    } catch {
      // Best-effort; JSON querying may not match
    }
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Get all photos for a project, optionally filtered by site visit.
 */
export async function getProjectPhotos(
  projectId: string,
  opts: { siteVisitId?: string; limit?: number; offset?: number },
  deps: { prisma: any }
): Promise<{ photos: ProjectPhoto[]; total: number }> {
  const where: Record<string, unknown> = {
    projectId,
    category: 'SITE_PHOTO',
  }

  const [records, total] = await Promise.all([
    deps.prisma.fileUpload.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: opts.limit ?? 20,
      skip: opts.offset ?? 0,
    }),
    deps.prisma.fileUpload.count({ where }),
  ])

  const photos: ProjectPhoto[] = records
    .filter((r: any) => {
      if (!opts.siteVisitId) return true
      const meta = r.metadata as any
      return meta?.siteVisitId === opts.siteVisitId
    })
    .map((r: any) => ({
      id: r.id,
      url: r.fileUrl,
      thumbnailUrl: (r.metadata as any)?.thumbnailUrl ?? null,
      createdAt: r.createdAt,
      siteVisitId: (r.metadata as any)?.siteVisitId ?? null,
    }))

  return { photos, total }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function detectContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dwg: 'application/acad',
    dxf: 'application/dxf',
  }
  return map[ext ?? ''] ?? 'application/octet-stream'
}
