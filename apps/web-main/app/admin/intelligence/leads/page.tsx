'use client'

import { useCallback, useEffect, useState } from 'react'
import { useOpsAuth, fetchIntelligenceApi } from '@/lib/admin/use-ops-auth'

interface LeadRow {
  id: string
  email: string | null
  name: string | null
  segment: string | null
  crmStatus: string | null
  sourceChannel: string | null
  complianceFlags: string[]
  propertyTwin?: { address: string; jurisdiction: string | null } | null
  intelligenceRuns: Array<{
    id: string
    confidenceScore: number
    requiresHumanReview: boolean
    outputSnapshot: Record<string, unknown>
  }>
}

export default function IntelligenceLeadsPage() {
  const { secret } = useOpsAuth()
  const [items, setItems] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [segment, setSegment] = useState('')
  const [priority, setPriority] = useState('')

  const load = useCallback(async () => {
    if (!secret) return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (segment) params.set('segment', segment)
      if (priority) params.set('priority', priority)
      const data = await fetchIntelligenceApi<{ items: LeadRow[] }>(
        `/api/admin/intelligence/leads?${params}`,
        secret,
      )
      setItems(data.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [secret, segment, priority])

  useEffect(() => {
    void load()
  }, [load])

  if (!secret) {
    return <p className="text-gray-500">Enter your Kealee ops secret above to load leads.</p>
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-[#1A2B4A]">Lead Intelligence</h2>
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          placeholder="Segment"
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        />
        <input
          placeholder="Sales priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
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
              <th className="px-4 py-2">Lead</th>
              <th className="px-4 py-2">Segment</th>
              <th className="px-4 py-2">Priority</th>
              <th className="px-4 py-2">Property</th>
              <th className="px-4 py-2">Confidence</th>
              <th className="px-4 py-2">Review</th>
              <th className="px-4 py-2">Recommended Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const run = row.intelligenceRuns[0]
              const output = run?.outputSnapshot as { recommendedSalesAction?: string } | undefined
              return (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">
                    <div className="font-medium">{row.name ?? '—'}</div>
                    <div className="text-gray-500">{row.email}</div>
                  </td>
                  <td className="px-4 py-2">{row.segment ?? '—'}</td>
                  <td className="px-4 py-2">{row.crmStatus ?? '—'}</td>
                  <td className="px-4 py-2">{row.propertyTwin?.address ?? '—'}</td>
                  <td className="px-4 py-2">
                    {run ? `${(run.confidenceScore * 100).toFixed(0)}%` : '—'}
                  </td>
                  <td className="px-4 py-2">
                    {run?.requiresHumanReview ? (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">Yes</span>
                    ) : (
                      'No'
                    )}
                  </td>
                  <td className="px-4 py-2">{output?.recommendedSalesAction ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
