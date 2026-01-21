import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'

export const permitPackageService = {
  /**
   * Create permit package
   */
  async createPermitPackage(data: {
    designProjectId: string
    jurisdictionId?: string
    packageName: string
    packageType: string
    permitType?: string
    description?: string
    createdById: string
  }) {
    const package_ = await prismaAny.permitPackage.create({
      data: {
        designProjectId: data.designProjectId,
        jurisdictionId: data.jurisdictionId,
        packageName: data.packageName,
        packageType: data.packageType as any,
        permitType: data.permitType,
        description: data.description,
        status: 'DRAFT',
        createdById: data.createdById,
      },
      include: {
        createdBy: {
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
      action: 'PERMIT_PACKAGE_CREATED',
      entityType: 'PermitPackage',
      entityId: package_.id,
      userId: data.createdById,
      reason: `Permit package created: ${data.packageName}`,
      after: {
        packageName: data.packageName,
        packageType: data.packageType,
      },
    })

    return package_
  },

  /**
   * Get permit package
   */
  async getPermitPackage(packageId: string) {
    const package_ = await prismaAny.permitPackage.findUnique({
      where: { id: packageId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        submittedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        documents: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
        applicationForms: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
            verifiedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        submissions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        reviewComments: {
          where: {
            isResolved: false,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            documents: true,
            applicationForms: true,
            submissions: true,
            reviewComments: true,
          },
        },
      },
    })

    if (!package_) {
      throw new NotFoundError('PermitPackage', packageId)
    }

    return package_
  },

  /**
   * List permit packages
   */
  async listPermitPackages(designProjectId: string, filters?: {
    status?: string
    packageType?: string
  }) {
    const where: any = {
      designProjectId,
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.packageType) {
      where.packageType = filters.packageType
    }

    const packages = await prismaAny.permitPackage.findMany({
      where,
      include: {
        _count: {
          select: {
            documents: true,
            applicationForms: true,
            reviewComments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return packages
  },

  /**
   * Auto-generate permit package from drawings
   */
  async autoGeneratePermitPackage(data: {
    designProjectId: string
    jurisdictionId?: string
    packageName: string
    packageType: string
    permitType?: string
    drawingSheetIds?: string[] // Specific sheets to include
    includeAllDrawings?: boolean // Include all approved drawings
    createdById: string
  }) {
    // Get design project with drawings
    const project = await prismaAny.designProject.findUnique({
      where: { id: data.designProjectId },
      include: {
        drawingSheets: {
          where: {
            status: 'APPROVED', // Only include approved drawings
            ...(data.drawingSheetIds && data.drawingSheetIds.length > 0
              ? { id: { in: data.drawingSheetIds } }
              : {}),
          },
          include: {
            drawingSet: {
              select: {
                id: true,
                setName: true,
              },
            },
          },
        },
      },
    })

    if (!project) {
      throw new NotFoundError('DesignProject', data.designProjectId)
    }

    // Create permit package
    const package_ = await prismaAny.permitPackage.create({
      data: {
        designProjectId: data.designProjectId,
        jurisdictionId: data.jurisdictionId,
        packageName: data.packageName,
        packageType: data.packageType as any,
        permitType: data.permitType,
        status: 'ASSEMBLING',
        createdById: data.createdById,
      },
    })

    // Extract permit-required drawings
    const permitRequiredSheets = project.drawingSheets.filter((sheet: any) => {
      // Filter logic: typically architectural, structural, site plans
      const discipline = sheet.discipline || ''
      return (
        discipline.startsWith('A-') || // Architectural
        discipline.startsWith('S-') || // Structural
        discipline.startsWith('C-') || // Civil/Site
        discipline.startsWith('G-') // General
      )
    })

    // Add drawings as documents
    const documents = await Promise.all(
      permitRequiredSheets.map((sheet: any, index: number) =>
        prismaAny.permitPackageDocument.create({
          data: {
            packageId: package_.id,
            documentType: 'DRAWING',
            documentName: `${sheet.sheetNumber} - ${sheet.sheetName}`,
            documentDescription: sheet.description || undefined,
            sheetNumber: sheet.sheetNumber,
            discipline: sheet.discipline,
            sourceType: 'DRAWING_SHEET',
            sourceId: sheet.id,
            sourceFileUrl: sheet.fileUrl || undefined,
            fileUrl: sheet.fileUrl || '',
            fileName: `${sheet.sheetNumber}_${sheet.sheetName}.pdf`,
            fileType: 'PDF',
            orderIndex: index + 1,
            isRequired: true,
            isIncluded: true,
            metadata: {
              drawingSetId: sheet.drawingSetId,
              drawingSetName: sheet.drawingSet?.setName,
              revision: sheet.currentRevision,
            } as any,
          },
        })
      )
    )

    // Get jurisdiction template if provided
    let template = null
    if (data.jurisdictionId) {
      template = await prismaAny.jurisdictionPermitTemplate.findFirst({
        where: {
          jurisdictionId: data.jurisdictionId,
          templateType: data.packageType as any,
          isActive: true,
        },
      })
    }

    // Generate application forms based on template or default
    const formTypes = template
      ? ((template as any).requiredDocuments?.formTypes || ['BUILDING_PERMIT'])
      : ['BUILDING_PERMIT']

    const applicationForms = await Promise.all(
      formTypes.map((formType: string) =>
        prismaAny.permitApplicationForm.create({
          data: {
            packageId: package_.id,
            formType,
            formName: `${formType} Application`,
            formTemplateId: (template as any)?.id,
            formData: this.generateFormData(project, formType, template),
            isComplete: false,
            createdById: data.createdById,
          },
        })
      )
    )

    // Generate cover sheet and index
    await this.generateCoverSheetAndIndex(package_.id, documents, project)

    // Calculate fees
    const feeCalculation = await this.calculatePermitFees(
      package_.id,
      data.jurisdictionId,
      data.packageType,
      project,
      template
    )

    // Update package with calculated fee
    const updatedPackage = await prismaAny.permitPackage.update({
      where: { id: package_.id },
      data: {
        calculatedFee: feeCalculation.totalFee,
        feeCalculationDetails: feeCalculation as any,
        status: 'READY',
      },
      include: {
        documents: true,
        applicationForms: true,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'PERMIT_PACKAGE_AUTO_GENERATED',
      entityType: 'PermitPackage',
      entityId: package_.id,
      userId: data.createdById,
      reason: `Permit package auto-generated with ${documents.length} documents`,
      after: {
        documentCount: documents.length,
        formCount: applicationForms.length,
        calculatedFee: feeCalculation.totalFee.toString(),
      },
    })

    return updatedPackage
  },

  /**
   * Generate form data for application form
   */
  generateFormData(project: any, formType: string, template: any): any {
    const baseData: any = {
      projectName: project.name,
      projectType: project.projectType,
      projectAddress: project.project?.address || '',
      projectDescription: project.description || '',
      estimatedValue: project.budgetTotal || '',
      startDate: project.startDate || new Date().toISOString(),
    }

    // If template has form field definitions, use them
    if (template?.applicationFormFields) {
      const fields = template.applicationFormFields as any
      Object.keys(fields).forEach((key) => {
        if (fields[key].defaultValue) {
          baseData[key] = fields[key].defaultValue
        }
      })
    }

    return baseData
  },

  /**
   * Generate cover sheet and index
   */
  async generateCoverSheetAndIndex(
    packageId: string,
    documents: any[],
    project: any
  ) {
    // Create cover sheet document
    await prismaAny.permitPackageDocument.create({
      data: {
        packageId,
        documentType: 'COVER_SHEET',
        documentName: 'Permit Package Cover Sheet',
        documentDescription: 'Cover sheet for permit submission',
        sourceType: 'GENERATED',
        fileUrl: '', // TODO: Generate PDF cover sheet
        fileName: 'cover_sheet.pdf',
        fileType: 'PDF',
        orderIndex: 0,
        isRequired: true,
        isIncluded: true,
        metadata: {
          projectName: project.name,
          generatedAt: new Date().toISOString(),
        } as any,
      },
    })

    // Create index document
    await prismaAny.permitPackageDocument.create({
      data: {
        packageId,
        documentType: 'INDEX',
        documentName: 'Permit Package Index',
        documentDescription: 'Index of all documents in package',
        sourceType: 'GENERATED',
        fileUrl: '', // TODO: Generate PDF index
        fileName: 'index.pdf',
        fileType: 'PDF',
        orderIndex: documents.length + 1,
        isRequired: true,
        isIncluded: true,
        metadata: {
          documentCount: documents.length,
          documents: documents.map((d) => ({
            sheetNumber: d.sheetNumber,
            name: d.documentName,
            discipline: d.discipline,
          })),
        } as any,
      },
    })
  },

  /**
   * Calculate permit fees
   */
  async calculatePermitFees(
    packageId: string,
    jurisdictionId: string | undefined,
    packageType: string,
    project: any,
    template: any
  ): Promise<{
    baseFee: number
    valuationFee: number
    documentFee: number
    expeditedFee: number
    totalFee: number
    breakdown: any[]
  }> {
    let baseFee = 0
    let valuationFee = 0
    let documentFee = 0
    let expeditedFee = 0

    // If template has fee calculation rules, use them
    if (template?.feeCalculationRules) {
      const rules = template.feeCalculationRules as any

      // Base fee
      if (rules.baseFee) {
        baseFee = parseFloat(rules.baseFee) || 0
      }

      // Valuation-based fee
      if (rules.valuationFeeRate && project.budgetTotal) {
        const valuation = parseFloat(project.budgetTotal)
        const rate = parseFloat(rules.valuationFeeRate) || 0
        valuationFee = valuation * (rate / 100)
      }

      // Document fee (per sheet)
      if (rules.documentFeePerSheet) {
        const sheetCount = 10 // TODO: Get actual sheet count
        const perSheet = parseFloat(rules.documentFeePerSheet) || 0
        documentFee = sheetCount * perSheet
      }
    } else {
      // Default fee calculation
      baseFee = 500 // Default base fee
      if (project.budgetTotal) {
        const valuation = parseFloat(project.budgetTotal)
        valuationFee = valuation * 0.01 // 1% of project value
      }
      documentFee = 10 * 5 // $5 per sheet, assume 10 sheets
    }

    const totalFee = baseFee + valuationFee + documentFee + expeditedFee

    return {
      baseFee,
      valuationFee,
      documentFee,
      expeditedFee,
      totalFee,
      breakdown: [
        { type: 'Base Fee', amount: baseFee },
        { type: 'Valuation Fee', amount: valuationFee },
        { type: 'Document Fee', amount: documentFee },
        { type: 'Expedited Fee', amount: expeditedFee },
        { type: 'Total', amount: totalFee },
      ],
    }
  },

  /**
   * Add document to package
   */
  async addDocumentToPackage(packageId: string, data: {
    documentType: string
    documentName: string
    documentDescription?: string
    sheetNumber?: string
    discipline?: string
    sourceType: string
    sourceId?: string
    sourceFileUrl?: string
    fileUrl: string
    fileName: string
    fileSize?: number
    fileType?: string
    pageCount?: number
    isRequired?: boolean
    metadata?: any
  }) {
    const package_ = await prismaAny.permitPackage.findUnique({
      where: { id: packageId },
    })

    if (!package_) {
      throw new NotFoundError('PermitPackage', packageId)
    }

    // Get current max order index
    const maxOrder = await prismaAny.permitPackageDocument.findFirst({
      where: { packageId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    })

    const document = await prismaAny.permitPackageDocument.create({
      data: {
        packageId,
        documentType: data.documentType as any,
        documentName: data.documentName,
        documentDescription: data.documentDescription,
        sheetNumber: data.sheetNumber,
        discipline: data.discipline,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        sourceFileUrl: data.sourceFileUrl,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        pageCount: data.pageCount,
        orderIndex: (maxOrder?.orderIndex || 0) + 1,
        isRequired: data.isRequired !== false,
        isIncluded: true,
        metadata: data.metadata as any,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'PERMIT_PACKAGE_DOCUMENT_ADDED',
      entityType: 'PermitPackageDocument',
      entityId: document.id,
      userId: package_.createdById,
      reason: `Document added to permit package: ${data.documentName}`,
      after: {
        documentName: data.documentName,
        documentType: data.documentType,
      },
    })

    return document
  },

  /**
   * Update application form
   */
  async updateApplicationForm(formId: string, data: {
    formData: any
    isComplete?: boolean
  }) {
    const form = await prismaAny.permitApplicationForm.findUnique({
      where: { id: formId },
    })

    if (!form) {
      throw new NotFoundError('PermitApplicationForm', formId)
    }

    const updated = await prismaAny.permitApplicationForm.update({
      where: { id: formId },
      data: {
        formData: data.formData as any,
        isComplete: data.isComplete !== undefined ? data.isComplete : form.isComplete,
      },
    })

    return updated
  },

  /**
   * Verify application form
   */
  async verifyApplicationForm(formId: string, data: {
    verifiedById: string
  }) {
    const form = await prismaAny.permitApplicationForm.findUnique({
      where: { id: formId },
    })

    if (!form) {
      throw new NotFoundError('PermitApplicationForm', formId)
    }

    if (!form.isComplete) {
      throw new ValidationError('Application form must be complete before verification')
    }

    const updated = await prismaAny.permitApplicationForm.update({
      where: { id: formId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedById: data.verifiedById,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'PERMIT_APPLICATION_FORM_VERIFIED',
      entityType: 'PermitApplicationForm',
      entityId: formId,
      userId: data.verifiedById,
      reason: 'Application form verified',
      after: {
        isVerified: true,
      },
    })

    return updated
  },

  /**
   * Submit permit package to permit system
   */
  async submitPermitPackage(packageId: string, data: {
    submissionMethod: string
    submittedById: string
    submissionNotes?: string
  }) {
    const package_ = await prismaAny.permitPackage.findUnique({
      where: { id: packageId },
      include: {
        documents: {
          where: { isIncluded: true },
        },
        applicationForms: {
          where: { isComplete: true },
        },
      },
    })

    if (!package_) {
      throw new NotFoundError('PermitPackage', packageId)
    }

    if (package_.status !== 'READY') {
      throw new ValidationError('Permit package must be ready before submission')
    }

    // Validate package completeness
    if (package_.documents.length === 0) {
      throw new ValidationError('Permit package must contain at least one document')
    }

    const incompleteForms = package_.applicationForms.filter((f: any) => !f.isComplete)
    if (incompleteForms.length > 0) {
      throw new ValidationError('All application forms must be complete before submission')
    }

    // Create submission record
    const submission = await prismaAny.permitPackageSubmission.create({
      data: {
        packageId,
        submissionMethod: data.submissionMethod,
        submissionStatus: 'PENDING',
        submittedById: data.submittedById,
        submissionNotes: data.submissionNotes,
      },
    })

    // If API submission, attempt to submit
    if (data.submissionMethod === 'API' && package_.jurisdictionId) {
      try {
        // TODO: Integrate with m-permits-inspections API
        // const response = await submitToPermitSystem(package_, data)
        // submission.apiRequestId = response.requestId
        // submission.apiResponse = response
        submission.submissionStatus = 'SUBMITTED'
        submission.submittedAt = new Date()
      } catch (error: any) {
        submission.submissionStatus = 'FAILED'
        submission.apiError = error.message
      }

      await prismaAny.permitPackageSubmission.update({
        where: { id: submission.id },
        data: {
          submissionStatus: submission.submissionStatus,
          submittedAt: submission.submittedAt,
          apiRequestId: submission.apiRequestId,
          apiResponse: submission.apiResponse as any,
          apiError: submission.apiError,
        },
      })
    }

    // Update package status
    const updatedPackage = await prismaAny.permitPackage.update({
      where: { id: packageId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        submittedById: data.submittedById,
        submissionReferenceId: submission.id,
        lastSyncAt: new Date(),
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'PERMIT_PACKAGE_SUBMITTED',
      entityType: 'PermitPackage',
      entityId: packageId,
      userId: data.submittedById,
      reason: `Permit package submitted via ${data.submissionMethod}`,
      after: {
        status: 'SUBMITTED',
        submissionMethod: data.submissionMethod,
      },
    })

    return {
      package: updatedPackage,
      submission,
    }
  },

  /**
   * Sync permit package status from permit system
   */
  async syncPermitPackageStatus(packageId: string) {
    const package_ = await prismaAny.permitPackage.findUnique({
      where: { id: packageId },
    })

    if (!package_) {
      throw new NotFoundError('PermitPackage', packageId)
    }

    if (!package_.submissionReferenceId) {
      throw new ValidationError('Package has not been submitted yet')
    }

    // TODO: Call m-permits-inspections API to get current status
    // const status = await getPermitStatus(package_.submissionReferenceId)
    // const reviewComments = await getPermitReviewComments(package_.submissionReferenceId)

    // For now, return current status
    return {
      status: package_.status,
      reviewStatus: package_.reviewStatus,
      lastSyncAt: package_.lastSyncAt,
    }
  },

  /**
   * Add review comment from permit system
   */
  async addReviewComment(packageId: string, data: {
    commentType: string
    commentText: string
    commentCategory?: string
    severity?: string
    sheetNumber?: string
    pageNumber?: number
    coordinates?: any
    markupImageUrl?: string
    source: string
    reviewerName?: string
    reviewerEmail?: string
  }) {
    const package_ = await prismaAny.permitPackage.findUnique({
      where: { id: packageId },
    })

    if (!package_) {
      throw new NotFoundError('PermitPackage', packageId)
    }

    const comment = await prismaAny.permitPackageReviewComment.create({
      data: {
        packageId,
        commentType: data.commentType,
        commentText: data.commentText,
        commentCategory: data.commentCategory,
        severity: data.severity as any,
        sheetNumber: data.sheetNumber,
        pageNumber: data.pageNumber,
        coordinates: data.coordinates as any,
        markupImageUrl: data.markupImageUrl,
        source: data.source,
        reviewerName: data.reviewerName,
        reviewerEmail: data.reviewerEmail,
        isResolved: false,
      },
    })

    // Update package review counts
    await prismaAny.permitPackage.update({
      where: { id: packageId },
      data: {
        reviewCommentsCount: {
          increment: 1,
        },
        correctionsRequiredCount: data.severity === 'CRITICAL' || data.severity === 'MAJOR'
          ? { increment: 1 }
          : undefined,
      },
    })

    return comment
  },

  /**
   * Resolve review comment
   */
  async resolveReviewComment(commentId: string, data: {
    resolutionNotes?: string
    resolvedById: string
  }) {
    const comment = await prismaAny.permitPackageReviewComment.findUnique({
      where: { id: commentId },
    })

    if (!comment) {
      throw new NotFoundError('PermitPackageReviewComment', commentId)
    }

    const updated = await prismaAny.permitPackageReviewComment.update({
      where: { id: commentId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedById: data.resolvedById,
        resolutionNotes: data.resolutionNotes,
      },
    })

    // Update package corrections count
    if (comment.severity === 'CRITICAL' || comment.severity === 'MAJOR') {
      await prismaAny.permitPackage.update({
        where: { id: comment.packageId },
        data: {
          correctionsRequiredCount: {
            decrement: 1,
          },
        },
      })
    }

    return updated
  },
}
