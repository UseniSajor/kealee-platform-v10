'use client'

import { useCallback, useEffect, useState } from 'react'
import { useOpsAuth, fetchIntelligenceApi } from '@/lib/admin/use-ops-auth'

interface AssignmentRow {
  id: string
  recommendedCampaign: string
  recommendedOffer: string | null
  salesPriority: string | null
  requiresHumanReview: boolean
  metadata: {
    productAssignment?: {
      assignedProduct: string
      productScore: number
      landingPage: string
      landingPageLabel: string
      bot: string
      autoAssigned: boolean
    }
    autoAssigned?: boolean
    landingPage?: string
    bot?: string
  } | null
  propertyTwin?: { address: string; jurisdiction: string | null } | null
}

export default function IntelligenceAssignmentsPage() {
  const { secret } = useOpsAuth()
  const [items, setItems] = useState<AssignmentRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [autoOnly, setAutoOnly] = useState(true)

  const load = useCallback(async () => {
    if (!secret) return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (autoOnly) params.set('autoAssigned', 'true')
      const data = await fetchIntelligenceApi<{ items: AssignmentRow[] }>(
        `/api/admin/intelligence/assignments?${params}`,
        secret,
      )
      setItems(data.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [secret, autoOnly])

  useEffect(() => {
    void load()
  }, [load])

  if (!secret) {
    return <p className="text-gray-500">Enter your Kealee ops secret above to load product assignments.</p>
  }

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold text-[#1A2B4A]">Automatic Product Assignment</h2>
      <p className="mb-4 text-sm text-gray-500">
        Properties scoring 75+ are auto-routed to campaign, landing page, offer, and bot — no human intervention at 90+.
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={autoOnly} onChange={(e) => setAutoOnly(e.target.checked)} />
          Auto-assigned only
        </label>
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
              <th className="px-4 py-2">Property</th>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Score</th>
              <th className="px-4 py-2">Campaign</th>
              <th className="px-4 py-2">Landing Page</th>
              <th className="px-4 py-2">Offer</th>
              <th className="px-4 py-2">Bot</th>
              <th className="px-4 py-2">Auto</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const a = row.metadata?.productAssignment
              return (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{row.propertyTwin?.address ?? '—'}</td>
                  <td className="px-4 py-2 font-medium">{a?.assignedProduct ?? '—'}</td>
                  <td className="px-4 py-2">{a?.productScore ?? '—'}</td>
                  <td className="px-4 py-2">{row.recommendedCampaign}</td>
                  <td className="px-4 py-2">{a?.landingPageLabel ?? row.metadata?.landingPage ?? '—'}</td>
                  <td className="px-4 py-2">{row.recommendedOffer ?? '—'}</td>
                  <td className="px-4 py-2">{a?.bot ?? row.metadata?.bot ?? '—'}</td>
                  <td className="px-4 py-2">
                    {a?.autoAssigned || row.metadata?.autoAssigned ? (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-green-800">Yes</span>
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
