import { prismaAny } from '../../utils/prisma-helper'
// Prisma types available through prismaAny
import { NotFoundError, AuthorizationError, ValidationError } from '../../errors/app.error'

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

    // In production, this would trigger payment processing via Stripe
    // For now, we just update the status to APPROVED

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
}
