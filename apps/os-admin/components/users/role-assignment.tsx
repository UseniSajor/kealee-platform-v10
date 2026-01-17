'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Edit, Building2 } from 'lucide-react'

interface RoleAssignmentProps {
  userId: string
  userOrgs: UserOrg[]
  onUpdate: () => void
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

interface Role {
  id: string
  key: string
  name: string
  description?: string
}

export function RoleAssignment({ userId, userOrgs, onUpdate }: RoleAssignmentProps) {
  const [orgs, setOrgs] = useState<any[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    orgId: '',
    roleKey: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const [orgsData, rolesData] = await Promise.all([
        api.getOrgs({ limit: 1000 }).catch(() => ({ orgs: [] })),
        api.getRoles().catch(() => ({ roles: [] })),
      ])
      setOrgs(orgsData.orgs || [])
      setRoles(rolesData.roles || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!formData.orgId || !formData.roleKey) {
      setError('Please select both organization and role')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await api.addOrgMember(formData.orgId, {
        userId,
        roleKey: formData.roleKey,
      })
      setShowAddForm(false)
      setFormData({ orgId: '', roleKey: '' })
      onUpdate()
    } catch (err: any) {
      setError(err.message || 'Failed to add member')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (orgId: string, roleKey: string) => {
    try {
      setLoading(true)
      setError(null)
      await api.updateOrgMemberRole(orgId, userId, roleKey)
      setEditingOrgId(null)
      onUpdate()
    } catch (err: any) {
      setError(err.message || 'Failed to update role')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (orgId: string) => {
    if (!confirm('Are you sure you want to remove this user from the organization?')) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      await api.removeOrgMember(orgId, userId)
      onUpdate()
    } catch (err: any) {
      setError(err.message || 'Failed to remove member')
    } finally {
      setLoading(false)
    }
  }

  // Get available orgs (not already assigned)
  const availableOrgs = orgs.filter(
    (org) => !userOrgs.some((uo) => uo.orgId === org.id)
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Role Assignments
            </CardTitle>
            <CardDescription>
              Manage user roles across organizations
            </CardDescription>
          </div>
          {!showAddForm && (
            <Button
              onClick={() => setShowAddForm(true)}
              size="sm"
              disabled={availableOrgs.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add to Organization
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Add Member Form */}
        {showAddForm && (
          <div className="mb-6 rounded-lg border p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Add to Organization</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false)
                  setFormData({ orgId: '', roleKey: '' })
                  setError(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Organization</Label>
                <Select
                  value={formData.orgId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, orgId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOrgs.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={formData.roleKey}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, roleKey: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.key} value={role.key}>
                        {role.name} ({role.key})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false)
                  setFormData({ orgId: '', roleKey: '' })
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddMember} disabled={loading}>
                {loading ? 'Adding...' : 'Add Member'}
              </Button>
            </div>
          </div>
        )}

        {/* Current Assignments */}
        {userOrgs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No organization assignments</p>
            <p className="text-sm mt-2">
              Click "Add to Organization" to assign this user to an organization
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {userOrgs.map((userOrg) => {
              const isEditing = editingOrgId === userOrg.orgId
              const currentRole = roles.find((r) => r.key === userOrg.roleKey)

              return (
                <div
                  key={userOrg.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">
                          {userOrg.org?.name || 'Unknown Organization'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Joined {new Date(userOrg.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isEditing ? (
                      <Select
                        value={userOrg.roleKey}
                        onValueChange={(newRoleKey) =>
                          handleUpdateRole(userOrg.orgId, newRoleKey)
                        }
                        disabled={loading}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.key} value={role.key}>
                              {role.name} ({role.key})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="text-sm">
                        {currentRole?.name || userOrg.roleKey}
                      </Badge>
                    )}
                    {!isEditing && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingOrgId(userOrg.orgId)}
                          disabled={loading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(userOrg.orgId)}
                          disabled={loading}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
