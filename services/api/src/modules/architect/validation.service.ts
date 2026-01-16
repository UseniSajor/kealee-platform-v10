import { prisma } from '@kealee/database'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'

export const validationService = {
  /**
   * Create validation rule
   */
  async createValidationRule(data: {
    name: string
    description?: string
    category: string
    codeStandard?: string
    codeReference?: string
    ruleType: string
    ruleLogic?: any
    validationScript?: string
    appliesTo?: string[]
    requiredFor?: string[]
    phaseApplicability?: string[]
    isRequired?: boolean
    createdById: string
  }) {
    const rule = await prisma.validationRule.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category as any,
        codeStandard: data.codeStandard as any,
        codeReference: data.codeReference,
        ruleType: data.ruleType,
        ruleLogic: data.ruleLogic as any,
        validationScript: data.validationScript,
        appliesTo: data.appliesTo || [],
        requiredFor: data.requiredFor || [],
        phaseApplicability: data.phaseApplicability || [],
        isRequired: data.isRequired || false,
        isActive: true,
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
      action: 'VALIDATION_RULE_CREATED',
      entityType: 'ValidationRule',
      entityId: rule.id,
      userId: data.createdById,
      reason: `Validation rule created: ${data.name}`,
      after: {
        name: data.name,
        category: data.category,
      },
    })

    return rule
  },

  /**
   * Run validation on target
   */
  async runValidation(data: {
    designProjectId: string
    targetType: string
    targetId: string
    ruleId?: string
    ruleIds?: string[]
    validationMethod?: string
    createdById: string
  }) {
    // Get applicable rules
    let rules: any[] = []

    if (data.ruleId) {
      const rule = await prisma.validationRule.findUnique({
        where: { id: data.ruleId },
      })
      if (rule) {
        rules = [rule]
      }
    } else if (data.ruleIds && data.ruleIds.length > 0) {
      rules = await prisma.validationRule.findMany({
        where: {
          id: { in: data.ruleIds },
          isActive: true,
        },
      })
    } else {
      // Get all applicable rules for target type
      rules = await prisma.validationRule.findMany({
        where: {
          isActive: true,
          appliesTo: {
            has: data.targetType,
          },
        },
      })
    }

    if (rules.length === 0) {
      throw new ValidationError('No applicable validation rules found')
    }

    const validations: any[] = []

    for (const rule of rules) {
      // Run validation based on rule type
      let validationResult: any = {
        status: 'PENDING',
        issuesFound: [],
        recommendations: [],
      }

      if (rule.ruleType === 'AUTOMATED' && rule.validationScript) {
        // TODO: Execute validation script
        // For now, create placeholder validation
        validationResult = {
          status: 'PENDING',
          message: 'Automated validation pending implementation',
          issuesFound: [],
          recommendations: [],
        }
      } else if (rule.ruleType === 'MANUAL') {
        validationResult = {
          status: 'PENDING',
          message: 'Manual validation required',
          issuesFound: [],
          recommendations: [],
        }
      }

      const validation = await prisma.designValidation.create({
        data: {
          designProjectId: data.designProjectId,
          targetType: data.targetType,
          targetId: data.targetId,
          ruleId: rule.id,
          validationStatus: validationResult.status as any,
          validationMessage: validationResult.message,
          validationDetails: validationResult as any,
          issuesFound: validationResult.issuesFound || [],
          recommendations: validationResult.recommendations || [],
          codeStandard: rule.codeStandard,
          codeReference: rule.codeReference,
          validationMethod: data.validationMethod || rule.ruleType,
          createdById: data.createdById,
        },
      })

      validations.push(validation)
    }

    return validations
  },

  /**
   * Update validation result
   */
  async updateValidation(validationId: string, data: {
    validationStatus: string
    severity?: string
    validationMessage?: string
    validationDetails?: any
    issuesFound?: string[]
    recommendations?: string[]
    complianceStatus?: string
    validatedById: string
  }) {
    const validation = await prisma.designValidation.findUnique({
      where: { id: validationId },
    })

    if (!validation) {
      throw new NotFoundError('DesignValidation', validationId)
    }

    const updateData: any = {
      validationStatus: data.validationStatus as any,
      validatedAt: new Date(),
      validatedById: data.validatedById,
    }

    if (data.severity) {
      updateData.severity = data.severity as any
    }

    if (data.validationMessage) {
      updateData.validationMessage = data.validationMessage
    }

    if (data.validationDetails) {
      updateData.validationDetails = data.validationDetails as any
    }

    if (data.issuesFound) {
      updateData.issuesFound = data.issuesFound
    }

    if (data.recommendations) {
      updateData.recommendations = data.recommendations
    }

    if (data.complianceStatus) {
      updateData.complianceStatus = data.complianceStatus
    }

    const updated = await prisma.designValidation.update({
      where: { id: validationId },
      data: updateData,
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DESIGN_VALIDATION_UPDATED',
      entityType: 'DesignValidation',
      entityId: validationId,
      userId: data.validatedById,
      reason: `Validation updated: ${data.validationStatus}`,
      after: {
        validationStatus: data.validationStatus,
      },
    })

    return updated
  },

  /**
   * Get validation
   */
  async getValidation(validationId: string) {
    const validation = await prisma.designValidation.findUnique({
      where: { id: validationId },
      include: {
        rule: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            codeStandard: true,
            codeReference: true,
          },
        },
        validatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!validation) {
      throw new NotFoundError('DesignValidation', validationId)
    }

    return validation
  },

  /**
   * List validations
   */
  async listValidations(designProjectId: string, filters?: {
    targetType?: string
    targetId?: string
    validationStatus?: string
    category?: string
    codeStandard?: string
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

    if (filters?.validationStatus) {
      where.validationStatus = filters.validationStatus
    }

    if (filters?.category) {
      where.rule = {
        category: filters.category,
      }
    }

    if (filters?.codeStandard) {
      where.codeStandard = filters.codeStandard
    }

    const validations = await prisma.designValidation.findMany({
      where,
      include: {
        rule: {
          select: {
            id: true,
            name: true,
            category: true,
            codeStandard: true,
          },
        },
        validatedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return validations
  },

  /**
   * Approve validation
   */
  async approveValidation(validationId: string, data: {
    approvalNotes?: string
    exemptionGranted?: boolean
    exemptionReason?: string
    userId: string
  }) {
    const validation = await prisma.designValidation.findUnique({
      where: { id: validationId },
    })

    if (!validation) {
      throw new NotFoundError('DesignValidation', validationId)
    }

    const updated = await prisma.designValidation.update({
      where: { id: validationId },
      data: {
        approvedAt: new Date(),
        approvedById: data.userId,
        approvalNotes: data.approvalNotes,
        exemptionGranted: data.exemptionGranted || false,
        exemptionReason: data.exemptionReason,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DESIGN_VALIDATION_APPROVED',
      entityType: 'DesignValidation',
      entityId: validationId,
      userId: data.userId,
      reason: data.approvalNotes || 'Validation approved',
      after: {
        approvedAt: updated.approvedAt,
        exemptionGranted: data.exemptionGranted,
      },
    })

    return updated
  },

  /**
   * Generate validation report
   */
  async generateValidationReport(data: {
    designProjectId: string
    reportName: string
    reportType: string
    targetType?: string
    targetId?: string
    ruleIds?: string[]
    format?: string
    generatedById: string
  }) {
    // Get validations to include
    const where: any = {
      designProjectId: data.designProjectId,
    }

    if (data.targetType) {
      where.targetType = data.targetType
    }

    if (data.targetId) {
      where.targetId = data.targetId
    }

    if (data.ruleIds && data.ruleIds.length > 0) {
      where.ruleId = { in: data.ruleIds }
    }

    const validations = await prisma.designValidation.findMany({
      where,
      include: {
        rule: {
          select: {
            id: true,
            name: true,
            category: true,
            codeStandard: true,
          },
        },
      },
    })

    // Calculate summary
    const summary = {
      total: validations.length,
      passed: validations.filter((v) => v.validationStatus === 'PASSED').length,
      failed: validations.filter((v) => v.validationStatus === 'FAILED').length,
      warnings: validations.filter((v) => v.validationStatus === 'WARNING').length,
      pending: validations.filter((v) => v.validationStatus === 'PENDING' || v.validationStatus === 'IN_PROGRESS').length,
      exempt: validations.filter((v) => v.validationStatus === 'EXEMPT').length,
    }

    const report = await prisma.designValidationReport.create({
      data: {
        designProjectId: data.designProjectId,
        reportName: data.reportName,
        reportType: data.reportType,
        summary: summary as any,
        validationIds: validations.map((v) => v.id),
        reportFormat: data.format,
        generatedById: data.generatedById,
      },
    })

    // Link validations to report
    await prisma.designValidation.updateMany({
      where: {
        id: { in: validations.map((v) => v.id) },
      },
      data: {
        reportId: report.id,
      },
    })

    // TODO: Generate actual report file (PDF, HTML, etc.)
    // const reportFileUrl = await generateReportFile(report.id, data.format)

    // Log audit
    await auditService.recordAudit({
      action: 'VALIDATION_REPORT_GENERATED',
      entityType: 'DesignValidationReport',
      entityId: report.id,
      userId: data.generatedById,
      reason: `Validation report generated: ${data.reportName}`,
      after: {
        reportType: data.reportType,
        validationCount: validations.length,
      },
    })

    return report
  },

  /**
   * Get validation report
   */
  async getValidationReport(reportId: string) {
    const report = await prisma.designValidationReport.findUnique({
      where: { id: reportId },
      include: {
        generatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        validations: {
          include: {
            rule: {
              select: {
                id: true,
                name: true,
                category: true,
                codeStandard: true,
              },
            },
          },
        },
      },
    })

    if (!report) {
      throw new NotFoundError('DesignValidationReport', reportId)
    }

    return report
  },

  /**
   * Create drawing checklist
   */
  async createDrawingChecklist(data: {
    designProjectId: string
    sheetId?: string
    items: Array<{
      itemName: string
      itemCategory?: string
      isRequired?: boolean
      locationOnSheet?: string
      expectedValue?: string
    }>
    createdById: string
  }) {
    const checklistItems = await Promise.all(
      data.items.map((item) =>
        prisma.drawingChecklistItem.create({
          data: {
            designProjectId: data.designProjectId,
            sheetId: data.sheetId,
            itemName: item.itemName,
            itemCategory: item.itemCategory,
            isRequired: item.isRequired !== false,
            locationOnSheet: item.locationOnSheet,
            expectedValue: item.expectedValue,
          },
        })
      )
    )

    return checklistItems
  },

  /**
   * Validate drawing checklist item
   */
  async validateChecklistItem(itemId: string, data: {
    isPresent: boolean
    isValid?: boolean
    validationNotes?: string
    userId: string
  }) {
    const item = await prisma.drawingChecklistItem.findUnique({
      where: { id: itemId },
    })

    if (!item) {
      throw new NotFoundError('DrawingChecklistItem', itemId)
    }

    const updated = await prisma.drawingChecklistItem.update({
      where: { id: itemId },
      data: {
        isPresent: data.isPresent,
        isValid: data.isValid,
        validationNotes: data.validationNotes,
        validatedAt: new Date(),
        validatedById: data.userId,
      },
    })

    return updated
  },

  /**
   * Get drawing checklist
   */
  async getDrawingChecklist(designProjectId: string, sheetId?: string) {
    const where: any = {
      designProjectId,
    }

    if (sheetId) {
      where.sheetId = sheetId
    } else {
      where.sheetId = null
    }

    const items = await prisma.drawingChecklistItem.findMany({
      where,
      include: {
        validatedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        sheet: {
          select: {
            id: true,
            sheetNumber: true,
            sheetTitle: true,
          },
        },
      },
      orderBy: {
        itemName: 'asc',
      },
    })

    return items
  },

  /**
   * Create code compliance record
   */
  async createCodeComplianceRecord(data: {
    designProjectId: string
    codeStandard: string
    codeSection: string
    codeDescription?: string
    complianceStatus: string
    complianceNotes?: string
    evidenceFileIds?: string[]
    relatedSheetIds?: string[]
    relatedDeliverableIds?: string[]
    createdById: string
  }) {
    const record = await prisma.codeComplianceRecord.create({
      data: {
        designProjectId: data.designProjectId,
        codeStandard: data.codeStandard as any,
        codeSection: data.codeSection,
        codeDescription: data.codeDescription,
        complianceStatus: data.complianceStatus,
        complianceNotes: data.complianceNotes,
        evidenceFileIds: data.evidenceFileIds || [],
        relatedSheetIds: data.relatedSheetIds || [],
        relatedDeliverableIds: data.relatedDeliverableIds || [],
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
      action: 'CODE_COMPLIANCE_RECORD_CREATED',
      entityType: 'CodeComplianceRecord',
      entityId: record.id,
      userId: data.createdById,
      reason: `Code compliance record created: ${data.codeStandard} ${data.codeSection}`,
      after: {
        codeStandard: data.codeStandard,
        codeSection: data.codeSection,
        complianceStatus: data.complianceStatus,
      },
    })

    return record
  },

  /**
   * Validate code compliance
   */
  async validateCodeCompliance(recordId: string, data: {
    complianceStatus: string
    complianceNotes?: string
    validationMethod?: string
    userId: string
  }) {
    const record = await prisma.codeComplianceRecord.findUnique({
      where: { id: recordId },
    })

    if (!record) {
      throw new NotFoundError('CodeComplianceRecord', recordId)
    }

    const updated = await prisma.codeComplianceRecord.update({
      where: { id: recordId },
      data: {
        complianceStatus: data.complianceStatus,
        complianceNotes: data.complianceNotes,
        validatedAt: new Date(),
        validatedById: data.userId,
        validationMethod: data.validationMethod,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'CODE_COMPLIANCE_VALIDATED',
      entityType: 'CodeComplianceRecord',
      entityId: recordId,
      userId: data.userId,
      reason: `Code compliance validated: ${data.complianceStatus}`,
      after: {
        complianceStatus: data.complianceStatus,
      },
    })

    return updated
  },

  /**
   * List code compliance records
   */
  async listCodeComplianceRecords(designProjectId: string, filters?: {
    codeStandard?: string
    complianceStatus?: string
  }) {
    const where: any = {
      designProjectId,
    }

    if (filters?.codeStandard) {
      where.codeStandard = filters.codeStandard
    }

    if (filters?.complianceStatus) {
      where.complianceStatus = filters.complianceStatus
    }

    const records = await prisma.codeComplianceRecord.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        validatedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        codeSection: 'asc',
      },
    })

    return records
  },

  /**
   * List validation rules
   */
  async listValidationRules(filters?: {
    category?: string
    codeStandard?: string
    isActive?: boolean
    isRequired?: boolean
  }) {
    const where: any = {}

    if (filters?.category) {
      where.category = filters.category
    }

    if (filters?.codeStandard) {
      where.codeStandard = filters.codeStandard
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters?.isRequired !== undefined) {
      where.isRequired = filters.isRequired
    }

    const rules = await prisma.validationRule.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            validations: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return rules
  },
}
