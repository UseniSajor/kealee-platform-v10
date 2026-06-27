'use client'

import { useCallback, useEffect, useState } from 'react'
import { useOpsAuth, fetchIntelligenceApi } from '@/lib/admin/use-ops-auth'

interface CampaignRow {
  id: string
  recommendedCampaign: string
  recommendedChannel: string
  recommendedOffer: string | null
  salesPriority: string | null
  nurtureSequence: string | null
  suppressionFlags: string[]
  requiresHumanReview: boolean
  propertyTwin: { address: string; jurisdiction: string | null }
}

export default function IntelligenceCampaignsPage() {
  const { secret } = useOpsAuth()
  const [items, setItems] = useState<CampaignRow[]>([])
  const [priority, setPriority] = useState('')
  const [status, setStatus] = useState('')

  const load = useCallback(async () => {
    if (!secret) return
    const params = new URLSearchParams()
    if (priority) params.set('priority', priority)
    if (status) params.set('campaignStatus', status)
    const data = await fetchIntelligenceApi<{ items: CampaignRow[] }>(
      `/api/admin/intelligence/campaigns?${params}`,
      secret,
    )
    setItems(data.items)
  }, [secret, priority, status])

  useEffect(() => {
    void load()
  }, [load])

  if (!secret) {
    return <p className="text-gray-500">Enter your Kealee ops secret above.</p>
  }

  return (
    <div>
      <div className="mb-4 flex gap-3">
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded border px-3 py-2 text-sm">
          <option value="">All priorities</option>
          <option value="immediate">Immediate</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="routed">Routed</option>
          <option value="suppressed">Suppressed</option>
        </select>
        <button onClick={load} className="rounded bg-[#C8521A] px-4 py-2 text-sm text-white">
          Filter
        </button>
      </div>
      <div className="grid gap-4">
        {items.map((c) => (
          <article key={c.id} className="rounded-xl border bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold">{c.recommendedCampaign}</h2>
                <p className="text-sm text-gray-500">{c.propertyTwin.address}</p>
              </div>
              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
                {c.recommendedChannel}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">Offer: {c.recommendedOffer ?? '—'}</p>
            <p className="text-sm text-gray-600">Nurture: {c.nurtureSequence ?? '—'}</p>
            {c.suppressionFlags.length > 0 && (
              <p className="mt-2 text-xs text-amber-700">Suppressed: {c.suppressionFlags.join(', ')}</p>
            )}
          </article>
        ))}
      </div>
      {items.length === 0 && <p className="text-gray-500">No campaign recommendations yet.</p>}
    </div>
  )
}
