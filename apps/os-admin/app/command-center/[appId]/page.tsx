'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  TrendingUp,
  XCircle,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface MetricPoint {
  timestamp: string
  jobsTotal: number
  jobsSuccess: number
  jobsFailed: number
  avgDuration: number
  queueDepth: number
  errorRate: number
}

interface RecentJob {
  id: string
  type: string
  status: string
  startedAt: string | null
  completedAt: string | null
  duration: number | null
  error: string | null
}

interface QueueState {
  active: number
  waiting: number
  delayed: number
  failed: number
  completed: number
}

interface AppDetail {
  appId: string
  name: string
  status: 'healthy' | 'degraded' | 'down'
  metrics24h: MetricPoint[]
  recentJobs: RecentJob[]
  queueState: QueueState | null
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDuration(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60_000).toFixed(1)}m`
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString()
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
      return <Badge variant="outline">{status}</Badge>
  }
}

function getJobStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <Badge className="bg-green-600 text-white text-[10px]">Completed</Badge>
    case 'PROCESSING':
      return <Badge className="bg-blue-600 text-white text-[10px]">Processing</Badge>
    case 'FAILED':
      return <Badge className="bg-red-600 text-white text-[10px]">Failed</Badge>
    case 'PENDING':
    case 'QUEUED':
      return <Badge className="bg-gray-500 text-white text-[10px]">{status}</Badge>
    case 'CANCELED':
      return <Badge variant="outline" className="text-[10px]">Canceled</Badge>
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>
  }
}

// ── Sparkline (lightweight SVG chart) ──────────────────────────────────────

function Sparkline({
  data,
  dataKey,
  color,
  height = 80,
}: {
  data: MetricPoint[]
  dataKey: keyof MetricPoint
  color: string
  height?: number
}) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center text-xs text-gray-400" style={{ height }}>
        Not enough data
      </div>
    )
  }

  const values = data.map((d) => Number(d[dataKey]))
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const width = 400

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 8) - 4
    return `${x},${y}`
  }).join(' ')

  // Create the area fill path
  const areaPath = `M0,${height} L${values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 8) - 4
    return `${x},${y}`
  }).join(' L')} L${width},${height} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="none"
    >
      <path d={areaPath} fill={color} opacity={0.1} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Component ──────────────────────────────────────────────────────────────

export default function AppDetailPage() {
  const params = useParams()
  const router = useRouter()
  const appId = params.appId as string

  const [detail, setDetail] = useState<AppDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [jobPage, setJobPage] = useState(0)

  const JOBS_PER_PAGE = 15

  useEffect(() => {
    fetchDetail()
    const interval = setInterval(fetchDetail, 30_000)
    return () => clearInterval(interval)
  }, [appId])

  async function fetchDetail() {
    try {
      setError(null)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const res = await fetch(`${apiUrl}/command-center/apps/${appId}`)

      if (!res.ok) throw new Error(`API error: ${res.status}`)

      const json = await res.json()
      setDetail(json)
    } catch (err: any) {
      console.error(`[CommandCenter] Fetch error for ${appId}:`, err)
      setError(err.message || 'Failed to fetch app details')

      if (!detail) {
        setDetail(getMockDetail(appId))
      }
    } finally {
      setLoading(false)
    }
  }

  async function performAction(action: 'pause' | 'resume' | 'retry') {
    setActionLoading(action)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const res = await fetch(`${apiUrl}/command-center/apps/${appId}/${action}`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error(`Action failed: ${res.status}`)
      await fetchDetail()
    } catch (err: any) {
      console.error(`[CommandCenter] Action ${action} failed:`, err)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading && !detail) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="mt-4 text-sm text-gray-500">Loading {appId}...</p>
        </div>
      </div>
    )
  }

  const app = detail ?? getMockDetail(appId)
  const pagedJobs = app.recentJobs.slice(
    jobPage * JOBS_PER_PAGE,
    (jobPage + 1) * JOBS_PER_PAGE,
  )
  const totalPages = Math.ceil(app.recentJobs.length / JOBS_PER_PAGE)

  // Compute summary stats from metrics
  const latestMetric = app.metrics24h.length > 0 ? app.metrics24h[app.metrics24h.length - 1] : null
  const totalJobs24h = app.metrics24h.reduce((sum, m) => sum + m.jobsTotal, 0)
  const totalFailed24h = app.metrics24h.reduce((sum, m) => sum + m.jobsFailed, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/command-center')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{app.name}</h1>
              {getStatusBadge(app.status)}
            </div>
            <p className="text-sm text-gray-500">{app.appId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={actionLoading !== null}
            onClick={() => performAction('pause')}
          >
            {actionLoading === 'pause' ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Pause className="mr-1 h-3.5 w-3.5" />
            )}
            Pause
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={actionLoading !== null}
            onClick={() => performAction('resume')}
          >
            {actionLoading === 'resume' ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="mr-1 h-3.5 w-3.5" />
            )}
            Resume
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={actionLoading !== null}
            onClick={() => performAction('retry')}
          >
            {actionLoading === 'retry' ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
            )}
            Retry Failed
          </Button>
          <Button variant="outline" size="sm" onClick={fetchDetail}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
          API unavailable — showing cached / mock data. {error}
        </div>
      )}

      {/* ── Stat Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Jobs (24h)</p>
                <p className="text-2xl font-bold">{totalJobs24h}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-500">Failed (24h)</p>
                <p className="text-2xl font-bold text-red-600">{totalFailed24h}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Avg Duration</p>
                <p className="text-2xl font-bold">
                  {latestMetric ? formatDuration(latestMetric.avgDuration) : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Error Rate</p>
                <p className="text-2xl font-bold">
                  {latestMetric ? `${(latestMetric.errorRate * 100).toFixed(1)}%` : '0%'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Queue State ───────────────────────────────────────────────── */}
      {app.queueState && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Queue State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{app.queueState.active}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{app.queueState.waiting}</p>
                <p className="text-xs text-gray-500">Waiting</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{app.queueState.delayed}</p>
                <p className="text-xs text-gray-500">Delayed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{app.queueState.failed}</p>
                <p className="text-xs text-gray-500">Failed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{app.queueState.completed}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Charts (24h) ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Jobs (24h)</CardTitle>
            <CardDescription>Total jobs processed over time</CardDescription>
          </CardHeader>
          <CardContent>
            <Sparkline data={app.metrics24h} dataKey="jobsTotal" color="#3b82f6" height={100} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Error Rate (24h)</CardTitle>
            <CardDescription>Error rate over time</CardDescription>
          </CardHeader>
          <CardContent>
            <Sparkline data={app.metrics24h} dataKey="errorRate" color="#ef4444" height={100} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Queue Depth (24h)</CardTitle>
            <CardDescription>Pending jobs in queue</CardDescription>
          </CardHeader>
          <CardContent>
            <Sparkline data={app.metrics24h} dataKey="queueDepth" color="#8b5cf6" height={100} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Avg Duration (24h)</CardTitle>
            <CardDescription>Average processing time (ms)</CardDescription>
          </CardHeader>
          <CardContent>
            <Sparkline data={app.metrics24h} dataKey="avgDuration" color="#f59e0b" height={100} />
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Jobs Table ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Jobs</CardTitle>
              <CardDescription>
                Showing {pagedJobs.length} of {app.recentJobs.length} jobs
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {app.recentJobs.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-xs">{job.type}</TableCell>
                      <TableCell>{getJobStatusBadge(job.status)}</TableCell>
                      <TableCell className="text-xs">{formatTime(job.startedAt)}</TableCell>
                      <TableCell className="text-xs">{formatTime(job.completedAt)}</TableCell>
                      <TableCell className="text-xs">{formatDuration(job.duration)}</TableCell>
                      <TableCell>
                        {job.error ? (
                          <span className="text-xs text-red-600 max-w-[200px] truncate block" title={job.error}>
                            {job.error}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-gray-500">
                    Page {jobPage + 1} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={jobPage === 0}
                      onClick={() => setJobPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={jobPage >= totalPages - 1}
                      onClick={() => setJobPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">
              No jobs recorded yet for this app.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const APP_NAMES: Record<string, string> = {
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

function getMockDetail(appId: string): AppDetail {
  return {
    appId,
    name: APP_NAMES[appId] ?? appId,
    status: 'healthy',
    metrics24h: [],
    recentJobs: [],
    queueState: null,
  }
}
