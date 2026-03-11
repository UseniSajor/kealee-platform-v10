'use client'

import { useState } from 'react'
import { FileBarChart, Download, Calendar, TrendingUp, DollarSign, Users, Clock, Activity, Cpu, Box, BarChart3, AlertTriangle, CheckCircle } from 'lucide-react'

// ── v20 Seed: Twin KPI Defaults (by tier) ──────────────────
const TWIN_KPI_TIERS = {
  L1: {
    tier: 'L1',
    label: 'Light Twin',
    description: 'Basic tracking with budget, schedule, and completion metrics.',
    kpis: [
      { key: 'budget_variance', name: 'Budget Variance', unit: 'percent', thresholdWarning: 5, thresholdCritical: 10 },
      { key: 'schedule_spi', name: 'Schedule Performance Index (SPI)', unit: 'ratio', thresholdWarning: 0.9, thresholdCritical: 0.8 },
      { key: 'completion_pct', name: 'Completion Percentage', unit: 'percent', thresholdWarning: null, thresholdCritical: null },
    ],
  },
  L2: {
    tier: 'L2',
    label: 'Standard Twin',
    description: 'Full scheduling, cost tracking, document management, and risk monitoring.',
    kpis: [
      { key: 'budget_variance', name: 'Budget Variance', unit: 'percent', thresholdWarning: 5, thresholdCritical: 10 },
      { key: 'schedule_spi', name: 'Schedule Performance Index (SPI)', unit: 'ratio', thresholdWarning: 0.9, thresholdCritical: 0.8 },
      { key: 'completion_pct', name: 'Completion Percentage', unit: 'percent', thresholdWarning: null, thresholdCritical: null },
      { key: 'risk_score', name: 'Risk Score', unit: 'score_0_100', thresholdWarning: 60, thresholdCritical: 80 },
      { key: 'quality_score', name: 'Quality Score', unit: 'score_0_100', thresholdWarning: 70, thresholdCritical: 50 },
      { key: 'open_issues', name: 'Open Issues Count', unit: 'count', thresholdWarning: 10, thresholdCritical: 25 },
    ],
  },
  L3: {
    tier: 'L3',
    label: 'Premium Twin',
    description: 'AI-powered predictions, real-time IoT, advanced analytics, and proactive alerting.',
    kpis: [
      { key: 'budget_variance', name: 'Budget Variance', unit: 'percent', thresholdWarning: 5, thresholdCritical: 10 },
      { key: 'schedule_spi', name: 'Schedule Performance Index (SPI)', unit: 'ratio', thresholdWarning: 0.9, thresholdCritical: 0.8 },
      { key: 'completion_pct', name: 'Completion Percentage', unit: 'percent', thresholdWarning: null, thresholdCritical: null },
      { key: 'risk_score', name: 'Risk Score', unit: 'score_0_100', thresholdWarning: 60, thresholdCritical: 80 },
      { key: 'quality_score', name: 'Quality Score', unit: 'score_0_100', thresholdWarning: 70, thresholdCritical: 50 },
      { key: 'open_issues', name: 'Open Issues Count', unit: 'count', thresholdWarning: 10, thresholdCritical: 25 },
      { key: 'safety_score', name: 'Safety Score', unit: 'score_0_100', thresholdWarning: 80, thresholdCritical: 60 },
      { key: 'cost_performance_index', name: 'Cost Performance Index (CPI)', unit: 'ratio', thresholdWarning: 0.9, thresholdCritical: 0.8 },
      { key: 'rfi_response_time', name: 'RFI Response Time', unit: 'days', thresholdWarning: 5, thresholdCritical: 10 },
      { key: 'change_order_rate', name: 'Change Order Rate', unit: 'percent', thresholdWarning: 5, thresholdCritical: 10 },
    ],
  },
}

// ── Realistic KPI values per project ───────────────────────
const PROJECT_KPI_DATA = [
  {
    project: 'Riverside Multifamily', tier: 'L3',
    values: { budget_variance: 3.2, schedule_spi: 0.94, completion_pct: 52, risk_score: 42, quality_score: 88, open_issues: 7, safety_score: 91, cost_performance_index: 0.96, rfi_response_time: 3.2, change_order_rate: 4.1 },
  },
  {
    project: 'Oak Hill Mixed-Use', tier: 'L3',
    values: { budget_variance: 1.8, schedule_spi: 1.02, completion_pct: 28, risk_score: 28, quality_score: 94, open_issues: 2, safety_score: 95, cost_performance_index: 1.01, rfi_response_time: 1.8, change_order_rate: 1.2 },
  },
  {
    project: 'East Austin Townhomes', tier: 'L3',
    values: { budget_variance: 6.4, schedule_spi: 0.87, completion_pct: 22, risk_score: 58, quality_score: 82, open_issues: 12, safety_score: 86, cost_performance_index: 0.91, rfi_response_time: 4.5, change_order_rate: 6.8 },
  },
  {
    project: 'Westlake Custom Home', tier: 'L2',
    values: { budget_variance: 4.1, schedule_spi: 0.92, completion_pct: 65, risk_score: 45, quality_score: 90, open_issues: 5 },
  },
  {
    project: 'Congress Ave Retail', tier: 'L2',
    values: { budget_variance: 0.5, schedule_spi: 1.0, completion_pct: 8, risk_score: 22, quality_score: 97, open_issues: 0 },
  },
  {
    project: 'Tarrytown Addition', tier: 'L2',
    values: { budget_variance: 8.2, schedule_spi: 0.85, completion_pct: 88, risk_score: 64, quality_score: 76, open_issues: 14 },
  },
  {
    project: 'Mueller Kitchen Remodel', tier: 'L1',
    values: { budget_variance: 2.1, schedule_spi: 0.98, completion_pct: 95 },
  },
]

// ── Lifecycle Phase Analytics ──────────────────────────────
const PHASE_ANALYTICS = [
  { phase: 'LAND', name: 'Land', projects: 1, avgDuration: '4.2 mo', avgBudgetVar: '+1.2%' },
  { phase: 'FEASIBILITY', name: 'Feasibility', projects: 1, avgDuration: '2.8 mo', avgBudgetVar: '+0.5%' },
  { phase: 'DESIGN', name: 'Design', projects: 1, avgDuration: '6.4 mo', avgBudgetVar: '+1.8%' },
  { phase: 'PERMITS', name: 'Permits', projects: 1, avgDuration: '3.1 mo', avgBudgetVar: '+2.4%' },
  { phase: 'CONSTRUCTION', name: 'Construction', projects: 2, avgDuration: '14.6 mo', avgBudgetVar: '+3.7%' },
  { phase: 'INSPECTIONS', name: 'Inspections', projects: 1, avgDuration: '1.5 mo', avgBudgetVar: '+8.2%' },
  { phase: 'CLOSEOUT', name: 'Closeout', projects: 1, avgDuration: '1.2 mo', avgBudgetVar: '+2.1%' },
  { phase: 'OPERATIONS', name: 'Operations', projects: 1, avgDuration: 'Ongoing', avgBudgetVar: 'N/A' },
]

// ── Module Performance Metrics ─────────────────────────────
const MODULE_METRICS = [
  { key: 'os-land', name: 'OS Land', activeProjects: 4, avgScore: 94, eventsThisMonth: 23, topMetric: '3.2 ac avg parcel' },
  { key: 'os-feas', name: 'OS Feasibility', activeProjects: 5, avgScore: 92, eventsThisMonth: 18, topMetric: '11 scenarios run' },
  { key: 'os-dev', name: 'OS Development', activeProjects: 6, avgScore: 89, eventsThisMonth: 47, topMetric: '142 drawings managed' },
  { key: 'os-pm', name: 'OS Project Management', activeProjects: 8, avgScore: 87, eventsThisMonth: 312, topMetric: '28 milestones tracked' },
  { key: 'os-pay', name: 'OS Payments', activeProjects: 8, avgScore: 96, eventsThisMonth: 34, topMetric: '$8.2M processed' },
  { key: 'os-ops', name: 'OS Operations', activeProjects: 3, avgScore: 91, eventsThisMonth: 15, topMetric: '6 warranties active' },
  { key: 'marketplace', name: 'Marketplace', activeProjects: 9, avgScore: 88, eventsThisMonth: 67, topMetric: '24 bids received' },
]

// ── Reports ────────────────────────────────────────────────
const REPORTS = [
  { id: '1', name: 'Q1 2026 Investor Report', type: 'Quarterly Report', project: 'All Projects', date: '2026-03-10', status: 'draft' },
  { id: '2', name: 'Oak Hill - Monthly Update #4', type: 'Monthly Update', project: 'Oak Hill Mixed-Use', date: '2026-03-01', status: 'published' },
  { id: '3', name: 'Riverside - Monthly Update #9', type: 'Monthly Update', project: 'Riverside Multifamily', date: '2026-03-01', status: 'published' },
  { id: '4', name: 'East Austin Townhomes - Phase Gate', type: 'Phase Gate Report', project: 'East Austin Townhomes', date: '2026-02-28', status: 'published' },
  { id: '5', name: 'Q4 2025 Investor Report', type: 'Quarterly Report', project: 'All Projects', date: '2025-12-31', status: 'published' },
  { id: '6', name: 'Riverside - Twin KPI Dashboard', type: 'L3 Twin Report', project: 'Riverside Multifamily', date: '2026-03-05', status: 'published' },
  { id: '7', name: 'Portfolio Risk Assessment', type: 'Risk Analysis', project: 'All Projects', date: '2026-02-15', status: 'published' },
]

const INVESTOR_METRICS = [
  { label: 'Total LP Commitments', value: '$13.7M', icon: Users, color: '#E8793A', bg: 'rgba(232, 121, 58, 0.1)' },
  { label: 'Capital Called', value: '$9.9M', icon: DollarSign, color: '#38A169', bg: 'rgba(56, 161, 105, 0.1)' },
  { label: 'Portfolio IRR (Proj)', value: '19.4%', icon: TrendingUp, color: '#2ABFBF', bg: 'rgba(42, 191, 191, 0.1)' },
  { label: 'Active Twins', value: '7 / 9', icon: Activity, color: '#1A2B4A', bg: 'rgba(26, 43, 74, 0.1)' },
]

const statusColors: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-700',
  published: 'bg-green-100 text-green-700',
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'kpis' | 'reports'>('overview')

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">Twin KPIs (L1: 3, L2: 6, L3: 10), lifecycle analytics, and investor reports</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: '#E8793A' }}>
          <FileBarChart className="h-4 w-4" />
          Generate Report
        </button>
      </div>

      {/* Top Metrics */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {INVESTOR_METRICS.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="inline-flex rounded-lg p-2" style={{ backgroundColor: metric.bg }}>
              <metric.icon className="h-5 w-5" style={{ color: metric.color }} />
            </div>
            <p className="mt-2 text-2xl font-bold" style={{ color: '#1A2B4A' }}>{metric.value}</p>
            <p className="text-xs text-gray-500">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6">
          {[
            { key: 'overview' as const, label: 'Twin KPI Dashboard' },
            { key: 'kpis' as const, label: 'Lifecycle & Module Analytics' },
            { key: 'reports' as const, label: 'Report Archive' },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 pb-3 text-sm font-medium ${activeTab === tab.key ? 'border-current' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              style={activeTab === tab.key ? { color: '#2ABFBF', borderColor: '#2ABFBF' } : undefined}>{tab.label}</button>
          ))}
        </div>
      </div>

      {/* ── Twin KPI Dashboard ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Tier Legend */}
          <div className="grid gap-4 sm:grid-cols-3">
            {Object.values(TWIN_KPI_TIERS).map((tier) => {
              const color = tier.tier === 'L1' ? '#94A3B8' : tier.tier === 'L2' ? '#3B82F6' : '#8B5CF6'
              return (
                <div key={tier.tier} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-5 w-5" style={{ color }} />
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#1A2B4A' }}>{tier.tier} - {tier.label}</p>
                      <p className="text-xs text-gray-500">{tier.kpis.length} KPIs tracked</p>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{tier.description}</p>
                </div>
              )
            })}
          </div>

          {/* Per-project KPI table */}
          {PROJECT_KPI_DATA.map((proj) => {
            const tierData = TWIN_KPI_TIERS[proj.tier as keyof typeof TWIN_KPI_TIERS]
            const tierColor = proj.tier === 'L1' ? '#94A3B8' : proj.tier === 'L2' ? '#3B82F6' : '#8B5CF6'
            return (
              <div key={proj.project} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="font-semibold" style={{ color: '#1A2B4A' }}>{proj.project}</h3>
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${tierColor}15`, color: tierColor }}>{proj.tier} Twin</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {tierData.kpis.map((kpi) => {
                    const val = (proj.values as Record<string, number>)[kpi.key]
                    const displayVal = kpi.unit === 'percent' ? `${val}%` : kpi.unit === 'ratio' ? val?.toFixed(2) : kpi.unit === 'days' ? `${val} days` : kpi.unit === 'count' ? val : val
                    let status: 'ok' | 'warning' | 'critical' = 'ok'
                    if (kpi.thresholdCritical !== null && kpi.thresholdWarning !== null) {
                      if (kpi.unit === 'ratio') {
                        if (val < kpi.thresholdCritical) status = 'critical'
                        else if (val < kpi.thresholdWarning) status = 'warning'
                      } else if (kpi.key === 'quality_score' || kpi.key === 'safety_score') {
                        if (val < kpi.thresholdCritical) status = 'critical'
                        else if (val < kpi.thresholdWarning) status = 'warning'
                      } else {
                        if (val > kpi.thresholdCritical) status = 'critical'
                        else if (val > kpi.thresholdWarning) status = 'warning'
                      }
                    }
                    const statusColor = status === 'ok' ? '#38A169' : status === 'warning' ? '#E8793A' : '#E53E3E'
                    return (
                      <div key={kpi.key} className="rounded-lg border border-gray-100 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">{kpi.name}</p>
                          {status === 'warning' && <AlertTriangle className="h-3 w-3" style={{ color: '#E8793A' }} />}
                          {status === 'critical' && <AlertTriangle className="h-3 w-3" style={{ color: '#E53E3E' }} />}
                          {status === 'ok' && <CheckCircle className="h-3 w-3" style={{ color: '#38A169' }} />}
                        </div>
                        <p className="mt-1 text-lg font-bold" style={{ color: statusColor }}>{displayVal}</p>
                        {kpi.thresholdWarning !== null && (
                          <p className="text-xs text-gray-400">Warn: {kpi.thresholdWarning} | Crit: {kpi.thresholdCritical}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Lifecycle & Module Analytics ── */}
      {activeTab === 'kpis' && (
        <div className="space-y-6">
          {/* Lifecycle Phase Analytics */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Lifecycle Phase Analytics</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2.5 font-medium text-gray-500">Phase</th>
                    <th className="px-4 py-2.5 font-medium text-gray-500">Active Projects</th>
                    <th className="px-4 py-2.5 font-medium text-gray-500">Avg Duration</th>
                    <th className="px-4 py-2.5 font-medium text-gray-500">Avg Budget Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {PHASE_ANALYTICS.map((pa, i) => (
                    <tr key={pa.phase} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-2.5 font-medium" style={{ color: '#1A2B4A' }}>{pa.name}</td>
                      <td className="px-4 py-2.5 text-gray-600">{pa.projects}</td>
                      <td className="px-4 py-2.5 text-gray-600">{pa.avgDuration}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-medium" style={{ color: pa.avgBudgetVar === 'N/A' ? '#94A3B8' : parseFloat(pa.avgBudgetVar) > 5 ? '#E8793A' : '#38A169' }}>
                          {pa.avgBudgetVar}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Module Performance Metrics */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Module Performance (7 OS Modules)</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {MODULE_METRICS.map((mod) => (
                <div key={mod.key} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-2">
                    <Box className="h-4 w-4" style={{ color: mod.avgScore >= 90 ? '#38A169' : mod.avgScore >= 80 ? '#2ABFBF' : '#E8793A' }} />
                    <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{mod.name}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-500">Projects</p>
                      <p className="text-sm font-bold" style={{ color: '#1A2B4A' }}>{mod.activeProjects}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Health</p>
                      <p className="text-sm font-bold" style={{ color: mod.avgScore >= 90 ? '#38A169' : mod.avgScore >= 80 ? '#2ABFBF' : '#E8793A' }}>{mod.avgScore}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Events/mo</p>
                      <p className="text-sm font-bold" style={{ color: '#1A2B4A' }}>{mod.eventsThisMonth}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Key Metric</p>
                      <p className="text-xs font-medium text-gray-600">{mod.topMetric}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Report Archive ── */}
      {activeTab === 'reports' && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="divide-y divide-gray-50">
            {REPORTS.map((report) => (
              <div key={report.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <FileBarChart className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>{report.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{report.type}</span>
                      <span>|</span>
                      <span>{report.project}</span>
                      <span>|</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[report.status]}`}>{report.status}</span>
                  {report.status === 'published' && (
                    <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
