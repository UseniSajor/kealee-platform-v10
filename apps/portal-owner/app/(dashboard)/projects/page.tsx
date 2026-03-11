'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, MapPin, Calendar, ChevronRight, Boxes, Activity, Layers, Cpu, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

type MilestoneStatus = 'paid' | 'in_progress' | 'upcoming'

interface ProjectMilestone {
  key: string
  name: string
  percentage: number
  status: MilestoneStatus
}

interface UIProject {
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

const DEFAULT_MILESTONES: ProjectMilestone[] = [
  { key: 'DEPOSIT', name: 'Deposit / Mobilization', percentage: 10, status: 'upcoming' },
  { key: 'FOUNDATION', name: 'Foundation Complete', percentage: 15, status: 'upcoming' },
  { key: 'FRAMING', name: 'Framing Complete', percentage: 20, status: 'upcoming' },
  { key: 'MEP_ROUGH', name: 'MEP Rough-In Complete', percentage: 15, status: 'upcoming' },
  { key: 'DRYWALL_INTERIOR', name: 'Drywall & Interior', percentage: 15, status: 'upcoming' },
  { key: 'FINISH', name: 'Finish Work', percentage: 15, status: 'upcoming' },
  { key: 'COMPLETION', name: 'Substantial Completion', percentage: 10, status: 'upcoming' },
]

const CATEGORY_LABELS: Record<string, { label: string; key: string }> = {
  KITCHEN: { label: 'Kitchen Remodel', key: 'RENOVATION' },
  BATHROOM: { label: 'Bathroom Remodel', key: 'RENOVATION' },
  RENOVATION: { label: 'Renovation / Remodel', key: 'RENOVATION' },
  ADDITION: { label: 'Home Addition', key: 'ADDITION' },
  NEW_CONSTRUCTION: { label: 'New Home Construction', key: 'NEW_HOME' },
  OTHER: { label: 'Other', key: 'COMMERCIAL' },
}

/** Map API project to the UI shape, filling defaults for fields the API may not return */
function toUIProject(p: Record<string, unknown>): UIProject {
  const cat = (p.category as string) || 'OTHER'
  const meta = (p.categoryMetadata as Record<string, unknown>) || {}
  const catInfo = CATEGORY_LABELS[cat] || { label: cat, key: 'COMMERCIAL' }
  const status = (p.status as string) || 'DRAFT'
  const statusPhaseMap: Record<string, { phase: string; key: string }> = {
    DRAFT: { phase: 'Draft', key: 'IDEA' },
    READINESS: { phase: 'Pre-Construction', key: 'PRECONSTRUCTION' },
    CONTRACTING: { phase: 'Contracting', key: 'PRECONSTRUCTION' },
    ACTIVE: { phase: 'Construction', key: 'CONSTRUCTION' },
    CLOSEOUT: { phase: 'Closeout', key: 'CLOSEOUT' },
    COMPLETED: { phase: 'Complete', key: 'ARCHIVE' },
    CANCELLED: { phase: 'Cancelled', key: 'ARCHIVE' },
  }
  const phaseInfo = statusPhaseMap[status] || statusPhaseMap.DRAFT
  return {
    id: p.id as string,
    name: (p.name as string) || 'Untitled Project',
    address: (meta.location as string) || '',
    projectType: catInfo.label,
    projectTypeKey: catInfo.key,
    twinTier: 'L1',
    lifecyclePhase: phaseInfo.phase,
    lifecyclePhaseKey: phaseInfo.key,
    progress: 0,
    budget: (p.budgetTotal as number) || 0,
    spent: 0,
    startDate: (p.startDate as string) || (p.createdAt as string) || new Date().toISOString(),
    twinHealth: 80,
    enabledModules: ['OS Project Management', 'OS Payments'],
    milestones: DEFAULT_MILESTONES,
    kpis: [],
  }
}

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
  const [projects, setProjects] = useState<UIProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProjects() {
      try {
        const data = await api.listMyProjects()
        setProjects(data.projects.map((p) => toUIProject(p as unknown as Record<string, unknown>)))
      } catch (err) {
        console.warn('[portal-owner] Failed to fetch projects from API, showing empty state:', (err as Error).message)
        setError((err as Error).message)
        setProjects([])
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

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

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'All' || p.projectTypeKey === typeFilter
    return matchSearch && matchType
  })

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0)
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0)
  const activeCount = projects.filter(p => p.lifecyclePhaseKey !== 'ARCHIVE').length
  const avgHealth = projects.length > 0 ? Math.round(projects.reduce((s, p) => s + p.twinHealth, 0) / projects.length) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#2ABFBF' }} />
      </div>
    )
  }

  return (
    <div>
      {/* Overview Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <p className="text-xs text-gray-500">Total Projects</p>
          <p className="mt-1 text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>{projects.length}</p>
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
          <p className="mt-1 text-sm text-gray-500">{projects.length} projects across your portfolio</p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: '#E8793A' }}
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
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
