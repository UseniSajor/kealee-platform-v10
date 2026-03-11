'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Calendar, DollarSign, CheckCircle, Clock, AlertTriangle, Boxes,
  Layers, Cpu, Activity, Shield, TrendingUp, BarChart3, FileText, Users
} from 'lucide-react'

// ── All 12 Lifecycle Phases from seed-v20-core ──
const LIFECYCLE_PHASES = [
  { key: 'IDEA', name: 'Idea', order: 1, requiredModules: ['marketplace'] },
  { key: 'LAND', name: 'Land Acquisition & Analysis', order: 2, requiredModules: ['os-land'] },
  { key: 'FEASIBILITY', name: 'Feasibility Study', order: 3, requiredModules: ['os-feas'] },
  { key: 'DESIGN', name: 'Design & Architecture', order: 4, requiredModules: ['os-dev'] },
  { key: 'PERMITS', name: 'Permitting & Entitlements', order: 5, requiredModules: ['os-dev', 'os-pm'] },
  { key: 'PRECONSTRUCTION', name: 'Pre-Construction', order: 6, requiredModules: ['os-pm', 'marketplace'] },
  { key: 'CONSTRUCTION', name: 'Construction', order: 7, requiredModules: ['os-pm'] },
  { key: 'INSPECTIONS', name: 'Inspections & QA', order: 8, requiredModules: ['os-pm'] },
  { key: 'PAYMENTS', name: 'Payments & Finance', order: 9, requiredModules: ['os-pay'] },
  { key: 'CLOSEOUT', name: 'Closeout', order: 10, requiredModules: ['os-pm', 'os-pay'] },
  { key: 'OPERATIONS', name: 'Operations & Maintenance', order: 11, requiredModules: ['os-ops'] },
  { key: 'ARCHIVE', name: 'Archive', order: 12, requiredModules: [] },
]

// ── 7 Payment Milestone Templates from seed-v20-core ──
const PAYMENT_MILESTONES = [
  { key: 'DEPOSIT', name: 'Deposit / Mobilization', percentage: 10, order: 1, typicalInspection: 'SITE', amount: 52000, status: 'paid' as const, date: '2025-11-01' },
  { key: 'FOUNDATION', name: 'Foundation Complete', percentage: 15, order: 2, typicalInspection: 'FOUNDATION', amount: 78000, status: 'paid' as const, date: '2025-12-20' },
  { key: 'FRAMING', name: 'Framing Complete', percentage: 20, order: 3, typicalInspection: 'ROUGH_FRAMING', amount: 104000, status: 'in_progress' as const, date: '2026-03-15' },
  { key: 'MEP_ROUGH', name: 'MEP Rough-In Complete', percentage: 15, order: 4, typicalInspection: 'ROUGH_MECHANICAL', amount: 78000, status: 'upcoming' as const, date: '2026-04-15' },
  { key: 'DRYWALL_INTERIOR', name: 'Drywall & Interior', percentage: 15, order: 5, typicalInspection: 'INSULATION', amount: 78000, status: 'upcoming' as const, date: '2026-05-30' },
  { key: 'FINISH', name: 'Finish Work', percentage: 15, order: 6, typicalInspection: 'FINAL_BUILDING', amount: 78000, status: 'upcoming' as const, date: '2026-07-15' },
  { key: 'COMPLETION', name: 'Substantial Completion', percentage: 10, order: 7, typicalInspection: 'CERTIFICATE_OF_OCCUPANCY', amount: 52000, status: 'upcoming' as const, date: '2026-08-01' },
]

// ── OS Modules from seed-v20-core (this project uses all 7) ──
const ENABLED_MODULES = [
  { key: 'os-land', name: 'OS Land', phases: ['LAND'], active: true },
  { key: 'os-feas', name: 'OS Feasibility', phases: ['FEASIBILITY'], active: true },
  { key: 'os-dev', name: 'OS Development', phases: ['DESIGN', 'PERMITS'], active: true },
  { key: 'os-pm', name: 'OS Project Management', phases: ['PRECONSTRUCTION', 'CONSTRUCTION', 'INSPECTIONS', 'CLOSEOUT'], active: true },
  { key: 'os-pay', name: 'OS Payments', phases: ['PAYMENTS', 'CLOSEOUT'], active: true },
  { key: 'os-ops', name: 'OS Operations', phases: ['OPERATIONS'], active: false },
  { key: 'marketplace', name: 'Marketplace', phases: ['IDEA', 'PRECONSTRUCTION'], active: true },
]

// ── L2 Twin KPIs from seed-v20-core ──
const TWIN_KPIS = [
  { key: 'budget_variance', name: 'Budget Variance', value: 4.8, unit: 'percent', threshold: { warning: 5, critical: 10 }, status: 'good' as const },
  { key: 'schedule_spi', name: 'Schedule Performance Index (SPI)', value: 0.92, unit: 'ratio', threshold: { warning: 0.9, critical: 0.8 }, status: 'warning' as const },
  { key: 'completion_pct', name: 'Completion Percentage', value: 45, unit: 'percent', threshold: { warning: null, critical: null }, status: 'good' as const },
  { key: 'risk_score', name: 'Risk Score', value: 42, unit: 'score_0_100', threshold: { warning: 60, critical: 80 }, status: 'good' as const },
  { key: 'quality_score', name: 'Quality Score', value: 85, unit: 'score_0_100', threshold: { warning: 70, critical: 50 }, status: 'good' as const },
  { key: 'open_issues', name: 'Open Issues Count', value: 7, unit: 'count', threshold: { warning: 10, critical: 25 }, status: 'good' as const },
]

const TIMELINE_EVENTS = [
  { date: '2026-03-08', title: 'Framing inspection passed - roof trusses complete', type: 'success' as const },
  { date: '2026-03-05', title: 'Roof trusses and sheathing delivered', type: 'info' as const },
  { date: '2026-03-01', title: 'Partial draw approved - Framing Complete 50% ($52,000)', type: 'payment' as const },
  { date: '2026-02-25', title: 'Window and door order placed with supplier', type: 'info' as const },
  { date: '2026-02-20', title: 'Weather delay - 2 days added to schedule', type: 'warning' as const },
  { date: '2026-02-15', title: 'Second-floor framing started', type: 'info' as const },
  { date: '2026-01-28', title: 'First-floor framing complete - structural inspection passed', type: 'success' as const },
  { date: '2025-12-20', title: 'Foundation Complete milestone paid - $78,000 released', type: 'payment' as const },
  { date: '2025-12-18', title: 'Foundation inspection passed', type: 'success' as const },
  { date: '2025-11-01', title: 'Deposit / Mobilization - $52,000 released', type: 'payment' as const },
]

const CURRENT_PHASE_KEY = 'CONSTRUCTION'

const phaseStatusColor = (phaseKey: string) => {
  const currentOrder = LIFECYCLE_PHASES.find(p => p.key === CURRENT_PHASE_KEY)?.order || 0
  const phaseOrder = LIFECYCLE_PHASES.find(p => p.key === phaseKey)?.order || 0
  if (phaseOrder < currentOrder) return { bg: '#38A169', text: 'white', label: 'Complete' }
  if (phaseOrder === currentOrder) return { bg: '#2ABFBF', text: 'white', label: 'Active' }
  return { bg: '#E2E8F0', text: '#718096', label: 'Upcoming' }
}

const healthColor = (score: number) => {
  if (score >= 90) return '#38A169'
  if (score >= 70) return '#E8793A'
  return '#E53E3E'
}

const kpiStatusColor = (status: 'good' | 'warning' | 'critical') => {
  if (status === 'good') return '#38A169'
  if (status === 'warning') return '#E8793A'
  return '#E53E3E'
}

const formatKpiValue = (kpi: typeof TWIN_KPIS[0]) => {
  if (kpi.unit === 'percent') return `${kpi.value}%`
  if (kpi.unit === 'ratio') return kpi.value.toFixed(2)
  if (kpi.unit === 'score_0_100') return `${kpi.value}/100`
  if (kpi.unit === 'count') return `${kpi.value}`
  return `${kpi.value}`
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'lifecycle' | 'milestones' | 'modules' | 'kpis'>('timeline')

  const totalBudget = 520000
  const completedAmount = PAYMENT_MILESTONES.filter(m => m.status === 'paid').reduce((s, m) => s + m.amount, 0)
  const twinHealth = 87

  return (
    <div>
      <Link href="/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      {/* Project Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Modern Duplex - 5th Avenue</h1>
          <p className="mt-1 text-sm text-gray-600">142 5th Ave, Bethesda MD</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium"
              style={{ backgroundColor: 'rgba(42,191,191,0.08)', color: '#229999' }}
            >
              <Layers className="h-3 w-3" />
              New Home Construction
            </span>
            <span
              className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold"
              style={{ backgroundColor: 'rgba(232,121,58,0.1)', color: '#E8793A' }}
            >
              <Cpu className="h-3 w-3" />
              Twin L2
            </span>
            <span
              className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium"
              style={{ backgroundColor: 'rgba(42,191,191,0.15)', color: '#2ABFBF' }}
            >
              <Activity className="h-3 w-3" />
              Phase: Construction
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/twin/${params.id}`}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            style={{ backgroundColor: '#E8793A', borderColor: '#E8793A' }}
          >
            <Boxes className="h-4 w-4" />
            Digital Twin
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Progress</p>
          <p className="font-display mt-1 text-2xl font-bold" style={{ color: '#1A2B4A' }}>45%</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-[45%] rounded-full" style={{ backgroundColor: '#2ABFBF' }} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Total Budget</p>
          <p className="font-display mt-1 text-2xl font-bold" style={{ color: '#1A2B4A' }}>${totalBudget.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Paid to Date</p>
          <p className="font-display mt-1 text-2xl font-bold" style={{ color: '#38A169' }}>${completedAmount.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Twin Health</p>
          <p className="font-display mt-1 text-2xl font-bold" style={{ color: healthColor(twinHealth) }}>{twinHealth}%</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full" style={{ width: `${twinHealth}%`, backgroundColor: healthColor(twinHealth) }} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Est. Completion</p>
          <p className="font-display mt-1 text-2xl font-bold" style={{ color: '#1A2B4A' }}>Aug 2026</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4 overflow-x-auto">
          {([
            { key: 'timeline', label: 'Timeline' },
            { key: 'lifecycle', label: 'Lifecycle Phases' },
            { key: 'milestones', label: 'Payment Milestones' },
            { key: 'modules', label: 'OS Modules' },
            { key: 'kpis', label: 'Twin KPIs' },
          ] as const).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'border-transparent' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              style={activeTab === tab.key ? { borderColor: '#2ABFBF', color: '#2ABFBF' } : undefined}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Timeline Tab ── */}
      {activeTab === 'timeline' && (
        <div className="space-y-3">
          {TIMELINE_EVENTS.map((event, i) => (
            <div key={i} className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                event.type === 'success' ? 'bg-green-100' : event.type === 'warning' ? 'bg-amber-100' : event.type === 'payment' ? '' : 'bg-gray-100'
              }`}
              style={event.type === 'payment' ? { backgroundColor: 'rgba(232,121,58,0.1)' } : undefined}>
                {event.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> :
                 event.type === 'warning' ? <AlertTriangle className="h-4 w-4 text-amber-600" /> :
                 event.type === 'payment' ? <DollarSign className="h-4 w-4" style={{ color: '#E8793A' }} /> :
                 <Clock className="h-4 w-4 text-gray-500" />}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{event.title}</p>
                <p className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Lifecycle Phases Tab ── */}
      {activeTab === 'lifecycle' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">Full 12-phase project lifecycle from v20 seed data</p>
            <span className="text-xs text-gray-400">Current: Construction (Phase 7 of 12)</span>
          </div>

          {/* Phase Progress Bar */}
          <div className="mb-6 flex gap-0.5 overflow-hidden rounded-lg">
            {LIFECYCLE_PHASES.map((phase) => {
              const status = phaseStatusColor(phase.key)
              return (
                <div
                  key={phase.key}
                  className="flex-1 h-3 transition-all relative group"
                  style={{ backgroundColor: status.bg }}
                  title={phase.name}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                    <div className="rounded bg-gray-900 px-2 py-1 text-xs text-white whitespace-nowrap">
                      {phase.name}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Phase Cards */}
          <div className="space-y-2">
            {LIFECYCLE_PHASES.map((phase) => {
              const status = phaseStatusColor(phase.key)
              const isActive = phase.key === CURRENT_PHASE_KEY
              return (
                <div
                  key={phase.key}
                  className={`flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm transition-all ${
                    isActive ? 'border-2' : 'border-gray-200'
                  }`}
                  style={isActive ? { borderColor: '#2ABFBF' } : undefined}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                      style={{ backgroundColor: status.bg, color: status.text }}
                    >
                      {phase.order}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>{phase.name}</p>
                        {isActive && (
                          <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: 'rgba(42,191,191,0.15)', color: '#2ABFBF' }}>
                            Current Phase
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {phase.requiredModules.length > 0
                          ? `Required: ${phase.requiredModules.join(', ')}`
                          : 'No modules required'}
                      </p>
                    </div>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: status.label === 'Complete' ? 'rgba(56,161,105,0.1)' :
                        status.label === 'Active' ? 'rgba(42,191,191,0.1)' : 'rgba(226,232,240,0.5)',
                      color: status.label === 'Complete' ? '#38A169' :
                        status.label === 'Active' ? '#2ABFBF' : '#A0AEC0',
                    }}
                  >
                    {status.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Payment Milestones Tab ── */}
      {activeTab === 'milestones' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">7 milestones per v20 seed payment milestone templates</p>
            <span className="text-xs text-gray-400">Contract: $520,000 | Paid: ${completedAmount.toLocaleString()}</span>
          </div>

          {/* Visual bar */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-1">
              {PAYMENT_MILESTONES.map((m) => (
                <div key={m.key} className="relative group" style={{ flex: m.percentage }}>
                  <div
                    className="h-8 rounded-sm flex items-center justify-center text-xs font-semibold text-white transition-all"
                    style={{
                      backgroundColor:
                        m.status === 'paid' ? '#38A169' :
                        m.status === 'in_progress' ? '#E8793A' :
                        '#CBD5E0',
                      color: m.status === 'upcoming' ? '#718096' : 'white',
                    }}
                  >
                    {m.percentage}%
                  </div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                    <div className="rounded bg-gray-900 px-2 py-1 text-xs text-white whitespace-nowrap">
                      {m.name} - ${m.amount.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-4 justify-center text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#38A169' }} />
                Paid
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#E8793A' }} />
                In Progress
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#CBD5E0' }} />
                Upcoming
              </div>
            </div>
          </div>

          {/* Milestone List */}
          <div className="space-y-3">
            {PAYMENT_MILESTONES.map((m) => (
              <div key={m.key} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    m.status === 'paid' ? 'bg-green-100' : m.status === 'in_progress' ? '' : 'bg-gray-100'
                  }`}
                  style={m.status === 'in_progress' ? { backgroundColor: 'rgba(232,121,58,0.1)' } : undefined}>
                    {m.status === 'paid' ? <CheckCircle className="h-5 w-5 text-green-600" /> :
                     m.status === 'in_progress' ? <Clock className="h-5 w-5" style={{ color: '#E8793A' }} /> :
                     <Calendar className="h-5 w-5 text-gray-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400">#{m.order}</span>
                      <p className="text-sm font-medium text-gray-900">{m.name}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {m.status === 'paid' ? `Paid ${new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` :
                       `Due ${new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                      {' '} -- Inspection: {m.typicalInspection.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: '#E8793A' }}>${m.amount.toLocaleString()}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">{m.percentage}%</span>
                    <span className="text-xs font-medium" style={{
                      color: m.status === 'paid' ? '#38A169' : m.status === 'in_progress' ? '#E8793A' : '#9CA3AF'
                    }}>
                      {m.status === 'paid' ? 'Paid' : m.status === 'in_progress' ? 'In Progress' : 'Upcoming'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── OS Modules Tab ── */}
      {activeTab === 'modules' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">7 OS modules from v20 seed -- NEW_HOME uses all modules</p>
            <span className="text-xs text-gray-400">{ENABLED_MODULES.filter(m => m.active).length} active / {ENABLED_MODULES.length} total</span>
          </div>

          <div className="space-y-3">
            {ENABLED_MODULES.map((mod) => {
              const modulePhases = mod.phases.map(pk => LIFECYCLE_PHASES.find(p => p.key === pk)?.name || pk)
              const isActiveInCurrentPhase = mod.phases.includes(CURRENT_PHASE_KEY)

              return (
                <div
                  key={mod.key}
                  className={`rounded-lg border bg-white p-5 shadow-sm transition-all ${
                    isActiveInCurrentPhase ? 'border-2' : 'border-gray-200'
                  }`}
                  style={isActiveInCurrentPhase ? { borderColor: '#2ABFBF' } : undefined}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: mod.active
                            ? (isActiveInCurrentPhase ? 'rgba(42,191,191,0.1)' : 'rgba(56,161,105,0.1)')
                            : 'rgba(160,174,192,0.1)',
                        }}
                      >
                        {mod.key === 'os-land' ? <BarChart3 className="h-5 w-5" style={{ color: mod.active ? '#38A169' : '#A0AEC0' }} /> :
                         mod.key === 'os-feas' ? <TrendingUp className="h-5 w-5" style={{ color: mod.active ? '#38A169' : '#A0AEC0' }} /> :
                         mod.key === 'os-dev' ? <FileText className="h-5 w-5" style={{ color: mod.active ? '#38A169' : '#A0AEC0' }} /> :
                         mod.key === 'os-pm' ? <Activity className="h-5 w-5" style={{ color: isActiveInCurrentPhase ? '#2ABFBF' : '#38A169' }} /> :
                         mod.key === 'os-pay' ? <DollarSign className="h-5 w-5" style={{ color: mod.active ? '#38A169' : '#A0AEC0' }} /> :
                         mod.key === 'os-ops' ? <Shield className="h-5 w-5" style={{ color: mod.active ? '#38A169' : '#A0AEC0' }} /> :
                         <Users className="h-5 w-5" style={{ color: mod.active ? '#38A169' : '#A0AEC0' }} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{mod.name}</p>
                          {isActiveInCurrentPhase && (
                            <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: 'rgba(42,191,191,0.15)', color: '#2ABFBF' }}>
                              Active Now
                            </span>
                          )}
                          {!mod.active && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-400">
                              Not Yet Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Phases: {modulePhases.join(', ')}
                        </p>
                      </div>
                    </div>
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: mod.active ? (isActiveInCurrentPhase ? '#2ABFBF' : '#38A169') : '#CBD5E0' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Twin KPIs Tab ── */}
      {activeTab === 'kpis' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">L2 Standard Twin -- 6 KPIs from v20 seed twin KPI defaults</p>
            <span className="text-xs text-gray-400">
              Twin Health: <span className="font-semibold" style={{ color: healthColor(twinHealth) }}>{twinHealth}%</span>
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TWIN_KPIS.map((kpi) => (
              <div key={kpi.key} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-gray-500">{kpi.name}</p>
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: kpiStatusColor(kpi.status) }}
                  />
                </div>
                <p className="text-2xl font-bold font-display" style={{ color: kpiStatusColor(kpi.status) }}>
                  {formatKpiValue(kpi)}
                </p>
                {kpi.threshold.warning !== null && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Threshold</span>
                      <span>
                        Warning: {kpi.threshold.warning} / Critical: {kpi.threshold.critical}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      {kpi.unit === 'score_0_100' ? (
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${kpi.value}%`,
                            backgroundColor: kpiStatusColor(kpi.status),
                          }}
                        />
                      ) : kpi.unit === 'percent' ? (
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min((kpi.value / (kpi.threshold.critical || 10)) * 100, 100)}%`,
                            backgroundColor: kpiStatusColor(kpi.status),
                          }}
                        />
                      ) : kpi.unit === 'ratio' ? (
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${kpi.value * 100}%`,
                            backgroundColor: kpiStatusColor(kpi.status),
                          }}
                        />
                      ) : (
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min((kpi.value / (kpi.threshold.critical || 25)) * 100, 100)}%`,
                            backgroundColor: kpiStatusColor(kpi.status),
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
