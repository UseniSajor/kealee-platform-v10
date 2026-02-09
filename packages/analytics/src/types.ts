/**
 * Analytics Types
 * Shared interfaces for analytics service and dashboards
 */

// ============================================================================
// PROJECT BENCHMARK
// ============================================================================

export interface ProjectBenchmark {
  projectId: string
  projectName: string

  healthScore: number // 0-100 overall health
  healthTrend: 'improving' | 'stable' | 'declining'

  budget: {
    totalBudget: number
    spent: number
    committed: number
    remaining: number
    percentUsed: number
    variance: number // positive = under budget
    forecastAtCompletion: number
    contingencyRemaining: number
  }

  schedule: {
    plannedStartDate: string
    plannedEndDate: string
    actualStartDate: string | null
    projectedEndDate: string
    percentComplete: number
    daysAhead: number // negative = behind schedule
    milestonesTotal: number
    milestonesCompleted: number
    milestonesBehind: number
  }

  quality: {
    inspectionPassRate: number
    openIssues: number
    criticalIssues: number
    resolvedIssues: number
    avgResolutionDays: number
  }

  contractors: {
    totalContractors: number
    avgReliabilityScore: number
    topPerformer: { name: string; score: number } | null
    atRisk: { name: string; score: number; issues: string[] }[]
  }

  comparisons: {
    budgetVsAvg: number // percent better/worse than similar projects
    scheduleVsAvg: number
    qualityVsAvg: number
  }
}

// ============================================================================
// CONTRACTOR SCORECARD
// ============================================================================

export interface ContractorScorecard {
  contractorId: string
  companyName: string

  overallScore: number
  confidence: 'low' | 'medium' | 'high'
  trend: 'improving' | 'stable' | 'declining'

  components: {
    responsiveness: number
    bidAccuracy: number
    scheduleAdherence: number
    quality: number
    clientSatisfaction: number
    safety: number
  }

  earnings: {
    totalEarnings: number
    last30Days: number
    last90Days: number
    avgProjectValue: number
    pendingPayments: number
    earningsTrend: Array<{ month: string; amount: number }>
  }

  bids: {
    totalSubmitted: number
    totalWon: number
    winRate: number
    avgBidAmount: number
    bidsByMonth: Array<{ month: string; submitted: number; won: number }>
    activeBids: number
  }

  projects: {
    totalCompleted: number
    activeProjects: number
    onTimeRate: number
    avgDaysEarlyOrLate: number
    avgProjectDuration: number
  }

  reviews: {
    avgRating: number
    totalReviews: number
    ratingDistribution: number[] // [1-star, 2-star, 3-star, 4-star, 5-star]
    recentReviews: Array<{
      rating: number
      comment: string
      projectName: string
      date: string
    }>
  }

  portfolio: {
    topTrades: Array<{ trade: string; projectCount: number; avgScore: number }>
    regionsServed: string[]
    totalProjectValue: number
  }
}

// ============================================================================
// PM DASHBOARD ANALYTICS
// ============================================================================

export interface PmDashboardAnalytics {
  pmId: string

  workload: {
    activeProjects: number
    totalBudgetManaged: number
    openTasks: number
    overdueTasks: number
    upcomingDeadlines: Array<{
      taskName: string
      projectName: string
      dueDate: string
      priority: string
    }>
  }

  performance: {
    pmScore: number
    scoreTrend: 'improving' | 'stable' | 'declining'
    projectsOnTime: number
    projectsOnBudget: number
    avgClientSatisfaction: number
    decisionsThisMonth: number
  }

  automationImpact: {
    tasksAutomated: number
    hoursRecovered: number
    decisionsAutomated: number
    automationByType: Array<{ type: string; count: number; hoursSaved: number }>
    approvalRate: number
  }

  budgetAccuracy: {
    avgVariance: number
    projectsUnderBudget: number
    projectsOverBudget: number
    forecastAccuracy: number
    budgetByProject: Array<{
      projectName: string
      budget: number
      spent: number
      variance: number
    }>
  }

  recentDecisions: Array<{
    id: string
    type: string
    description: string
    outcome: string
    impact: string
    date: string
  }>
}

// ============================================================================
// PLATFORM ANALYTICS (Admin)
// ============================================================================

export interface PlatformAnalytics {
  dateRange: { start: string; end: string }

  revenue: {
    totalRevenue: number
    mrr: number
    arr: number
    growthRate: number
    revenueByMonth: Array<{ month: string; revenue: number; fees: number }>
    revenueByPlan: Array<{ plan: string; revenue: number; subscribers: number }>
    avgRevenuePerUser: number
  }

  growth: {
    totalUsers: number
    newUsersThisPeriod: number
    userGrowthRate: number
    usersByRole: Array<{ role: string; count: number }>
    usersByMonth: Array<{ month: string; newUsers: number; churned: number }>
    activationRate: number
    churnRate: number
    retentionDay30: number
  }

  marketplace: {
    totalContractors: number
    activeContractors: number
    totalBidsSubmitted: number
    avgBidsPerProject: number
    matchRate: number
    avgContractorScore: number
    contractorsByTrade: Array<{ trade: string; count: number }>
    topContractors: Array<{ name: string; score: number; projects: number }>
  }

  financial: {
    totalEscrowVolume: number
    avgEscrowAmount: number
    pendingReleases: number
    disputeRate: number
    avgDisputeResolutionDays: number
    processingFees: number
    cashFlowProjection: Array<{ date: string; inflow: number; outflow: number; balance: number }>
  }

  ai: {
    totalAutonomousActions: number
    actionsThisPeriod: number
    approvalRate: number
    hoursRecovered: number
    actionsByType: Array<{ type: string; count: number; approvalRate: number }>
    confidenceDistribution: Array<{ range: string; count: number }>
  }

  operations: {
    totalProjects: number
    activeProjects: number
    completedProjects: number
    avgProjectDuration: number
    onTimeCompletionRate: number
    avgBudgetVariance: number
    projectsByStatus: Array<{ status: string; count: number }>
    topPerformingPMs: Array<{ name: string; score: number; projectCount: number }>
  }
}

// ============================================================================
// SHARED HELPERS
// ============================================================================

export interface DateRange {
  start: Date
  end: Date
}

export interface TrendPoint {
  date: string
  value: number
}

export type TrendDirection = 'improving' | 'stable' | 'declining'
