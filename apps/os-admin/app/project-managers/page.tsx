'use client'

import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// os-admin Project Managers = oversight + assignments (meta-level)
export default function ProjectManagersPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Project Managers</h1>
            <p className="text-gray-600 mt-2">PM oversight, assignments, workload balancing (management)</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>PM Oversight</CardTitle>
              <CardDescription>
                Assign PMs to clients, view workload, and link to execution console (<code className="font-mono">os-pm</code>).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Assign PM → Client</Badge>
                <Badge variant="outline">Workload</Badge>
                <Badge variant="outline">Capacity</Badge>
                <Badge variant="outline">Escalations</Badge>
              </div>

              <div className="rounded-md border p-4 bg-gray-50">
                <p className="font-medium">Management vs execution</p>
                <p className="text-sm text-gray-600 mt-1">
                  This tab manages assignments. Task execution happens in the PM execution console.
                </p>
              </div>

              <div className="flex justify-end">
                {/* Until os-pm is split into its own app, we link to the current placeholder PM routes. */}
                <Link href="/pm">
                  <Button variant="outline">Open PM Execution Console</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

