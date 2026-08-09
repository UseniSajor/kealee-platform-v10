'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Brain, ExternalLink, Loader2, RefreshCw } from 'lucide-react'

interface IntelligenceSummary {
  scoredIntakes: number
  autoAssigned: number
  awaitingReview: number
  byPriority: Record<string, number>
  recent: Array<{
    id: string
    client_name: string
    intelligence_priority: string | null
    intelligence_segment: string | null
    lead_score: number | null
    topProduct: string | null
    campaign: string | null
    offer: string | null
  }>
}

const PRIORITY_STYLE: Record<string, string> = {
  immediate: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  nurture: 'bg-blue-100 text-blue-800',
  low: 'bg-gray-100 text-gray-600',
  suppress: 'bg-gray-100 text-gray-400',
}

export function CommandCenterIntelligencePanel() {
  const [data, setData] = useState<IntelligenceSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/command-center/intelligence/summary')
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <section className="mb-6 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-[#1A2B4A]">Intelligence Engines</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <Link
            href="/admin/intelligence/dashboard"
            className="flex items-center gap-1 rounded-lg bg-[#1A2B4A] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            Full dashboard
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex h-20 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
        </div>
      ) : !data ? (
        <p className="text-sm text-gray-500">Intelligence summary unavailable.</p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Scored intakes" value={data.scoredIntakes} />
            <Stat label="Auto-assigned" value={data.autoAssigned} />
            <Stat label="Needs review" value={data.awaitingReview} />
            <Stat label="Immediate" value={data.byPriority.immediate ?? 0} />
          </div>
          {data.recent.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Lead</th>
                    <th className="px-3 py-2">Score</th>
                    <th className="px-3 py-2">Priority</th>
                    <th className="px-3 py-2 hidden sm:table-cell">Product</th>
                    <th className="px-3 py-2 hidden md:table-cell">Campaign / Offer</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.slice(0, 8).map((row) => (
                    <tr key={row.id} className="border-t border-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-800">{row.client_name}</td>
                      <td className="px-3 py-2">{row.lead_score ?? '—'}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 font-medium ${
                            PRIORITY_STYLE[row.intelligence_priority ?? ''] ?? 'bg-gray-100'
                          }`}
                        >
                          {row.intelligence_priority ?? '—'}
                        </span>
                      </td>
                      <td className="hidden px-3 py-2 sm:table-cell">
                        {row.topProduct?.replace(/_/g, ' ') ?? '—'}
                      </td>
                      <td className="hidden px-3 py-2 text-gray-500 md:table-cell">
                        {row.campaign ?? '—'}
                        {row.offer ? ` · ${row.offer}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white bg-white/80 px-3 py-2 shadow-sm">
      <p className="text-xl font-bold text-[#1A2B4A]">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
