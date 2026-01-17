'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

// Week 5 Task 53/54: Dispute detail + resolution UI (UI-first). Backend wiring TBD.
export default function DisputeDetailPage() {
  const params = useParams()
  const disputeId = params.id as string

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="mb-6">
            <Link href="/disputes">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Disputes
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Dispute Review</h1>
            <p className="text-gray-600 mt-2">
              Dispute ID: <span className="font-mono">{disputeId}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Case Details</CardTitle>
                <CardDescription>Evidence, timeline, and context (UI-first)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">PAYMENT</Badge>
                  <Badge variant="outline">OPEN</Badge>
                </div>
                <div className="rounded-md border p-4 bg-gray-50">
                  <p className="font-medium">No dispute data yet</p>
                  <p className="text-sm text-gray-600 mt-1">
                    This page is ready to prevent 404s. Next we’ll wire to disputes API + evidence storage.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resolution</CardTitle>
                <CardDescription>Admin decision controls (meta-level)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" disabled>
                  Move to Investigating
                </Button>
                <Button className="w-full" variant="outline" disabled>
                  Freeze Payment
                </Button>
                <Button className="w-full" variant="outline" disabled>
                  Unfreeze Payment
                </Button>
                <Button className="w-full" variant="destructive" disabled>
                  Resolve Dispute
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

