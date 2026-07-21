import { prisma } from '@kealee/database'
import { NotFoundError, ValidationError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'

// Type assertions for missing Prisma models
const prismaAny = prisma as any

export const approvalService = {
  /**
   * Create approval workflow
   */
  async createApprovalWorkflow(data: {
    name: string
    description?: string
    workflowType: string
    appliesToEntityType: string[]
    appliesToProjectTypes?: string[]
    appliesToPhases?: string[]
    steps: any[]
    conditionalLogic?: any
    isDefault?: boolean
    createdById: string
  }) {
    const workflow = await prismaAny.approvalWorkflow.create({
      data: {
        name: data.name,
        description: data.description,
        workflowType: data.workflowType,
        appliesToEntityType: data.appliesToEntityType as any[],
        appliesToProjectTypes: data.appliesToProjectTypes || [],
        appliesToPhases: data.appliesToPhases || [],
        steps: data.steps as any,
        conditionalLogic: data.conditionalLogic as any,
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
      action: 'APPROVAL_WORKFLOW_CREATED',
      entityType: 'ApprovalWorkflow',
      entityId: workflow.id,
      userId: data.createdById,
      reason: `Approval workflow created: ${data.name}`,
      after: {
        name: data.name,
        workflowType: data.workflowType,
      },
    })

    return workflow
  },

  /**
   * Get approval workflow
   */
  async getApprovalWorkflow(workflowId: string) {
    const workflow = await prismaAny.approvalWorkflow.findUnique({
      where: { id: workflowId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!workflow) {
      throw new NotFoundError('ApprovalWorkflow', workflowId)
    }

    return workflow
  },

  /**
   * List approval workflows
   */
  async listApprovalWorkflows(filters?: {
    workflowType?: string
    entityType?: string
    isActive?: boolean
    isDefault?: boolean
  }) {
    const where: any = {}

    if (filters?.workflowType) {
      where.workflowType = filters.workflowType
    }

    if (filters?.entityType) {
      where.appliesToEntityType = {
        has: filters.entityType,
      }
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters?.isDefault !== undefined) {
      where.isDefault = filters.isDefault
    }

    const workflows = await prismaAny.approvalWorkflow.findMany({
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
            approvalRequests: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return workflows
  },

  /**
   * Create approval request
   */
  async createApprovalRequest(data: {
    designProjectId: string
    entityType: string
    entityId: string
    workflowId?: string
    requestTitle: string
    requestDescription?: string
    requestNotes?: string
    priority?: string
    deadline?: Date
    requestedById: string
  }) {
    // If workflowId not provided, find default workflow for entity type
    let workflowId = data.workflowId

    if (!workflowId) {
      const defaultWorkflow = await prismaAny.approvalWorkflow.findFirst({
        where: {
          isActive: true,
          isDefault: true,
          appliesToEntityType: {
            has: data.entityType,
          },
        },
      })

      if (!defaultWorkflow) {
        throw new ValidationError(`No default workflow found for entity type: ${data.entityType}`)
      }

      workflowId = defaultWorkflow.id
    }

    const workflow = await prismaAny.approvalWorkflow.findUnique({
      where: { id: workflowId },
    })

    if (!workflow) {
      throw new NotFoundError('ApprovalWorkflow', workflowId)
    }

    // Create approval request
    const approvalRequest = await prismaAny.approvalRequest.create({
      data: {
        designProjectId: data.designProjectId,
        entityType: data.entityType as any,
        entityId: data.entityId,
        workflowId: workflowId,
        requestTitle: data.requestTitle,
        requestDescription: data.requestDescription,
        requestNotes: data.requestNotes,
        priority: data.priority,
        deadline: data.deadline,
        requestedById: data.requestedById,
        approvalStatus: 'PENDING',
        currentStepOrder: 1,
      },
    })

    // Create approval steps from workflow
    const steps = workflow.steps as any[]
    const approvalSteps = await Promise.all(
      steps.map((step, index) =>
        prismaAny.approvalStep.create({
          data: {
            approvalRequestId: approvalRequest.id,
            stepOrder: step.order || index + 1,
            stepName: step.name || `Step ${index + 1}`,
            stepDescription: step.description,
            requiredRole: step.role,
            stepStatus: 'PENDING',
          },
        })
      )
    )

    // Log approval history
    await prismaAny.approvalHistory.create({
      data: {
        approvalRequestId: approvalRequest.id,
        actionType: 'CREATED',
        actionDescription: `Approval request created for ${data.entityType}: ${data.entityId}`,
        entityType: data.entityType as any,
        entityId: data.entityId,
        performedById: data.requestedById,
        newStatus: 'PENDING',
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'APPROVAL_REQUEST_CREATED',
      entityType: 'ApprovalRequest',
      entityId: approvalRequest.id,
      userId: data.requestedById,
      reason: `Approval request created: ${data.requestTitle}`,
      after: {
        entityType: data.entityType,
        entityId: data.entityId,
      },
    })

    return {
      ...approvalRequest,
      steps: approvalSteps,
    }
  },

  /**
   * Get approval request
   */
  async getApprovalRequest(requestId: string) {
    const request = await prismaAny.approvalRequest.findUnique({
      where: { id: requestId },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            workflowType: true,
          },
        },
        requestedBy: {
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
          },
        },
        approvalSteps: {
          orderBy: {
            stepOrder: 'asc',
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
        },
        delegations: {
          where: {
            isActive: true,
          },
          include: {
            fromUser: {
              select: {
                id: true,
                name: true,
              },
            },
            toUser: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        certificates: {
          orderBy: {
            generatedAt: 'desc',
          },
        },
      },
    })

    if (!request) {
      throw new NotFoundError('ApprovalRequest', requestId)
    }

    return request
  },

  /**
   * List approval requests
   */
  async listApprovalRequests(designProjectId: string, filters?: {
    entityType?: string
    entityId?: string
    approvalStatus?: string
    requestedById?: string
  }) {
    const where: any = {
      designProjectId,
    }

    if (filters?.entityType) {
      where.entityType = filters.entityType
    }

    if (filters?.entityId) {
      where.entityId = filters.entityId
    }

    if (filters?.approvalStatus) {
      where.approvalStatus = filters.approvalStatus
    }

    if (filters?.requestedById) {
      where.requestedById = filters.requestedById
    }

    const requests = await prismaAny.approvalRequest.findMany({
      where,
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            approvalSteps: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    })

    return requests
  },

  /**
   * Approve step
   */
  async approveStep(stepId: string, data: {
    approvalNotes?: string
    signatureData?: any
    signatureImageUrl?: string
    ipAddress?: string
    userAgent?: string
    location?: string
    userId: string
  }) {
    const step = await prismaAny.approvalStep.findUnique({
      where: { id: stepId },
      include: {
        approvalRequest: true,
      },
    })

    if (!step) {
      throw new NotFoundError('ApprovalStep', stepId)
    }

    if (step.stepStatus !== 'PENDING') {
      throw new ValidationError(`Step is already ${step.stepStatus}`)
    }

    // Update step
    const updatedStep = await prismaAny.approvalStep.update({
      where: { id: stepId },
      data: {
        stepStatus: 'APPROVED',
        approvedAt: new Date(),
        approvedById: data.userId,
        approvalNotes: data.approvalNotes,
        signatureData: data.signatureData as any,
        signatureImageUrl: data.signatureImageUrl,
        signatureTimestamp: new Date(),
      },
    })

    // Check if there are more steps
    const allSteps = await prismaAny.approvalStep.findMany({
      where: {
        approvalRequestId: step.approvalRequestId,
      },
      orderBy: {
        stepOrder: 'asc',
      },
    })

    const currentStepIndex = allSteps.findIndex((s: any) => s.id === stepId)
    const nextStep = allSteps[currentStepIndex + 1]

    let newStatus = 'IN_PROGRESS'
    let completedAt = null
    let completedById = null

    if (!nextStep || nextStep.stepStatus === 'APPROVED') {
      // All steps approved
      newStatus = 'APPROVED'
      completedAt = new Date() as any
      completedById = data.userId as any
    }

    // Update approval request
    await prismaAny.approvalRequest.update({
      where: { id: step.approvalRequestId },
      data: {
        approvalStatus: newStatus as any,
        currentStepOrder: nextStep ? nextStep.stepOrder : step.stepOrder,
        completedAt,
        completedById,
      },
    })

    // Log approval history
    await prismaAny.approvalHistory.create({
      data: {
        approvalRequestId: step.approvalRequestId,
        actionType: 'STEP_APPROVED',
        actionDescription: `Step ${step.stepOrder} approved: ${step.stepName}`,
        performedById: data.userId,
        previousStatus: 'PENDING',
        newStatus: 'APPROVED',
        actionData: {
          stepId: stepId,
          stepName: step.stepName,
          approvalNotes: data.approvalNotes,
        } as any,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        location: data.location,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'APPROVAL_STEP_APPROVED',
      entityType: 'ApprovalStep',
      entityId: stepId,
      userId: data.userId,
      reason: data.approvalNotes || `Step approved: ${step.stepName}`,
      after: {
        stepStatus: 'APPROVED',
      },
    })

    return updatedStep
  },

  /**
   * Reject step
   */
  async rejectStep(stepId: string, data: {
    rejectionReason: string
    ipAddress?: string
    userAgent?: string
    location?: string
    userId: string
  }) {
    const step = await prismaAny.approvalStep.findUnique({
      where: { id: stepId },
      include: {
        approvalRequest: true,
      },
    })

    if (!step) {
      throw new NotFoundError('ApprovalStep', stepId)
    }

    if (step.stepStatus !== 'PENDING') {
      throw new ValidationError(`Step is already ${step.stepStatus}`)
    }

    // Update step
    const updatedStep = await prismaAny.approvalStep.update({
      where: { id: stepId },
      data: {
        stepStatus: 'REJECTED',
        approvedAt: new Date(),
        approvedById: data.userId,
        rejectionReason: data.rejectionReason,
      },
    })

    // Update approval request to rejected
    await prismaAny.approvalRequest.update({
      where: { id: step.approvalRequestId },
      data: {
        approvalStatus: 'REJECTED',
        completedAt: new Date(),
        completedById: data.userId,
      },
    })

    // Log approval history
    await prismaAny.approvalHistory.create({
      data: {
        approvalRequestId: step.approvalRequestId,
        actionType: 'STEP_REJECTED',
        actionDescription: `Step ${step.stepOrder} rejected: ${step.stepName}`,
        performedById: data.userId,
        previousStatus: 'PENDING',
        newStatus: 'REJECTED',
        actionData: {
          stepId: stepId,
          stepName: step.stepName,
          rejectionReason: data.rejectionReason,
        } as any,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        location: data.location,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'APPROVAL_STEP_REJECTED',
      entityType: 'ApprovalStep',
      entityId: stepId,
      userId: data.userId,
      reason: data.rejectionReason,
      after: {
        stepStatus: 'REJECTED',
      },
    })

    return updatedStep
  },

  /**
   * Delegate approval
   */
  async delegateApproval(requestId: string, data: {
    fromUserId: string
    toUserId: string
    delegationReason?: string
    ipAddress?: string
    userAgent?: string
  }) {
    const request = await prismaAny.approvalRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      throw new NotFoundError('ApprovalRequest', requestId)
    }

    // Create delegation
    const delegation = await prismaAny.approvalDelegation.create({
      data: {
        approvalRequestId: requestId,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        delegationReason: data.delegationReason,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    })

    // Update approval request status
    await prismaAny.approvalRequest.update({
      where: { id: requestId },
      data: {
        approvalStatus: 'DELEGATED',
      },
    })

    // Log approval history
    await prismaAny.approvalHistory.create({
      data: {
        approvalRequestId: requestId,
        actionType: 'DELEGATED',
        actionDescription: `Approval delegated from user ${data.fromUserId} to ${data.toUserId}`,
        performedById: data.fromUserId,
        previousStatus: request.approvalStatus,
        newStatus: 'DELEGATED',
        actionData: {
          fromUserId: data.fromUserId,
          toUserId: data.toUserId,
          delegationReason: data.delegationReason,
        } as any,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'APPROVAL_DELEGATED',
      entityType: 'ApprovalDelegation',
      entityId: delegation.id,
      userId: data.fromUserId,
      reason: data.delegationReason || 'Approval delegated',
      after: {
        toUserId: data.toUserId,
      },
    })

    return delegation
  },

  /**
   * Revoke delegation
   */
  async revokeDelegation(delegationId: string, data: {
    revokedReason?: string
    userId: string
  }) {
    const delegation = await prismaAny.approvalDelegation.findUnique({
      where: { id: delegationId },
    })

    if (!delegation) {
      throw new NotFoundError('ApprovalDelegation', delegationId)
    }

    const updated = await prismaAny.approvalDelegation.update({
      where: { id: delegationId },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedReason: data.revokedReason,
      },
    })

    // Update approval request status back to previous
    await prismaAny.approvalRequest.update({
      where: { id: delegation.approvalRequestId },
      data: {
        approvalStatus: 'PENDING',
      },
    })

    // Log approval history
    await prismaAny.approvalHistory.create({
      data: {
        approvalRequestId: delegation.approvalRequestId,
        actionType: 'DELEGATION_REVOKED',
        actionDescription: `Delegation revoked`,
        performedById: data.userId,
        previousStatus: 'DELEGATED',
        newStatus: 'PENDING',
        actionData: {
          delegationId: delegationId,
          revokedReason: data.revokedReason,
        } as any,
      },
    })

    return updated
  },

  /**
   * Generate approval certificate
   */
  async generateApprovalCertificate(requestId: string, data: {
    certificateTitle: string
    certificateDescription?: string
    certificateData?: any
    certificateFormat?: string
    issuedTo?: string
    issuedBy?: string
    generatedById: string
  }) {
    const request = await prismaAny.approvalRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      throw new NotFoundError('ApprovalRequest', requestId)
    }

    if (request.approvalStatus !== 'APPROVED') {
      throw new ValidationError('Approval request must be approved before generating certificate')
    }

    // Generate unique certificate number
    const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Build certificate metadata object (actual PDF generation deferred to a dedicated service)
    const certificateMetadata = {
      certNumber: certificateNumber,
      projectName: request.requestTitle,
      issuedDate: new Date().toISOString(),
      type: data.certificateFormat || 'PDF',
      issuedTo: data.issuedTo || null,
      issuedBy: data.issuedBy || null,
      approvalRequestId: requestId,
      generatedAt: new Date().toISOString(),
    }

    const certificate = await prismaAny.approvalCertificate.create({
      data: {
        approvalRequestId: requestId,
        certificateNumber,
        certificateTitle: data.certificateTitle,
        certificateDescription: data.certificateDescription,
        certificateData: { ...(data.certificateData || {}), ...certificateMetadata } as any,
        certificateFormat: (data.certificateFormat as any) || 'PDF',
        issuedTo: data.issuedTo,
        issuedBy: data.issuedBy,
        generatedById: data.generatedById,
      },
    })

    // Log approval history
    await prismaAny.approvalHistory.create({
      data: {
        approvalRequestId: requestId,
        actionType: 'CERTIFICATE_GENERATED',
        actionDescription: `Approval certificate generated: ${certificateNumber}`,
        performedById: data.generatedById,
        actionData: {
          certificateId: certificate.id,
          certificateNumber,
        } as any,
      },
    })

    // Log audit
    await auditService.recordAudit({
      action: 'APPROVAL_CERTIFICATE_GENERATED',
      entityType: 'ApprovalCertificate',
      entityId: certificate.id,
      userId: data.generatedById,
      reason: `Certificate generated: ${certificateNumber}`,
      after: {
        certificateNumber,
      },
    })

    return certificate
  },

  /**
   * Get approval history
   */
  async getApprovalHistory(requestId: string) {
    const history = await prismaAny.approvalHistory.findMany({
      where: {
        approvalRequestId: requestId,
      },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        performedAt: 'desc',
      },
    })

    return history
  },
}
