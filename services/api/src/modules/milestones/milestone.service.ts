import { prismaAny } from '../../utils/prisma-helper'
// Prisma types available through prismaAny
import { NotFoundError, AuthorizationError, ValidationError } from '../../errors/app.error'
import { syncMilestoneApproved } from '../integrations/ghl/ghl-sync'

export const milestoneService = {
  async getContractMilestones(contractId: string, userId: string) {
    const contract = await prismaAny.contractAgreement.findUnique({
      where: { id: contractId },
      include: {
        project: { select: { ownerId: true } },
        owner: { select: { id: true } },
        contractor: { select: { id: true } },
      },
    })

    if (!contract) throw new NotFoundError('ContractAgreement', contractId)
    if (contract.project.ownerId !== userId && contract.contractorId !== userId) {
      throw new AuthorizationError('Only contract parties can view milestones')
    }

    const milestones = await prismaAny.milestone.findMany({
      where: { contractId },
      include: {
        evidence: {
          orderBy: { uploadedAt: 'desc' },
          select: {
            id: true,
            type: true,
            fileUrl: true,
            caption: true,
            uploadedBy: true,
            uploadedAt: true,
          },
        },
        dependsOn: {
          select: { id: true, name: true, status: true },
        },
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Calculate progress statistics
    const total = milestones.length
    const completed = milestones.filter(
      (m: any) => m.status === 'APPROVED' || m.status === 'PAID'
    ).length
    const submitted = milestones.filter((m: any) => m.status === 'SUBMITTED').length
    const underReview = milestones.filter((m: any) => m.status === 'UNDER_REVIEW').length
    const pending = milestones.filter((m: any) => m.status === 'PENDING').length

    const totalAmount = milestones.reduce((sum: number, m: any) => sum + Number(m.amount || 0), 0)
    const paidAmount = milestones
      .filter((m: any) => m.status === 'PAID')
      .reduce((sum: number, m: any) => sum + Number(m.amount || 0), 0)

    const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0
    const paymentProgress = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0

    // Find upcoming milestones (pending with due date within 7 days)
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const upcomingMilestones = milestones.filter(
      (m: any) =>
        m.status === 'PENDING' &&
        m.dueDate &&
        new Date(m.dueDate) <= sevenDaysFromNow &&
        new Date(m.dueDate) >= now
    )

    // Build dependency graph
    const dependencyGraph = milestones.map((milestone: any) => {
      const canSubmit =
        !milestone.dependsOnId ||
        milestones.find((m: any) => m.id === milestone.dependsOnId)?.status === 'APPROVED' ||
        milestones.find((m: any) => m.id === milestone.dependsOnId)?.status === 'PAID'

      return {
        ...milestone,
        canSubmit,
        blockedBy: milestone.dependsOnId
          ? milestones.find((m: any) => m.id === milestone.dependsOnId && m.status !== 'APPROVED' && m.status !== 'PAID')
          : null,
      }
    })

    return {
      milestones: dependencyGraph,
      statistics: {
        total,
        completed,
        submitted,
        underReview,
        pending,
        totalAmount,
        paidAmount,
        progressPercentage,
        paymentProgress,
        upcomingMilestones: upcomingMilestones.map((m: any) => ({
          id: m.id,
          name: m.name,
          dueDate: m.dueDate,
          daysUntilDue: m.dueDate
            ? Math.ceil((new Date(m.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : null,
        })),
      },
    }
  },

  async getMilestone(milestoneId: string, userId: string) {
    const milestone = await prismaAny.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            project: { select: { ownerId: true } },
            owner: { select: { id: true } },
            contractor: { select: { id: true } },
          },
        },
        evidence: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: { select: { id: true, name: true, email: true } },
          },
        },
        dependsOn: {
          select: { id: true, name: true, status: true },
        },
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!milestone) throw new NotFoundError('Milestone', milestoneId)
    if (
      milestone.contract.project.ownerId !== userId &&
      milestone.contract.contractorId !== userId
    ) {
      throw new AuthorizationError('Only contract parties can view milestones')
    }

    return milestone
  },

  async submitMilestone(
    milestoneId: string,
    userId: string,
    evidence: Array<{ type: string; fileUrl: string; url?: string; caption?: string }>
  ) {
    const milestone = await prismaAny.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            project: { select: { ownerId: true } },
            contractor: { select: { id: true } },
          },
        },
      },
    })

    if (!milestone) throw new NotFoundError('Milestone', milestoneId)
    if (milestone.contract.contractorId !== userId) {
      throw new AuthorizationError('Only the contractor can submit milestones')
    }

    if (milestone.status !== 'PENDING') {
      throw new ValidationError(`Milestone is not in PENDING status (current: ${milestone.status})`)
    }

    // Check dependencies
    if (milestone.dependsOnId) {
      const dependency = await prismaAny.milestone.findUnique({
        where: { id: milestone.dependsOnId },
      })
      if (
        dependency &&
        dependency.status !== 'APPROVED' &&
        dependency.status !== 'PAID'
      ) {
        throw new ValidationError(
          `This milestone depends on "${dependency.name}" which must be approved first`
        )
      }
    }

    // Check if evidence already exists (from uploads)
    const existingEvidence = await prismaAny.evidence.count({
      where: { milestoneId },
    })

    if (existingEvidence === 0 && evidence.length === 0) {
      throw new ValidationError('At least one piece of evidence is required to submit a milestone')
    }

    // Update milestone status
    const updated = await prismaAny.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    })

    // Create evidence records if provided (for backward compatibility)
    // Note: Files should be uploaded via /milestones/:milestoneId/upload first
    if (evidence.length > 0) {
      const projectId = milestone.projectId
      await prismaAny.evidence.createMany({
        data: evidence.map((e) => ({
          projectId,
          milestoneId,
          type: e.type as any, // EvidenceType enum
          url: e.url || e.fileUrl || '',
          fileName: null,
          caption: e.caption || null,
          createdById: userId,
        })),
      })
    }

    // Create audit log
    await prismaAny.auditLog.create({
      data: {
        entityType: 'Milestone',
        entityId: milestoneId,
        action: 'SUBMITTED',
        details: { evidenceCount: evidence.length },
        userId: userId,
      },
    })

    // Create event
    await prismaAny.event.create({
      data: {
        entityType: 'Milestone',
        entityId: milestoneId,
        type: 'MILESTONE_SUBMITTED',
        payload: { evidenceCount: evidence.length },
        userId: userId,
      },
    })

    return updated
  },

  async approveMilestone(milestoneId: string, userId: string, notes?: string) {
    const milestone = await prismaAny.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            project: { select: { ownerId: true } },
            owner: { select: { id: true } },
          },
        },
      },
    })

    if (!milestone) throw new NotFoundError('Milestone', milestoneId)
    if (milestone.contract.project.ownerId !== userId) {
      throw new AuthorizationError('Only the project owner can approve milestones')
    }

    if (milestone.status !== 'SUBMITTED' && milestone.status !== 'UNDER_REVIEW') {
      throw new ValidationError(`Milestone is not in SUBMITTED or UNDER_REVIEW status (current: ${milestone.status})`)
    }

    // Check for evidence
    const evidenceCount = await prismaAny.evidence.count({
      where: { milestoneId },
    })
    if (evidenceCount === 0) {
      throw new ValidationError('Cannot approve milestone without evidence')
    }

    // Update milestone status
    const updated = await prismaAny.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: userId,
      },
    })

    // Create audit log
    await prismaAny.auditLog.create({
      data: {
        entityType: 'Milestone',
        entityId: milestoneId,
        action: 'APPROVED',
        details: { notes: notes || null },
        userId: userId,
      },
    })

    // Create event
    await prismaAny.event.create({
      data: {
        entityType: 'Milestone',
        entityId: milestoneId,
        type: 'MILESTONE_APPROVED',
        payload: { notes: notes || null },
        userId: userId,
      },
    })

    // Payment processing will be triggered separately via /payments/milestones/:id/release-payment
    // This allows the project owner to review before releasing payment

    // Sync milestone approval to GHL (fire-and-forget)
    if (milestone.contract?.projectId) {
      syncMilestoneApproved({
        projectId: milestone.contract.projectId,
        milestoneId,
        milestoneName: milestone.name,
      }).catch(() => {})
    }

    return updated
  },

  async rejectMilestone(milestoneId: string, userId: string, reason: string) {
    const milestone = await prismaAny.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            project: { select: { ownerId: true } },
            owner: { select: { id: true } },
          },
        },
      },
    })

    if (!milestone) throw new NotFoundError('Milestone', milestoneId)
    if (milestone.contract.project.ownerId !== userId) {
      throw new AuthorizationError('Only the project owner can reject milestones')
    }

    if (milestone.status !== 'SUBMITTED' && milestone.status !== 'UNDER_REVIEW') {
      throw new ValidationError(`Milestone is not in SUBMITTED or UNDER_REVIEW status (current: ${milestone.status})`)
    }

    // Update milestone status
    const updated = await prismaAny.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'PENDING', // Back to pending
      },
    })

    // Create audit log
    await prismaAny.auditLog.create({
      data: {
        entityType: 'Milestone',
        entityId: milestoneId,
        action: 'REJECTED',
        details: { reason },
        userId: userId,
        reason: reason,
      },
    })

    // Create event
    await prismaAny.event.create({
      data: {
        entityType: 'Milestone',
        entityId: milestoneId,
        type: 'MILESTONE_REJECTED',
        payload: { reason },
        userId: userId,
      },
    })

    return updated
  },

  async updateMilestone(milestoneId: string, data: {
    status?: string
    reviewerNotes?: string
    [key: string]: any
  }, userId?: string) {
    const milestone = await prismaAny.milestone.findUnique({
      where: { id: milestoneId },
    })

    if (!milestone) {
      throw new NotFoundError('Milestone', milestoneId)
    }

    const updated = await prismaAny.milestone.update({
      where: { id: milestoneId },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.reviewerNotes && { reviewerNotes: data.reviewerNotes }),
      },
    })

    return updated
  },

  // ========================================================================
  // MULTI-PARTY APPROVAL (Backend Consolidation v10)
  // ========================================================================

  /**
   * Submit milestone for multi-party approval.
   * Creates MilestoneApproval records for required approvers (HOMEOWNER, plus LENDER if financed).
   */
  async submitForApproval(milestoneId: string, userId: string) {
    const milestone = await prismaAny.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            project: {
              select: {
                id: true,
                ownerId: true,
                financingApplications: {
                  where: { status: 'FUNDED' },
                  select: { id: true },
                },
              },
            },
            contractor: { select: { id: true } },
          },
        },
        evidence: { select: { id: true } },
      },
    })

    if (!milestone) throw new NotFoundError('Milestone', milestoneId)
    if (milestone.contract.contractorId !== userId) {
      throw new AuthorizationError('Only the contractor can submit milestones for approval')
    }

    if (milestone.status !== 'SUBMITTED' && milestone.status !== 'PENDING') {
      throw new ValidationError(`Milestone must be PENDING or SUBMITTED (current: ${milestone.status})`)
    }

    if (milestone.evidence.length === 0) {
      throw new ValidationError('At least one piece of evidence is required')
    }

    // Determine required approvers
    const project = milestone.contract.project
    const approvers: Array<{ approverType: string; approverId: string }> = []

    // Homeowner always required
    if (project.ownerId) {
      approvers.push({ approverType: 'HOMEOWNER', approverId: project.ownerId })
    }

    // Lender required if project has funded financing
    const hasFundedFinancing = project.financingApplications?.length > 0
    // Note: Lender approval will be created when a lender takes action

    // Create approval records
    for (const approver of approvers) {
      const existingApproval = await prismaAny.milestoneApproval.findFirst({
        where: {
          milestoneId,
          approverType: approver.approverType,
        },
      })

      if (!existingApproval) {
        await prismaAny.milestoneApproval.create({
          data: {
            milestoneId,
            approverType: approver.approverType,
            approverId: approver.approverId,
            status: 'PENDING',
          },
        })
      }
    }

    // Update milestone status
    const updated = await prismaAny.milestone.update({
      where: { id: milestoneId },
      data: { status: 'SUBMITTED' },
      include: {
        approvals: true,
      },
    })

    // Create audit log
    await prismaAny.auditLog.create({
      data: {
        entityType: 'Milestone',
        entityId: milestoneId,
        action: 'SUBMITTED_FOR_APPROVAL',
        details: {
          approversCreated: approvers.length,
          hasFundedFinancing,
        },
        userId,
      },
    })

    return updated
  },

  /**
   * Process a multi-party approval decision.
   * Checks if all required approvals are in, then transitions milestone status.
   */
  async processApproval(
    milestoneId: string,
    userId: string,
    decision: { approved: boolean; notes?: string; approverType?: string }
  ) {
    const milestone = await prismaAny.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            project: { select: { ownerId: true } },
          },
        },
        approvals: true,
      },
    })

    if (!milestone) throw new NotFoundError('Milestone', milestoneId)

    if (milestone.status !== 'SUBMITTED' && milestone.status !== 'UNDER_REVIEW') {
      throw new ValidationError(`Milestone is not awaiting approval (current: ${milestone.status})`)
    }

    // Determine approver type from the user's role context
    const approverType = decision.approverType || (
      milestone.contract.project.ownerId === userId ? 'HOMEOWNER' : 'LENDER'
    )

    // Find or create approval record for this approver
    let approval = await prismaAny.milestoneApproval.findFirst({
      where: { milestoneId, approverType, approverId: userId },
    })

    if (!approval) {
      approval = await prismaAny.milestoneApproval.create({
        data: {
          milestoneId,
          approverType,
          approverId: userId,
          status: 'PENDING',
        },
      })
    }

    // Update approval
    await prismaAny.milestoneApproval.update({
      where: { id: approval.id },
      data: {
        status: decision.approved ? 'APPROVED' : 'REJECTED',
        notes: decision.notes ?? null,
        decidedAt: new Date(),
      },
    })

    // Re-fetch all approvals
    const allApprovals = await prismaAny.milestoneApproval.findMany({
      where: { milestoneId },
    })

    // Check consensus
    const hasRejection = allApprovals.some((a: any) => a.status === 'REJECTED')
    const allApproved = allApprovals.length > 0 && allApprovals.every((a: any) => a.status === 'APPROVED')

    let newStatus = 'UNDER_REVIEW'
    if (hasRejection) {
      newStatus = 'REJECTED'
    } else if (allApproved) {
      newStatus = 'APPROVED'
    }

    const updated = await prismaAny.milestone.update({
      where: { id: milestoneId },
      data: {
        status: newStatus,
        ...(newStatus === 'APPROVED' && {
          approvedAt: new Date(),
          approvedById: userId,
        }),
      },
      include: { approvals: true },
    })

    // Audit log
    await prismaAny.auditLog.create({
      data: {
        entityType: 'Milestone',
        entityId: milestoneId,
        action: decision.approved ? 'APPROVAL_GRANTED' : 'APPROVAL_DENIED',
        details: {
          approverType,
          notes: decision.notes,
          newStatus,
          approvalsSummary: allApprovals.map((a: any) => ({
            type: a.approverType,
            status: a.status,
          })),
        },
        userId,
      },
    })

    return updated
  },

  /**
   * Get approval status for a milestone
   */
  async getApprovals(milestoneId: string) {
    const milestone = await prismaAny.milestone.findUnique({
      where: { id: milestoneId },
      select: { id: true },
    })

    if (!milestone) throw new NotFoundError('Milestone', milestoneId)

    return prismaAny.milestoneApproval.findMany({
      where: { milestoneId },
      include: {
        approver: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
  },
}
