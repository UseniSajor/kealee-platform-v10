'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-gray-600 mt-2">Platform configuration (feature flags, integrations, policies)</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Configuration only — not operational execution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Feature Flags</Badge>
                <Badge variant="outline">Integrations</Badge>
                <Badge variant="outline">Security</Badge>
                <Badge variant="outline">Notifications</Badge>
              </div>
              <div className="rounded-md border p-4 bg-gray-50">
                <p className="font-medium">UI ready — configuration endpoints next</p>
                <p className="text-sm text-gray-600 mt-1">
                  Settings will be stored centrally and applied across all apps via <code className="font-mono">services/api</code>.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

