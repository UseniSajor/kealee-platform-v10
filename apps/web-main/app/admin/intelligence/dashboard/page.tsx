'use client'

import { useCallback, useEffect, useState } from 'react'
import { useOpsAuth, fetchIntelligenceApi } from '@/lib/admin/use-ops-auth'

interface DashboardData {
  counts: {
    properties: number
    opportunities: number
    leads: number
    capital: number
    projects: number
    awaitingReview: number
  }
  recentRuns: Array<{
    id: string
    engineType: string
    triggerEvent: string
    confidenceScore: number
    requiresHumanReview: boolean
    createdAt: string
    propertyTwin?: { address: string } | null
    leadTwin?: { email: string | null } | null
  }>
}

export default function IntelligenceDashboardPage() {
  const { secret } = useOpsAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!secret) return
    setLoading(true)
    setError('')
    try {
      const result = await fetchIntelligenceApi<DashboardData>(
        '/api/admin/intelligence/dashboard',
        secret,
      )
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [secret])

  useEffect(() => {
    void load()
  }, [load])

  if (!secret) {
    return <p className="text-gray-500">Enter your Kealee ops secret above to load the dashboard.</p>
  }

  if (loading && !data) return <p className="text-gray-500">Loading dashboard…</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (!data) return null

  const cards = [
    { label: 'Properties', value: data.counts.properties, href: '/admin/intelligence/properties' },
    { label: 'Opportunities', value: data.counts.opportunities, href: '/admin/intelligence/opportunities' },
    { label: 'Leads', value: data.counts.leads, href: '/admin/intelligence/leads' },
    { label: 'Capital', value: data.counts.capital, href: '/admin/intelligence/capital' },
    { label: 'Projects', value: data.counts.projects, href: '/admin/intelligence/projects' },
    { label: 'Awaiting Review', value: data.counts.awaitingReview, href: '/admin/intelligence/review' },
  ]

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-[#1A2B4A]">Intelligence Dashboard</h2>
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <a
            key={c.label}
            href={c.href}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-[#1A2B4A]"
          >
            <p className="text-2xl font-bold text-[#1A2B4A]">{c.value}</p>
            <p className="text-sm text-gray-500">{c.label}</p>
          </a>
        ))}
      </div>

      <h3 className="mb-3 font-medium text-gray-700">Recent Intelligence Runs</h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-2">Engine</th>
              <th className="px-4 py-2">Trigger</th>
              <th className="px-4 py-2">Subject</th>
              <th className="px-4 py-2">Confidence</th>
              <th className="px-4 py-2">Review</th>
              <th className="px-4 py-2">When</th>
            </tr>
          </thead>
          <tbody>
            {data.recentRuns.map((run) => (
              <tr key={run.id} className="border-t border-gray-100">
                <td className="px-4 py-2 font-medium">{run.engineType}</td>
                <td className="px-4 py-2">{run.triggerEvent}</td>
                <td className="px-4 py-2">
                  {run.propertyTwin?.address ?? run.leadTwin?.email ?? '—'}
                </td>
                <td className="px-4 py-2">{(run.confidenceScore * 100).toFixed(0)}%</td>
                <td className="px-4 py-2">
                  {run.requiresHumanReview ? (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">Yes</span>
                  ) : (
                    <span className="text-gray-400">No</span>
                  )}
                </td>
                <td className="px-4 py-2 text-gray-500">
                  {new Date(run.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
