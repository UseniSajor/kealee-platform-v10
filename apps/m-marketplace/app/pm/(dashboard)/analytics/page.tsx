"use client"

import { useEffect, useState, useCallback } from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorkloadOverview {
  activeProjects: number
  totalBudgetManaged: number
  openTasks: number
  overdueTasks: number
}

interface PerformanceScore {
  score: number
  trend: number // positive = improving, negative = declining
  projectsOnTimePercent: number
  projectsOnBudgetPercent: number
  decisionsThisMonth: number
}

interface AutomationBreakdown {
  type: string
  count: number
  maxCount: number
}

interface AutomationImpact {
  tasksAutomated: number
  hoursRecovered: number
  decisionsAutomated: number
  approvalRate: number
  breakdown: AutomationBreakdown[]
}

interface ProjectBudgetRow {
  projectId: string
  projectName: string
  budget: number
  spent: number
  variance: number // positive = under budget, negative = over
}

interface BudgetAccuracy {
  projects: ProjectBudgetRow[]
  avgVariance: number
}

interface UpcomingDeadline {
  id: string
  taskName: string
  projectName: string
  dueDate: string
  priority: "HIGH" | "MEDIUM" | "NORMAL"
}

interface DashboardData {
  workload: WorkloadOverview
  performance: PerformanceScore
  automation: AutomationImpact
  budgetAccuracy: BudgetAccuracy
  upcomingDeadlines: UpcomingDeadline[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"

function formatCurrency(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${value < 0 ? "-" : ""}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${value < 0 ? "-" : ""}$${(abs / 1_000).toFixed(1)}K`
  return `${value < 0 ? "-" : ""}$${abs.toFixed(0)}`
}

function formatVariance(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${value >= 0 ? "+" : "-"}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${value >= 0 ? "+" : "-"}$${(abs / 1_000).toFixed(1)}K`
  return `${value >= 0 ? "+" : "-"}$${abs.toFixed(0)}`
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffMs = startOfTarget.getTime() - startOfToday.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === -1) return "Yesterday"
  if (diffDays === 1) return "Tomorrow"
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function getPmId(): string {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("kealee-pm-id")
    if (stored) return stored
  }
  return "current-user"
}

// ---------------------------------------------------------------------------
// Fallback / demo data (used when API is unavailable)
// ---------------------------------------------------------------------------

function getDemoData(): DashboardData {
  return {
    workload: {
      activeProjects: 8,
      totalBudgetManaged: 4_250_000,
      openTasks: 47,
      overdueTasks: 3,
    },
    performance: {
      score: 87,
      trend: 4,
      projectsOnTimePercent: 82,
      projectsOnBudgetPercent: 91,
      decisionsThisMonth: 34,
    },
    automation: {
      tasksAutomated: 156,
      hoursRecovered: 42,
      decisionsAutomated: 89,
      approvalRate: 94,
      breakdown: [
        { type: "Change Orders", count: 38, maxCount: 50 },
        { type: "Budget Alerts", count: 45, maxCount: 50 },
        { type: "Schedule Updates", count: 32, maxCount: 50 },
        { type: "QA Inspections", count: 22, maxCount: 50 },
        { type: "Report Generation", count: 19, maxCount: 50 },
      ],
    },
    budgetAccuracy: {
      projects: [
        { projectId: "p1", projectName: "Riverside Renovation", budget: 850_000, spent: 790_000, variance: 60_000 },
        { projectId: "p2", projectName: "Downtown Office Build", budget: 1_200_000, spent: 1_280_000, variance: -80_000 },
        { projectId: "p3", projectName: "Harbor View Condos", budget: 950_000, spent: 920_000, variance: 30_000 },
        { projectId: "p4", projectName: "Elm Street Remodel", budget: 420_000, spent: 405_000, variance: 15_000 },
        { projectId: "p5", projectName: "Parkside Commons", budget: 680_000, spent: 710_000, variance: -30_000 },
      ],
      avgVariance: -1_000,
    },
    upcomingDeadlines: [
      { id: "d1", taskName: "Final inspection walkthrough", projectName: "Riverside Renovation", dueDate: new Date(Date.now() + 86400000).toISOString(), priority: "HIGH" },
      { id: "d2", taskName: "Submit permit amendment", projectName: "Downtown Office Build", dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), priority: "HIGH" },
      { id: "d3", taskName: "Review subcontractor bids", projectName: "Harbor View Condos", dueDate: new Date(Date.now() + 86400000 * 3).toISOString(), priority: "MEDIUM" },
      { id: "d4", taskName: "Approve flooring selection", projectName: "Elm Street Remodel", dueDate: new Date(Date.now() + 86400000 * 4).toISOString(), priority: "NORMAL" },
      { id: "d5", taskName: "Schedule HVAC rough-in", projectName: "Parkside Commons", dueDate: new Date(Date.now() + 86400000 * 5).toISOString(), priority: "MEDIUM" },
      { id: "d6", taskName: "Budget reconciliation review", projectName: "Downtown Office Build", dueDate: new Date(Date.now() + 86400000 * 7).toISOString(), priority: "NORMAL" },
    ],
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LoadingSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p className="text-sm text-gray-500">Loading analytics...</p>
      </div>
    </div>
  )
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <div className="mb-2 text-lg font-semibold text-red-700">Failed to load analytics</div>
      <p className="mb-4 text-sm text-red-600">{message}</p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
      >
        Try Again
      </button>
    </div>
  )
}

function StatCard({
  label,
  value,
  alert,
  subtext,
}: {
  label: string
  value: string | number
  alert?: boolean
  subtext?: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${alert ? "text-red-600" : "text-gray-900"}`}>
        {value}
      </p>
      {subtext && (
        <p className={`mt-1 text-xs ${alert ? "text-red-500" : "text-gray-400"}`}>{subtext}</p>
      )}
    </div>
  )
}

function TrendBadge({ value }: { value: number }) {
  const isPositive = value >= 0
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      {isPositive ? (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      ) : (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      )}
      {isPositive ? "+" : ""}
      {value} pts
    </span>
  )
}

function PriorityBadge({ priority }: { priority: "HIGH" | "MEDIUM" | "NORMAL" }) {
  const styles: Record<string, string> = {
    HIGH: "bg-red-100 text-red-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    NORMAL: "bg-blue-100 text-blue-700",
  }
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[priority]}`}>
      {priority}
    </span>
  )
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

function ScoreRing({ score }: { score: number }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color =
    score >= 80 ? "text-green-500" : score >= 60 ? "text-yellow-500" : "text-red-500"
  const strokeColor =
    score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444"

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-bold ${color}`}>{score}</span>
        <span className="text-xs text-gray-400">/ 100</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section components
// ---------------------------------------------------------------------------

function WorkloadSection({ data }: { data: WorkloadOverview }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Workload Overview</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Projects" value={data.activeProjects} />
        <StatCard label="Total Budget Managed" value={formatCurrency(data.totalBudgetManaged)} />
        <StatCard label="Open Tasks" value={data.openTasks} />
        <StatCard
          label="Overdue Tasks"
          value={data.overdueTasks}
          alert={data.overdueTasks > 0}
          subtext={data.overdueTasks > 0 ? "Requires attention" : "All on track"}
        />
      </div>
    </section>
  )
}

function PerformanceSection({ data }: { data: PerformanceScore }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Performance Score</h2>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          {/* Score ring */}
          <div className="flex flex-col items-center gap-2">
            <ScoreRing score={data.score} />
            <TrendBadge value={data.trend} />
            <span className="text-xs text-gray-400">vs last month</span>
          </div>

          {/* Metrics grid */}
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-sm text-gray-500">Projects On Time</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{data.projectsOnTimePercent}%</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-sm text-gray-500">Projects On Budget</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{data.projectsOnBudgetPercent}%</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-sm text-gray-500">Decisions This Month</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{data.decisionsThisMonth}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function AutomationSection({ data }: { data: AutomationImpact }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Automation Impact</h2>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Top metrics */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-lg bg-blue-50 p-4 text-center">
            <p className="text-sm text-blue-600">Tasks Automated</p>
            <p className="mt-1 text-2xl font-bold text-blue-700">{data.tasksAutomated}</p>
          </div>
          <div className="rounded-lg bg-green-50 p-4 text-center">
            <div className="flex items-center justify-center gap-1.5">
              {/* Clock icon */}
              <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" d="M12 6v6l4 2" />
              </svg>
              <p className="text-sm text-green-600">Hours Recovered</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-green-700">{data.hoursRecovered}h</p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4 text-center">
            <p className="text-sm text-purple-600">Decisions Automated</p>
            <p className="mt-1 text-2xl font-bold text-purple-700">{data.decisionsAutomated}</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-4 text-center">
            <p className="text-sm text-amber-600">Approval Rate</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{data.approvalRate}%</p>
          </div>
        </div>

        {/* Breakdown by type */}
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Breakdown by Type</h3>
        <div className="space-y-3">
          {data.breakdown.map((item) => (
            <div key={item.type} className="flex items-center gap-3">
              <span className="w-36 shrink-0 text-sm text-gray-600">{item.type}</span>
              <div className="flex-1">
                <MiniBar value={item.count} max={item.maxCount} />
              </div>
              <span className="w-10 text-right text-sm font-medium text-gray-700">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function BudgetAccuracySection({ data }: { data: BudgetAccuracy }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Budget Accuracy</h2>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-6 py-3 font-semibold text-gray-600">Project</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-600">Budget</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-600">Spent</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-600">Variance</th>
              </tr>
            </thead>
            <tbody>
              {data.projects.map((row) => (
                <tr key={row.projectId} className="border-b border-gray-50 transition-colors hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{row.projectName}</td>
                  <td className="px-6 py-3 text-right text-gray-700">{formatCurrency(row.budget)}</td>
                  <td className="px-6 py-3 text-right text-gray-700">{formatCurrency(row.spent)}</td>
                  <td
                    className={`px-6 py-3 text-right font-semibold ${
                      row.variance >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatVariance(row.variance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 bg-gray-50">
                <td className="px-6 py-3 font-semibold text-gray-700" colSpan={3}>
                  Average Variance
                </td>
                <td
                  className={`px-6 py-3 text-right font-bold ${
                    data.avgVariance >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatVariance(data.avgVariance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  )
}

function DeadlinesSection({ deadlines }: { deadlines: UpcomingDeadline[] }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Upcoming Deadlines</h2>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {deadlines.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400">No upcoming deadlines</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {deadlines.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{d.taskName}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{d.projectName}</p>
                </div>
                <div className="ml-4 flex shrink-0 items-center gap-3">
                  <span className="text-sm text-gray-500">{formatRelativeDate(d.dueDate)}</span>
                  <PriorityBadge priority={d.priority} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function PMAnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const pmId = getPmId()
      const res = await fetch(`${API_BASE}/pm/analytics/pm/dashboard/pm/${pmId}`, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`)
      }

      const json = await res.json()
      // Backend returns { success, data: { workload, performance, automationImpact, budgetAccuracy } }
      const raw = json.data || json

      // Map backend response shape to frontend DashboardData
      const mapped: DashboardData = {
        workload: {
          activeProjects: raw.workload?.activeProjects ?? 0,
          totalBudgetManaged: raw.workload?.totalBudgetManaged ?? 0,
          openTasks: raw.workload?.openTasks ?? 0,
          overdueTasks: raw.workload?.overdueTasks ?? 0,
        },
        performance: {
          score: raw.performance?.pmScore ?? raw.performance?.score ?? 0,
          trend: typeof raw.performance?.scoreTrend === 'number'
            ? raw.performance.scoreTrend
            : raw.performance?.trend ?? 0,
          projectsOnTimePercent: raw.performance?.projectsOnTime ?? raw.performance?.projectsOnTimePercent ?? 0,
          projectsOnBudgetPercent: raw.performance?.projectsOnBudget ?? raw.performance?.projectsOnBudgetPercent ?? 0,
          decisionsThisMonth: raw.performance?.decisionsThisMonth ?? 0,
        },
        automation: {
          tasksAutomated: raw.automationImpact?.tasksAutomated ?? raw.automation?.tasksAutomated ?? 0,
          hoursRecovered: raw.automationImpact?.hoursRecovered ?? raw.automation?.hoursRecovered ?? 0,
          decisionsAutomated: raw.automationImpact?.decisionsAutomated ?? raw.automation?.decisionsAutomated ?? 0,
          approvalRate: raw.automationImpact?.approvalRate ?? raw.automation?.approvalRate ?? 0,
          breakdown: raw.automationImpact?.breakdown ?? raw.automation?.breakdown ?? [],
        },
        budgetAccuracy: {
          projects: (raw.budgetAccuracy?.budgetByProject || raw.budgetAccuracy?.projects || []).map((p: any) => ({
            projectId: p.projectId || p.projectName || '',
            projectName: p.projectName || '',
            budget: p.budget ?? 0,
            spent: p.spent ?? 0,
            variance: p.variance ?? 0,
          })),
          avgVariance: raw.budgetAccuracy?.avgVariance ?? 0,
        },
        upcomingDeadlines: raw.upcomingDeadlines || [],
      }

      setData(mapped)
    } catch (err) {
      console.warn("Analytics API unavailable:", err)
      setError("Analytics data is not yet available. Connect a project to see real metrics.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) return <LoadingSpinner />

  if (error && !data) {
    return <ErrorBanner message={error} onRetry={fetchData} />
  }

  if (!data) return null

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PM Workspace Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Performance metrics, automation insights, and project health at a glance.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* 1. Workload Overview */}
      <WorkloadSection data={data.workload} />

      {/* 2. Performance Score */}
      <PerformanceSection data={data.performance} />

      {/* 3. Automation Impact */}
      <AutomationSection data={data.automation} />

      {/* 4. Budget Accuracy */}
      <BudgetAccuracySection data={data.budgetAccuracy} />

      {/* 5. Upcoming Deadlines */}
      <DeadlinesSection deadlines={data.upcomingDeadlines} />
    </div>
  )
}
