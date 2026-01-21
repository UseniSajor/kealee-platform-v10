'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Shield, Key } from 'lucide-react'
import { toast } from 'sonner'

interface Role {
  id: string
  key: string
  name: string
  description?: string
  createdAt: string
}

interface Permission {
  id: string
  key: string
  name: string
  description?: string
  createdAt: string
}

export default function RBACPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles')

  useEffect(() => {
    fetchData()
  }, [activeTab])

  async function fetchData() {
    try {
      setLoading(true)
      if (activeTab === 'roles') {
        const data = await api.getRoles()
        setRoles(data.roles || [])
      } else {
        const data = await api.getPermissions()
        setPermissions(data.permissions || [])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">RBAC Management</h1>
              <p className="text-gray-600 mt-2">Manage roles and permissions</p>
            </div>
            <Button
              onClick={async () => {
                if (activeTab === 'roles') {
                  const name = prompt('Enter role name:')
                  const key = prompt('Enter role key (e.g., custom_role):')
                  if (name && key) {
                    try {
                      await api.createRole({ key, name })
                      toast.success('Role created successfully')
                      fetchData()
                    } catch (err: any) {
                      toast.error('Failed to create role: ' + err.message)
                    }
                  }
                } else {
                  const name = prompt('Enter permission name:')
                  const key = prompt('Enter permission key (e.g., custom_permission):')
                  if (name && key) {
                    try {
                      await api.createPermission({ key, name })
                      toast.success('Permission created successfully')
                      fetchData()
                    } catch (err: any) {
                      toast.error('Failed to create permission: ' + err.message)
                    }
                  }
                }
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {activeTab === 'roles' ? 'New Role' : 'New Permission'}
            </Button>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'roles'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className="inline mr-2 h-4 w-4" />
              Roles
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'permissions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Key className="inline mr-2 h-4 w-4" />
              Permissions
            </button>
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
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            </div>
          ) : activeTab === 'roles' ? (
            <Card>
              <CardHeader>
                <CardTitle>Roles</CardTitle>
                <CardDescription>System roles and their configurations</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No roles found
                        </TableCell>
                      </TableRow>
                    ) : (
                      roles.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell className="font-medium">
                            <Badge variant="outline">{role.key}</Badge>
                          </TableCell>
                          <TableCell>{role.name}</TableCell>
                          <TableCell className="text-gray-600">
                            {role.description || '—'}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {new Date(role.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={async () => {
                                try {
                                  const permissions = await api.getRolePermissions(role.key)
                                  // TODO: Open modal/dialog to show permissions
                                  alert(`Permissions for ${role.name}: ${permissions.permissions?.map((p: any) => p.name).join(', ') || 'None'}`)
                                } catch (err: any) {
                                  alert('Failed to load permissions: ' + err.message)
                                }
                              }}
                            >
                              View Permissions
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Permissions</CardTitle>
                <CardDescription>Available permissions in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                          No permissions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      permissions.map((permission) => (
                        <TableRow key={permission.id}>
                          <TableCell className="font-medium">
                            <Badge variant="outline">{permission.key}</Badge>
                          </TableCell>
                          <TableCell>{permission.name}</TableCell>
                          <TableCell className="text-gray-600">
                            {permission.description || '—'}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {new Date(permission.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
