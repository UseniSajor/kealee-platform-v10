'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { apiRequest } from '@/lib/api'

interface DisputeDetail {
  id: string
  status: string
  type: string
  reason: string
  description: string
  priority?: string
  projectId: string
  milestoneId?: string
  createdAt: string
  updatedAt: string
  messages?: any[]
  evidence?: any[]
}

export default function DisputeDetailPage() {
  const params = useParams()
  const disputeId = params.id as string
  const [dispute, setDispute] = useState<DisputeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (disputeId) {
      fetchDispute()
    }
  }, [disputeId])

  async function fetchDispute() {
    try {
      setLoading(true)
      setError(null)
      const data = await apiRequest<{ dispute: DisputeDetail }>(`/disputes/${disputeId}`)
      setDispute(data.dispute)
    } catch (err: any) {
      console.error('Dispute fetch error:', err)
      setError(err.message || 'Failed to load dispute details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <Badge className="bg-blue-600 text-white">Open</Badge>
      case 'INVESTIGATING': return <Badge className="bg-yellow-600 text-white">Investigating</Badge>
      case 'IN_MEDIATION': return <Badge className="bg-purple-600 text-white">In Mediation</Badge>
      case 'RESOLVED': return <Badge className="bg-green-600 text-white">Resolved</Badge>
      case 'CLOSED': return <Badge className="bg-gray-600 text-white">Closed</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

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

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading dispute details...</p>
              </div>
            </div>
          ) : dispute ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Case Details</CardTitle>
                  <CardDescription>Evidence, timeline, and context</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{dispute.type}</Badge>
                    {getStatusBadge(dispute.status)}
                    {dispute.priority && <Badge variant="outline">{dispute.priority}</Badge>}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Reason</p>
                    <p className="text-sm mt-1">{dispute.reason}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Description</p>
                    <p className="text-sm mt-1">{dispute.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Project ID</p>
                      <p className="text-sm font-mono mt-1">{dispute.projectId}</p>
                    </div>
                    {dispute.milestoneId && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Milestone ID</p>
                        <p className="text-sm font-mono mt-1">{dispute.milestoneId}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-600">Opened</p>
                      <p className="text-sm mt-1">{new Date(dispute.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Last Updated</p>
                      <p className="text-sm mt-1">{new Date(dispute.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {dispute.messages && dispute.messages.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium text-gray-600 mb-2">Messages ({dispute.messages.length})</p>
                      <div className="space-y-2">
                        {dispute.messages.map((msg: any, idx: number) => (
                          <div key={idx} className="rounded-md border p-3 bg-gray-50 text-sm">
                            <p>{msg.message || msg.comment}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {msg.senderId && `By ${msg.senderId}`} {msg.createdAt && `at ${new Date(msg.createdAt).toLocaleString()}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resolution</CardTitle>
                  <CardDescription>Admin decision controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full"
                    disabled={dispute.status !== 'OPEN'}
                    onClick={() => {/* TODO: Implement status transition */}}
                  >
                    Move to Investigating
                  </Button>
                  <Button className="w-full" variant="outline" disabled={dispute.status === 'RESOLVED' || dispute.status === 'CLOSED'}>
                    Request Mediation
                  </Button>
                  <Button className="w-full" variant="destructive" disabled={dispute.status === 'RESOLVED' || dispute.status === 'CLOSED'}>
                    Resolve Dispute
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="rounded-md border p-4 bg-gray-50 text-center">
              <p className="font-medium">Dispute not found</p>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

