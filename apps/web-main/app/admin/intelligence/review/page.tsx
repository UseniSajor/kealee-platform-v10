'use client'

import { useCallback, useEffect, useState } from 'react'
import { useOpsAuth, fetchIntelligenceApi } from '@/lib/admin/use-ops-auth'

interface ReviewRow {
  id: string
  loopType: string
  status: string
  createdAt: string
  propertyTwin: { address: string; jurisdiction: string | null } | null
  leadTwin: { email: string | null; name: string | null } | null
  opportunityScores: Array<{ totalOpportunityScore: number; reviewReasons: string[] }>
  steps: Array<{ stepName: string; agentId: string | null; status: string; stepOrder?: number }>
}

export default function IntelligenceReviewPage() {
  const { secret } = useOpsAuth()
  const [items, setItems] = useState<ReviewRow[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    if (!secret) return
    const data = await fetchIntelligenceApi<{ items: ReviewRow[] }>(
      '/api/admin/intelligence/review',
      secret,
    )
    setItems(data.items)
  }, [secret])

  useEffect(() => {
    void load()
  }, [load])

  async function resolve(loopRunId: string, decision: 'approved' | 'rejected' | 'deferred') {
    if (!secret) return
    await fetchIntelligenceApi('/api/admin/intelligence/review', secret, {
      method: 'POST',
      body: JSON.stringify({ loopRunId, decision, notes: notes[loopRunId] }),
    })
    await load()
  }

  if (!secret) {
    return <p className="text-gray-500">Enter your Kealee ops secret above.</p>
  }

  return (
    <div className="space-y-4">
      {items.map((row) => {
        const score = row.opportunityScores[0]
        return (
          <article key={row.id} className="rounded-xl border bg-white p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <h2 className="font-semibold">{row.propertyTwin?.address ?? 'Unknown property'}</h2>
                <p className="text-sm text-gray-500">
                  {row.leadTwin?.name ?? row.leadTwin?.email ?? 'No lead'} · {row.loopType}
                </p>
              </div>
              <span className="text-sm text-amber-700">Score {score?.totalOpportunityScore ?? '—'}</span>
            </div>
            {score?.reviewReasons?.length ? (
              <ul className="mt-2 list-inside list-disc text-sm text-gray-600">
                {score.reviewReasons.map((r) => (
                  <li key={r}>{r.replace(/_/g, ' ')}</li>
                ))}
              </ul>
            ) : null}
            <details className="mt-2 text-xs text-gray-400">
              <summary>Loop steps ({row.steps.length})</summary>
              <ul className="mt-1">
                {row.steps.map((s, i) => (
                  <li key={`${s.stepName}-${s.agentId ?? i}`}>
                    {s.stepOrder ?? i + 1}. {s.stepName} {s.agentId ?? ''} — {s.status}
                  </li>
                ))}
              </ul>
            </details>
            <textarea
              placeholder="Review notes"
              value={notes[row.id] ?? ''}
              onChange={(e) => setNotes((n) => ({ ...n, [row.id]: e.target.value }))}
              className="mt-3 w-full rounded border px-3 py-2 text-sm"
              rows={2}
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => resolve(row.id, 'approved')}
                className="rounded bg-green-600 px-3 py-1.5 text-sm text-white"
              >
                Approve
              </button>
              <button
                onClick={() => resolve(row.id, 'deferred')}
                className="rounded bg-amber-500 px-3 py-1.5 text-sm text-white"
              >
                Defer
              </button>
              <button
                onClick={() => resolve(row.id, 'rejected')}
                className="rounded bg-red-600 px-3 py-1.5 text-sm text-white"
              >
                Reject
              </button>
            </div>
          </article>
        )
      })}
      {items.length === 0 && <p className="text-gray-500">No items awaiting human review.</p>}
    </div>
  )
}
