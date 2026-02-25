import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError, AuthorizationError, ValidationError, ConflictError } from '../../errors/app.error'
import { Decimal } from '@prisma/client/runtime/library'

export const financingService = {
  /**
   * Submit a financing application for a project
   */
  async submitApplication(
    data: {
      projectId: string
      requestedAmount: number
      termMonths?: number
      lenderName?: string
      loanOfficer?: string
    },
    applicantId: string
  ) {
    const project = await prismaAny.project.findUnique({
      where: { id: data.projectId },
      select: { id: true, ownerId: true, status: true },
    })

    if (!project) throw new NotFoundError('Project', data.projectId)
    if (project.ownerId !== applicantId) {
      throw new AuthorizationError('Only the project owner can apply for financing')
    }

    // Check for existing application
    const existing = await prismaAny.financingApplication.findFirst({
      where: { projectId: data.projectId },
    })
    if (existing) {
      throw new ConflictError('Financing application already exists for this project')
    }

    const application = await prismaAny.$transaction(async (tx: any) => {
      const app = await tx.financingApplication.create({
        data: {
          projectId: data.projectId,
          applicantId,
          requestedAmount: new Decimal(data.requestedAmount),
          termMonths: data.termMonths ?? 60,
          lenderName: data.lenderName ?? null,
          loanOfficer: data.loanOfficer ?? null,
          status: 'PENDING',
        },
        include: {
          project: { select: { id: true, name: true, status: true } },
          applicant: { select: { id: true, name: true, email: true } },
        },
      })

      // Update project status
      await tx.project.update({
        where: { id: data.projectId },
        data: { status: 'PENDING_FINANCING' },
      })

      return app
    })

    return application
  },

  /**
   * Get all financing applications (for lenders)
   */
  async getApplications(status?: string) {
    const where: any = {}
    if (status) where.status = status

    return prismaAny.financingApplication.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            budgetTotal: true,
            category: true,
            ownerId: true,
          },
        },
        applicant: { select: { id: true, name: true, email: true } },
      },
      orderBy: { appliedAt: 'desc' },
    })
  },

  /**
   * Get a single financing application with full details
   */
  async getApplication(applicationId: string, userId: string) {
    const application = await prismaAny.financingApplication.findUnique({
      where: { id: applicationId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            budgetTotal: true,
            category: true,
            ownerId: true,
            contracts: {
              select: {
                id: true,
                milestones: {
                  include: {
                    evidence: true,
                    spatialVerifications: true,
                    approvals: true,
                  },
                  orderBy: { createdAt: 'asc' },
                },
              },
            },
            spatialScans: { orderBy: { scanDate: 'desc' } },
            items: { include: { product: true } },
          },
        },
        applicant: { select: { id: true, name: true, email: true } },
        disbursements: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!application) throw new NotFoundError('FinancingApplication', applicationId)
    return application
  },

  /**
   * Review a financing application (lender approve/reject)
   */
  async reviewApplication(
    applicationId: string,
    lenderId: string,
    decision: {
      approved: boolean
      approvedAmount?: number
      interestRate?: number
      termMonths?: number
      loanNumber?: string
      reason?: string
    }
  ) {
    const application = await prismaAny.financingApplication.findUnique({
      where: { id: applicationId },
      include: { project: { select: { id: true, status: true } } },
    })

    if (!application) throw new NotFoundError('FinancingApplication', applicationId)

    if (application.status !== 'PENDING' && application.status !== 'UNDER_REVIEW') {
      throw new ValidationError(
        `Application cannot be reviewed in ${application.status} status`
      )
    }

    const newStatus = decision.approved ? 'APPROVED' : 'REJECTED'

    const updated = await prismaAny.$transaction(async (tx: any) => {
      const app = await tx.financingApplication.update({
        where: { id: applicationId },
        data: {
          status: newStatus,
          approvedAmount: decision.approved && decision.approvedAmount
            ? new Decimal(decision.approvedAmount)
            : null,
          interestRate: decision.approved ? decision.interestRate ?? null : null,
          termMonths: decision.approved ? decision.termMonths ?? null : null,
          loanNumber: decision.approved ? decision.loanNumber ?? null : null,
          reviewedAt: new Date(),
          ...(decision.approved && { approvedAt: new Date() }),
        },
      })

      // Update project status
      if (decision.approved) {
        await tx.project.update({
          where: { id: application.projectId },
          data: { status: 'FINANCING_APPROVED' },
        })
      }

      return app
    })

    return updated
  },

  /**
   * Mark financing as funded
   */
  async fundApplication(applicationId: string, lenderId: string) {
    const application = await prismaAny.financingApplication.findUnique({
      where: { id: applicationId },
      include: { project: { select: { id: true } } },
    })

    if (!application) throw new NotFoundError('FinancingApplication', applicationId)
    if (application.status !== 'APPROVED') {
      throw new ValidationError('Can only fund approved applications')
    }

    const updated = await prismaAny.$transaction(async (tx: any) => {
      const app = await tx.financingApplication.update({
        where: { id: applicationId },
        data: {
          status: 'FUNDED',
          fundedAt: new Date(),
        },
      })

      await tx.project.update({
        where: { id: application.projectId },
        data: {
          status: 'ACTIVE',
          startDate: new Date(),
        },
      })

      return app
    })

    return updated
  },

  /**
   * Disburse a payment against a financing application
   */
  async disbursePayment(
    financingId: string,
    milestoneId: string,
    amount: number,
    lenderId: string
  ) {
    const financing = await prismaAny.financingApplication.findUnique({
      where: { id: financingId },
      include: { project: { select: { id: true } } },
    })

    if (!financing) throw new NotFoundError('FinancingApplication', financingId)
    if (financing.status !== 'FUNDED') {
      throw new ValidationError('Can only disburse from funded financing')
    }

    const milestone = await prismaAny.milestone.findUnique({
      where: { id: milestoneId },
    })

    if (!milestone) throw new NotFoundError('Milestone', milestoneId)
    if (milestone.status !== 'APPROVED') {
      throw new ValidationError('Milestone must be approved before disbursement')
    }

    const payment = await prismaAny.$transaction(async (tx: any) => {
      const pmt = await tx.payment.create({
        data: {
          projectId: financing.projectId,
          financingApplicationId: financingId,
          amount: new Decimal(amount),
          status: 'completed',
          paidAt: new Date(),
          metadata: {
            type: 'MILESTONE_PAYMENT',
            milestoneId,
            lenderId,
          },
        },
      })

      await tx.milestone.update({
        where: { id: milestoneId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      })

      return pmt
    })

    return payment
  },

  /**
   * Get payment history for a project's financing
   */
  async getPaymentHistory(projectId: string, userId: string) {
    const project = await prismaAny.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        ownerId: true,
        memberships: { select: { userId: true } },
        financingApplications: { select: { id: true, approvedAmount: true } },
      },
    })

    if (!project) throw new NotFoundError('Project', projectId)

    const financingApp = project.financingApplications?.[0]

    const payments = await prismaAny.payment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    })

    const totalDisbursed = payments
      .filter((p: any) => p.status === 'completed')
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)

    const totalPending = payments
      .filter((p: any) => p.status === 'pending')
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)

    return {
      payments,
      summary: {
        totalDisbursed,
        totalPending,
        approvedAmount: financingApp ? Number(financingApp.approvedAmount) : 0,
        remainingFunds: financingApp
          ? Number(financingApp.approvedAmount) - totalDisbursed
          : 0,
      },
    }
  },
}
