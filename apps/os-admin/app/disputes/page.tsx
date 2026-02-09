'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { apiRequest } from '@/lib/api'
import { Gavel, Search, Filter, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'

interface Dispute {
  id: string
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED'
  type: 'PAYMENT' | 'SERVICE' | 'CONTRACT'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  openedAt: string
  orgName: string
  orgId: string
  description: string
  amount?: number
  assignedTo?: string
}

export default function DisputesQueuePage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: 'all' as 'all' | Dispute['status'],
    type: 'all' as 'all' | Dispute['type'],
    priority: 'all' as 'all' | Dispute['priority'],
  })

  useEffect(() => {
    fetchDisputes()
  }, [filters])

  async function fetchDisputes() {
    try {
      setLoading(true)
      setError(null)

      // Build query params for the disputes API
      const params = new URLSearchParams()
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.type !== 'all') params.append('type', filters.type)
      if (filters.priority !== 'all') params.append('priority', filters.priority)

      const suffix = params.toString() ? `?${params.toString()}` : ''
      const data = await apiRequest<{ disputes: any[] }>(`/disputes${suffix}`)
      setDisputes(data.disputes || [])
    } catch (err: any) {
      console.error('Disputes fetch error:', err)
      setError(err.message || 'Failed to load disputes')
      setDisputes([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: Dispute['status']) => {
    switch (status) {
      case 'OPEN':
        return <Badge className="bg-blue-600 text-white">Open</Badge>
      case 'INVESTIGATING':
        return <Badge className="bg-yellow-600 text-white">Investigating</Badge>
      case 'RESOLVED':
        return <Badge className="bg-green-600 text-white">Resolved</Badge>
      case 'CLOSED':
        return <Badge className="bg-gray-600 text-white">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: Dispute['priority']) => {
    switch (priority) {
      case 'URGENT':
        return <Badge className="bg-red-600 text-white">Urgent</Badge>
      case 'HIGH':
        return <Badge className="bg-orange-600 text-white">High</Badge>
      case 'MEDIUM':
        return <Badge className="bg-yellow-600 text-white">Medium</Badge>
      case 'LOW':
        return <Badge className="bg-gray-600 text-white">Low</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const stats = {
    open: disputes.filter((d) => d.status === 'OPEN').length,
    investigating: disputes.filter((d) => d.status === 'INVESTIGATING').length,
    resolved: disputes.filter((d) => d.status === 'RESOLVED').length,
    urgent: disputes.filter((d) => d.priority === 'URGENT').length,
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Disputes</h1>
            <p className="text-gray-600 mt-2">Payment & service dispute resolution (platform oversight)</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Open</p>
                    <p className="text-2xl font-bold">{stats.open}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Investigating</p>
                    <p className="text-2xl font-bold">{stats.investigating}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Resolved</p>
                    <p className="text-2xl font-bold">{stats.resolved}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Urgent</p>
                    <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="INVESTIGATING">Investigating</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Types</option>
                    <option value="PAYMENT">Payment</option>
                    <option value="SERVICE">Service</option>
                    <option value="CONTRACT">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Priorities</option>
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
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
                <p className="mt-4 text-gray-600">Loading disputes...</p>
              </div>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Dispute Queue</CardTitle>
                <CardDescription>
                  {disputes.length} dispute{disputes.length !== 1 ? 's' : ''} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Opened</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                          <Gavel className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p>No disputes found</p>
                          <p className="text-sm mt-1">
                            {Object.values(filters).some((f) => f !== 'all')
                              ? 'Try adjusting your filters'
                              : 'No disputes in the system'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      disputes.map((dispute) => (
                        <TableRow key={dispute.id}>
                          <TableCell>
                            <Badge variant="outline">{dispute.type}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                          <TableCell>{getPriorityBadge(dispute.priority)}</TableCell>
                          <TableCell className="font-medium">{dispute.orgName}</TableCell>
                          <TableCell>
                            {dispute.amount ? `$${dispute.amount.toLocaleString()}` : '—'}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {new Date(dispute.openedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/disputes/${dispute.id}`}>
                              <Button variant="ghost" size="sm">
                                Review
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
