'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, AlertCircle, CheckCircle, XCircle, Clock, Database, Server, Zap } from 'lucide-react'

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down'
  uptime: number
  apiErrors: {
    total: number
    last24h: number
    critical: number
  }
  workerQueues: {
    name: string
    pending: number
    processing: number
    failed: number
    status: 'healthy' | 'warning' | 'critical'
  }[]
  latency: {
    p50: number
    p95: number
    p99: number
  }
  database: {
    status: 'connected' | 'degraded' | 'disconnected'
    connections: number
    maxConnections: number
    queryTime: number
  }
  services: {
    name: string
    status: 'up' | 'down' | 'degraded'
    responseTime: number
    lastCheck: string
  }[]
}

export default function MonitoringPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchHealth()
    
    if (autoRefresh) {
      const interval = setInterval(fetchHealth, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  async function fetchHealth() {
    try {
      setError(null)
      
      // Fetch health from API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Health check failed')
      }

      const data = await response.json()

      // Transform API response
      setHealth({
        status: data.status === 'ok' ? 'healthy' : 'degraded',
        uptime: data.uptime || 0,
        apiErrors: {
          total: data.errors?.total || 0,
          last24h: data.errors?.last24h || 0,
          critical: data.errors?.critical || 0,
        },
        workerQueues: data.queues || [],
        latency: {
          p50: data.latency?.p50 || 0,
          p95: data.latency?.p95 || 0,
          p99: data.latency?.p99 || 0,
        },
        database: {
          status: data.database === 'connected' ? 'connected' : 'disconnected',
          connections: data.dbConnections || 0,
          maxConnections: data.dbMaxConnections || 100,
          queryTime: data.dbQueryTime || 0,
        },
        services: data.services || [],
      })
    } catch (err: any) {
      console.error('Health fetch error:', err)
      setError(err.message || 'Failed to fetch system health')
      setHealth({
        status: 'down',
        uptime: 0,
        apiErrors: { total: 0, last24h: 0, critical: 0 },
        workerQueues: [],
        latency: { p50: 0, p95: 0, p99: 0 },
        database: { status: 'disconnected', connections: 0, maxConnections: 100, queryTime: 0 },
        services: [],
      })
    } finally {
      setLoading(false)
    }
  }

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

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

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

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">System Monitoring</h1>
              <p className="text-gray-600 mt-2">System health, uptime, errors, queue status</p>
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
              {/* Overall Status */}
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <div className="text-sm text-gray-600">Environment</div>
                        <div className="text-lg font-semibold">{process.env.NODE_ENV || 'development'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-gray-600" />
                      <div>
                        <div className="text-sm text-gray-600">Last Check</div>
                        <div className="text-lg font-semibold">{new Date().toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* API Errors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    API Errors
                  </CardTitle>
                  <CardDescription>Error tracking and monitoring</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Total Errors</div>
                      <div className="text-2xl font-bold">{health.apiErrors.total.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Last 24 Hours</div>
                      <div className="text-2xl font-bold">{health.apiErrors.last24h.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Critical</div>
                      <div className="text-2xl font-bold text-red-600">{health.apiErrors.critical.toLocaleString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Latency */}
              <Card>
                <CardHeader>
                  <CardTitle>API Latency</CardTitle>
                  <CardDescription>Response time percentiles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">P50 (Median)</div>
                      <div className="text-2xl font-bold">{health.latency.p50}ms</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">P95</div>
                      <div className="text-2xl font-bold">{health.latency.p95}ms</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">P99</div>
                      <div className="text-2xl font-bold">{health.latency.p99}ms</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Database Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database
                  </CardTitle>
                  <CardDescription>Database connection and performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Status</div>
                      <div>{getStatusBadge(health.database.status)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Connections</div>
                      <div className="text-lg font-semibold">
                        {health.database.connections} / {health.database.maxConnections}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Query Time</div>
                      <div className="text-lg font-semibold">{health.database.queryTime}ms</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Usage</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(health.database.connections / health.database.maxConnections) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Worker Queues */}
              {health.workerQueues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Worker Queues</CardTitle>
                    <CardDescription>Background job processing status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {health.workerQueues.map((queue) => (
                        <div key={queue.name} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Server className="h-4 w-4 text-gray-600" />
                              <span className="font-medium">{queue.name}</span>
                            </div>
                            {getStatusBadge(queue.status)}
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-gray-600">Pending</div>
                              <div className="font-semibold">{queue.pending}</div>
                            </div>
                            <div>
                              <div className="text-gray-600">Processing</div>
                              <div className="font-semibold">{queue.processing}</div>
                            </div>
                            <div>
                              <div className="text-gray-600">Failed</div>
                              <div className="font-semibold text-red-600">{queue.failed}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Services */}
              {health.services.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Services</CardTitle>
                    <CardDescription>External service health checks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {health.services.map((service) => (
                        <div key={service.name} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{service.name}</span>
                            {getStatusBadge(service.status)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Response: {service.responseTime}ms
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Last check: {new Date(service.lastCheck).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
