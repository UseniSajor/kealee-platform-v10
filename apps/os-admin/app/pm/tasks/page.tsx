'use client'

import Link from 'next/link'
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
import { useMemo, useState } from 'react'

// Task 47: Task queue page (UI-first). Backend wiring TBD.
type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETE' | 'BLOCKED'
type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

interface PmTask {
  id: string
  title: string
  clientName: string
  dueAt: string
  status: TaskStatus
  priority: Priority
}

const demoTasks: PmTask[] = []

export default function PmTasksPage() {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return demoTasks
    const q = search.trim().toLowerCase()
    return demoTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.clientName.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q)
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
                <h1 className="text-3xl font-bold">PM Tasks</h1>
                <p className="text-gray-600 mt-2">Queue of PM tasks (priority, due date, status)</p>
              </div>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search</CardTitle>
              <CardDescription>Search by client, title, or status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tasks…"
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
                  <TableHead>Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                      No tasks found (this page is UI-ready; data hookup is next).
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.title}</TableCell>
                      <TableCell className="text-gray-600">{t.clientName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{t.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{t.status}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(t.dueAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/pm/tasks/${t.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
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

