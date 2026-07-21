import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, AuthorizationError, ValidationError } from '../../errors/app.error'
// ProjectStatus type is available through prismaAny
type ProjectStatus = any

export const closeoutService = {
  /**
   * Get or create closeout checklist for project (Prompt 3.7)
   */
  async getCloseoutChecklist(projectId: string, userId: string) {
    const project = await prismaAny.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true } },
      },
    })

    if (!project) throw new NotFoundError('Project', projectId)
    if (project.ownerId !== userId) {
      throw new AuthorizationError('Only project owner can view closeout checklist')
    }

    let checklist = await prismaAny.closeoutChecklist.findUnique({
      where: { projectId },
      include: {
        items: {
          include: {
            attachments: true,
            completedByUser: { select: { id: true, name: true, email: true } },
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!checklist) {
      // Create default closeout checklist
      checklist = await this.createDefaultChecklist(projectId)
    }

    return checklist
  },

  /**
   * Create default closeout checklist (Prompt 3.7)
   */
  async createDefaultChecklist(projectId: string) {
    const defaultItems = [
      {
        type: 'FINAL_INSPECTION',
        title: 'Final Inspection Completion',
        description: 'Ensure all required inspections have passed',
        required: true,
        order: 1,
      },
      {
        type: 'LIEN_WAIVER',
        title: 'Lien Waiver Collection',
        description: 'Collect lien waivers from contractor and all subcontractors',
        required: true,
        order: 2,
      },
      {
        type: 'PUNCH_LIST',
        title: 'Punch List Resolution',
        description: 'Complete and verify all punch list items',
        required: true,
        order: 3,
      },
      {
        type: 'WARRANTY_COLLECTION',
        title: 'Warranty Documentation',
        description: 'Collect all warranty documents and information',
        required: true,
        order: 4,
      },
      {
        type: 'MANUAL_COLLECTION',
        title: 'Appliance & System Manuals',
        description: 'Receive all appliance and system operation manuals',
        required: true,
        order: 5,
      },
      {
        type: 'AS_BUILT_PHOTOS',
        title: 'As-Built Photos',
        description: 'Upload final as-built photos of completed work',
        required: true,
        order: 6,
      },
      {
        type: 'FINAL_WALKTHROUGH',
        title: 'Final Walkthrough',
        description: 'Complete final walkthrough with contractor',
        required: true,
        order: 7,
      },
      {
        type: 'DOCUMENT_ARCHIVING',
        title: 'Document Archiving',
        description: 'Archive all project documents (contracts, permits, inspections, payments)',
        required: true,
        order: 8,
      },
      {
        type: 'FINAL_PAYMENT',
        title: 'Final Payment Processing',
        description: 'Release final holdback payment to contractor',
        required: true,
        order: 9,
      },
    ]

    const checklist = await prismaAny.closeoutChecklist.create({
      data: {
        projectId,
        status: 'in_progress',
        items: {
          create: defaultItems,
        },
      },
      include: {
        items: {
          include: {
            attachments: true,
            completedByUser: { select: { id: true, name: true, email: true } },
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    return checklist
  },

  /**
   * Update closeout item status (Prompt 3.7)
   */
  async updateCloseoutItem(
    itemId: string,
    userId: string,
    input: {
      status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'
      notes?: string
      completed?: boolean
    }
  ) {
    const item = await prismaAny.closeoutItem.findUnique({
      where: { id: itemId },
      include: {
        checklist: {
          include: {
            project: { select: { ownerId: true } },
          },
        },
      },
    })

    if (!item) throw new NotFoundError('CloseoutItem', itemId)
    if (item.checklist.project.ownerId !== userId) {
      throw new AuthorizationError('Only project owner can update closeout items')
    }

    const updateData: any = {}
    if (input.status) updateData.status = input.status
    if (input.notes !== undefined) updateData.notes = input.notes

    if (input.completed || input.status === 'COMPLETED') {
      updateData.status = 'COMPLETED'
      updateData.completedAt = new Date()
      updateData.completedBy = userId
    } else if (input.status === 'PENDING' || input.status === 'IN_PROGRESS') {
      updateData.completedAt = null
      updateData.completedBy = null
    }

    const updated = await prismaAny.closeoutItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        attachments: true,
        completedByUser: { select: { id: true, name: true, email: true } },
      },
    })

    // Check if all items are completed
    await this.checkChecklistCompletion(item.checklistId)

    return updated
  },

  /**
   * Add attachment to closeout item (Prompt 3.7)
   */
  async addAttachment(
    itemId: string,
    userId: string,
    input: {
      url: string
      fileName?: string
      mimeType?: string
      sizeBytes?: number
      description?: string
    }
  ) {
    const item = await prismaAny.closeoutItem.findUnique({
      where: { id: itemId },
      include: {
        checklist: {
          include: {
            project: { select: { ownerId: true } },
          },
        },
      },
    })

    if (!item) throw new NotFoundError('CloseoutItem', itemId)
    if (item.checklist.project.ownerId !== userId) {
      throw new AuthorizationError('Only project owner can add attachments')
    }

    const attachment = await prismaAny.closeoutAttachment.create({
      data: {
        itemId,
        url: input.url,
        fileName: input.fileName || null,
        mimeType: input.mimeType || null,
        sizeBytes: input.sizeBytes || null,
        description: input.description || null,
        uploadedBy: userId,
      },
    })

    return attachment
  },

  /**
   * Check if checklist is complete and update status (Prompt 3.7)
   */
  async checkChecklistCompletion(checklistId: string) {
    const checklist = await prismaAny.closeoutChecklist.findUnique({
      where: { id: checklistId },
      include: {
        items: true,
      },
    })

    if (!checklist) return

    const allRequiredCompleted = checklist.items
      .filter((item: any) => item.required)
      .every((item: any) => item.status === 'COMPLETED')

    if (allRequiredCompleted && checklist.status !== 'completed') {
      await prismaAny.closeoutChecklist.update({
        where: { id: checklistId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      })
    }
  },

  /**
   * Complete closeout checklist and release final payment (Prompt 3.7)
   */
  async completeCloseout(projectId: string, userId: string) {
    const project = await prismaAny.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true } },
        closeoutChecklist: {
          include: {
            items: true,
          },
        },
        escrow: true,
      },
    })

    if (!project) throw new NotFoundError('Project', projectId)
    if (project.ownerId !== userId) {
      throw new AuthorizationError('Only project owner can complete closeout')
    }

    if (project.status !== 'CLOSEOUT') {
      throw new ValidationError(`Project must be in CLOSEOUT status (current: ${project.status})`)
    }

    const checklist = project.closeoutChecklist
    if (!checklist) {
      throw new ValidationError('Closeout checklist not found')
    }

    // Verify all required items are completed
    const incompleteItems = checklist.items.filter(
      (item: any) => item.required && item.status !== 'COMPLETED'
    )
    if (incompleteItems.length > 0) {
      throw new ValidationError(
        `Cannot complete closeout: ${incompleteItems.length} required item(s) not completed`
      )
    }

    // Mark checklist as completed
    await prismaAny.closeoutChecklist.update({
      where: { id: checklist.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        completedBy: userId,
      },
    })

    // Prompt 3.7: Final payment processing - Release final holdback if escrow exists
    if (project.escrow && project.escrow.currentBalance > 0) {
      // Get all milestones to calculate remaining holdback
      const milestones = await prismaAny.milestone.findMany({
        where: {
          projectId,
          contractId: project.escrow.contractId || undefined,
        },
      })

      const totalMilestoneAmount = milestones.reduce(
        (sum: number, m: any) => sum + Number(m.amount || 0),
        0
      )
      const holdbackAmount = (totalMilestoneAmount * Number(project.escrow.holdbackPercentage || 10)) / 100

      if (project.escrow.currentBalance >= holdbackAmount) {
        // Create final payment transaction
        const balanceBefore = project.escrow.currentBalance
        const balanceAfter = balanceBefore - holdbackAmount

        await prismaAny.escrowTransaction.create({
          data: {
            escrowId: project.escrow.id,
            type: 'RELEASE_FINAL',
            amount: holdbackAmount,
            balanceBefore,
            balanceAfter,
            status: 'PENDING',
            metadata: {
              type: 'final_holdback',
              notes: 'Final payment released upon closeout completion',
            },
          },
        })

        // Update escrow balance
        await prismaAny.escrowAgreement.update({
          where: { id: project.escrow.id },
          data: {
            currentBalance: balanceAfter,
            status: balanceAfter === 0 ? 'CLOSED' : 'ACTIVE',
          },
        })

        // Create a ScheduledPayment record for the final holdback release
        await prismaAny.scheduledPayment.create({
          data: {
            escrowId: project.escrow.id,
            projectId,
            amount: holdbackAmount,
            type: 'FINAL_HOLDBACK_RELEASE',
            status: 'PENDING',
            scheduledFor: new Date(),
            metadata: {
              closeoutChecklistId: checklist.id,
              balanceBefore,
              balanceAfter,
              notes: 'Final holdback payment scheduled upon closeout completion',
            },
          },
        })
        console.log('Scheduled final holdback payment:', { projectId, amount: holdbackAmount })
      }
    }

    // Update project status to COMPLETED
    await prismaAny.project.update({
      where: { id: projectId },
      data: {
        status: 'COMPLETED',
        endDate: new Date(),
      },
    })

    // Create audit log
    await prismaAny.auditLog.create({
      data: {
        entityType: 'Project',
        entityId: projectId,
        action: 'CLOSEOUT_COMPLETED',
        details: {
          checklistId: checklist.id,
        },
        userId: userId,
        reason: 'Project closeout checklist completed',
      },
    })

    // Create event
    await prismaAny.event.create({
      data: {
        entityType: 'Project',
        entityId: projectId,
        type: 'PROJECT_CLOSEOUT_COMPLETED',
        payload: {
          checklistId: checklist.id,
        },
        userId: userId,
      },
    })

    return {
      checklist,
      project: await prismaAny.project.findUnique({ where: { id: projectId } }),
    }
  },

  /**
   * Create punch list item (Prompt 3.7)
   */
  async createPunchListItem(
    projectId: string,
    userId: string,
    input: {
      title: string
      description?: string
      category?: string
      priority?: string
      location?: string
      dueDate?: Date
      checklistItemId?: string
    }
  ) {
    const project = await prismaAny.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true } },
      },
    })

    if (!project) throw new NotFoundError('Project', projectId)
    if (project.ownerId !== userId) {
      throw new AuthorizationError('Only project owner can create punch list items')
    }

    const item = await prismaAny.punchListItem.create({
      data: {
        projectId,
        checklistItemId: input.checklistItemId || null,
        title: input.title,
        description: input.description || null,
        category: input.category || null,
        priority: input.priority || 'normal',
        location: input.location || null,
        dueDate: input.dueDate || null,
        status: 'open',
      },
    })

    return item
  },

  /**
   * Get punch list items for project (Prompt 3.7)
   */
  async getPunchListItems(projectId: string, userId: string) {
    const project = await prismaAny.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true } },
      },
    })

    if (!project) throw new NotFoundError('Project', projectId)
    if (project.ownerId !== userId) {
      throw new AuthorizationError('Only project owner can view punch list items')
    }

    const items = await prismaAny.punchListItem.findMany({
      where: { projectId },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    })

    return items
  },

  /**
   * Update punch list item (Prompt 3.7)
   */
  async updatePunchListItem(
    itemId: string,
    userId: string,
    input: {
      status?: string
      completionNotes?: string
      photos?: string[]
      assignedTo?: string
    }
  ) {
    const item = await prismaAny.punchListItem.findUnique({
      where: { id: itemId },
      include: {
        project: { select: { ownerId: true } },
      },
    })

    if (!item) throw new NotFoundError('PunchListItem', itemId)
    if (item.project.ownerId !== userId) {
      throw new AuthorizationError('Only project owner can update punch list items')
    }

    const updateData: any = {}
    if (input.status) updateData.status = input.status
    if (input.completionNotes !== undefined) updateData.completionNotes = input.completionNotes
    if (input.photos) updateData.photos = input.photos
    if (input.assignedTo !== undefined) updateData.assignedTo = input.assignedTo

    if (input.status === 'completed') {
      updateData.completedAt = new Date()
      updateData.completedBy = userId
    }

    const updated = await prismaAny.punchListItem.update({
      where: { id: itemId },
      data: updateData,
    })

    return updated
  },
}
