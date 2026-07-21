'use client'

import { useCallback, useEffect, useState } from 'react'
import { useOpsAuth, fetchIntelligenceApi } from '@/lib/admin/use-ops-auth'

interface CapitalRow {
  id: string
  capitalFitScore: number
  estimatedEquity: unknown
  estimatedLTV: number | null
  recommendedLoanProducts: string[]
  lenderRouting: string | null
  consentFinancing: boolean
  complianceFlags: string[]
  propertyTwin?: { address: string } | null
  leadTwin?: { email: string | null; name: string | null } | null
  intelligenceRuns: Array<{
    id: string
    confidenceScore: number
    requiresHumanReview: boolean
    outputSnapshot: Record<string, unknown>
  }>
}

export default function IntelligenceCapitalPage() {
  const { secret } = useOpsAuth()
  const [items, setItems] = useState<CapitalRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [minScore, setMinScore] = useState('')

  const load = useCallback(async () => {
    if (!secret) return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (minScore) params.set('minScore', minScore)
      const data = await fetchIntelligenceApi<{ items: CapitalRow[] }>(
        `/api/admin/intelligence/capital?${params}`,
        secret,
      )
      setItems(data.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [secret, minScore])

  useEffect(() => {
    void load()
  }, [load])

  if (!secret) {
    return <p className="text-gray-500">Enter your Kealee ops secret above to load capital intelligence.</p>
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-[#1A2B4A]">Capital Intelligence</h2>
      <p className="mb-4 text-sm text-gray-500">
        Capital fit scores are not credit approvals. Lender routing requires customer consent.
      </p>
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          placeholder="Min fit score"
          value={minScore}
          onChange={(e) => setMinScore(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => void load()}
          className="rounded bg-[#1A2B4A] px-4 py-2 text-sm text-white"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      {error && <p className="mb-4 text-red-600">{error}</p>}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-2">Property / Lead</th>
              <th className="px-4 py-2">Fit Score</th>
              <th className="px-4 py-2">LTV</th>
              <th className="px-4 py-2">Products</th>
              <th className="px-4 py-2">Lender Routing</th>
              <th className="px-4 py-2">Consent</th>
              <th className="px-4 py-2">Review</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const run = row.intelligenceRuns[0]
              return (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">
                    <div>{row.propertyTwin?.address ?? '—'}</div>
                    <div className="text-gray-500">{row.leadTwin?.email}</div>
                  </td>
                  <td className="px-4 py-2 font-medium">{row.capitalFitScore.toFixed(0)}</td>
                  <td className="px-4 py-2">{row.estimatedLTV?.toFixed(1) ?? '—'}%</td>
                  <td className="px-4 py-2">{row.recommendedLoanProducts.join(', ') || '—'}</td>
                  <td className="px-4 py-2">{row.lenderRouting ?? '—'}</td>
                  <td className="px-4 py-2">{row.consentFinancing ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-2">
                    {run?.requiresHumanReview ? (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">Required</span>
                    ) : (
                      'No'
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
