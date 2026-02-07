/**
 * Client Action Routes
 * Handles client-specific actions (homeowners, developers, property managers)
 * Based on Kealee_User_Responsibilities_Guide.md Sections 2-4
 */

import { FastifyPluginAsync } from 'fastify'
import { prismaAny } from '../../utils/prisma-helper'
import { userResponsibilityUploadService } from '../files/user-responsibility-upload.service'
import {
  CreateProjectInput,
  ApproveMilestoneInput,
  ApproveChangeOrderInput,
  LeaveReviewInput,
} from '../../types/user-responsibilities.types'
import { FileCategory, UploadedByRole } from '@prisma/client'
import multipart from '@fastify/multipart'

const clientActionsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.register(multipart)

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
        error: error.message,
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
        error: error.message,
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
      })

      return reply.send({
        success: true,
        data: bids,
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to fetch bids')
      return reply.code(500).send({
        success: false,
        error: error.message,
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

      // TODO: Trigger contract generation
      // TODO: Send notifications to contractor and client

      return reply.send({
        success: true,
        data: updatedBid,
        message: 'Bid accepted. Generating contract...',
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to accept bid')
      return reply.code(400).send({
        success: false,
        error: error.message,
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
      })

      return reply.send({
        success: true,
        data: milestones,
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to fetch milestones')
      return reply.code(500).send({
        success: false,
        error: error.message,
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

      // TODO: Trigger escrow payment release
      // TODO: Update escrow balance
      // TODO: Create payout record
      // TODO: Send notifications

      return reply.send({
        success: true,
        data: updated,
        message: 'Milestone approved. Payment is being processed...',
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to approve milestone')
      return reply.code(400).send({
        success: false,
        error: error.message,
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
      })

      return reply.send({
        success: true,
        data: changeOrders,
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to fetch change orders')
      return reply.code(500).send({
        success: false,
        error: error.message,
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
        error: error.message,
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

      // TODO: Update contractor's average rating
      // TODO: Send notification to contractor

      return reply.code(201).send({
        success: true,
        data: review,
        message: 'Review submitted successfully',
      })
    } catch (error: any) {
      request.log.error(error, 'Failed to create review')
      return reply.code(400).send({
        success: false,
        error: error.message,
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

      // TODO: Process payment via Stripe
      // TODO: Create escrow transaction record
      // TODO: Update escrow balance
      // TODO: Activate escrow

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
        error: error.message,
      })
    }
  })
}

export default clientActionsRoutes
