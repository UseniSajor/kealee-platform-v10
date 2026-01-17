'use client'

import { useEffect, useState } from 'react'
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
import { Search, Filter } from 'lucide-react'

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string
  userId: string
  reason?: string
  before?: any
  after?: any
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, limit: 50, totalPages: 0 })
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    entityId: '',
    userId: '',
  })

  useEffect(() => {
    fetchAuditLogs()
  }, [page, filters])

  async function fetchAuditLogs() {
    try {
      setLoading(true)
      const params: any = {
        page,
        limit: 50,
      }
      if (filters.action) params.action = filters.action
      if (filters.entityType) params.entityType = filters.entityType
      if (filters.entityId) params.entityId = filters.entityId
      if (filters.userId) params.userId = filters.userId

      const data = await api.getAuditLogs(params)
      setAuditLogs(data.auditLogs || [])
      setPagination(data.pagination || { total: 0, limit: 50, totalPages: 0 })
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({ action: '', entityType: '', entityId: '', userId: '' })
    setPage(1)
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Audit Logs</h1>
            <p className="text-gray-600 mt-2">View system audit trail and activity logs</p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
              <CardDescription>Filter audit logs by various criteria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Action</label>
                  <Input
                    placeholder="e.g., CREATE_ORG"
                    value={filters.action}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Entity Type</label>
                  <Input
                    placeholder="e.g., Org, User"
                    value={filters.entityType}
                    onChange={(e) => handleFilterChange('entityType', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Entity ID</label>
                  <Input
                    placeholder="Entity UUID"
                    value={filters.entityId}
                    onChange={(e) => handleFilterChange('entityId', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">User ID</label>
                  <Input
                    placeholder="User UUID"
                    value={filters.userId}
                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={fetchAuditLogs} variant="default">
                  <Search className="mr-2 h-4 w-4" />
                  Apply Filters
                </Button>
                <Button onClick={clearFilters} variant="outline">
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
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading audit logs...</p>
              </div>
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Audit Logs</CardTitle>
                  <CardDescription>
                    {pagination.total} total log entries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            No audit logs found
                          </TableCell>
                        </TableRow>
                      ) : (
                        auditLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-gray-600">
                              {new Date(log.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.action}</Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{log.entityType}</div>
                                <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                  {log.entityId}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600 text-sm font-mono">
                              {log.userId.substring(0, 8)}...
                            </TableCell>
                            <TableCell className="text-gray-600 text-sm">
                              {log.ipAddress || '—'}
                            </TableCell>
                            <TableCell className="text-gray-600 text-sm max-w-[200px] truncate">
                              {log.reason || '—'}
                            </TableCell>
                          </TableRow>
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
                    Showing {((page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} entries
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
