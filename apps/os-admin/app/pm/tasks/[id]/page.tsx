'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { apiRequest } from '@/lib/api'

interface TaskDetail {
  id: string
  title: string
  description?: string | null
  status: string
  priority: string
  dueAt?: string | null
  clientName?: string
  projectId?: string
  assignedTo?: { id: string; name: string; email: string } | null
  comments?: Array<{ id: string; comment: string; createdAt: string; createdBy?: { name: string } }>
  createdAt?: string
  updatedAt?: string
}

export default function PmTaskDetailPage() {
  const params = useParams()
  const taskId = params.id as string
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTask() {
      try {
        const data = await apiRequest<{ task: TaskDetail }>(`/pm/tasks/${taskId}`)
        setTask(data.task)
      } catch (err: any) {
        setError(err.message || 'Failed to load task')
      } finally {
        setLoading(false)
      }
    }
    fetchTask()
  }, [taskId])

  const handleComplete = async () => {
    setCompleting(true)
    setActionMessage(null)
    try {
      await apiRequest(`/pm/tasks/${taskId}/complete`, { method: 'POST' })
      setTask(prev => prev ? { ...prev, status: 'COMPLETE' } : prev)
      setActionMessage('Task marked as complete')
    } catch (err: any) {
      setActionMessage(err.message || 'Failed to complete task')
    } finally {
      setCompleting(false)
    }
  }

  const handleInProgress = async () => {
    try {
      await apiRequest(`/pm/tasks/${taskId}`, {
        method: 'PATCH',
        body: { status: 'IN_PROGRESS' },
      })
      setTask(prev => prev ? { ...prev, status: 'IN_PROGRESS' } : prev)
      setActionMessage('Task marked as in progress')
    } catch (err: any) {
      setActionMessage(err.message || 'Failed to update task')
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'COMPLETE': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'BLOCKED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

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

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-8">
                <div className="flex items-center gap-3 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          ) : task ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{task.title}</CardTitle>
                  <CardDescription>
                    {task.clientName && `Client: ${task.clientName}`}
                    {task.createdAt && ` | Created: ${new Date(task.createdAt).toLocaleDateString()}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge className={statusColor(task.status)}>{task.status}</Badge>
                    <Badge variant="outline">{task.priority}</Badge>
                    {task.dueAt && (
                      <Badge variant="outline">
                        Due: {new Date(task.dueAt).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>

                  {task.description && (
                    <div className="rounded-md border p-4 bg-gray-50">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
                    </div>
                  )}

                  {task.assignedTo && (
                    <div className="text-sm text-gray-600">
                      Assigned to: <span className="font-medium">{task.assignedTo.name}</span> ({task.assignedTo.email})
                    </div>
                  )}

                  {actionMessage && (
                    <div className={`p-3 rounded-lg text-sm ${
                      actionMessage.includes('Failed') || actionMessage.includes('blocked')
                        ? 'bg-red-50 text-red-700'
                        : 'bg-green-50 text-green-700'
                    }`}>
                      {actionMessage}
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    {task.status !== 'IN_PROGRESS' && task.status !== 'COMPLETE' && (
                      <Button variant="outline" onClick={handleInProgress}>
                        Mark In Progress
                      </Button>
                    )}
                    {task.status !== 'COMPLETE' && (
                      <Button onClick={handleComplete} disabled={completing}>
                        {completing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {task.comments && task.comments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Comments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {task.comments.map(comment => (
                        <div key={comment.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between text-sm text-gray-500 mb-1">
                            <span className="font-medium">{comment.createdBy?.name || 'Unknown'}</span>
                            <span>{new Date(comment.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-sm">{comment.comment}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                Task not found.
              </CardContent>
            </Card>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
