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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="font-sans text-3xl font-extrabold text-white tracking-tight leading-tight">Command Center</h1>
          <div className="mt-2 flex items-center gap-2">
            {!loading && isLive ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 text-green-400 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border border-green-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-ping" />
                Live Sync
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 text-slate-400 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border border-slate-500/20">
                Offline
              </span>
            )}
            <p className="text-xs text-slate-400 font-semibold uppercase">
              {loading
                ? 'Connecting to platform databases…'
                : isLive
                ? `${pathDist.length} service types · updated ${data ? timeAgo(data.generatedAt) : '—'}`
                : `Error: ${error}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow hover:scale-[1.02] border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh Telemetry'}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-3">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-[#2ABFBF]" />
            <p className="text-sm font-semibold text-slate-400 tracking-wide">Loading command data streams…</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Top Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {displayStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-800 bg-[#111C30] p-5 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: stat.color }} />
                <div className="flex items-center gap-3">
                  <div className="rounded-xl p-2.5 shrink-0" style={{ backgroundColor: stat.bg }}>
                    <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{stat.label}</p>
                    <p className="text-xl font-black font-sans tracking-tight text-white mt-0.5">{stat.value}</p>
                    <p className="text-[9px] font-bold text-slate-500 mt-0.5 uppercase tracking-wide leading-tight">{stat.change}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Service Type Distribution */}
          <div className="rounded-3xl border border-slate-800 bg-[#111C30] p-6 shadow-lg">
            <h2 className="font-sans mb-4 text-xs font-extrabold text-slate-400 uppercase tracking-widest">
              Intake Distribution by Service ({pathDist.length} types · {totalCount} total)
            </h2>
            {pathDist.length === 0 ? (
              <p className="text-xs py-4 text-center text-slate-500 font-semibold">
                No intake records logged.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex h-5 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
                  {pathDist.map((p, i) => {
                    const width = (p.count / totalCount) * 100
                    return (
                      <div
                        key={p.key}
                        className="flex items-center justify-center text-[9px] font-extrabold text-white shrink-0 border-r border-slate-950/20 last:border-0"
                        style={{ width: `${width}%`, backgroundColor: PHASE_COLORS[i % PHASE_COLORS.length], minWidth: '15px' }}
                        title={`${LIFECYCLE_PHASE_LABELS[p.key] ?? p.name}: ${p.count}`}
                      >
                        {p.count > 0 && p.count}
                      </div>
                    )
                  })}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 border-t border-slate-800/40">
                  {pathDist.map((p, i) => (
                    <span key={p.key} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                      <span className="inline-block h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: PHASE_COLORS[i % PHASE_COLORS.length] }} />
                      {LIFECYCLE_PHASE_LABELS[p.key] ?? p.name} <span className="text-slate-500 font-bold ml-0.5">({p.count})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Status Breakdown */}
          {stats && (
            <div className="rounded-3xl border border-slate-800 bg-[#111C30] p-6 shadow-lg">
              <h2 className="font-sans mb-4 text-xs font-extrabold text-slate-400 uppercase tracking-widest">Intake Status Matrix</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: 'Total Logs', value: stats.totalIntakes, color: '#2ABFBF' },
                  { label: 'Paid / Ready', value: stats.paidIntakes, color: '#38A169' },
                  { label: 'Active Drafts', value: stats.activeIntakes, color: '#F59E0B' },
                  { label: 'Last 30 Days', value: stats.recentIntakes30d, color: '#A78BFA' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl p-4 text-center bg-slate-950/40 border border-slate-800/60 shadow-inner">
                    <p className="text-3xl font-black font-sans tracking-tight" style={{ color: item.color }}>{item.value}</p>
                    <p className="text-[10px] font-bold mt-1.5 uppercase tracking-wider text-slate-400">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Event Feed + Integrations */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Live Event Feed */}
            <div className="rounded-3xl border border-slate-800 bg-[#111C30] p-6 shadow-lg">
              <h2 className="font-sans mb-4 text-sm font-bold text-white flex items-center justify-between">
                <span>Live Intake Log Feed</span>
                {isLive && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase text-green-400 tracking-wider">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    live stream
                  </span>
                )}
              </h2>
              {displayEvents.length === 0 ? (
                <p className="text-xs py-12 text-center text-slate-500 font-semibold">
                  No log entries recorded.
                </p>
              ) : (
                <div className="space-y-3">
                  {displayEvents.map((event, i) => (
                    <div key={event.id ?? i} className="flex items-start gap-3 rounded-xl p-4 bg-slate-950/40 border border-slate-800/60 shadow-inner">
                      <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full shrink-0" style={{
                        backgroundColor: event.type === 'success' ? '#38A169' : event.type === 'error' ? '#EF4444' : '#2ABFBF'
                      }} />
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-xs font-semibold text-slate-300 leading-relaxed break-words">{event.message}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">
                          {timeAgo(event.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Integration Health */}
            <div className="rounded-3xl border border-slate-800 bg-[#111C30] p-6 shadow-lg">
              <h2 className="font-sans mb-4 text-sm font-bold text-white">Integration Cluster Health</h2>
              {displayIntegrations.length === 0 ? (
                <p className="text-xs py-12 text-center text-slate-500 font-semibold">
                  No registered cluster systems.
                </p>
              ) : (
                <div className="space-y-3">
                  {displayIntegrations.map((int) => {
                    const isOk      = int.status === 'operational'
                    const isUnknown = int.status === 'unknown'
                    const color = isOk ? '#38A169' : isUnknown ? '#94A3B8' : '#EF4444'
                    const bg    = isOk ? 'rgba(56,161,105,0.1)' : isUnknown ? 'rgba(148,163,184,0.1)' : 'rgba(239,68,68,0.1)'
                    const border = isOk ? 'rgba(56,161,105,0.2)' : isUnknown ? 'rgba(148,163,184,0.2)' : 'rgba(239,68,68,0.2)'
                    return (
                      <div key={int.name} className="flex items-center justify-between rounded-xl p-4 bg-slate-950/40 border border-slate-800/60 shadow-inner">
                        <div className="flex items-center gap-3">
                          <Plug className="h-4.5 w-4.5 text-slate-500" />
                          <span className="text-xs font-bold text-slate-200">{int.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{int.latency}</span>
                          <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide border shadow"
                            style={{ backgroundColor: bg, color, borderColor: border }}>
                            <span className="h-1 w-1 rounded-full" style={{ backgroundColor: color }} />
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
