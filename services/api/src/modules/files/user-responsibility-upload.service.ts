/**
 * User Responsibility Upload Service
 * Implements file upload validation rules from Kealee_User_Responsibilities_Guide.md Section 10
 */

import { fileService } from './file.service'
import { FileCategory, UploadedByRole } from '@prisma/client'
import { prismaAny } from '../../utils/prisma-helper'

// File validation rules from User Responsibilities Guide Section 10
export const PHOTO_REQUIREMENTS = {
  SITE_VISIT: {
    formats: ['image/jpeg', 'image/png', 'image/heic'],
    maxSize: 20 * 1024 * 1024, // 20MB
    minResolution: [1000, 1000],
    maxQuantity: 20,
  },
  PORTFOLIO: {
    formats: ['image/jpeg', 'image/png'],
    maxSize: 10 * 1024 * 1024, // 10MB
    minResolution: [1200, 800],
    maxQuantity: 30,
  },
  EXISTING_CONDITION: {
    formats: ['image/jpeg', 'image/png'],
    maxSize: 20 * 1024 * 1024, // 20MB
    minResolution: [0, 0], // Any resolution
    maxQuantity: 10,
  },
  RECEIPT: {
    formats: ['image/jpeg', 'image/png'],
    maxSize: 10 * 1024 * 1024, // 10MB
    minResolution: [0, 0], // Must be readable
    maxQuantity: null, // No limit
  },
  PROFILE_LOGO: {
    formats: ['image/jpeg', 'image/png', 'image/svg+xml'],
    maxSize: 5 * 1024 * 1024, // 5MB
    minResolution: [200, 200],
    maxQuantity: 1,
  },
  INSPECTION_CORRECTION: {
    formats: ['image/jpeg', 'image/png'],
    maxSize: 20 * 1024 * 1024, // 20MB
    minResolution: [1000, 1000],
    maxQuantity: 10,
  },
  DESIGN_RENDERING: {
    formats: ['image/jpeg', 'image/png'],
    maxSize: 30 * 1024 * 1024, // 30MB
    minResolution: [2000, 1500],
    maxQuantity: 15,
  },
} as const

export const DOCUMENT_REQUIREMENTS = {
  CONTRACTOR_LICENSE: {
    formats: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSize: 10 * 1024 * 1024, // 10MB
    uploadedBy: ['CONTRACTOR'] as UploadedByRole[],
  },
  INSURANCE_CERTIFICATE: {
    formats: ['application/pdf'],
    maxSize: 10 * 1024 * 1024, // 10MB
    uploadedBy: ['CONTRACTOR'] as UploadedByRole[],
  },
  FLOOR_PLANS: {
    formats: ['application/pdf'],
    maxSize: 50 * 1024 * 1024, // 50MB
    uploadedBy: ['HOMEOWNER', 'DEVELOPER', 'ARCHITECT'] as UploadedByRole[],
  },
  DESIGN_FILES: {
    formats: ['application/pdf', 'application/acad', 'application/x-dwg'],
    maxSize: 100 * 1024 * 1024, // 100MB
    uploadedBy: ['ARCHITECT'] as UploadedByRole[],
  },
  STAMPED_DRAWINGS: {
    formats: ['application/pdf'],
    maxSize: 50 * 1024 * 1024, // 50MB
    uploadedBy: ['ARCHITECT'] as UploadedByRole[],
  },
  SPECIFICATIONS: {
    formats: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSize: 25 * 1024 * 1024, // 25MB
    uploadedBy: ['ARCHITECT'] as UploadedByRole[],
  },
  PERMIT_APPLICATION: {
    formats: ['application/pdf'],
    maxSize: 25 * 1024 * 1024, // 25MB
    uploadedBy: ['CONTRACTOR', 'KEALEE_PM'] as UploadedByRole[],
  },
  PERMIT_APPROVAL: {
    formats: ['application/pdf'],
    maxSize: 10 * 1024 * 1024, // 10MB
    uploadedBy: ['KEALEE_PM'] as UploadedByRole[],
  },
  SUBCONTRACTOR_INVOICE: {
    formats: ['application/pdf'],
    maxSize: 10 * 1024 * 1024, // 10MB
    uploadedBy: ['CONTRACTOR'] as UploadedByRole[],
  },
  LIEN_WAIVER: {
    formats: ['application/pdf'],
    maxSize: 5 * 1024 * 1024, // 5MB
    uploadedBy: ['CONTRACTOR'] as UploadedByRole[],
  },
  WARRANTY: {
    formats: ['application/pdf'],
    maxSize: 10 * 1024 * 1024, // 10MB
    uploadedBy: ['CONTRACTOR'] as UploadedByRole[],
  },
  AS_BUILT: {
    formats: ['application/pdf'],
    maxSize: 50 * 1024 * 1024, // 50MB
    uploadedBy: ['CONTRACTOR', 'ARCHITECT'] as UploadedByRole[],
  },
  RECEIPT: {
    formats: ['image/jpeg', 'image/png', 'application/pdf'],
    maxSize: 10 * 1024 * 1024, // 10MB
    uploadedBy: ['CONTRACTOR', 'KEALEE_PM'] as UploadedByRole[],
  },
} as const

// Role-based upload permissions
export const ROLE_UPLOAD_PERMISSIONS: Record<UploadedByRole, FileCategory[]> = {
  HOMEOWNER: [
    'EXISTING_CONDITION_PHOTO',
    'FLOOR_PLAN',
  ],
  DEVELOPER: [
    'EXISTING_CONDITION_PHOTO',
    'FLOOR_PLAN',
  ],
  PROPERTY_MANAGER: [
    'EXISTING_CONDITION_PHOTO',
  ],
  CONTRACTOR: [
    'SITE_PHOTO',
    'PROGRESS_PHOTO',
    'RECEIPT',
    'INVOICE',
    'SUBCONTRACTOR_INVOICE',
    'LICENSE',
    'INSURANCE_CERTIFICATE',
    'WORKERS_COMP_CERTIFICATE',
    'PORTFOLIO_PHOTO',
    'PERMIT_DOCUMENT',
    'PERMIT_APPLICATION',
    'LIEN_WAIVER',
    'WARRANTY',
    'AS_BUILT',
    'INSPECTION_CORRECTION_PHOTO',
  ],
  SUBCONTRACTOR: [
    'SITE_PHOTO',
    'RECEIPT',
    'INVOICE',
    'LICENSE',
    'INSURANCE_CERTIFICATE',
  ],
  ARCHITECT: [
    'FLOOR_PLAN',
    'DESIGN_FILE',
    'STAMPED_DRAWING',
    'AS_BUILT',
    'SPECIFICATION',
    'RENDERING',
    'PORTFOLIO_PHOTO',
    'LICENSE',
  ],
  ENGINEER: [
    'DESIGN_FILE',
    'STAMPED_DRAWING',
    'SPECIFICATION',
    'LICENSE',
  ],
  KEALEE_PM: [
    'SITE_PHOTO',
    'PROGRESS_PHOTO',
    'RECEIPT',
    'PERMIT_DOCUMENT',
    'PERMIT_APPLICATION',
    'PERMIT_APPROVAL',
    'INSPECTION_CORRECTION_PHOTO',
  ],
  KEALEE_ADMIN: [
    'SITE_PHOTO',
    'PROGRESS_PHOTO',
    'RECEIPT',
    'PERMIT_DOCUMENT',
    'PERMIT_APPLICATION',
    'PERMIT_APPROVAL',
    'INSPECTION_CORRECTION_PHOTO',
    'OTHER',
  ],
}

interface UploadFileInput {
  fileBuffer: Buffer
  fileName: string
  mimeType: string
  size: number
  userId: string
  userRole: UploadedByRole
  category: FileCategory
  projectId?: string
  propertyId?: string
  milestoneId?: string
  leadId?: string
  organizationId?: string
  description?: string
  location?: string
  tags?: string[]
}

interface FileUploadResponse {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  category: FileCategory
  uploadedById: string
  uploadedByRole: UploadedByRole
  uploadedAt: Date
}

export class UserResponsibilityUploadService {
  /**
   * Validate if user role has permission to upload this file category
   */
  validateRolePermission(userRole: UploadedByRole, category: FileCategory): {
    allowed: boolean
    error?: string
  } {
    const allowedCategories = ROLE_UPLOAD_PERMISSIONS[userRole]
    
    if (!allowedCategories.includes(category)) {
      return {
        allowed: false,
        error: `User role ${userRole} is not permitted to upload ${category} files`,
      }
    }

    return { allowed: true }
  }

  /**
   * Validate file against category-specific requirements
   */
  validateCategoryRequirements(
    mimeType: string,
    size: number,
    category: FileCategory
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Map FileCategory to requirement keys
    const categoryRequirements = this.getCategoryRequirements(category)

    if (!categoryRequirements) {
      return { valid: true, errors: [] }
    }

    // Validate format
    if (!categoryRequirements.formats.includes(mimeType)) {
      errors.push(
        `File type ${mimeType} not allowed for ${category}. Allowed types: ${categoryRequirements.formats.join(', ')}`
      )
    }

    // Validate size
    if (size > categoryRequirements.maxSize) {
      const maxSizeMB = (categoryRequirements.maxSize / 1024 / 1024).toFixed(2)
      const fileSizeMB = (size / 1024 / 1024).toFixed(2)
      errors.push(
        `File size ${fileSizeMB}MB exceeds maximum allowed ${maxSizeMB}MB for ${category}`
      )
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get category-specific requirements
   */
  private getCategoryRequirements(
    category: FileCategory
  ): { formats: string[]; maxSize: number; uploadedBy?: UploadedByRole[] } | null {
    const categoryMap: Record<string, keyof typeof PHOTO_REQUIREMENTS | keyof typeof DOCUMENT_REQUIREMENTS> = {
      SITE_PHOTO: 'SITE_VISIT',
      PROGRESS_PHOTO: 'SITE_VISIT',
      PORTFOLIO_PHOTO: 'PORTFOLIO',
      EXISTING_CONDITION_PHOTO: 'EXISTING_CONDITION',
      RECEIPT: 'RECEIPT',
      PROFILE_PHOTO: 'PROFILE_LOGO',
      COMPANY_LOGO: 'PROFILE_LOGO',
      INSPECTION_CORRECTION_PHOTO: 'INSPECTION_CORRECTION',
      RENDERING: 'DESIGN_RENDERING',
      LICENSE: 'CONTRACTOR_LICENSE',
      INSURANCE_CERTIFICATE: 'INSURANCE_CERTIFICATE',
      FLOOR_PLAN: 'FLOOR_PLANS',
      DESIGN_FILE: 'DESIGN_FILES',
      STAMPED_DRAWING: 'STAMPED_DRAWINGS',
      SPECIFICATION: 'SPECIFICATIONS',
      PERMIT_DOCUMENT: 'PERMIT_APPLICATION',
      PERMIT_APPLICATION: 'PERMIT_APPLICATION',
      PERMIT_APPROVAL: 'PERMIT_APPROVAL',
      SUBCONTRACTOR_INVOICE: 'SUBCONTRACTOR_INVOICE',
      LIEN_WAIVER: 'LIEN_WAIVER',
      WARRANTY: 'WARRANTY',
      AS_BUILT: 'AS_BUILT',
    }

    const requirementKey = categoryMap[category]
    if (!requirementKey) return null

    // Check photo requirements first
    if (requirementKey in PHOTO_REQUIREMENTS) {
      return PHOTO_REQUIREMENTS[requirementKey as keyof typeof PHOTO_REQUIREMENTS]
    }

    // Check document requirements
    if (requirementKey in DOCUMENT_REQUIREMENTS) {
      return DOCUMENT_REQUIREMENTS[requirementKey as keyof typeof DOCUMENT_REQUIREMENTS]
    }

    return null
  }

  /**
   * Upload file with user responsibility validation
   */
  async uploadFile(input: UploadFileInput): Promise<FileUploadResponse> {
    const {
      fileBuffer,
      fileName,
      mimeType,
      size,
      userId,
      userRole,
      category,
      projectId,
      propertyId,
      milestoneId,
      leadId,
      organizationId,
      description,
      location,
      tags,
    } = input

    // 1. Validate role permission
    const roleValidation = this.validateRolePermission(userRole, category)
    if (!roleValidation.allowed) {
      throw new Error(roleValidation.error)
    }

    // 2. Validate category-specific requirements
    const categoryValidation = this.validateCategoryRequirements(mimeType, size, category)
    if (!categoryValidation.valid) {
      throw new Error(categoryValidation.errors.join('; '))
    }

    // 3. Upload file using base file service
    const uploadResult = await fileService.uploadFile(
      fileBuffer,
      fileName,
      mimeType,
      size,
      userId,
      this.getFolderPath(category, projectId),
      {
        category,
        userRole,
        projectId: projectId || '',
        ...(description && { description }),
      }
    )

    // 4. Create FileUpload record in database
    const fileUpload = await prismaAny.fileUpload.create({
      data: {
        fileName: uploadResult.fileName,
        fileUrl: uploadResult.url,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.fileType,
        category,
        projectId,
        propertyId,
        milestoneId,
        leadId,
        organizationId,
        uploadedById: userId,
        uploadedByRole: userRole,
        description,
        location,
        tags: tags || [],
        metadata: {
          s3Key: uploadResult.s3Key,
        },
      },
    })

    // 5. Log user action for audit
    await prismaAny.userAction.create({
      data: {
        userId,
        userRole,
        action: 'UPLOAD_FILE',
        entity: 'FileUpload',
        entityId: fileUpload.id,
        projectId,
        organizationId,
        details: {
          category,
          fileName,
          fileSize: size,
        },
      },
    })

    return {
      id: fileUpload.id,
      fileName: fileUpload.fileName,
      fileUrl: fileUpload.fileUrl,
      fileSize: fileUpload.fileSize,
      mimeType: fileUpload.mimeType,
      category: fileUpload.category,
      uploadedById: fileUpload.uploadedById,
      uploadedByRole: fileUpload.uploadedByRole,
      uploadedAt: fileUpload.createdAt,
    }
  }

  /**
   * Get appropriate folder path for file category
   */
  private getFolderPath(category: FileCategory, projectId?: string): string {
    const basePath = projectId ? `projects/${projectId}` : 'uploads'

    const categoryFolders: Partial<Record<FileCategory, string>> = {
      SITE_PHOTO: 'site-photos',
      PROGRESS_PHOTO: 'progress-photos',
      RECEIPT: 'receipts',
      INVOICE: 'invoices',
      LICENSE: 'licenses',
      INSURANCE_CERTIFICATE: 'insurance',
      PERMIT_DOCUMENT: 'permits',
      DESIGN_FILE: 'designs',
      PORTFOLIO_PHOTO: 'portfolio',
      WARRANTY: 'warranties',
    }

    const folder = categoryFolders[category] || 'documents'
    return `${basePath}/${folder}`
  }

  /**
   * Batch upload files (e.g., multiple site photos)
   */
  async uploadBatch(
    files: Array<{
      fileBuffer: Buffer
      fileName: string
      mimeType: string
      size: number
    }>,
    commonInput: Omit<UploadFileInput, 'fileBuffer' | 'fileName' | 'mimeType' | 'size'>
  ): Promise<FileUploadResponse[]> {
    const results: FileUploadResponse[] = []
    const errors: Array<{ fileName: string; error: string }> = []

    for (const file of files) {
      try {
        const result = await this.uploadFile({
          ...file,
          ...commonInput,
        })
        results.push(result)
      } catch (error: any) {
        errors.push({
          fileName: file.fileName,
          error: error.message,
        })
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw new Error(`All uploads failed: ${JSON.stringify(errors)}`)
    }

    return results
  }

  /**
   * Get file upload by ID with access control
   */
  async getFileUpload(fileId: string, userId: string, userRole: string): Promise<any> {
    const fileUpload = await prismaAny.fileUpload.findUnique({
      where: { id: fileId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            clientId: true,
            orgId: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!fileUpload) {
      throw new Error('File not found')
    }

    // Check access permissions
    const hasAccess = this.checkFileAccess(fileUpload, userId, userRole)
    if (!hasAccess) {
      throw new Error('Access denied')
    }

    return fileUpload
  }

  /**
   * Check if user has access to view/download file
   */
  private checkFileAccess(fileUpload: any, userId: string, userRole: string): boolean {
    // Uploader always has access
    if (fileUpload.uploadedById === userId) {
      return true
    }

    // Kealee PM and Admin have access to all files
    if (userRole === 'KEALEE_PM' || userRole === 'KEALEE_ADMIN') {
      return true
    }

    // Project members have access to project files
    if (fileUpload.projectId && fileUpload.project) {
      // TODO: Check if user is project member (client, contractor, or PM)
      // For now, return false
      return false
    }

    return false
  }

  /**
   * List files for a project
   */
  async listProjectFiles(
    projectId: string,
    userId: string,
    userRole: string,
    filters?: {
      category?: FileCategory
      uploadedByRole?: UploadedByRole
      limit?: number
      offset?: number
    }
  ) {
    const { category, uploadedByRole, limit = 50, offset = 0 } = filters || {}

    const where: any = {
      projectId,
    }

    if (category) {
      where.category = category
    }

    if (uploadedByRole) {
      where.uploadedByRole = uploadedByRole
    }

    const [files, total] = await Promise.all([
      prismaAny.fileUpload.findMany({
        where,
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prismaAny.fileUpload.count({ where }),
    ])

    return {
      files,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + files.length < total,
      },
    }
  }
}

export const userResponsibilityUploadService = new UserResponsibilityUploadService()
