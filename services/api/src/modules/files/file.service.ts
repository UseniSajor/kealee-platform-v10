/**
 * File Service
 * Handles S3/R2 file uploads and presigned URLs
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { prismaAny } from '../../utils/prisma-helper'
import { v4 as uuidv4 } from 'uuid'

// Initialize S3 client (works with both AWS S3 and Cloudflare R2)
function getS3Client() {
  const endpoint = process.env.S3_ENDPOINT || process.env.R2_ENDPOINT
  const region = process.env.S3_REGION || process.env.R2_REGION || 'us-east-1'
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('S3/R2 credentials not configured')
  }

  return new S3Client({
    region,
    endpoint: endpoint || undefined,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: endpoint ? true : false, // Required for R2
  })
}

const BUCKET_NAME = process.env.S3_BUCKET_NAME || process.env.R2_BUCKET_NAME || 'kealee-uploads'
const PRESIGNED_URL_EXPIRY = 3600 // 1 hour

class FileService {
  /**
   * Get presigned URL for file upload
   */
  async getPresignedUrl(
    fileName: string,
    mimeType: string,
    userId: string,
    metadata?: Record<string, string>
  ) {
    const s3 = getS3Client()
    const key = `uploads/${userId}/${uuidv4()}-${fileName}`

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: mimeType,
      Metadata: metadata || {},
    })

    const url = await getSignedUrl(s3, command, { expiresIn: PRESIGNED_URL_EXPIRY })

    // Store file metadata in database
    const fileRecord = await prismaAny.file.create({
      data: {
        key,
        fileName,
        mimeType,
        size: 0, // Will be updated when upload completes
        uploadedBy: userId,
        status: 'UPLOADING',
        metadata: metadata || {},
      },
    })

    return {
      url,
      key,
      fileId: fileRecord.id,
      expiresAt: new Date(Date.now() + PRESIGNED_URL_EXPIRY * 1000).toISOString(),
    }
  }

  /**
   * Complete file upload and update metadata
   */
  async completeUpload(
    key: string,
    fileName: string,
    mimeType: string,
    size: number,
    userId: string,
    metadata?: Record<string, string>
  ) {
    // Find existing file record by key
    const existing = await prismaAny.file.findFirst({
      where: { key, uploadedBy: userId },
    })

    if (existing) {
      // Update existing record
      const updated = await prismaAny.file.update({
        where: { id: existing.id },
        data: {
          fileName,
          mimeType,
          size,
          status: 'COMPLETED',
          metadata: { ...(existing.metadata as any || {}), ...(metadata || {}) },
        },
      })

      return {
        id: updated.id,
        key: updated.key,
        url: this.getFileUrl(updated.key),
        fileName: updated.fileName,
        mimeType: updated.mimeType,
        size: updated.size,
      }
    }

    // Create new record
    const file = await prismaAny.file.create({
      data: {
        key,
        fileName,
        mimeType,
        size,
        uploadedBy: userId,
        status: 'COMPLETED',
        metadata: metadata || {},
      },
    })

    return {
      id: file.id,
      key: file.key,
      url: this.getFileUrl(file.key),
      fileName: file.fileName,
      mimeType: file.mimeType,
      size: file.size,
    }
  }

  /**
   * Get file metadata
   */
  async getFile(fileId: string, userId: string) {
    const file = await prismaAny.file.findUnique({
      where: { id: fileId },
    })

    if (!file) {
      throw new Error('File not found')
    }

    // Check access (user must be the uploader or have project access)
    if (file.uploadedBy !== userId) {
      // TODO: Check if user has access through project membership
      throw new Error('Access denied')
    }

    return {
      id: file.id,
      key: file.key,
      url: this.getFileUrl(file.key),
      fileName: file.fileName,
      mimeType: file.mimeType,
      size: file.size,
      metadata: file.metadata,
      createdAt: file.createdAt,
    }
  }

  /**
   * Get public URL for file
   */
  private getFileUrl(key: string): string {
    const cdnUrl = process.env.CDN_URL || process.env.R2_PUBLIC_URL
    if (cdnUrl) {
      return `${cdnUrl}/${key}`
    }
    // Fallback: generate presigned URL for download
    return `/api/files/${key}/download`
  }

  /**
   * Generate download URL (presigned)
   */
  async getDownloadUrl(key: string, userId: string) {
    const file = await prismaAny.file.findFirst({
      where: { key, uploadedBy: userId },
    })

    if (!file) {
      throw new Error('File not found or access denied')
    }

    const s3 = getS3Client()
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 })
    return { url, expiresAt: new Date(Date.now() + 3600 * 1000).toISOString() }
  }
}

export const fileService = new FileService()
