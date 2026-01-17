'use client'

import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// os-admin Jurisdictions = setup/config + subscription + link-out (not permit processing)
export default function JurisdictionsPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Jurisdictions</h1>
            <p className="text-gray-600 mt-2">
              Jurisdiction setup, fee schedules, staff roles, subscription tier (meta-level)
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Jurisdictions Management</CardTitle>
              <CardDescription>
                This page configures jurisdictions and links to permit operations in <code className="font-mono">m-permits-inspections</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Add Jurisdiction</Badge>
                <Badge variant="outline">Fee Schedules</Badge>
                <Badge variant="outline">Staff Roles</Badge>
                <Badge variant="outline">Subscription Tier</Badge>
                <Badge variant="outline">Summary Metrics</Badge>
              </div>

              <div className="rounded-md border p-4 bg-gray-50">
                <p className="font-medium">UI ready — operational work lives elsewhere</p>
                <p className="text-sm text-gray-600 mt-1">
                  Permit application processing, plan review, and inspection scheduling are handled in the operational app.
                </p>
              </div>

              <div className="flex justify-end">
                <Link href="#" aria-disabled className="pointer-events-none opacity-60">
                  <Button variant="outline" disabled>
                    Open Operational Dashboard (m-permits-inspections)
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

