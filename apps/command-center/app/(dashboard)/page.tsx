'use client'

import { useEffect, useState, useCallback } from 'react'
import { Boxes, Activity, AlertTriangle, Users, Plug, RefreshCw, TrendingUp, Loader2 } from 'lucide-react'

// ── Lifecycle phases (static structure — counts come from real data) ──────────
const LIFECYCLE_PHASE_LABELS: Record<string, string> = {
  kitchen_remodel:               'Kitchen Remodel',
  bathroom_remodel:              'Bathroom Remodel',
  exterior_concept:              'Exterior Concept',
  interior_reno_concept:         'Interior Reno',
  interior_renovation:           'Interior Renovation',
  whole_home_concept:            'Whole Home',
  whole_home_remodel:            'Whole-Home Remodel',
  addition_expansion:            'Addition',
  garden_concept:                'Garden',
  capture_site_concept:          'Site Capture',
  design_build:                  'Design + Build',
  design_estimate_permit_bundle: 'Full Bundle',
  developer_concept:             'Developer',
  single_lot_development:        'Single Lot',
  single_family_subdivision:     'SF Subdivision',
  townhome_subdivision:          'Townhome Sub',
  development_feasibility:       'Feasibility',
  mixed_use:                     'Mixed-Use',
  commercial_office:             'Commercial',
  multi_unit_residential:        'Multi-Unit',
  permit_path_only:              'Permit Only',
  cost_estimate:                 'Cost Estimate',
  contractor_match:              'Contractor Match',
}

const PHASE_COLORS = [
  '#6366F1', '#818CF8', '#3B82F6', '#06B6D4', '#F59E0B',
  '#FB923C', '#2ABFBF', '#38A169', '#84CC16', '#D69E2E',
  '#A78BFA', '#94A3B8', '#E879A0', '#14B8A6', '#F43F5E',
  '#8B5CF6', '#EC4899', '#10B981', '#F97316', '#EF4444',
]

// ── Types ─────────────────────────────────────────────────────────────────────

interface PathEntry  { key: string; name: string; count: number }
interface EventEntry { id: string; timestamp: string; message: string; type: string; module: string }
interface Integration { name: string; status: string; latencyMs: number }

interface OverviewData {
  live: boolean
  stats: {
    totalIntakes: number
    totalUsers: number
    paidIntakes: number
    activeIntakes: number
    recentIntakes30d: number
  }
  pathDistribution: PathEntry[]
  recentEvents: EventEntry[]
  integrations: Integration[]
  generatedAt: string
}

// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function latencyLabel(ms: number): string {
  if (ms === 0) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

// ─────────────────────────────────────────────────────────────────────────────

export default function CommandCenterOverview() {
  const [data, setData]       = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const load = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const res = await fetch('/api/command-center/overview', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: OverviewData = await res.json()
      setData(json)
      setError(null)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(() => load(), 30_000)
    return () => clearInterval(interval)
  }, [load])

  // ── Derived display values ─────────────────────────────────────────────────

  const stats = data?.stats
  const isLive = data?.live ?? false

  const displayStats = [
    {
      label: 'Total Intakes',
      value: stats ? String(stats.totalIntakes) : '—',
      change: stats ? `${stats.paidIntakes} paid · ${stats.activeIntakes} active` : 'connecting…',
      icon: Boxes,
      color: '#2ABFBF',
      bg: 'rgba(42,191,191,0.1)',
    },
    {
      label: 'Last 30 Days',
      value: stats ? String(stats.recentIntakes30d) : '—',
      change: stats ? `${Math.round((stats.recentIntakes30d / Math.max(stats.totalIntakes, 1)) * 100)}% of all intakes` : '',
      icon: TrendingUp,
      color: '#38A169',
      bg: 'rgba(56,161,105,0.1)',
    },
    {
      label: 'Paid Concepts',
      value: stats ? String(stats.paidIntakes) : '—',
      change: stats ? `${Math.round((stats.paidIntakes / Math.max(stats.totalIntakes, 1)) * 100)}% conversion` : '',
      icon: AlertTriangle,
      color: '#E8793A',
      bg: 'rgba(232,121,58,0.1)',
    },
    {
      label: 'Platform Users',
      value: stats ? String(stats.totalUsers) : '—',
      change: 'unique contact emails + auth users',
      icon: Users,
      color: '#A78BFA',
      bg: 'rgba(167,139,250,0.1)',
    },
  ]

  const pathDist   = data?.pathDistribution ?? []
  const totalCount = pathDist.reduce((s, p) => s + p.count, 0)

  const displayIntegrations = (data?.integrations ?? []).map(int => ({
    name: int.name,
    status: int.status === 'operational' ? 'operational' : int.status === 'unknown' ? 'unknown' : 'degraded',
    latency: latencyLabel(int.latencyMs),
  }))

  const displayEvents = data?.recentEvents ?? []

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Command Center</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {loading
              ? '○ Connecting to Supabase…'
              : isLive
                ? `● Live · ${pathDist.length} service types · updated ${data ? timeAgo(data.generatedAt) : '—'}`
                : `○ Error: ${error}`}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ color: isLive ? '#38A169' : 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : isLive ? 'Live' : 'Retry'}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4" style={{ color: '#2ABFBF' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading live data from Supabase…</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Top Stats */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {displayStats.map((stat) => (
              <div key={stat.label} className="rounded-xl border p-5"
                style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-2.5" style={{ backgroundColor: stat.bg }}>
                    <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{stat.label}</p>
                    <p className="text-xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{stat.change}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Service Type Distribution */}
          <div className="mb-6 rounded-xl border p-5"
            style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
            <h2 className="font-display mb-3 text-sm font-semibold text-white">
              Intake Distribution by Service Type ({pathDist.length} types · {totalCount} total)
            </h2>
            {pathDist.length === 0 ? (
              <p className="text-xs py-4 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                No intake data yet.
              </p>
            ) : (
              <>
                <div className="flex h-8 w-full overflow-hidden rounded-lg">
                  {pathDist.map((p, i) => {
                    const width = (p.count / totalCount) * 100
                    return (
                      <div
                        key={p.key}
                        className="flex items-center justify-center text-xs font-bold text-white"
                        style={{ width: `${width}%`, backgroundColor: PHASE_COLORS[i % PHASE_COLORS.length], minWidth: '20px' }}
                        title={`${LIFECYCLE_PHASE_LABELS[p.key] ?? p.name}: ${p.count}`}
                      >
                        {p.count}
                      </div>
                    )
                  })}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {pathDist.map((p, i) => (
                    <span key={p.key} className="flex items-center gap-1 text-xs"
                      style={{ color: 'rgba(255,255,255,0.4)' }}>
                      <span className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: PHASE_COLORS[i % PHASE_COLORS.length] }} />
                      {LIFECYCLE_PHASE_LABELS[p.key] ?? p.name} ({p.count})
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Status Breakdown */}
          {stats && (
            <div className="mb-6 rounded-xl border p-5"
              style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
              <h2 className="font-display mb-3 text-sm font-semibold text-white">Intake Status Breakdown</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Total', value: stats.totalIntakes, color: '#2ABFBF' },
                  { label: 'Paid / Ready', value: stats.paidIntakes, color: '#38A169' },
                  { label: 'Active (new)', value: stats.activeIntakes, color: '#F59E0B' },
                  { label: 'Last 30 Days', value: stats.recentIntakes30d, color: '#A78BFA' },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg p-3 text-center"
                    style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                    <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Event Feed + Integrations */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Live Event Feed */}
            <div className="rounded-xl border p-6"
              style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
              <h2 className="font-display mb-4 text-lg font-semibold text-white">
                Live Intake Feed
                {isLive && <span className="ml-2 text-xs font-normal" style={{ color: '#38A169' }}>● live</span>}
              </h2>
              {displayEvents.length === 0 ? (
                <p className="text-xs py-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  No intake events yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {displayEvents.map((event, i) => (
                    <div key={event.id ?? i} className="flex items-start gap-3 rounded-lg p-3"
                      style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                      <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full" style={{
                        backgroundColor: event.type === 'success' ? '#38A169' : event.type === 'error' ? '#E53E3E' : '#2ABFBF'
                      }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>{event.message}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {timeAgo(event.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Integration Health */}
            <div className="rounded-xl border p-6"
              style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
              <h2 className="font-display mb-4 text-lg font-semibold text-white">Integration Health</h2>
              {displayIntegrations.length === 0 ? (
                <p className="text-xs py-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  No integration data.
                </p>
              ) : (
                <div className="space-y-3">
                  {displayIntegrations.map((int) => {
                    const isOk      = int.status === 'operational'
                    const isUnknown = int.status === 'unknown'
                    const color = isOk ? '#38A169' : isUnknown ? '#94A3B8' : '#E8793A'
                    const bg    = isOk ? 'rgba(56,161,105,0.15)' : isUnknown ? 'rgba(148,163,184,0.15)' : 'rgba(232,121,58,0.15)'
                    return (
                      <div key={int.name} className="flex items-center justify-between rounded-lg p-3"
                        style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                        <div className="flex items-center gap-3">
                          <Plug className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                          <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{int.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{int.latency}</span>
                          <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: bg, color }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                            {int.status}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
