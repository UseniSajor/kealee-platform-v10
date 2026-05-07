'use client'

import { useEffect, useState, useCallback } from 'react'
import { BarChart3, TrendingUp, DollarSign, Users, Building2, ArrowUpRight, ArrowDownRight, RefreshCw, Loader2 } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  live: boolean
  kpis: {
    totalRevenue: number
    recentRevenue30d: number
    revenueChangePct: number
    totalIntakes: number
    recentIntakes30d: number
    intakeChangePct: number
    paidCount: number
    recentPaidCount30d: number
    paidChangePct: number
    uniqueUsers: number
  }
  revenueByPackage: Array<{ name: string; revenue: number; count: number }>
  funnel: Array<{ stage: string; count: number; pct: number }>
  topMarkets: Array<{ city: string; projects: number; revenue: number }>
  generatedAt: string
}

// ─────────────────────────────────────────────────────────────────────────────

function fmt$(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toLocaleString()}`
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData]           = useState<AnalyticsData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const load = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const res = await fetch('/api/command-center/analytics', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
      setError(null)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load')
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

  const kpis = data?.kpis
  const maxRevenue = Math.max(...(data?.revenueByPackage.map(p => p.revenue) ?? [1]))
  const maxFunnelCount = data?.funnel?.[0]?.count ?? 1

  const kpiCards = [
    {
      label: 'Total Revenue (Est.)',
      value: kpis ? fmt$(kpis.totalRevenue) : '—',
      change: kpis ? `${kpis.revenueChangePct >= 0 ? '+' : ''}${kpis.revenueChangePct}% vs prev 30d` : '',
      positive: (kpis?.revenueChangePct ?? 0) >= 0,
      icon: DollarSign,
    },
    {
      label: '30-Day Revenue (Est.)',
      value: kpis ? fmt$(kpis.recentRevenue30d) : '—',
      change: kpis ? `${kpis.recentPaidCount30d} paid concepts` : '',
      positive: (kpis?.paidChangePct ?? 0) >= 0,
      icon: TrendingUp,
    },
    {
      label: 'Paid Concepts',
      value: kpis ? String(kpis.paidCount) : '—',
      change: kpis ? `${kpis.paidChangePct >= 0 ? '+' : ''}${kpis.paidChangePct}% vs prev 30d` : '',
      positive: (kpis?.paidChangePct ?? 0) >= 0,
      icon: Building2,
    },
    {
      label: 'Platform Users',
      value: kpis ? String(kpis.uniqueUsers) : '—',
      change: kpis ? `${kpis.totalIntakes} total intakes` : '',
      positive: true,
      icon: Users,
    },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Analytics</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {loading
              ? '○ Connecting…'
              : data?.live
                ? `● Live · revenue estimates based on intake tier pricing`
                : `○ Error: ${error}`}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
          style={{ color: data?.live ? '#38A169' : 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.05)' }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : data?.live ? 'Live' : 'Retry'}
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4" style={{ color: '#2ABFBF' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading analytics…</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* KPI Cards */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {kpiCards.map((kpi) => (
              <div key={kpi.label} className="rounded-xl border p-5"
                style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
                <div className="flex items-center justify-between">
                  <kpi.icon className="h-5 w-5" style={{ color: 'rgba(255,255,255,0.4)' }} />
                  {kpi.change && (
                    <span className="flex items-center gap-1 text-xs font-medium"
                      style={{ color: kpi.positive ? '#38A169' : '#E53E3E' }}>
                      {kpi.positive
                        ? <ArrowUpRight className="h-3 w-3" />
                        : <ArrowDownRight className="h-3 w-3" />}
                      {kpi.change}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-2xl font-bold text-white">{kpi.value}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{kpi.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue by Service Type */}
            <div className="rounded-xl border p-6" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
              <h2 className="font-display mb-4 text-lg font-semibold text-white">Revenue by Service Type</h2>
              {(data?.revenueByPackage ?? []).length === 0 ? (
                <p className="text-xs py-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>No paid intakes yet.</p>
              ) : (
                <div className="space-y-4">
                  {(data?.revenueByPackage ?? []).map((pkg) => (
                    <div key={pkg.name}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{pkg.name}</span>
                        <span className="font-medium text-white">
                          {fmt$(pkg.revenue)} ({pkg.count})
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: '#0F1A2E' }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${Math.round((pkg.revenue / maxRevenue) * 100)}%`, backgroundColor: '#2ABFBF' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Conversion Funnel */}
            <div className="rounded-xl border p-6" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
              <h2 className="font-display mb-4 text-lg font-semibold text-white">Intake Funnel</h2>
              {(data?.funnel ?? []).length === 0 ? (
                <p className="text-xs py-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>No data yet.</p>
              ) : (
                <div className="space-y-3">
                  {(data?.funnel ?? []).map((stage, i) => {
                    const funnelColors = ['#1A2B4A', '#2ABFBF', '#38A169']
                    return (
                      <div key={stage.stage}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{stage.stage}</span>
                          <span className="font-medium text-white">
                            {stage.count.toLocaleString()} ({stage.pct}%)
                          </span>
                        </div>
                        <div className="h-8 w-full overflow-hidden rounded-lg" style={{ backgroundColor: '#0F1A2E' }}>
                          <div className="flex h-full items-center justify-center rounded-lg text-xs font-medium text-white"
                            style={{
                              width: `${Math.max(stage.pct, 5)}%`,
                              backgroundColor: funnelColors[i % funnelColors.length],
                            }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Top Markets */}
            <div className="rounded-xl border p-6 lg:col-span-2"
              style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
              <h2 className="font-display mb-4 text-lg font-semibold text-white">Top Markets</h2>
              {(data?.topMarkets ?? []).length === 0 ? (
                <p className="text-xs py-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  No market data — project addresses needed to derive city breakdown.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderColor: '#2A3D5F', borderBottomWidth: '1px' }}>
                        <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Market</th>
                        <th className="px-4 py-3 text-right text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Paid Concepts</th>
                        <th className="px-4 py-3 text-right text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Est. Revenue</th>
                        <th className="px-4 py-3 text-right text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.topMarkets ?? []).map((m) => (
                        <tr key={m.city} style={{ borderColor: 'rgba(42, 61, 95, 0.5)', borderBottomWidth: '1px' }}>
                          <td className="px-4 py-3 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{m.city}</td>
                          <td className="px-4 py-3 text-right text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{m.projects}</td>
                          <td className="px-4 py-3 text-right text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{fmt$(m.revenue)}</td>
                          <td className="px-4 py-3 text-right text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                            {kpis?.paidCount
                              ? `${Math.round((m.projects / kpis.paidCount) * 100)}%`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
