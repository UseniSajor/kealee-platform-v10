'use client'

/**
 * /launch — P9 National Marketplace Launch Dashboard
 *
 * Real-time KPI view for the command-center operations team.
 * Shows supply, demand, financial, and quality metrics pulled from the live API.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getLaunchDashboard,
  getLaunchConfig,
  launchRegion,
  pauseRegion,
  upsertConfigFlag,
  type LaunchDashboard,
  type MetricValue,
  type RegionStatus,
  type LaunchConfigItem,
} from '@/lib/api/launch'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtValue(v: number, unit: MetricValue['unit']): string {
  if (unit === 'usd')     return '$' + (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toLocaleString())
  if (unit === 'percent') return v + '%'
  if (unit === 'days')    return v + 'd'
  return v.toLocaleString()
}

function healthColor(m: MetricValue): string {
  if (m.isHealthy === undefined) return 'text-gray-300'
  return m.isHealthy ? 'text-emerald-400' : 'text-rose-400'
}

function healthBg(m: MetricValue): string {
  if (m.isHealthy === undefined) return 'bg-[#1e2d45]'
  return m.isHealthy ? 'bg-[#0d2e24]' : 'bg-[#2e1515]'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({ m }: { m: MetricValue }) {
  const progress = m.target ? Math.min(100, Math.round((m.value / m.target) * 100)) : null
  return (
    <div className={`rounded-xl border border-white/10 p-5 ${healthBg(m)}`}>
      <p className="text-xs text-gray-400 mb-1">{m.label}</p>
      <p className={`text-3xl font-bold font-mono ${healthColor(m)}`}>
        {fmtValue(m.value, m.unit)}
      </p>
      {m.target !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Target: {fmtValue(m.target, m.unit)}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10">
            <div
              className={`h-1.5 rounded-full transition-all ${m.isHealthy === false ? 'bg-rose-500' : 'bg-[#2ABFBF]'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function MetricSection({ title, metrics, icon }: { title: string; metrics: MetricValue[]; icon: string }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
        {icon} {title}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {metrics.map(m => <MetricCard key={m.name} m={m} />)}
      </div>
    </section>
  )
}

function RegionCard({
  region,
  onLaunch,
  onPause,
  loading,
}: {
  region:   RegionStatus
  onLaunch: (id: string) => void
  onPause:  (id: string) => void
  loading:  boolean
}) {
  const pct = region.target > 0 ? Math.min(100, Math.round((region.contractors / region.target) * 100)) : 0
  return (
    <div className="rounded-xl border border-white/10 bg-[#1e2d45] p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-white">{region.name}</p>
          <p className="text-xs text-gray-500 font-mono">{region.slug}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          region.launched ? 'bg-emerald-900/50 text-emerald-400' : 'bg-gray-700 text-gray-400'
        }`}>
          {region.launched ? 'LIVE' : 'PENDING'}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{region.contractors} contractors</span>
          <span>Target: {region.target}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10">
          <div
            className="h-1.5 rounded-full bg-[#2ABFBF] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {region.launchedAt && (
        <p className="text-xs text-gray-500 mb-3">
          Launched {new Date(region.launchedAt).toLocaleDateString()}
        </p>
      )}

      <div className="flex gap-2">
        {!region.launched ? (
          <button
            onClick={() => onLaunch(region.id)}
            disabled={loading}
            className="flex-1 text-xs bg-[#2ABFBF] hover:bg-[#22a8a8] text-white font-semibold py-2 rounded-lg disabled:opacity-50 transition-colors"
          >
            Launch Region
          </button>
        ) : (
          <button
            onClick={() => onPause(region.id)}
            disabled={loading}
            className="flex-1 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2 rounded-lg disabled:opacity-50 transition-colors"
          >
            Pause
          </button>
        )}
      </div>
    </div>
  )
}

function FunnelChart({ stages }: { stages: Array<{ stage: string; count: number }> }) {
  if (!stages.length) return <p className="text-gray-500 text-sm">No onboarding data yet.</p>
  const max = Math.max(...stages.map(s => s.count), 1)

  const STAGE_LABELS: Record<string, string> = {
    REGISTRATION:       'Registration',
    EMAIL_VERIFIED:     'Email Verified',
    PROFILE_BASIC:      'Profile Basic',
    PROFILE_SERVICES:   'Profile Services',
    DOCUMENTS_UPLOADED: 'Docs Uploaded',
    UNDER_REVIEW:       'Under Review',
    APPROVED:           'Approved',
    REJECTED:           'Rejected',
    ACTIVE:             'Active',
  }

  return (
    <div className="space-y-2">
      {stages.map(s => {
        const pct = Math.round((s.count / max) * 100)
        const isRejected = s.stage === 'REJECTED'
        return (
          <div key={s.stage} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-36 shrink-0">{STAGE_LABELS[s.stage] ?? s.stage}</span>
            <div className="flex-1 h-6 bg-white/5 rounded overflow-hidden">
              <div
                className={`h-6 rounded flex items-center px-2 transition-all ${
                  isRejected ? 'bg-rose-800' : 'bg-[#2ABFBF]/30'
                }`}
                style={{ width: `${pct}%`, minWidth: s.count > 0 ? '2rem' : '0' }}
              />
            </div>
            <span className="text-xs font-mono text-gray-300 w-8 text-right">{s.count}</span>
          </div>
        )
      })}
    </div>
  )
}

function ConfigToggle({
  item,
  onToggle,
}: {
  item:     LaunchConfigItem
  onToggle: (key: string, value: unknown) => void
}) {
  const isBool = typeof item.value === 'boolean'
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5">
      <div className="pr-4">
        <p className="text-sm text-white font-mono">{item.key}</p>
        {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
      </div>
      <div className="shrink-0">
        {isBool ? (
          <button
            onClick={() => onToggle(item.key, !item.value)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              item.value ? 'bg-[#2ABFBF]' : 'bg-gray-700'
            }`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              item.value ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        ) : (
          <span className="text-sm font-mono text-[#2ABFBF]">{String(item.value)}</span>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const REFRESH_INTERVAL_MS = 60_000

export default function LaunchDashboardPage() {
  const [data,         setData]         = useState<LaunchDashboard | null>(null)
  const [config,       setConfig]       = useState<LaunchConfigItem[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [regionBusy,   setRegionBusy]   = useState(false)
  const [activeTab,    setActiveTab]    = useState<'metrics' | 'regions' | 'funnel' | 'config'>('metrics')
  const [lastRefresh,  setLastRefresh]  = useState<Date>(new Date())

  const fetchAll = useCallback(async () => {
    try {
      const [dashboard, configItems] = await Promise.all([
        getLaunchDashboard(),
        getLaunchConfig(),
      ])
      setData(dashboard)
      setConfig(configItems)
      setLastRefresh(new Date())
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [fetchAll])

  async function handleLaunch(id: string) {
    setRegionBusy(true)
    try { await launchRegion(id); await fetchAll() } finally { setRegionBusy(false) }
  }

  async function handlePause(id: string) {
    if (!confirm('Pause this region? Lead distribution will stop.')) return
    setRegionBusy(true)
    try { await pauseRegion(id); await fetchAll() } finally { setRegionBusy(false) }
  }

  async function handleConfigToggle(key: string, value: unknown) {
    await upsertConfigFlag(key, value)
    setConfig(prev => prev.map(c => c.key === key ? { ...c, value } : c))
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1c2e] flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Loading launch dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f1c2e] flex items-center justify-center">
        <div className="text-center">
          <p className="text-rose-400 font-semibold">Failed to load dashboard</p>
          <p className="text-gray-500 text-sm mt-1">{error}</p>
          <button onClick={fetchAll} className="mt-4 px-4 py-2 bg-[#2ABFBF] text-white rounded-lg text-sm">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const liveRegions    = data?.regions.filter(r => r.launched).length  ?? 0
  const pendingRegions = data?.regions.filter(r => !r.launched).length ?? 0
  const totalContractors = data?.supply.find(m => m.name === 'contractors_registered')?.value ?? 0
  const totalLeads       = data?.demand.find(m => m.name === 'leads_total')?.value ?? 0

  const configByCategory = config.reduce<Record<string, LaunchConfigItem[]>>((acc, item) => {
    const cat = item.category ?? 'general'
    acc[cat] = [...(acc[cat] ?? []), item]
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-[#0f1c2e] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Launch Dashboard</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              National Marketplace — Live KPIs
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-400">
            <span>{liveRegions} region{liveRegions !== 1 ? 's' : ''} live</span>
            <span>{totalContractors.toLocaleString()} contractors</span>
            <span>{totalLeads.toLocaleString()} leads</span>
            <span>Updated {lastRefresh.toLocaleTimeString()}</span>
            <button
              onClick={fetchAll}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/10 px-6">
        <div className="max-w-7xl mx-auto flex gap-1">
          {(['metrics', 'regions', 'funnel', 'config'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-[#2ABFBF] text-[#2ABFBF]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* METRICS TAB */}
        {activeTab === 'metrics' && data && (
          <>
            <MetricSection title="Supply"    icon="🏗️" metrics={data.supply}    />
            <MetricSection title="Demand"    icon="📋" metrics={data.demand}    />
            <MetricSection title="Financial" icon="💰" metrics={data.financial} />
            <MetricSection title="Quality"   icon="✅" metrics={data.quality}   />
          </>
        )}

        {/* REGIONS TAB */}
        {activeTab === 'regions' && data && (
          <>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
                🌎 Service Regions
              </h2>
              <span className="text-xs text-gray-500">
                {liveRegions} live · {pendingRegions} pending
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.regions.map(r => (
                <RegionCard
                  key={r.id}
                  region={r}
                  onLaunch={handleLaunch}
                  onPause={handlePause}
                  loading={regionBusy}
                />
              ))}
              {data.regions.length === 0 && (
                <p className="col-span-3 text-gray-500 text-sm py-8 text-center">
                  No regions seeded yet. Run: <code className="text-[#2ABFBF]">pnpm seed:regions</code>
                </p>
              )}
            </div>
          </>
        )}

        {/* FUNNEL TAB */}
        {activeTab === 'funnel' && data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
                🔄 Contractor Onboarding Funnel
              </h2>
              <FunnelChart stages={data.funnel} />
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="bg-[#1e2d45] rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-400">
                    {data.onboarding.avgDaysToApproval}d
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Avg days to approval</p>
                </div>
                <div className="bg-[#1e2d45] rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-[#2ABFBF]">
                    {(data.onboarding.funnelByStage['APPROVED'] ?? 0) +
                     (data.onboarding.funnelByStage['ACTIVE']   ?? 0)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Total approved</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
                📊 Lead Pipeline
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Total Leads',   value: data.demand.find(m => m.name === 'leads_total')?.value ?? 0,       color: '#2ABFBF' },
                  { label: 'Distributed',   value: data.demand.find(m => m.name === 'leads_distributed')?.value ?? 0, color: '#805AD5' },
                  { label: 'Quoted',        value: data.demand.find(m => m.name === 'leads_quoted')?.value ?? 0,       color: '#E8793A' },
                  { label: 'Contracted',    value: data.demand.find(m => m.name === 'leads_awarded')?.value ?? 0,     color: '#48BB78' },
                ].map(item => {
                  const total = data.demand.find(m => m.name === 'leads_total')?.value ?? 1
                  const w = Math.max(4, Math.round((item.value / total) * 100))
                  return (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-24 shrink-0">{item.label}</span>
                      <div className="flex-1 h-7 bg-white/5 rounded overflow-hidden">
                        <div
                          className="h-7 rounded flex items-center px-3 text-xs font-mono text-white"
                          style={{ width: `${w}%`, backgroundColor: item.color + '40', minWidth: '3rem' }}
                        >
                          {item.value.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* CONFIG TAB */}
        {activeTab === 'config' && (
          <div className="space-y-8">
            {Object.entries(configByCategory).map(([category, items]) => (
              <div key={category}>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  {category}
                </h2>
                <div className="bg-[#1e2d45] rounded-xl border border-white/10 px-5 divide-y divide-white/5">
                  {items.map(item => (
                    <ConfigToggle key={item.key} item={item} onToggle={handleConfigToggle} />
                  ))}
                </div>
              </div>
            ))}
            {config.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">
                No config flags seeded yet. Run: <code className="text-[#2ABFBF]">pnpm seed:launch-config</code>
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
