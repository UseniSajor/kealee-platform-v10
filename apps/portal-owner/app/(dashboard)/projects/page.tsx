'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, MapPin, Calendar, ChevronRight, Boxes, Activity, Layers, Cpu } from 'lucide-react'

// ── Seed-aligned data: 6 PROJECT_TYPES, LIFECYCLE_PHASES, PAYMENT_MILESTONES, OS_MODULES ──

const PAYMENT_MILESTONES = [
  { key: 'DEPOSIT', name: 'Deposit / Mobilization', percentage: 10, order: 1 },
  { key: 'FOUNDATION', name: 'Foundation Complete', percentage: 15, order: 2 },
  { key: 'FRAMING', name: 'Framing Complete', percentage: 20, order: 3 },
  { key: 'MEP_ROUGH', name: 'MEP Rough-In Complete', percentage: 15, order: 4 },
  { key: 'DRYWALL_INTERIOR', name: 'Drywall & Interior', percentage: 15, order: 5 },
  { key: 'FINISH', name: 'Finish Work', percentage: 15, order: 6 },
  { key: 'COMPLETION', name: 'Substantial Completion', percentage: 10, order: 7 },
]

type MilestoneStatus = 'paid' | 'in_progress' | 'upcoming'

interface ProjectMilestone {
  key: string
  name: string
  percentage: number
  status: MilestoneStatus
}

interface MockProject {
  id: string
  name: string
  address: string
  projectType: string
  projectTypeKey: string
  twinTier: 'L1' | 'L2' | 'L3'
  lifecyclePhase: string
  lifecyclePhaseKey: string
  progress: number
  budget: number
  spent: number
  startDate: string
  twinHealth: number
  enabledModules: string[]
  milestones: ProjectMilestone[]
  kpis: { key: string; name: string; value: number; unit: string; status: 'good' | 'warning' | 'critical' }[]
}

const MOCK_PROJECTS: MockProject[] = [
  {
    id: '1',
    name: 'Kitchen Remodel - Oak Lane',
    address: '38 Oak Lane, Silver Spring MD',
    projectType: 'Renovation / Remodel',
    projectTypeKey: 'RENOVATION',
    twinTier: 'L1',
    lifecyclePhase: 'Construction',
    lifecyclePhaseKey: 'CONSTRUCTION',
    progress: 65,
    budget: 85000,
    spent: 78000,
    startDate: '2025-09-15',
    twinHealth: 88,
    enabledModules: ['OS Project Management', 'OS Payments', 'Marketplace'],
    milestones: [
      { key: 'DEPOSIT', name: 'Deposit / Mobilization', percentage: 10, status: 'paid' },
      { key: 'FOUNDATION', name: 'Foundation Complete', percentage: 15, status: 'paid' },
      { key: 'FRAMING', name: 'Framing Complete', percentage: 20, status: 'paid' },
      { key: 'MEP_ROUGH', name: 'MEP Rough-In Complete', percentage: 15, status: 'paid' },
      { key: 'DRYWALL_INTERIOR', name: 'Drywall & Interior', percentage: 15, status: 'in_progress' },
      { key: 'FINISH', name: 'Finish Work', percentage: 15, status: 'upcoming' },
      { key: 'COMPLETION', name: 'Substantial Completion', percentage: 10, status: 'upcoming' },
    ],
    kpis: [
      { key: 'budget_variance', name: 'Budget Variance', value: 3.2, unit: 'percent', status: 'good' },
      { key: 'schedule_spi', name: 'Schedule Performance Index', value: 0.95, unit: 'ratio', status: 'good' },
      { key: 'completion_pct', name: 'Completion', value: 65, unit: 'percent', status: 'good' },
    ],
  },
  {
    id: '2',
    name: 'Modern Duplex - 5th Avenue',
    address: '142 5th Ave, Bethesda MD',
    projectType: 'New Home Construction',
    projectTypeKey: 'NEW_HOME',
    twinTier: 'L2',
    lifecyclePhase: 'Construction',
    lifecyclePhaseKey: 'CONSTRUCTION',
    progress: 45,
    budget: 520000,
    spent: 234000,
    startDate: '2025-11-01',
    twinHealth: 87,
    enabledModules: ['OS Land', 'OS Feasibility', 'OS Development', 'OS Project Management', 'OS Payments', 'OS Operations', 'Marketplace'],
    milestones: [
      { key: 'DEPOSIT', name: 'Deposit / Mobilization', percentage: 10, status: 'paid' },
      { key: 'FOUNDATION', name: 'Foundation Complete', percentage: 15, status: 'paid' },
      { key: 'FRAMING', name: 'Framing Complete', percentage: 20, status: 'in_progress' },
      { key: 'MEP_ROUGH', name: 'MEP Rough-In Complete', percentage: 15, status: 'upcoming' },
      { key: 'DRYWALL_INTERIOR', name: 'Drywall & Interior', percentage: 15, status: 'upcoming' },
      { key: 'FINISH', name: 'Finish Work', percentage: 15, status: 'upcoming' },
      { key: 'COMPLETION', name: 'Substantial Completion', percentage: 10, status: 'upcoming' },
    ],
    kpis: [
      { key: 'budget_variance', name: 'Budget Variance', value: 4.8, unit: 'percent', status: 'good' },
      { key: 'schedule_spi', name: 'Schedule Performance Index', value: 0.92, unit: 'ratio', status: 'warning' },
      { key: 'completion_pct', name: 'Completion', value: 45, unit: 'percent', status: 'good' },
      { key: 'risk_score', name: 'Risk Score', value: 42, unit: 'score_0_100', status: 'good' },
      { key: 'quality_score', name: 'Quality Score', value: 85, unit: 'score_0_100', status: 'good' },
      { key: 'open_issues', name: 'Open Issues', value: 7, unit: 'count', status: 'good' },
    ],
  },
  {
    id: '3',
    name: 'ADU Build - Elm Street',
    address: '201 Elm St, Arlington VA',
    projectType: 'Home Addition',
    projectTypeKey: 'ADDITION',
    twinTier: 'L2',
    lifecyclePhase: 'Closeout',
    lifecyclePhaseKey: 'CLOSEOUT',
    progress: 98,
    budget: 180000,
    spent: 176400,
    startDate: '2025-06-01',
    twinHealth: 96,
    enabledModules: ['OS Development', 'OS Project Management', 'OS Payments', 'Marketplace'],
    milestones: [
      { key: 'DEPOSIT', name: 'Deposit / Mobilization', percentage: 10, status: 'paid' },
      { key: 'FOUNDATION', name: 'Foundation Complete', percentage: 15, status: 'paid' },
      { key: 'FRAMING', name: 'Framing Complete', percentage: 20, status: 'paid' },
      { key: 'MEP_ROUGH', name: 'MEP Rough-In Complete', percentage: 15, status: 'paid' },
      { key: 'DRYWALL_INTERIOR', name: 'Drywall & Interior', percentage: 15, status: 'paid' },
      { key: 'FINISH', name: 'Finish Work', percentage: 15, status: 'paid' },
      { key: 'COMPLETION', name: 'Substantial Completion', percentage: 10, status: 'in_progress' },
    ],
    kpis: [
      { key: 'budget_variance', name: 'Budget Variance', value: 2.0, unit: 'percent', status: 'good' },
      { key: 'schedule_spi', name: 'Schedule Performance Index', value: 1.02, unit: 'ratio', status: 'good' },
      { key: 'completion_pct', name: 'Completion', value: 98, unit: 'percent', status: 'good' },
      { key: 'risk_score', name: 'Risk Score', value: 12, unit: 'score_0_100', status: 'good' },
      { key: 'quality_score', name: 'Quality Score', value: 94, unit: 'score_0_100', status: 'good' },
      { key: 'open_issues', name: 'Open Issues', value: 2, unit: 'count', status: 'good' },
    ],
  },
  {
    id: '4',
    name: 'Townhome Development',
    address: '900 Georgia Ave, Silver Spring MD',
    projectType: 'Multifamily Development',
    projectTypeKey: 'MULTIFAMILY',
    twinTier: 'L3',
    lifecyclePhase: 'Permitting & Entitlements',
    lifecyclePhaseKey: 'PERMITS',
    progress: 15,
    budget: 1200000,
    spent: 180000,
    startDate: '2025-12-01',
    twinHealth: 74,
    enabledModules: ['OS Land', 'OS Feasibility', 'OS Development', 'OS Project Management', 'OS Payments', 'OS Operations', 'Marketplace'],
    milestones: [
      { key: 'DEPOSIT', name: 'Deposit / Mobilization', percentage: 10, status: 'paid' },
      { key: 'FOUNDATION', name: 'Foundation Complete', percentage: 15, status: 'upcoming' },
      { key: 'FRAMING', name: 'Framing Complete', percentage: 20, status: 'upcoming' },
      { key: 'MEP_ROUGH', name: 'MEP Rough-In Complete', percentage: 15, status: 'upcoming' },
      { key: 'DRYWALL_INTERIOR', name: 'Drywall & Interior', percentage: 15, status: 'upcoming' },
      { key: 'FINISH', name: 'Finish Work', percentage: 15, status: 'upcoming' },
      { key: 'COMPLETION', name: 'Substantial Completion', percentage: 10, status: 'upcoming' },
    ],
    kpis: [
      { key: 'budget_variance', name: 'Budget Variance', value: 1.5, unit: 'percent', status: 'good' },
      { key: 'schedule_spi', name: 'Schedule Performance Index', value: 0.88, unit: 'ratio', status: 'warning' },
      { key: 'completion_pct', name: 'Completion', value: 15, unit: 'percent', status: 'good' },
      { key: 'risk_score', name: 'Risk Score', value: 65, unit: 'score_0_100', status: 'warning' },
      { key: 'quality_score', name: 'Quality Score', value: 78, unit: 'score_0_100', status: 'good' },
      { key: 'open_issues', name: 'Open Issues', value: 14, unit: 'count', status: 'warning' },
      { key: 'safety_score', name: 'Safety Score', value: 92, unit: 'score_0_100', status: 'good' },
      { key: 'cost_performance_index', name: 'CPI', value: 0.96, unit: 'ratio', status: 'good' },
      { key: 'rfi_response_time', name: 'RFI Response Time', value: 3, unit: 'days', status: 'good' },
      { key: 'change_order_rate', name: 'Change Order Rate', value: 2.1, unit: 'percent', status: 'good' },
    ],
  },
  {
    id: '5',
    name: 'Restaurant Buildout',
    address: '1200 K Street NW, Washington DC',
    projectType: 'Commercial Build-Out',
    projectTypeKey: 'COMMERCIAL',
    twinTier: 'L2',
    lifecyclePhase: 'Pre-Construction',
    lifecyclePhaseKey: 'PRECONSTRUCTION',
    progress: 8,
    budget: 320000,
    spent: 25000,
    startDate: '2026-02-01',
    twinHealth: 82,
    enabledModules: ['OS Feasibility', 'OS Development', 'OS Project Management', 'OS Payments', 'Marketplace'],
    milestones: [
      { key: 'DEPOSIT', name: 'Deposit / Mobilization', percentage: 10, status: 'in_progress' },
      { key: 'FOUNDATION', name: 'Foundation Complete', percentage: 15, status: 'upcoming' },
      { key: 'FRAMING', name: 'Framing Complete', percentage: 20, status: 'upcoming' },
      { key: 'MEP_ROUGH', name: 'MEP Rough-In Complete', percentage: 15, status: 'upcoming' },
      { key: 'DRYWALL_INTERIOR', name: 'Drywall & Interior', percentage: 15, status: 'upcoming' },
      { key: 'FINISH', name: 'Finish Work', percentage: 15, status: 'upcoming' },
      { key: 'COMPLETION', name: 'Substantial Completion', percentage: 10, status: 'upcoming' },
    ],
    kpis: [
      { key: 'budget_variance', name: 'Budget Variance', value: 0.0, unit: 'percent', status: 'good' },
      { key: 'schedule_spi', name: 'Schedule Performance Index', value: 1.0, unit: 'ratio', status: 'good' },
      { key: 'completion_pct', name: 'Completion', value: 8, unit: 'percent', status: 'good' },
      { key: 'risk_score', name: 'Risk Score', value: 35, unit: 'score_0_100', status: 'good' },
      { key: 'quality_score', name: 'Quality Score', value: 90, unit: 'score_0_100', status: 'good' },
      { key: 'open_issues', name: 'Open Issues', value: 3, unit: 'count', status: 'good' },
    ],
  },
  {
    id: '6',
    name: 'Mixed-Use Tower Phase 1',
    address: '2200 Wilson Blvd, Arlington VA',
    projectType: 'Mixed-Use Development',
    projectTypeKey: 'MIXED_USE',
    twinTier: 'L3',
    lifecyclePhase: 'Feasibility Study',
    lifecyclePhaseKey: 'FEASIBILITY',
    progress: 3,
    budget: 4500000,
    spent: 135000,
    startDate: '2026-01-15',
    twinHealth: 71,
    enabledModules: ['OS Land', 'OS Feasibility', 'OS Development', 'OS Project Management', 'OS Payments', 'OS Operations', 'Marketplace'],
    milestones: [
      { key: 'DEPOSIT', name: 'Deposit / Mobilization', percentage: 10, status: 'upcoming' },
      { key: 'FOUNDATION', name: 'Foundation Complete', percentage: 15, status: 'upcoming' },
      { key: 'FRAMING', name: 'Framing Complete', percentage: 20, status: 'upcoming' },
      { key: 'MEP_ROUGH', name: 'MEP Rough-In Complete', percentage: 15, status: 'upcoming' },
      { key: 'DRYWALL_INTERIOR', name: 'Drywall & Interior', percentage: 15, status: 'upcoming' },
      { key: 'FINISH', name: 'Finish Work', percentage: 15, status: 'upcoming' },
      { key: 'COMPLETION', name: 'Substantial Completion', percentage: 10, status: 'upcoming' },
    ],
    kpis: [
      { key: 'budget_variance', name: 'Budget Variance', value: 0.0, unit: 'percent', status: 'good' },
      { key: 'schedule_spi', name: 'Schedule Performance Index', value: 0.85, unit: 'ratio', status: 'warning' },
      { key: 'completion_pct', name: 'Completion', value: 3, unit: 'percent', status: 'good' },
      { key: 'risk_score', name: 'Risk Score', value: 72, unit: 'score_0_100', status: 'warning' },
      { key: 'quality_score', name: 'Quality Score', value: 82, unit: 'score_0_100', status: 'good' },
      { key: 'open_issues', name: 'Open Issues', value: 18, unit: 'count', status: 'warning' },
      { key: 'safety_score', name: 'Safety Score', value: 88, unit: 'score_0_100', status: 'good' },
      { key: 'cost_performance_index', name: 'CPI', value: 1.0, unit: 'ratio', status: 'good' },
      { key: 'rfi_response_time', name: 'RFI Response Time', value: 6, unit: 'days', status: 'warning' },
      { key: 'change_order_rate', name: 'Change Order Rate', value: 0.0, unit: 'percent', status: 'good' },
    ],
  },
]

const phaseStyles: Record<string, { bg: string; text: string }> = {
  'CONSTRUCTION':     { bg: 'rgba(42,191,191,0.1)', text: '#2ABFBF' },
  'CLOSEOUT':         { bg: 'rgba(56,161,105,0.1)', text: '#38A169' },
  'PERMITS':          { bg: 'rgba(232,121,58,0.1)', text: '#E8793A' },
  'PRECONSTRUCTION':  { bg: 'rgba(26,43,74,0.1)', text: '#1A2B4A' },
  'FEASIBILITY':      { bg: 'rgba(128,90,213,0.1)', text: '#805AD5' },
  'DESIGN':           { bg: 'rgba(49,130,206,0.1)', text: '#3182CE' },
  'IDEA':             { bg: 'rgba(160,174,192,0.1)', text: '#A0AEC0' },
  'LAND':             { bg: 'rgba(56,161,105,0.1)', text: '#38A169' },
  'INSPECTIONS':      { bg: 'rgba(237,137,54,0.1)', text: '#ED8936' },
  'PAYMENTS':         { bg: 'rgba(232,121,58,0.1)', text: '#E8793A' },
  'OPERATIONS':       { bg: 'rgba(49,130,206,0.1)', text: '#3182CE' },
  'ARCHIVE':          { bg: 'rgba(160,174,192,0.1)', text: '#A0AEC0' },
}

const typeStyles: Record<string, { bg: string; text: string }> = {
  'RENOVATION':  { bg: 'rgba(232,121,58,0.08)', text: '#C66A30' },
  'NEW_HOME':    { bg: 'rgba(42,191,191,0.08)', text: '#229999' },
  'ADDITION':    { bg: 'rgba(49,130,206,0.08)', text: '#2B6CB0' },
  'MULTIFAMILY': { bg: 'rgba(128,90,213,0.08)', text: '#6B46C1' },
  'COMMERCIAL':  { bg: 'rgba(56,161,105,0.08)', text: '#276749' },
  'MIXED_USE':   { bg: 'rgba(214,158,46,0.08)', text: '#B7791F' },
}

const tierColor: Record<string, string> = {
  'L1': '#2ABFBF',
  'L2': '#E8793A',
  'L3': '#805AD5',
}

const healthColor = (score: number) => {
  if (score >= 90) return '#38A169'
  if (score >= 70) return '#E8793A'
  return '#E53E3E'
}

const formatBudget = (amount: number) => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
  return `$${(amount / 1000).toFixed(0)}K`
}

export default function ProjectsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')

  const projectTypes = ['All', 'RENOVATION', 'NEW_HOME', 'ADDITION', 'MULTIFAMILY', 'COMMERCIAL', 'MIXED_USE']
  const typeLabels: Record<string, string> = {
    'All': 'All Types',
    'RENOVATION': 'Renovation',
    'NEW_HOME': 'New Home',
    'ADDITION': 'Addition',
    'MULTIFAMILY': 'Multifamily',
    'COMMERCIAL': 'Commercial',
    'MIXED_USE': 'Mixed-Use',
  }

  const filtered = MOCK_PROJECTS.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'All' || p.projectTypeKey === typeFilter
    return matchSearch && matchType
  })

  const totalBudget = MOCK_PROJECTS.reduce((s, p) => s + p.budget, 0)
  const totalSpent = MOCK_PROJECTS.reduce((s, p) => s + p.spent, 0)
  const activeCount = MOCK_PROJECTS.filter(p => p.lifecyclePhaseKey !== 'ARCHIVE').length
  const avgHealth = Math.round(MOCK_PROJECTS.reduce((s, p) => s + p.twinHealth, 0) / MOCK_PROJECTS.length)

  return (
    <div>
      {/* Overview Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <p className="text-xs text-gray-500">Total Projects</p>
          <p className="mt-1 text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>{MOCK_PROJECTS.length}</p>
        </div>
        <div className="rounded-xl bg-white p-4" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <p className="text-xs text-gray-500">Active</p>
          <p className="mt-1 text-2xl font-bold font-display" style={{ color: '#2ABFBF' }}>{activeCount}</p>
        </div>
        <div className="rounded-xl bg-white p-4" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <p className="text-xs text-gray-500">Total Budget</p>
          <p className="mt-1 text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>{formatBudget(totalBudget)}</p>
        </div>
        <div className="rounded-xl bg-white p-4" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <p className="text-xs text-gray-500">Avg Twin Health</p>
          <p className="mt-1 text-2xl font-bold font-display" style={{ color: healthColor(avgHealth) }}>{avgHealth}%</p>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>My Projects</h1>
          <p className="mt-1 text-sm text-gray-500">{MOCK_PROJECTS.length} projects across your portfolio</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: '#E8793A' }}
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {/* Search + Filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {projectTypes.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                typeFilter === t ? '' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={typeFilter === t ? { backgroundColor: 'rgba(42,191,191,0.15)', color: '#2ABFBF' } : undefined}
            >
              {typeLabels[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Project Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((project) => {
          const phase = phaseStyles[project.lifecyclePhaseKey] || phaseStyles['CONSTRUCTION']
          const type = typeStyles[project.projectTypeKey] || typeStyles['RENOVATION']
          const paidMilestones = project.milestones.filter(m => m.status === 'paid').length
          const inProgressMilestones = project.milestones.filter(m => m.status === 'in_progress').length

          return (
            <Link
              key={project.id}
              href={`/project/${project.id}`}
              className="group overflow-hidden rounded-xl bg-white transition-all hover:shadow-md"
              style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
            >
              {/* Color accent bar */}
              <div className="h-1" style={{ backgroundColor: phase.text }} />

              <div className="p-5">
                {/* Header: Name + Badges */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold group-hover:opacity-80" style={{ color: '#1A2B4A' }}>{project.name}</h3>
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{project.address}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap"
                      style={{ backgroundColor: phase.bg, color: phase.text }}
                    >
                      {project.lifecyclePhase}
                    </span>
                  </div>
                </div>

                {/* Type + Tier Row */}
                <div className="mb-3 flex items-center gap-2 flex-wrap">
                  <span
                    className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: type.bg, color: type.text }}
                  >
                    <Layers className="h-3 w-3" />
                    {project.projectType}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: `${tierColor[project.twinTier]}15`, color: tierColor[project.twinTier] }}
                  >
                    <Cpu className="h-3 w-3" />
                    Twin {project.twinTier}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="mb-1 flex justify-between text-xs text-gray-500">
                    <span>Overall Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${project.progress}%`, backgroundColor: phase.text }}
                    />
                  </div>
                </div>

                {/* Payment Milestone Progress - 7 dots */}
                <div className="mb-3">
                  <p className="mb-1.5 text-xs text-gray-500">Payment Milestones</p>
                  <div className="flex items-center gap-1">
                    {project.milestones.map((m, i) => (
                      <div key={m.key} className="group/ms relative flex-1">
                        <div
                          className="h-2.5 rounded-sm transition-all"
                          style={{
                            backgroundColor:
                              m.status === 'paid' ? '#38A169' :
                              m.status === 'in_progress' ? '#E8793A' :
                              '#E2E8F0',
                          }}
                        />
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover/ms:block z-10">
                          <div className="rounded bg-gray-900 px-2 py-1 text-xs text-white whitespace-nowrap">
                            {m.name} ({m.percentage}%)
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-gray-400">
                    <span>{paidMilestones} paid</span>
                    {inProgressMilestones > 0 && <span className="font-medium" style={{ color: '#E8793A' }}>{inProgressMilestones} in progress</span>}
                    <span>{7 - paidMilestones - inProgressMilestones} upcoming</span>
                  </div>
                </div>

                {/* Active Modules */}
                <div className="mb-3">
                  <p className="mb-1 text-xs text-gray-500">Active Modules</p>
                  <div className="flex flex-wrap gap-1">
                    {project.enabledModules.map((mod) => (
                      <span
                        key={mod}
                        className="rounded bg-gray-50 px-1.5 py-0.5 text-xs text-gray-600 border border-gray-100"
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Twin Health + KPI Summary + Budget */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" style={{ color: healthColor(project.twinHealth) }} />
                      <span className="font-medium" style={{ color: healthColor(project.twinHealth) }}>{project.twinHealth}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{formatBudget(project.spent)} / {formatBudget(project.budget)}</span>
                    <ChevronRight className="h-3 w-3 text-gray-300 transition-colors group-hover:text-teal" />
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl bg-white py-16 text-center" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <Search className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-sm font-medium" style={{ color: '#1A2B4A' }}>No projects found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter</p>
        </div>
      )}
    </div>
  )
}
