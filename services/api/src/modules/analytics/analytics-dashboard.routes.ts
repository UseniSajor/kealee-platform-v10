/**
 * Analytics Dashboard Routes
 * Serves pre-computed and live analytics for all user-type dashboards
 */

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { validateQuery } from '../../middleware/validation.middleware'
import { PrismaClient } from '@kealee/database'

const prisma = new PrismaClient()
const p = prisma as any

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const dateRangeSchema = z.object({
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  period: z.enum(['7d', '30d', '90d', '1y']).optional(),
})

const projectIdSchema = z.object({
  projectId: z.string().uuid(),
})

const contractorIdSchema = z.object({
  contractorId: z.string().uuid(),
})

// ============================================================================
// HELPER — resolve date range from period string
// ============================================================================

function resolveDateRange(query: any): { start: Date; end: Date } {
  const end = query.end ? new Date(query.end) : new Date()
  let start: Date

  if (query.start) {
    start = new Date(query.start)
  } else {
    start = new Date()
    switch (query.period || '30d') {
      case '7d': start.setDate(start.getDate() - 7); break
      case '30d': start.setDate(start.getDate() - 30); break
      case '90d': start.setDate(start.getDate() - 90); break
      case '1y': start.setFullYear(start.getFullYear() - 1); break
    }
  }

  return { start, end }
}

// ============================================================================
// HELPER - safe number conversion
// ============================================================================

function toNum(val: any): number {
  if (val == null) return 0
  return typeof val === 'number' ? val : Number(val)
}

function pct(num: number, den: number): number {
  return den > 0 ? Math.round((num / den) * 1000) / 10 : 0
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthsBack(n: number): Date {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

// ============================================================================
// ROUTES
// ============================================================================

export async function analyticsDashboardRoutes(fastify: FastifyInstance) {

  // ──────────────────────────────────────────────────────────────────────────
  // GET /analytics/dashboard/project/:projectId — Project Benchmark
  // ──────────────────────────────────────────────────────────────────────────
  fastify.get('/dashboard/project/:projectId', async (request, reply) => {
    try {
      const { projectId } = request.params as any

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { milestones: true, budgetItems: true } as any,
      })
      if (!project) return reply.code(404).send({ error: 'Project not found' })

      // Budget
      const budgetItems = (project as any).budgetItems || []
      const totalBudget = budgetItems.reduce((s: number, b: any) => s + toNum(b.estimatedCost || b.amount), 0) || toNum((project as any).budget)
      const spent = budgetItems.reduce((s: number, b: any) => s + toNum(b.actualCost || b.spentAmount || 0), 0)
      const committed = budgetItems.reduce((s: number, b: any) => s + toNum(b.committedCost || 0), 0)
      const remaining = Math.max(0, totalBudget - spent - committed)
      const percentUsed = pct(spent, totalBudget)
      const variance = totalBudget - spent
      const forecastAtCompletion = percentUsed > 0 ? Math.round(spent / (percentUsed / 100)) : totalBudget

      // Schedule
      const milestones = (project as any).milestones || []
      const completedMs = milestones.filter((m: any) => m.status === 'COMPLETED' || m.completedAt)
      const behindMs = milestones.filter((m: any) => !m.completedAt && m.dueDate && new Date(m.dueDate) < new Date())
      const percentComplete = pct(completedMs.length, milestones.length || 1)

      // Quality
      const inspections = await p.qAInspection?.findMany?.({ where: { projectId } }) || []
      const passedInspections = inspections.filter((i: any) => i.status === 'passed' || i.status === 'PASSED')
      const inspectionPassRate = pct(passedInspections.length, inspections.length || 1)
      const qaIssues = await p.qAIssue?.findMany?.({ where: { projectId } }) || []
      const openIssues = qaIssues.filter((i: any) => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length
      const criticalIssues = qaIssues.filter((i: any) => i.severity === 'CRITICAL' || i.severity === 'critical').length

      // Contractors
      const contractorProjects = await p.contractorProject?.findMany?.({
        where: { projectId },
        include: { contractor: { select: { id: true, companyName: true } } },
      }) || []
      const contractorScores = await p.contractorScore?.findMany?.({
        where: { contractorId: { in: contractorProjects.map((cp: any) => cp.contractorId) } },
      }) || []
      const avgReliability = contractorScores.length > 0
        ? Math.round(contractorScores.reduce((s: number, cs: any) => s + cs.overallScore, 0) / contractorScores.length)
        : 0

      // Health score
      const budgetHealth = Math.max(0, 100 - Math.abs(percentUsed - percentComplete) * 2)
      const scheduleHealth = Math.max(0, 100 - (behindMs.length * 15))
      const qualityHealth = inspectionPassRate
      const healthScore = Math.round(budgetHealth * 0.35 + scheduleHealth * 0.35 + qualityHealth * 0.30)

      return reply.send({
        success: true,
        data: {
          projectId,
          projectName: (project as any).name || (project as any).title || projectId,
          healthScore,
          healthTrend: 'stable',
          budget: { totalBudget, spent, committed, remaining, percentUsed, variance, forecastAtCompletion },
          schedule: {
            percentComplete,
            milestonesTotal: milestones.length,
            milestonesCompleted: completedMs.length,
            milestonesBehind: behindMs.length,
            daysAhead: 0,
          },
          quality: { inspectionPassRate, openIssues, criticalIssues },
          contractors: { totalContractors: contractorProjects.length, avgReliabilityScore: avgReliability },
        },
      })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: error.message || 'Failed to get project benchmark' })
    }
  })

  // ──────────────────────────────────────────────────────────────────────────
  // GET /analytics/dashboard/contractor/:contractorId — Contractor Scorecard
  // ──────────────────────────────────────────────────────────────────────────
  fastify.get('/dashboard/contractor/:contractorId', async (request, reply) => {
    try {
      const { contractorId } = request.params as any

      const contractor = await prisma.contractor.findUnique({ where: { id: contractorId } })
      if (!contractor) return reply.code(404).send({ error: 'Contractor not found' })

      // Score
      const score = await p.contractorScore?.findUnique?.({ where: { contractorId } })
      const overallScore = score?.overallScore ?? 50

      // Earnings
      const escrowTxns = await p.escrowTransaction?.findMany?.({
        where: { recipientId: contractorId, type: 'RELEASE', status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
      }) || []
      const totalEarnings = escrowTxns.reduce((s: number, t: any) => s + toNum(t.amount), 0)
      const last30 = escrowTxns.filter((t: any) => new Date(t.createdAt) >= daysAgo(30))
        .reduce((s: number, t: any) => s + toNum(t.amount), 0)

      // Earnings trend
      const earningsTrend: Array<{ month: string; amount: number }> = []
      for (let i = 11; i >= 0; i--) {
        const ms = monthsBack(i)
        const me = new Date(ms); me.setMonth(me.getMonth() + 1)
        const mKey = monthKey(ms)
        const amt = escrowTxns
          .filter((t: any) => new Date(t.createdAt) >= ms && new Date(t.createdAt) < me)
          .reduce((s: number, t: any) => s + toNum(t.amount), 0)
        earningsTrend.push({ month: mKey, amount: amt })
      }

      // Bids
      const bids = await prisma.bidSubmission.findMany({ where: { contractorId }, orderBy: { createdAt: 'desc' } })
      const wonBids = bids.filter((b: any) => b.status === 'AWARDED' || b.status === 'ACCEPTED')
      const winRate = pct(wonBids.length, bids.length || 1)
      const bidsByMonth: Array<{ month: string; submitted: number; won: number }> = []
      for (let i = 5; i >= 0; i--) {
        const ms = monthsBack(i)
        const me = new Date(ms); me.setMonth(me.getMonth() + 1)
        const mKey = monthKey(ms)
        bidsByMonth.push({
          month: mKey,
          submitted: bids.filter((b: any) => new Date(b.createdAt) >= ms && new Date(b.createdAt) < me).length,
          won: wonBids.filter((b: any) => new Date(b.createdAt) >= ms && new Date(b.createdAt) < me).length,
        })
      }

      // Reviews
      const reviews = await prisma.contractorReview.findMany({ where: { contractorId }, orderBy: { createdAt: 'desc' } })
      const avgRating = reviews.length > 0
        ? Math.round(reviews.reduce((s, r) => s + toNum(r.rating), 0) / reviews.length * 10) / 10
        : 0
      const ratingDistribution = [0, 0, 0, 0, 0]
      reviews.forEach(r => { const rt = Math.round(toNum(r.rating)); if (rt >= 1 && rt <= 5) ratingDistribution[rt - 1]++ })

      // Projects
      const contractorProjects = await p.contractorProject?.findMany?.({ where: { contractorId } }) || []
      const completed = contractorProjects.filter((cp: any) => cp.status === 'COMPLETED')
      const active = contractorProjects.filter((cp: any) => cp.status === 'ACTIVE' || cp.status === 'IN_PROGRESS')

      return reply.send({
        success: true,
        data: {
          contractorId,
          companyName: (contractor as any).companyName || 'Unknown',
          overallScore,
          confidence: score?.confidence ?? 'low',
          components: {
            responsiveness: score?.responsivenessScore ?? 50,
            bidAccuracy: score?.bidAccuracyScore ?? 50,
            scheduleAdherence: score?.scheduleAdherenceScore ?? 50,
            quality: score?.qualityScore ?? 50,
            clientSatisfaction: score?.clientSatisfactionScore ?? 50,
            safety: score?.safetyScore ?? 50,
          },
          earnings: { totalEarnings, last30Days: last30, earningsTrend },
          bids: { totalSubmitted: bids.length, totalWon: wonBids.length, winRate, bidsByMonth, activeBids: bids.filter((b: any) => b.status === 'SUBMITTED').length },
          reviews: { avgRating, totalReviews: reviews.length, ratingDistribution },
          projects: { totalCompleted: completed.length, activeProjects: active.length },
        },
      })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: error.message || 'Failed to get contractor scorecard' })
    }
  })

  // ──────────────────────────────────────────────────────────────────────────
  // GET /analytics/dashboard/pm/:pmId — PM Dashboard Analytics
  // ──────────────────────────────────────────────────────────────────────────
  fastify.get('/dashboard/pm/:pmId', async (request, reply) => {
    try {
      const { pmId } = request.params as any

      // Projects
      const projects = await prisma.project.findMany({
        where: {
          OR: [
            { pmId } as any,
            { assignedPmId: pmId } as any,
            { createdById: pmId } as any,
          ],
        },
        include: { milestones: true } as any,
      })
      const activeProjects = projects.filter((p: any) => p.status === 'ACTIVE' || p.status === 'IN_PROGRESS')
      const totalBudgetManaged = activeProjects.reduce((s, p: any) => s + toNum(p.budget || 0), 0)

      // Tasks
      const tasks = await p.task?.findMany?.({ where: { assigneeId: pmId }, orderBy: { dueDate: 'asc' } }) || []
      const openTasks = tasks.filter((t: any) => t.status !== 'COMPLETED' && t.status !== 'DONE').length
      const overdueTasks = tasks.filter((t: any) =>
        t.status !== 'COMPLETED' && t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < new Date()
      ).length

      // AI Actions
      const aiActions = await p.autonomousAction?.findMany?.({ where: { createdAt: { gte: daysAgo(30) } } }) || []
      const approvedActions = aiActions.filter((a: any) => a.decision === 'APPROVED' || a.decision === 'AUTO_APPROVED')

      // Budget by project
      const budgetByProject = activeProjects.map((p: any) => ({
        projectName: p.name || p.title || 'Project',
        budget: toNum(p.budget),
        spent: toNum(p.totalSpent || p.actualCost || 0),
        variance: toNum(p.budget) - toNum(p.totalSpent || p.actualCost || 0),
      }))

      return reply.send({
        success: true,
        data: {
          pmId,
          workload: {
            activeProjects: activeProjects.length,
            totalBudgetManaged,
            openTasks,
            overdueTasks,
          },
          performance: {
            pmScore: 75,
            scoreTrend: 'stable',
            projectsOnTime: 80,
            projectsOnBudget: 85,
            decisionsThisMonth: aiActions.length,
          },
          automationImpact: {
            tasksAutomated: approvedActions.length,
            hoursRecovered: Math.round(approvedActions.length * 0.5 * 10) / 10,
            decisionsAutomated: approvedActions.length,
            approvalRate: pct(approvedActions.length, aiActions.length || 1),
          },
          budgetAccuracy: {
            avgVariance: 0,
            budgetByProject,
          },
        },
      })
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({ error: error.message || 'Failed to get PM analytics' })
    }
  })

  // ──────────────────────────────────────────────────────────────────────────
  // GET /analytics/dashboard/platform — Platform Analytics (Admin)
  // ──────────────────────────────────────────────────────────────────────────
  fastify.get(
    '/dashboard/platform',
    { preHandler: [validateQuery(dateRangeSchema)] },
    async (request, reply) => {
      try {
        const { start, end } = resolveDateRange(request.query)
        const dateFilter = { gte: start, lte: end }

        // Revenue
        const feeTxns = await p.escrowTransaction?.findMany?.({
          where: { type: 'FEE', status: 'COMPLETED', createdAt: dateFilter },
        }) || []
        const totalRevenue = feeTxns.reduce((s: number, t: any) => s + toNum(t.amount), 0)

        const subscriptions = await p.subscription?.findMany?.({ where: { status: 'ACTIVE' } }) || []
        const mrr = subscriptions.reduce((s: number, sub: any) => s + toNum(sub.monthlyAmount || sub.price || 0), 0)

        // Revenue by month
        const revenueByMonth: Array<{ month: string; revenue: number; fees: number }> = []
        for (let i = 11; i >= 0; i--) {
          const ms = monthsBack(i)
          const me = new Date(ms); me.setMonth(me.getMonth() + 1)
          const mKey = monthKey(ms)
          const rev = feeTxns
            .filter((t: any) => new Date(t.createdAt) >= ms && new Date(t.createdAt) < me)
            .reduce((s: number, t: any) => s + toNum(t.amount), 0)
          revenueByMonth.push({ month: mKey, revenue: rev, fees: rev * 0.03 })
        }

        // Growth
        const totalUsers = await prisma.user.count()
        const newUsers = await prisma.user.count({ where: { createdAt: dateFilter } })
        const usersByRole = (await prisma.user.groupBy({ by: ['role'], _count: true }))
          .map((u: any) => ({ role: u.role || 'UNKNOWN', count: u._count }))
        const usersByMonth: Array<{ month: string; newUsers: number; churned: number }> = []
        for (let i = 11; i >= 0; i--) {
          const ms = monthsBack(i)
          const me = new Date(ms); me.setMonth(me.getMonth() + 1)
          const cnt = await prisma.user.count({ where: { createdAt: { gte: ms, lt: me } } })
          usersByMonth.push({ month: monthKey(ms), newUsers: cnt, churned: 0 })
        }

        // Marketplace
        const totalContractors = await prisma.contractor.count()
        const activeContractors = await prisma.contractor.count({ where: { status: 'ACTIVE' } })
        const totalBidsSubmitted = await prisma.bidSubmission.count({ where: { createdAt: dateFilter } })

        // Contractors by trade
        const allContractors = await prisma.contractor.findMany({ select: { trades: true } as any })
        const tradeMap = new Map<string, number>()
        allContractors.forEach((c: any) => {
          (c.trades || []).forEach((t: string) => tradeMap.set(t, (tradeMap.get(t) || 0) + 1))
        })
        const contractorsByTrade = Array.from(tradeMap.entries())
          .map(([trade, count]) => ({ trade, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)

        // Financial
        const escrowAgreements = await p.escrowAgreement?.findMany?.({ where: { createdAt: dateFilter } }) || []
        const totalEscrowVolume = escrowAgreements.reduce((s: number, e: any) => s + toNum(e.totalAmount || e.amount), 0)
        const pendingReleases = await p.escrowTransaction?.count?.({ where: { type: 'RELEASE', status: 'PENDING' } }) || 0

        // Cash flow projection
        const cashFlowProjection: Array<{ date: string; inflow: number; outflow: number; balance: number }> = []
        let runningBalance = 0
        for (let i = 5; i >= 0; i--) {
          const ms = monthsBack(i)
          const me = new Date(ms); me.setMonth(me.getMonth() + 1)
          const deposits = (await p.escrowTransaction?.findMany?.({
            where: { type: 'DEPOSIT', status: 'COMPLETED', createdAt: { gte: ms, lt: me } },
          }) || []).reduce((s: number, t: any) => s + toNum(t.amount), 0)
          const releases = (await p.escrowTransaction?.findMany?.({
            where: { type: 'RELEASE', status: 'COMPLETED', createdAt: { gte: ms, lt: me } },
          }) || []).reduce((s: number, t: any) => s + toNum(t.amount), 0)
          runningBalance += deposits - releases
          cashFlowProjection.push({ date: monthKey(ms), inflow: deposits, outflow: releases, balance: runningBalance })
        }

        // AI / Automation
        const aiActions = await p.autonomousAction?.findMany?.({ where: { createdAt: dateFilter } }) || []
        const totalAutonomousActions = await p.autonomousAction?.count?.() || 0
        const approvedAi = aiActions.filter((a: any) => a.decision === 'APPROVED' || a.decision === 'AUTO_APPROVED')

        const aiByType = new Map<string, { count: number; approved: number }>()
        aiActions.forEach((a: any) => {
          const type = a.actionType || 'unknown'
          const ex = aiByType.get(type) || { count: 0, approved: 0 }
          ex.count++
          if (a.decision === 'APPROVED' || a.decision === 'AUTO_APPROVED') ex.approved++
          aiByType.set(type, ex)
        })

        // Operations
        const totalProjects = await prisma.project.count()
        const activeProjectsCount = await prisma.project.count({ where: { status: 'ACTIVE' } })
        const completedProjects = await prisma.project.count({ where: { status: 'COMPLETED' } })
        const projectsByStatus = (await prisma.project.groupBy({ by: ['status'], _count: true }))
          .map((p: any) => ({ status: p.status || 'UNKNOWN', count: p._count }))

        return reply.send({
          success: true,
          data: {
            dateRange: { start: start.toISOString(), end: end.toISOString() },
            revenue: {
              totalRevenue, mrr, arr: mrr * 12,
              growthRate: 0, revenueByMonth, avgRevenuePerUser: totalUsers > 0 ? Math.round(totalRevenue / totalUsers) : 0,
            },
            growth: {
              totalUsers, newUsersThisPeriod: newUsers, userGrowthRate: 0,
              usersByRole, usersByMonth, activationRate: 0, churnRate: 0, retentionDay30: 0,
            },
            marketplace: {
              totalContractors, activeContractors, totalBidsSubmitted,
              avgBidsPerProject: 0, matchRate: 0, avgContractorScore: 50,
              contractorsByTrade,
            },
            financial: {
              totalEscrowVolume,
              avgEscrowAmount: escrowAgreements.length > 0 ? Math.round(totalEscrowVolume / escrowAgreements.length) : 0,
              pendingReleases, disputeRate: 0, processingFees: totalRevenue * 0.03,
              cashFlowProjection,
            },
            ai: {
              totalAutonomousActions, actionsThisPeriod: aiActions.length,
              approvalRate: pct(approvedAi.length, aiActions.length || 1),
              hoursRecovered: Math.round(approvedAi.length * 0.5 * 10) / 10,
              actionsByType: Array.from(aiByType.entries()).map(([type, d]) => ({
                type, count: d.count, approvalRate: pct(d.approved, d.count),
              })),
            },
            operations: {
              totalProjects, activeProjects: activeProjectsCount, completedProjects,
              avgProjectDuration: 0, onTimeCompletionRate: 0, avgBudgetVariance: 0,
              projectsByStatus,
            },
          },
        })
      } catch (error: any) {
        fastify.log.error(error)
        return reply.code(500).send({ error: error.message || 'Failed to get platform analytics' })
      }
    }
  )
}
