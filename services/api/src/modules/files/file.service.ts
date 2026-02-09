/**
 * File Service
 * Handles S3/R2 file uploads and presigned URLs
 */

import { S3Client, PutObjectCommand, GetObjectCommand, PutBucketPolicyCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { prismaAny } from '../../utils/prisma-helper'
import { v4 as uuidv4 } from 'uuid'
import { fileValidationService } from './file-validation.service'

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
   * Configure bucket policy
   */
  async configureBucketPolicy() {
    const s3 = getS3Client()
    
    // Bucket policy for secure file access
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'AllowPublicRead',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${BUCKET_NAME}/*`,
          Condition: {
            StringEquals: {
              's3:ExistingObjectTag/Public': 'true',
            },
          },
        },
        {
          Sid: 'DenyUnencryptedUploads',
          Effect: 'Deny',
          Principal: '*',
          Action: 's3:PutObject',
          Resource: `arn:aws:s3:::${BUCKET_NAME}/*`,
          Condition: {
            StringNotEquals: {
              's3:x-amz-server-side-encryption': 'AES256',
            },
          },
        },
      ],
    }

    try {
      await s3.send(
        new PutBucketPolicyCommand({
          Bucket: BUCKET_NAME,
          Policy: JSON.stringify(policy),
        })
      )
      console.log('✅ Bucket policy configured successfully')
    } catch (error: any) {
      console.warn('⚠️ Failed to configure bucket policy:', error.message)
      // Don't throw - bucket policy might be managed externally
    }
  }

  /**
   * Get presigned URL for file upload
   */
  async getPresignedUrl(
    fileName: string,
    mimeType: string,
    userId: string,
    metadata?: Record<string, string>
  ) {
    // Validate file type
    const validation = fileValidationService.validateFileType(
      mimeType,
      fileName,
      ['image', 'document', 'drawing', 'video', 'archive']
    )

    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid file type')
    }
    const s3 = getS3Client()
    const key = `uploads/${userId}/${uuidv4()}-${fileName}`

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: mimeType,
      Metadata: {
        ...(metadata || {}),
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      },
      ServerSideEncryption: 'AES256', // Require encryption
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
    // Validate file size
    const category = fileValidationService.detectFileCategory(mimeType)
    const sizeValidation = fileValidationService.validateFileSize(size, category)
    
    if (!sizeValidation.valid) {
      throw new Error(sizeValidation.error || 'File size exceeds limit')
    }

    // Full file validation
    const validation = fileValidationService.validateFile(fileName, mimeType, size)
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '))
    }
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
      // Check if user has access through project membership
      const meta = file.metadata as any
      const projectId = meta?.projectId
      if (projectId) {
        const project = await prismaAny.project.findUnique({
          where: { id: projectId },
          select: {
            ownerId: true,
            pmUserId: true,
            contracts: { select: { contractorId: true } },
          },
        })
        const isMember = project && (
          project.ownerId === userId ||
          project.pmUserId === userId ||
          project.contracts?.some((c: any) => c.contractorId === userId)
        )
        if (!isMember) {
          throw new Error('Access denied')
        }
      } else {
        throw new Error('Access denied')
      }
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

  /**
   * Direct file upload (multipart/form-data)
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    size: number,
    userId: string,
    folder: string = 'uploads',
    metadata?: Record<string, string>
  ) {
    // Validate file
    const validation = fileValidationService.validateFile(fileName, mimeType, size)
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '))
    }

    // Generate unique key
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const uniqueId = uuidv4()
    const key = `${folder}/${userId}/${uniqueId}_${sanitizedFileName}`

    // Upload to S3/R2
    const s3 = getS3Client()
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      ContentLength: size,
      Metadata: {
        userId,
        originalName: fileName,
        ...(metadata || {}),
      },
      ServerSideEncryption: 'AES256',
    })

    await s3.send(command)

    // Get public URL
    const publicUrl = this.getFileUrl(key)

    // Save to database
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
      fileName: file.fileName,
      fileSize: file.size,
      fileType: file.mimeType,
      url: publicUrl,
      s3Key: file.key,
      uploadedAt: file.createdAt,
    }
  }

  /**
   * List user's files
   */
  async listFiles(
    userId: string,
    options: {
      folder?: string
      limit?: number
      offset?: number
    } = {}
  ) {
    const { folder, limit = 50, offset = 0 } = options

    const where: any = {
      uploadedBy: userId,
    }

    if (folder) {
      where.key = {
        startsWith: `${folder}/`,
      }
    }

    const [files, total] = await Promise.all([
      prismaAny.file.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prismaAny.file.count({ where }),
    ])

    return {
      files: files.map((file: any) => ({
        id: file.id,
        fileName: file.fileName,
        fileSize: file.size,
        fileType: file.mimeType,
        url: this.getFileUrl(file.key),
        s3Key: file.key,
        metadata: file.metadata,
        createdAt: file.createdAt,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + files.length < total,
      },
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string, userId: string) {
    const file = await prismaAny.file.findUnique({
      where: { id: fileId },
    })

    if (!file) {
      throw new Error('File not found')
    }

    if (file.uploadedBy !== userId) {
      throw new Error('Access denied')
    }

    // Delete from S3/R2
    const s3 = getS3Client()
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: file.key,
    })

    await s3.send(command)

    // Delete from database
    await prismaAny.file.delete({
      where: { id: fileId },
    })

    return {
      success: true,
      deletedFile: file.fileName,
    }
  }

  /**
   * Get download URL by file ID
   */
  async getDownloadUrlById(fileId: string, userId: string) {
    const file = await prismaAny.file.findUnique({
      where: { id: fileId },
    })

    if (!file) {
      throw new Error('File not found')
    }

    if (file.uploadedBy !== userId) {
      throw new Error('Access denied')
    }

    return this.getDownloadUrl(file.key, userId)
  }
}

export const fileService = new FileService()
