import { NotFoundError, ValidationError } from '../../errors/app.error'
// Prisma types available through prismaAny

// Allowed file types for evidence
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export type FileUploadResult = {
  fileUrl: string
  fileName: string
  mimeType: string
  sizeBytes: number
  optimized: boolean
}

export const milestoneUploadService = {
  /**
   * Validate file type (Prompt 3.2)
   */
  validateFileType(mimeType: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimeType.toLowerCase())
  },

  /**
   * Get evidence type from MIME type (Prompt 3.2)
   */
  getEvidenceTypeFromMime(mimeType: string): string {
    if (ALLOWED_IMAGE_TYPES.includes(mimeType.toLowerCase())) {
      return 'PHOTO'
    }
    if (ALLOWED_DOCUMENT_TYPES.includes(mimeType.toLowerCase())) {
      return 'DOCUMENT'
    }
    if (ALLOWED_VIDEO_TYPES.includes(mimeType.toLowerCase())) {
      return 'VIDEO'
    }
    return 'OTHER'
  },

  /**
   * Validate file for upload (Prompt 3.2)
   */
  validateFile(file: { name: string; size: number; type: string }): {
    valid: boolean
    errors: string[]
    evidenceType: string | null
  } {
    const errors: string[] = []
    let evidenceType: string | null = null

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`File "${file.name}" exceeds maximum size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
    }

    // Check file type
    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_VIDEO_TYPES]
    if (!this.validateFileType(file.type, allowedTypes)) {
      errors.push(`File type "${file.type}" is not allowed. Allowed types: images (JPEG, PNG, WebP), documents (PDF, DOC, DOCX), videos (MP4, WebM, MOV)`)
    } else {
      evidenceType = this.getEvidenceTypeFromMime(file.type)
    }

    return {
      valid: errors.length === 0,
      errors,
      evidenceType,
    }
  },

  /**
   * Optimize file (Prompt 3.2)
   * In production, this would use libraries like sharp for images, pdf-lib for PDFs
   * For now, we return metadata about what optimization would be done
   */
  async optimizeFile(
    fileBuffer: Buffer,
    mimeType: string,
    originalFileName: string
  ): Promise<{ optimizedBuffer: Buffer; optimized: boolean; metadata: Record<string, unknown> }> {
    const evidenceType = this.getEvidenceTypeFromMime(mimeType)

    // For now, we just return the original file
    // In production, you would:
    // - Compress images using sharp or similar
    // - Optimize PDFs (remove metadata, compress)
    // - Compress videos using ffmpeg or similar

    const metadata: Record<string, unknown> = {
      originalSize: fileBuffer.length,
      evidenceType,
      optimizationApplied: false,
      note: 'File optimization will be implemented in production using image/video compression libraries',
    }

    return {
      optimizedBuffer: fileBuffer,
      optimized: false, // Set to true when actual optimization is implemented
      metadata,
    }
  },

  /**
   * Upload file to storage (Prompt 3.2)
   * In production, this would upload to S3, R2, or similar
   * For now, we simulate by generating a URL
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    projectId: string,
    milestoneId: string
  ): Promise<FileUploadResult> {
    // Validate file
    const fileInfo = {
      name: fileName,
      size: fileBuffer.length,
      type: mimeType,
    }
    const validation = this.validateFile(fileInfo)

    if (!validation.valid) {
      throw new ValidationError(`File validation failed: ${validation.errors.join(', ')}`)
    }

    if (!validation.evidenceType) {
      throw new ValidationError('Could not determine evidence type from file')
    }

    // Optimize file (placeholder for production)
    const { optimizedBuffer, optimized, metadata } = await this.optimizeFile(
      fileBuffer,
      mimeType,
      fileName
    )

    // In production, upload to S3/R2/etc
    // For now, generate a placeholder URL
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileUrl = `${process.env.FILE_STORAGE_URL || 'https://storage.example.com'}/projects/${projectId}/milestones/${milestoneId}/${timestamp}_${sanitizedFileName}`

    return {
      fileUrl,
      fileName: sanitizedFileName,
      mimeType,
      sizeBytes: optimizedBuffer.length,
      optimized,
    }
  },
}
