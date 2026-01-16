import { prisma } from '@kealee/database'
import { MilestoneStatus } from '@prisma/client'
import { NotFoundError, AuthorizationError, ValidationError } from '../../errors/app.error'

export const milestoneService = {
  async getContractMilestones(contractId: string, userId: string) {
    const contract = await prisma.contractAgreement.findUnique({
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

    const milestones = await prisma.milestone.findMany({
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
      (m) => m.status === MilestoneStatus.APPROVED || m.status === MilestoneStatus.PAID
    ).length
    const submitted = milestones.filter((m) => m.status === MilestoneStatus.SUBMITTED).length
    const underReview = milestones.filter((m) => m.status === MilestoneStatus.UNDER_REVIEW).length
    const pending = milestones.filter((m) => m.status === MilestoneStatus.PENDING).length

    const totalAmount = milestones.reduce((sum, m) => sum + Number(m.amount || 0), 0)
    const paidAmount = milestones
      .filter((m) => m.status === MilestoneStatus.PAID)
      .reduce((sum, m) => sum + Number(m.amount || 0), 0)

    const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0
    const paymentProgress = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0

    // Find upcoming milestones (pending with due date within 7 days)
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const upcomingMilestones = milestones.filter(
      (m) =>
        m.status === MilestoneStatus.PENDING &&
        m.dueDate &&
        new Date(m.dueDate) <= sevenDaysFromNow &&
        new Date(m.dueDate) >= now
    )

    // Build dependency graph
    const dependencyGraph = milestones.map((milestone) => {
      const canSubmit =
        !milestone.dependsOnId ||
        milestones.find((m) => m.id === milestone.dependsOnId)?.status === MilestoneStatus.APPROVED ||
        milestones.find((m) => m.id === milestone.dependsOnId)?.status === MilestoneStatus.PAID

      return {
        ...milestone,
        canSubmit,
        blockedBy: milestone.dependsOnId
          ? milestones.find((m) => m.id === milestone.dependsOnId && m.status !== MilestoneStatus.APPROVED && m.status !== MilestoneStatus.PAID)
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
        upcomingMilestones: upcomingMilestones.map((m) => ({
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
    const milestone = await prisma.milestone.findUnique({
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
    const milestone = await prisma.milestone.findUnique({
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

    if (milestone.status !== MilestoneStatus.PENDING) {
      throw new ValidationError(`Milestone is not in PENDING status (current: ${milestone.status})`)
    }

    // Check dependencies
    if (milestone.dependsOnId) {
      const dependency = await prisma.milestone.findUnique({
        where: { id: milestone.dependsOnId },
      })
      if (
        dependency &&
        dependency.status !== MilestoneStatus.APPROVED &&
        dependency.status !== MilestoneStatus.PAID
      ) {
        throw new ValidationError(
          `This milestone depends on "${dependency.name}" which must be approved first`
        )
      }
    }

    // Check if evidence already exists (from uploads)
    const existingEvidence = await prisma.evidence.count({
      where: { milestoneId },
    })

    if (existingEvidence === 0 && evidence.length === 0) {
      throw new ValidationError('At least one piece of evidence is required to submit a milestone')
    }

    // Update milestone status
    const updated = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: MilestoneStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    })

    // Create evidence records if provided (for backward compatibility)
    // Note: Files should be uploaded via /milestones/:milestoneId/upload first
    if (evidence.length > 0) {
      const projectId = milestone.projectId
      await prisma.evidence.createMany({
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
    await prisma.auditLog.create({
      data: {
        entityType: 'Milestone',
        entityId: milestoneId,
        action: 'SUBMITTED',
        details: { evidenceCount: evidence.length },
        userId: userId,
      },
    })

    // Create event
    await prisma.event.create({
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
    const milestone = await prisma.milestone.findUnique({
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

    if (milestone.status !== MilestoneStatus.SUBMITTED && milestone.status !== MilestoneStatus.UNDER_REVIEW) {
      throw new ValidationError(`Milestone is not in SUBMITTED or UNDER_REVIEW status (current: ${milestone.status})`)
    }

    // Check for evidence
    const evidenceCount = await prisma.evidence.count({
      where: { milestoneId },
    })
    if (evidenceCount === 0) {
      throw new ValidationError('Cannot approve milestone without evidence')
    }

    // Update milestone status
    const updated = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: MilestoneStatus.APPROVED,
        approvedAt: new Date(),
        approvedById: userId,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'Milestone',
        entityId: milestoneId,
        action: 'APPROVED',
        details: { notes: notes || null },
        userId: userId,
      },
    })

    // Create event
    await prisma.event.create({
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
    const milestone = await prisma.milestone.findUnique({
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

    if (milestone.status !== MilestoneStatus.SUBMITTED && milestone.status !== MilestoneStatus.UNDER_REVIEW) {
      throw new ValidationError(`Milestone is not in SUBMITTED or UNDER_REVIEW status (current: ${milestone.status})`)
    }

    // Update milestone status
    const updated = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: MilestoneStatus.PENDING, // Back to pending
      },
    })

    // Create audit log
    await prisma.auditLog.create({
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
    await prisma.event.create({
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
}
