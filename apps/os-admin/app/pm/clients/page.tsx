'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, ArrowLeft, Loader2 } from 'lucide-react'
import { apiRequest } from '@/lib/api'

interface ClientAssignment {
  id: string
  clientName: string
  orgName: string
  pmName: string
  status: string
  projectCount?: number
  email?: string
}

export default function PmClientAssignmentsPage() {
  const [clients, setClients] = useState<ClientAssignment[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchClients() {
      try {
        const data = await apiRequest<{ clients: ClientAssignment[] }>('/pm/clients')
        setClients(data.clients || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load clients')
      } finally {
        setLoading(false)
      }
    }
    fetchClients()
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return clients
    const q = search.trim().toLowerCase()
    return clients.filter(
      (c) =>
        (c.clientName || '').toLowerCase().includes(q) ||
        (c.orgName || '').toLowerCase().includes(q) ||
        (c.pmName || '').toLowerCase().includes(q)
    )
  }, [search, clients])

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <Link href="/pm">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to PM Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Client Assignments</h1>
            <p className="text-gray-600 mt-2">Assign PMs to clients and balance workload</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search</CardTitle>
              <CardDescription>Search by client, org, or PM</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search assignments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>PM</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                      No client assignments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.clientName}</TableCell>
                      <TableCell className="text-gray-600">{a.orgName || '-'}</TableCell>
                      <TableCell className="text-gray-600">{a.pmName || 'Unassigned'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{a.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Reassign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
