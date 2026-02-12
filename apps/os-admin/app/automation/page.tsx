'use client'

import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, ShieldAlert } from 'lucide-react'

// Week 5 Task 55: Automation dashboard (ML governance & approvals) — UI-first.
export default function AutomationDashboardPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Automation</h1>
            <p className="text-gray-600 mt-2">ML governance, approvals, and rules (meta-level)</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Approvals</CardTitle>
                <CardDescription>Pending ML suggestions / rules requiring approval</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Pending: 0</Badge>
                  <Badge variant="outline">Approved: 0</Badge>
                  <Badge variant="outline">Rejected: 0</Badge>
                </div>
                <Link href="/automation/rules">
                  <Button variant="outline" className="w-full justify-between">
                    Review Rules <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>Webhook health, retries, and operational monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/automation/integrations">
                  <Button variant="outline" className="w-full justify-between">
                    View Integrations <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-orange-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-6 w-6 text-orange-500" />
                  <div>
                    <CardTitle>Alerts &amp; Monitoring</CardTitle>
                    <CardDescription>
                      System alerts, dead letter queue management, and circuit breaker status
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Alerts</Badge>
                  <Badge variant="outline">Dead Letter Queue</Badge>
                  <Badge variant="outline">Circuit Breakers</Badge>
                  <Badge variant="outline">Health Metrics</Badge>
                </div>
                <Link href="/automation/alerts">
                  <Button variant="outline" className="w-full justify-between">
                    View Alerts Dashboard <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

