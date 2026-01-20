/**
 * Approval Workflow Service
 * Handles approval requests, rules, and workflow management
 */

import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, AuthorizationError } from '../../errors/app.error'
import { eventService } from '../events/event.service'
import { auditService } from '../audit/audit.service'
import { fileService } from '../files/file.service'

interface CreateApprovalRequestData {
  type: string
  subtype?: string
  title: string
  description?: string
  priority?: string
  amount?: number
  currency?: string
  startDate?: Date | string
  endDate?: Date | string
  metadata?: Record<string, any>
  attachments?: Array<{
    fileId: string
    fileName: string
    fileUrl: string
    fileType: string
    fileSize: number
  }>
}

interface CreateApprovalRuleData {
  name: string
  type: string
  subtype?: string
  conditions: Array<{
    field: string
    operator: string
    value: any
  }>
  approvalChain: Array<{
    role: string
    department?: string
    order: number
    required: boolean
    fallbackApproverId?: string
  }>
  priority?: string
  sla?: number
  active?: boolean
}

class ApprovalWorkflowService {
  /**
   * Get approval requests with filters
   */
  async getApprovalRequests(params: {
    type?: string
    status?: string
    requesterId?: string
    approverId?: string
    startDate?: Date | string
    endDate?: Date | string
    search?: string
    page?: number
    limit?: number
  }) {
    const where: any = {}

    if (params.type) {
      where.type = params.type.toUpperCase()
    }
    if (params.status) {
      where.status = params.status.toUpperCase()
    }
    if (params.requesterId) {
      where.requesterId = params.requesterId
    }
    if (params.approverId) {
      where.approvalSteps = {
        some: {
          approverId: params.approverId,
        },
      }
    }
    if (params.startDate) {
      where.createdAt = {
        gte: typeof params.startDate === 'string' ? new Date(params.startDate) : params.startDate,
      }
    }
    if (params.endDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: typeof params.endDate === 'string' ? new Date(params.endDate) : params.endDate,
      }
    }
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ]
    }

    const page = params.page || 1
    const limit = params.limit || 50
    const skip = (page - 1) * limit

    const [requests, total] = await Promise.all([
      prismaAny.approvalRequest.findMany({
        where,
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          approvalSteps: {
            include: {
              approver: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
          attachments: true,
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prismaAny.approvalRequest.count({ where }),
    ])

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Get approval request by ID
   */
  async getApprovalRequest(requestId: string, userId?: string) {
    const request = await prismaAny.approvalRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvalSteps: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        attachments: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!request) {
      throw new NotFoundError('Approval request not found')
    }

    // Check authorization
    if (userId) {
      const isRequester = request.requesterId === userId
      const isApprover = request.approvalSteps.some((step: any) => step.approverId === userId)
      if (!isRequester && !isApprover) {
        throw new AuthorizationError('Not authorized to view this approval request')
      }
    }

    return request
  }

  /**
   * Create approval request
   */
  async createApprovalRequest(data: CreateApprovalRequestData, userId: string) {
    // Find matching approval rule
    const rule = await this.findMatchingRule(data.type, data.subtype, data)

    // Create approval request
    const request = await prismaAny.approvalRequest.create({
      data: {
        type: data.type.toUpperCase() as any,
        subtype: data.subtype,
        title: data.title,
        description: data.description,
        priority: (data.priority || 'MEDIUM').toUpperCase() as any,
        requesterId: userId,
        amount: data.amount ? parseFloat(data.amount.toString()) : null,
        currency: data.currency || 'usd',
        startDate: data.startDate ? (typeof data.startDate === 'string' ? new Date(data.startDate) : data.startDate) : null,
        endDate: data.endDate ? (typeof data.endDate === 'string' ? new Date(data.endDate) : data.endDate) : null,
        metadata: data.metadata || {},
        status: 'DRAFT',
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Create approval steps from rule or default
    if (rule && rule.approvalChain) {
      const approvalChain = rule.approvalChain as any[]
      const steps = await Promise.all(
        approvalChain.map(async (step, index) => {
          // Find approver by role (simplified - in production, use RBAC)
          const approver = await this.findApproverByRole(step.role, step.department, step.fallbackApproverId)
          if (!approver && step.required) {
            throw new Error(`Required approver not found for role: ${step.role}`)
          }

          if (approver) {
            return prismaAny.approvalStep.create({
              data: {
                approvalRequestId: request.id,
                approverId: approver.id,
                approverRole: step.role,
                order: step.order || index + 1,
                required: step.required !== false,
                status: 'PENDING',
              },
            })
          }
          return null
        })
      )

      // Filter out null steps
      await Promise.all(steps.filter(Boolean))
    }

    // Add attachments if provided
    if (data.attachments && data.attachments.length > 0) {
      await Promise.all(
        data.attachments.map((attachment) =>
          prismaAny.approvalAttachment.create({
            data: {
              approvalRequestId: request.id,
              fileId: attachment.fileId,
              fileName: attachment.fileName,
              fileUrl: attachment.fileUrl,
              fileType: attachment.fileType,
              fileSize: attachment.fileSize,
            },
          })
        )
      )
    }

    // Record event
    await eventService.recordEvent({
      type: 'APPROVAL_REQUEST_CREATED',
      entityType: 'ApprovalRequest',
      entityId: request.id,
      userId,
      payload: {
        type: request.type,
        title: request.title,
      },
    })

    return this.getApprovalRequest(request.id, userId)
  }

  /**
   * Submit approval request for approval
   */
  async submitApprovalRequest(requestId: string, userId: string) {
    const request = await this.getApprovalRequest(requestId, userId)

    if (request.requesterId !== userId) {
      throw new AuthorizationError('Only the requester can submit the request')
    }

    if (request.status !== 'DRAFT') {
      throw new Error('Request has already been submitted')
    }

    // Update status to PENDING
    const updated = await prismaAny.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: 'PENDING',
        submittedAt: new Date(),
      },
    })

    // Record event
    await eventService.recordEvent({
      type: 'APPROVAL_REQUEST_SUBMITTED',
      entityType: 'ApprovalRequest',
      entityId: requestId,
      userId,
    })

    return this.getApprovalRequest(requestId, userId)
  }

  /**
   * Approve request step
   */
  async approveRequest(requestId: string, userId: string, comments?: string) {
    const request = await this.getApprovalRequest(requestId, userId)

    if (request.status !== 'PENDING') {
      throw new Error('Request is not pending approval')
    }

    // Find current step for this approver
    const currentStep = request.approvalSteps.find(
      (step: any) => step.approverId === userId && step.status === 'PENDING'
    )

    if (!currentStep) {
      throw new AuthorizationError('You are not authorized to approve this request')
    }

    // Update step status
    await prismaAny.approvalStep.update({
      where: { id: currentStep.id },
      data: {
        status: 'APPROVED',
        comments: comments || null,
        approvedAt: new Date(),
      },
    })

    // Check if all required steps are approved
    const allSteps = await prismaAny.approvalStep.findMany({
      where: { approvalRequestId: requestId },
    })

    const requiredSteps = allSteps.filter((s) => s.required)
    const approvedRequiredSteps = requiredSteps.filter((s) => s.status === 'APPROVED')

    if (approvedRequiredSteps.length === requiredSteps.length) {
      // All required steps approved - mark request as approved
      await prismaAny.approvalRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          completedAt: new Date(),
        },
      })

      await eventService.recordEvent({
        type: 'APPROVAL_REQUEST_APPROVED',
        entityType: 'ApprovalRequest',
        entityId: requestId,
        userId,
      })
    } else {
      // Move to next step if applicable
      const nextStep = allSteps.find(
        (s) => s.order > currentStep.order && s.status === 'PENDING'
      )
      if (nextStep) {
        // Notify next approver (in production, send notification)
      }
    }

    return this.getApprovalRequest(requestId, userId)
  }

  /**
   * Reject request
   */
  async rejectRequest(requestId: string, userId: string, comments: string) {
    const request = await this.getApprovalRequest(requestId, userId)

    if (request.status !== 'PENDING') {
      throw new Error('Request is not pending approval')
    }

    // Find current step for this approver
    const currentStep = request.approvalSteps.find(
      (step: any) => step.approverId === userId && step.status === 'PENDING'
    )

    if (!currentStep) {
      throw new AuthorizationError('You are not authorized to reject this request')
    }

    // Update step status
    await prismaAny.approvalStep.update({
      where: { id: currentStep.id },
      data: {
        status: 'REJECTED',
        comments: comments,
        rejectedAt: new Date(),
      },
    })

    // Reject the entire request
    await prismaAny.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        completedAt: new Date(),
      },
    })

    await eventService.recordEvent({
      type: 'APPROVAL_REQUEST_REJECTED',
      entityType: 'ApprovalRequest',
      entityId: requestId,
      userId,
      payload: { comments },
    })

    return this.getApprovalRequest(requestId, userId)
  }

  /**
   * Cancel request
   */
  async cancelRequest(requestId: string, userId: string, reason?: string) {
    const request = await this.getApprovalRequest(requestId, userId)

    if (request.requesterId !== userId) {
      throw new AuthorizationError('Only the requester can cancel the request')
    }

    if (request.status === 'APPROVED' || request.status === 'REJECTED') {
      throw new Error('Cannot cancel an approved or rejected request')
    }

    const updated = await prismaAny.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    })

    await eventService.recordEvent({
      type: 'APPROVAL_REQUEST_CANCELLED',
      entityType: 'ApprovalRequest',
      entityId: requestId,
      userId,
      payload: { reason },
    })

    return this.getApprovalRequest(requestId, userId)
  }

  /**
   * Get pending approvals for user
   */
  async getMyPendingApprovals(userId: string, params?: { type?: string; page?: number; limit?: number }) {
    return this.getApprovalRequests({
      approverId: userId,
      status: 'PENDING',
      type: params?.type,
      page: params?.page,
      limit: params?.limit,
    })
  }

  /**
   * Get approval rules
   */
  async getApprovalRules(params?: { type?: string; active?: boolean; page?: number; limit?: number }) {
    const where: any = {}

    if (params?.type) {
      where.type = params.type
    }
    if (params?.active !== undefined) {
      where.active = params.active
    }

    const page = params?.page || 1
    const limit = params?.limit || 50
    const skip = (page - 1) * limit

    const [rules, total] = await Promise.all([
      prismaAny.approvalRule.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prismaAny.approvalRule.count({ where }),
    ])

    return {
      rules,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Create approval rule
   */
  async createApprovalRule(data: CreateApprovalRuleData) {
    const rule = await prismaAny.approvalRule.create({
      data: {
        name: data.name,
        type: data.type,
        subtype: data.subtype,
        conditions: data.conditions as any,
        approvalChain: data.approvalChain as any,
        priority: data.priority ? (data.priority.toUpperCase() as any) : null,
        sla: data.sla,
        active: data.active !== false,
      },
    })

    return rule
  }

  /**
   * Update approval rule
   */
  async updateApprovalRule(ruleId: string, updates: Partial<CreateApprovalRuleData>) {
    const rule = await prismaAny.approvalRule.findUnique({
      where: { id: ruleId },
    })

    if (!rule) {
      throw new NotFoundError('Approval rule not found')
    }

    const updated = await prismaAny.approvalRule.update({
      where: { id: ruleId },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.type && { type: updates.type }),
        ...(updates.subtype !== undefined && { subtype: updates.subtype }),
        ...(updates.conditions && { conditions: updates.conditions as any }),
        ...(updates.approvalChain && { approvalChain: updates.approvalChain as any }),
        ...(updates.priority && { priority: updates.priority.toUpperCase() as any }),
        ...(updates.sla !== undefined && { sla: updates.sla }),
        ...(updates.active !== undefined && { active: updates.active }),
      },
    })

    return updated
  }

  /**
   * Delete approval rule
   */
  async deleteApprovalRule(ruleId: string) {
    const rule = await prismaAny.approvalRule.findUnique({
      where: { id: ruleId },
    })

    if (!rule) {
      throw new NotFoundError('Approval rule not found')
    }

    await prismaAny.approvalRule.delete({
      where: { id: ruleId },
    })

    return { success: true }
  }

  /**
   * Add attachment to approval request
   */
  async addAttachment(requestId: string, fileId: string, fileName: string, fileUrl: string, fileType: string, fileSize: number) {
    const request = await prismaAny.approvalRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      throw new NotFoundError('Approval request not found')
    }

    const attachment = await prismaAny.approvalAttachment.create({
      data: {
        approvalRequestId: requestId,
        fileId,
        fileName,
        fileUrl,
        fileType,
        fileSize,
      },
    })

    return attachment
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(requestId: string, attachmentId: string, userId: string) {
    const request = await this.getApprovalRequest(requestId, userId)

    if (request.requesterId !== userId) {
      throw new AuthorizationError('Only the requester can delete attachments')
    }

    await prismaAny.approvalAttachment.delete({
      where: { id: attachmentId },
    })

    return { success: true }
  }

  /**
   * Add comment to approval request
   */
  async addComment(requestId: string, userId: string, content: string) {
    const request = await this.getApprovalRequest(requestId, userId)

    const comment = await prismaAny.approvalComment.create({
      data: {
        approvalRequestId: requestId,
        userId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return comment
  }

  /**
   * Get comments for approval request
   */
  async getComments(requestId: string, userId?: string) {
    await this.getApprovalRequest(requestId, userId) // Verify access

    const comments = await prismaAny.approvalComment.findMany({
      where: { approvalRequestId: requestId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { comments }
  }

  /**
   * Get approval report
   */
  async getApprovalReport(params: {
    startDate: Date | string
    endDate: Date | string
    type?: string
    department?: string
  }) {
    const where: any = {
      createdAt: {
        gte: typeof params.startDate === 'string' ? new Date(params.startDate) : params.startDate,
        lte: typeof params.endDate === 'string' ? new Date(params.endDate) : params.endDate,
      },
    }

    if (params.type) {
      where.type = params.type.toUpperCase()
    }

    const requests = await prismaAny.approvalRequest.findMany({
      where,
      include: {
        requester: {
          select: {
            id: true,
            name: true,
          },
        },
        approvalSteps: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    // Calculate metrics
    const total = requests.length
    const approved = requests.filter((r) => r.status === 'APPROVED').length
    const rejected = requests.filter((r) => r.status === 'REJECTED').length
    const pending = requests.filter((r) => r.status === 'PENDING').length
    const cancelled = requests.filter((r) => r.status === 'CANCELLED').length

    const avgApprovalTime = requests
      .filter((r) => r.status === 'APPROVED' && r.submittedAt && r.completedAt)
      .map((r) => {
        const submitted = new Date(r.submittedAt!).getTime()
        const completed = new Date(r.completedAt!).getTime()
        return (completed - submitted) / (1000 * 60 * 60) // Hours
      })
      .reduce((acc, time) => acc + time, 0) / approved || 0

    return {
      summary: {
        total,
        approved,
        rejected,
        pending,
        cancelled,
        approvalRate: total > 0 ? (approved / total) * 100 : 0,
        avgApprovalTimeHours: avgApprovalTime,
      },
      requests,
    }
  }

  // Helper methods

  /**
   * Find matching approval rule
   */
  private async findMatchingRule(type: string, subtype?: string, data?: any) {
    const rules = await prismaAny.approvalRule.findMany({
      where: {
        type,
        subtype: subtype || null,
        active: true,
      },
    })

    // Find rule that matches conditions
    for (const rule of rules) {
      const conditions = rule.conditions as any[]
      if (!conditions || conditions.length === 0) {
        return rule // Rule with no conditions matches
      }

      let matches = true
      for (const condition of conditions) {
        const fieldValue = data?.[condition.field]
        if (!this.evaluateCondition(fieldValue, condition.operator, condition.value)) {
          matches = false
          break
        }
      }

      if (matches) {
        return rule
      }
    }

    return null
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(value: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'eq':
        return value === expected
      case 'neq':
        return value !== expected
      case 'gt':
        return value > expected
      case 'gte':
        return value >= expected
      case 'lt':
        return value < expected
      case 'lte':
        return value <= expected
      case 'contains':
        return String(value).includes(String(expected))
      case 'in':
        return Array.isArray(expected) && expected.includes(value)
      default:
        return false
    }
  }

  /**
   * Find approver by role (simplified - in production, use RBAC)
   */
  private async findApproverByRole(role: string, department?: string, fallbackId?: string) {
    if (fallbackId) {
      const user = await prismaAny.user.findUnique({
        where: { id: fallbackId },
      })
      if (user) return user
    }

    // In production, query RBAC to find users with this role
    // For now, return null (will need to be implemented)
    return null
  }
}

export const approvalWorkflowService = new ApprovalWorkflowService()
