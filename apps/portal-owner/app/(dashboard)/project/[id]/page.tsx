'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Calendar, DollarSign, CheckCircle, Clock, AlertTriangle,
  Layers, Cpu, Activity, Boxes, RefreshCw,
} from 'lucide-react'
import { getProject, getProjectReadiness } from '@/lib/api/owner'
import type { Project, ProjectReadiness, ReadinessStatus } from '@/lib/api/owner'

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

const readinessStatusConfig: Record<ReadinessStatus, { label: string; bg: string; text: string; icon: typeof CheckCircle }> = {
  NOT_STARTED:  { label: 'Not Started',  bg: 'rgba(160,174,192,0.1)', text: '#A0AEC0', icon: Clock },
  IN_PROGRESS:  { label: 'In Progress',  bg: 'rgba(49,130,206,0.1)',  text: '#3182CE', icon: RefreshCw },
  NEEDS_ATTENTION: { label: 'Needs Attention', bg: 'rgba(234,179,8,0.12)', text: '#92400E', icon: AlertTriangle },
  READY:        { label: 'Ready',        bg: 'rgba(56,161,105,0.1)',  text: '#38A169', icon: CheckCircle },
  OVERRIDDEN:   { label: 'Overridden',   bg: 'rgba(128,90,213,0.1)', text: '#805AD5', icon: CheckCircle },
}

const phaseStyles: Record<string, { bg: string; text: string }> = {
  CONSTRUCTION:    { bg: 'rgba(42,191,191,0.1)', text: '#2ABFBF' },
  CLOSEOUT:        { bg: 'rgba(56,161,105,0.1)', text: '#38A169' },
  PERMITS:         { bg: 'rgba(232,121,58,0.1)', text: '#E8793A' },
  PRECONSTRUCTION: { bg: 'rgba(26,43,74,0.1)',  text: '#1A2B4A' },
  FEASIBILITY:     { bg: 'rgba(128,90,213,0.1)', text: '#805AD5' },
  DESIGN:          { bg: 'rgba(49,130,206,0.1)', text: '#3182CE' },
}

const tierColor: Record<string, string> = {
  L1: '#2ABFBF', L2: '#E8793A', L3: '#805AD5',
}

// ── Readiness Panel ───────────────────────────────────────────────────────────

function ReadinessPanel({ readiness }: { readiness: ProjectReadiness }) {
  const overallConfig = readinessStatusConfig[readiness.overallStatus]
  const OverallIcon = overallConfig.icon
  const pct = readiness.totalCount > 0
    ? Math.round((readiness.readyCount / readiness.totalCount) * 100)
    : 0

  const grouped = readiness.items.reduce<Record<string, typeof readiness.items>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* Overall status */}
      <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: overallConfig.bg }}
        >
          <OverallIcon className="h-6 w-6" style={{ color: overallConfig.text }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold" style={{ color: '#1A2B4A' }}>Construction Readiness</p>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: overallConfig.bg, color: overallConfig.text }}
            >
              {overallConfig.label}
            </span>
          </div>
          <div className="mt-2">
            <div className="mb-1 flex justify-between text-xs text-gray-500">
              <span>{readiness.readyCount} of {readiness.totalCount} items ready</span>
              <span className="font-medium">{pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: overallConfig.text }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Items by category */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-3">
            <h4 className="text-sm font-semibold capitalize" style={{ color: '#1A2B4A' }}>
              {category.replace(/_/g, ' ')}
            </h4>
          </div>
          <div className="divide-y divide-gray-100">
            {items.map(item => {
              const config = readinessStatusConfig[item.status]
              const ItemIcon = config.icon
              return (
                <div key={item.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <ItemIcon className="h-4 w-4 flex-shrink-0" style={{ color: config.text }} />
                    <div>
                      <p className="text-sm" style={{ color: '#1A2B4A' }}>{item.label}</p>
                      {item.notes && (
                        <p className="text-xs text-gray-400">{item.notes}</p>
                      )}
                    </div>
                    {item.required && (
                      <span className="rounded px-1.5 py-0.5 text-xs font-medium" style={{ backgroundColor: 'rgba(229,62,62,0.08)', color: '#C53030' }}>
                        Required
                      </span>
                    )}
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: config.bg, color: config.text }}
                  >
                    {config.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {readiness.items.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white py-10 text-center">
          <CheckCircle className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">No readiness items yet</p>
          <p className="text-xs text-gray-400">Items will appear as your project progresses</p>
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [readiness, setReadiness] = useState<ProjectReadiness | null>(null)
  const [loading, setLoading] = useState(true)
  const [readinessLoading, setReadinessLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'readiness'>('overview')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const { project: p } = await getProject(params.id)
        if (mounted) setProject(p)
      } catch (err: any) {
        if (mounted) setError(err.message ?? 'Failed to load project')
      } finally {
        if (mounted) setLoading(false)
      }

      // Load readiness in parallel (non-blocking)
      try {
        const { readiness: r } = await getProjectReadiness(params.id)
        if (mounted) setReadiness(r)
      } catch {
        // readiness is optional — don't surface as error
      } finally {
        if (mounted) setReadinessLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [params.id])

  if (error) {
    return (
      <div>
        <Link href="/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />Back to projects
        </Link>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle className="mb-3 h-10 w-10 text-amber-500" />
          <p className="text-sm font-medium text-gray-700">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: '#E8793A' }}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  const phaseKey = (project?.lifecyclePhase ?? 'IDEA').toUpperCase().replace(/\s+/g, '_')
  const phase = phaseStyles[phaseKey] ?? phaseStyles['PRECONSTRUCTION'] ?? { bg: 'rgba(160,174,192,0.1)', text: '#A0AEC0' }
  const progress = project?.progressPct ?? 0
  const health = project?.twinHealthScore ?? null

  return (
    <div>
      <Link href="/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />Back to projects
      </Link>

      {/* Project header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {loading ? (
            <Skeleton className="h-8 w-72" />
          ) : (
            <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>
              {project?.name}
            </h1>
          )}
          {project && (project.address || project.city) && (
            <p className="mt-1 text-sm text-gray-600">
              {project.address}{project.city ? `, ${project.city}` : ''}
              {project.state ? `, ${project.state}` : ''}
            </p>
          )}
          {!loading && project && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {project.category && (
                <span
                  className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium"
                  style={{ backgroundColor: 'rgba(232,121,58,0.08)', color: '#C66A30' }}
                >
                  <Layers className="h-3 w-3" />
                  {project.category.replace(/_/g, ' ')}
                </span>
              )}
              {project.twinTier && (
                <span
                  className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: `${tierColor[project.twinTier] ?? '#9CA3AF'}15`,
                    color: tierColor[project.twinTier] ?? '#9CA3AF',
                  }}
                >
                  <Cpu className="h-3 w-3" />Twin {project.twinTier}
                </span>
              )}
              {project.lifecyclePhase && (
                <span
                  className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium"
                  style={{ backgroundColor: phase.bg, color: phase.text }}
                >
                  <Activity className="h-3 w-3" />{project.lifecyclePhase}
                </span>
              )}
            </div>
          )}
        </div>
        <Link
          href={`/twin/${params.id}`}
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          style={{ backgroundColor: '#E8793A', borderColor: '#E8793A' }}
        >
          <Boxes className="h-4 w-4" />Digital Twin
        </Link>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Progress</p>
          {loading ? <Skeleton className="mt-1 h-8 w-16" /> : (
            <>
              <p className="font-display mt-1 text-2xl font-bold" style={{ color: '#1A2B4A' }}>{progress}%</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: '#2ABFBF' }} />
              </div>
            </>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Total Budget</p>
          {loading ? <Skeleton className="mt-1 h-8 w-24" /> : (
            <p className="font-display mt-1 text-2xl font-bold" style={{ color: '#1A2B4A' }}>
              {project?.totalBudget ? `$${project.totalBudget.toLocaleString()}` : '—'}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Paid to Date</p>
          {loading ? <Skeleton className="mt-1 h-8 w-24" /> : (
            <p className="font-display mt-1 text-2xl font-bold" style={{ color: '#38A169' }}>
              {project?.spentToDate ? `$${project.spentToDate.toLocaleString()}` : '—'}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Twin Health</p>
          {loading ? <Skeleton className="mt-1 h-8 w-16" /> : (
            <>
              <p className="font-display mt-1 text-2xl font-bold" style={{ color: healthColor(health) }}>
                {health !== null ? `${health}%` : '—'}
              </p>
              {health !== null && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full" style={{ width: `${health}%`, backgroundColor: healthColor(health) }} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Est. completion */}
      {project?.estimatedCompletionDate && (
        <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-500">Est. completion:</span>
          <span className="font-medium" style={{ color: '#1A2B4A' }}>
            {new Date(project.estimatedCompletionDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6">
          {([
            { key: 'overview' as const, label: 'Overview' },
            { key: 'readiness' as const, label: 'Construction Readiness' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="border-b-2 pb-3 text-sm font-medium transition-colors"
              style={{
                borderColor: activeTab === tab.key ? '#2ABFBF' : 'transparent',
                color: activeTab === tab.key ? '#2ABFBF' : '#6B7280',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : project ? (
            <>
              {project.description && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-2 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Description</h3>
                  <p className="text-sm text-gray-600">{project.description}</p>
                </div>
              )}

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Project Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                  {[
                    { label: 'Status', value: project.status ?? '—' },
                    { label: 'Phase', value: project.lifecyclePhase ?? '—' },
                    { label: 'Category', value: project.category?.replace(/_/g, ' ') ?? '—' },
                    { label: 'Twin Tier', value: project.twinTier ?? '—' },
                    {
                      label: 'Start Date',
                      value: project.startDate
                        ? new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—',
                    },
                    {
                      label: 'Created',
                      value: new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className="mt-0.5 font-medium capitalize" style={{ color: '#1A2B4A' }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Readiness tab */}
      {activeTab === 'readiness' && (
        readinessLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
        ) : readiness ? (
          <ReadinessPanel readiness={readiness} />
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
            <CheckCircle className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">Readiness checklist not yet initialized</p>
            <p className="text-xs text-gray-400">A checklist will be generated when pre-construction begins</p>
          </div>
        )
      )}
    </div>
  )
}
