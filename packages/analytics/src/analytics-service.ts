/**
 * Analytics Service
 * Calculates benchmarks, scorecards, and platform-wide analytics
 * from live Prisma data. Results are cached via AnalyticsSnapshot.
 */

import { PrismaClient } from '@kealee/database'
import type {
  ProjectBenchmark,
  ContractorScorecard,
  PmDashboardAnalytics,
  PlatformAnalytics,
  DateRange,
  TrendDirection,
} from './types'

const prisma = new PrismaClient()
const p = prisma as any // escape hatch for optional models

// ============================================================================
// HELPERS
// ============================================================================

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function pct(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0
}

function toNum(val: any): number {
  if (val == null) return 0
  return typeof val === 'number' ? val : Number(val)
}

function trend(current: number, previous: number): TrendDirection {
  const diff = current - previous
  if (diff > 2) return 'improving'
  if (diff < -2) return 'declining'
  return 'stable'
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

function monthsBack(n: number): Date {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

// ============================================================================
// ANALYTICS SERVICE
// ============================================================================

export class AnalyticsService {

  // ==========================================================================
  // PROJECT BENCHMARK
  // ==========================================================================

  async getProjectBenchmark(projectId: string): Promise<ProjectBenchmark> {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: {
        milestones: true,
        budgetItems: true,
      } as any,
    })

    // Budget
    const budgetItems = (project as any).budgetItems || []
    const totalBudget = budgetItems.reduce((s: number, b: any) => s + toNum(b.estimatedCost || b.amount), 0) || toNum((project as any).budget)
    const spent = budgetItems.reduce((s: number, b: any) => s + toNum(b.actualCost || b.spentAmount || 0), 0)
    const committed = budgetItems.reduce((s: number, b: any) => s + toNum(b.committedCost || 0), 0)
    const remaining = Math.max(0, totalBudget - spent - committed)
    const percentUsed = pct(spent, totalBudget)
    const variance = totalBudget - spent
    const forecastAtCompletion = percentUsed > 0 ? Math.round(spent / (percentUsed / 100)) : totalBudget
    const contingencyRemaining = Math.max(0, totalBudget * 0.1 - Math.max(0, spent - totalBudget * 0.9))

    // Schedule
    const milestones = (project as any).milestones || []
    const completedMs = milestones.filter((m: any) => m.status === 'COMPLETED' || m.completedAt)
    const behindMs = milestones.filter((m: any) =>
      !m.completedAt && m.dueDate && new Date(m.dueDate) < new Date()
    )
    const percentComplete = pct(completedMs.length, milestones.length || 1)

    const plannedEnd = (project as any).endDate || (project as any).targetEndDate
    const plannedStart = (project as any).startDate || (project as any).createdAt
    const projectedEndDate = plannedEnd ? new Date(plannedEnd) : new Date()
    const daysAheadCalc = plannedEnd
      ? Math.round((new Date(plannedEnd).getTime() - projectedEndDate.getTime()) / 86400000)
      : 0

    // Quality — QA inspections tied to this project
    const inspections = await p.qAInspection?.findMany?.({
      where: { projectId },
    }) || []
    const passedInspections = inspections.filter((i: any) => i.status === 'passed' || i.status === 'PASSED')
    const inspectionPassRate = pct(passedInspections.length, inspections.length || 1)
    const qaIssues = await p.qAIssue?.findMany?.({ where: { projectId } }) || []
    const openIssues = qaIssues.filter((i: any) => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length
    const criticalIssues = qaIssues.filter((i: any) => i.severity === 'CRITICAL' || i.severity === 'critical').length
    const resolvedIssues = qaIssues.filter((i: any) => i.status === 'RESOLVED' || i.status === 'CLOSED').length
    const resolvedWithTime = qaIssues.filter((i: any) => i.resolvedAt && i.createdAt)
    const avgResolutionDays = resolvedWithTime.length > 0
      ? Math.round(resolvedWithTime.reduce((sum: number, i: any) => {
          return sum + (new Date(i.resolvedAt).getTime() - new Date(i.createdAt).getTime()) / 86400000
        }, 0) / resolvedWithTime.length)
      : 0

    // Contractors on this project
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

    const topPerformer = contractorScores.length > 0
      ? (() => {
          const best = contractorScores.sort((a: any, b: any) => b.overallScore - a.overallScore)[0]
          const cp = contractorProjects.find((c: any) => c.contractorId === best.contractorId)
          return { name: cp?.contractor?.companyName || 'Unknown', score: best.overallScore }
        })()
      : null

    const atRisk = contractorScores
      .filter((cs: any) => cs.overallScore < 50)
      .map((cs: any) => {
        const cp = contractorProjects.find((c: any) => c.contractorId === cs.contractorId)
        const issues: string[] = []
        if (cs.scheduleAdherenceScore < 50) issues.push('Schedule delays')
        if (cs.qualityScore < 50) issues.push('Quality concerns')
        if (cs.responsivenessScore < 50) issues.push('Slow responsiveness')
        return { name: cp?.contractor?.companyName || 'Unknown', score: cs.overallScore, issues }
      })

    // Platform average comparisons (compare to all projects)
    const allProjects = await prisma.project.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    })
    const budgetVsAvg = 0 // Simplified — would compare to platform average
    const scheduleVsAvg = 0
    const qualityVsAvg = 0

    // Health score composite
    const budgetHealth = Math.max(0, 100 - Math.abs(percentUsed - percentComplete) * 2)
    const scheduleHealth = Math.max(0, 100 - (behindMs.length * 15))
    const qualityHealth = inspectionPassRate
    const healthScore = Math.round(budgetHealth * 0.35 + scheduleHealth * 0.35 + qualityHealth * 0.30)

    return {
      projectId,
      projectName: (project as any).name || (project as any).title || projectId,
      healthScore,
      healthTrend: 'stable',
      budget: {
        totalBudget, spent, committed, remaining,
        percentUsed, variance, forecastAtCompletion, contingencyRemaining,
      },
      schedule: {
        plannedStartDate: plannedStart ? new Date(plannedStart).toISOString() : new Date().toISOString(),
        plannedEndDate: plannedEnd ? new Date(plannedEnd).toISOString() : '',
        actualStartDate: (project as any).actualStartDate?.toISOString() || null,
        projectedEndDate: projectedEndDate.toISOString(),
        percentComplete,
        daysAhead: daysAheadCalc,
        milestonesTotal: milestones.length,
        milestonesCompleted: completedMs.length,
        milestonesBehind: behindMs.length,
      },
      quality: {
        inspectionPassRate, openIssues, criticalIssues, resolvedIssues, avgResolutionDays,
      },
      contractors: {
        totalContractors: contractorProjects.length,
        avgReliabilityScore: avgReliability,
        topPerformer,
        atRisk,
      },
      comparisons: { budgetVsAvg, scheduleVsAvg, qualityVsAvg },
    }
  }

  // ==========================================================================
  // CONTRACTOR SCORECARD
  // ==========================================================================

  async getContractorScorecard(contractorId: string): Promise<ContractorScorecard> {
    const contractor = await prisma.contractor.findUniqueOrThrow({
      where: { id: contractorId },
    })

    // Score components from ContractorScore table
    const score = await p.contractorScore?.findUnique?.({ where: { contractorId } })
    const overallScore = score?.overallScore ?? 50
    const confidence = (score?.confidence ?? 'low') as 'low' | 'medium' | 'high'

    // Earnings via escrow transactions
    const escrowTxns = await p.escrowTransaction?.findMany?.({
      where: { recipientId: contractorId, type: 'RELEASE', status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
    }) || []

    const now = new Date()
    const totalEarnings = escrowTxns.reduce((s: number, t: any) => s + toNum(t.amount), 0)
    const last30 = escrowTxns.filter((t: any) => new Date(t.createdAt) >= daysAgo(30))
      .reduce((s: number, t: any) => s + toNum(t.amount), 0)
    const last90 = escrowTxns.filter((t: any) => new Date(t.createdAt) >= daysAgo(90))
      .reduce((s: number, t: any) => s + toNum(t.amount), 0)

    const pendingPayments = (await p.escrowTransaction?.findMany?.({
      where: { recipientId: contractorId, status: 'PENDING' },
    }) || []).reduce((s: number, t: any) => s + toNum(t.amount), 0)

    // Earnings by month (last 12 months)
    const earningsTrend: Array<{ month: string; amount: number }> = []
    for (let i = 11; i >= 0; i--) {
      const start = monthsBack(i)
      const end = new Date(start)
      end.setMonth(end.getMonth() + 1)
      const mKey = monthKey(start)
      const monthEarnings = escrowTxns
        .filter((t: any) => new Date(t.createdAt) >= start && new Date(t.createdAt) < end)
        .reduce((s: number, t: any) => s + toNum(t.amount), 0)
      earningsTrend.push({ month: mKey, amount: monthEarnings })
    }

    // Bids
    const bids = await prisma.bidSubmission.findMany({
      where: { contractorId },
      orderBy: { createdAt: 'desc' },
    })
    const wonBids = bids.filter((b: any) => b.status === 'AWARDED' || b.status === 'ACCEPTED')
    const activeBids = bids.filter((b: any) => b.status === 'SUBMITTED' || b.status === 'UNDER_REVIEW').length
    const winRate = pct(wonBids.length, bids.length || 1)
    const avgBidAmount = bids.length > 0
      ? Math.round(bids.reduce((s, b: any) => s + toNum(b.totalAmount || b.amount || 0), 0) / bids.length)
      : 0

    // Bids by month (last 6 months)
    const bidsByMonth: Array<{ month: string; submitted: number; won: number }> = []
    for (let i = 5; i >= 0; i--) {
      const start = monthsBack(i)
      const end = new Date(start)
      end.setMonth(end.getMonth() + 1)
      const mKey = monthKey(start)
      const submitted = bids.filter((b: any) => new Date(b.createdAt) >= start && new Date(b.createdAt) < end).length
      const won = wonBids.filter((b: any) => new Date(b.createdAt) >= start && new Date(b.createdAt) < end).length
      bidsByMonth.push({ month: mKey, submitted, won })
    }

    // Projects
    const contractorProjects = await p.contractorProject?.findMany?.({
      where: { contractorId },
    }) || []
    const completedProjects = contractorProjects.filter((cp: any) => cp.status === 'COMPLETED')
    const activeProjects = contractorProjects.filter((cp: any) => cp.status === 'ACTIVE' || cp.status === 'IN_PROGRESS').length

    // On-time rate
    const withDates = completedProjects.filter((cp: any) => cp.scheduledEndDate && (cp.completedAt || cp.actualEndDate))
    const onTime = withDates.filter((cp: any) => {
      const scheduled = new Date(cp.scheduledEndDate)
      const actual = new Date(cp.completedAt || cp.actualEndDate)
      return actual <= scheduled
    })
    const onTimeRate = pct(onTime.length, withDates.length || 1)
    const avgDaysEarlyOrLate = withDates.length > 0
      ? Math.round(withDates.reduce((s: number, cp: any) => {
          const scheduled = new Date(cp.scheduledEndDate)
          const actual = new Date(cp.completedAt || cp.actualEndDate)
          return s + (scheduled.getTime() - actual.getTime()) / 86400000
        }, 0) / withDates.length)
      : 0

    // Reviews
    const reviews = await prisma.contractorReview.findMany({
      where: { contractorId },
      orderBy: { createdAt: 'desc' },
    })
    const avgRating = reviews.length > 0
      ? Math.round(reviews.reduce((s, r) => s + toNum(r.rating), 0) / reviews.length * 10) / 10
      : 0
    const ratingDistribution = [0, 0, 0, 0, 0]
    reviews.forEach(r => {
      const rating = Math.round(toNum(r.rating))
      if (rating >= 1 && rating <= 5) ratingDistribution[rating - 1]++
    })
    const recentReviews = reviews.slice(0, 5).map((r: any) => ({
      rating: toNum(r.rating),
      comment: r.comment || r.review || '',
      projectName: r.projectName || 'Project',
      date: new Date(r.createdAt).toISOString(),
    }))

    // Portfolio
    const trades = (contractor as any).trades || []
    const topTrades = trades.map((trade: string) => ({
      trade,
      projectCount: contractorProjects.filter((cp: any) =>
        (cp.tradeCategory || '').toLowerCase().includes(trade.toLowerCase())
      ).length || 1,
      avgScore: overallScore,
    }))

    const totalProjectValue = contractorProjects.reduce(
      (s: number, cp: any) => s + toNum(cp.contractValue || 0), 0
    )

    // Trend
    const previousScore = score?.previousOverallScore || score?.overallScore || 50
    const scoreTrend = trend(overallScore, previousScore)

    return {
      contractorId,
      companyName: (contractor as any).companyName || 'Unknown',
      overallScore,
      confidence,
      trend: scoreTrend,
      components: {
        responsiveness: score?.responsivenessScore ?? 50,
        bidAccuracy: score?.bidAccuracyScore ?? 50,
        scheduleAdherence: score?.scheduleAdherenceScore ?? 50,
        quality: score?.qualityScore ?? 50,
        clientSatisfaction: score?.clientSatisfactionScore ?? 50,
        safety: score?.safetyScore ?? 50,
      },
      earnings: {
        totalEarnings, last30Days: last30, last90Days: last90,
        avgProjectValue: completedProjects.length > 0 ? Math.round(totalProjectValue / completedProjects.length) : 0,
        pendingPayments,
        earningsTrend,
      },
      bids: {
        totalSubmitted: bids.length, totalWon: wonBids.length,
        winRate, avgBidAmount, bidsByMonth, activeBids,
      },
      projects: {
        totalCompleted: completedProjects.length, activeProjects,
        onTimeRate, avgDaysEarlyOrLate,
        avgProjectDuration: 0, // Would need more data
      },
      reviews: { avgRating, totalReviews: reviews.length, ratingDistribution, recentReviews },
      portfolio: {
        topTrades,
        regionsServed: [(contractor as any).state].filter(Boolean),
        totalProjectValue,
      },
    }
  }

  // ==========================================================================
  // PM DASHBOARD ANALYTICS
  // ==========================================================================

  async getPmDashboardAnalytics(pmId: string): Promise<PmDashboardAnalytics> {
    // Active projects for this PM
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { pmId } as any,
          { assignedPmId: pmId } as any,
          { createdById: pmId } as any,
        ],
      },
      include: { milestones: true, budgetItems: true } as any,
    })

    const activeProjects = projects.filter((p: any) => p.status === 'ACTIVE' || p.status === 'IN_PROGRESS')
    const totalBudgetManaged = activeProjects.reduce((s, p: any) => s + toNum(p.budget || 0), 0)

    // Tasks
    const tasks = await p.task?.findMany?.({
      where: { assigneeId: pmId },
      orderBy: { dueDate: 'asc' },
    }) || []
    const openTasks = tasks.filter((t: any) => t.status !== 'COMPLETED' && t.status !== 'DONE').length
    const overdueTasks = tasks.filter((t: any) =>
      t.status !== 'COMPLETED' && t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < new Date()
    ).length
    const upcomingDeadlines = tasks
      .filter((t: any) => t.status !== 'COMPLETED' && t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) >= new Date())
      .slice(0, 10)
      .map((t: any) => ({
        taskName: t.title || t.name || 'Task',
        projectName: t.projectName || 'Project',
        dueDate: new Date(t.dueDate).toISOString(),
        priority: t.priority || 'NORMAL',
      }))

    // PM Score (from @kealee/analytics pm-scoring)
    const pmScoreRecord = await p.pMScore?.findFirst?.({ where: { pmId }, orderBy: { calculatedAt: 'desc' } })
    const pmScore = pmScoreRecord?.overallScore ?? 70

    // On time / on budget
    const completedProjects = projects.filter((p: any) => p.status === 'COMPLETED')
    const onTimeProjects = completedProjects.filter((p: any) => {
      if (!p.endDate || !p.completedAt) return true
      return new Date(p.completedAt) <= new Date(p.endDate)
    })
    const onBudgetProjects = completedProjects.filter((p: any) => {
      const budget = toNum(p.budget)
      const spent = toNum(p.totalSpent || p.actualCost || 0)
      return spent <= budget * 1.05
    })

    // Autonomous actions impact
    const aiActions = await p.autonomousAction?.findMany?.({
      where: {
        createdAt: { gte: daysAgo(30) },
      },
    }) || []
    const approvedActions = aiActions.filter((a: any) => a.decision === 'APPROVED' || a.decision === 'AUTO_APPROVED')
    const hoursRecovered = approvedActions.length * 0.5 // Estimate 30 min per automated action

    const actionsByType = new Map<string, { count: number; hoursSaved: number }>()
    aiActions.forEach((a: any) => {
      const type = a.actionType || 'unknown'
      const existing = actionsByType.get(type) || { count: 0, hoursSaved: 0 }
      existing.count++
      if (a.decision === 'APPROVED' || a.decision === 'AUTO_APPROVED') existing.hoursSaved += 0.5
      actionsByType.set(type, existing)
    })

    // Budget accuracy across projects
    const budgetByProject = activeProjects.map((p: any) => {
      const budget = toNum(p.budget)
      const spent = toNum(p.totalSpent || p.actualCost || 0)
      return {
        projectName: p.name || p.title || 'Project',
        budget,
        spent,
        variance: budget - spent,
      }
    })

    const budgetVariances = budgetByProject.filter(b => b.budget > 0).map(b => (b.budget - b.spent) / b.budget * 100)
    const avgVariance = budgetVariances.length > 0
      ? Math.round(budgetVariances.reduce((s, v) => s + v, 0) / budgetVariances.length * 10) / 10
      : 0

    // Recent decisions
    const decisions = await p.autonomousAction?.findMany?.({
      where: { decision: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }) || []

    return {
      pmId,
      workload: {
        activeProjects: activeProjects.length,
        totalBudgetManaged,
        openTasks,
        overdueTasks,
        upcomingDeadlines,
      },
      performance: {
        pmScore,
        scoreTrend: 'stable',
        projectsOnTime: pct(onTimeProjects.length, completedProjects.length || 1),
        projectsOnBudget: pct(onBudgetProjects.length, completedProjects.length || 1),
        avgClientSatisfaction: 0,
        decisionsThisMonth: aiActions.length,
      },
      automationImpact: {
        tasksAutomated: approvedActions.length,
        hoursRecovered: Math.round(hoursRecovered * 10) / 10,
        decisionsAutomated: approvedActions.length,
        automationByType: Array.from(actionsByType.entries()).map(([type, data]) => ({
          type,
          count: data.count,
          hoursSaved: data.hoursSaved,
        })),
        approvalRate: pct(approvedActions.length, aiActions.length || 1),
      },
      budgetAccuracy: {
        avgVariance,
        projectsUnderBudget: budgetByProject.filter(b => b.variance > 0).length,
        projectsOverBudget: budgetByProject.filter(b => b.variance < 0).length,
        forecastAccuracy: 85, // Placeholder
        budgetByProject,
      },
      recentDecisions: decisions.map((d: any) => ({
        id: d.id,
        type: d.actionType || 'unknown',
        description: d.description || d.reason || '',
        outcome: d.decision || 'PENDING',
        impact: d.impact || '',
        date: new Date(d.createdAt).toISOString(),
      })),
    }
  }

  // ==========================================================================
  // PLATFORM ANALYTICS (Admin)
  // ==========================================================================

  async getPlatformAnalytics(dateRange: DateRange): Promise<PlatformAnalytics> {
    const { start, end } = dateRange
    const dateFilter = { gte: start, lte: end }

    // ── Revenue ──────────────────────────────────────────────
    const subscriptions = await p.subscription?.findMany?.({
      where: { status: 'ACTIVE' },
    }) || []

    const feeTxns = await p.escrowTransaction?.findMany?.({
      where: { type: 'FEE', status: 'COMPLETED', createdAt: dateFilter },
    }) || []

    const totalRevenue = feeTxns.reduce((s: number, t: any) => s + toNum(t.amount), 0)
    const mrr = subscriptions.reduce((s: number, sub: any) => s + toNum(sub.monthlyAmount || sub.price || 0), 0)
    const arr = mrr * 12

    // Revenue by month
    const revenueByMonth: Array<{ month: string; revenue: number; fees: number }> = []
    for (let i = 11; i >= 0; i--) {
      const mStart = monthsBack(i)
      const mEnd = new Date(mStart)
      mEnd.setMonth(mEnd.getMonth() + 1)
      const mKey = monthKey(mStart)
      const monthRevenue = feeTxns
        .filter((t: any) => new Date(t.createdAt) >= mStart && new Date(t.createdAt) < mEnd)
        .reduce((s: number, t: any) => s + toNum(t.amount), 0)
      revenueByMonth.push({ month: mKey, revenue: monthRevenue, fees: monthRevenue * 0.03 })
    }

    // Previous period revenue for growth rate
    const periodDays = Math.ceil((end.getTime() - start.getTime()) / 86400000)
    const prevStart = new Date(start.getTime() - periodDays * 86400000)
    const prevFeeTxns = await p.escrowTransaction?.findMany?.({
      where: { type: 'FEE', status: 'COMPLETED', createdAt: { gte: prevStart, lt: start } },
    }) || []
    const prevRevenue = prevFeeTxns.reduce((s: number, t: any) => s + toNum(t.amount), 0)
    const growthRate = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 1000) / 10 : 0

    const totalUsers = await prisma.user.count()
    const avgRevenuePerUser = totalUsers > 0 ? Math.round(totalRevenue / totalUsers) : 0

    // ── Growth ───────────────────────────────────────────────
    const newUsers = await prisma.user.count({ where: { createdAt: dateFilter } })
    const prevNewUsers = await prisma.user.count({ where: { createdAt: { gte: prevStart, lt: start } } })
    const userGrowthRate = prevNewUsers > 0 ? Math.round(((newUsers - prevNewUsers) / prevNewUsers) * 1000) / 10 : 0

    // Users by role
    const allUsers = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    })
    const usersByRole = allUsers.map((u: any) => ({ role: u.role || 'UNKNOWN', count: u._count }))

    // Users by month
    const usersByMonth: Array<{ month: string; newUsers: number; churned: number }> = []
    for (let i = 11; i >= 0; i--) {
      const mStart = monthsBack(i)
      const mEnd = new Date(mStart)
      mEnd.setMonth(mEnd.getMonth() + 1)
      const mKey = monthKey(mStart)
      const monthNewUsers = await prisma.user.count({ where: { createdAt: { gte: mStart, lt: mEnd } } })
      usersByMonth.push({ month: mKey, newUsers: monthNewUsers, churned: 0 })
    }

    // ── Marketplace ──────────────────────────────────────────
    const totalContractors = await prisma.contractor.count()
    const activeContractors = await prisma.contractor.count({ where: { status: 'ACTIVE' } })
    const totalBidsSubmitted = await prisma.bidSubmission.count({ where: { createdAt: dateFilter } })

    const bidPackageCount = await p.bidPackage?.count?.({ where: { createdAt: dateFilter } }) || 1
    const avgBidsPerProject = Math.round(totalBidsSubmitted / Math.max(1, bidPackageCount) * 10) / 10

    const awardedBids = await prisma.bidSubmission.count({
      where: { status: 'AWARDED', createdAt: dateFilter },
    })
    const matchRate = pct(awardedBids, totalBidsSubmitted || 1)

    const contractorScores = await p.contractorScore?.findMany?.({
      orderBy: { overallScore: 'desc' },
      take: 100,
    }) || []
    const avgContractorScore = contractorScores.length > 0
      ? Math.round(contractorScores.reduce((s: number, c: any) => s + c.overallScore, 0) / contractorScores.length)
      : 50

    // Contractors by trade
    const allContractors = await prisma.contractor.findMany({ select: { trades: true } as any })
    const tradeMap = new Map<string, number>()
    allContractors.forEach((c: any) => {
      const trades = c.trades || []
      trades.forEach((t: string) => tradeMap.set(t, (tradeMap.get(t) || 0) + 1))
    })
    const contractorsByTrade = Array.from(tradeMap.entries())
      .map(([trade, count]) => ({ trade, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const topContractors = contractorScores.slice(0, 5).map((cs: any) => ({
      name: cs.contractorId.substring(0, 8),
      score: cs.overallScore,
      projects: cs.projectsCompleted || 0,
    }))

    // ── Financial ────────────────────────────────────────────
    const escrowAgreements = await p.escrowAgreement?.findMany?.({
      where: { createdAt: dateFilter },
    }) || []
    const totalEscrowVolume = escrowAgreements.reduce((s: number, e: any) => s + toNum(e.totalAmount || e.amount), 0)
    const avgEscrowAmount = escrowAgreements.length > 0 ? Math.round(totalEscrowVolume / escrowAgreements.length) : 0

    const pendingReleases = await p.escrowTransaction?.count?.({
      where: { type: 'RELEASE', status: 'PENDING' },
    }) || 0

    const disputes = await p.dispute?.findMany?.({ where: { createdAt: dateFilter } }) || []
    const disputeRate = pct(disputes.length, escrowAgreements.length || 1)

    const processingFees = feeTxns.reduce((s: number, t: any) => s + toNum(t.amount) * 0.03, 0)

    // Cash flow projection (last 6 months)
    const cashFlowProjection: Array<{ date: string; inflow: number; outflow: number; balance: number }> = []
    let runningBalance = 0
    for (let i = 5; i >= 0; i--) {
      const mStart = monthsBack(i)
      const mEnd = new Date(mStart)
      mEnd.setMonth(mEnd.getMonth() + 1)
      const mKey = monthKey(mStart)

      const deposits = (await p.escrowTransaction?.findMany?.({
        where: { type: 'DEPOSIT', status: 'COMPLETED', createdAt: { gte: mStart, lt: mEnd } },
      }) || []).reduce((s: number, t: any) => s + toNum(t.amount), 0)

      const releases = (await p.escrowTransaction?.findMany?.({
        where: { type: 'RELEASE', status: 'COMPLETED', createdAt: { gte: mStart, lt: mEnd } },
      }) || []).reduce((s: number, t: any) => s + toNum(t.amount), 0)

      runningBalance += deposits - releases
      cashFlowProjection.push({ date: mKey, inflow: deposits, outflow: releases, balance: runningBalance })
    }

    // ── AI / Automation ──────────────────────────────────────
    const allAiActions = await p.autonomousAction?.findMany?.({
      where: { createdAt: dateFilter },
    }) || []
    const totalAutonomousActions = await p.autonomousAction?.count?.() || 0
    const approvedAi = allAiActions.filter((a: any) => a.decision === 'APPROVED' || a.decision === 'AUTO_APPROVED')
    const aiApprovalRate = pct(approvedAi.length, allAiActions.length || 1)
    const aiHoursRecovered = approvedAi.length * 0.5

    const aiByTypeMap = new Map<string, { count: number; approved: number }>()
    allAiActions.forEach((a: any) => {
      const type = a.actionType || 'unknown'
      const existing = aiByTypeMap.get(type) || { count: 0, approved: 0 }
      existing.count++
      if (a.decision === 'APPROVED' || a.decision === 'AUTO_APPROVED') existing.approved++
      aiByTypeMap.set(type, existing)
    })

    const actionsByType = Array.from(aiByTypeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      approvalRate: pct(data.approved, data.count),
    }))

    // Confidence distribution
    const confidenceRanges = [
      { range: '0-20%', min: 0, max: 20 },
      { range: '20-40%', min: 20, max: 40 },
      { range: '40-60%', min: 40, max: 60 },
      { range: '60-80%', min: 60, max: 80 },
      { range: '80-100%', min: 80, max: 100 },
    ]
    const confidenceDistribution = confidenceRanges.map(({ range, min, max }) => ({
      range,
      count: allAiActions.filter((a: any) => {
        const conf = toNum(a.confidence) * 100
        return conf >= min && conf < max
      }).length,
    }))

    // ── Operations ───────────────────────────────────────────
    const totalProjects = await prisma.project.count()
    const activeProjectsCount = await prisma.project.count({ where: { status: 'ACTIVE' } })
    const completedProjectsCount = await prisma.project.count({ where: { status: 'COMPLETED' } })

    // Projects by status
    const projectsByStatusRaw = await prisma.project.groupBy({
      by: ['status'],
      _count: true,
    })
    const projectsByStatus = projectsByStatusRaw.map((p: any) => ({
      status: p.status || 'UNKNOWN',
      count: p._count,
    }))

    return {
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      revenue: {
        totalRevenue, mrr, arr, growthRate, revenueByMonth,
        revenueByPlan: [],
        avgRevenuePerUser,
      },
      growth: {
        totalUsers, newUsersThisPeriod: newUsers, userGrowthRate,
        usersByRole, usersByMonth,
        activationRate: 0, churnRate: 0, retentionDay30: 0,
      },
      marketplace: {
        totalContractors, activeContractors, totalBidsSubmitted,
        avgBidsPerProject, matchRate, avgContractorScore,
        contractorsByTrade, topContractors,
      },
      financial: {
        totalEscrowVolume, avgEscrowAmount, pendingReleases,
        disputeRate, avgDisputeResolutionDays: 0, processingFees,
        cashFlowProjection,
      },
      ai: {
        totalAutonomousActions, actionsThisPeriod: allAiActions.length,
        approvalRate: aiApprovalRate, hoursRecovered: Math.round(aiHoursRecovered * 10) / 10,
        actionsByType, confidenceDistribution,
      },
      operations: {
        totalProjects, activeProjects: activeProjectsCount,
        completedProjects: completedProjectsCount,
        avgProjectDuration: 0,
        onTimeCompletionRate: 0, avgBudgetVariance: 0,
        projectsByStatus,
        topPerformingPMs: [],
      },
    }
  }

  // ==========================================================================
  // SNAPSHOT MANAGEMENT
  // ==========================================================================

  /**
   * Save analytics to AnalyticsSnapshot for caching/cron
   */
  async saveSnapshot(
    snapshotType: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    metrics: any,
    trends?: any,
    forecasts?: any,
  ): Promise<void> {
    const startTime = Date.now()

    await p.analyticsSnapshot.create({
      data: {
        snapshotType,
        metrics,
        trends: trends || null,
        forecasts: forecasts || null,
        calculationTime: Date.now() - startTime,
        dataPoints: typeof metrics === 'object' ? Object.keys(metrics).length : 0,
      },
    })
  }

  /**
   * Get latest cached snapshot
   */
  async getLatestSnapshot(snapshotType: string): Promise<any | null> {
    const snapshot = await p.analyticsSnapshot?.findFirst?.({
      where: { snapshotType },
      orderBy: { snapshotDate: 'desc' },
    })
    return snapshot || null
  }
}

export const analyticsService = new AnalyticsService()
