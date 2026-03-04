'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, ArrowLeft, Loader2 } from 'lucide-react'
import { apiRequest } from '@/lib/api'

type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETE' | 'BLOCKED'
type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

interface PmTask {
  id: string
  title: string
  clientName: string
  dueAt: string
  status: TaskStatus
  priority: Priority
}

export default function PmTasksPage() {
  const [tasks, setTasks] = useState<PmTask[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  useEffect(() => {
    async function fetchTasks() {
      try {
        const params = new URLSearchParams()
        if (statusFilter) params.set('status', statusFilter)
        if (priorityFilter) params.set('priority', priorityFilter)
        if (search.trim()) params.set('search', search.trim())
        params.set('pageSize', '50')

        const suffix = params.toString() ? `?${params.toString()}` : ''
        const data = await apiRequest<{ tasks: PmTask[]; total?: number }>(`/pm/tasks${suffix}`)
        setTasks(data.tasks || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load tasks')
      } finally {
        setLoading(false)
      }
    }
    fetchTasks()
  }, [statusFilter, priorityFilter, search])

  const filtered = useMemo(() => {
    if (!search.trim()) return tasks
    const q = search.trim().toLowerCase()
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.clientName || '').toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q)
    )
  }, [search, tasks])

  const statusColor = (status: string) => {
    switch (status) {
      case 'COMPLETE': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'BLOCKED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <Link href="/pm">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to PM Dashboard
              </Button>
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">PM Tasks</h1>
                <p className="text-gray-600 mt-2">Queue of PM tasks (priority, due date, status)</p>
              </div>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Search and filter tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tasks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETE">Complete</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">All Priorities</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                      No tasks found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.title}</TableCell>
                      <TableCell className="text-gray-600">{t.clientName || '-'}</TableCell>
                      <TableCell>
                        <Badge className={priorityColor(t.priority)}>{t.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColor(t.status)}>{t.status}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {t.dueAt ? new Date(t.dueAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/pm/tasks/${t.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
