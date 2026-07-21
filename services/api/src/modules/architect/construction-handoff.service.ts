import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'

export const constructionHandoffService = {
  /**
   * Generate Issue for Construction (IFC) package
   */
  async generateIFCPackage(data: {
    designProjectId: string
    packageName: string
    description?: string
    drawingSheetIds?: string[]
    includeAllDrawings?: boolean
    includeSpecifications?: boolean
    createdById: string
  }) {
    // Get design project with drawings
    const project = await prismaAny.designProject.findUnique({
      where: { id: data.designProjectId },
      include: {
        drawingSheets: {
          where: {
            status: 'APPROVED',
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

    // Generate package number
    const existingPackages = await prismaAny.iFCPackage.count({
      where: { designProjectId: data.designProjectId },
    })
    const packageNumber = `IFC-${String(existingPackages + 1).padStart(3, '0')}`

    // Create IFC package
    const ifcPackage = await prismaAny.iFCPackage.create({
      data: {
        designProjectId: data.designProjectId,
        packageName: data.packageName,
        packageNumber,
        description: data.description,
        status: 'ASSEMBLING',
        createdById: data.createdById,
      },
    })

    // Add drawings as documents
    const documents = await Promise.all(
      project.drawingSheets.map((sheet: any, index: number) =>
        prismaAny.iFCPackageDocument.create({
          data: {
            packageId: ifcPackage.id,
            documentType: 'DRAWING',
            documentName: `${sheet.sheetNumber} - ${sheet.sheetName}`,
            sheetNumber: sheet.sheetNumber,
            discipline: sheet.discipline,
            sourceType: 'DRAWING_SHEET',
            sourceId: sheet.id,
            sourceFileUrl: sheet.fileUrl || undefined,
            fileUrl: sheet.fileUrl || '',
            fileName: `${sheet.sheetNumber}_${sheet.sheetName}.pdf`,
            fileType: 'PDF',
            orderIndex: index + 1,
            isIncluded: true,
          },
        })
      )
    )

    // Add specifications if requested
    let specifications: any[] = []
    if (data.includeSpecifications) {
      // Query project documents for specification files
      const specFiles = await prismaAny.designFile.findMany({
        where: {
          designProjectId: data.designProjectId,
          status: 'ACTIVE',
          OR: [
            { category: 'SPECIFICATION' },
            { fileType: { in: ['SPECIFICATION', 'SPEC'] } },
            { tags: { has: 'specification' } },
          ],
        },
        orderBy: { createdAt: 'asc' },
      })

      if (specFiles.length > 0) {
        specifications = await Promise.all(
          specFiles.map((specFile: any, index: number) =>
            prismaAny.iFCPackageDocument.create({
              data: {
                packageId: ifcPackage.id,
                documentType: 'SPECIFICATION',
                documentName: specFile.fileName || specFile.name || `Specification ${index + 1}`,
                discipline: specFile.discipline || 'GENERAL',
                sourceType: 'DESIGN_FILE',
                sourceId: specFile.id,
                sourceFileUrl: specFile.fileUrl || undefined,
                fileUrl: specFile.fileUrl || '',
                fileName: specFile.fileName || `spec_${index + 1}.pdf`,
                fileType: specFile.fileType || 'PDF',
                orderIndex: documents.length + index + 1,
                isIncluded: true,
              },
            })
          )
        )
      }
    }

    // Update package with counts
    const updatedPackage = await prismaAny.iFCPackage.update({
      where: { id: ifcPackage.id },
      data: {
        totalSheets: documents.length,
        totalSpecifications: specifications.length,
        totalDocuments: documents.length + specifications.length,
        status: 'READY',
      },
      include: {
        documents: true,
        specifications: true,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'IFC_PACKAGE_GENERATED',
      entityType: 'IFCPackage',
      entityId: ifcPackage.id,
      userId: data.createdById,
      reason: `IFC package generated: ${data.packageName}`,
      after: {
        packageNumber,
        totalSheets: documents.length,
      },
    })

    return updatedPackage
  },

  /**
   * Issue IFC package
   */
  async issueIFCPackage(packageId: string, data: {
    issuedById: string
    issueDate?: Date
  }) {
    const package_ = await prismaAny.iFCPackage.findUnique({
      where: { id: packageId },
    })

    if (!package_) {
      throw new NotFoundError('IFCPackage', packageId)
    }

    if (package_.status !== 'READY') {
      throw new ValidationError('IFC package must be ready before issuing')
    }

    const updated = await prismaAny.iFCPackage.update({
      where: { id: packageId },
      data: {
        status: 'ISSUED',
        issuedAt: data.issueDate || new Date(),
        issueDate: data.issueDate || new Date(),
        issuedById: data.issuedById,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'IFC_PACKAGE_ISSUED',
      entityType: 'IFCPackage',
      entityId: packageId,
      userId: data.issuedById,
      reason: 'IFC package issued for construction',
      after: {
        status: 'ISSUED',
      },
    })

    return updated
  },

  /**
   * Generate bid package
   */
  async generateBidPackage(data: {
    designProjectId: string
    packageName: string
    bidDueDate?: Date
    description?: string
    ifcPackageId?: string
    includesIFCPackage?: boolean
    includesSpecifications?: boolean
    createdById: string
  }) {
    // Generate package number
    const existingPackages = await prismaAny.bidPackage.count({
      where: { designProjectId: data.designProjectId },
    })
    const packageNumber = `BID-${String(existingPackages + 1).padStart(3, '0')}`

    // Create bid package
    const bidPackage = await prismaAny.bidPackage.create({
      data: {
        designProjectId: data.designProjectId,
        packageName: data.packageName,
        packageNumber,
        bidDueDate: data.bidDueDate,
        description: data.description,
        status: 'ASSEMBLING',
        includesIFCPackage: data.includesIFCPackage !== false,
        ifcPackageId: data.ifcPackageId,
        includesSpecifications: data.includesSpecifications !== false,
        createdById: data.createdById,
      },
    })

    // Add IFC package documents if included
    if (data.includesIFCPackage && data.ifcPackageId) {
      const ifcPackage = await prismaAny.iFCPackage.findUnique({
        where: { id: data.ifcPackageId },
        include: {
          documents: true,
        },
      })

      if (ifcPackage) {
        await Promise.all(
          ifcPackage.documents.map((doc: any, index: number) =>
            prismaAny.bidPackageDocument.create({
              data: {
                packageId: bidPackage.id,
                documentType: doc.documentType,
                documentName: doc.documentName,
                fileUrl: doc.fileUrl,
                fileName: doc.fileName,
                fileSize: doc.fileSize,
                orderIndex: index,
                isRequired: true,
              },
            })
          )
        )
      }
    }

    // Update status
    const updated = await prismaAny.bidPackage.update({
      where: { id: bidPackage.id },
      data: {
        status: 'READY',
      },
      include: {
        documents: true,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'BID_PACKAGE_GENERATED',
      entityType: 'BidPackage',
      entityId: bidPackage.id,
      userId: data.createdById,
      reason: `Bid package generated: ${data.packageName}`,
      after: {
        packageNumber,
      },
    })

    return updated
  },

  /**
   * Create contractor question
   */
  async createContractorQuestion(data: {
    bidPackageId?: string
    questionText: string
    questionCategory?: string
    relatedDocumentId?: string
    relatedSheetNumber?: string
    relatedSpecificationSection?: string
    isPublic?: boolean
    askedById: string
  }) {
    const question = await prismaAny.contractorQuestion.create({
      data: {
        bidPackageId: data.bidPackageId,
        questionText: data.questionText,
        questionCategory: data.questionCategory,
        relatedDocumentId: data.relatedDocumentId,
        relatedSheetNumber: data.relatedSheetNumber,
        relatedSpecificationSection: data.relatedSpecificationSection,
        isPublic: data.isPublic !== false,
        status: 'OPEN',
        askedById: data.askedById,
      },
      include: {
        askedBy: {
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
      action: 'CONTRACTOR_QUESTION_CREATED',
      entityType: 'ContractorQuestion',
      entityId: question.id,
      userId: data.askedById,
      reason: 'Contractor question created',
      after: {
        questionCategory: data.questionCategory,
        isPublic: data.isPublic !== false,
      },
    })

    return question
  },

  /**
   * Answer contractor question
   */
  async answerContractorQuestion(questionId: string, data: {
    answerText: string
    answeredById: string
  }) {
    const question = await prismaAny.contractorQuestion.findUnique({
      where: { id: questionId },
    })

    if (!question) {
      throw new NotFoundError('ContractorQuestion', questionId)
    }

    const updated = await prismaAny.contractorQuestion.update({
      where: { id: questionId },
      data: {
        answerText: data.answerText,
        answeredAt: new Date(),
        answeredById: data.answeredById,
        status: 'ANSWERED',
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'CONTRACTOR_QUESTION_ANSWERED',
      entityType: 'ContractorQuestion',
      entityId: questionId,
      userId: data.answeredById,
      reason: 'Contractor question answered',
      after: {
        status: 'ANSWERED',
      },
    })

    return updated
  },

  /**
   * Create RFI
   */
  async createRFI(data: {
    designProjectId: string
    subject: string
    questionText: string
    questionCategory?: string
    priority?: string
    relatedDrawingId?: string
    relatedSheetNumber?: string
    relatedSpecificationSection?: string
    relatedRFIId?: string
    dueDate?: Date
    submittedById?: string
  }) {
    // Generate RFI number
    const existingRFIs = await prismaAny.rFI.count({
      where: { designProjectId: data.designProjectId },
    })
    const rfiNumber = `RFI-${String(existingRFIs + 1).padStart(3, '0')}`

    const rfi = await prismaAny.rFI.create({
      data: {
        designProjectId: data.designProjectId,
        rfiNumber,
        subject: data.subject,
        questionText: data.questionText,
        questionCategory: data.questionCategory,
        priority: data.priority,
        relatedDrawingId: data.relatedDrawingId,
        relatedSheetNumber: data.relatedSheetNumber,
        relatedSpecificationSection: data.relatedSpecificationSection,
        relatedRFIId: data.relatedRFIId,
        dueDate: data.dueDate,
        status: data.submittedById ? 'SUBMITTED' : 'DRAFT',
        submittedAt: data.submittedById ? new Date() : null,
        submittedById: data.submittedById,
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'RFI_CREATED',
      entityType: 'RFI',
      entityId: rfi.id,
      userId: data.submittedById || 'system',
      reason: `RFI created: ${data.subject}`,
      after: {
        rfiNumber,
        status: data.submittedById ? 'SUBMITTED' : 'DRAFT',
      },
    })

    return rfi
  },

  /**
   * Answer RFI
   */
  async answerRFI(rfiId: string, data: {
    answerText: string
    answeredById: string
  }) {
    const rfi = await prismaAny.rFI.findUnique({
      where: { id: rfiId },
    })

    if (!rfi) {
      throw new NotFoundError('RFI', rfiId)
    }

    if (rfi.status !== 'SUBMITTED' && rfi.status !== 'IN_REVIEW') {
      throw new ValidationError('RFI must be submitted before answering')
    }

    // Calculate response time
    const responseTimeHours = rfi.submittedAt
      ? Math.round((new Date().getTime() - new Date(rfi.submittedAt).getTime()) / (1000 * 60 * 60))
      : null

    const updated = await prismaAny.rFI.update({
      where: { id: rfiId },
      data: {
        answerText: data.answerText,
        answeredAt: new Date(),
        answeredById: data.answeredById,
        status: 'ANSWERED',
        responseTimeHours,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'RFI_ANSWERED',
      entityType: 'RFI',
      entityId: rfiId,
      userId: data.answeredById,
      reason: 'RFI answered',
      after: {
        status: 'ANSWERED',
        responseTimeHours,
      },
    })

    return updated
  },

  /**
   * Create submittal
   */
  async createSubmittal(data: {
    designProjectId: string
    submittalName: string
    submittalType: string
    specificationSection?: string
    relatedDrawingId?: string
    relatedSheetNumber?: string
    manufacturer?: string
    productName?: string
    modelNumber?: string
    description?: string
    submittedById?: string
  }) {
    // Generate submittal number
    const existingSubmittals = await prismaAny.submittal.count({
      where: { designProjectId: data.designProjectId },
    })
    const submittalNumber = `SUB-${String(existingSubmittals + 1).padStart(3, '0')}`

    const submittal = await prismaAny.submittal.create({
      data: {
        designProjectId: data.designProjectId,
        submittalNumber,
        submittalName: data.submittalName,
        submittalType: data.submittalType,
        specificationSection: data.specificationSection,
        relatedDrawingId: data.relatedDrawingId,
        relatedSheetNumber: data.relatedSheetNumber,
        manufacturer: data.manufacturer,
        productName: data.productName,
        modelNumber: data.modelNumber,
        description: data.description,
        status: data.submittedById ? 'SUBMITTED' : 'DRAFT',
        submittedAt: data.submittedById ? new Date() : null,
        submittedById: data.submittedById,
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'SUBMITTAL_CREATED',
      entityType: 'Submittal',
      entityId: submittal.id,
      userId: data.submittedById || 'system',
      reason: `Submittal created: ${data.submittalName}`,
      after: {
        submittalNumber,
        submittalType: data.submittalType,
      },
    })

    return submittal
  },

  /**
   * Review submittal
   */
  async reviewSubmittal(submittalId: string, data: {
    reviewAction: string
    reviewComments?: string
    requiredResubmission?: boolean
    reviewedById: string
  }) {
    const submittal = await prismaAny.submittal.findUnique({
      where: { id: submittalId },
    })

    if (!submittal) {
      throw new NotFoundError('Submittal', submittalId)
    }

    if (submittal.status !== 'SUBMITTED' && submittal.status !== 'UNDER_REVIEW') {
      throw new ValidationError('Submittal must be submitted before review')
    }

    // Calculate review time
    const reviewTimeDays = submittal.submittedAt
      ? Math.round((new Date().getTime() - new Date(submittal.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
      : null

    const statusMap: Record<string, string> = {
      APPROVE: 'APPROVED',
      APPROVE_AS_NOTED: 'APPROVED_AS_NOTED',
      REJECT: 'REJECTED',
      NO_EXCEPTION_TAKEN: 'APPROVED',
    }

    const newStatus = statusMap[data.reviewAction] || 'UNDER_REVIEW'

    const updateData: any = {
      reviewAction: data.reviewAction,
      reviewComments: data.reviewComments,
      requiredResubmission: data.requiredResubmission || false,
      reviewedAt: new Date(),
      reviewedById: data.reviewedById,
      reviewTimeDays,
      status: newStatus as any,
    }

    if (newStatus === 'APPROVED' || newStatus === 'APPROVED_AS_NOTED') {
      updateData.approvedAt = new Date()
      updateData.approvedById = data.reviewedById
    }

    const updated = await prismaAny.submittal.update({
      where: { id: submittalId },
      data: updateData,
    })

    // Log audit
    await auditService.recordAudit({
      action: 'SUBMITTAL_REVIEWED',
      entityType: 'Submittal',
      entityId: submittalId,
      userId: data.reviewedById,
      reason: `Submittal reviewed: ${data.reviewAction}`,
      after: {
        status: newStatus,
        reviewAction: data.reviewAction,
      },
    })

    return updated
  },

  /**
   * Create as-built documentation
   */
  async createAsBuiltDocumentation(data: {
    designProjectId: string
    documentationName: string
    documentationType: string
    description?: string
    submittedById?: string
  }) {
    const documentation = await prismaAny.asBuiltDocumentation.create({
      data: {
        designProjectId: data.designProjectId,
        documentationName: data.documentationName,
        documentationType: data.documentationType,
        description: data.description,
        status: data.submittedById ? 'SUBMITTED' : 'PENDING',
        submittedAt: data.submittedById ? new Date() : null,
        submittedById: data.submittedById,
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'AS_BUILT_DOCUMENTATION_CREATED',
      entityType: 'AsBuiltDocumentation',
      entityId: documentation.id,
      userId: data.submittedById || 'system',
      reason: `As-built documentation created: ${data.documentationName}`,
      after: {
        documentationType: data.documentationType,
      },
    })

    return documentation
  },

  /**
   * Review as-built documentation
   */
  async reviewAsBuiltDocumentation(documentationId: string, data: {
    reviewComments?: string
    requiredRevisions?: boolean
    reviewedById: string
  }) {
    const documentation = await prismaAny.asBuiltDocumentation.findUnique({
      where: { id: documentationId },
    })

    if (!documentation) {
      throw new NotFoundError('AsBuiltDocumentation', documentationId)
    }

    const updated = await prismaAny.asBuiltDocumentation.update({
      where: { id: documentationId },
      data: {
        reviewComments: data.reviewComments,
        requiredRevisions: data.requiredRevisions || false,
        reviewedAt: new Date(),
        reviewedById: data.reviewedById,
        status: 'REVIEWED',
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'AS_BUILT_DOCUMENTATION_REVIEWED',
      entityType: 'AsBuiltDocumentation',
      entityId: documentationId,
      userId: data.reviewedById,
      reason: 'As-built documentation reviewed',
      after: {
        status: 'REVIEWED',
      },
    })

    return updated
  },

  /**
   * Approve as-built documentation
   */
  async approveAsBuiltDocumentation(documentationId: string, data: {
    approvedById: string
  }) {
    const documentation = await prismaAny.asBuiltDocumentation.findUnique({
      where: { id: documentationId },
    })

    if (!documentation) {
      throw new NotFoundError('AsBuiltDocumentation', documentationId)
    }

    if (documentation.status !== 'REVIEWED') {
      throw new ValidationError('As-built documentation must be reviewed before approval')
    }

    const updated = await prismaAny.asBuiltDocumentation.update({
      where: { id: documentationId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: data.approvedById,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'AS_BUILT_DOCUMENTATION_APPROVED',
      entityType: 'AsBuiltDocumentation',
      entityId: documentationId,
      userId: data.approvedById,
      reason: 'As-built documentation approved',
      after: {
        status: 'APPROVED',
      },
    })

    return updated
  },
}
