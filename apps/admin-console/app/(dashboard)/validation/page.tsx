'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react'

interface ValidationRecord {
  id: string
  projectId: string
  status: 'PAID' | 'IN_REVIEW' | 'DELIVERED'
  dcsScore: number | null
  designRoute: 'AI_ONLY' | 'ARCHITECT_REQUIRED' | null
  createdAt: string
  staffReviewedAt: string | null
  project?: {
    name: string | null
    city: string | null
    state: string | null
    owner?: { name: string | null; email: string }
  }
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function ValidationQueuePage() {
  const [records, setRecords] = useState<ValidationRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/design/concept-validation/queue`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => setRecords(Array.isArray(data) ? data : []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }, [])

  const minutesInQueue = (createdAt: string) => {
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
  }

  const queueColor = (mins: number) =>
    mins < 480 ? '#38A169' : mins < 1440 ? '#D97706' : '#E53E3E'

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>Concept + Validation Queue</h1>
          <p className="mt-1 text-sm text-gray-500">Target: 24-hour delivery. 10-minute QA workflow per record.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium" style={{ backgroundColor: 'rgba(42,191,191,0.1)', color: '#2ABFBF' }}>
          <Clock className="h-4 w-4" />
          {records.filter(r => r.status !== 'DELIVERED').length} pending
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-20">
          <CheckCircle className="mb-3 h-10 w-10 text-green-400" />
          <p className="text-lg font-medium text-gray-600">Queue is clear</p>
          <p className="text-sm text-gray-400">No pending validations</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Project</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">DCS Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Design Route</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">In Queue</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records
                .filter(r => ['PAID', 'IN_REVIEW'].includes(r.status))
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map(record => {
                  const mins = minutesInQueue(record.createdAt)
                  return (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm" style={{ color: '#1A2B4A' }}>
                          {record.project?.name || 'Unnamed Project'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {record.project?.city}, {record.project?.state}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {record.project?.owner?.name || record.project?.owner?.email || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {record.dcsScore != null ? (
                          <span className="font-mono text-sm font-bold" style={{ color: '#1A2B4A' }}>
                            {record.dcsScore}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Scoring…</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {record.designRoute ? (
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-semibold"
                            style={{
                              backgroundColor: record.designRoute === 'AI_ONLY'
                                ? 'rgba(42,191,191,0.1)' : 'rgba(232,121,58,0.1)',
                              color: record.designRoute === 'AI_ONLY' ? '#2ABFBF' : '#E8793A',
                            }}
                          >
                            {record.designRoute === 'AI_ONLY' ? 'AI Only' : 'Architect Required'}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-semibold"
                          style={{
                            backgroundColor: record.status === 'IN_REVIEW'
                              ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)',
                            color: record.status === 'IN_REVIEW' ? '#3B82F6' : '#D97706',
                          }}
                        >
                          {record.status === 'IN_REVIEW' ? 'In Review' : 'Paid'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium" style={{ color: queueColor(mins) }}>
                          {mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/validation/${record.id}`}
                          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all hover:opacity-90"
                          style={{ backgroundColor: '#2ABFBF' }}
                        >
                          <Eye className="h-3 w-3" />
                          Review
                        </Link>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
