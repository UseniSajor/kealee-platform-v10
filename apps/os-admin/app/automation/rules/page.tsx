'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Bot, CheckCircle, XCircle, Clock } from 'lucide-react'

interface AutomationRule {
  id: string
  name: string
  description: string
  trigger: string
  action: string
  status: 'active' | 'inactive' | 'pending_approval'
  approvalStatus?: 'pending' | 'approved' | 'rejected'
  createdBy: string
  createdAt: string
  lastExecuted?: string
  executionCount: number
}

export default function AutomationRulesPage() {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRules()
  }, [])

  async function fetchRules() {
    try {
      setLoading(true)
      setError(null)
      // Note: This endpoint may need to be created in the API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/automation/rules`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRules(data.rules || [])
      } else {
        setRules([])
      }
    } catch (err: any) {
      console.error('Rules fetch error:', err)
      setError(err.message || 'Failed to load automation rules')
      setRules([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: AutomationRule['status'], approvalStatus?: string) => {
    if (status === 'pending_approval' || approvalStatus === 'pending') {
      return <Badge className="bg-yellow-600 text-white">Pending Approval</Badge>
    }
    if (approvalStatus === 'rejected') {
      return <Badge className="bg-red-600 text-white">Rejected</Badge>
    }
    if (status === 'active') {
      return <Badge className="bg-green-600 text-white">Active</Badge>
    }
    return <Badge className="bg-gray-400 text-white">Inactive</Badge>
  }

  const stats = {
    total: rules.length,
    active: rules.filter((r) => r.status === 'active').length,
    pending: rules.filter((r) => r.status === 'pending_approval' || r.approvalStatus === 'pending').length,
    inactive: rules.filter((r) => r.status === 'inactive').length,
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Automation Rules</h1>
              <p className="text-gray-600 mt-2">ML governance, approvals, and automation rules</p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Rule
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Rules</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Bot className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Inactive</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
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
                <p className="mt-4 text-gray-600">Loading automation rules...</p>
              </div>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Automation Rules</CardTitle>
                <CardDescription>
                  ML-suggested and manually created automation rules requiring approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rules.length === 0 ? (
                  <div className="text-center py-12">
                    <Bot className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">No automation rules found</p>
                    <p className="text-sm text-gray-500">Create your first automation rule to get started</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Trigger</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Executions</TableHead>
                        <TableHead>Last Executed</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell className="font-medium">{rule.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{rule.trigger}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{rule.action}</Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(rule.status, rule.approvalStatus)}
                          </TableCell>
                          <TableCell>{rule.executionCount}</TableCell>
                          <TableCell className="text-gray-600">
                            {rule.lastExecuted
                              ? new Date(rule.lastExecuted).toLocaleDateString()
                              : 'Never'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {rule.status === 'pending_approval' && (
                                <>
                                  <Button variant="outline" size="sm" className="text-green-600">
                                    Approve
                                  </Button>
                                  <Button variant="outline" size="sm" className="text-red-600">
                                    Reject
                                  </Button>
                                </>
                              )}
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
