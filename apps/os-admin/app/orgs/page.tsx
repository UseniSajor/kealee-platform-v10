'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'

interface Org {
  id: string
  name: string
  slug: string
  description?: string
  status: string
  createdAt: string
}

export default function OrgsPage() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, limit: 10, totalPages: 0 })

  useEffect(() => {
    fetchOrgs()
  }, [page, search])

  async function fetchOrgs() {
    try {
      setLoading(true)
      const data = await api.getOrgs({
        page,
        limit: 10,
        search: search || undefined,
      })
      setOrgs(data.orgs || [])
      setPagination(data.pagination || { total: 0, limit: 10, totalPages: 0 })
    } catch (err: any) {
      setError(err.message || 'Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchOrgs()
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Organizations</h1>
              <p className="text-gray-600 mt-2">Manage all organizations</p>
            </div>
            <Link href="/orgs/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Organization
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="mb-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search organizations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
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
                <p className="mt-4 text-gray-600">Loading organizations...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No organizations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      orgs.map((org) => (
                        <TableRow key={org.id}>
                          <TableCell className="font-medium">
                            <Link href={`/orgs/${org.id}`} className="hover:underline">
                              {org.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-gray-600">{org.slug}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                org.status === 'ACTIVE'
                                  ? 'default'
                                  : org.status === 'SUSPENDED'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {org.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {new Date(org.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/orgs/${org.id}`}>
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

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {((page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} organizations
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
