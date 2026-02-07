'use client'

import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import { Card, Badge, Button, Skeleton } from '@kealee/ui'
import { getReports, type WeeklyReportSummary } from '../../../lib/client-api'
import { supabase } from '../../../lib/supabase'

export default function ReportsPage() {
  const [reports, setReports] = useState<WeeklyReportSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get user's first project to fetch reports
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token
      const projRes = await fetch(`${API_URL}/projects`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).then((r) => r.json())

      const projects = projRes.projects ?? []
      if (projects.length === 0) {
        setLoading(false)
        return
      }

      const result = await getReports(projects[0].id)
      setReports(result.reports)

      // Auto-expand latest report
      if (result.reports.length > 0) {
        setExpandedId(result.reports[0].id)
      }
    } catch {
      // empty state
    } finally {
      setLoading(false)
    }
  }

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const formatDateRange = (start: string, end: string) => {
    const s = new Date(start)
    const e = new Date(end)
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    return `${s.toLocaleDateString(undefined, opts)} – ${e.toLocaleDateString(undefined, { ...opts, year: 'numeric' })}`
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Weekly updates and milestone reports for your project.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={80} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && reports.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="mb-3 h-10 w-10 text-gray-300" />
          <p className="font-medium text-gray-700">No reports yet</p>
          <p className="mt-1 text-sm text-gray-400">
            Reports will appear here once your contractor submits weekly updates.
          </p>
        </div>
      )}

      {/* Report list */}
      {!loading && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((report, index) => {
            const isExpanded = expandedId === report.id
            const isLatest = index === 0
            const metrics = report.metrics as any
            const risks = report.risks as any

            return (
              <Card key={report.id} className="overflow-hidden">
                {/* Collapsed header */}
                <button
                  onClick={() => toggle(report.id)}
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatDateRange(report.weekStart, report.weekEnd)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Weekly Report
                        {report.sentToClient && ' · Sent to you'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isLatest && (
                      <Badge variant="primary" size="sm">
                        Latest
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-5">
                    {/* Summary */}
                    <div className="mb-5">
                      <h3 className="mb-2 text-sm font-semibold text-gray-700">Summary</h3>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                        {report.summary}
                      </p>
                    </div>

                    {/* Metrics grid */}
                    {metrics && (
                      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {metrics.percentComplete !== undefined && (
                          <MetricBox label="Progress" value={`${metrics.percentComplete}%`} />
                        )}
                        {metrics.tasksCompleted !== undefined && (
                          <MetricBox label="Tasks Done" value={String(metrics.tasksCompleted)} />
                        )}
                        {metrics.budgetUsed !== undefined && (
                          <MetricBox
                            label="Budget Used"
                            value={`$${Number(metrics.budgetUsed).toLocaleString()}`}
                          />
                        )}
                        {metrics.daysRemaining !== undefined && (
                          <MetricBox label="Days Left" value={String(metrics.daysRemaining)} />
                        )}
                      </div>
                    )}

                    {/* Risks */}
                    {risks && Array.isArray(risks) && risks.length > 0 && (
                      <div className="mb-5">
                        <h3 className="mb-2 text-sm font-semibold text-gray-700">Risks &amp; Issues</h3>
                        <ul className="space-y-1">
                          {risks.map((risk: any, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                              {typeof risk === 'string' ? risk : risk.description ?? JSON.stringify(risk)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Photos */}
                    {report.photos.length > 0 && (
                      <div className="mb-5">
                        <h3 className="mb-2 text-sm font-semibold text-gray-700">Photos</h3>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {report.photos.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0"
                            >
                              <div className="h-20 w-20 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                                <img
                                  src={url}
                                  alt={`Site photo ${i + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Download */}
                    {report.fileUrl && (
                      <a href={report.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" size="sm" leftIcon={<Download className="h-4 w-4" />}>
                          Download PDF
                        </Button>
                      </a>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small metric box
// ---------------------------------------------------------------------------

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 text-center">
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
