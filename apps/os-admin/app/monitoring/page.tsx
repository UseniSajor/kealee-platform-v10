'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function MonitoringPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Monitoring</h1>
            <p className="text-gray-600 mt-2">System health, uptime, errors, queue status</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Platform monitoring is meta-level visibility (not per-customer screens)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Uptime</Badge>
                <Badge variant="outline">API Errors</Badge>
                <Badge variant="outline">Worker Queues</Badge>
                <Badge variant="outline">Latency</Badge>
                <Badge variant="outline">DB Health</Badge>
              </div>
              <div className="rounded-md border p-4 bg-gray-50">
                <p className="font-medium">UI ready — API wiring next</p>
                <p className="text-sm text-gray-600 mt-1">
                  Next step is wiring to `/health`, worker queue stats, and structured error dashboards.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

