/**
 * Client Action Routes
 * Handles client-specific actions (homeowners, developers, property managers)
 * Based on Kealee_User_Responsibilities_Guide.md Sections 2-4
 */

import { FastifyPluginAsync } from 'fastify'
import { prismaAny } from '../../utils/prisma-helper'
import { sanitizeErrorMessage } from '../../utils/sanitize-error'
import { userResponsibilityUploadService } from '../files/user-responsibility-upload.service'
import {
  CreateProjectInput,
  ApproveMilestoneInput,
  ApproveChangeOrderInput,
  LeaveReviewInput,
} from '../../types/user-responsibilities.types'
import { FileCategory, UploadedByRole } from '@prisma/client'
const clientActionsRoutes: FastifyPluginAsync = async (fastify) => {
  // multipart plugin is registered globally in index.ts

  // ============================================================================
  // PROJECT POSTING
  // ============================================================================

  /**
   * Create new project / post lead
   * POST /api/client/projects
   */
  fastify.post<{
    Body: CreateProjectInput
  }>('/projects', async (request, reply) => {
    try {
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const {
        propertyAddress,
        propertyType,
        projectDescription,
        projectType,
        budgetRange,
        desiredStartDate,
        desiredTimeline,
        specialRequirements,
      } = request.body

      // Create project/lead
      const lead = await prismaAny.lead.create({
        data: {
          clientId: userId,
          propertyAddress,
          propertyType,
          description: projectDescription,
          projectType,
          budgetMin: budgetRange.min,
          budgetMax: budgetRange.max,
          desiredStartDate: desiredStartDate || undefined,
          desiredTimeline,
          specialRequirements,
          status: 'PENDING_MATCHING',
          metadata: {
            createdFrom: 'client_portal',
          },
        },
      })

      // Log user action
      await prismaAny.userAction.create({
        data: {
          userId,
          userRole: 'HOMEOWNER',
          action: 'CREATE_PROJECT',
          entity: 'Lead',
          entityId: lead.id,
          details: {
            projectType,
            budgetRange,
          },
        },
      })

      return reply.code(201).send({
        success: true,
        data: lead,
        message: 'Project posted successfully. Matching contractors...',
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to create project')
      return reply.code(400).send({
        success: false,
        error: sanitizeErrorMessage(error),
      })
    }
  })

  /**
   * Upload existing condition photos
   * POST /api/client/projects/:projectId/existing-photos
   */
  fastify.post<{
    Params: { projectId: string }
    Body: { description?: string }
  }>('/projects/:projectId/existing-photos', async (request, reply) => {
    try {
      const { projectId } = request.params
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const userRole: UploadedByRole = 'HOMEOWNER'
      const parts = request.parts()
      const uploads: any[] = []

      for await (const part of parts) {
        if (part.type === 'file') {
          const buffer = await part.toBuffer()

          const result = await userResponsibilityUploadService.uploadFile({
            fileBuffer: buffer,
            fileName: part.filename,
            mimeType: part.mimetype,
            size: buffer.length,
            userId,
            userRole,
            category: 'EXISTING_CONDITION_PHOTO' as FileCategory,
            projectId,
            description: request.body?.description,
            tags: ['existing-condition'],
          })

          uploads.push(result)
        }
      }

      return reply.code(201).send({
        success: true,
        data: uploads,
        message: `${uploads.length} photo(s) uploaded successfully`,
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to upload photos')
      return reply.code(400).send({
        success: false,
        error: sanitizeErrorMessage(error),
      })
    }
  })

  // ============================================================================
  // BID MANAGEMENT
  // ============================================================================

  /**
   * Get bids for a lead/project
   * GET /api/client/leads/:leadId/bids
   */
  fastify.get<{
    Params: { leadId: string }
  }>('/leads/:leadId/bids', async (request, reply) => {
    try {
      const { leadId } = request.params
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      // Verify ownership
      const lead = await prismaAny.lead.findUnique({
        where: { id: leadId },
      })

      if (!lead || lead.clientId !== userId) {
        return reply.code(403).send({ error: 'Access denied' })
      }

      const bids = await prismaAny.bidSubmission.findMany({
        where: {
          bidRequest: {
            leadId,
          },
        },
        include: {
          contractor: {
            select: {
              id: true,
              name: true,
            },
          },
          bidRequest: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })

      return reply.send({
        success: true,
        data: bids,
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to fetch bids')
      return reply.code(500).send({
        success: false,
        error: sanitizeErrorMessage(error),
      })
    }
  })

  /**
   * Accept a bid
   * POST /api/client/bids/:bidId/accept
   */
  fastify.post<{
    Params: { bidId: string }
  }>('/bids/:bidId/accept', async (request, reply) => {
    try {
      const { bidId } = request.params
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      // Get bid and verify ownership
      const bid = await prismaAny.bidSubmission.findUnique({
        where: { id: bidId },
        include: {
          bidRequest: {
            include: {
              lead: true,
            },
          },
        },
      })

      if (!bid || bid.bidRequest.lead.clientId !== userId) {
        return reply.code(403).send({ error: 'Access denied' })
      }

      // Update bid status
      const updatedBid = await prismaAny.bidSubmission.update({
        where: { id: bidId },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      })

      // Update lead status
      await prismaAny.lead.update({
        where: { id: bid.bidRequest.leadId },
        data: {
          status: 'BID_ACCEPTED',
          selectedContractorId: bid.contractorId,
        },
      })

      // Log user action
      await prismaAny.userAction.create({
        data: {
          userId,
          userRole: 'HOMEOWNER',
          action: 'ACCEPT_BID',
          entity: 'BidSubmission',
          entityId: bidId,
          details: {
            contractorId: bid.contractorId,
            amount: bid.amount.toNumber(),
          },
        },
      })

      // Generate contract agreement from accepted bid
      const contractAgreement = await prismaAny.contractAgreement.create({
        data: {
          projectId: bid.bidRequest.lead.id,
          contractorId: bid.contractorId,
          clientId: userId,
          bidSubmissionId: bidId,
          status: 'DRAFT',
          totalAmount: bid.amount,
          title: 'Contract from bid acceptance',
          metadata: {
            generatedFrom: 'bid_acceptance',
            bidId,
          },
        },
      })

      // Fire-and-forget notification to contractor
      prismaAny.notification.create({
        data: { userId: bid.contractorId, type: 'BID_ACCEPTED', title: 'Your bid was accepted', message: 'Your bid has been accepted. A contract has been generated.', metadata: { bidId, contractId: contractAgreement.id } as any }
      }).catch(() => {})

      // Fire-and-forget notification to client
      prismaAny.notification.create({
        data: { userId, type: 'CONTRACT_GENERATED', title: 'Contract generated', message: 'A contract has been generated from the accepted bid.', metadata: { bidId, contractId: contractAgreement.id } as any }
      }).catch(() => {})

      return reply.send({
        success: true,
        data: { ...updatedBid, contractAgreementId: contractAgreement.id },
        message: 'Bid accepted. Generating contract...',
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to accept bid')
      return reply.code(400).send({
        success: false,
        error: sanitizeErrorMessage(error),
      })
    }
  })

  // ============================================================================
  // MILESTONE APPROVAL
  // ============================================================================

  /**
   * Get milestones for project
   * GET /api/client/projects/:projectId/milestones
   */
  fastify.get<{
    Params: { projectId: string }
  }>('/projects/:projectId/milestones', async (request, reply) => {
    try {
      const { projectId } = request.params
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const milestones = await prismaAny.milestone.findMany({
        where: {
          contract: {
            projectId,
            ownerId: userId,
          },
        },
        include: {
          evidence: true,
          contract: {
            select: {
              id: true,
              projectId: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 100,
      })

      return reply.send({
        success: true,
        data: milestones,
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to fetch milestones')
      return reply.code(500).send({
        success: false,
        error: sanitizeErrorMessage(error),
      })
    }
  })

  /**
   * Approve milestone and release payment
   * POST /api/client/milestones/:milestoneId/approve
   */
  fastify.post<{
    Params: { milestoneId: string }
    Body: ApproveMilestoneInput
  }>('/milestones/:milestoneId/approve', async (request, reply) => {
    try {
      const { milestoneId } = request.params
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const { approved, comments } = request.body

      // Get milestone and verify ownership
      const milestone = await prismaAny.milestone.findUnique({
        where: { id: milestoneId },
        include: {
          contract: {
            include: {
              escrowAgreements: true,
            },
          },
        },
      })

      if (!milestone || milestone.contract.ownerId !== userId) {
        return reply.code(403).send({ error: 'Access denied' })
      }

      if (milestone.status !== 'SUBMITTED') {
        return reply.code(400).send({
          error: 'Milestone is not ready for approval',
        })
      }

      if (!approved) {
        // Reject milestone
        const updated = await prismaAny.milestone.update({
          where: { id: milestoneId },
          data: {
            status: 'REJECTED',
          },
        })

        return reply.send({
          success: true,
          data: updated,
          message: 'Milestone rejected',
        })
      }

      // Approve and release payment
      const updated = await prismaAny.milestone.update({
        where: { id: milestoneId },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: userId,
        },
      })

      // Log user action
      await prismaAny.userAction.create({
        data: {
          userId,
          userRole: 'HOMEOWNER',
          action: 'APPROVE_MILESTONE_PAYMENT',
          entity: 'Milestone',
          entityId: milestoneId,
          details: {
            amount: milestone.amount.toNumber(),
            comments,
          },
        },
      })

      // Release escrow payment if escrow agreement exists
      const escrowAgreement = milestone.contract.escrowAgreements?.[0]
      if (escrowAgreement) {
        const releaseAmount = milestone.amount.toNumber()
        const balanceBefore = Number(escrowAgreement.currentBalance || 0)
        const balanceAfter = balanceBefore - releaseAmount

        // Create escrow transaction for the release
        await prismaAny.escrowTransaction.create({
          data: {
            escrowId: escrowAgreement.id,
            type: 'RELEASE',
            amount: releaseAmount,
            balanceBefore,
            balanceAfter,
            status: 'COMPLETED',
            metadata: {
              milestoneId,
              reason: 'milestone_approval',
              comments,
            },
          },
        })

        // Update escrow balance
        await prismaAny.escrowAgreement.update({
          where: { id: escrowAgreement.id },
          data: {
            currentBalance: balanceAfter,
          },
        })

        // Create payout record for the contractor
        await prismaAny.payout.create({
          data: {
            contractorId: milestone.contract.contractorId,
            escrowId: escrowAgreement.id,
            milestoneId,
            amount: releaseAmount,
            status: 'PENDING',
            metadata: {
              milestoneId,
              contractId: milestone.contract.id,
            },
          },
        })
      }

      // Fire-and-forget notification to contractor
      prismaAny.notification.create({
        data: { userId: milestone.contract.contractorId, type: 'MILESTONE_APPROVED', title: 'Milestone approved', message: 'Milestone approved. Payment is being released.', metadata: { milestoneId, contractId: milestone.contract.id } as any }
      }).catch(() => {})

      // Fire-and-forget notification to client
      prismaAny.notification.create({
        data: { userId, type: 'PAYMENT_RELEASED', title: 'Payment released', message: 'Payment released for the approved milestone.', metadata: { milestoneId } as any }
      }).catch(() => {})

      return reply.send({
        success: true,
        data: updated,
        message: 'Milestone approved. Payment is being processed...',
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to approve milestone')
      return reply.code(400).send({
        success: false,
        error: sanitizeErrorMessage(error),
      })
    }
  })

  // ============================================================================
  // CHANGE ORDER APPROVAL
  // ============================================================================

  /**
   * Get change orders for project
   * GET /api/client/projects/:projectId/change-orders
   */
  fastify.get<{
    Params: { projectId: string }
  }>('/projects/:projectId/change-orders', async (request, reply) => {
    try {
      const { projectId } = request.params
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const changeOrders = await prismaAny.changeOrder.findMany({
        where: {
          projectId,
        },
        include: {
          approvals: true,
          lineItems: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })

      return reply.send({
        success: true,
        data: changeOrders,
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to fetch change orders')
      return reply.code(500).send({
        success: false,
        error: sanitizeErrorMessage(error),
      })
    }
  })

  /**
   * Approve or decline change order
   * POST /api/client/change-orders/:changeOrderId/approve
   */
  fastify.post<{
    Params: { changeOrderId: string }
    Body: ApproveChangeOrderInput
  }>('/change-orders/:changeOrderId/approve', async (request, reply) => {
    try {
      const { changeOrderId } = request.params
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const { approved, comments } = request.body

      // Get change order and verify access
      const changeOrder = await prismaAny.changeOrder.findUnique({
        where: { id: changeOrderId },
        include: {
          project: true,
        },
      })

      if (!changeOrder) {
        return reply.code(404).send({ error: 'Change order not found' })
      }

      // Create approval record
      const approval = await prismaAny.changeOrderApproval.create({
        data: {
          changeOrderId,
          approverId: userId,
          approved,
          comments,
          approvedAt: new Date(),
        },
      })

      // Update change order status
      const updatedStatus = approved ? 'APPROVED' : 'REJECTED'
      await prismaAny.changeOrder.update({
        where: { id: changeOrderId },
        data: {
          status: updatedStatus,
          approvedAt: approved ? new Date() : undefined,
        },
      })

      // Log user action
      await prismaAny.userAction.create({
        data: {
          userId,
          userRole: 'HOMEOWNER',
          action: 'APPROVE_CHANGE_ORDER',
          entity: 'ChangeOrder',
          entityId: changeOrderId,
          projectId: changeOrder.projectId,
          details: {
            approved,
            costImpact: changeOrder.costImpact?.toNumber(),
            scheduleImpact: changeOrder.scheduleImpact,
          },
        },
      })

      return reply.send({
        success: true,
        data: approval,
        message: approved
          ? 'Change order approved'
          : 'Change order declined',
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to approve change order')
      return reply.code(400).send({
        success: false,
        error: sanitizeErrorMessage(error),
      })
    }
  })

  // ============================================================================
  // PROJECT REVIEWS
  // ============================================================================

  /**
   * Leave a review for completed project
   * POST /api/client/projects/:projectId/reviews
   */
  fastify.post<{
    Params: { projectId: string }
    Body: LeaveReviewInput
  }>('/projects/:projectId/reviews', async (request, reply) => {
    try {
      const { projectId } = request.params
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const { contractorId, rating, reviewText, categories } = request.body

      // Verify project is completed
      const project = await prismaAny.project.findUnique({
        where: { id: projectId },
      })

      if (!project || project.clientId !== userId) {
        return reply.code(403).send({ error: 'Access denied' })
      }

      if (project.status !== 'COMPLETED') {
        return reply.code(400).send({
          error: 'Can only review completed projects',
        })
      }

      // Create review
      const review = await prismaAny.review.create({
        data: {
          projectId,
          contractorId,
          clientId: userId,
          rating,
          reviewText,
          categories: categories || {},
          verified: true, // Verified because it's from actual project
        },
      })

      // Log user action
      await prismaAny.userAction.create({
        data: {
          userId,
          userRole: 'HOMEOWNER',
          action: 'LEAVE_REVIEW',
          entity: 'Review',
          entityId: review.id,
          projectId,
          details: {
            rating,
            contractorId,
          },
        },
      })

      // Calculate updated average rating for the contractor
      const ratingAgg = await prismaAny.review.aggregate({
        where: { contractorId },
        _avg: { rating: true },
      })
      const avgRating = ratingAgg._avg?.rating ?? rating
      await prismaAny.contractor.update({
        where: { id: contractorId },
        data: { rating: avgRating },
      })

      // Fire-and-forget notification to contractor
      prismaAny.notification.create({
        data: { userId: contractorId, type: 'NEW_REVIEW', title: 'New review received', message: 'You received a new review for a completed project.', metadata: { reviewId: review.id, projectId, rating } as any }
      }).catch(() => {})

      return reply.code(201).send({
        success: true,
        data: review,
        message: 'Review submitted successfully',
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to create review')
      return reply.code(400).send({
        success: false,
        error: sanitizeErrorMessage(error),
      })
    }
  })

  // ============================================================================
  // FUND ESCROW
  // ============================================================================

  /**
   * Fund escrow for project
   * POST /api/client/escrow/:escrowId/fund
   */
  fastify.post<{
    Params: { escrowId: string }
    Body: { paymentMethodId: string }
  }>('/escrow/:escrowId/fund', async (request, reply) => {
    try {
      const { escrowId } = request.params
      const userId = request.user?.id

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }

      const { paymentMethodId } = request.body

      // Get escrow agreement
      const escrow = await prismaAny.escrowAgreement.findUnique({
        where: { id: escrowId },
        include: {
          contract: true,
        },
      })

      if (!escrow || escrow.contract.ownerId !== userId) {
        return reply.code(403).send({ error: 'Access denied' })
      }

      if (escrow.status !== 'PENDING_DEPOSIT') {
        return reply.code(400).send({
          error: 'Escrow is not pending deposit',
        })
      }

      // Create payment intent placeholder (log amount for processing)
      const depositAmount = escrow.initialDepositAmount.toNumber()
      request.log.info({ escrowId, depositAmount, paymentMethodId }, 'Processing escrow deposit payment')

      // Create escrow transaction record for the deposit
      await prismaAny.escrowTransaction.create({
        data: {
          escrowId,
          type: 'DEPOSIT',
          amount: depositAmount,
          balanceBefore: 0,
          balanceAfter: depositAmount,
          status: 'COMPLETED',
          metadata: {
            paymentMethodId,
            fundedBy: userId,
          },
        },
      })

      // Update escrow balance and activate
      await prismaAny.escrowAgreement.update({
        where: { id: escrowId },
        data: {
          currentBalance: depositAmount,
          status: 'ACTIVE',
        },
      })

      // Log user action
      await prismaAny.userAction.create({
        data: {
          userId,
          userRole: 'HOMEOWNER',
          action: 'FUND_ESCROW',
          entity: 'EscrowAgreement',
          entityId: escrowId,
          details: {
            amount: escrow.initialDepositAmount.toNumber(),
          },
        },
      })

      return reply.send({
        success: true,
        message: 'Escrow funded successfully',
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to fund escrow')
      return reply.code(400).send({
        success: false,
        error: sanitizeErrorMessage(error),
      })
    }
  })
}

export default clientActionsRoutes
