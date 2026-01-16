import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'

export const collaborationService = {
  /**
   * Update or create document presence
   */
  async updatePresence(data: {
    designProjectId: string
    targetType: string
    targetId: string
    userId: string
    status?: string
    viewportPosition?: any
    cursorPosition?: any
  }) {
    const presence = await prismaAny.documentPresence.upsert({
      where: {
        targetType_targetId_userId: {
          targetType: data.targetType,
          targetId: data.targetId,
          userId: data.userId,
        },
      },
      update: {
        status: (data.status as any) || 'VIEWING',
        lastSeenAt: new Date(),
        viewportPosition: data.viewportPosition as any,
        cursorPosition: data.cursorPosition as any,
      },
      create: {
        designProjectId: data.designProjectId,
        targetType: data.targetType,
        targetId: data.targetId,
        userId: data.userId,
        status: (data.status as any) || 'VIEWING',
        viewportPosition: data.viewportPosition as any,
        cursorPosition: data.cursorPosition as any,
      },
    })

    return presence
  },

  /**
   * Get active presence for a document
   */
  async getPresence(designProjectId: string, targetType: string, targetId: string) {
    // Get all active presence (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const presence = await prismaAny.documentPresence.findMany({
      where: {
        designProjectId,
        targetType,
        targetId,
        lastSeenAt: {
          gte: fiveMinutesAgo,
        },
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
      orderBy: {
        lastSeenAt: 'desc',
      },
    })

    return presence
  },

  /**
   * Remove presence (user left document)
   */
  async removePresence(targetType: string, targetId: string, userId: string) {
    await prismaAny.documentPresence.deleteMany({
      where: {
        targetType,
        targetId,
        userId,
      },
    })
  },

  /**
   * Record document change
   */
  async recordChange(data: {
    designProjectId: string
    targetType: string
    targetId: string
    changeType: string
    changeDescription?: string
    oldValue?: any
    newValue?: any
    diffData?: any
    pageNumber?: number
    sectionPath?: string
    coordinates?: any
    versionBefore?: string
    versionAfter?: string
    createdById: string
  }) {
    const change = await prismaAny.documentChange.create({
      data: {
        designProjectId: data.designProjectId,
        targetType: data.targetType,
        targetId: data.targetId,
        changeType: data.changeType as any,
        changeDescription: data.changeDescription,
        oldValue: data.oldValue as any,
        newValue: data.newValue as any,
        diffData: data.diffData as any,
        pageNumber: data.pageNumber,
        sectionPath: data.sectionPath,
        coordinates: data.coordinates as any,
        versionBefore: data.versionBefore,
        versionAfter: data.versionAfter,
        createdById: data.createdById,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DOCUMENT_CHANGE_RECORDED',
      entityType: 'DocumentChange',
      entityId: change.id,
      userId: data.createdById,
      reason: data.changeDescription || `Document ${data.changeType.toLowerCase()}`,
      after: {
        changeType: data.changeType,
        targetType: data.targetType,
        targetId: data.targetId,
      },
    })

    return change
  },

  /**
   * Get document changes (for visual diff)
   */
  async getChanges(designProjectId: string, targetType: string, targetId: string, filters?: {
    changeType?: string
    fromDate?: Date
    toDate?: Date
  }) {
    const where: any = {
      designProjectId,
      targetType,
      targetId,
    }

    if (filters?.changeType) {
      where.changeType = filters.changeType
    }

    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {}
      if (filters.fromDate) {
        where.createdAt.gte = filters.fromDate
      }
      if (filters.toDate) {
        where.createdAt.lte = filters.toDate
      }
    }

    const changes = await prismaAny.documentChange.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return changes
  },

  /**
   * Create digital signature request
   */
  async createSignatureRequest(data: {
    designProjectId: string
    targetType: string
    targetId: string
    signerId: string
    expiresAt?: Date
    approvalNotes?: string
  }) {
    const signature = await prismaAny.digitalSignature.create({
      data: {
        designProjectId: data.designProjectId,
        targetType: data.targetType,
        targetId: data.targetId,
        signerId: data.signerId,
        signatureStatus: 'PENDING',
        expiresAt: data.expiresAt,
        approvalNotes: data.approvalNotes,
      },
      include: {
        signer: {
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
      action: 'SIGNATURE_REQUEST_CREATED',
      entityType: 'DigitalSignature',
      entityId: signature.id,
      userId: data.signerId,
      reason: `Signature requested for ${data.targetType}`,
      after: {
        targetType: data.targetType,
        targetId: data.targetId,
      },
    })

    // TODO: Send notification to signer
    // await notificationService.notifySignatureRequest(signature.id)

    return signature
  },

  /**
   * Sign document
   */
  async signDocument(signatureId: string, data: {
    signatureData?: any
    signatureImageUrl?: string
    ipAddress?: string
    userAgent?: string
    userId: string
  }) {
    const signature = await prismaAny.digitalSignature.findUnique({
      where: { id: signatureId },
    })

    if (!signature) {
      throw new NotFoundError('DigitalSignature', signatureId)
    }

    if (signature.signerId !== data.userId) {
      throw new ValidationError('Only the assigned signer can sign this document')
    }

    if (signature.signatureStatus !== 'PENDING') {
      throw new ValidationError('Signature is not pending')
    }

    if (signature.expiresAt && new Date(signature.expiresAt) < new Date()) {
      throw new ValidationError('Signature request has expired')
    }

    const updated = await prismaAny.digitalSignature.update({
      where: { id: signatureId },
      data: {
        signatureStatus: 'SIGNED',
        signatureData: data.signatureData as any,
        signatureImageUrl: data.signatureImageUrl,
        signedAt: new Date(),
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DOCUMENT_SIGNED',
      entityType: 'DigitalSignature',
      entityId: signatureId,
      userId: data.userId,
      reason: 'Document signed',
      after: {
        signatureStatus: 'SIGNED',
        signedAt: updated.signedAt,
      },
    })

    // Log event
    await eventService.recordEvent({
      type: 'DOCUMENT_SIGNED',
      entityType: 'DigitalSignature',
      entityId: signatureId,
      userId: data.userId,
      payload: {
        targetType: signature.targetType,
        targetId: signature.targetId,
        designProjectId: signature.designProjectId,
      },
    })

    return updated
  },

  /**
   * Get signatures for a document
   */
  async getSignatures(designProjectId: string, targetType: string, targetId: string) {
    const signatures = await prismaAny.digitalSignature.findMany({
      where: {
        designProjectId,
        targetType,
        targetId,
      },
      include: {
        signer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return signatures
  },

  /**
   * Create meeting minute
   */
  async createMeetingMinute(data: {
    designProjectId: string
    title: string
    meetingDate: Date
    meetingDurationMinutes?: number
    location?: string
    meetingType?: string
    attendeeIds: string[]
    organizerId: string
    agenda?: string
    discussionNotes?: string
    decisionsMade?: any
    attachments?: string[]
    nextMeetingDate?: Date
    createdById: string
  }) {
    const meeting = await prismaAny.meetingMinute.create({
      data: {
        designProjectId: data.designProjectId,
        title: data.title,
        meetingDate: data.meetingDate,
        meetingDurationMinutes: data.meetingDurationMinutes,
        location: data.location,
        meetingType: data.meetingType,
        attendeeIds: data.attendeeIds,
        organizerId: data.organizerId,
        agenda: data.agenda,
        discussionNotes: data.discussionNotes,
        decisionsMade: data.decisionsMade as any,
        attachments: data.attachments || [],
        nextMeetingDate: data.nextMeetingDate,
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
      action: 'MEETING_MINUTE_CREATED',
      entityType: 'MeetingMinute',
      entityId: meeting.id,
      userId: data.createdById,
      reason: `Meeting minute created: ${data.title}`,
      after: {
        title: data.title,
        attendeeCount: data.attendeeIds.length,
      },
    })

    // TODO: Send notifications to attendees
    // await notificationService.notifyMeetingMinute(meeting.id, data.attendeeIds)

    return meeting
  },

  /**
   * Get meeting minute
   */
  async getMeetingMinute(meetingId: string) {
    const meeting = await prismaAny.meetingMinute.findUnique({
      where: { id: meetingId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        actionItems: {
          include: {
            assignedTo: {
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
              },
            },
          },
        },
      },
    })

    if (!meeting) {
      throw new NotFoundError('MeetingMinute', meetingId)
    }

    // Get attendees
    const attendees = await prismaAny.user.findMany({
      where: {
        id: { in: meeting.attendeeIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    return {
      ...meeting,
      attendees,
    }
  },

  /**
   * List meeting minutes
   */
  async listMeetingMinutes(designProjectId: string, filters?: {
    fromDate?: Date
    toDate?: Date
    meetingType?: string
  }) {
    const where: any = {
      designProjectId,
    }

    if (filters?.fromDate || filters?.toDate) {
      where.meetingDate = {}
      if (filters.fromDate) {
        where.meetingDate.gte = filters.fromDate
      }
      if (filters.toDate) {
        where.meetingDate.lte = filters.toDate
      }
    }

    if (filters?.meetingType) {
      where.meetingType = filters.meetingType
    }

    const meetings = await prismaAny.meetingMinute.findMany({
      where,
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
            actionItems: true,
          },
        },
      },
      orderBy: {
        meetingDate: 'desc',
      },
    })

    return meetings
  },

  /**
   * Create action item
   */
  async createActionItem(data: {
    designProjectId: string
    sourceType: string
    sourceId?: string
    meetingMinuteId?: string
    title: string
    description?: string
    priority?: string
    assignedToId?: string
    assignedById: string
    dueDate?: Date
    relatedDeliverableIds?: string[]
    relatedFileIds?: string[]
    createdById: string
  }) {
    const actionItem = await prismaAny.actionItem.create({
      data: {
        designProjectId: data.designProjectId,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        meetingMinuteId: data.meetingMinuteId || (data.sourceType === 'MEETING' && data.sourceId ? data.sourceId : undefined),
        title: data.title,
        description: data.description,
        priority: data.priority,
        assignedToId: data.assignedToId,
        assignedById: data.assignedById,
        dueDate: data.dueDate,
        relatedDeliverableIds: data.relatedDeliverableIds || [],
        relatedFileIds: data.relatedFileIds || [],
        createdById: data.createdById,
        status: 'OPEN',
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'ACTION_ITEM_CREATED',
      entityType: 'ActionItem',
      entityId: actionItem.id,
      userId: data.createdById,
      reason: `Action item created: ${data.title}`,
      after: {
        title: data.title,
        assignedToId: data.assignedToId,
      },
    })

    // TODO: Send notification to assigned user
    // if (data.assignedToId) {
    //   await notificationService.notifyActionItemAssigned(actionItem.id, data.assignedToId)
    // }

    return actionItem
  },

  /**
   * Update action item status
   */
  async updateActionItemStatus(actionItemId: string, data: {
    status: string
    completionNotes?: string
    userId: string
  }) {
    const actionItem = await prismaAny.actionItem.findUnique({
      where: { id: actionItemId },
    })

    if (!actionItem) {
      throw new NotFoundError('ActionItem', actionItemId)
    }

    const updateData: any = {
      status: data.status as any,
    }

    if (data.status === 'COMPLETED' && !actionItem.completedAt) {
      updateData.completedAt = new Date()
      updateData.completedById = data.userId
      if (data.completionNotes) {
        updateData.completionNotes = data.completionNotes
      }
    }

    const updated = await prismaAny.actionItem.update({
      where: { id: actionItemId },
      data: updateData,
      include: {
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
      action: 'ACTION_ITEM_STATUS_UPDATED',
      entityType: 'ActionItem',
      entityId: actionItemId,
      userId: data.userId,
      reason: `Action item status updated to ${data.status}`,
      after: {
        status: data.status,
      },
    })

    return updated
  },

  /**
   * List action items
   */
  async listActionItems(designProjectId: string, filters?: {
    status?: string
    assignedToId?: string
    sourceType?: string
    sourceId?: string
  }) {
    const where: any = {
      designProjectId,
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.assignedToId) {
      where.assignedToId = filters.assignedToId
    }

    if (filters?.sourceType) {
      where.sourceType = filters.sourceType
    }

    if (filters?.sourceId) {
      where.sourceId = filters.sourceId
    }

    const actionItems = await prismaAny.actionItem.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return actionItems
  },

  /**
   * Create design decision
   */
  async createDesignDecision(data: {
    designProjectId: string
    title: string
    description?: string
    decisionText: string
    rationale?: string
    alternativesConsidered?: string
    impactScope?: string
    affectedDeliverableIds?: string[]
    affectedFileIds?: string[]
    supportingDocumentIds?: string[]
    referenceLinks?: string[]
    relatedPhaseId?: string
    relatedReviewRequestId?: string
    proposedById: string
    createdById: string
  }) {
    const decision = await prismaAny.designDecision.create({
      data: {
        designProjectId: data.designProjectId,
        title: data.title,
        description: data.description,
        decisionText: data.decisionText,
        rationale: data.rationale,
        alternativesConsidered: data.alternativesConsidered,
        impactScope: data.impactScope,
        affectedDeliverableIds: data.affectedDeliverableIds || [],
        affectedFileIds: data.affectedFileIds || [],
        supportingDocumentIds: data.supportingDocumentIds || [],
        referenceLinks: data.referenceLinks || [],
        relatedPhaseId: data.relatedPhaseId,
        relatedReviewRequestId: data.relatedReviewRequestId,
        proposedById: data.proposedById,
        createdById: data.createdById,
        status: 'DRAFT',
      },
      include: {
        proposedBy: {
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
          },
        },
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DESIGN_DECISION_CREATED',
      entityType: 'DesignDecision',
      entityId: decision.id,
      userId: data.createdById,
      reason: `Design decision created: ${data.title}`,
      after: {
        title: data.title,
        status: 'DRAFT',
      },
    })

    return decision
  },

  /**
   * Update design decision status
   */
  async updateDecisionStatus(decisionId: string, data: {
    status: string
    userId: string
  }) {
    const decision = await prismaAny.designDecision.findUnique({
      where: { id: decisionId },
    })

    if (!decision) {
      throw new NotFoundError('DesignDecision', decisionId)
    }

    const updateData: any = {
      status: data.status as any,
    }

    if (data.status === 'PROPOSED' && !decision.proposedAt) {
      updateData.proposedAt = new Date()
    }

    if (data.status === 'APPROVED' && !decision.approvedAt) {
      updateData.approvedAt = new Date()
      updateData.approvedById = data.userId
    }

    if (data.status === 'IMPLEMENTED' && !decision.implementedAt) {
      updateData.implementedAt = new Date()
      updateData.implementedById = data.userId
    }

    const updated = await prismaAny.designDecision.update({
      where: { id: decisionId },
      data: updateData,
      include: {
        approvedBy: {
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
    })

    // Log audit
    await auditService.recordAudit({
      action: 'DESIGN_DECISION_STATUS_UPDATED',
      entityType: 'DesignDecision',
      entityId: decisionId,
      userId: data.userId,
      reason: `Design decision status updated to ${data.status}`,
      after: {
        status: data.status,
      },
    })

    return updated
  },

  /**
   * List design decisions
   */
  async listDesignDecisions(designProjectId: string, filters?: {
    status?: string
    relatedPhaseId?: string
    relatedReviewRequestId?: string
  }) {
    const where: any = {
      designProjectId,
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.relatedPhaseId) {
      where.relatedPhaseId = filters.relatedPhaseId
    }

    if (filters?.relatedReviewRequestId) {
      where.relatedReviewRequestId = filters.relatedReviewRequestId
    }

    const decisions = await prismaAny.designDecision.findMany({
      where,
      include: {
        proposedBy: {
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

    return decisions
  },

  /**
   * Get design decision
   */
  async getDesignDecision(decisionId: string) {
    const decision = await prismaAny.designDecision.findUnique({
      where: { id: decisionId },
      include: {
        proposedBy: {
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
        implementedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!decision) {
      throw new NotFoundError('DesignDecision', decisionId)
    }

    return decision
  },
}
