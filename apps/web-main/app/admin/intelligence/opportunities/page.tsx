'use client'

import { useCallback, useEffect, useState } from 'react'
import { useOpsAuth, fetchIntelligenceApi } from '@/lib/admin/use-ops-auth'

interface Summary {
  totalProperties: number
  totalScored: number
  awaitingReview: number
  avgScore: number
  bandCounts: Record<string, number>
}

interface OppRow {
  id: string
  totalOpportunityScore: number
  recommendedPriority: string
  estimatedProjectValue: unknown
  confidenceScore: number
  scoreExplanation: string
  requiresHumanReview: boolean
  propertyTwin: {
    address: string
    jurisdiction: string | null
    propertyType: string | null
    recommendedProducts: string[]
  }
}

export default function IntelligenceOpportunitiesPage() {
  const { secret } = useOpsAuth()
  const [items, setItems] = useState<OppRow[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(false)
  const [minScore, setMinScore] = useState('')
  const [priority, setPriority] = useState('')

  const load = useCallback(async () => {
    if (!secret) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (minScore) params.set('minScore', minScore)
      if (priority) params.set('priority', priority)
      const data = await fetchIntelligenceApi<{ items: OppRow[]; summary: Summary }>(
        `/api/admin/intelligence/opportunities?${params}`,
        secret,
      )
      setItems(data.items)
      setSummary(data.summary)
    } finally {
      setLoading(false)
    }
  }, [secret, minScore, priority])

  useEffect(() => {
    void load()
  }, [load])

  if (!secret) {
    return <p className="text-gray-500">Enter your Kealee ops secret above.</p>
  }

  return (
    <div>
      {summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Properties" value={summary.totalProperties} />
          <Stat label="Scored" value={summary.totalScored} />
          <Stat label="Avg score" value={summary.avgScore} />
          <Stat label="Awaiting review" value={summary.awaitingReview} />
        </div>
      )}
      {summary && (
        <div className="mb-6 flex flex-wrap gap-2">
          {Object.entries(summary.bandCounts).map(([band, count]) => (
            <span key={band} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
              {band}: {count}
            </span>
          ))}
        </div>
      )}
      <div className="mb-4 flex gap-3">
        <input
          placeholder="Min score"
          value={minScore}
          onChange={(e) => setMinScore(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">All priorities</option>
          <option value="immediate">Immediate</option>
          <option value="high">High</option>
          <option value="nurture">Nurture</option>
          <option value="low">Low</option>
          <option value="suppress">Suppress</option>
        </select>
        <button onClick={load} className="rounded bg-[#C8521A] px-4 py-2 text-sm text-white">
          Filter
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Est. value</th>
              <th className="px-4 py-3">Review</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{row.propertyTwin.address}</div>
                  <div className="text-xs text-gray-400">{row.propertyTwin.jurisdiction}</div>
                </td>
                <td className="px-4 py-3 font-semibold">{row.totalOpportunityScore}</td>
                <td className="px-4 py-3">{row.recommendedPriority}</td>
                <td className="px-4 py-3">
                  {row.propertyTwin.recommendedProducts[0]?.replace(/_/g, ' ') ?? '—'}
                </td>
                <td className="px-4 py-3">
                  {row.estimatedProjectValue != null
                    ? `$${Number(row.estimatedProjectValue).toLocaleString()}`
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  {row.requiresHumanReview ? (
                    <span className="text-amber-600">Required</span>
                  ) : (
                    <span className="text-green-600">Auto</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!loading && items.length === 0 && <p className="mt-4 text-gray-500">No opportunity scores yet.</p>}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs uppercase text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-[#1A2B4A]">{value}</p>
    </div>
  )
}
