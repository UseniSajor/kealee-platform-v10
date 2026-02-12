'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Webhook, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { apiRequest } from '@/lib/api'

interface WebhookIntegration {
  id: string
  name: string
  url: string
  events: string[]
  status: 'active' | 'inactive' | 'error'
  lastDelivery?: string
  successCount: number
  failureCount: number
  retryCount: number
  health: 'healthy' | 'degraded' | 'down'
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<WebhookIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchIntegrations()
  }, [])

  async function fetchIntegrations() {
    try {
      setLoading(true)
      setError(null)

      // Fetch webhook status summary and logs from real API endpoints
      const [statusData, logsData] = await Promise.all([
        apiRequest<{ status: string; summary: { totalAttempts: number; totalErrors: number; recentErrors: number }; recentLogs: any[] }>('/webhooks/status').catch(() => ({
          status: 'ok',
          summary: { totalAttempts: 0, totalErrors: 0, recentErrors: 0 },
          recentLogs: [],
        })),
        apiRequest<{ data: any[]; pagination: any }>('/webhooks/logs?limit=50').catch(() => ({
          data: [],
          pagination: { total: 0 },
        })),
      ])

      // Build webhook integrations from log data grouped by webhook action/event type
      const logsByEvent = new Map<string, any[]>()
      for (const log of (logsData.data || [])) {
        const key = log.webhookId || log.action || log.id
        if (!logsByEvent.has(key)) logsByEvent.set(key, [])
        logsByEvent.get(key)!.push(log)
      }

      const webhookIntegrations: WebhookIntegration[] = []

      // Create a summary integration from the status endpoint
      const summary = statusData.summary
      if (summary.totalAttempts > 0 || summary.totalErrors > 0) {
        const successCount = summary.totalAttempts - summary.totalErrors
        const failureCount = summary.totalErrors
        const health: 'healthy' | 'degraded' | 'down' =
          summary.recentErrors === 0 ? 'healthy' :
          summary.recentErrors < 5 ? 'degraded' : 'down'

        webhookIntegrations.push({
          id: 'stripe-webhooks',
          name: 'Stripe Webhooks',
          url: '/webhooks/stripe',
          events: ['checkout.session.completed', 'invoice.paid', 'subscription.updated'],
          status: health === 'down' ? 'error' : 'active',
          lastDelivery: statusData.recentLogs?.[0]?.createdAt,
          successCount,
          failureCount,
          retryCount: 0,
          health,
        })
      }

      // Add individual webhook log entries as integrations
      for (const [key, logs] of logsByEvent) {
        if (key === 'stripe-webhooks') continue
        const successes = logs.filter((l: any) => l.status === 'SUCCESS' || l.status === 'success').length
        const failures = logs.filter((l: any) => l.status === 'FAILED' || l.status === 'failed' || l.status === 'error').length
        const retries = logs.filter((l: any) => l.retryCount > 0).length
        const lastLog = logs[0]
        const health: 'healthy' | 'degraded' | 'down' =
          failures === 0 ? 'healthy' :
          failures < logs.length / 2 ? 'degraded' : 'down'

        webhookIntegrations.push({
          id: key,
          name: lastLog.eventType || lastLog.action || key,
          url: lastLog.url || lastLog.endpoint || key,
          events: [lastLog.eventType || lastLog.action || 'webhook'].filter(Boolean),
          status: health === 'down' ? 'error' : 'active',
          lastDelivery: lastLog.createdAt,
          successCount: successes,
          failureCount: failures,
          retryCount: retries,
          health,
        })
      }

      setIntegrations(webhookIntegrations)
    } catch (err: any) {
      console.error('Integrations fetch error:', err)
      setError(err.message || 'Failed to load webhook integrations')
      setIntegrations([])
    } finally {
      setLoading(false)
    }
  }

  const getHealthBadge = (health: WebhookIntegration['health']) => {
    switch (health) {
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

  const getStatusBadge = (status: WebhookIntegration['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600 text-white">Active</Badge>
      case 'inactive':
        return <Badge className="bg-gray-400 text-white">Inactive</Badge>
      case 'error':
        return <Badge className="bg-red-600 text-white">Error</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const stats = {
    total: integrations.length,
    healthy: integrations.filter((i) => i.health === 'healthy').length,
    degraded: integrations.filter((i) => i.health === 'degraded').length,
    down: integrations.filter((i) => i.health === 'down').length,
    totalDeliveries: integrations.reduce((sum, i) => sum + i.successCount + i.failureCount, 0),
    successRate: integrations.length > 0
      ? (integrations.reduce((sum, i) => sum + i.successCount, 0) /
          integrations.reduce((sum, i) => sum + i.successCount + i.failureCount, 0)) * 100
      : 0,
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Webhook Integrations</h1>
              <p className="text-gray-600 mt-2">Webhook health, retries, and operational monitoring</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchIntegrations}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button>
                <Webhook className="mr-2 h-4 w-4" />
                New Webhook
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Webhooks</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Webhook className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Healthy</p>
                    <p className="text-2xl font-bold text-green-600">{stats.healthy}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Deliveries</p>
                    <p className="text-2xl font-bold">{stats.totalDeliveries.toLocaleString()}</p>
                  </div>
                  <RefreshCw className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading webhook integrations...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {integrations.length === 0 ? (
                <Card className="col-span-2">
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Webhook className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-2">No webhook integrations found</p>
                      <p className="text-sm text-gray-500">Create your first webhook integration to get started</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                integrations.map((integration) => (
                  <Card key={integration.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        {getHealthBadge(integration.health)}
                      </div>
                      <CardDescription className="font-mono text-xs break-all">
                        {integration.url}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Status</span>
                          {getStatusBadge(integration.status)}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium mb-2">Events</div>
                        <div className="flex flex-wrap gap-2">
                          {integration.events.map((event) => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Success</div>
                          <div className="text-lg font-semibold text-green-600">
                            {integration.successCount.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Failures</div>
                          <div className="text-lg font-semibold text-red-600">
                            {integration.failureCount.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Retries</div>
                          <div className="text-lg font-semibold text-yellow-600">
                            {integration.retryCount.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {integration.lastDelivery && (
                        <div className="text-xs text-gray-500 pt-2 border-t">
                          Last delivery: {new Date(integration.lastDelivery).toLocaleString()}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          View Logs
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          Test
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
