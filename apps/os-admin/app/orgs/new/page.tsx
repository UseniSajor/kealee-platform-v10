'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function NewOrgPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logo: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

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

    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }

    if (!formData.slug.trim()) {
      errors.slug = 'Slug is required'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens'
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

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
  }

  const handleNameChange = (value: string) => {
    handleChange('name', value)
    // Auto-generate slug if slug is empty or matches the previous name
    if (!formData.slug || formData.slug === generateSlug(formData.name)) {
      handleChange('slug', generateSlug(value))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const data = await api.createOrg({
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || undefined,
        logo: formData.logo.trim() || undefined,
      })

      // Redirect to the new organization's detail page
      router.push(`/orgs/${data.org.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6 max-w-2xl">
          <div className="mb-6">
            <Link href="/orgs">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Organizations
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Create New Organization</h1>
            <p className="text-gray-600 mt-2">
              Create a new organization in the system
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Enter the information for the new organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Organization Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Acme Corporation"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    disabled={loading}
                    required
                    className={fieldErrors.name ? 'border-red-500' : ''}
                  />
                  {fieldErrors.name && (
                    <p className="text-sm text-red-600">{fieldErrors.name}</p>
                  )}
                </div>

                {/* Slug Field */}
                <div className="space-y-2">
                  <Label htmlFor="slug">
                    Slug <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="slug"
                    type="text"
                    placeholder="acme-corporation"
                    value={formData.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    disabled={loading}
                    required
                    className={fieldErrors.slug ? 'border-red-500' : ''}
                  />
                  {fieldErrors.slug && (
                    <p className="text-sm text-red-600">{fieldErrors.slug}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    URL-friendly identifier (lowercase letters, numbers, and hyphens only)
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
                    disabled={loading}
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
                    disabled={loading}
                    className={fieldErrors.logo ? 'border-red-500' : ''}
                  />
                  {fieldErrors.logo && (
                    <p className="text-sm text-red-600">{fieldErrors.logo}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    Optional URL to the organization's logo image
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
                  <Link href="/orgs">
                    <Button type="button" variant="outline" disabled={loading}>
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Organization'}
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
