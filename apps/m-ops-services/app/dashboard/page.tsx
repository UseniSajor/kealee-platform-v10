'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ClipboardList,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ListTodo,
  RefreshCw,
  Plus,
  ArrowRight,
  Inbox,
  FolderOpen,
} from 'lucide-react'
import { api } from '@/lib/api'
import { getCurrentUser, getPrimaryOrgId } from '@/lib/auth'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceRequest {
  id: string
  title: string
  description?: string | null
  category: string
  priority: string
  status: string
  createdAt: string
  assignedTo?: string | null
}

interface Task {
  id: string
  title: string
  status: string
  requestId?: string
  assignedTo?: string | null
  dueDate?: string | null
  createdAt: string
}

interface DashboardStats {
  totalRequests: number
  openRequests: number
  inProgressRequests: number
  completedRequests: number
  canceledRequests: number
  urgentRequests: number
  totalTasks: number
  pendingTasks: number
  inProgressTasks: number
  completedTasks: number
  activeProjects: number
  averageSatisfaction: number | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deriveStats(
  requests: ServiceRequest[],
  tasks: Task[],
  projectCount: number,
): DashboardStats {
  const openRequests = requests.filter((r) => r.status === 'open').length
  const inProgressRequests = requests.filter((r) => r.status === 'in_progress').length
  const completedRequests = requests.filter((r) => r.status === 'completed').length
  const canceledRequests = requests.filter((r) => r.status === 'canceled').length
  const urgentRequests = requests.filter((r) => r.priority === 'urgent').length

  const pendingTasks = tasks.filter((t) => t.status === 'PENDING' || t.status === 'pending').length
  const inProgressTasks = tasks.filter(
    (t) => t.status === 'IN_PROGRESS' || t.status === 'in_progress',
  ).length
  const completedTasks = tasks.filter(
    (t) => t.status === 'COMPLETED' || t.status === 'completed',
  ).length

  return {
    totalRequests: requests.length,
    openRequests,
    inProgressRequests,
    completedRequests,
    canceledRequests,
    urgentRequests,
    totalTasks: tasks.length,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    activeProjects: projectCount,
    averageSatisfaction: null,
  }
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function priorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'high':
      return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'normal':
      return 'bg-sky-50 text-sky-700 border-sky-200'
    case 'low':
      return 'bg-zinc-50 text-zinc-600 border-zinc-200'
    default:
      return 'bg-zinc-50 text-zinc-600 border-zinc-200'
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'open':
      return 'bg-sky-50 text-sky-700 border-sky-200'
    case 'in_progress':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'canceled':
      return 'bg-zinc-50 text-zinc-500 border-zinc-200'
    default:
      return 'bg-zinc-50 text-zinc-600 border-zinc-200'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'open':
      return 'Open'
    case 'in_progress':
      return 'In Progress'
    case 'completed':
      return 'Completed'
    case 'canceled':
      return 'Canceled'
    default:
      return status
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string
  value: number | string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-600">{label}</p>
          <p className="mt-1 text-2xl font-black text-zinc-950">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconBg}`}
        >
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-12 text-center">
      <Inbox className="mx-auto h-12 w-12 text-zinc-300" />
      <h3 className="mt-4 text-lg font-black text-zinc-900">No data yet</h3>
      <p className="mt-2 text-sm text-zinc-600">
        Submit your first service request to start tracking operations.
      </p>
      <Link
        href="/portal/service-requests/new"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-black text-white shadow-sm hover:bg-sky-700 transition"
      >
        <Plus className="h-4 w-4" />
        Submit Service Request
      </Link>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [userName, setUserName] = useState<string>('there')

  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [projectCount, setProjectCount] = useState(0)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      // Fetch user info
      const user = await getCurrentUser()
      if (user?.name || user?.fullName || user?.email) {
        setUserName(user.name || user.fullName || user.email.split('@')[0])
      }

      // Get primary org for project stats
      const orgId = await getPrimaryOrgId()

      // Parallel API calls
      const [requestsResult, tasksResult, projectsResult] = await Promise.all([
        api.listServiceRequests().catch(() => ({ serviceRequests: [] })),
        api.listTasks().catch(() => ({ tasks: [] })),
        orgId
          ? api.getProjects({ orgId }).catch(() => ({ projects: [] }))
          : Promise.resolve({ projects: [] }),
      ])

      const fetchedRequests: ServiceRequest[] = requestsResult.serviceRequests || []
      const fetchedTasks: Task[] = tasksResult.tasks || []
      const fetchedProjects = projectsResult.projects || []

      setRequests(fetchedRequests)
      setTasks(fetchedTasks)
      setProjectCount(fetchedProjects.length)
      setStats(deriveStats(fetchedRequests, fetchedTasks, fetchedProjects.length))
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Recent requests (last 5, sorted newest first)
  const recentRequests = [...requests]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // Upcoming / overdue tasks
  const activeTasks = tasks
    .filter((t) => t.status !== 'COMPLETED' && t.status !== 'completed')
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    .slice(0, 5)

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[var(--background,#f8f9fa)]">
      <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-950">
              Ops Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Welcome back, {userName}. Here is your operations overview.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-black text-zinc-900 shadow-sm hover:bg-zinc-50 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              href="/portal/service-requests/new"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-black text-white shadow-sm hover:bg-sky-700 transition"
            >
              <Plus className="h-4 w-4" />
              New Request
            </Link>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <div>
                <p className="font-black">Failed to load data</p>
                <p className="mt-1">{error}</p>
                <button
                  type="button"
                  onClick={() => loadData()}
                  className="mt-2 text-sm font-extrabold text-red-800 underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="mt-16 flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            <p className="mt-4 text-sm text-zinc-600">Loading dashboard...</p>
          </div>
        ) : !stats || (stats.totalRequests === 0 && stats.totalTasks === 0 && stats.activeProjects === 0) ? (
          /* Empty state */
          <div className="mt-10">
            <EmptyState />
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Requests"
                value={stats.totalRequests}
                subtitle={stats.urgentRequests > 0 ? `${stats.urgentRequests} urgent` : undefined}
                icon={ClipboardList}
                iconBg="bg-sky-100"
                iconColor="text-sky-600"
              />
              <StatCard
                label="In Progress"
                value={stats.inProgressRequests}
                subtitle={`${stats.openRequests} open`}
                icon={Clock}
                iconBg="bg-amber-100"
                iconColor="text-amber-600"
              />
              <StatCard
                label="Completed"
                value={stats.completedRequests}
                subtitle={
                  stats.totalRequests > 0
                    ? `${Math.round((stats.completedRequests / stats.totalRequests) * 100)}% completion rate`
                    : undefined
                }
                icon={CheckCircle2}
                iconBg="bg-emerald-100"
                iconColor="text-emerald-600"
              />
              <StatCard
                label="Active Tasks"
                value={stats.pendingTasks + stats.inProgressTasks}
                subtitle={`${stats.completedTasks} completed`}
                icon={ListTodo}
                iconBg="bg-purple-100"
                iconColor="text-purple-600"
              />
            </div>

            {/* Secondary stats row */}
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Active Projects"
                value={stats.activeProjects}
                icon={FolderOpen}
                iconBg="bg-indigo-100"
                iconColor="text-indigo-600"
              />
              <StatCard
                label="Open Requests"
                value={stats.openRequests}
                subtitle="Awaiting assignment"
                icon={Inbox}
                iconBg="bg-sky-100"
                iconColor="text-sky-600"
              />
              <StatCard
                label="Canceled"
                value={stats.canceledRequests}
                icon={XCircle}
                iconBg="bg-zinc-100"
                iconColor="text-zinc-500"
              />
            </div>

            {/* Requests + Tasks grid */}
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
              {/* Recent Service Requests */}
              <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                <div className="flex items-end justify-between gap-3">
                  <h2 className="text-lg font-black tracking-tight">Recent Requests</h2>
                  <Link
                    href="/portal/service-requests"
                    className="text-sm font-extrabold text-sky-600 hover:underline"
                  >
                    View all <ArrowRight className="inline h-3.5 w-3.5" />
                  </Link>
                </div>

                {recentRequests.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-6 text-center text-sm text-zinc-600">
                    No service requests yet.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {recentRequests.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-xl border border-black/10 p-4 hover:bg-zinc-50/50 transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-zinc-950">
                              {r.title}
                            </p>
                            <p className="mt-1 text-xs text-zinc-600">
                              {r.category} &middot; {formatRelativeTime(r.createdAt)}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black ${priorityColor(r.priority)}`}
                            >
                              {r.priority}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black ${statusColor(r.status)}`}
                            >
                              {statusLabel(r.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Tasks */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-black tracking-tight">Active Tasks</h2>

                  {activeTasks.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-6 text-center text-sm text-zinc-600">
                      No active tasks.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {activeTasks.map((t) => {
                        const isOverdue =
                          t.dueDate && new Date(t.dueDate).getTime() < Date.now()
                        return (
                          <div
                            key={t.id}
                            className={`rounded-xl border p-4 ${
                              isOverdue
                                ? 'border-red-200 bg-red-50/50'
                                : 'border-black/10'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-black text-zinc-950">
                                  {t.title}
                                </p>
                                <p className="mt-1 text-xs text-zinc-600">
                                  {t.status === 'IN_PROGRESS' || t.status === 'in_progress'
                                    ? 'In Progress'
                                    : 'Pending'}
                                  {t.dueDate && (
                                    <>
                                      {' '}&middot; Due{' '}
                                      {new Date(t.dueDate).toLocaleDateString()}
                                    </>
                                  )}
                                </p>
                              </div>
                              {isOverdue && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-700">
                                  <AlertTriangle className="h-3 w-3" />
                                  Overdue
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-black tracking-tight">Quick Actions</h3>
                  <div className="mt-4 grid gap-2">
                    <Link
                      href="/portal/service-requests/new"
                      className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-black text-zinc-900 hover:bg-zinc-50 transition"
                    >
                      Submit Service Request
                    </Link>
                    <Link
                      href="/portal/service-requests"
                      className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-black text-zinc-900 hover:bg-zinc-50 transition"
                    >
                      View All Requests
                    </Link>
                    <Link
                      href="/portal/weekly-reports"
                      className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-black text-zinc-900 hover:bg-zinc-50 transition"
                    >
                      View Weekly Reports
                    </Link>
                    <Link
                      href="/portal/my-projects"
                      className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-black text-zinc-900 hover:bg-zinc-50 transition"
                    >
                      Manage Projects
                    </Link>
                    <Link
                      href="/portal"
                      className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-black text-zinc-900 hover:bg-zinc-50 transition"
                    >
                      Go to Portal Home
                    </Link>
                  </div>
                </div>

                {/* Request breakdown */}
                {stats && stats.totalRequests > 0 && (
                  <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-black tracking-tight">
                      Request Breakdown
                    </h3>
                    <div className="mt-4 space-y-3">
                      {[
                        {
                          label: 'Open',
                          count: stats.openRequests,
                          color: 'bg-sky-500',
                        },
                        {
                          label: 'In Progress',
                          count: stats.inProgressRequests,
                          color: 'bg-amber-500',
                        },
                        {
                          label: 'Completed',
                          count: stats.completedRequests,
                          color: 'bg-emerald-500',
                        },
                        {
                          label: 'Canceled',
                          count: stats.canceledRequests,
                          color: 'bg-zinc-400',
                        },
                      ].map((item) => {
                        const pct =
                          stats.totalRequests > 0
                            ? Math.round((item.count / stats.totalRequests) * 100)
                            : 0
                        return (
                          <div key={item.label}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-zinc-700">
                                {item.label}
                              </span>
                              <span className="font-black text-zinc-900">
                                {item.count} ({pct}%)
                              </span>
                            </div>
                            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100">
                              <div
                                className={`h-full rounded-full ${item.color} transition-all`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
