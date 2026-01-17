'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// os-admin Financials = PLATFORM-WIDE metrics (not per-customer ledgers)
export default function FinancialsPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Financials</h1>
            <p className="text-gray-600 mt-2">
              Platform-wide revenue, MRR/ARR trends, churn, LTV (meta-level)
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Platform Financials</CardTitle>
              <CardDescription>
                This page intentionally excludes escrow/project-level accounting (handled in customer apps).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Total Revenue</Badge>
                <Badge variant="outline">MRR</Badge>
                <Badge variant="outline">ARR</Badge>
                <Badge variant="outline">Churn</Badge>
                <Badge variant="outline">LTV</Badge>
                <Badge variant="outline">Subscription Health</Badge>
              </div>

              <div className="rounded-md border p-4 bg-gray-50">
                <p className="font-medium">UI ready — API wiring next</p>
                <p className="text-sm text-gray-600 mt-1">
                  Profit-center revenue rollups (Ops Services, Project Owner, Marketplace, Design, Permits) will be
                  surfaced here once endpoints are available.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

