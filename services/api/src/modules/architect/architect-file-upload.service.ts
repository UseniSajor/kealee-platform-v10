/**
 * Architect File Upload Service
 * Handles file uploads to R2/S3 with presigned URLs
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { randomUUID as uuidv4 } from 'crypto'

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

const BUCKET_NAME = process.env.ARCHITECT_BUCKET_NAME || process.env.S3_BUCKET_NAME || process.env.R2_BUCKET_NAME || 'kealee-architect-files'
const PRESIGNED_URL_EXPIRY = 3600 // 1 hour

class ArchitectFileUploadService {
  /**
   * Get presigned URL for file upload
   */
  async getPresignedUrl(
    designProjectId: string,
    fileName: string,
    mimeType: string,
    fileSize: number,
    userId: string,
    folderId?: string
  ) {
    // Verify project exists and user has access
    const project = await prismaAny.designProject.findUnique({
      where: { id: designProjectId },
      include: {
        teamMembers: {
          where: { userId },
        },
      },
    })

    if (!project) {
      throw new NotFoundError('DesignProject', designProjectId)
    }

    // Check if user is team member or project owner
    const isTeamMember = project.teamMembers.length > 0
    if (!isTeamMember) {
      // Check if user is project owner
      const ownerProject = await prismaAny.project.findUnique({
        where: { id: project.projectId },
        select: { ownerId: true },
      })
      if (ownerProject?.ownerId !== userId) {
        throw new ValidationError('Access denied: You must be a team member or project owner')
      }
    }

    // Verify folder if provided
    if (folderId) {
      const folder = await prismaAny.designFolder.findUnique({
        where: { id: folderId },
      })
      if (!folder || folder.designProjectId !== designProjectId) {
        throw new NotFoundError('DesignFolder', folderId)
      }
    }

    const s3 = getS3Client()
    const fileKey = `projects/${designProjectId}/${folderId || 'root'}/${uuidv4()}-${fileName}`

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: mimeType,
      Metadata: {
        designProjectId,
        folderId: folderId || '',
        uploadedBy: userId,
        fileName,
      },
    })

    const url = await getSignedUrl(s3, command, { expiresIn: PRESIGNED_URL_EXPIRY })

    // Store file metadata in database (will be updated when upload completes)
    const fileRecord = await prismaAny.designFile.create({
      data: {
        designProjectId,
        folderId: folderId || null,
        fileName,
        fileSize,
        mimeType,
        fileKey, // Store S3 key
        fileUrl: '', // Will be updated after upload
        status: 'UPLOADING',
        uploadedBy: userId,
        version: 1,
      },
    })

    return {
      url,
      fileKey,
      fileId: fileRecord.id,
      expiresAt: new Date(Date.now() + PRESIGNED_URL_EXPIRY * 1000).toISOString(),
    }
  }

  /**
   * Complete file upload and update metadata
   */
  async completeUpload(
    fileId: string,
    fileKey: string,
    userId: string
  ) {
    const file = await prismaAny.designFile.findUnique({
      where: { id: fileId },
    })

    if (!file) {
      throw new NotFoundError('DesignFile', fileId)
    }

    if (file.uploadedBy !== userId) {
      throw new ValidationError('Only the uploader can complete the upload')
    }

    // Generate public URL
    const cdnUrl = process.env.CDN_URL || process.env.R2_PUBLIC_URL
    const fileUrl = cdnUrl
      ? `${cdnUrl}/${fileKey}`
      : `/api/architect/files/${fileId}/download`

    // Update file record
    const updated = await prismaAny.designFile.update({
      where: { id: fileId },
      data: {
        fileUrl,
        status: 'ACTIVE',
      },
    })

    // Create version record
    await prismaAny.designFileVersion.create({
      data: {
        designFileId: fileId,
        version: 1,
        fileKey,
        fileUrl,
        fileSize: file.fileSize,
        uploadedBy: userId,
        changeDescription: 'Initial upload',
      },
    })

    return {
      id: updated.id,
      fileUrl: updated.fileUrl,
      fileName: updated.fileName,
      version: updated.version,
    }
  }

  /**
   * Get file download URL (presigned)
   */
  async getDownloadUrl(fileId: string, userId: string) {
    const file = await prismaAny.designFile.findUnique({
      where: { id: fileId },
      include: {
        designProject: {
          include: {
            teamMembers: {
              where: { userId },
            },
          },
        },
      },
    })

    if (!file) {
      throw new NotFoundError('DesignFile', fileId)
    }

    // Check access
    const isTeamMember = file.designProject.teamMembers.length > 0
    if (!isTeamMember) {
      const ownerProject = await prismaAny.project.findUnique({
        where: { id: file.designProject.projectId },
        select: { ownerId: true },
      })
      if (ownerProject?.ownerId !== userId) {
        throw new ValidationError('Access denied')
      }
    }

    const s3 = getS3Client()
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: file.fileKey,
    })

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 })
    return {
      url,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    }
  }
}

export const architectFileUploadService = new ArchitectFileUploadService()
