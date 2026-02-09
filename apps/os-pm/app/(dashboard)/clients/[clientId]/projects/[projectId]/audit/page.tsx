'use client'

import { useEffect, useState, useCallback, Fragment } from 'react'
import { useParams } from 'next/navigation'
import { ChevronDown, ChevronRight, Filter, Search } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  performedBy: string
  performedAt: string
  userEmail?: string
  beforeData?: any
  afterData?: any
  fieldChanges?: string[]
  description?: string
  severity: string
  createdAt: string
}

interface Pagination {
  total: number
  limit: number
  totalPages: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACTION_OPTIONS = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SIGN', 'EXPORT'] as const
const ENTITY_OPTIONS = ['PROJECT', 'MILESTONE', 'BID', 'CHANGE_ORDER', 'PAYMENT', 'CONTRACT', 'DOCUMENT', 'USER'] as const

function actionColor(action: string) {
  const map: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
    APPROVE: 'bg-emerald-100 text-emerald-800',
    REJECT: 'bg-orange-100 text-orange-800',
    SIGN: 'bg-teal-100 text-teal-800',
    EXPORT: 'bg-purple-100 text-purple-800',
  }
  return map[action] ?? 'bg-neutral-100 text-neutral-700'
}

function severityColor(severity: string) {
  if (severity === 'CRITICAL') return 'bg-red-100 text-red-800 border-red-200'
  if (severity === 'WARNING') return 'bg-amber-100 text-amber-800 border-amber-200'
  return 'bg-neutral-100 text-neutral-700 border-neutral-200'
}

// ---------------------------------------------------------------------------
// Diff Viewer (side-by-side)
// ---------------------------------------------------------------------------

function DiffViewer({ before, after }: { before?: any; after?: any }) {
  if (!before && !after) return <p className="text-sm text-gray-500 italic">No change data available</p>
  return (
    <div className="grid grid-cols-2 gap-4 mt-2">
      <div>
        <p className="text-xs font-semibold text-red-600 uppercase mb-1">Before</p>
        <pre className="text-xs bg-red-50 border border-red-200 rounded p-3 overflow-auto max-h-48">
          {before ? JSON.stringify(before, null, 2) : '(empty)'}
        </pre>
      </div>
      <div>
        <p className="text-xs font-semibold text-green-600 uppercase mb-1">After</p>
        <pre className="text-xs bg-green-50 border border-green-200 rounded p-3 overflow-auto max-h-48">
          {after ? JSON.stringify(after, null, 2) : '(empty)'}
        </pre>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function ProjectAuditPage() {
  const { projectId } = useParams<{ clientId: string; projectId: string }>()

  const PAGE_SIZE = 25
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({ total: 0, limit: PAGE_SIZE, totalPages: 0 })
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [filters, setFilters] = useState({ action: '', entityType: '', startDate: '', endDate: '' })

  // ---- Fetch ----
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ offset: String((page - 1) * PAGE_SIZE), limit: String(PAGE_SIZE) })
      if (filters.action) params.set('action', filters.action)
      if (filters.entityType) params.set('entityType', filters.entityType)
      if (filters.startDate) params.set('startDate', filters.startDate)
      if (filters.endDate) params.set('endDate', filters.endDate)

      const res = await fetch(`/api/audit/project/${projectId}?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setEntries(json.data ?? [])
      setPagination(json.pagination ?? { total: 0, limit: PAGE_SIZE, totalPages: 0 })
      setError(null)
    } catch (err: any) {
      setError(err.message ?? 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [projectId, page, filters])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const updateFilter = (key: string, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({ action: '', entityType: '', startDate: '', endDate: '' })
    setPage(1)
  }

  // ---- Render ----
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Audit Trail</h1>
        <p className="text-neutral-600 mt-1">Change history for this project</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4">
        <Filter className="h-4 w-4 text-neutral-400 self-center" />
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">Action</label>
          <select className="h-9 rounded-md border bg-white px-3 text-sm" value={filters.action} onChange={(e) => updateFilter('action', e.target.value)}>
            <option value="">All</option>
            {ACTION_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">Entity Type</label>
          <select className="h-9 rounded-md border bg-white px-3 text-sm" value={filters.entityType} onChange={(e) => updateFilter('entityType', e.target.value)}>
            <option value="">All</option>
            {ENTITY_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">Start Date</label>
          <input type="date" className="h-9 rounded-md border bg-white px-3 text-sm" value={filters.startDate} onChange={(e) => updateFilter('startDate', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">End Date</label>
          <input type="date" className="h-9 rounded-md border bg-white px-3 text-sm" value={filters.endDate} onChange={(e) => updateFilter('endDate', e.target.value)} />
        </div>
        <button onClick={fetchLogs} className="h-9 inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 text-sm font-medium text-white hover:bg-neutral-800">
          <Search className="h-3.5 w-3.5" /> Apply
        </button>
        <button onClick={clearFilters} className="h-9 inline-flex items-center rounded-md border px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
          Clear
        </button>
      </div>

      {/* Error */}
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-800" />
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <tr>
                  <th className="w-8 px-3 py-3" />
                  <th className="px-3 py-3">Timestamp</th>
                  <th className="px-3 py-3">Action</th>
                  <th className="px-3 py-3">Entity</th>
                  <th className="px-3 py-3">User</th>
                  <th className="px-3 py-3">Description</th>
                  <th className="px-3 py-3">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-500">No audit entries found</td>
                  </tr>
                ) : entries.map((e) => (
                  <Fragment key={e.id}>
                    <tr className="cursor-pointer hover:bg-neutral-50" onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}>
                      <td className="px-3 py-2 text-neutral-400">
                        {expandedId === e.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-neutral-600 text-xs">
                        {new Date(e.createdAt || e.performedAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${actionColor(e.action)}`}>{e.action}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{e.entityType}</div>
                        <div className="text-xs text-neutral-400 truncate max-w-[140px]">{e.entityId}</div>
                      </td>
                      <td className="px-3 py-2 text-neutral-700">{e.userEmail || `${(e.performedBy ?? '').substring(0, 8)}...`}</td>
                      <td className="px-3 py-2 text-neutral-600 max-w-[220px] truncate">{e.description || '\u2014'}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border ${severityColor(e.severity)}`}>{e.severity}</span>
                      </td>
                    </tr>
                    {expandedId === e.id && (
                      <tr>
                        <td colSpan={7} className="bg-neutral-50 border-l-4 border-blue-400 px-6 py-4">
                          {e.description && <p className="text-sm mb-3">{e.description}</p>}
                          <DiffViewer before={e.beforeData} after={e.afterData} />
                          {e.fieldChanges && e.fieldChanges.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-neutral-600 uppercase mb-1">Changed Fields</p>
                              <div className="flex flex-wrap gap-1">
                                {e.fieldChanges.map((f) => (
                                  <span key={f} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">{f}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-neutral-600">
                {((page - 1) * PAGE_SIZE) + 1}&ndash;{Math.min(page * PAGE_SIZE, pagination.total)} of {pagination.total.toLocaleString()}
              </p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="h-8 rounded-md border px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40">
                  Previous
                </button>
                <span className="inline-flex items-center px-2 text-sm text-neutral-500">Page {page} / {pagination.totalPages}</span>
                <button disabled={page === pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="h-8 rounded-md border px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40">
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
