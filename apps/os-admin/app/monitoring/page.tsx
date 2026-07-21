'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Server,
  Zap,
  Cpu,
  Brain,
  Mail,
  CreditCard,
  Cloud,
  BarChart3,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface QueueMetrics {
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  status: 'healthy' | 'warning' | 'critical'
}

interface SystemHealth {
  // System overview
  status: 'healthy' | 'degraded' | 'down'
  uptime: number
  version: string
  memoryUsage: { heapUsed: number; heapTotal: number; rss: number }

  // Infrastructure
  database: { status: 'healthy' | 'degraded' | 'down'; latency?: number; error?: string }
  redis: { status: 'healthy' | 'degraded' | 'down'; latency?: number; error?: string }

  // Queues
  queues: Record<string, QueueMetrics>
  queuesSummary: {
    totalActive: number
    totalFailed: number
    totalWaiting: number
    healthyCount: number
    warningCount: number
    criticalCount: number
  }

  // Services
  services: Record<string, { status: string; latency?: number; error?: string; configured?: boolean }>

  // AI
  ai: { configured: boolean; model?: string }
}

// ============================================================================
// QUEUE DISPLAY NAMES
// ============================================================================

const QUEUE_DISPLAY_NAMES: Record<string, string> = {
  BID_ENGINE: 'Bid Engine',
  VISIT_SCHEDULER: 'Visit Scheduler',
  CHANGE_ORDER: 'Change Orders',
  REPORT_GENERATOR: 'Report Generator',
  PERMIT_TRACKER: 'Permit Tracker',
  INSPECTION: 'Inspection Coordinator',
  BUDGET_TRACKER: 'Budget Tracker',
  COMMUNICATION: 'Communication Hub',
  TASK_QUEUE: 'Task Queue',
  DOCUMENT_GEN: 'Document Generator',
  PREDICTIVE: 'Predictive Engine',
  SMART_SCHEDULER: 'Smart Scheduler',
  QA_INSPECTOR: 'QA Inspector',
  DECISION_SUPPORT: 'Decision Support',
  ESTIMATION: 'Estimation Engine',
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function MonitoringPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchHealth()

    if (autoRefresh) {
      const interval = setInterval(fetchHealth, 30000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  async function fetchHealth() {
    try {
      setError(null)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/health/metrics`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (!response.ok) {
        throw new Error('Health check failed')
      }

      const data = await response.json()

      setHealth({
        status: data.system?.status || 'degraded',
        uptime: data.system?.uptime || 0,
        version: data.system?.version || '1.0.0',
        memoryUsage: data.system?.memoryUsage || { heapUsed: 0, heapTotal: 0, rss: 0 },
        database: data.database || { status: 'down' },
        redis: data.redis || { status: 'down' },
        queues: data.queues || {},
        queuesSummary: data.queuesSummary || {
          totalActive: 0,
          totalFailed: 0,
          totalWaiting: 0,
          healthyCount: 0,
          warningCount: 0,
          criticalCount: 0,
        },
        services: data.services || {},
        ai: data.ai || { configured: false },
      })
    } catch (err: any) {
      console.error('Health fetch error:', err)
      setError(err.message || 'Failed to fetch system health')
      setHealth({
        status: 'down',
        uptime: 0,
        version: '1.0.0',
        memoryUsage: { heapUsed: 0, heapTotal: 0, rss: 0 },
        database: { status: 'down' },
        redis: { status: 'down' },
        queues: {},
        queuesSummary: {
          totalActive: 0,
          totalFailed: 0,
          totalWaiting: 0,
          healthyCount: 0,
          warningCount: 0,
          criticalCount: 0,
        },
        services: {},
        ai: { configured: false },
      })
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
      case 'connected':
        return <Badge className="bg-green-600 text-white">Healthy</Badge>
      case 'degraded':
      case 'warning':
        return <Badge className="bg-yellow-600 text-white">Degraded</Badge>
      case 'down':
      case 'disconnected':
      case 'critical':
        return <Badge className="bg-red-600 text-white">Down</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getQueueStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-600 text-white text-xs">Healthy</Badge>
      case 'warning':
        return <Badge className="bg-yellow-600 text-white text-xs">Warning</Badge>
      case 'critical':
        return <Badge className="bg-red-600 text-white text-xs">Critical</Badge>
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'degraded':
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'down':
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const formatBytes = (mb: number) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
    return `${mb} MB`
  }

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading && !health) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="container mx-auto p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading system health...</p>
              </div>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">System Monitoring</h1>
              <p className="text-gray-600 mt-2">Infrastructure health, queues, services, and AI status</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto-refresh (30s)
              </label>
              <button
                onClick={fetchHealth}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {health && (
            <div className="space-y-6">

              {/* ================================================================ */}
              {/* System Overview */}
              {/* ================================================================ */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>System Status</CardTitle>
                      <CardDescription>Overall platform health</CardDescription>
                    </div>
                    {getStatusBadge(health.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-gray-600" />
                      <div>
                        <div className="text-sm text-gray-600">Uptime</div>
                        <div className="text-lg font-semibold">{formatUptime(health.uptime)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-gray-600" />
                      <div>
                        <div className="text-sm text-gray-600">Version</div>
                        <div className="text-lg font-semibold">v{health.version}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Cpu className="h-5 w-5 text-gray-600" />
                      <div>
                        <div className="text-sm text-gray-600">Heap Used</div>
                        <div className="text-lg font-semibold">{formatBytes(health.memoryUsage.heapUsed)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Cpu className="h-5 w-5 text-gray-600" />
                      <div>
                        <div className="text-sm text-gray-600">RSS</div>
                        <div className="text-lg font-semibold">{formatBytes(health.memoryUsage.rss)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-gray-600" />
                      <div>
                        <div className="text-sm text-gray-600">Active Jobs</div>
                        <div className="text-lg font-semibold">{health.queuesSummary.totalActive}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ================================================================ */}
              {/* Infrastructure: Database + Redis */}
              {/* ================================================================ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Database
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Status</div>
                        {getStatusBadge(health.database.status)}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-1">Latency</div>
                        <div className="text-2xl font-bold">{health.database.latency || 0}ms</div>
                      </div>
                    </div>
                    {health.database.error && (
                      <div className="mt-3 text-sm text-red-600">{health.database.error}</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="h-5 w-5" />
                      Redis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Status</div>
                        {getStatusBadge(health.redis.status)}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-1">Latency</div>
                        <div className="text-2xl font-bold">{health.redis.latency || 0}ms</div>
                      </div>
                    </div>
                    {health.redis.error && (
                      <div className="mt-3 text-sm text-red-600">{health.redis.error}</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ================================================================ */}
              {/* Queue Health Table */}
              {/* ================================================================ */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Worker Queues
                      </CardTitle>
                      <CardDescription>Background job processing across 15 automation apps</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        {health.queuesSummary.healthyCount} Healthy
                      </Badge>
                      {health.queuesSummary.warningCount > 0 && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                          {health.queuesSummary.warningCount} Warning
                        </Badge>
                      )}
                      {health.queuesSummary.criticalCount > 0 && (
                        <Badge className="bg-red-100 text-red-800 text-xs">
                          {health.queuesSummary.criticalCount} Critical
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {Object.keys(health.queues).length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-gray-600">
                            <th className="pb-3 font-medium">Queue</th>
                            <th className="pb-3 font-medium text-center">Waiting</th>
                            <th className="pb-3 font-medium text-center">Active</th>
                            <th className="pb-3 font-medium text-center">Completed</th>
                            <th className="pb-3 font-medium text-center">Failed</th>
                            <th className="pb-3 font-medium text-center">Delayed</th>
                            <th className="pb-3 font-medium text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(health.queues).map(([key, metrics]) => (
                            <tr
                              key={key}
                              className={`border-b last:border-0 ${
                                metrics.status === 'critical'
                                  ? 'bg-red-50'
                                  : metrics.status === 'warning'
                                    ? 'bg-yellow-50'
                                    : ''
                              }`}
                            >
                              <td className="py-3 font-medium">
                                {QUEUE_DISPLAY_NAMES[key] || key}
                              </td>
                              <td className="py-3 text-center">
                                <span className={metrics.waiting > 100 ? 'text-yellow-600 font-semibold' : ''}>
                                  {metrics.waiting}
                                </span>
                              </td>
                              <td className="py-3 text-center">
                                <span className={metrics.active > 0 ? 'text-blue-600 font-semibold' : ''}>
                                  {metrics.active}
                                </span>
                              </td>
                              <td className="py-3 text-center text-gray-500">
                                {metrics.completed.toLocaleString()}
                              </td>
                              <td className="py-3 text-center">
                                <span className={metrics.failed > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                                  {metrics.failed}
                                </span>
                              </td>
                              <td className="py-3 text-center text-gray-500">
                                {metrics.delayed}
                              </td>
                              <td className="py-3 text-right">
                                {getQueueStatusBadge(metrics.status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Queue summary bar */}
                      <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-gray-600">
                        <div className="flex gap-6">
                          <span>Total Waiting: <span className="font-semibold text-gray-900">{health.queuesSummary.totalWaiting}</span></span>
                          <span>Total Active: <span className="font-semibold text-blue-600">{health.queuesSummary.totalActive}</span></span>
                          <span>Total Failed: <span className="font-semibold text-red-600">{health.queuesSummary.totalFailed}</span></span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Server className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No queue data available. Redis may not be connected.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ================================================================ */}
              {/* Services + AI */}
              {/* ================================================================ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* External Services */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cloud className="h-5 w-5" />
                      External Services
                    </CardTitle>
                    <CardDescription>Third-party integrations health</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(health.services).length > 0 ? (
                        Object.entries(health.services).map(([name, service]) => {
                          const icons: Record<string, any> = {
                            stripe: <CreditCard className="h-4 w-4" />,
                            supabase: <Database className="h-4 w-4" />,
                            anthropic: <Brain className="h-4 w-4" />,
                            resend: <Mail className="h-4 w-4" />,
                          }
                          return (
                            <div key={name} className="flex items-center justify-between py-2 border-b last:border-0">
                              <div className="flex items-center gap-3">
                                {icons[name] || <Cloud className="h-4 w-4" />}
                                <span className="font-medium capitalize">{name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                {service.latency !== undefined && (
                                  <span className="text-xs text-gray-500">{service.latency}ms</span>
                                )}
                                {getStatusIcon(service.status)}
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-sm text-gray-500">No service checks configured</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      AI / Claude
                    </CardTitle>
                    <CardDescription>AI service configuration and usage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">API Configured</span>
                        {health.ai.configured ? (
                          <Badge className="bg-green-600 text-white">Active</Badge>
                        ) : (
                          <Badge className="bg-red-600 text-white">Not Configured</Badge>
                        )}
                      </div>
                      {health.ai.model && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Default Model</span>
                          <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{health.ai.model}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Features Powered</span>
                        <span className="text-sm font-semibold">
                          {health.ai.configured ? '8 apps' : '0 apps'}
                        </span>
                      </div>
                      <div className="pt-3 border-t">
                        <p className="text-xs text-gray-500">
                          AI powers: QA Inspector, Bid Analysis, Change Order Analysis,
                          Predictive Engine, Decision Support, Report Generation, Estimation, Smart Scheduler
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ================================================================ */}
              {/* Memory Usage Detail */}
              {/* ================================================================ */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    Memory Usage
                  </CardTitle>
                  <CardDescription>Node.js process memory allocation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Heap Used / Total</div>
                      <div className="text-xl font-semibold">
                        {formatBytes(health.memoryUsage.heapUsed)} / {formatBytes(health.memoryUsage.heapTotal)}
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            health.memoryUsage.heapTotal > 0 &&
                            health.memoryUsage.heapUsed / health.memoryUsage.heapTotal > 0.85
                              ? 'bg-red-600'
                              : health.memoryUsage.heapTotal > 0 &&
                                  health.memoryUsage.heapUsed / health.memoryUsage.heapTotal > 0.7
                                ? 'bg-yellow-600'
                                : 'bg-blue-600'
                          }`}
                          style={{
                            width: health.memoryUsage.heapTotal > 0
                              ? `${(health.memoryUsage.heapUsed / health.memoryUsage.heapTotal) * 100}%`
                              : '0%',
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-2">RSS (Resident Set)</div>
                      <div className="text-xl font-semibold">{formatBytes(health.memoryUsage.rss)}</div>
                      <p className="text-xs text-gray-500 mt-1">Total memory allocated by the OS</p>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Heap Utilization</div>
                      <div className="text-xl font-semibold">
                        {health.memoryUsage.heapTotal > 0
                          ? `${Math.round((health.memoryUsage.heapUsed / health.memoryUsage.heapTotal) * 100)}%`
                          : 'N/A'}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {health.memoryUsage.heapTotal > 0 &&
                        health.memoryUsage.heapUsed / health.memoryUsage.heapTotal > 0.85
                          ? 'High \u2014 consider scaling'
                          : 'Normal range'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
