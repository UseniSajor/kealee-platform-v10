/**
 * File Upload Handler
 * Wraps @kealee/storage and persists FileUpload records to database
 */

import { uploadFile as storageUploadFile } from '@kealee/storage'
import { prismaAny } from '../utils/prisma-helper'

export interface UploadFileHandlerOptions {
  bucket: string
  path: string
  file: Buffer | Blob
  fileName: string
  fileSize: number
  contentType: string
  category?: string // FileCategory enum value
  /** FK: conceptServiceLeadId */
  conceptServiceLeadId?: string
  /** FK: estimationServiceLeadId */
  estimationServiceLeadId?: string
  /** FK: projectId */
  projectId?: string
  uploadedById?: string // User ID; KEALEE_ADMIN if not provided
}

export interface FileUploadResult {
  fileUrl: string
  fileUploadId: string
}

/**
 * Upload file to Supabase and create FileUpload DB record
 * Non-blocking: failures in DB creation do not prevent returning file URL
 */
export async function uploadFileWithTracking(
  options: UploadFileHandlerOptions
): Promise<FileUploadResult> {
  // Upload to Supabase Storage
  const uploadResult = await storageUploadFile({
    bucket: options.bucket,
    path: options.path,
    file: options.file,
    contentType: options.contentType,
  })

  // Create FileUpload record (non-blocking)
  let fileUploadId = ''
  try {
    // Map FileCategory: if not provided, default to OTHER
    const category = options.category || 'OTHER'

    const record = await prismaAny.fileUpload.create({
      data: {
        fileName: options.fileName,
        fileUrl: uploadResult.url,
        fileSize: options.fileSize,
        mimeType: options.contentType,
        category, // FileCategory enum
        conceptServiceLeadId: options.conceptServiceLeadId,
        estimationServiceLeadId: options.estimationServiceLeadId,
        projectId: options.projectId,
        uploadedById: options.uploadedById || 'system',
        uploadedByRole: 'KEALEE_ADMIN',
      },
    })
    fileUploadId = record.id
  } catch (err: any) {
    console.warn('FileUpload DB record creation failed (non-blocking):', err?.message)
    fileUploadId = `temp_${Date.now()}`
  }

  return {
    fileUrl: uploadResult.url,
    fileUploadId,
  }
}
