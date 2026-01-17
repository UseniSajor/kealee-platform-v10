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

// Task 51: PM reports page (UI-first). Backend wiring TBD.
interface WeeklyReport {
  id: string
  clientName: string
  weekOf: string
  status: 'DRAFT' | 'SENT'
}

const demoReports: WeeklyReport[] = []

export default function PmReportsPage() {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return demoReports
    const q = search.trim().toLowerCase()
    return demoReports.filter(
      (r) => r.clientName.toLowerCase().includes(q) || r.status.toLowerCase().includes(q)
    )
  }, [search])

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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Reports</h1>
                <p className="text-gray-600 mt-2">Weekly reports generation + history (UI-first)</p>
              </div>
              <Button disabled>Generate Report</Button>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search</CardTitle>
              <CardDescription>Search by client or status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search reports…"
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
                  <TableHead>Week Of</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-gray-500">
                      No reports yet (data hookup next).
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.clientName}</TableCell>
                      <TableCell className="text-gray-600">{new Date(r.weekOf).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" disabled>
                          View
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

