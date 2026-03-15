'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MapPin, CheckSquare, Plus, ChevronRight, Circle } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'

interface Market {
  id: string
  name: string
  jurisdictionCode: string
  status: string
  launchDate: string | null
  checklistProgress: { total: number; done: number }
}

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  PLANNED:     { label: 'Planned',     color: '#6B7280', bg: '#6B728015' },
  SOFT_LAUNCH: { label: 'Soft Launch', color: '#E8793A', bg: '#E8793A15' },
  ACTIVE:      { label: 'Active',      color: '#38A169', bg: '#38A16915' },
  PAUSED:      { label: 'Paused',      color: '#2ABFBF', bg: '#2ABFBF15' },
  DEPRECATED:  { label: 'Deprecated',  color: '#9CA3AF', bg: '#9CA3AF15' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.PLANNED
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {s.label}
    </span>
  )
}

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  useEffect(() => {
    setLoading(true)
    const qs = statusFilter !== 'ALL' ? `?status=${statusFilter}` : ''
    apiFetch<{ markets: Market[] }>(`/markets${qs}`)
      .then(res => setMarkets(res.markets ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [statusFilter])

  const STATUSES = ['ALL', 'PLANNED', 'SOFT_LAUNCH', 'ACTIVE', 'PAUSED']

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>
            Market Expansion OS
          </h1>
          <p className="mt-1 text-sm text-gray-500">Manage geographic markets and launch readiness</p>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: '#2ABFBF' }}
        >
          <Plus className="h-4 w-4" />
          New Market
        </button>
      </div>

      {/* Status filter */}
      <div className="mb-5 flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}
            style={statusFilter === s ? { backgroundColor: '#1A2B4A' } : {}}
          >
            {s === 'ALL' ? 'All Markets' : STATUS_STYLES[s]?.label ?? s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : markets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <MapPin className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">No markets yet. Add your first market to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {markets.map(market => {
            const pct = market.checklistProgress.total > 0
              ? Math.round((market.checklistProgress.done / market.checklistProgress.total) * 100)
              : 0
            return (
              <Link
                key={market.id}
                href={`/markets/${market.id}`}
                className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-teal-300 hover:shadow-sm"
              >
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: '#2ABFBF15', color: '#2ABFBF' }}
                >
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium" style={{ color: '#1A2B4A' }}>{market.name}</p>
                    <span className="text-xs text-gray-400">({market.jurisdictionCode})</span>
                    <StatusBadge status={market.status} />
                  </div>
                  {market.checklistProgress.total > 0 && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 w-32 rounded-full bg-gray-100">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#38A169' : '#2ABFBF' }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">
                        {market.checklistProgress.done}/{market.checklistProgress.total} launch tasks
                      </span>
                    </div>
                  )}
                </div>
                {market.launchDate && (
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-gray-400">Launch</p>
                    <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>
                      {new Date(market.launchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                )}
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300 group-hover:text-teal-400" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
