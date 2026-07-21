'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Edit, Building2, Mail, Phone, Calendar } from 'lucide-react'
import Link from 'next/link'
import { RoleAssignment } from '@/components/users/role-assignment'

interface User {
  id: string
  email: string
  name: string
  phone?: string
  avatar?: string
  status: string
  createdAt: string
  updatedAt: string
}

interface UserOrg {
  id: string
  orgId: string
  roleKey: string
  joinedAt: string
  org?: {
    id: string
    name: string
    slug: string
  }
}

export default function UserDetailPage() {
  const params = useParams()
  const userId = params.id as string
  const [user, setUser] = useState<User | null>(null)
  const [orgs, setOrgs] = useState<UserOrg[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      fetchUserDetails()
    }
  }, [userId])

  async function fetchUserDetails() {
    try {
      setLoading(true)
      setError(null)

      // Fetch user details
      const userData = await api.getUser(userId)
      setUser(userData.user)

      // Fetch user organizations (if API endpoint exists)
      try {
        const orgsData = await api.getUserOrgs(userId)
        setOrgs(orgsData.orgs || [])
      } catch {
        // Endpoint might not exist yet, set empty array
        setOrgs([])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load user')
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
                <p className="mt-4 text-gray-600">Loading user...</p>
              </div>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (error || !user) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="container mx-auto p-6">
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error || 'User not found'}
            </div>
            <Link href="/users">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
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
            <Link href="/users">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
              </Button>
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{user.name}</h1>
                <p className="text-gray-600 mt-2">{user.email}</p>
              </div>
              <Link href={`/users/${user.id}/edit`}>
                <Button>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit User
                </Button>
              </Link>
            </div>
          </div>

          {/* User Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email</p>
                    <p className="text-lg">{user.email}</p>
                  </div>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Phone</p>
                      <p className="text-lg">{user.phone}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <Badge
                    variant={
                      user.status === 'ACTIVE'
                        ? 'default'
                        : user.status === 'SUSPENDED'
                        ? 'secondary'
                        : 'destructive'
                    }
                    className="mt-1"
                  >
                    {user.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Created</p>
                    <p className="text-lg">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Last Updated</p>
                    <p className="text-lg">{new Date(user.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">User ID</p>
                  <p className="text-sm font-mono text-gray-600">{user.id}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Role Assignments */}
          <RoleAssignment
            userId={userId}
            userOrgs={orgs}
            onUpdate={fetchUserDetails}
          />
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
