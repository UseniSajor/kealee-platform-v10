'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
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
import { Search, ArrowLeft } from 'lucide-react'

// Task 50: Client assignment interface (UI-first).
// Note: Per updated principles, assignment is "management" (os-admin), execution is os-pm.
interface ClientAssignment {
  id: string
  clientName: string
  orgName: string
  pmName: string
  status: 'ACTIVE' | 'PAUSED'
}

const demoAssignments: ClientAssignment[] = []

export default function PmClientAssignmentsPage() {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return demoAssignments
    const q = search.trim().toLowerCase()
    return demoAssignments.filter(
      (c) =>
        c.clientName.toLowerCase().includes(q) ||
        c.orgName.toLowerCase().includes(q) ||
        c.pmName.toLowerCase().includes(q)
    )
  }, [search])

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <Link href="/project-managers">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Project Managers
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Client Assignments</h1>
            <p className="text-gray-600 mt-2">Assign PMs to clients and balance workload (UI-first)</p>
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
                  placeholder="Search assignments…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

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
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                      No assignments yet (data hookup next).
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.clientName}</TableCell>
                      <TableCell className="text-gray-600">{a.orgName}</TableCell>
                      <TableCell className="text-gray-600">{a.pmName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{a.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" disabled>
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

