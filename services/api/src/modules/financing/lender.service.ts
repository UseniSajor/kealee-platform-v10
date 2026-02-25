import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError } from '../../errors/app.error'

export const lenderService = {
  /**
   * Get lender dashboard with applications and pending milestone approvals
   */
  async getDashboard(lenderId: string) {
    const applications = await prismaAny.financingApplication.findMany({
      where: {
        status: { in: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'FUNDED'] },
      },
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
        disbursements: true,
      },
      orderBy: { appliedAt: 'desc' },
    })

    // Get milestones awaiting lender approval from funded projects
    const pendingApprovals = await prismaAny.milestone.findMany({
      where: {
        status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] },
        contract: {
          project: {
            financingApplications: {
              some: { status: 'FUNDED' },
            },
          },
        },
      },
      include: {
        contract: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                financingApplications: { select: { id: true } },
              },
            },
          },
        },
        spatialVerifications: true,
        approvals: true,
        evidence: true,
      },
    })

    return {
      applications,
      pendingApprovals,
      stats: {
        totalApplications: applications.length,
        pending: applications.filter((a: any) => a.status === 'PENDING').length,
        approved: applications.filter((a: any) => a.status === 'APPROVED').length,
        funded: applications.filter((a: any) => a.status === 'FUNDED').length,
        totalDisbursed: applications
          .flatMap((a: any) => a.disbursements)
          .filter((d: any) => d.status === 'completed')
          .reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0),
        pendingMilestones: pendingApprovals.length,
      },
    }
  },

  /**
   * Generate portfolio report for lender
   */
  async getPortfolioReport(lenderId: string) {
    const dashboard = await this.getDashboard(lenderId)

    const portfolioMetrics = {
      totalLoans: dashboard.applications.length,
      totalVolume: dashboard.applications.reduce(
        (sum: number, app: any) => sum + Number(app.approvedAmount || 0),
        0
      ),
      activeLoans: dashboard.applications.filter((app: any) => app.status === 'FUNDED').length,
      disbursedAmount: dashboard.stats.totalDisbursed,
      pendingDisbursements: dashboard.stats.pendingMilestones,
      averageLoanSize:
        dashboard.applications.length > 0
          ? dashboard.applications.reduce(
              (sum: number, app: any) => sum + Number(app.approvedAmount || 0),
              0
            ) / dashboard.applications.length
          : 0,
      approvalRate:
        dashboard.stats.totalApplications > 0
          ? (dashboard.stats.approved / dashboard.stats.totalApplications) * 100
          : 0,
    }

    // Breakdown by project category
    const categoryBreakdown: Record<string, { count: number; volume: number }> = {}
    dashboard.applications.forEach((app: any) => {
      const category = app.project.category || 'OTHER'
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { count: 0, volume: 0 }
      }
      categoryBreakdown[category].count++
      categoryBreakdown[category].volume += Number(app.approvedAmount || 0)
    })

    return {
      metrics: portfolioMetrics,
      categoryBreakdown,
      applications: dashboard.applications,
      generatedAt: new Date(),
    }
  },

  /**
   * Risk assessment for a financing application
   */
  async getRiskAssessment(applicationId: string) {
    const application = await prismaAny.financingApplication.findUnique({
      where: { id: applicationId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            budgetTotal: true,
            category: true,
            status: true,
            endDate: true,
            spatialScans: { select: { id: true } },
            contracts: {
              select: {
                contractorId: true,
                contractor: { select: { id: true, name: true } },
              },
            },
          },
        },
        applicant: { select: { id: true, name: true, email: true } },
      },
    })

    if (!application) throw new NotFoundError('FinancingApplication', applicationId)

    const budget = Number(application.project.budgetTotal || 0)
    const hasContractor = application.project.contracts?.length > 0
    const hasTimeline = !!application.project.endDate
    const hasSpatialScans = application.project.spatialScans?.length > 0

    const riskFactors = {
      budgetRisk: budget > 100000 ? 'HIGH' : budget > 50000 ? 'MEDIUM' : 'LOW',
      contractorRisk: hasContractor ? 'LOW' : 'HIGH',
      timelineRisk: hasTimeline ? 'LOW' : 'MEDIUM',
      verificationRisk: hasSpatialScans ? 'LOW' : 'HIGH',
      overallRisk: 'MEDIUM' as string,
    }

    // Simple overall risk calculation
    const riskScores = { LOW: 1, MEDIUM: 2, HIGH: 3 }
    const avgRisk =
      (riskScores[riskFactors.budgetRisk as keyof typeof riskScores] +
        riskScores[riskFactors.contractorRisk as keyof typeof riskScores] +
        riskScores[riskFactors.timelineRisk as keyof typeof riskScores] +
        riskScores[riskFactors.verificationRisk as keyof typeof riskScores]) /
      4
    riskFactors.overallRisk = avgRisk <= 1.5 ? 'LOW' : avgRisk <= 2.5 ? 'MEDIUM' : 'HIGH'

    return {
      application,
      riskFactors,
      recommendation: riskFactors.overallRisk === 'LOW' ? 'APPROVE' : 'REVIEW_REQUIRED',
    }
  },
}
