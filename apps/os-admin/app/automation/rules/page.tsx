'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Week 5 Task 56: Automation rule approvals — UI-first.
export default function AutomationRulesPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Automation Rules</h1>
            <p className="text-gray-600 mt-2">Review and approve ML-generated rules</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rule Approval Queue</CardTitle>
              <CardDescription>Human-in-the-loop governance (meta-level)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Pending</Badge>
                <Badge variant="outline">Approved</Badge>
                <Badge variant="outline">Rejected</Badge>
              </div>
              <div className="rounded-md border p-4 bg-gray-50">
                <p className="font-medium">No rules yet</p>
                <p className="text-sm text-gray-600 mt-1">
                  Next step is wiring to ML suggestion storage + approval endpoints.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

