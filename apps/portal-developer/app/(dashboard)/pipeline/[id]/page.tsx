'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Building2, Layers, DollarSign, Ruler, Box,
  CheckCircle, AlertCircle, Loader2, Activity, Cpu,
} from 'lucide-react'
import { apiFetch, ApiError } from '@/lib/api/client'

// Matches the write side in ../page.tsx — the pipeline list hands its already
// in-memory project record off here so "View Details" / "Twin Dashboard" don't
// need a redundant fetch (and still work when the list is showing seed data).
const PROJECT_CACHE_PREFIX = 'kealee:pipeline-project:'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface TwinKPI {
  id: string
  kpiKey: string
  label: string
  category: string
  currentValue: number
  unit: string | null
  targetValue: number | null
  status: string
}

interface TwinRecord {
  id: string
  tier: string
  status: string
  healthStatus: string
  healthScore: number
  currentPhase: string | null
  enabledModules: string[]
  kpis?: TwinKPI[]
}

const healthColor = (status: string | undefined) => {
  if (status === 'HEALTHY') return '#38A169'
  if (status === 'AT_RISK') return '#E8793A'
  if (status === 'CRITICAL') return '#E53E3E'
  return '#94A3B8'
}

function fmtMoney(v: number | null | undefined): string | null {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return null
  const n = Number(v)
  return n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}K`
}

export default function PipelineProjectDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { tab?: string }
}) {
  const [project, setProject] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [twin, setTwin] = useState<TwinRecord | null>(null)
  const [twinLoading, setTwinLoading] = useState(true)
  const [twinError, setTwinError] = useState<string | null>(null)

  const [tab, setTab] = useState<'overview' | 'twin'>(searchParams?.tab === 'twin' ? 'twin' : 'overview')

  useEffect(() => {
    const cached = typeof window !== 'undefined' ? sessionStorage.getItem(`${PROJECT_CACHE_PREFIX}${params.id}`) : null
    if (cached) {
      try {
        setProject(JSON.parse(cached))
        setLoading(false)
        return
      } catch {
        // fall through to live fetch
      }
    }

    if (!UUID_RE.test(params.id)) {
      setError('This is demo pipeline data with no backing project record — open it from the pipeline list instead of a direct link.')
      setLoading(false)
      return
    }

    apiFetch<{ project: Record<string, any> }>(`/projects/${params.id}`)
      .then(({ project }) => setProject(project))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load project'))
      .finally(() => setLoading(false))
  }, [params.id])

  useEffect(() => {
    if (!UUID_RE.test(params.id)) {
      setTwinLoading(false)
      return
    }
    apiFetch<{ twin: TwinRecord }>(`/api/v1/twins/project/${params.id}`)
      .then(({ twin }) => setTwin(twin))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setTwinError('No Digital Twin found for this project yet.')
        } else {
          setTwinError(err instanceof ApiError ? err.message : 'Failed to load Digital Twin')
        }
      })
      .finally(() => setTwinLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div>
        <Link href="/pipeline" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to pipeline
        </Link>
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error ?? 'Project not found.'}</span>
        </div>
      </div>
    )
  }

  const name = project.name ?? 'Untitled Project'
  const address = [project.address, project.city, project.state].filter(Boolean).join(', ')
  const budget = fmtMoney(project.totalBudget ?? project.budgetTotal ?? project.budget)
  const phase = project.phase ?? project.currentPhase ?? project.lifecyclePhase ?? project.status
  const projectType = project.projectType ?? project.category
  const acres = project.acres
  const units = project.units
  const capitalStack = project.capitalStack as
    | { seniorDebt: number; mezzanine: number; lpEquity: number; gpEquity: number }
    | undefined
  const listTwinHealth = project.twinHealth ?? project.twinHealthScore

  return (
    <div>
      <Link href="/pipeline" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Back to pipeline
      </Link>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>{name}</h1>
          {address && (
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="h-3.5 w-3.5" /> {address}
            </p>
          )}
        </div>
        {phase && (
          <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">{phase}</span>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6">
          {([
            { key: 'overview' as const, label: 'Overview' },
            { key: 'twin' as const, label: 'Digital Twin' },
          ]).map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`border-b-2 pb-3 text-sm font-medium ${tab === t.key ? 'border-current' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              style={tab === t.key ? { color: '#2ABFBF', borderColor: '#2ABFBF' } : undefined}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {budget && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <DollarSign className="h-5 w-5" style={{ color: '#38A169' }} />
                <p className="mt-2 text-xl font-bold" style={{ color: '#1A2B4A' }}>{budget}</p>
                <p className="text-xs text-gray-500">Total Budget</p>
              </div>
            )}
            {projectType && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <Building2 className="h-5 w-5" style={{ color: '#2ABFBF' }} />
                <p className="mt-2 text-xl font-bold" style={{ color: '#1A2B4A' }}>{projectType}</p>
                <p className="text-xs text-gray-500">Project Type</p>
              </div>
            )}
            {acres !== undefined && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <Ruler className="h-5 w-5" style={{ color: '#E8793A' }} />
                <p className="mt-2 text-xl font-bold" style={{ color: '#1A2B4A' }}>{acres} ac</p>
                <p className="text-xs text-gray-500">Acreage</p>
              </div>
            )}
            {units !== undefined && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <Box className="h-5 w-5" style={{ color: '#7C3AED' }} />
                <p className="mt-2 text-xl font-bold" style={{ color: '#1A2B4A' }}>{units}</p>
                <p className="text-xs text-gray-500">Units</p>
              </div>
            )}
          </div>

          {project.description && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Description</h2>
              <p className="text-sm text-gray-600">{project.description}</p>
            </div>
          )}

          {capitalStack && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Capital Stack</h2>
              <div className="mb-3 flex h-3 w-full overflow-hidden rounded-full">
                {[
                  { v: capitalStack.seniorDebt, c: '#1A2B4A' },
                  { v: capitalStack.mezzanine, c: '#2ABFBF' },
                  { v: capitalStack.lpEquity, c: '#E8793A' },
                  { v: capitalStack.gpEquity, c: '#D69E2E' },
                ].map((seg, i) => {
                  const total = capitalStack.seniorDebt + capitalStack.mezzanine + capitalStack.lpEquity + capitalStack.gpEquity
                  return <div key={i} className="h-full" style={{ width: `${(seg.v / total) * 100}%`, backgroundColor: seg.c }} />
                })}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs text-gray-500">
                <span>Senior Debt: {fmtMoney(capitalStack.seniorDebt)}</span>
                <span>Mezzanine: {fmtMoney(capitalStack.mezzanine)}</span>
                <span>LP Equity: {fmtMoney(capitalStack.lpEquity)}</span>
                <span>GP Equity: {fmtMoney(capitalStack.gpEquity)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'twin' && (
        <div className="space-y-6">
          {twinLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading Digital Twin…
            </div>
          ) : twin ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <Cpu className="h-5 w-5" style={{ color: '#2ABFBF' }} />
                  <p className="mt-2 text-xl font-bold" style={{ color: '#1A2B4A' }}>{twin.tier}</p>
                  <p className="text-xs text-gray-500">Twin Tier</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <Activity className="h-5 w-5" style={{ color: healthColor(twin.healthStatus) }} />
                  <p className="mt-2 text-xl font-bold" style={{ color: healthColor(twin.healthStatus) }}>{twin.healthScore}%</p>
                  <p className="text-xs text-gray-500">Health Score ({twin.healthStatus})</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <Layers className="h-5 w-5" style={{ color: '#E8793A' }} />
                  <p className="mt-2 text-xl font-bold" style={{ color: '#1A2B4A' }}>{twin.currentPhase ?? twin.status}</p>
                  <p className="text-xs text-gray-500">Current Phase</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <Box className="h-5 w-5" style={{ color: '#7C3AED' }} />
                  <p className="mt-2 text-xl font-bold" style={{ color: '#1A2B4A' }}>{twin.enabledModules?.length ?? 0}</p>
                  <p className="text-xs text-gray-500">Active Modules</p>
                </div>
              </div>

              {twin.enabledModules?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {twin.enabledModules.map((mod) => (
                    <span key={mod} className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-200">
                      <Box className="h-3 w-3" /> {mod}
                    </span>
                  ))}
                </div>
              )}

              {twin.kpis && twin.kpis.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-3 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Twin KPIs</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {twin.kpis.map((kpi) => (
                      <div key={kpi.id} className="rounded-lg border border-gray-100 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">{kpi.label}</p>
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: healthColor(kpi.status) }} />
                        </div>
                        <p className="mt-1 text-lg font-bold" style={{ color: healthColor(kpi.status) }}>
                          {kpi.currentValue}{kpi.unit ?? ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
              <Cpu className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm font-medium text-gray-600">{twinError ?? 'No Digital Twin data available.'}</p>
              {listTwinHealth !== undefined && (
                <p className="mt-1 text-xs text-gray-400">
                  Pipeline record shows a twin health score of {listTwinHealth}% — reopen from the live twin service once available.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
