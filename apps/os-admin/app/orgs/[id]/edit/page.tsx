'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Org {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  status: string
}

export default function EditOrgPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.id as string
  const [org, setOrg] = useState<Org | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (orgId) {
      fetchOrg()
    }
  }, [orgId])

  async function fetchOrg() {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getOrg(orgId)
      const orgData = data.org
      setOrg(orgData)
      setFormData({
        name: orgData.name || '',
        description: orgData.description || '',
        logo: orgData.logo || '',
      })
    } catch (err: any) {
      setError(err.message || 'Failed to load organization')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    setError(null)
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (formData.name && formData.name.trim().length === 0) {
      errors.name = 'Name cannot be empty'
    }

    if (formData.logo && formData.logo.trim()) {
      try {
        new URL(formData.logo)
      } catch {
        errors.logo = 'Invalid logo URL'
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setSaving(true)

    try {
      // Only send fields that have changed
      const updateData: { name?: string; description?: string; logo?: string } = {}
      
      if (formData.name.trim() !== (org?.name || '')) {
        updateData.name = formData.name.trim()
      }
      
      if (formData.description.trim() !== (org?.description || '')) {
        updateData.description = formData.description.trim() || undefined
      }
      
      if (formData.logo.trim() !== (org?.logo || '')) {
        updateData.logo = formData.logo.trim() || undefined
      }

      // Only make API call if there are changes
      if (Object.keys(updateData).length > 0) {
        await api.updateOrg(orgId, updateData)
      }

      // Redirect to the organization's detail page
      router.push(`/orgs/${orgId}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to update organization')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="container mx-auto p-6 max-w-2xl">
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

  if (error && !org) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="container mx-auto p-6 max-w-2xl">
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error}
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

  if (!org) {
    return null
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6 max-w-2xl">
          <div className="mb-6">
            <Link href={`/orgs/${orgId}`}>
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Organization
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Edit Organization</h1>
            <p className="text-gray-600 mt-2">
              Update organization information
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Update the information for this organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Acme Corporation"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    disabled={saving}
                    className={fieldErrors.name ? 'border-red-500' : ''}
                  />
                  {fieldErrors.name && (
                    <p className="text-sm text-red-600">{fieldErrors.name}</p>
                  )}
                </div>

                {/* Slug Field (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    type="text"
                    value={org.slug}
                    disabled
                    className="bg-gray-50 cursor-not-allowed"
                  />
                  <p className="text-sm text-gray-500">
                    Slug cannot be changed after creation
                  </p>
                </div>

                {/* Description Field */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="A brief description of the organization..."
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    disabled={saving}
                    rows={4}
                  />
                </div>

                {/* Logo URL Field */}
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input
                    id="logo"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={formData.logo}
                    onChange={(e) => handleChange('logo', e.target.value)}
                    disabled={saving}
                    className={fieldErrors.logo ? 'border-red-500' : ''}
                  />
                  {fieldErrors.logo && (
                    <p className="text-sm text-red-600">{fieldErrors.logo}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    URL to the organization's logo image
                  </p>
                </div>

                {/* Status Field (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    type="text"
                    value={org.status}
                    disabled
                    className="bg-gray-50 cursor-not-allowed"
                  />
                  <p className="text-sm text-gray-500">
                    Status cannot be changed from this page
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-4 justify-end">
                  <Link href={`/orgs/${orgId}`}>
                    <Button type="button" variant="outline" disabled={saving}>
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
