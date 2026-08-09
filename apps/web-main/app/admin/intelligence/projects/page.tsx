'use client'

import { useCallback, useEffect, useState } from 'react'
import { useOpsAuth, fetchIntelligenceApi } from '@/lib/admin/use-ops-auth'

interface ProjectRow {
  id: string
  name: string | null
  healthScore: number
  permitStatus: string | null
  missingItems: string[]
  riskFlags: string[]
  budget: unknown
  propertyTwin?: { address: string } | null
  leadTwin?: { email: string | null; name: string | null } | null
  intelligenceRuns: Array<{
    id: string
    confidenceScore: number
    requiresHumanReview: boolean
    outputSnapshot: Record<string, unknown>
  }>
}

export default function IntelligenceProjectsPage() {
  const { secret } = useOpsAuth()
  const [items, setItems] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [minHealth, setMinHealth] = useState('')

  const load = useCallback(async () => {
    if (!secret) return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (minHealth) params.set('minScore', minHealth)
      const data = await fetchIntelligenceApi<{ items: ProjectRow[] }>(
        `/api/admin/intelligence/projects?${params}`,
        secret,
      )
      setItems(data.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [secret, minHealth])

  useEffect(() => {
    void load()
  }, [load])

  if (!secret) {
    return <p className="text-gray-500">Enter your Kealee ops secret above to load project intelligence.</p>
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-[#1A2B4A]">Project Intelligence</h2>
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          placeholder="Min health score"
          value={minHealth}
          onChange={(e) => setMinHealth(e.target.value)}
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
              <th className="px-4 py-2">Project</th>
              <th className="px-4 py-2">Health</th>
              <th className="px-4 py-2">Permit</th>
              <th className="px-4 py-2">Missing</th>
              <th className="px-4 py-2">Risks</th>
              <th className="px-4 py-2">Review</th>
              <th className="px-4 py-2">Next Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const run = row.intelligenceRuns[0]
              const output = run?.outputSnapshot as {
                recommendedNextActions?: Array<{ action: string }>
              } | undefined
              return (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">
                    <div className="font-medium">{row.name ?? row.propertyTwin?.address ?? '—'}</div>
                    <div className="text-gray-500">{row.leadTwin?.email}</div>
                  </td>
                  <td className="px-4 py-2 font-medium">{row.healthScore.toFixed(0)}</td>
                  <td className="px-4 py-2">{row.permitStatus ?? '—'}</td>
                  <td className="px-4 py-2">{row.missingItems.join(', ') || '—'}</td>
                  <td className="px-4 py-2">{row.riskFlags.join(', ') || '—'}</td>
                  <td className="px-4 py-2">
                    {run?.requiresHumanReview ? (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">Yes</span>
                    ) : (
                      'No'
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {output?.recommendedNextActions?.map((a) => a.action).join(', ') ?? '—'}
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
