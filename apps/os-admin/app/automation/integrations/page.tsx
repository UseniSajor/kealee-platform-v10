'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Week 5 Task 57: Integration monitoring — UI-first.
export default function IntegrationMonitoringPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Integration Monitoring</h1>
            <p className="text-gray-600 mt-2">Webhooks, retries, and integration health</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>Operational telemetry exposed at the platform level</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Active</Badge>
                <Badge variant="outline">Failing</Badge>
                <Badge variant="outline">Retries</Badge>
              </div>
              <div className="rounded-md border p-4 bg-gray-50">
                <p className="font-medium">No integrations configured yet</p>
                <p className="text-sm text-gray-600 mt-1">
                  Next step is wiring to webhook logs + retry controls.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

