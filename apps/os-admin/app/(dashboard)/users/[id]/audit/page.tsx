'use client'

import { Fragment, useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { ChevronDown, ChevronRight, Filter, Search } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string
  description?: string
  changeDescription?: string
  beforeData?: any
  afterData?: any
  fieldChanges?: string[]
  projectId?: string
  severity: string
  createdAt: string
  performedAt: string
}

interface Pagination {
  total: number
  limit: number
  totalPages: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACTION_OPTIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT', 'EXPORT', 'SIGN'] as const
const ENTITY_OPTIONS = ['USER', 'CONTRACT', 'ESCROW', 'PAYMENT', 'PROJECT', 'MILESTONE', 'BID', 'CHANGE_ORDER', 'SESSION'] as const

function actionColor(action: string) {
  const map: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
    APPROVE: 'bg-emerald-100 text-emerald-800',
    REJECT: 'bg-orange-100 text-orange-800',
    LOGIN: 'bg-indigo-100 text-indigo-800',
    LOGOUT: 'bg-gray-100 text-gray-800',
    EXPORT: 'bg-purple-100 text-purple-800',
    SIGN: 'bg-teal-100 text-teal-800',
  }
  return map[action] ?? 'bg-neutral-100 text-neutral-700'
}

function severityColor(severity: string) {
  if (severity === 'CRITICAL') return 'bg-red-100 text-red-800 border-red-200'
  if (severity === 'WARNING') return 'bg-amber-100 text-amber-800 border-amber-200'
  return 'bg-neutral-100 text-neutral-700 border-neutral-200'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UserAuditPage() {
  const { id } = useParams<{ id: string }>()

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({ total: 0, limit: 25, totalPages: 0 })
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [filters, setFilters] = useState({ action: '', entityType: '', startDate: '', endDate: '' })

  const limit = 25

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ offset: String((page - 1) * limit), limit: String(limit) })
      if (filters.action) params.set('action', filters.action)
      if (filters.entityType) params.set('entityType', filters.entityType)
      if (filters.startDate) params.set('startDate', filters.startDate)
      if (filters.endDate) params.set('endDate', filters.endDate)

      const res = await fetch(`/api/audit/user/${id}?${params}`)
      const json = await res.json()
      setLogs(json.data ?? [])
      setPagination(json.pagination ?? { total: 0, limit, totalPages: 0 })
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [id, page, filters])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const onFilter = (key: string, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({ action: '', entityType: '', startDate: '', endDate: '' })
    setPage(1)
  }

  // ---- Render ----

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Audit Trail</h1>
        <p className="text-sm text-gray-500 mt-1">All audited events for user <span className="font-mono text-xs">{id}</span></p>
      </div>

      {/* Filter bar */}
      <div className="mb-5 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
          <Filter className="h-4 w-4" /> Filters
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Action</label>
            <select className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm" value={filters.action} onChange={(e) => onFilter('action', e.target.value)}>
              <option value="">All</option>
              {ACTION_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Entity Type</label>
            <select className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm" value={filters.entityType} onChange={(e) => onFilter('entityType', e.target.value)}>
              <option value="">All</option>
              {ENTITY_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start Date</label>
            <input type="date" className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm" value={filters.startDate} onChange={(e) => onFilter('startDate', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">End Date</label>
            <input type="date" className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm" value={filters.endDate} onChange={(e) => onFilter('endDate', e.target.value)} />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={fetchLogs} className="inline-flex items-center gap-1.5 rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800">
            <Search className="h-3 w-3" /> Apply
          </button>
          <button onClick={clearFilters} className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
            Clear
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-gray-300 border-t-black" />
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="w-8 px-3 py-2" />
                  <th className="px-3 py-2">Timestamp</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Entity</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Project</th>
                  <th className="px-3 py-2">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr><td colSpan={7} className="py-10 text-center text-gray-400">No audit events found</td></tr>
                ) : logs.map((log) => (
                  <Fragment key={log.id}>
                    <tr className="cursor-pointer hover:bg-gray-50" onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}>
                      <td className="px-3 py-2 text-gray-400">
                        {expandedRow === log.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                        {new Date(log.createdAt || log.performedAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${actionColor(log.action)}`}>{log.action}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{log.entityType}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[140px]">{log.entityId}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-600 max-w-[220px] truncate">{log.description || log.changeDescription || '\u2014'}</td>
                      <td className="px-3 py-2 text-xs text-gray-500 font-mono truncate max-w-[120px]">{log.projectId || '\u2014'}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${severityColor(log.severity)}`}>{log.severity}</span>
                      </td>
                    </tr>
                    {expandedRow === log.id && (
                      <tr>
                        <td colSpan={7} className="bg-gray-50 border-l-4 border-blue-400 px-6 py-3">
                          {(!log.beforeData && !log.afterData) ? (
                            <p className="text-sm italic text-gray-500">No change data available</p>
                          ) : (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-semibold uppercase text-red-600 mb-1">Before</p>
                                <pre className="text-xs bg-red-50 border border-red-200 rounded p-3 overflow-auto max-h-48">{log.beforeData ? JSON.stringify(log.beforeData, null, 2) : '(empty)'}</pre>
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase text-green-600 mb-1">After</p>
                                <pre className="text-xs bg-green-50 border border-green-200 rounded p-3 overflow-auto max-h-48">{log.afterData ? JSON.stringify(log.afterData, null, 2) : '(empty)'}</pre>
                              </div>
                              {log.fieldChanges && log.fieldChanges.length > 0 && (
                                <div className="col-span-2">
                                  <p className="text-xs font-semibold uppercase text-gray-600 mb-1">Changed Fields</p>
                                  <div className="flex flex-wrap gap-1">
                                    {log.fieldChanges.map((f) => <span key={f} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">{f}</span>)}
                                  </div>
                                </div>
                              )}
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
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                {((page - 1) * limit) + 1}&ndash;{Math.min(page * limit, pagination.total)} of {pagination.total.toLocaleString()}
              </span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium disabled:opacity-40 hover:bg-gray-50">Previous</button>
                <span className="inline-flex items-center px-2 text-xs text-gray-500">Page {page} / {pagination.totalPages}</span>
                <button disabled={page === pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium disabled:opacity-40 hover:bg-gray-50">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
