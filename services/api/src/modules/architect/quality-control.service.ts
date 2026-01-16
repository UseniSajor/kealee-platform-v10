import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'

export const qualityControlService = {
  /**
   * Create QC checklist template
   */
  async createQCChecklistTemplate(data: {
    name: string
    description?: string
    phase?: string
    projectType?: string
    items: any[]
    isDefault?: boolean
    createdById: string
  }) {
    const template = await prismaAny.qCChecklistTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        phase: data.phase,
        projectType: data.projectType,
        items: data.items as any,
        isActive: true,
        isDefault: data.isDefault || false,
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
      action: 'QC_CHECKLIST_TEMPLATE_CREATED',
      entityType: 'QCChecklistTemplate',
      entityId: template.id,
      userId: data.createdById,
      reason: `QC checklist template created: ${data.name}`,
      after: {
        name: data.name,
        phase: data.phase,
      },
    })

    return template
  },

  /**
   * Create QC checklist for project/phase
   */
  async createQCChecklist(data: {
    designProjectId: string
    phaseId?: string
    templateId?: string
    checklistName: string
    phase?: string
    items?: any[]
    createdById: string
  }) {
    // If templateId provided, get items from template
    let items: any[] = data.items || []
    if (data.templateId && !data.items) {
      const template = await prismaAny.qCChecklistTemplate.findUnique({
        where: { id: data.templateId },
      })
      if (template) {
        items = template.items as any[]
      }
    }

    const checklist = await prismaAny.qCChecklist.create({
      data: {
        designProjectId: data.designProjectId,
        phaseId: data.phaseId,
        templateId: data.templateId,
        checklistName: data.checklistName,
        phase: data.phase,
        status: 'PENDING',
        totalItems: items.length,
        createdById: data.createdById,
      },
    })

    // Create checklist items
    const checklistItems = await Promise.all(
      items.map((item, index) =>
        prismaAny.qCChecklistItem.create({
          data: {
            checklistId: checklist.id,
            itemOrder: item.order || index + 1,
            itemName: item.name,
            itemDescription: item.description,
            itemCategory: item.category,
            isRequired: item.isRequired !== false,
            criteria: item.criteria,
            itemStatus: 'NOT_STARTED',
          },
        })
      )
    )

    // Calculate initial metrics
    await this.calculateQCMetrics(checklist.id)

    // Log audit
    await auditService.recordAudit({
      action: 'QC_CHECKLIST_CREATED',
      entityType: 'QCChecklist',
      entityId: checklist.id,
      userId: data.createdById,
      reason: `QC checklist created: ${data.checklistName}`,
      after: {
        checklistName: data.checklistName,
        itemCount: items.length,
      },
    })

    return {
      ...checklist,
      items: checklistItems,
    }
  },

  /**
   * Get QC checklist
   */
  async getQCChecklist(checklistId: string) {
    const checklist = await prismaAny.qCChecklist.findUnique({
      where: { id: checklistId },
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
        phaseInstance: {
          select: {
            id: true,
            name: true,
            phase: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        completedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          orderBy: {
            itemOrder: 'asc',
          },
          include: {
            checkedBy: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                errors: true,
              },
            },
          },
        },
        checks: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        metrics: true,
      },
    })

    if (!checklist) {
      throw new NotFoundError('QCChecklist', checklistId)
    }

    return checklist
  },

  /**
   * List QC checklists
   */
  async listQCChecklists(designProjectId: string, filters?: {
    phaseId?: string
    phase?: string
    status?: string
  }) {
    const where: any = {
      designProjectId,
    }

    if (filters?.phaseId) {
      where.phaseId = filters.phaseId
    }

    if (filters?.phase) {
      where.phase = filters.phase
    }

    if (filters?.status) {
      where.status = filters.status
    }

    const checklists = await prismaAny.qCChecklist.findMany({
      where,
      include: {
        phaseInstance: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            items: true,
            checks: true,
          },
        },
        metrics: {
          select: {
            passRate: true,
            totalErrors: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return checklists
  },

  /**
   * Update checklist item status
   */
  async updateChecklistItemStatus(itemId: string, data: {
    itemStatus: string
    checkNotes?: string
    result?: string
    evidenceFileIds?: string[]
    checkedById: string
  }) {
    const item = await prismaAny.qCChecklistItem.findUnique({
      where: { id: itemId },
      include: {
        checklist: true,
      },
    })

    if (!item) {
      throw new NotFoundError('QCChecklistItem', itemId)
    }

    const updated = await prismaAny.qCChecklistItem.update({
      where: { id: itemId },
      data: {
        itemStatus: data.itemStatus as any,
        checkedAt: new Date(),
        checkedById: data.checkedById,
        checkNotes: data.checkNotes,
        result: data.result,
        evidenceFileIds: data.evidenceFileIds || [],
      },
    })

    // Recalculate checklist metrics
    await this.calculateQCMetrics(item.checklistId)

    // Log audit
    await auditService.recordAudit({
      action: 'QC_CHECKLIST_ITEM_UPDATED',
      entityType: 'QCChecklistItem',
      entityId: itemId,
      userId: data.checkedById,
      reason: `Checklist item status updated to ${data.itemStatus}`,
      after: {
        itemStatus: data.itemStatus,
      },
    })

    return updated
  },

  /**
   * Create random sample check
   */
  async createRandomSampleCheck(data: {
    checklistId: string
    checkName: string
    checkDescription?: string
    targetType: string
    targetId?: string
    sampleSize: number
    sampleMethod?: string
    checkedById: string
  }) {
    const checklist = await prismaAny.qCChecklist.findUnique({
      where: { id: data.checklistId },
      include: {
        items: {
          where: {
            itemStatus: { not: 'EXEMPT' },
          },
        },
      },
    })

    if (!checklist) {
      throw new NotFoundError('QCChecklist', data.checklistId)
    }

    // Random sample selection algorithm
    const availableItems = checklist.items
    const sampleSize = Math.min(data.sampleSize, availableItems.length)
    const selectedItems = this.selectRandomSample(availableItems, sampleSize, data.sampleMethod || 'RANDOM')

    const check = await prismaAny.qCCheck.create({
      data: {
        checklistId: data.checklistId,
        checkType: 'RANDOM_SAMPLE',
        checkName: data.checkName,
        checkDescription: data.checkDescription,
        targetType: data.targetType,
        targetId: data.targetId,
        checkStatus: 'PENDING',
        sampleSize: sampleSize,
        sampleMethod: data.sampleMethod || 'RANDOM',
        sampleSelection: selectedItems.map((item) => ({
          itemId: item.id,
          itemName: item.itemName,
        })) as any,
        checkedById: data.checkedById,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'QC_CHECK_CREATED',
      entityType: 'QCCheck',
      entityId: check.id,
      userId: data.checkedById,
      reason: `Random sample check created: ${data.checkName}`,
      after: {
        checkType: 'RANDOM_SAMPLE',
        sampleSize: sampleSize,
      },
    })

    return check
  },

  /**
   * Select random sample
   */
  selectRandomSample(items: any[], sampleSize: number, method: string): any[] {
    if (method === 'RANDOM') {
      // Simple random sampling
      const shuffled = [...items].sort(() => 0.5 - Math.random())
      return shuffled.slice(0, sampleSize)
    } else if (method === 'STRATIFIED') {
      // Stratified sampling by category
      const byCategory: Record<string, any[]> = {}
      items.forEach((item) => {
        const category = item.itemCategory || 'OTHER'
        if (!byCategory[category]) {
          byCategory[category] = []
        }
        byCategory[category].push(item)
      })

      const selected: any[] = []
      const perCategory = Math.ceil(sampleSize / Object.keys(byCategory).length)

      Object.values(byCategory).forEach((categoryItems) => {
        const shuffled = [...categoryItems].sort(() => 0.5 - Math.random())
        selected.push(...shuffled.slice(0, perCategory))
      })

      return selected.slice(0, sampleSize)
    } else {
      // SYSTEMATIC - every nth item
      const step = Math.floor(items.length / sampleSize)
      const selected: any[] = []
      for (let i = 0; i < items.length && selected.length < sampleSize; i += step) {
        selected.push(items[i])
      }
      return selected
    }
  },

  /**
   * Report QC error
   */
  async reportQCError(data: {
    checklistId: string
    checklistItemId?: string
    checkId?: string
    errorCategory: string
    errorSeverity: string
    errorDescription: string
    errorLocation?: string
    errorDetails?: any
    affectedItems?: string[]
    evidenceFileIds?: string[]
    reportedById: string
  }) {
    const error = await prismaAny.qCError.create({
      data: {
        checklistId: data.checklistId,
        checklistItemId: data.checklistItemId,
        checkId: data.checkId,
        errorCategory: data.errorCategory as any,
        errorSeverity: data.errorSeverity as any,
        errorDescription: data.errorDescription,
        errorLocation: data.errorLocation,
        errorDetails: data.errorDetails as any,
        affectedItems: data.affectedItems || [],
        evidenceFileIds: data.evidenceFileIds || [],
        isResolved: false,
        reportedById: data.reportedById,
      },
      include: {
        checklistItem: {
          select: {
            id: true,
            itemName: true,
          },
        },
        reportedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Update check error count if checkId provided
    if (data.checkId) {
      await prismaAny.qCCheck.update({
        where: { id: data.checkId },
        data: {
          errorsFound: {
            increment: 1,
          },
        },
      })
    }

    // Recalculate metrics
    await this.calculateQCMetrics(data.checklistId)

    // Log audit
    await auditService.recordAudit({
      action: 'QC_ERROR_REPORTED',
      entityType: 'QCError',
      entityId: error.id,
      userId: data.reportedById,
      reason: `QC error reported: ${data.errorDescription}`,
      after: {
        errorCategory: data.errorCategory,
        errorSeverity: data.errorSeverity,
      },
    })

    return error
  },

  /**
   * Resolve QC error
   */
  async resolveQCError(errorId: string, data: {
    resolutionNotes?: string
    resolvedById: string
  }) {
    const error = await prismaAny.qCError.findUnique({
      where: { id: errorId },
    })

    if (!error) {
      throw new NotFoundError('QCError', errorId)
    }

    const updated = await prismaAny.qCError.update({
      where: { id: errorId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedById: data.resolvedById,
        resolutionNotes: data.resolutionNotes,
      },
    })

    // Recalculate metrics
    await this.calculateQCMetrics(error.checklistId)

    // Log audit
    await auditService.recordAudit({
      action: 'QC_ERROR_RESOLVED',
      entityType: 'QCError',
      entityId: errorId,
      userId: data.resolvedById,
      reason: data.resolutionNotes || 'QC error resolved',
      after: {
        isResolved: true,
      },
    })

    return updated
  },

  /**
   * Create corrective action
   */
  async createCorrectiveAction(data: {
    errorId: string
    actionDescription: string
    actionType?: string
    assignedToId?: string
    dueDate?: Date
    assignedById: string
  }) {
    const error = await prismaAny.qCError.findUnique({
      where: { id: data.errorId },
    })

    if (!error) {
      throw new NotFoundError('QCError', data.errorId)
    }

    const action = await prismaAny.correctiveAction.create({
      data: {
        errorId: data.errorId,
        actionDescription: data.actionDescription,
        actionType: data.actionType,
        assignedToId: data.assignedToId,
        dueDate: data.dueDate,
        actionStatus: 'PENDING',
        assignedById: data.assignedById,
      },
      include: {
        error: {
          select: {
            id: true,
            errorDescription: true,
            errorSeverity: true,
          },
        },
        assignedTo: {
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
      action: 'CORRECTIVE_ACTION_CREATED',
      entityType: 'CorrectiveAction',
      entityId: action.id,
      userId: data.assignedById,
      reason: `Corrective action created: ${data.actionDescription}`,
      after: {
        actionDescription: data.actionDescription,
        assignedToId: data.assignedToId,
      },
    })

    return action
  },

  /**
   * Update corrective action status
   */
  async updateCorrectiveActionStatus(actionId: string, data: {
    actionStatus: string
    completionNotes?: string
    evidenceFileIds?: string[]
    userId: string
  }) {
    const action = await prismaAny.correctiveAction.findUnique({
      where: { id: actionId },
    })

    if (!action) {
      throw new NotFoundError('CorrectiveAction', actionId)
    }

    const updateData: any = {
      actionStatus: data.actionStatus as any,
    }

    if (data.actionStatus === 'IN_PROGRESS' && !action.startedAt) {
      updateData.startedAt = new Date()
    }

    if (data.actionStatus === 'COMPLETED') {
      updateData.completedAt = new Date()
      updateData.completionNotes = data.completionNotes
      updateData.evidenceFileIds = data.evidenceFileIds || []
    }

    const updated = await prismaAny.correctiveAction.update({
      where: { id: actionId },
      data: updateData,
    })

    // Log audit
    await auditService.recordAudit({
      action: 'CORRECTIVE_ACTION_STATUS_UPDATED',
      entityType: 'CorrectiveAction',
      entityId: actionId,
      userId: data.userId,
      reason: `Corrective action status updated to ${data.actionStatus}`,
      after: {
        actionStatus: data.actionStatus,
      },
    })

    return updated
  },

  /**
   * Verify corrective action
   */
  async verifyCorrectiveAction(actionId: string, data: {
    verificationNotes?: string
    verifiedById: string
  }) {
    const action = await prismaAny.correctiveAction.findUnique({
      where: { id: actionId },
    })

    if (!action) {
      throw new NotFoundError('CorrectiveAction', actionId)
    }

    if (action.actionStatus !== 'COMPLETED') {
      throw new ValidationError('Corrective action must be completed before verification')
    }

    const updated = await prismaAny.correctiveAction.update({
      where: { id: actionId },
      data: {
        actionStatus: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedById: data.verifiedById,
        verificationNotes: data.verificationNotes,
      },
    })

    // Check if error should be resolved
    const error = await prismaAny.qCError.findUnique({
      where: { id: action.errorId },
      include: {
        correctiveActions: true,
      },
    })

    if (error) {
      const allActionsVerified = error.correctiveActions.every(
        (a: any) => a.actionStatus === 'VERIFIED' || a.id === actionId
      )

      if (allActionsVerified && error.correctiveActions.length > 0) {
        await prismaAny.qCError.update({
          where: { id: action.errorId },
          data: {
            isResolved: true,
            resolvedAt: new Date(),
            resolvedById: data.verifiedById,
          },
        })
      }
    }

    // Log audit
    await auditService.recordAudit({
      action: 'CORRECTIVE_ACTION_VERIFIED',
      entityType: 'CorrectiveAction',
      entityId: actionId,
      userId: data.verifiedById,
      reason: data.verificationNotes || 'Corrective action verified',
      after: {
        actionStatus: 'VERIFIED',
      },
    })

    return updated
  },

  /**
   * Calculate QC metrics
   */
  async calculateQCMetrics(checklistId: string) {
    const checklist = await prismaAny.qCChecklist.findUnique({
      where: { id: checklistId },
      include: {
        items: {
          include: {
            errors: true,
          },
        },
        checks: true,
      },
    })

    if (!checklist) {
      throw new NotFoundError('QCChecklist', checklistId)
    }

    // Calculate item metrics
    const totalItems = checklist.items.length
    const passedItems = checklist.items.filter((item: any) => item.itemStatus === 'PASSED').length
    const failedItems = checklist.items.filter((item: any) => item.itemStatus === 'FAILED').length
    const exemptItems = checklist.items.filter((item: any) => item.itemStatus === 'EXEMPT').length
    const completionPercentage =
      totalItems > 0 ? ((passedItems + failedItems + exemptItems) / totalItems) * 100 : 0

    // Update checklist
    await prismaAny.qCChecklist.update({
      where: { id: checklistId },
      data: {
        totalItems,
        passedItems,
        failedItems,
        exemptItems,
        completionPercentage: completionPercentage.toString(),
      },
    })

    // Calculate error metrics
    const allErrors = checklist.items.flatMap((item: any) => item.errors)
    const totalErrors = allErrors.length
    const resolvedErrors = allErrors.filter((e: any) => e.isResolved).length

    const errorsByCategory: Record<string, number> = {}
    const errorsBySeverity: Record<string, number> = {}

    allErrors.forEach((error: any) => {
      errorsByCategory[error.errorCategory] = (errorsByCategory[error.errorCategory] || 0) + 1
      errorsBySeverity[error.errorSeverity] = (errorsBySeverity[error.errorSeverity] || 0) + 1
    })

    // Calculate check metrics
    const totalChecks = checklist.checks.length
    const checksPassed = checklist.checks.filter((c: any) => c.checkStatus === 'COMPLETED' && c.itemsFailed === 0).length
    const checksFailed = checklist.checks.filter((c: any) => c.checkStatus === 'COMPLETED' && c.itemsFailed > 0).length
    const passRate = totalChecks > 0 ? (checksPassed / totalChecks) * 100 : 0

    // Get corrective actions
    const allCorrectiveActions = await prismaAny.correctiveAction.findMany({
      where: {
        error: {
          checklistId: checklistId,
        },
      },
    })

    const actionsCompleted = allCorrectiveActions.filter((a: any) => a.actionStatus === 'COMPLETED' || a.actionStatus === 'VERIFIED').length
    const actionsPending = allCorrectiveActions.filter((a: any) => a.actionStatus === 'PENDING' || a.actionStatus === 'IN_PROGRESS').length
    const actionsOverdue = allCorrectiveActions.filter(
      (a: any) => a.dueDate && a.dueDate < new Date() && (a.actionStatus === 'PENDING' || a.actionStatus === 'IN_PROGRESS')
    ).length

    // Calculate average resolution time
    const resolvedErrorsWithTime = allErrors.filter((e: any) => e.isResolved && e.resolvedAt && e.createdAt)
    const averageResolutionTime =
      resolvedErrorsWithTime.length > 0
        ? resolvedErrorsWithTime.reduce((sum: number, e: any) => {
            const resolutionTime = new Date(e.resolvedAt!).getTime() - new Date(e.createdAt).getTime()
            return sum + resolutionTime / (1000 * 60 * 60) // Convert to hours
          }, 0) / resolvedErrorsWithTime.length
        : null

    // Upsert metrics
    await prismaAny.qCMetrics.upsert({
      where: { checklistId },
      create: {
        checklistId,
        totalChecks,
        checksPassed,
        checksFailed,
        passRate: passRate.toString(),
        totalErrors,
        errorsByCategory: errorsByCategory as any,
        errorsBySeverity: errorsBySeverity as any,
        averageResolutionTime: averageResolutionTime ? Math.round(averageResolutionTime) : null,
        totalActions: allCorrectiveActions.length,
        actionsCompleted,
        actionsPending,
        actionsOverdue,
      },
      update: {
        totalChecks,
        checksPassed,
        checksFailed,
        passRate: passRate.toString(),
        totalErrors,
        errorsByCategory: errorsByCategory as any,
        errorsBySeverity: errorsBySeverity as any,
        averageResolutionTime: averageResolutionTime ? Math.round(averageResolutionTime) : null,
        totalActions: allCorrectiveActions.length,
        actionsCompleted,
        actionsPending,
        actionsOverdue,
        calculatedAt: new Date(),
      },
    })
  },

  /**
   * Get QC metrics
   */
  async getQCMetrics(checklistId: string) {
    const metrics = await prismaAny.qCMetrics.findUnique({
      where: { checklistId },
      include: {
        checklist: {
          select: {
            id: true,
            checklistName: true,
            phase: true,
          },
        },
      },
    })

    if (!metrics) {
      // Calculate if not exists
      await this.calculateQCMetrics(checklistId)
      return prismaAny.qCMetrics.findUnique({
        where: { checklistId },
      })
    }

    return metrics
  },

  /**
   * Create improvement feedback
   */
  async createImprovementFeedback(data: {
    designProjectId: string
    feedbackType: string
    title: string
    description: string
    category?: string
    relatedChecklistId?: string
    relatedErrorId?: string
    relatedPhase?: string
    impactLevel?: string
    estimatedBenefit?: string
    createdById: string
  }) {
    const feedback = await prismaAny.qCImprovementFeedback.create({
      data: {
        designProjectId: data.designProjectId,
        feedbackType: data.feedbackType,
        title: data.title,
        description: data.description,
        category: data.category,
        relatedChecklistId: data.relatedChecklistId,
        relatedErrorId: data.relatedErrorId,
        relatedPhase: data.relatedPhase,
        impactLevel: data.impactLevel,
        estimatedBenefit: data.estimatedBenefit,
        isImplemented: false,
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
      action: 'QC_IMPROVEMENT_FEEDBACK_CREATED',
      entityType: 'QCImprovementFeedback',
      entityId: feedback.id,
      userId: data.createdById,
      reason: `Improvement feedback created: ${data.title}`,
      after: {
        feedbackType: data.feedbackType,
        impactLevel: data.impactLevel,
      },
    })

    return feedback
  },

  /**
   * List improvement feedback
   */
  async listImprovementFeedback(designProjectId: string, filters?: {
    feedbackType?: string
    isImplemented?: boolean
    category?: string
  }) {
    const where: any = {
      designProjectId,
    }

    if (filters?.feedbackType) {
      where.feedbackType = filters.feedbackType
    }

    if (filters?.isImplemented !== undefined) {
      where.isImplemented = filters.isImplemented
    }

    if (filters?.category) {
      where.category = filters.category
    }

    const feedback = await prismaAny.qCImprovementFeedback.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        implementedBy: {
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

    return feedback
  },

  /**
   * Mark improvement feedback as implemented
   */
  async implementImprovementFeedback(feedbackId: string, data: {
    implementedById: string
  }) {
    const feedback = await prismaAny.qCImprovementFeedback.findUnique({
      where: { id: feedbackId },
    })

    if (!feedback) {
      throw new NotFoundError('QCImprovementFeedback', feedbackId)
    }

    const updated = await prismaAny.qCImprovementFeedback.update({
      where: { id: feedbackId },
      data: {
        isImplemented: true,
        implementedAt: new Date(),
        implementedById: data.implementedById,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'QC_IMPROVEMENT_FEEDBACK_IMPLEMENTED',
      entityType: 'QCImprovementFeedback',
      entityId: feedbackId,
      userId: data.implementedById,
      reason: 'Improvement feedback implemented',
      after: {
        isImplemented: true,
      },
    })

    return updated
  },
}
