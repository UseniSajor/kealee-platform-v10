'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Users, DollarSign, BarChart3, Star, Clock } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'

interface MarketInsights {
  totalLeads: number
  leadsAccepted: number
  leadsConverted: number
  averageContractValueCents: number
  activeContractors: number
  averageContractorScore: number
  topContractors: { id: string; name: string; score: number }[]
}

interface LeadFunnel {
  generated: number
  dispatched: number
  accepted: number
  converted: number
  acceptanceRate: number
  conversionRate: number
  byTrade: { tradeCategory: string; generated: number; converted: number }[]
}

type Period = '7d' | '30d' | '90d'

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: any; color: string; sub?: string
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold" style={{ color }}>{value}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className="rounded-lg p-2" style={{ backgroundColor: `${color}15` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
    </div>
  )
}

export default function IntelligenceDashboard() {
  const [period, setPeriod] = useState<Period>('30d')
  const [insights, setInsights] = useState<MarketInsights | null>(null)
  const [funnel, setFunnel] = useState<LeadFunnel | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      apiFetch<{ insights: MarketInsights }>(`/intelligence/insights/market?period=${period}`).catch(() => null),
      apiFetch<{ funnel: LeadFunnel }>(`/intelligence/insights/funnel?period=${period}`).catch(() => null),
    ]).then(([ins, fun]) => {
      setInsights(ins?.insights ?? null)
      setFunnel(fun?.funnel ?? null)
    }).finally(() => setLoading(false))
  }, [period])

  const PERIODS: { label: string; value: Period }[] = [
    { label: '7 days', value: '7d' },
    { label: '30 days', value: '30d' },
    { label: '90 days', value: '90d' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>
            Marketplace Intelligence
          </h1>
          <p className="mt-1 text-sm text-gray-500">Platform performance and market insights</p>
        </div>
        <div className="flex rounded-lg border border-gray-200 bg-white">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p.value
                  ? 'rounded-lg bg-teal-500 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Total Leads" value={insights?.totalLeads ?? 0} icon={TrendingUp} color="#2ABFBF" />
            <StatCard label="Accepted" value={insights?.leadsAccepted ?? 0} icon={Users} color="#38A169" />
            <StatCard label="Converted" value={insights?.leadsConverted ?? 0} icon={BarChart3} color="#1A2B4A" />
            <StatCard
              label="Avg Contract"
              value={`$${Math.round((insights?.averageContractValueCents ?? 0) / 100).toLocaleString()}`}
              icon={DollarSign}
              color="#E8793A"
            />
            <StatCard label="Active GCs" value={insights?.activeContractors ?? 0} icon={Users} color="#2ABFBF" />
            <StatCard
              label="Avg Score"
              value={insights?.averageContractorScore ?? 0}
              icon={Star}
              color="#38A169"
              sub="out of 100"
            />
          </div>

          {/* Funnel + Top contractors row */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* Lead funnel */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Lead Funnel</h3>
              <div className="space-y-3">
                {[
                  { label: 'Generated', value: funnel?.generated ?? 0, pct: 100, color: '#2ABFBF' },
                  { label: 'Accepted', value: funnel?.accepted ?? 0, pct: funnel?.acceptanceRate ?? 0, color: '#38A169' },
                  { label: 'Converted', value: funnel?.converted ?? 0, pct: funnel?.conversionRate ?? 0, color: '#E8793A' },
                ].map(row => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{row.label}</span>
                      <span className="font-medium" style={{ color: row.color }}>{row.value} ({row.pct}%)</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${row.pct}%`, backgroundColor: row.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {(funnel?.byTrade.length ?? 0) > 0 && (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-medium text-gray-500">By Trade Category</p>
                  <div className="space-y-1">
                    {funnel!.byTrade.slice(0, 5).map(t => (
                      <div key={t.tradeCategory} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{t.tradeCategory.replace(/_/g, ' ')}</span>
                        <span className="font-medium text-gray-800">
                          {t.converted}/{t.generated} converted
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Top contractors */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold" style={{ color: '#1A2B4A' }}>Top Contractors by Score</h3>
              {(insights?.topContractors.length ?? 0) === 0 ? (
                <p className="text-sm text-gray-400">No score data yet for this period.</p>
              ) : (
                <div className="space-y-3">
                  {insights!.topContractors.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <div
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: i === 0 ? '#E8793A' : i === 1 ? '#2ABFBF' : '#38A169' }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#1A2B4A' }}>
                          {c.name || c.id}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400" />
                        <span className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{c.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
