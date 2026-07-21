'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Plus, Search, MapPin, Calendar, ChevronRight, Activity,
  Layers, Cpu, AlertTriangle,
} from 'lucide-react'
import { listProjects } from '@/lib/api/owner'
import type { Project } from '@/lib/api/owner'

// ── Helpers ───────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className ?? ''}`} />
}

const phaseStyles: Record<string, { bg: string; text: string }> = {
  CONSTRUCTION:    { bg: 'rgba(42,191,191,0.1)', text: '#2ABFBF' },
  CLOSEOUT:        { bg: 'rgba(56,161,105,0.1)', text: '#38A169' },
  PERMITS:         { bg: 'rgba(232,121,58,0.1)', text: '#E8793A' },
  PRECONSTRUCTION: { bg: 'rgba(26,43,74,0.1)',  text: '#1A2B4A' },
  FEASIBILITY:     { bg: 'rgba(128,90,213,0.1)', text: '#805AD5' },
  DESIGN:          { bg: 'rgba(49,130,206,0.1)', text: '#3182CE' },
  IDEA:            { bg: 'rgba(160,174,192,0.1)', text: '#A0AEC0' },
  LAND:            { bg: 'rgba(56,161,105,0.1)', text: '#38A169' },
  INSPECTIONS:     { bg: 'rgba(237,137,54,0.1)', text: '#ED8936' },
  OPERATIONS:      { bg: 'rgba(49,130,206,0.1)', text: '#3182CE' },
  ARCHIVE:         { bg: 'rgba(160,174,192,0.1)', text: '#A0AEC0' },
}

const tierColor: Record<string, string> = {
  L1: '#2ABFBF',
  L2: '#E8793A',
  L3: '#805AD5',
}

const healthColor = (score: number | null) => {
  if (!score) return '#9CA3AF'
  if (score >= 90) return '#38A169'
  if (score >= 70) return '#E8793A'
  return '#E53E3E'
}

const formatBudget = (amount: number | null) => {
  if (!amount) return '—'
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  return `$${(amount / 1000).toFixed(0)}K`
}

function ProjectCard({ project }: { project: Project }) {
  const phaseKey = (project.lifecyclePhase ?? 'IDEA').toUpperCase().replace(/\s+/g, '_')
  const phase = phaseStyles[phaseKey] ?? phaseStyles['IDEA']
  const progress = project.progressPct ?? 0

  return (
    <Link
      href={`/project/${project.id}`}
      className="group overflow-hidden rounded-xl bg-white transition-all hover:shadow-md"
      style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
    >
      {/* Phase accent bar */}
      <div className="h-1" style={{ backgroundColor: phase.text }} />

      <div className="p-5">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-bold group-hover:opacity-80" style={{ color: '#1A2B4A' }}>
              {project.name}
            </h3>
            {(project.city || project.address) && (
              <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {project.address
                    ? `${project.address}${project.city ? `, ${project.city}` : ''}`
                    : project.city}
                </span>
              </div>
            )}
          </div>
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ backgroundColor: phase.bg, color: phase.text }}
          >
            {project.lifecyclePhase ?? 'Idea'}
          </span>
        </div>

        {/* Type + Tier */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {project.category && (
            <span
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: 'rgba(232,121,58,0.08)', color: '#C66A30' }}
            >
              <Layers className="h-3 w-3" />
              {project.category.replace(/_/g, ' ')}
            </span>
          )}
          {project.twinTier && (
            <span
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold"
              style={{
                backgroundColor: `${tierColor[project.twinTier] ?? '#9CA3AF'}15`,
                color: tierColor[project.twinTier] ?? '#9CA3AF',
              }}
            >
              <Cpu className="h-3 w-3" />
              Twin {project.twinTier}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {progress > 0 && (
          <div className="mb-3">
            <div className="mb-1 flex justify-between text-xs text-gray-500">
              <span>Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${progress}%`, backgroundColor: phase.text }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
          <div className="flex items-center gap-3">
            {project.startDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
            )}
            {project.twinHealthScore !== null && (
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3" style={{ color: healthColor(project.twinHealthScore) }} />
                <span className="font-medium" style={{ color: healthColor(project.twinHealthScore) }}>
                  {project.twinHealthScore}%
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">
              {formatBudget(project.spentToDate)} / {formatBudget(project.totalBudget)}
            </span>
            <ChevronRight className="h-3 w-3 text-gray-300 transition-colors group-hover:text-teal-500" />
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const data = await listProjects()
        if (mounted) setProjects(data.projects)
      } catch (err: any) {
        if (mounted) setError(err.message ?? 'Failed to load projects')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // ── Filter ─────────────────────────────────────────────────────────────────

  const categories = ['All', ...Array.from(new Set(projects.map(p => p.category ?? 'UNKNOWN').filter(Boolean)))]
  const categoryLabels: Record<string, string> = {
    All: 'All Types',
    RENOVATION: 'Renovation',
    NEW_HOME: 'New Home',
    ADDITION: 'Addition',
    MULTIFAMILY: 'Multifamily',
    COMMERCIAL: 'Commercial',
    MIXED_USE: 'Mixed-Use',
  }

  const filtered = projects.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.address ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.city ?? '').toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'All' || p.category === typeFilter
    return matchSearch && matchType
  })

  // ── Stats ──────────────────────────────────────────────────────────────────

  const totalBudget = projects.reduce((s, p) => s + (p.totalBudget ?? 0), 0)
  const activeCount = projects.filter(p => p.status !== 'ARCHIVED').length
  const avgHealth = projects.length > 0
    ? Math.round(projects.reduce((s, p) => s + (p.twinHealthScore ?? 0), 0) / projects.length)
    : 0

  return (
    <div>
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <p className="text-xs text-gray-500">Total Projects</p>
          {loading ? <Skeleton className="mt-1 h-8 w-12" /> : (
            <p className="mt-1 text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>{projects.length}</p>
          )}
        </div>
        <div className="rounded-xl bg-white p-4" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <p className="text-xs text-gray-500">Active</p>
          {loading ? <Skeleton className="mt-1 h-8 w-12" /> : (
            <p className="mt-1 text-2xl font-bold font-display" style={{ color: '#2ABFBF' }}>{activeCount}</p>
          )}
        </div>
        <div className="rounded-xl bg-white p-4" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <p className="text-xs text-gray-500">Total Budget</p>
          {loading ? <Skeleton className="mt-1 h-8 w-24" /> : (
            <p className="mt-1 text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>
              {formatBudget(totalBudget)}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-white p-4" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <p className="text-xs text-gray-500">Avg Twin Health</p>
          {loading ? <Skeleton className="mt-1 h-8 w-12" /> : (
            <p className="mt-1 text-2xl font-bold font-display" style={{ color: healthColor(avgHealth) }}>
              {avgHealth}%
            </p>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>My Projects</h1>
          {!loading && (
            <p className="mt-1 text-sm text-gray-500">{projects.length} project{projects.length !== 1 ? 's' : ''} in your portfolio</p>
          )}
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
            placeholder="Search projects…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none"
            onFocus={e => { e.target.style.borderColor = '#2ABFBF'; e.target.style.boxShadow = '0 0 0 1px #2ABFBF' }}
            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {categories.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
              style={
                typeFilter === t
                  ? { backgroundColor: 'rgba(42,191,191,0.15)', color: '#2ABFBF' }
                  : { backgroundColor: '#F3F4F6', color: '#6B7280' }
              }
            >
              {categoryLabels[t] ?? t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Project grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-white py-16 text-center" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}>
          <Search className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-sm font-medium" style={{ color: '#1A2B4A' }}>
            {projects.length === 0 ? 'No projects yet' : 'No projects found'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {projects.length === 0
              ? 'Create your first project to get started'
              : 'Try adjusting your search or filter'}
          </p>
          {projects.length === 0 && (
            <Link
              href="/projects/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: '#E8793A' }}
            >
              <Plus className="h-4 w-4" />New Project
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
