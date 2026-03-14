'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  FolderKanban, ArrowRight, Activity, AlertTriangle, CheckCircle,
  Calendar, DollarSign, Clock,
} from 'lucide-react'
import { listProjects, getProjectReadiness } from '@/lib/api/owner'
import type { Project, ReadinessStatus } from '@/lib/api/owner'

// ── Helpers ───────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className ?? ''}`} />
}

const healthColor = (score: number | null) => {
  if (!score) return '#9CA3AF'
  if (score >= 90) return '#38A169'
  if (score >= 70) return '#E8793A'
  return '#E53E3E'
}

const phaseStyles: Record<string, string> = {
  CONSTRUCTION:    '#2ABFBF',
  CLOSEOUT:        '#38A169',
  PERMITS:         '#E8793A',
  PRECONSTRUCTION: '#1A2B4A',
  FEASIBILITY:     '#805AD5',
  DESIGN:          '#3182CE',
  IDEA:            '#A0AEC0',
}

const readinessStatusConfig: Record<ReadinessStatus, { bg: string; text: string }> = {
  NOT_STARTED:     { bg: 'rgba(160,174,192,0.1)', text: '#A0AEC0' },
  IN_PROGRESS:     { bg: 'rgba(49,130,206,0.1)',  text: '#3182CE' },
  NEEDS_ATTENTION: { bg: 'rgba(234,179,8,0.12)',  text: '#92400E' },
  READY:           { bg: 'rgba(56,161,105,0.1)',  text: '#38A169' },
  OVERRIDDEN:      { bg: 'rgba(128,90,213,0.1)',  text: '#805AD5' },
}

const formatBudget = (amount: number | null) => {
  if (!amount) return '—'
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  return `$${(amount / 1000).toFixed(0)}K`
}

// ── Project row card ──────────────────────────────────────────────────────────

function ProjectRow({
  project,
  readinessStatus,
}: {
  project: Project
  readinessStatus: ReadinessStatus | null
}) {
  const phaseKey = (project.lifecyclePhase ?? 'IDEA').toUpperCase().replace(/\s+/g, '_')
  const phaseColor = phaseStyles[phaseKey] ?? '#A0AEC0'
  const rs = readinessStatus ? readinessStatusConfig[readinessStatus] : null
  const progress = project.progressPct ?? 0

  return (
    <Link
      href={`/project/${project.id}`}
      className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
    >
      {/* Phase indicator */}
      <div
        className="h-10 w-1 flex-shrink-0 rounded-full"
        style={{ backgroundColor: phaseColor }}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold" style={{ color: '#1A2B4A' }}>
            {project.name}
          </p>
          {project.lifecyclePhase && (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: `${phaseColor}20`, color: phaseColor }}
            >
              {project.lifecyclePhase}
            </span>
          )}
        </div>
        {/* Progress bar */}
        {progress > 0 && (
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${progress}%`, backgroundColor: phaseColor }}
            />
          </div>
        )}
      </div>

      {/* Budget */}
      <div className="hidden text-right sm:block">
        <p className="text-xs text-gray-400">Budget</p>
        <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>
          {formatBudget(project.totalBudget)}
        </p>
      </div>

      {/* Twin health */}
      {project.twinHealthScore !== null && (
        <div className="hidden text-right sm:block">
          <p className="text-xs text-gray-400">Health</p>
          <p className="text-sm font-semibold" style={{ color: healthColor(project.twinHealthScore) }}>
            {project.twinHealthScore}%
          </p>
        </div>
      )}

      {/* Readiness badge */}
      {rs && (
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
          style={{ backgroundColor: rs.bg, color: rs.text }}
        >
          {readinessStatus!.replace(/_/g, ' ')}
        </span>
      )}

      <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-300 group-hover:text-gray-500" />
    </Link>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OwnerDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [readinessMap, setReadinessMap] = useState<Record<string, ReadinessStatus>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const { projects: ps } = await listProjects()
        if (!mounted) return
        setProjects(ps)

        // Load readiness for each project (fire-and-forget, no blocking)
        const map: Record<string, ReadinessStatus> = {}
        await Promise.all(
          ps.slice(0, 6).map(async p => {
            try {
              const { readiness } = await getProjectReadiness(p.id)
              if (mounted) map[p.id] = readiness.overallStatus
            } catch {
              // not all projects have readiness — ok
            }
          }),
        )
        if (mounted) setReadinessMap(map)
      } catch (err: any) {
        if (mounted) setError(err.message ?? 'Failed to load dashboard')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const activeProjects = projects.filter(p => p.status !== 'ARCHIVED')
  const totalBudget = projects.reduce((s, p) => s + (p.totalBudget ?? 0), 0)
  const avgHealth = projects.length > 0
    ? Math.round(projects.reduce((s, p) => s + (p.twinHealthScore ?? 0), 0) / projects.length)
    : 0
  const needsAttention = Object.values(readinessMap).filter(s => s === 'NEEDS_ATTENTION').length

  return (
    <div>
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>
          Owner Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">Your construction portfolio at a glance</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Active Projects</p>
          {loading ? <Skeleton className="mt-1 h-8 w-12" /> : (
            <p className="mt-1 text-2xl font-bold font-display" style={{ color: '#2ABFBF' }}>
              {activeProjects.length}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Total Budget</p>
          {loading ? <Skeleton className="mt-1 h-8 w-24" /> : (
            <p className="mt-1 text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>
              {formatBudget(totalBudget)}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Avg Twin Health</p>
          {loading ? <Skeleton className="mt-1 h-8 w-16" /> : (
            <p className="mt-1 text-2xl font-bold font-display" style={{ color: healthColor(avgHealth) }}>
              {avgHealth > 0 ? `${avgHealth}%` : '—'}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Needs Attention</p>
          {loading ? <Skeleton className="mt-1 h-8 w-12" /> : (
            <p className="mt-1 text-2xl font-bold font-display" style={{ color: needsAttention > 0 ? '#E53E3E' : '#38A169' }}>
              {needsAttention}
            </p>
          )}
        </div>
      </div>

      {/* Attention banner */}
      {!loading && needsAttention > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              {needsAttention} project{needsAttention > 1 ? 's' : ''} need readiness attention
            </p>
            <p className="text-xs text-amber-700">Review the checklist to ensure construction can begin</p>
          </div>
          <Link href="/projects" className="text-xs font-semibold text-amber-700 hover:underline">
            Review →
          </Link>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Projects panel */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4" style={{ color: '#E8793A' }} />
            <span className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>My Projects</span>
          </div>
          <Link href="/projects" className="flex items-center gap-1 text-xs font-medium" style={{ color: '#2ABFBF' }}>
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : projects.length === 0 ? (
            <div className="py-10 text-center">
              <FolderKanban className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">No projects yet</p>
              <Link
                href="/projects/new"
                className="mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: '#E8793A' }}
              >
                Create first project
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 8).map(p => (
                <ProjectRow
                  key={p.id}
                  project={p}
                  readinessStatus={readinessMap[p.id] ?? null}
                />
              ))}
              {projects.length > 8 && (
                <Link
                  href="/projects"
                  className="block text-center py-2 text-xs font-medium"
                  style={{ color: '#2ABFBF' }}
                >
                  View {projects.length - 8} more projects →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
