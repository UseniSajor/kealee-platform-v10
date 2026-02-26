'use client'

import React, { useState, useEffect } from 'react'

// ============================================================================
// TYPES
// ============================================================================

interface ProjectBenchmarkData {
  projectId: string
  projectName: string
  healthScore: number
  healthTrend: string
  budget: {
    totalBudget: number
    spent: number
    committed: number
    remaining: number
    percentUsed: number
    variance: number
    forecastAtCompletion: number
  }
  schedule: {
    percentComplete: number
    milestonesTotal: number
    milestonesCompleted: number
    milestonesBehind: number
    daysAhead: number
  }
  quality: {
    inspectionPassRate: number
    openIssues: number
    criticalIssues: number
  }
  contractors: {
    totalContractors: number
    avgReliabilityScore: number
  }
}

interface ProjectSummary {
  id: string
  name: string
  status: string
}

// ============================================================================
// HELPERS
// ============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount.toLocaleString()}`
}

function healthColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

function healthBg(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

function healthLabel(score: number): string {
  if (score >= 80) return 'Healthy'
  if (score >= 60) return 'Needs Attention'
  return 'At Risk'
}

// ============================================================================
// GAUGE COMPONENT — circular health score
// ============================================================================

function HealthGauge({ score, size = 160 }: { score: number; size?: number }) {
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference * 0.75
  const rotation = -135

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
          strokeLinecap="round"
        />
        {/* Score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444'}
          strokeWidth="12"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
        {/* Score text */}
        <text
          x={size / 2}
          y={size / 2 - 5}
          textAnchor="middle"
          className="text-3xl font-bold fill-gray-900"
          style={{ fontSize: size * 0.22 }}
        >
          {score}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 20}
          textAnchor="middle"
          className="text-sm fill-gray-500"
          style={{ fontSize: size * 0.09 }}
        >
          {healthLabel(score)}
        </text>
      </svg>
    </div>
  )
}

// ============================================================================
// PROGRESS BAR COMPONENT
// ============================================================================

function ProgressBar({ value, max, label, color = 'bg-blue-600', showAmount = false }: {
  value: number; max: number; label: string; color?: string; showAmount?: boolean
}) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">
          {showAmount ? `${formatCurrency(value)} / ${formatCurrency(max)}` : `${percent.toFixed(0)}%`}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all duration-700`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

function StatCard({ title, value, subtitle, icon, color = 'bg-blue-50 text-blue-700' }: {
  title: string; value: string | number; subtitle?: string; icon: string; color?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <span className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-lg`}>{icon}</span>
        <span className="text-sm text-gray-500">{title}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ClientAnalyticsPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [benchmark, setBenchmark] = useState<ProjectBenchmarkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user's projects
  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch(`${API_BASE}/projects?limit=50`, { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          const list = json.data || json.projects || json || []
          setProjects(Array.isArray(list) ? list : [])
          if (list.length > 0) setSelectedProjectId(list[0].id)
        }
      } catch (err) {
        console.error('Failed to load projects:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProjects()
  }, [])

  // Fetch benchmark for selected project
  useEffect(() => {
    if (!selectedProjectId) return
    setLoading(true)
    setError(null)

    async function loadBenchmark() {
      try {
        const res = await fetch(`${API_BASE}/analytics/dashboard/project/${selectedProjectId}`, {
          credentials: 'include',
        })
        if (!res.ok) throw new Error('Failed to load project analytics')
        const json = await res.json()
        setBenchmark(json.data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadBenchmark()
  }, [selectedProjectId])

  if (loading && !benchmark) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
            <p className="mt-4 text-gray-500">Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Track project health, budget, schedule, and quality metrics</p>
        </div>
        {projects.length > 1 && (
          <select
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || p.id}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-6">{error}</div>
      )}

      {benchmark && (
        <div className="space-y-6">
          {/* Health Score & Key Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Health Gauge */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col items-center justify-center">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Project Health Score</h3>
              <HealthGauge score={benchmark.healthScore} />
              <div className="mt-4 text-xs text-gray-400">
                {benchmark.projectName}
              </div>
            </div>

            {/* Key Stats */}
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                title="Budget Used"
                value={`${benchmark.budget.percentUsed.toFixed(0)}%`}
                subtitle={`${formatCurrency(benchmark.budget.spent)} of ${formatCurrency(benchmark.budget.totalBudget)}`}
                icon="$"
                color="bg-green-50 text-green-700"
              />
              <StatCard
                title="Complete"
                value={`${benchmark.schedule.percentComplete.toFixed(0)}%`}
                subtitle={`${benchmark.schedule.milestonesCompleted} of ${benchmark.schedule.milestonesTotal} milestones`}
                icon="&#9776;"
                color="bg-blue-50 text-blue-700"
              />
              <StatCard
                title="QA Pass Rate"
                value={`${benchmark.quality.inspectionPassRate.toFixed(0)}%`}
                subtitle={`${benchmark.quality.openIssues} open issues`}
                icon="&#10003;"
                color={benchmark.quality.inspectionPassRate >= 80 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}
              />
              <StatCard
                title="Contractors"
                value={benchmark.contractors.totalContractors}
                subtitle={`Avg score: ${benchmark.contractors.avgReliabilityScore}`}
                icon="&#128119;"
                color="bg-purple-50 text-purple-700"
              />
            </div>
          </div>

          {/* Budget Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Tracker</h3>
              <div className="space-y-4">
                <ProgressBar
                  value={benchmark.budget.spent}
                  max={benchmark.budget.totalBudget}
                  label="Spent"
                  color="bg-blue-600"
                  showAmount
                />
                <ProgressBar
                  value={benchmark.budget.committed}
                  max={benchmark.budget.totalBudget}
                  label="Committed"
                  color="bg-yellow-500"
                  showAmount
                />
                <ProgressBar
                  value={benchmark.budget.remaining}
                  max={benchmark.budget.totalBudget}
                  label="Remaining"
                  color="bg-green-500"
                  showAmount
                />
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Budget Variance</div>
                  <div className={`text-lg font-bold ${benchmark.budget.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {benchmark.budget.variance >= 0 ? '+' : ''}{formatCurrency(benchmark.budget.variance)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Forecast at Completion</div>
                  <div className="text-lg font-bold text-gray-900">
                    {formatCurrency(benchmark.budget.forecastAtCompletion)}
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Milestone Progress</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Overall Progress</span>
                  <span className="text-sm font-medium">{benchmark.schedule.percentComplete.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-700"
                    style={{ width: `${benchmark.schedule.percentComplete}%` }}
                  />
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{benchmark.schedule.milestonesCompleted}</div>
                  <div className="text-xs text-green-600 mt-1">Completed</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">
                    {benchmark.schedule.milestonesTotal - benchmark.schedule.milestonesCompleted - benchmark.schedule.milestonesBehind}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">On Track</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">{benchmark.schedule.milestonesBehind}</div>
                  <div className="text-xs text-red-600 mt-1">Behind</div>
                </div>
              </div>
              {benchmark.schedule.daysAhead !== 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className={`text-sm font-medium ${benchmark.schedule.daysAhead >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {benchmark.schedule.daysAhead >= 0
                      ? `${benchmark.schedule.daysAhead} days ahead of schedule`
                      : `${Math.abs(benchmark.schedule.daysAhead)} days behind schedule`}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quality & Contractors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quality */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Overview</h3>
              <div className="flex items-center gap-6 mb-4">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Inspection Pass Rate</div>
                  <div className={`text-3xl font-bold ${healthColor(benchmark.quality.inspectionPassRate)}`}>
                    {benchmark.quality.inspectionPassRate.toFixed(0)}%
                  </div>
                </div>
                <div className="w-24 h-24 rounded-full border-8 border-gray-100 flex items-center justify-center relative">
                  <svg className="absolute" width="96" height="96" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle
                      cx="48" cy="48" r="40" fill="none"
                      stroke={benchmark.quality.inspectionPassRate >= 80 ? '#22c55e' : '#eab308'}
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 40 * benchmark.quality.inspectionPassRate / 100} ${2 * Math.PI * 40}`}
                      transform="rotate(-90 48 48)"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-700">{benchmark.quality.criticalIssues}</div>
                  <div className="text-xs text-red-600">Critical</div>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded-lg">
                  <div className="text-lg font-bold text-yellow-700">{benchmark.quality.openIssues}</div>
                  <div className="text-xs text-yellow-600">Open</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-700">{benchmark.quality.inspectionPassRate >= 80 ? 'Good' : 'Fair'}</div>
                  <div className="text-xs text-green-600">Status</div>
                </div>
              </div>
            </div>

            {/* Contractor Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contractor Performance</h3>
              <div className="flex items-center gap-6 mb-6">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Average Reliability Score</div>
                  <div className={`text-3xl font-bold ${healthColor(benchmark.contractors.avgReliabilityScore)}`}>
                    {benchmark.contractors.avgReliabilityScore}
                    <span className="text-lg text-gray-400 font-normal">/100</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">{benchmark.contractors.totalContractors}</div>
                  <div className="text-xs text-gray-500">Contractors</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-gray-500 mb-2">Score Distribution</div>
                <div className="flex gap-1.5 items-end h-16">
                  {[20, 40, 60, 80, 100].map((threshold) => {
                    const filled = benchmark.contractors.avgReliabilityScore >= threshold
                    return (
                      <div
                        key={threshold}
                        className={`flex-1 rounded-t-sm transition-all duration-500 ${
                          filled
                            ? threshold >= 80 ? 'bg-green-500' : threshold >= 60 ? 'bg-yellow-500' : 'bg-red-400'
                            : 'bg-gray-200'
                        }`}
                        style={{ height: `${threshold}%` }}
                      />
                    )
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-400 px-0.5">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!benchmark && !loading && !error && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">&#128202;</div>
          <h3 className="text-lg font-medium text-gray-900">No Project Data</h3>
          <p className="text-sm text-gray-500 mt-2">Create a project to see analytics and benchmarks.</p>
        </div>
      )}
    </div>
  )
}
