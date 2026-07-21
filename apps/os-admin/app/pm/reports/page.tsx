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
import { Search, ArrowLeft, Loader2, FileText } from 'lucide-react'
import { apiRequest } from '@/lib/api'

interface WeeklyReport {
  id: string
  clientName: string
  weekOf: string
  status: string
  projectName?: string
  generatedAt?: string
}

export default function PmReportsPage() {
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [])

  async function fetchReports() {
    try {
      const data = await apiRequest<{ reports: WeeklyReport[] }>('/pm/reports/weekly')
      setReports(data.reports || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async () => {
    setGenerating(true)
    try {
      await apiRequest('/pm/reports/weekly', { method: 'POST' })
      await fetchReports()
    } catch (err: any) {
      setError(err.message || 'Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return reports
    const q = search.trim().toLowerCase()
    return reports.filter(
      (r) =>
        (r.clientName || '').toLowerCase().includes(q) ||
        (r.status || '').toLowerCase().includes(q) ||
        (r.projectName || '').toLowerCase().includes(q)
    )
  }, [search, reports])

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
                <p className="text-gray-600 mt-2">Weekly reports generation and history</p>
              </div>
              <Button onClick={handleGenerateReport} disabled={generating}>
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Generate Report
              </Button>
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
                  placeholder="Search reports..."
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
                  <TableHead>Week Of</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-gray-500">
                      No reports yet. Click "Generate Report" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.clientName || r.projectName || '-'}</TableCell>
                      <TableCell className="text-gray-600">{new Date(r.weekOf).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
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
