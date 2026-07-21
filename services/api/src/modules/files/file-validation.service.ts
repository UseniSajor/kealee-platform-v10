/**
 * File Validation Service
 * Validates file types, sizes, and content
 */

// Allowed MIME types by category
export const ALLOWED_FILE_TYPES = {
  image: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
  drawing: [
    'application/pdf',
    'image/dwg',
    'application/acad',
    'application/x-dwg',
    'application/octet-stream', // DWG files
  ],
  video: [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
  ],
  archive: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ],
} as const

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  document: 50 * 1024 * 1024, // 50MB
  drawing: 100 * 1024 * 1024, // 100MB
  video: 500 * 1024 * 1024, // 500MB
  archive: 200 * 1024 * 1024, // 200MB
  default: 50 * 1024 * 1024, // 50MB
} as const

// Dangerous file extensions to block
export const DANGEROUS_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.com',
  '.pif',
  '.scr',
  '.vbs',
  '.js',
  '.jar',
  '.app',
  '.deb',
  '.pkg',
  '.rpm',
  '.msi',
  '.dmg',
]

export class FileValidationService {
  /**
   * Validate file type
   */
  validateFileType(
    mimeType: string,
    fileName: string,
    allowedCategories: (keyof typeof ALLOWED_FILE_TYPES)[] = ['image', 'document']
  ): { valid: boolean; error?: string } {
    // Check file extension
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    if (DANGEROUS_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: `File extension ${extension} is not allowed for security reasons`,
      }
    }

    // Check MIME type
    const allowedTypes = allowedCategories.flatMap((cat) => ALLOWED_FILE_TYPES[cat])
    
    if (!allowedTypes.includes(mimeType as any)) {
      return {
        valid: false,
        error: `File type ${mimeType} is not allowed. Allowed types: ${allowedCategories.join(', ')}`,
      }
    }

    return { valid: true }
  }

  /**
   * Validate file size
   */
  validateFileSize(
    size: number,
    category: keyof typeof FILE_SIZE_LIMITS = 'default'
  ): { valid: boolean; error?: string; maxSize?: number } {
    const maxSize = FILE_SIZE_LIMITS[category] || FILE_SIZE_LIMITS.default

    if (size > maxSize) {
      return {
        valid: false,
        error: `File size ${(size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
        maxSize,
      }
    }

    return { valid: true, maxSize }
  }

  /**
   * Detect file category from MIME type
   */
  detectFileCategory(mimeType: string): keyof typeof FILE_SIZE_LIMITS {
    if (ALLOWED_FILE_TYPES.image.includes(mimeType as any)) return 'image'
    if (ALLOWED_FILE_TYPES.document.includes(mimeType as any)) return 'document'
    if (ALLOWED_FILE_TYPES.drawing.includes(mimeType as any)) return 'drawing'
    if (ALLOWED_FILE_TYPES.video.includes(mimeType as any)) return 'video'
    if (ALLOWED_FILE_TYPES.archive.includes(mimeType as any)) return 'archive'
    return 'default'
  }

  /**
   * Validate file (type + size)
   */
  validateFile(
    fileName: string,
    mimeType: string,
    size: number,
    allowedCategories?: (keyof typeof ALLOWED_FILE_TYPES)[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const category = this.detectFileCategory(mimeType)

    // Validate type
    const typeResult = this.validateFileType(mimeType, fileName, allowedCategories)
    if (!typeResult.valid) {
      errors.push(typeResult.error!)
    }

    // Validate size
    const sizeResult = this.validateFileSize(size, category)
    if (!sizeResult.valid) {
      errors.push(sizeResult.error!)
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

export const fileValidationService = new FileValidationService()
