'use client'

import { useEffect, useState } from 'react'
import { api } from '@pm/lib/api-client'
import type { PMTask, TaskFilters } from '@pm/lib/api-client'
import Link from 'next/link'
import {
  ListChecks,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Plus,
  ChevronRight,
} from 'lucide-react'

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
}

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  in_progress: AlertCircle,
  completed: CheckCircle,
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<PMTask[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  useEffect(() => {
    loadTasks()
  }, [statusFilter, priorityFilter])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const filters: TaskFilters = { pageSize: 50 }
      if (statusFilter !== 'all') filters.status = statusFilter as any
      if (priorityFilter !== 'all') filters.priority = priorityFilter as any

      const data = await api.getMyTasks(filters)
      setTasks(data.tasks || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const tasksByStatus = {
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-blue-600" />
            Tasks
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track all your assigned tasks
          </p>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <p className="text-2xl font-bold mt-1">{tasksByStatus.pending}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-600">In Progress</span>
          </div>
          <p className="text-2xl font-bold mt-1">{tasksByStatus.in_progress}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-600">Completed</span>
          </div>
          <p className="text-2xl font-bold mt-1">{tasksByStatus.completed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 rounded-lg border bg-white p-4">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border bg-white px-3 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="h-9 rounded-md border bg-white px-3 text-sm"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <span className="text-xs text-gray-500 ml-auto">{total} total tasks</span>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border bg-white py-16 text-center">
          <ListChecks className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No tasks found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try changing your filters'
              : 'Tasks will appear here once assigned'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white divide-y">
          {tasks.map((task) => {
            const StatusIcon = STATUS_ICONS[task.status] || Clock
            return (
              <div key={task.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
                <div className="flex items-center gap-3 min-w-0">
                  <StatusIcon className={`h-4 w-4 shrink-0 ${
                    task.status === 'completed' ? 'text-green-500' :
                    task.status === 'in_progress' ? 'text-blue-500' : 'text-yellow-500'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    {task.dueDate && (
                      <p className="text-xs text-gray-500">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {task.priority && (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}>
                      {task.priority}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

