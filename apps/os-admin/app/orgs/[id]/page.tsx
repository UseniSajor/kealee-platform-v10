'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Edit, Users } from 'lucide-react'
import Link from 'next/link'
import { ModuleEnablement } from '@/components/orgs/module-enablement'

interface Org {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  status: string
  createdAt: string
  updatedAt: string
}

interface OrgMember {
  id: string
  userId: string
  role: string
  user?: {
    name: string
    email: string
  }
}

export default function OrgDetailPage() {
  const params = useParams()
  const orgId = params.id as string
  const [org, setOrg] = useState<Org | null>(null)
  const [members, setMembers] = useState<OrgMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (orgId) {
      fetchOrgDetails()
    }
  }, [orgId])

  async function fetchOrgDetails() {
    try {
      setLoading(true)
      const data = await api.getOrg(orgId)
      setOrg(data.org)

      // The GET /orgs/:id endpoint includes members with user details
      if (data.org?.members) {
        setMembers(data.org.members.map((m: any) => ({
          id: m.id,
          userId: m.userId,
          role: m.roleKey || m.role,
          user: m.user ? {
            name: m.user.name || 'Unknown',
            email: m.user.email || 'N/A',
          } : undefined,
        })))
      } else {
        setMembers([])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load organization')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="container mx-auto p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading organization...</p>
              </div>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (error || !org) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="container mx-auto p-6">
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error || 'Organization not found'}
            </div>
            <Link href="/orgs">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Organizations
              </Button>
            </Link>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <Link href="/orgs">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Organizations
              </Button>
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{org.name}</h1>
                <p className="text-gray-600 mt-2">{org.description || 'No description'}</p>
              </div>
              <Link href={`/orgs/${org.id}/edit`}>
                <Button>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Organization
                </Button>
              </Link>
            </div>
          </div>

          {/* Organization Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Slug</p>
                  <p className="text-lg">{org.slug}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
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
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Created</p>
                  <p className="text-lg">{new Date(org.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Updated</p>
                  <p className="text-lg">{new Date(org.updatedAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Members</p>
                  <p className="text-lg">{members.length}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Modules Enabled</p>
                  <p className="text-lg">0</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Members List */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members
              </CardTitle>
              <CardDescription>Organization members and their roles</CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No members found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.user?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>{member.user?.email || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge>{member.role}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Modules Enabled */}
          <ModuleEnablement orgId={orgId} />
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
