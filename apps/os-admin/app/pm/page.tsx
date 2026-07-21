'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ListTodo, UsersRound, Clock, ArrowRight, Loader2 } from 'lucide-react'
import { apiRequest } from '@/lib/api'

interface PmStats {
  assignedClients: number
  tasksToday: number
  overdueTasks: number
  totalTasks?: number
  completedTasks?: number
}

interface PmTask {
  id: string
  title: string
  clientName?: string
  dueAt?: string
  status: string
  priority: string
}

export default function PmDashboardPage() {
  const [stats, setStats] = useState<PmStats>({ assignedClients: 0, tasksToday: 0, overdueTasks: 0 })
  const [recentTasks, setRecentTasks] = useState<PmTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          apiRequest<{ stats: PmStats }>('/pm/stats').catch(() => ({ stats: { assignedClients: 0, tasksToday: 0, overdueTasks: 0 } })),
          apiRequest<{ tasks: PmTask[] }>('/pm/tasks?limit=5&sortBy=dueAt&sortOrder=asc').catch(() => ({ tasks: [] })),
        ])
        setStats(statsRes.stats)
        setRecentTasks(tasksRes.tasks || [])
      } catch (err) {
        console.error('Failed to fetch PM stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">PM Dashboard</h1>
            <p className="text-gray-600 mt-2">Work overview and queues</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Assigned Clients</p>
                  <p className="text-3xl font-bold mt-2">
                    {loading ? <Loader2 className="h-8 w-8 animate-spin text-gray-300" /> : stats.assignedClients}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">PM workload</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <UsersRound className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasks Due Today</p>
                  <p className="text-3xl font-bold mt-2">
                    {loading ? <Loader2 className="h-8 w-8 animate-spin text-gray-300" /> : stats.tasksToday}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Priority queue</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <ListTodo className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
                  <p className="text-3xl font-bold mt-2">
                    {loading ? <Loader2 className="h-8 w-8 animate-spin text-gray-300" /> : stats.overdueTasks}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Requires attention</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>Your latest assigned tasks</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : recentTasks.length === 0 ? (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">No tasks yet</p>
                      <p className="text-sm text-gray-500">Tasks will appear here once assigned.</p>
                    </div>
                    <Badge variant="outline">0</Badge>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTasks.map(task => (
                      <Link key={task.id} href={`/pm/tasks/${task.id}`} className="block">
                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition">
                          <div className="space-y-1 min-w-0 flex-1">
                            <p className="font-medium truncate">{task.title}</p>
                            {task.dueAt && (
                              <p className="text-sm text-gray-500">
                                Due: {new Date(task.dueAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-3">
                            <Badge variant="outline">{task.priority}</Badge>
                            <Badge variant="outline">{task.status}</Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <Link href="/pm/tasks">
                    <Button variant="outline">
                      View all tasks <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
                <CardDescription>Common PM tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/pm/tasks" className="block">
                  <Button variant="outline" className="w-full justify-between">
                    Task Queue <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/pm/clients" className="block">
                  <Button variant="outline" className="w-full justify-between">
                    Client Assignments <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/pm/reports" className="block">
                  <Button variant="outline" className="w-full justify-between">
                    Reports <ArrowRight className="h-4 w-4" />
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
