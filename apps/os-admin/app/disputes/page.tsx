'use client'

import Link from 'next/link'
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

// Week 5 disputes UI (os-admin oversight + resolution decisions). Backend wiring TBD.
interface Dispute {
  id: string
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED'
  type: 'PAYMENT' | 'SERVICE'
  openedAt: string
  orgName: string
}

const demoDisputes: Dispute[] = []

export default function DisputesQueuePage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Disputes</h1>
            <p className="text-gray-600 mt-2">Payment & service dispute resolution (platform oversight)</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Dispute Queue</CardTitle>
              <CardDescription>Open disputes requiring review (UI-first)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Filters: status/type/priority</Badge>
                <Badge variant="outline">Escalations</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="bg-white rounded-lg shadow-sm border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demoDisputes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                      No disputes yet (data hookup next).
                    </TableCell>
                  </TableRow>
                ) : (
                  demoDisputes.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Badge variant="outline">{d.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{d.status}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">{d.orgName}</TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(d.openedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/disputes/${d.id}`}>
                          <Button variant="ghost" size="sm">
                            Review
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

