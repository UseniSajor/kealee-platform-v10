import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'

export const deliverableService = {
  /**
   * Create a new deliverable
   */
  async createDeliverable(data: {
    designProjectId: string
    phaseId?: string
    name: string
    description?: string
    deliverableType: string
    dueDate?: Date
    dependsOnId?: string
    milestoneId?: string
    associatedFileIds?: string[]
    createdById: string
  }) {
    // Validate dependency if provided
    if (data.dependsOnId) {
      const dependency = await prismaAny.designDeliverable.findUnique({
        where: { id: data.dependsOnId },
      })
      if (!dependency) {
        throw new NotFoundError('DesignDeliverable', data.dependsOnId)
      }
      if (dependency.designProjectId !== data.designProjectId) {
        throw new ValidationError('Dependency must be from the same project')
      }
    }

    // Validate phase if provided
    if (data.phaseId) {
      const phase = await prismaAny.designPhaseInstance.findUnique({
        where: { id: data.phaseId },
      })
      if (!phase) {
        throw new NotFoundError('DesignPhaseInstance', data.phaseId)
      }
      if (phase.designProjectId !== data.designProjectId) {
        throw new ValidationError('Phase must be from the same project')
      }
    }

    const deliverable = await prismaAny.designDeliverable.create({
      data: {
        designProjectId: data.designProjectId,
        phaseId: data.phaseId,
        name: data.name,
        description: data.description,
        deliverableType: data.deliverableType as any,
        dueDate: data.dueDate,
        dependsOnId: data.dependsOnId,
        milestoneId: data.milestoneId,
        associatedFileIds: data.associatedFileIds || [],
        createdById: data.createdById,
      },
      include: {
        dependsOn: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        phase: {
          select: {
            id: true,
            phase: true,
            status: true,
          },
        },
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
      action: 'DELIVERABLE_CREATED',
      entityType: 'DesignDeliverable',
      entityId: deliverable.id,
      userId: data.createdById,
      reason: `Deliverable created: ${data.name}`,
      after: {
        name: data.name,
        deliverableType: data.deliverableType,
        status: 'DRAFT',
      },
    })

    // Log event
    await eventService.recordEvent({
      type: 'DELIVERABLE_CREATED',
      entityType: 'DesignDeliverable',
      entityId: deliverable.id,
      userId: data.createdById,
      payload: {
        name: data.name,
        deliverableType: data.deliverableType,
        designProjectId: data.designProjectId,
      },
    })

    return deliverable
  },

  /**
   * Get a deliverable with all related data
   */
  async getDeliverable(deliverableId: string) {
    const deliverable = await prismaAny.designDeliverable.findUnique({
      where: { id: deliverableId },
      include: {
        dependsOn: {
          select: {
            id: true,
            name: true,
            status: true,
            dueDate: true,
          },
        },
        dependentDeliverables: {
          select: {
            id: true,
            name: true,
            status: true,
            dueDate: true,
          },
        },
        phase: {
          select: {
            id: true,
            phase: true,
            status: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        designProject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!deliverable) {
      throw new NotFoundError('DesignDeliverable', deliverableId)
    }

    return deliverable
  },

  /**
   * List deliverables for a project
   */
  async listDeliverables(designProjectId: string, filters?: {
    phaseId?: string
    status?: string
    deliverableType?: string
    packageId?: string
  }) {
    const where: any = {
      designProjectId,
    }

    if (filters?.phaseId) {
      where.phaseId = filters.phaseId
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.deliverableType) {
      where.deliverableType = filters.deliverableType
    }

    if (filters?.packageId) {
      where.packageId = filters.packageId
    }

    const deliverables = await prismaAny.designDeliverable.findMany({
      where,
      include: {
        dependsOn: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        phase: {
          select: {
            id: true,
            phase: true,
            status: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    return deliverables
  },

  /**
   * Update deliverable
   */
  async updateDeliverable(deliverableId: string, data: {
    name?: string
    description?: string
    deliverableType?: string
    status?: string
    dueDate?: Date
    dependsOnId?: string
    milestoneId?: string
    associatedFileIds?: string[]
    userId: string
  }) {
    const deliverable = await prismaAny.designDeliverable.findUnique({
      where: { id: deliverableId },
    })

    if (!deliverable) {
      throw new NotFoundError('DesignDeliverable', deliverableId)
    }

    // Validate dependency if provided
    if (data.dependsOnId && data.dependsOnId !== deliverable.dependsOnId) {
      if (data.dependsOnId === deliverableId) {
        throw new ValidationError('Deliverable cannot depend on itself')
      }
      const dependency = await prismaAny.designDeliverable.findUnique({
        where: { id: data.dependsOnId },
      })
      if (!dependency) {
        throw new NotFoundError('DesignDeliverable', data.dependsOnId)
      }
      if (dependency.designProjectId !== deliverable.designProjectId) {
        throw new ValidationError('Dependency must be from the same project')
      }
    }

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.deliverableType !== undefined) updateData.deliverableType = data.deliverableType
    if (data.status !== undefined) updateData.status = data.status
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate
    if (data.dependsOnId !== undefined) updateData.dependsOnId = data.dependsOnId
    if (data.milestoneId !== undefined) updateData.milestoneId = data.milestoneId
    if (data.associatedFileIds !== undefined) updateData.associatedFileIds = data.associatedFileIds

    const updated = await prismaAny.designDeliverable.update({
      where: { id: deliverableId },
      data: updateData,
      include: {
        dependsOn: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        phase: {
          select: {
            id: true,
            phase: true,
            status: true,
          },
        },
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DELIVERABLE_UPDATED',
      entityType: 'DesignDeliverable',
      entityId: deliverableId,
      userId: data.userId,
      reason: 'Deliverable updated',
      before: deliverable,
      after: updated,
    })

    return updated
  },

  /**
   * Approve deliverable
   */
  async approveDeliverable(deliverableId: string, userId: string, approvalNotes?: string) {
    const deliverable = await prismaAny.designDeliverable.findUnique({
      where: { id: deliverableId },
    })

    if (!deliverable) {
      throw new NotFoundError('DesignDeliverable', deliverableId)
    }

    if (deliverable.status !== 'IN_REVIEW') {
      throw new ValidationError('Only deliverables in review can be approved')
    }

    const updated = await prismaAny.designDeliverable.update({
      where: { id: deliverableId },
      data: {
        status: 'APPROVED',
        approvedById: userId,
        approvedAt: new Date(),
        approvalNotes,
      },
      include: {
        approvedBy: {
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
      action: 'DELIVERABLE_APPROVED',
      entityType: 'DesignDeliverable',
      entityId: deliverableId,
      userId,
      reason: approvalNotes || 'Deliverable approved',
      after: {
        status: 'APPROVED',
        approvedAt: updated.approvedAt,
      },
    })

    // Log event
    await eventService.recordEvent({
      type: 'DELIVERABLE_APPROVED',
      entityType: 'DesignDeliverable',
      entityId: deliverableId,
      userId,
      payload: {
        name: deliverable.name,
        designProjectId: deliverable.designProjectId,
      },
    })

    // TODO: Send notification to team members
    // await notificationService.notifyTeamMembers(deliverable.designProjectId, {
    //   type: 'DELIVERABLE_APPROVED',
    //   deliverableId,
    //   deliverableName: deliverable.name,
    // })

    return updated
  },

  /**
   * Issue deliverable
   */
  async issueDeliverable(deliverableId: string, userId: string, issuedTo?: string) {
    const deliverable = await prismaAny.designDeliverable.findUnique({
      where: { id: deliverableId },
    })

    if (!deliverable) {
      throw new NotFoundError('DesignDeliverable', deliverableId)
    }

    if (deliverable.status !== 'APPROVED') {
      throw new ValidationError('Only approved deliverables can be issued')
    }

    const updated = await prismaAny.designDeliverable.update({
      where: { id: deliverableId },
      data: {
        status: 'ISSUED',
        issuedAt: new Date(),
        issuedTo,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DELIVERABLE_ISSUED',
      entityType: 'DesignDeliverable',
      entityId: deliverableId,
      userId,
      reason: `Deliverable issued${issuedTo ? ` to ${issuedTo}` : ''}`,
      after: {
        status: 'ISSUED',
        issuedAt: updated.issuedAt,
        issuedTo,
      },
    })

    // Log event
    await eventService.recordEvent({
      type: 'DELIVERABLE_ISSUED',
      entityType: 'DesignDeliverable',
      entityId: deliverableId,
      userId,
      payload: {
        name: deliverable.name,
        designProjectId: deliverable.designProjectId,
        issuedTo,
      },
    })

    // TODO: Send notification
    // await notificationService.notifyTeamMembers(deliverable.designProjectId, {
    //   type: 'DELIVERABLE_ISSUED',
    //   deliverableId,
    //   deliverableName: deliverable.name,
    //   issuedTo,
    // })

    return updated
  },

  /**
   * Get overdue deliverables
   */
  async getOverdueDeliverables(designProjectId: string) {
    const now = new Date()
    const overdue = await prismaAny.designDeliverable.findMany({
      where: {
        designProjectId,
        dueDate: {
          lt: now,
        },
        status: {
          notIn: ['ISSUED', 'ARCHIVED'],
        },
      },
      include: {
        phase: {
          select: {
            id: true,
            phase: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    })

    return overdue
  },

  /**
   * Get deliverables due soon (within X days)
   */
  async getDeliverablesDueSoon(designProjectId: string, days: number = 7) {
    const now = new Date()
    const soon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    const dueSoon = await prismaAny.designDeliverable.findMany({
      where: {
        designProjectId,
        dueDate: {
          gte: now,
          lte: soon,
        },
        status: {
          notIn: ['ISSUED', 'ARCHIVED'],
        },
      },
      include: {
        phase: {
          select: {
            id: true,
            phase: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    })

    return dueSoon
  },

  /**
   * Create deliverable package
   */
  async createPackage(data: {
    designProjectId: string
    name: string
    description?: string
    submissionDate?: Date
    submittedTo?: string
    submissionMethod?: string
    deliverableIds: string[]
    createdById: string
  }) {
    // Validate all deliverables belong to the project
    const deliverables = await prismaAny.designDeliverable.findMany({
      where: {
        id: { in: data.deliverableIds },
      },
    })

    if (deliverables.length !== data.deliverableIds.length) {
      throw new ValidationError('One or more deliverables not found')
    }

    const invalidDeliverables = deliverables.filter(
      (d: any) => d.designProjectId !== data.designProjectId
    )
    if (invalidDeliverables.length > 0) {
      throw new ValidationError('All deliverables must belong to the same project')
    }

    // Create package
    const package_ = await prismaAny.deliverablePackage.create({
      data: {
        designProjectId: data.designProjectId,
        name: data.name,
        description: data.description,
        submissionDate: data.submissionDate,
        submittedTo: data.submittedTo,
        submissionMethod: data.submissionMethod,
        createdById: data.createdById,
      },
    })

    // Update deliverables to link to package
    await prismaAny.designDeliverable.updateMany({
      where: {
        id: { in: data.deliverableIds },
      },
      data: {
        packageId: package_.id,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DELIVERABLE_PACKAGE_CREATED',
      entityType: 'DeliverablePackage',
      entityId: package_.id,
      userId: data.createdById,
      reason: `Package created: ${data.name}`,
      after: {
        name: data.name,
        deliverableCount: data.deliverableIds.length,
      },
    })

    return package_
  },

  /**
   * Get package with deliverables
   */
  async getPackage(packageId: string) {
    const package_ = await prismaAny.deliverablePackage.findUnique({
      where: { id: packageId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        designProject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!package_) {
      throw new NotFoundError('DeliverablePackage', packageId)
    }

    // Get deliverables in package
    const deliverables = await prismaAny.designDeliverable.findMany({
      where: {
        packageId: package_.id,
      },
      include: {
        phase: {
          select: {
            id: true,
            phase: true,
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

    return {
      ...package_,
      deliverables,
    }
  },

  /**
   * List packages for a project
   */
  async listPackages(designProjectId: string) {
    const packages = await prismaAny.deliverablePackage.findMany({
      where: { designProjectId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            deliverables: true,
          },
        },
      },
      orderBy: {
        submissionDate: 'desc',
      },
    })

    return packages
  },
}
