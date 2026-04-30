'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'

interface QueuePermit {
  id: string
  scope: string
  address: string
  permitType: string
  kealeeStatus: string
  aiReviewScore: number | null
  createdAt: string
  jurisdiction: { name: string } | null
  aiReviews: Array<{ overallScore: number; readyToSubmit: boolean; reviewedAt: string }>
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.kealee.com'

function statusBadge(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    AI_PRE_REVIEW: 'bg-blue-100 text-blue-700',
    READY_TO_SUBMIT: 'bg-green-100 text-green-700',
    SUBMITTED: 'bg-purple-100 text-purple-700',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

export default function PermitReviewQueuePage() {
  const [permits, setPermits] = useState<QueuePermit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch(`${API}/api/permits/review-queue`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setPermits(d.permits ?? []))
      .catch(() => setError('Failed to load review queue'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = permits.filter(p =>
    !search ||
    p.scope?.toLowerCase().includes(search.toLowerCase()) ||
    p.address?.toLowerCase().includes(search.toLowerCase()) ||
    p.jurisdiction?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="p-6 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Permit Review Queue</h1>
              <p className="text-sm text-gray-500 mt-1">
                AI-generated roadmaps awaiting specialist approval before submission
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
              {permits.length} pending
            </span>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by scope, address, or jurisdiction…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Info banner */}
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex gap-2">
            <span className="font-semibold">⚠ Specialist action required.</span>
            <span>No permit may be submitted to a building department without your approval. Review each roadmap carefully before approving.</span>
          </div>

          {loading && <p className="text-gray-500 text-sm">Loading…</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg font-medium">No permits awaiting review</p>
              <p className="text-sm mt-1">New AI-generated roadmaps will appear here.</p>
            </div>
          )}

          <div className="space-y-3">
            {filtered.map(permit => {
              const latestReview = permit.aiReviews?.[0]
              const score = latestReview?.overallScore ?? permit.aiReviewScore
              return (
                <div
                  key={permit.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between gap-4 hover:border-orange-300 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge(permit.kealeeStatus)}`}>
                        {permit.kealeeStatus?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-400">{permit.permitType}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">{permit.scope || 'No scope'}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {permit.address || '—'} · {permit.jurisdiction?.name ?? 'Unknown jurisdiction'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Generated {new Date(permit.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {score != null && (
                    <div className="text-center flex-shrink-0">
                      <div className={`text-2xl font-bold ${score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                        {score}
                      </div>
                      <div className="text-xs text-gray-400">AI score</div>
                    </div>
                  )}

                  <Link
                    href={`/permits/review/${permit.id}`}
                    className="flex-shrink-0 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Review →
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
