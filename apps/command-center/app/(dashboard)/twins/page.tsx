'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, AlertTriangle, CheckCircle, Cpu, RefreshCw, Loader2 } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface TwinKpis {
  budget_variance: number
  schedule_spi: number
  completion_pct: number
  risk_score?: number
  quality_score?: number
  open_issues?: number
  safety_score?: number
  cost_performance_index?: number
  rfi_response_time?: number
  change_order_rate?: number
}

interface Twin {
  id: string
  project: string
  projectType: string
  tier: 'L1' | 'L2' | 'L3'
  health: number
  status: 'healthy' | 'warning' | 'critical'
  phase: string
  lastSync: string
  alerts: number
  kpiCount: number
  modules: string[]
  kpis: TwinKpis
  address: string | null
  createdAt: string
}

interface TwinsData {
  live: boolean
  twins: Twin[]
  summary: { total: number; l1: number; l2: number; l3: number; withAlerts: number }
  generatedAt: string
}

// ─────────────────────────────────────────────────────────────────────────────

const LIFECYCLE_PHASES: Record<string, string> = {
  IDEA:             'Idea',
  LAND:             'Land Acquisition',
  FEASIBILITY:      'Feasibility Study',
  DESIGN:           'Design & Architecture',
  PERMITS:          'Permitting',
  PRECONSTRUCTION:  'Pre-Construction',
  CONSTRUCTION:     'Construction',
  INSPECTIONS:      'Inspections & QA',
  PAYMENTS:         'Payments & Finance',
  CLOSEOUT:         'Closeout',
  OPERATIONS:       'Operations',
  ARCHIVE:          'Archive',
}

const OS_MODULES: Record<string, string> = {
  'os-land':    'OS Land',
  'os-feas':    'OS Feasibility',
  'os-dev':     'OS Development',
  'os-pm':      'OS Project Mgmt',
  'os-pay':     'OS Payments',
  'os-ops':     'OS Operations',
  'marketplace': 'Marketplace',
}

const statusColors: Record<string, { bg: string; text: string; ring: string }> = {
  healthy:  { bg: 'rgba(56, 161, 105, 0.1)',  text: '#38A169', ring: 'rgba(56, 161, 105, 0.2)' },
  warning:  { bg: 'rgba(232, 121, 58, 0.1)',  text: '#E8793A', ring: 'rgba(232, 121, 58, 0.2)' },
  critical: { bg: 'rgba(229, 62, 62, 0.1)',   text: '#E53E3E', ring: 'rgba(229, 62, 62, 0.2)' },
}

const tierColors: Record<string, string> = { L1: '#94A3B8', L2: '#3B82F6', L3: '#8B5CF6' }

// ─────────────────────────────────────────────────────────────────────────────

export default function TwinsPage() {
  const [data, setData]           = useState<TwinsData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState('all')
  const [tierFilter, setTierFilter] = useState('all')

  const load = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const res = await fetch('/api/command-center/twins', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch {
      // silently keep existing data on refresh errors
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(() => load(), 60_000)
    return () => clearInterval(interval)
  }, [load])

  const twins   = data?.twins ?? []
  const summary = data?.summary ?? { total: 0, l1: 0, l2: 0, l3: 0, withAlerts: 0 }

  const filtered = twins.filter(t => {
    const matchSearch = t.project.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || t.status === filter
    const matchTier   = tierFilter === 'all' || t.tier === tierFilter
    return matchSearch && matchFilter && matchTier
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Digital Twins</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {loading
              ? '○ Loading twins…'
              : `${summary.total} twins | L1: ${summary.l1} | L2: ${summary.l2} | L3: ${summary.l3} | ${summary.withAlerts} with alerts`}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
          style={{ color: data?.live ? '#38A169' : 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4" style={{ color: '#2ABFBF' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading digital twins…</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Tier Summary Cards */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            {[
              { tier: 'L1', label: 'Light',    count: summary.l1, kpis: 3,  desc: 'Budget, schedule, completion' },
              { tier: 'L2', label: 'Standard', count: summary.l2, kpis: 6,  desc: '+ risk, quality, open issues' },
              { tier: 'L3', label: 'Premium',  count: summary.l3, kpis: 10, desc: '+ safety, CPI, RFI, CO rate' },
            ].map((t) => (
              <div key={t.tier} className="rounded-xl border p-4"
                style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" style={{ color: tierColors[t.tier] }} />
                  <div>
                    <p className="text-sm font-bold text-white">{t.tier} — {t.label}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{t.count} twins · {t.kpis} KPIs</p>
                  </div>
                </div>
                <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>{t.desc}</p>
              </div>
            ))}
          </div>

          {/* Search & Filters */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input
                type="text"
                placeholder="Search twins…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none"
                style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}
              />
            </div>
            <div className="flex gap-2">
              {['all', 'healthy', 'warning', 'critical'].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className="rounded-lg px-3 py-2 text-xs font-medium capitalize"
                  style={{
                    backgroundColor: filter === f ? 'rgba(42, 191, 191, 0.15)' : '#2A3D5F',
                    color: filter === f ? '#2ABFBF' : 'rgba(255,255,255,0.5)',
                  }}>
                  {f}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {['all', 'L1', 'L2', 'L3'].map((t) => (
                <button key={t} onClick={() => setTierFilter(t)}
                  className="rounded-lg px-3 py-2 text-xs font-medium"
                  style={{
                    backgroundColor: tierFilter === t ? 'rgba(139, 92, 246, 0.15)' : '#2A3D5F',
                    color: tierFilter === t ? (t === 'all' ? '#8B5CF6' : tierColors[t]) : 'rgba(255,255,255,0.5)',
                  }}>
                  {t === 'all' ? 'All Tiers' : t}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border p-12 text-center"
              style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {twins.length === 0
                  ? 'No active intakes to display as twins yet.'
                  : 'No twins match the current filter.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((twin) => {
                const colors = statusColors[twin.status]
                const tColor = tierColors[twin.tier]
                const phaseName = LIFECYCLE_PHASES[twin.phase] ?? twin.phase

                return (
                  <div key={twin.id} className="rounded-xl border p-5"
                    style={{
                      borderColor: '#2A3D5F',
                      backgroundColor: '#1A2B4A',
                      boxShadow: `0 0 0 1px ${colors.ring}`,
                    }}>
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-white text-sm leading-snug">{twin.project}</h3>
                          <span className="rounded px-1.5 py-0.5 text-xs font-bold"
                            style={{ backgroundColor: `${tColor}20`, color: tColor }}>
                            {twin.tier}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {phaseName} · {twin.projectType}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shrink-0"
                        style={{ backgroundColor: colors.bg, color: colors.text }}>
                        {twin.status === 'healthy'
                          ? <CheckCircle className="h-3 w-3" />
                          : <AlertTriangle className="h-3 w-3" />}
                        {twin.status}
                      </div>
                    </div>

                    {/* Health gauge */}
                    <div className="mb-3">
                      <div className="mb-1 flex justify-between text-xs">
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Health Score</span>
                        <span className="font-bold" style={{ color: colors.text }}>{twin.health}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: '#0F1A2E' }}>
                        <div className="h-full rounded-full transition-all" style={{
                          width: `${twin.health}%`,
                          backgroundColor: twin.health >= 80 ? '#38A169' : twin.health >= 60 ? '#E8793A' : '#E53E3E',
                        }} />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                        <p className="text-lg font-bold text-white">{twin.alerts}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Alerts</p>
                      </div>
                      <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                        <p className="text-lg font-bold" style={{ color: tColor }}>{twin.kpiCount}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>KPIs</p>
                      </div>
                      <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                        <p className="text-lg font-bold text-white">{twin.modules.length}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Modules</p>
                      </div>
                    </div>

                    {/* KPIs */}
                    <div className="mb-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Budget Variance</span>
                        <span className="font-medium" style={{
                          color: twin.kpis.budget_variance > 10 ? '#E53E3E'
                            : twin.kpis.budget_variance > 5 ? '#E8793A' : '#38A169',
                        }}>
                          {twin.kpis.budget_variance > 0 ? '+' : ''}{twin.kpis.budget_variance}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>SPI</span>
                        <span className="font-medium" style={{
                          color: twin.kpis.schedule_spi < 0.8 ? '#E53E3E'
                            : twin.kpis.schedule_spi < 0.9 ? '#E8793A' : '#38A169',
                        }}>
                          {twin.kpis.schedule_spi.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Completion</span>
                        <span className="font-medium text-white">{twin.kpis.completion_pct}%</span>
                      </div>
                    </div>

                    {/* Modules */}
                    <div className="flex flex-wrap gap-1">
                      {twin.modules.map((mod) => (
                        <span key={mod} className="rounded px-1.5 py-0.5 text-xs"
                          style={{ backgroundColor: 'rgba(42, 191, 191, 0.1)', color: 'rgba(255,255,255,0.4)' }}>
                          {OS_MODULES[mod] ?? mod}
                        </span>
                      ))}
                    </div>

                    <p className="mt-3 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                      Last sync: {twin.lastSync}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
