'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, X, Loader2, ArrowLeft } from 'lucide-react'

interface Asset {
  id: string
  title?: string
  asset_type: string
  approval_status: string
  storage_url?: string
  body?: string
  created_by: string
  labels?: string[]
}

export default function MarketingApprovalsPage() {
  const [items, setItems] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/marketing/approvals?status=submitted')
      const data = await res.json()
      if (res.ok) setItems(data.items ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function act(assetId: string, status: 'approved' | 'rejected' | 'needs_revision' | 'published') {
    setActing(assetId)
    try {
      await fetch('/api/marketing/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, status }),
      })
      await load()
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/marketing/workspace" className="text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-semibold">Marketing content approvals</h1>
        <p className="text-sm text-slate-500">Kealee admin only — approve or publish agency drafts</p>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin text-emerald-800 mx-auto" />
        ) : items.length === 0 ? (
          <p className="text-slate-500 text-center">No items awaiting approval.</p>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id} className="bg-white border rounded-xl p-4">
                <div className="flex gap-4">
                  {item.storage_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.storage_url} alt="" className="w-32 h-24 object-cover rounded-lg" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.title ?? item.asset_type}</p>
                    {item.body && <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap line-clamp-4">{item.body}</p>}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(item.labels ?? []).map((l) => (
                        <span key={l} className="text-xs bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded">{l}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    disabled={acting === item.id}
                    onClick={() => act(item.id, 'approved')}
                    className="flex items-center gap-1 text-sm bg-emerald-700 text-white px-3 py-1.5 rounded-lg"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button
                    type="button"
                    disabled={acting === item.id}
                    onClick={() => act(item.id, 'published')}
                    className="text-sm bg-blue-700 text-white px-3 py-1.5 rounded-lg"
                  >
                    Publish
                  </button>
                  <button
                    type="button"
                    disabled={acting === item.id}
                    onClick={() => act(item.id, 'needs_revision')}
                    className="text-sm border px-3 py-1.5 rounded-lg"
                  >
                    Needs revision
                  </button>
                  <button
                    type="button"
                    disabled={acting === item.id}
                    onClick={() => act(item.id, 'rejected')}
                    className="flex items-center gap-1 text-sm text-red-700 border border-red-200 px-3 py-1.5 rounded-lg"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
