'use client'

import { useEffect, useState, useCallback } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronRight,
  Activity,
  Shield,
  AlertTriangle,
  Users,
  RefreshCw,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string
  performedBy: string
  performedAt: string
  userEmail?: string
  userRole?: string
  ipAddress?: string
  userAgent?: string
  beforeData?: any
  afterData?: any
  fieldChanges?: string[]
  description?: string
  changeDescription?: string
  projectId?: string
  organizationId?: string
  traceId?: string
  source?: string
  category: string
  severity: string
  metadata?: any
  createdAt: string
}

interface AuditStats {
  totalEvents: number
  eventsToday: number
  criticalEvents: number
  uniqueUsers: number
  byAction: Record<string, number>
  byEntityType: Record<string, number>
  byCategory: Record<string, number>
  bySeverity: Record<string, number>
}

// ============================================================================
// HELPERS
// ============================================================================

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
    case 'WARNING': return 'bg-amber-100 text-amber-800 border-amber-200'
    default: return 'bg-neutral-100 text-neutral-700 border-neutral-200'
  }
}

function getActionColor(action: string) {
  switch (action) {
    case 'CREATE': return 'bg-green-100 text-green-800'
    case 'UPDATE': return 'bg-blue-100 text-blue-800'
    case 'DELETE': return 'bg-red-100 text-red-800'
    case 'APPROVE': return 'bg-emerald-100 text-emerald-800'
    case 'REJECT': return 'bg-orange-100 text-orange-800'
    case 'LOGIN': return 'bg-indigo-100 text-indigo-800'
    case 'LOGOUT': return 'bg-gray-100 text-gray-800'
    case 'EXPORT': return 'bg-purple-100 text-purple-800'
    case 'SIGN': return 'bg-teal-100 text-teal-800'
    default: return 'bg-neutral-100 text-neutral-700'
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'FINANCIAL': return '$'
    case 'SECURITY': return '🛡'
    case 'COMPLIANCE': return '📋'
    case 'ADMINISTRATIVE': return '⚙'
    default: return '📝'
  }
}

// ============================================================================
// DIFF VIEWER
// ============================================================================

function DiffViewer({ before, after, changedFields }: { before?: any; after?: any; changedFields?: string[] }) {
  if (!before && !after) {
    return <p className="text-sm text-gray-500 italic">No change data available</p>
  }

  return (
    <div className="grid grid-cols-2 gap-4 mt-2">
      <div>
        <p className="text-xs font-semibold text-red-600 uppercase mb-1">Before</p>
        <pre className="text-xs bg-red-50 border border-red-200 rounded p-3 overflow-auto max-h-60">
          {before ? JSON.stringify(before, null, 2) : '(empty)'}
        </pre>
      </div>
      <div>
        <p className="text-xs font-semibold text-green-600 uppercase mb-1">After</p>
        <pre className="text-xs bg-green-50 border border-green-200 rounded p-3 overflow-auto max-h-60">
          {after ? JSON.stringify(after, null, 2) : '(empty)'}
        </pre>
      </div>
      {changedFields && changedFields.length > 0 && (
        <div className="col-span-2">
          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Changed Fields</p>
          <div className="flex flex-wrap gap-1">
            {changedFields.map((field) => (
              <span key={field} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                {field}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [pagination, setPagination] = useState({ total: 0, limit: 50, totalPages: 0 })
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    userId: '',
    projectId: '',
    source: '',
    severity: '',
    startDate: '',
    endDate: '',
  })

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true)
      const params: any = {
        offset: (page - 1) * pageSize,
        limit: pageSize,
      }
      if (filters.action) params.action = filters.action
      if (filters.entityType) params.entityType = filters.entityType
      if (filters.userId) params.userId = filters.userId
      if (filters.projectId) params.projectId = filters.projectId
      if (filters.source) params.source = filters.source
      if (filters.severity) params.severity = filters.severity
      if (filters.startDate) params.startDate = filters.startDate
      if (filters.endDate) params.endDate = filters.endDate

      const queryString = new URLSearchParams(params).toString()
      const response = await fetch(`/api/audit/search?${queryString}`)
      const data = await response.json()

      setAuditLogs(data.data || [])
      setPagination(data.pagination || { total: 0, limit: pageSize, totalPages: 0 })
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, filters])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/audit/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch {
      // Stats are non-critical
    }
  }, [])

  useEffect(() => {
    fetchAuditLogs()
    fetchStats()
  }, [fetchAuditLogs, fetchStats])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({ action: '', entityType: '', userId: '', projectId: '', source: '', severity: '', startDate: '', endDate: '' })
    setPage(1)
  }

  const handleExportCsv = async () => {
    try {
      const params: any = {}
      if (filters.action) params.action = filters.action
      if (filters.entityType) params.entityType = filters.entityType
      if (filters.userId) params.userId = filters.userId
      if (filters.projectId) params.projectId = filters.projectId
      if (filters.source) params.source = filters.source
      if (filters.severity) params.severity = filters.severity
      if (filters.startDate) params.startDate = filters.startDate
      if (filters.endDate) params.endDate = filters.endDate

      const queryString = new URLSearchParams(params).toString()
      const response = await fetch(`/api/audit/export/csv?${queryString}`)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError('Failed to export CSV')
    }
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Audit Logs</h1>
              <p className="text-gray-600 mt-1">Platform-wide audit trail — every data change, access event, and user action</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchAuditLogs} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={handleExportCsv} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Total Events</p>
                      <p className="text-2xl font-bold">{stats.totalEvents.toLocaleString()}</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Today</p>
                      <p className="text-2xl font-bold">{stats.eventsToday.toLocaleString()}</p>
                    </div>
                    <Shield className="h-8 w-8 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Critical</p>
                      <p className="text-2xl font-bold text-red-600">{stats.criticalEvents.toLocaleString()}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Unique Users</p>
                      <p className="text-2xl font-bold">{stats.uniqueUsers.toLocaleString()}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-500">Action</label>
                  <select
                    className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm"
                    value={filters.action}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                  >
                    <option value="">All</option>
                    {['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT', 'EXPORT', 'SIGN', 'ESCALATE'].map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-500">Entity Type</label>
                  <select
                    className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm"
                    value={filters.entityType}
                    onChange={(e) => handleFilterChange('entityType', e.target.value)}
                  >
                    <option value="">All</option>
                    {['USER', 'CONTRACT', 'ESCROW', 'PAYMENT', 'PROJECT', 'MILESTONE', 'BID', 'CHANGE_ORDER', 'SUBSCRIPTION', 'SESSION', 'ROLE'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-500">Severity</label>
                  <select
                    className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm"
                    value={filters.severity}
                    onChange={(e) => handleFilterChange('severity', e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="INFO">Info</option>
                    <option value="WARNING">Warning</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-500">Source</label>
                  <select
                    className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm"
                    value={filters.source}
                    onChange={(e) => handleFilterChange('source', e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="api">API</option>
                    <option value="command-center">Command Center</option>
                    <option value="webhook">Webhook</option>
                    <option value="cron">Cron</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-500">User ID</label>
                  <Input
                    placeholder="User UUID"
                    value={filters.userId}
                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-500">Project ID</label>
                  <Input
                    placeholder="Project UUID"
                    value={filters.projectId}
                    onChange={(e) => handleFilterChange('projectId', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-500">Start Date</label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-500">End Date</label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={fetchAuditLogs} size="sm">
                  <Search className="mr-2 h-3 w-3" />
                  Apply
                </Button>
                <Button onClick={clearFilters} variant="outline" size="sm">
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                <p className="mt-4 text-gray-600">Loading audit logs...</p>
              </div>
            </div>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Audit Trail</CardTitle>
                  <CardDescription>
                    {pagination.total.toLocaleString()} total entries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8" />
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Severity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                            No audit logs found
                          </TableCell>
                        </TableRow>
                      ) : (
                        auditLogs.map((log) => (
                          <>
                            <TableRow
                              key={log.id}
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                            >
                              <TableCell className="w-8 text-gray-400">
                                {expandedRow === log.id ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </TableCell>
                              <TableCell className="text-gray-600 text-xs whitespace-nowrap">
                                {new Date(log.createdAt || log.performedAt).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge className={getActionColor(log.action)} variant="outline">
                                  {log.action}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="text-sm font-medium flex items-center gap-1">
                                    <span className="text-xs">{getCategoryIcon(log.category)}</span>
                                    {log.entityType}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate max-w-[180px]">
                                    {log.entityId}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {log.userEmail || (
                                    <span className="text-gray-500 font-mono text-xs">
                                      {log.performedBy?.substring(0, 8)}...
                                    </span>
                                  )}
                                </div>
                                {log.userRole && (
                                  <div className="text-xs text-gray-400">{log.userRole}</div>
                                )}
                              </TableCell>
                              <TableCell className="text-gray-500 text-xs">
                                {log.ipAddress || '\u2014'}
                              </TableCell>
                              <TableCell className="text-gray-500 text-xs">
                                {log.source || '\u2014'}
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getSeverityColor(log.severity)}`}>
                                  {log.severity}
                                </span>
                              </TableCell>
                            </TableRow>
                            {expandedRow === log.id && (
                              <TableRow key={`${log.id}-detail`}>
                                <TableCell colSpan={8} className="bg-gray-50 border-l-4 border-blue-400">
                                  <div className="py-2 px-4 space-y-3">
                                    {log.description && (
                                      <div>
                                        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Description</p>
                                        <p className="text-sm">{log.description || log.changeDescription}</p>
                                      </div>
                                    )}
                                    <DiffViewer
                                      before={log.beforeData}
                                      after={log.afterData}
                                      changedFields={log.fieldChanges}
                                    />
                                    <div className="grid grid-cols-3 gap-4 text-xs text-gray-500 pt-2 border-t">
                                      <div>
                                        <strong>Trace ID:</strong> {log.traceId || '\u2014'}
                                      </div>
                                      <div>
                                        <strong>Project:</strong> {log.projectId || '\u2014'}
                                      </div>
                                      <div>
                                        <strong>Org:</strong> {log.organizationId || '\u2014'}
                                      </div>
                                    </div>
                                    {log.userAgent && (
                                      <div className="text-xs text-gray-400 truncate">
                                        <strong>User Agent:</strong> {log.userAgent}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {((page - 1) * pageSize) + 1} to{' '}
                    {Math.min(page * pageSize, pagination.total)} of{' '}
                    {pagination.total.toLocaleString()} entries
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="inline-flex items-center px-3 text-sm text-gray-600">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
