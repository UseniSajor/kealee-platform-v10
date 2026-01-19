/**
 * Architect Review Workflow Service
 * Handles deliverable review and approval workflow
 */

import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, ValidationError, AuthorizationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'

class ArchitectReviewWorkflowService {
  /**
   * Submit deliverable for review
   */
  async submitDeliverableForReview(
    deliverableId: string,
    userId: string,
    notes?: string
  ) {
    const deliverable = await prismaAny.designDeliverable.findUnique({
      where: { id: deliverableId },
      include: {
        designProject: {
          include: {
            teamMembers: {
              where: { userId },
            },
          },
        },
      },
    })

    if (!deliverable) {
      throw new NotFoundError('DesignDeliverable', deliverableId)
    }

    // Check if user is team member
    const isTeamMember = deliverable.designProject.teamMembers.length > 0
    if (!isTeamMember) {
      throw new AuthorizationError('Only team members can submit deliverables for review')
    }

    if (deliverable.status !== 'DRAFT' && deliverable.status !== 'IN_REVISION') {
      throw new ValidationError(`Deliverable must be in DRAFT or IN_REVISION status (current: ${deliverable.status})`)
    }

    // Update deliverable status
    const updated = await prismaAny.designDeliverable.update({
      where: { id: deliverableId },
      data: {
        status: 'SUBMITTED_FOR_REVIEW',
        submittedAt: new Date(),
        submittedBy: userId,
      },
    })

    // Create review request if not exists
    let reviewRequest = await prismaAny.reviewRequest.findFirst({
      where: {
        designProjectId: deliverable.designProjectId,
        deliverableIds: {
          has: deliverableId,
        },
        status: {
          in: ['DRAFT', 'IN_PROGRESS'],
        },
      },
    })

    if (!reviewRequest) {
      // Get project owner as default reviewer
      const project = await prismaAny.project.findUnique({
        where: { id: deliverable.designProject.projectId || '' },
        select: { ownerId: true },
      })

      const reviewerIds = project?.ownerId ? [project.ownerId] : []

      if (reviewerIds.length === 0) {
        throw new ValidationError('No reviewers available. Please assign reviewers to the project.')
      }

      reviewRequest = await prismaAny.reviewRequest.create({
        data: {
          designProjectId: deliverable.designProjectId,
          title: `Review: ${deliverable.name}`,
          description: notes || `Review request for ${deliverable.name}`,
          deliverableIds: [deliverableId],
          reviewerIds,
          status: 'IN_PROGRESS',
          createdById: userId,
        },
      })
    }

    // Create audit log
    await auditService.recordAudit({
      action: 'DELIVERABLE_SUBMITTED_FOR_REVIEW',
      entityType: 'DesignDeliverable',
      entityId: deliverableId,
      userId,
      reason: `Submitted for review: ${notes || ''}`,
      after: {
        status: 'SUBMITTED_FOR_REVIEW',
        reviewRequestId: reviewRequest.id,
      },
    })

    // Create event
    await eventService.recordEvent({
      entityType: 'DesignDeliverable',
      entityId: deliverableId,
      type: 'DELIVERABLE_SUBMITTED_FOR_REVIEW',
      payload: {
        reviewRequestId: reviewRequest.id,
        notes,
      },
      userId,
    })

    return {
      deliverable: updated,
      reviewRequest,
    }
  }

  /**
   * Add comment to deliverable
   */
  async addComment(
    deliverableId: string,
    userId: string,
    comment: string,
    fileId?: string,
    x?: number,
    y?: number
  ) {
    const deliverable = await prismaAny.designDeliverable.findUnique({
      where: { id: deliverableId },
    })

    if (!deliverable) {
      throw new NotFoundError('DesignDeliverable', deliverableId)
    }

    // Extract @mentions
    const mentionRegex = /@(\w+)/g
    const mentions: string[] = []
    let match
    while ((match = mentionRegex.exec(comment)) !== null) {
      mentions.push(match[1])
    }

    // Create comment
    const commentRecord = await prismaAny.designComment.create({
      data: {
        designProjectId: deliverable.designProjectId,
        deliverableId,
        fileId: fileId || null,
        comment,
        x: x || null,
        y: y || null,
        createdBy: userId,
        mentions: mentions.length > 0 ? mentions : null,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Create event for mentions
    if (mentions.length > 0) {
      for (const mention of mentions) {
        // Find user by name or email
        const mentionedUser = await prismaAny.user.findFirst({
          where: {
            OR: [
              { name: { contains: mention, mode: 'insensitive' } },
              { email: { contains: mention, mode: 'insensitive' } },
            ],
          },
        })

        if (mentionedUser) {
          await eventService.recordEvent({
            entityType: 'DesignComment',
            entityId: commentRecord.id,
            type: 'MENTIONED_IN_COMMENT',
            payload: {
              deliverableId,
              commentId: commentRecord.id,
              commenterId: userId,
            },
            userId: mentionedUser.id,
          })
        }
      }
    }

    return commentRecord
  }

  /**
   * Approve or reject deliverable
   */
  async reviewDeliverable(
    deliverableId: string,
    userId: string,
    decision: 'APPROVED' | 'REJECTED',
    feedback?: string
  ) {
    const deliverable = await prismaAny.designDeliverable.findUnique({
      where: { id: deliverableId },
      include: {
        designProject: {
          include: {
            project: {
              select: { ownerId: true },
            },
          },
        },
      },
    })

    if (!deliverable) {
      throw new NotFoundError('DesignDeliverable', deliverableId)
    }

    // Check if user is reviewer (project owner or assigned reviewer)
    const isProjectOwner = deliverable.designProject.project?.ownerId === userId
    const reviewRequest = await prismaAny.reviewRequest.findFirst({
      where: {
        designProjectId: deliverable.designProjectId,
        deliverableIds: {
          has: deliverableId,
        },
        reviewerIds: {
          has: userId,
        },
      },
    })

    if (!isProjectOwner && !reviewRequest) {
      throw new AuthorizationError('Only assigned reviewers can approve/reject deliverables')
    }

    if (deliverable.status !== 'SUBMITTED_FOR_REVIEW') {
      throw new ValidationError(`Deliverable must be in SUBMITTED_FOR_REVIEW status (current: ${deliverable.status})`)
    }

    // Update deliverable
    const updated = await prismaAny.designDeliverable.update({
      where: { id: deliverableId },
      data: {
        status: decision === 'APPROVED' ? 'APPROVED' : 'IN_REVISION',
        reviewedAt: new Date(),
        reviewedBy: userId,
        reviewFeedback: feedback || null,
        revisionRound: decision === 'REJECTED' ? (deliverable.revisionRound || 0) + 1 : deliverable.revisionRound || 0,
      },
    })

    // Create audit log
    await auditService.recordAudit({
      action: decision === 'APPROVED' ? 'DELIVERABLE_APPROVED' : 'DELIVERABLE_REJECTED',
      entityType: 'DesignDeliverable',
      entityId: deliverableId,
      userId,
      reason: feedback || `${decision} deliverable`,
      after: {
        status: updated.status,
        revisionRound: updated.revisionRound,
      },
    })

    // Create event
    await eventService.recordEvent({
      entityType: 'DesignDeliverable',
      entityId: deliverableId,
      type: decision === 'APPROVED' ? 'DELIVERABLE_APPROVED' : 'DELIVERABLE_REJECTED',
      payload: {
        feedback,
        revisionRound: updated.revisionRound,
      },
      userId,
    })

    // If approved, trigger handoff to permits if applicable
    if (decision === 'APPROVED' && deliverable.deliverableType === 'CONSTRUCTION_DOCUMENTS') {
      await this.triggerPermitHandoff(deliverableId, userId)
    }

    return updated
  }

  /**
   * Trigger handoff to permits app
   */
  async triggerPermitHandoff(deliverableId: string, userId: string) {
    const deliverable = await prismaAny.designDeliverable.findUnique({
      where: { id: deliverableId },
      include: {
        designProject: {
          include: {
            project: true,
          },
        },
      },
    })

    if (!deliverable) {
      throw new NotFoundError('DesignDeliverable', deliverableId)
    }

    if (!deliverable.designProject.projectId) {
      throw new ValidationError('Design project must be linked to a Project Owner project for permit handoff')
    }

    // Get associated files
    const files = await prismaAny.designFile.findMany({
      where: {
        designProjectId: deliverable.designProjectId,
        status: 'ACTIVE',
      },
    })

    // Create permit application (if permits module exists)
    // This would integrate with m-permits-inspections app
    await eventService.recordEvent({
      entityType: 'DesignDeliverable',
      entityId: deliverableId,
      type: 'PERMIT_HANDOFF_TRIGGERED',
      payload: {
        projectId: deliverable.designProject.projectId,
        fileCount: files.length,
        deliverableName: deliverable.name,
      },
      userId,
    })

    // TODO: Create permit application via permits API
    // await permitService.createApplicationFromDesign(deliverable.designProject.projectId, files)

    return {
      success: true,
      message: 'Permit handoff triggered',
      projectId: deliverable.designProject.projectId,
    }
  }

  /**
   * Get review status for deliverable
   */
  async getReviewStatus(deliverableId: string, userId: string) {
    const deliverable = await prismaAny.designDeliverable.findUnique({
      where: { id: deliverableId },
      include: {
        reviewRequests: {
          include: {
            reviewers: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        comments: {
          include: {
            createdByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!deliverable) {
      throw new NotFoundError('DesignDeliverable', deliverableId)
    }

    return {
      deliverable: {
        id: deliverable.id,
        name: deliverable.name,
        status: deliverable.status,
        revisionRound: deliverable.revisionRound,
        reviewedAt: deliverable.reviewedAt,
        reviewFeedback: deliverable.reviewFeedback,
      },
      reviewRequests: deliverable.reviewRequests,
      comments: deliverable.comments,
    }
  }
}

export const architectReviewWorkflowService = new ArchitectReviewWorkflowService()
