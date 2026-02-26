'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  RefreshCw,
  TrendingUp,
  XCircle,
  Gavel,
  CalendarCheck,
  FileText,
  Receipt,
  Shield,
  Wallet,
  MessageSquare,
  ListChecks,
  FileOutput,
  BrainCircuit,
  CalendarClock,
  ScanSearch,
  Scale,
  LayoutDashboard,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface AppStatus {
  appId: string
  name: string
  status: 'healthy' | 'degraded' | 'down'
  metrics: {
    jobsTotal: number
    jobsSuccess: number
    jobsFailed: number
    avgDuration: number
    queueDepth: number
    errorRate: number
  } | null
  lastActivity: string | null
}

interface Alert {
  appId: string
  appName: string
  type: 'error_rate' | 'queue_depth' | 'no_activity'
  message: string
  timestamp: string
}

interface SystemStatus {
  apps: AppStatus[]
  alerts: Alert[]
  summary: {
    totalJobsToday: number
    avgProcessingTime: number
    successRate: number
    activeWorkers: number
  }
}

// ── App icon mapping ───────────────────────────────────────────────────────

const APP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'APP-01': Gavel,
  'APP-02': CalendarCheck,
  'APP-03': FileText,
  'APP-04': Receipt,
  'APP-05': Shield,
  'APP-06': ScanSearch,
  'APP-07': Wallet,
  'APP-08': MessageSquare,
  'APP-09': ListChecks,
  'APP-10': FileOutput,
  'APP-11': BrainCircuit,
  'APP-12': CalendarClock,
  'APP-13': ScanSearch,
  'APP-14': Scale,
  'APP-15': LayoutDashboard,
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getStatusColor(status: string) {
  switch (status) {
    case 'healthy':
      return 'bg-green-500'
    case 'degraded':
      return 'bg-yellow-500'
    case 'down':
      return 'bg-red-500'
    default:
      return 'bg-gray-400'
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'healthy':
      return <Badge className="bg-green-600 text-white">Healthy</Badge>
    case 'degraded':
      return <Badge className="bg-yellow-600 text-white">Degraded</Badge>
    case 'down':
      return <Badge className="bg-red-600 text-white">Down</Badge>
    default:
      return <Badge variant="outline">Unknown</Badge>
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60_000).toFixed(1)}m`
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

// ── Component ──────────────────────────────────────────────────────────────

export default function CommandCenterPage() {
  const [data, setData] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchData()

    if (autoRefresh) {
      const interval = setInterval(fetchData, 30_000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  async function fetchData() {
    try {
      setError(null)
      const json = await apiRequest<SystemStatus>('/api/v1/command-center/status')
      setData(json)
    } catch (err: any) {
      console.error('[CommandCenter] Fetch error:', err)
      setError(err.message || 'Failed to fetch system status')

      // Use mock data in development so the UI is always visible
      if (!data) {
        setData(getMockData())
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="mt-4 text-sm text-gray-500">Loading Command Center...</p>
        </div>
      </div>
    )
  }

  const status = data ?? getMockData()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Command Center</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time monitoring across all 15 automation apps
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
          API unavailable — showing cached / mock data. {error}
        </div>
      )}

      {/* ── Summary Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Jobs Today</p>
                <p className="text-2xl font-bold">
                  {status.summary.totalJobsToday.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Success Rate</p>
                <p className="text-2xl font-bold">
                  {(status.summary.successRate * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Processing</p>
                <p className="text-2xl font-bold">
                  {formatDuration(status.summary.avgProcessingTime)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900">
                <Cpu className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Workers</p>
                <p className="text-2xl font-bold">
                  {status.summary.activeWorkers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Alerts ────────────────────────────────────────────────────── */}
      {status.alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Active Alerts ({status.alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status.alerts.map((alert, i) => (
                <div
                  key={`${alert.appId}-${alert.type}-${i}`}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {alert.type === 'error_rate' && <XCircle className="h-4 w-4 text-red-500" />}
                    {alert.type === 'queue_depth' && <Clock className="h-4 w-4 text-yellow-500" />}
                    {alert.type === 'no_activity' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                    <div>
                      <span className="font-medium">{alert.appName}</span>
                      <span className="mx-2 text-gray-400">—</span>
                      <span className="text-sm text-gray-600">{alert.message}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{timeAgo(alert.timestamp)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── App Grid (3 × 5) ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold mb-3">All Apps</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {status.apps.map((app) => {
            const Icon = APP_ICONS[app.appId] ?? Activity
            return (
              <Link key={app.appId} href={`/command-center/${app.appId}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        <CardTitle className="text-sm font-medium">{app.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor(app.status)}`} />
                        {getStatusBadge(app.status)}
                      </div>
                    </div>
                    <CardDescription className="text-xs">{app.appId}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {app.metrics ? (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-lg font-bold">{app.metrics.jobsTotal}</p>
                          <p className="text-[10px] text-gray-500 uppercase">Jobs</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-green-600">
                            {app.metrics.jobsTotal > 0
                              ? `${((app.metrics.jobsSuccess / app.metrics.jobsTotal) * 100).toFixed(0)}%`
                              : '—'}
                          </p>
                          <p className="text-[10px] text-gray-500 uppercase">Success</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{app.metrics.queueDepth}</p>
                          <p className="text-[10px] text-gray-500 uppercase">Queue</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-2">No metrics yet</p>
                    )}
                    {app.lastActivity && (
                      <p className="text-[10px] text-gray-400 text-right mt-2">
                        Last: {timeAgo(app.lastActivity)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Recent Activity Timeline ──────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Latest job completions across all apps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {status.apps
              .filter((a) => a.lastActivity)
              .sort((a, b) => new Date(b.lastActivity!).getTime() - new Date(a.lastActivity!).getTime())
              .slice(0, 10)
              .map((app) => (
                <div key={app.appId} className="flex items-center gap-3 text-sm">
                  <div className={`h-2 w-2 rounded-full ${getStatusColor(app.status)}`} />
                  <span className="font-medium w-40 truncate">{app.name}</span>
                  <div className="flex items-center gap-1 text-gray-500">
                    {app.status === 'healthy' && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                    {app.status === 'degraded' && <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />}
                    {app.status === 'down' && <XCircle className="h-3.5 w-3.5 text-red-500" />}
                    <span>
                      {app.metrics
                        ? `${app.metrics.jobsSuccess} completed, ${app.metrics.jobsFailed} failed`
                        : 'No data'}
                    </span>
                  </div>
                  <span className="ml-auto text-xs text-gray-400">
                    {app.lastActivity ? timeAgo(app.lastActivity) : '—'}
                  </span>
                </div>
              ))}

            {status.apps.filter((a) => a.lastActivity).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                No activity recorded yet. Apps will appear here once jobs are processed.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Mock Data (fallback when API is unavailable) ───────────────────────────

function getMockData(): SystemStatus {
  const appNames: Record<string, string> = {
    'APP-01': 'Bid Engine',
    'APP-02': 'Visit Scheduler',
    'APP-03': 'Change Order Processor',
    'APP-04': 'Report Generator',
    'APP-05': 'Permit Tracker',
    'APP-06': 'Inspection Coordinator',
    'APP-07': 'Budget Tracker',
    'APP-08': 'Communication Hub',
    'APP-09': 'Task Queue Manager',
    'APP-10': 'Document Generator',
    'APP-11': 'Predictive Engine',
    'APP-12': 'Smart Scheduler',
    'APP-13': 'QA Inspector',
    'APP-14': 'Decision Support',
    'APP-15': 'Dashboard Monitor',
  }

  return {
    apps: Object.entries(appNames).map(([id, name]) => ({
      appId: id,
      name,
      status: 'healthy' as const,
      metrics: null,
      lastActivity: null,
    })),
    alerts: [],
    summary: {
      totalJobsToday: 0,
      avgProcessingTime: 0,
      successRate: 1,
      activeWorkers: 0,
    },
  }
}
