'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

// Task 48: Task detail page (UI-first). Backend wiring TBD.
export default function PmTaskDetailPage() {
  const params = useParams()
  const taskId = params.id as string

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="mb-6">
            <Link href="/pm/tasks">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Task Queue
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Task Detail</h1>
            <p className="text-gray-600 mt-2">Task ID: <span className="font-mono">{taskId}</span></p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Task Overview</CardTitle>
              <CardDescription>Data hookup planned in Week 5 backend tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">PENDING</Badge>
                <Badge variant="outline">MEDIUM</Badge>
              </div>

              <div className="rounded-md border p-4 bg-gray-50">
                <p className="font-medium">No task data yet</p>
                <p className="text-sm text-gray-600 mt-1">
                  This page is ready so you won’t hit 404s. Next we’ll wire it to the tasks API.
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" disabled>
                  Mark In Progress
                </Button>
                <Button disabled>Mark Complete</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

