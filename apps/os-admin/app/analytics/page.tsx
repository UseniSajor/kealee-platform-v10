'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-gray-600 mt-2">Platform-wide analytics (acquisition, funnel, retention)</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Platform Analytics</CardTitle>
              <CardDescription>Cross-product insights aggregated at the platform level</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Acquisition</Badge>
                <Badge variant="outline">Activation</Badge>
                <Badge variant="outline">Retention</Badge>
                <Badge variant="outline">Revenue</Badge>
                <Badge variant="outline">Referral</Badge>
              </div>
              <div className="rounded-md border p-4 bg-gray-50">
                <p className="font-medium">UI ready — API wiring next</p>
                <p className="text-sm text-gray-600 mt-1">
                  This will be backed by aggregated events + billing/subscription signals via <code className="font-mono">services/api</code>.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

