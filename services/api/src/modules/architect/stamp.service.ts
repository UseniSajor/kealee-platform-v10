import { prisma } from '@kealee/database'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'
import crypto from 'crypto'

export const stampService = {
  /**
   * Create stamp template
   */
  async createStampTemplate(data: {
    userId: string
    stampType: string
    stampName: string
    licenseNumber: string
    licenseState: string
    licenseExpirationDate?: Date
    sealImageUrl?: string
    sealImageData?: any
    metadata?: any
  }) {
    // Check if license validation exists
    const licenseValidation = await prisma.licenseValidation.findFirst({
      where: {
        userId: data.userId,
        licenseNumber: data.licenseNumber,
        licenseState: data.licenseState as any,
      },
    })

    if (!licenseValidation || !licenseValidation.isValid) {
      throw new ValidationError('License must be validated before creating stamp template')
    }

    const stampTemplate = await prisma.stampTemplate.create({
      data: {
        userId: data.userId,
        stampType: data.stampType as any,
        stampName: data.stampName,
        licenseNumber: data.licenseNumber,
        licenseState: data.licenseState as any,
        licenseExpirationDate: data.licenseExpirationDate,
        sealImageUrl: data.sealImageUrl,
        sealImageData: data.sealImageData as any,
        metadata: data.metadata as any,
        status: licenseValidation.isValid ? 'ACTIVE' : 'PENDING_VERIFICATION',
        isVerified: licenseValidation.isValid,
        verifiedAt: licenseValidation.isValid ? new Date() : null,
        expiresAt: data.licenseExpirationDate || licenseValidation.expirationDate,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'STAMP_TEMPLATE_CREATED',
      entityType: 'StampTemplate',
      entityId: stampTemplate.id,
      userId: data.userId,
      reason: `Stamp template created: ${data.stampName}`,
      after: {
        stampType: data.stampType,
        licenseNumber: data.licenseNumber,
        licenseState: data.licenseState,
      },
    })

    return stampTemplate
  },

  /**
   * Get stamp template
   */
  async getStampTemplate(templateId: string, userId?: string) {
    const where: any = { id: templateId }

    if (userId) {
      where.userId = userId
    }

    const template = await prisma.stampTemplate.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    })

    if (!template) {
      throw new NotFoundError('StampTemplate', templateId)
    }

    return template
  },

  /**
   * List stamp templates
   */
  async listStampTemplates(filters?: {
    userId?: string
    stampType?: string
    licenseState?: string
    status?: string
    isVerified?: boolean
  }) {
    const where: any = {}

    if (filters?.userId) {
      where.userId = filters.userId
    }

    if (filters?.stampType) {
      where.stampType = filters.stampType
    }

    if (filters?.licenseState) {
      where.licenseState = filters.licenseState
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.isVerified !== undefined) {
      where.isVerified = filters.isVerified
    }

    const templates = await prisma.stampTemplate.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return templates
  },

  /**
   * Verify stamp template
   */
  async verifyStampTemplate(templateId: string, data: {
    isVerified: boolean
    verificationNotes?: string
    verifiedBy: string
  }) {
    const template = await prisma.stampTemplate.findUnique({
      where: { id: templateId },
    })

    if (!template) {
      throw new NotFoundError('StampTemplate', templateId)
    }

    const updated = await prisma.stampTemplate.update({
      where: { id: templateId },
      data: {
        isVerified: data.isVerified,
        verifiedAt: data.isVerified ? new Date() : null,
        verifiedBy: data.isVerified ? data.verifiedBy : null,
        verificationNotes: data.verificationNotes,
        status: data.isVerified ? 'ACTIVE' : 'REVOKED',
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'STAMP_TEMPLATE_VERIFIED',
      entityType: 'StampTemplate',
      entityId: templateId,
      userId: data.verifiedBy,
      reason: data.verificationNotes || `Stamp template ${data.isVerified ? 'verified' : 'rejected'}`,
      after: {
        isVerified: data.isVerified,
        status: updated.status,
      },
    })

    return updated
  },

  /**
   * Apply stamp to document
   */
  async applyStamp(data: {
    designProjectId: string
    stampTemplateId: string
    targetType: string
    targetId: string
    positionX?: number
    positionY?: number
    positionData?: any
    scale?: number
    rotation?: number
    appliedById: string
  }) {
    // Verify stamp template is active and verified
    const template = await prisma.stampTemplate.findUnique({
      where: { id: data.stampTemplateId },
    })

    if (!template) {
      throw new NotFoundError('StampTemplate', data.stampTemplateId)
    }

    if (template.status !== 'ACTIVE' || !template.isVerified) {
      throw new ValidationError('Stamp template must be active and verified to apply')
    }

    if (template.expiresAt && template.expiresAt < new Date()) {
      throw new ValidationError('Stamp template has expired')
    }

    // Generate tamper-evident hash
    // TODO: Implement actual document hash calculation
    const tamperEvidentHash = crypto
      .createHash('sha256')
      .update(`${data.targetId}-${data.stampTemplateId}-${Date.now()}`)
      .digest('hex')

    const application = await prisma.stampApplication.create({
      data: {
        designProjectId: data.designProjectId,
        stampTemplateId: data.stampTemplateId,
        targetType: data.targetType,
        targetId: data.targetId,
        applicationStatus: 'APPLIED',
        appliedAt: new Date(),
        appliedById: data.appliedById,
        positionX: data.positionX ? data.positionX.toString() : null,
        positionY: data.positionY ? data.positionY.toString() : null,
        positionData: data.positionData as any,
        scale: data.scale ? data.scale.toString() : null,
        rotation: data.rotation ? data.rotation.toString() : null,
        tamperEvidentHash,
        appliedDocumentHash: tamperEvidentHash, // Placeholder - should be actual document hash
      },
      include: {
        stampTemplate: {
          select: {
            id: true,
            stampName: true,
            stampType: true,
            licenseNumber: true,
            licenseState: true,
          },
        },
        appliedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Create stamp log entry
    await prisma.stampLog.create({
      data: {
        stampApplicationId: application.id,
        actionType: 'APPLIED',
        actionDescription: `Stamp applied to ${data.targetType}: ${data.targetId}`,
        performedById: data.appliedById,
        newStatus: 'APPLIED',
        actionData: {
          targetType: data.targetType,
          targetId: data.targetId,
          position: {
            x: data.positionX,
            y: data.positionY,
          },
        } as any,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'STAMP_APPLIED',
      entityType: 'StampApplication',
      entityId: application.id,
      userId: data.appliedById,
      reason: `Stamp applied to ${data.targetType}`,
      after: {
        targetType: data.targetType,
        targetId: data.targetId,
      },
    })

    return application
  },

  /**
   * Get stamp application
   */
  async getStampApplication(applicationId: string) {
    const application = await prisma.stampApplication.findUnique({
      where: { id: applicationId },
      include: {
        stampTemplate: {
          select: {
            id: true,
            stampName: true,
            stampType: true,
            licenseNumber: true,
            licenseState: true,
            sealImageUrl: true,
          },
        },
        appliedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        logEntries: {
          orderBy: {
            performedAt: 'desc',
          },
          take: 10,
        },
      },
    })

    if (!application) {
      throw new NotFoundError('StampApplication', applicationId)
    }

    return application
  },

  /**
   * List stamp applications
   */
  async listStampApplications(designProjectId: string, filters?: {
    targetType?: string
    targetId?: string
    applicationStatus?: string
    stampTemplateId?: string
  }) {
    const where: any = {
      designProjectId,
    }

    if (filters?.targetType) {
      where.targetType = filters.targetType
    }

    if (filters?.targetId) {
      where.targetId = filters.targetId
    }

    if (filters?.applicationStatus) {
      where.applicationStatus = filters.applicationStatus
    }

    if (filters?.stampTemplateId) {
      where.stampTemplateId = filters.stampTemplateId
    }

    const applications = await prisma.stampApplication.findMany({
      where,
      include: {
        stampTemplate: {
          select: {
            id: true,
            stampName: true,
            stampType: true,
          },
        },
        appliedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        appliedAt: 'desc',
      },
    })

    return applications
  },

  /**
   * Verify stamp application
   */
  async verifyStampApplication(applicationId: string, data: {
    isVerified: boolean
    verificationNotes?: string
    verifiedById: string
  }) {
    const application = await prisma.stampApplication.findUnique({
      where: { id: applicationId },
    })

    if (!application) {
      throw new NotFoundError('StampApplication', applicationId)
    }

    const newStatus = data.isVerified ? 'VERIFIED' : 'REJECTED'

    const updated = await prisma.stampApplication.update({
      where: { id: applicationId },
      data: {
        applicationStatus: newStatus as any,
        verifiedAt: new Date(),
        verifiedById: data.verifiedById,
        verificationNotes: data.verificationNotes,
      },
    })

    // Create stamp log entry
    await prisma.stampLog.create({
      data: {
        stampApplicationId: applicationId,
        actionType: data.isVerified ? 'VERIFIED' : 'REJECTED',
        actionDescription: data.verificationNotes || `Stamp application ${data.isVerified ? 'verified' : 'rejected'}`,
        performedById: data.verifiedById,
        previousStatus: application.applicationStatus,
        newStatus,
        actionData: {
          verificationNotes: data.verificationNotes,
        } as any,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'STAMP_APPLICATION_VERIFIED',
      entityType: 'StampApplication',
      entityId: applicationId,
      userId: data.verifiedById,
      reason: data.verificationNotes || `Stamp application ${data.isVerified ? 'verified' : 'rejected'}`,
      after: {
        applicationStatus: newStatus,
      },
    })

    return updated
  },

  /**
   * Check for tampering
   */
  async checkTampering(applicationId: string, currentDocumentHash: string) {
    const application = await prisma.stampApplication.findUnique({
      where: { id: applicationId },
    })

    if (!application) {
      throw new NotFoundError('StampApplication', applicationId)
    }

    const tamperDetected = application.appliedDocumentHash !== currentDocumentHash

    if (tamperDetected) {
      // Create stamp log entry for tamper detection
      await prisma.stampLog.create({
        data: {
          stampApplicationId: applicationId,
          actionType: 'TAMPER_DETECTED',
          actionDescription: 'Document tampering detected - hash mismatch',
          performedById: application.appliedById || '',
          tamperDetected: true,
          tamperDetails: `Expected hash: ${application.appliedDocumentHash}, Current hash: ${currentDocumentHash}`,
          actionData: {
            expectedHash: application.appliedDocumentHash,
            currentHash: currentDocumentHash,
          } as any,
        },
      })

      // Update application status
      await prisma.stampApplication.update({
        where: { id: applicationId },
        data: {
          applicationStatus: 'REJECTED',
        },
      })
    }

    return {
      tamperDetected,
      expectedHash: application.appliedDocumentHash,
      currentHash: currentDocumentHash,
    }
  },

  /**
   * Get stamp log
   */
  async getStampLog(applicationId: string) {
    const logEntries = await prisma.stampLog.findMany({
      where: {
        stampApplicationId: applicationId,
      },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        performedAt: 'desc',
      },
    })

    return logEntries
  },

  /**
   * Validate license
   */
  async validateLicense(data: {
    userId: string
    licenseNumber: string
    licenseState: string
    licenseType: string
    licenseeName: string
    validatedBy?: string
  }) {
    // Check if validation already exists
    const existing = await prisma.licenseValidation.findFirst({
      where: {
        userId: data.userId,
        licenseNumber: data.licenseNumber,
        licenseState: data.licenseState as any,
      },
    })

    // TODO: Integrate with state license validation API
    // For now, create a placeholder validation
    const isValid = true // Placeholder - should come from API
    const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now (placeholder)

    if (existing) {
      const updated = await prisma.licenseValidation.update({
        where: { id: existing.id },
        data: {
          isValid,
          validatedAt: new Date(),
          validatedBy: data.validatedBy,
          validationSource: 'API', // or 'MANUAL', 'THIRD_PARTY'
          expirationDate,
          isExpired: expirationDate < new Date(),
          status: isValid ? 'VALID' : 'INVALID',
        },
      })

      return updated
    }

    const validation = await prisma.licenseValidation.create({
      data: {
        userId: data.userId,
        licenseNumber: data.licenseNumber,
        licenseState: data.licenseState as any,
        licenseType: data.licenseType as any,
        licenseeName: data.licenseeName,
        isValid,
        validatedAt: new Date(),
        validatedBy: data.validatedBy,
        validationSource: 'API',
        expirationDate,
        isExpired: expirationDate < new Date(),
        status: isValid ? 'VALID' : 'INVALID',
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'LICENSE_VALIDATED',
      entityType: 'LicenseValidation',
      entityId: validation.id,
      userId: data.userId,
      reason: `License validated: ${data.licenseNumber} (${data.licenseState})`,
      after: {
        isValid,
        licenseNumber: data.licenseNumber,
        licenseState: data.licenseState,
      },
    })

    return validation
  },

  /**
   * Get license validation
   */
  async getLicenseValidation(validationId: string) {
    const validation = await prisma.licenseValidation.findUnique({
      where: { id: validationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!validation) {
      throw new NotFoundError('LicenseValidation', validationId)
    }

    return validation
  },

  /**
   * List license validations
   */
  async listLicenseValidations(filters?: {
    userId?: string
    licenseState?: string
    licenseType?: string
    isValid?: boolean
    status?: string
  }) {
    const where: any = {}

    if (filters?.userId) {
      where.userId = filters.userId
    }

    if (filters?.licenseState) {
      where.licenseState = filters.licenseState
    }

    if (filters?.licenseType) {
      where.licenseType = filters.licenseType
    }

    if (filters?.isValid !== undefined) {
      where.isValid = filters.isValid
    }

    if (filters?.status) {
      where.status = filters.status
    }

    const validations = await prisma.licenseValidation.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        validatedAt: 'desc',
      },
    })

    return validations
  },
}
