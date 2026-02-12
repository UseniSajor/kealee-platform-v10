import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'
import { notificationService } from '../notifications/notification.service'

export const reviewService = {
  /**
   * Create review request
   */
  async createReviewRequest(data: {
    designProjectId: string
    title: string
    description?: string
    reviewType?: string
    priority?: string
    deliverableIds?: string[]
    fileIds?: string[]
    sheetIds?: string[]
    modelIds?: string[]
    reviewerIds: string[]
    reviewerTypes?: Record<string, string>
    reviewDeadline?: Date
    reminderDaysBefore?: number
    createdById: string
  }) {
    // Validate reviewers exist
    if (data.reviewerIds.length === 0) {
      throw new ValidationError('At least one reviewer must be assigned')
    }

    const reviewers = await prismaAny.user.findMany({
      where: {
        id: { in: data.reviewerIds },
      },
    })

    if (reviewers.length !== data.reviewerIds.length) {
      throw new ValidationError('One or more reviewers not found')
    }

    // Validate deliverables if provided
    if (data.deliverableIds && data.deliverableIds.length > 0) {
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
    }

    const reviewRequest = await prismaAny.reviewRequest.create({
      data: {
        designProjectId: data.designProjectId,
        title: data.title,
        description: data.description,
        reviewType: data.reviewType,
        priority: data.priority as any,
        deliverableIds: data.deliverableIds || [],
        fileIds: data.fileIds || [],
        sheetIds: data.sheetIds || [],
        modelIds: data.modelIds || [],
        reviewerIds: data.reviewerIds,
        reviewerTypes: data.reviewerTypes as any,
        reviewDeadline: data.reviewDeadline,
        reminderDaysBefore: data.reminderDaysBefore || 3,
        createdById: data.createdById,
        status: 'DRAFT',
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
      action: 'REVIEW_REQUEST_CREATED',
      entityType: 'ReviewRequest',
      entityId: reviewRequest.id,
      userId: data.createdById,
      reason: `Review request created: ${data.title}`,
      after: {
        title: data.title,
        reviewerCount: data.reviewerIds.length,
      },
    })

    // Log event
    await eventService.recordEvent({
      type: 'REVIEW_REQUEST_CREATED',
      entityType: 'ReviewRequest',
      entityId: reviewRequest.id,
      userId: data.createdById,
      payload: {
        title: data.title,
        designProjectId: data.designProjectId,
        reviewerIds: data.reviewerIds,
      },
    })

    // Send notifications to reviewers
    for (const reviewerId of data.reviewerIds) {
      await notificationService.sendNotification({
        userId: reviewerId,
        type: 'REVIEW_REQUEST_CREATED',
        title: 'New Review Request',
        message: `You have been assigned as a reviewer for: "${data.title}"`,
        metadata: {
          reviewRequestId: reviewRequest.id,
          reviewTitle: data.title,
          designProjectId: data.designProjectId,
          reviewDeadline: data.reviewDeadline?.toISOString(),
        },
      })
    }

    return reviewRequest
  },

  /**
   * Submit review request (change status from DRAFT to PENDING)
   */
  async submitReviewRequest(reviewRequestId: string, userId: string) {
    const reviewRequest = await prismaAny.reviewRequest.findUnique({
      where: { id: reviewRequestId },
    })

    if (!reviewRequest) {
      throw new NotFoundError('ReviewRequest', reviewRequestId)
    }

    if (reviewRequest.status !== 'DRAFT') {
      throw new ValidationError('Only draft review requests can be submitted')
    }

    if (reviewRequest.reviewerIds.length === 0) {
      throw new ValidationError('Review request must have at least one reviewer')
    }

    const updated = await prismaAny.reviewRequest.update({
      where: { id: reviewRequestId },
      data: {
        status: 'PENDING',
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'REVIEW_REQUEST_SUBMITTED',
      entityType: 'ReviewRequest',
      entityId: reviewRequestId,
      userId,
      reason: 'Review request submitted',
      after: {
        status: 'PENDING',
      },
    })

    // Send notifications to reviewers
    for (const reviewerId of reviewRequest.reviewerIds) {
      await notificationService.sendNotification({
        userId: reviewerId,
        type: 'REVIEW_REQUEST_SUBMITTED',
        title: 'Review Request Submitted',
        message: `Review request "${reviewRequest.title}" is now pending your review`,
        metadata: {
          reviewRequestId,
          reviewTitle: reviewRequest.title,
          designProjectId: reviewRequest.designProjectId,
        },
      })
    }

    return updated
  },

  /**
   * Start review (change status from PENDING to IN_REVIEW)
   */
  async startReview(reviewRequestId: string, userId: string) {
    const reviewRequest = await prismaAny.reviewRequest.findUnique({
      where: { id: reviewRequestId },
    })

    if (!reviewRequest) {
      throw new NotFoundError('ReviewRequest', reviewRequestId)
    }

    if (reviewRequest.status !== 'PENDING') {
      throw new ValidationError('Only pending review requests can be started')
    }

    // Verify user is a reviewer
    if (!reviewRequest.reviewerIds.includes(userId)) {
      throw new ValidationError('Only assigned reviewers can start the review')
    }

    const updated = await prismaAny.reviewRequest.update({
      where: { id: reviewRequestId },
      data: {
        status: 'IN_REVIEW',
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'REVIEW_STARTED',
      entityType: 'ReviewRequest',
      entityId: reviewRequestId,
      userId,
      reason: 'Review started',
      after: {
        status: 'IN_REVIEW',
      },
    })

    return updated
  },

  /**
   * Get review request with all related data
   */
  async getReviewRequest(reviewRequestId: string) {
    const reviewRequest = await prismaAny.reviewRequest.findUnique({
      where: { id: reviewRequestId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        completedBy: {
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
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    })

    if (!reviewRequest) {
      throw new NotFoundError('ReviewRequest', reviewRequestId)
    }

    // Get reviewers
    const reviewers = await prismaAny.user.findMany({
      where: {
        id: { in: reviewRequest.reviewerIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    // Get comments
    const comments = await prismaAny.reviewComment.findMany({
      where: {
        reviewRequestId: reviewRequestId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        addressedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        closedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        replies: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { createdAt: 'asc' },
      ],
    })

    return {
      ...reviewRequest,
      reviewers,
      comments,
    }
  },

  /**
   * List review requests for a project
   */
  async listReviewRequests(designProjectId: string, filters?: {
    status?: string
    reviewerId?: string
  }) {
    const where: any = {
      designProjectId,
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.reviewerId) {
      where.reviewerIds = {
        has: filters.reviewerId,
      }
    }

    const reviewRequests = await prismaAny.reviewRequest.findMany({
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
            comments: true,
          },
        },
      },
      orderBy: [
        { reviewDeadline: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return reviewRequests
  },

  /**
   * Create review comment
   */
  async createComment(data: {
    reviewRequestId?: string
    designProjectId?: string
    commentText: string
    commentType?: string
    targetType?: string
    targetId?: string
    pageNumber?: number
    coordinates?: any
    markupData?: any
    parentCommentId?: string
    mentionedUserIds?: string[]
    createdById: string
  }) {
    // Get designProjectId from review request if not provided
    let designProjectId = data.designProjectId

    if (!designProjectId && data.reviewRequestId) {
      const reviewRequest = await prismaAny.reviewRequest.findUnique({
        where: { id: data.reviewRequestId },
        select: { designProjectId: true },
      })

      if (!reviewRequest) {
        throw new NotFoundError('ReviewRequest', data.reviewRequestId)
      }

      designProjectId = reviewRequest.designProjectId
    }

    if (!designProjectId) {
      throw new ValidationError('designProjectId is required')
    }

    // Validate parent comment if provided
    if (data.parentCommentId) {
      const parent = await prismaAny.reviewComment.findUnique({
        where: { id: data.parentCommentId },
      })

      if (!parent) {
        throw new NotFoundError('ReviewComment', data.parentCommentId)
      }

      if (parent.designProjectId !== designProjectId) {
        throw new ValidationError('Parent comment must be from the same project')
      }
    }

    // Calculate thread depth
    let threadDepth = 0
    if (data.parentCommentId) {
      const parent = await prismaAny.reviewComment.findUnique({
        where: { id: data.parentCommentId },
      })
      threadDepth = (parent?.threadDepth || 0) + 1
    }

    const comment = await prismaAny.reviewComment.create({
      data: {
        reviewRequestId: data.reviewRequestId,
        designProjectId: designProjectId,
        commentText: data.commentText,
        commentType: data.commentType,
        targetType: data.targetType,
        targetId: data.targetId,
        pageNumber: data.pageNumber,
        coordinates: data.coordinates as any,
        markupData: data.markupData as any,
        parentCommentId: data.parentCommentId,
        threadDepth,
        mentionedUserIds: data.mentionedUserIds || [],
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
        parentComment: {
          select: {
            id: true,
            commentText: true,
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

    // Log audit
    await auditService.recordAudit({
      action: 'REVIEW_COMMENT_CREATED',
      entityType: 'ReviewComment',
      entityId: comment.id,
      userId: data.createdById,
      reason: 'Review comment created',
      after: {
        commentText: data.commentText.substring(0, 100),
        targetType: data.targetType,
      },
    })

    // Send notifications to mentioned users
    if (data.mentionedUserIds && data.mentionedUserIds.length > 0) {
      for (const mentionedUserId of data.mentionedUserIds) {
        await notificationService.sendNotification({
          userId: mentionedUserId,
          type: 'MENTIONED_IN_REVIEW_COMMENT',
          title: 'Mentioned in Review Comment',
          message: `You were mentioned in a review comment: "${data.commentText.substring(0, 100)}"`,
          metadata: {
            commentId: comment.id,
            reviewRequestId: data.reviewRequestId,
            designProjectId: designProjectId,
            commentedById: data.createdById,
          },
        })
      }
    }

    return comment
  },

  /**
   * Update comment status
   */
  async updateCommentStatus(commentId: string, data: {
    status: string
    addressedNotes?: string
    userId: string
  }) {
    const comment = await prismaAny.reviewComment.findUnique({
      where: { id: commentId },
    })

    if (!comment) {
      throw new NotFoundError('ReviewComment', commentId)
    }

    const updateData: any = {
      status: data.status as any,
    }

    if (data.status === 'ADDRESSED' && !comment.addressedAt) {
      updateData.addressedAt = new Date()
      updateData.addressedById = data.userId
      if (data.addressedNotes) {
        updateData.addressedNotes = data.addressedNotes
      }
    }

    if (data.status === 'CLOSED' && !comment.closedAt) {
      updateData.closedAt = new Date()
      updateData.closedById = data.userId
    }

    if (data.status === 'RESOLVED') {
      updateData.closedAt = new Date()
      updateData.closedById = data.userId
    }

    const updated = await prismaAny.reviewComment.update({
      where: { id: commentId },
      data: updateData,
    })

    // Log audit
    await auditService.recordAudit({
      action: 'REVIEW_COMMENT_STATUS_UPDATED',
      entityType: 'ReviewComment',
      entityId: commentId,
      userId: data.userId,
      reason: `Comment status updated to ${data.status}`,
      after: {
        status: data.status,
      },
    })

    return updated
  },

  /**
   * Complete review request
   */
  async completeReviewRequest(reviewRequestId: string, data: {
    completionNotes?: string
    userId: string
  }) {
    const reviewRequest = await prismaAny.reviewRequest.findUnique({
      where: { id: reviewRequestId },
    })

    if (!reviewRequest) {
      throw new NotFoundError('ReviewRequest', reviewRequestId)
    }

    if (reviewRequest.status !== 'IN_REVIEW') {
      throw new ValidationError('Only reviews in progress can be completed')
    }

    const updated = await prismaAny.reviewRequest.update({
      where: { id: reviewRequestId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completedById: data.userId,
        completionNotes: data.completionNotes,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'REVIEW_REQUEST_COMPLETED',
      entityType: 'ReviewRequest',
      entityId: reviewRequestId,
      userId: data.userId,
      reason: data.completionNotes || 'Review completed',
      after: {
        status: 'COMPLETED',
        completedAt: updated.completedAt,
      },
    })

    // Log event
    await eventService.recordEvent({
      type: 'REVIEW_REQUEST_COMPLETED',
      entityType: 'ReviewRequest',
      entityId: reviewRequestId,
      userId: data.userId,
      payload: {
        title: reviewRequest.title,
        designProjectId: reviewRequest.designProjectId,
      },
    })

    return updated
  },

  /**
   * Approve review request
   */
  async approveReviewRequest(reviewRequestId: string, data: {
    approvalNotes?: string
    userId: string
  }) {
    const reviewRequest = await prismaAny.reviewRequest.findUnique({
      where: { id: reviewRequestId },
    })

    if (!reviewRequest) {
      throw new NotFoundError('ReviewRequest', reviewRequestId)
    }

    if (reviewRequest.status !== 'COMPLETED') {
      throw new ValidationError('Only completed reviews can be approved')
    }

    const updated = await prismaAny.reviewRequest.update({
      where: { id: reviewRequestId },
      data: {
        approvedAt: new Date(),
        approvedById: data.userId,
        approvalNotes: data.approvalNotes,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'REVIEW_REQUEST_APPROVED',
      entityType: 'ReviewRequest',
      entityId: reviewRequestId,
      userId: data.userId,
      reason: data.approvalNotes || 'Review approved',
      after: {
        approvedAt: updated.approvedAt,
      },
    })

    return updated
  },

  /**
   * Get overdue review requests
   */
  async getOverdueReviewRequests(designProjectId?: string) {
    const now = new Date()
    const where: any = {
      reviewDeadline: {
        lt: now,
      },
      status: {
        notIn: ['COMPLETED', 'CANCELLED'],
      },
    }

    if (designProjectId) {
      where.designProjectId = designProjectId
    }

    const overdue = await prismaAny.reviewRequest.findMany({
      where,
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
      orderBy: {
        reviewDeadline: 'asc',
      },
    })

    return overdue
  },

  /**
   * Get review requests due soon
   */
  async getReviewRequestsDueSoon(designProjectId?: string, days: number = 3) {
    const now = new Date()
    const soon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    const where: any = {
      reviewDeadline: {
        gte: now,
        lte: soon,
      },
      status: {
        notIn: ['COMPLETED', 'CANCELLED'],
      },
    }

    if (designProjectId) {
      where.designProjectId = designProjectId
    }

    const dueSoon = await prismaAny.reviewRequest.findMany({
      where,
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
      orderBy: {
        reviewDeadline: 'asc',
      },
    })

    return dueSoon
  },

  /**
   * Send review reminder (placeholder - would integrate with notification service)
   */
  async sendReviewReminder(reviewRequestId: string, userId: string, reminderType: string) {
    const reviewRequest = await prismaAny.reviewRequest.findUnique({
      where: { id: reviewRequestId },
    })

    if (!reviewRequest) {
      throw new NotFoundError('ReviewRequest', reviewRequestId)
    }

    if (!reviewRequest.reviewerIds.includes(userId)) {
      throw new ValidationError('User is not a reviewer for this review request')
    }

    // Create reminder record
    const reminder = await prismaAny.reviewReminder.create({
      data: {
        reviewRequestId,
        userId,
        reminderType,
        message: `Reminder: Review "${reviewRequest.title}" is ${reminderType === 'OVERDUE' ? 'overdue' : 'due soon'}`,
      },
    })

    // Update reminder sent timestamp
    await prismaAny.reviewRequest.update({
      where: { id: reviewRequestId },
      data: {
        reminderSentAt: new Date(),
      },
    })

    // Send the review reminder notification
    await notificationService.sendNotification({
      userId,
      type: 'REVIEW_REMINDER',
      title: `Review Reminder: ${reminderType === 'OVERDUE' ? 'Overdue' : 'Due Soon'}`,
      message: `Reminder: Review "${reviewRequest.title}" is ${reminderType === 'OVERDUE' ? 'overdue' : 'due soon'}`,
      metadata: {
        reviewRequestId,
        reminderId: reminder.id,
        reminderType,
        reviewTitle: reviewRequest.title,
        reviewDeadline: reviewRequest.reviewDeadline?.toISOString(),
      },
    })

    return reminder
  },

  /**
   * Get review summary/dashboard data
   */
  async getReviewSummary(designProjectId: string) {
    const reviewRequests = await prismaAny.reviewRequest.findMany({
      where: { designProjectId },
      include: {
        _count: {
          select: {
            comments: true,
          },
        },
      },
    })

    const summary = {
      total: reviewRequests.length,
      byStatus: {
        DRAFT: reviewRequests.filter((r: any) => r.status === 'DRAFT').length,
        PENDING: reviewRequests.filter((r: any) => r.status === 'PENDING').length,
        IN_REVIEW: reviewRequests.filter((r: any) => r.status === 'IN_REVIEW').length,
        COMPLETED: reviewRequests.filter((r: any) => r.status === 'COMPLETED').length,
        CANCELLED: reviewRequests.filter((r: any) => r.status === 'CANCELLED').length,
      },
      totalComments: reviewRequests.reduce((sum: number, r: any) => sum + (r._count?.comments || 0), 0),
      overdue: reviewRequests.filter((r: any) => {
        if (!r.reviewDeadline) return false
        return new Date(r.reviewDeadline) < new Date() && !['COMPLETED', 'CANCELLED'].includes(r.status)
      }).length,
    }

    return summary
  },
}
