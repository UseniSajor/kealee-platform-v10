'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewUserPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
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

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email address'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }

    if (formData.phone && formData.phone.trim()) {
      // Basic phone validation (allows various formats)
      const phoneRegex = /^[\d\s\-\+\(\)]+$/
      if (!phoneRegex.test(formData.phone)) {
        errors.phone = 'Invalid phone number format'
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

    setLoading(true)

    try {
      const data = await api.signup({
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
      })

      // Redirect to the new user's detail page
      router.push(`/users/${data.user.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6 max-w-2xl">
          <div className="mb-6">
            <Link href="/users">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Create New User</h1>
            <p className="text-gray-600 mt-2">
              Create a new user account in the system
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Details</CardTitle>
              <CardDescription>
                Enter the information for the new user account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    disabled={loading}
                    required
                    className={fieldErrors.name ? 'border-red-500' : ''}
                  />
                  {fieldErrors.name && (
                    <p className="text-sm text-red-600">{fieldErrors.name}</p>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    disabled={loading}
                    required
                    className={fieldErrors.email ? 'border-red-500' : ''}
                  />
                  {fieldErrors.email && (
                    <p className="text-sm text-red-600">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    disabled={loading}
                    required
                    className={fieldErrors.password ? 'border-red-500' : ''}
                  />
                  {fieldErrors.password && (
                    <p className="text-sm text-red-600">{fieldErrors.password}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    Password must be at least 8 characters long
                  </p>
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    disabled={loading}
                    required
                    className={fieldErrors.confirmPassword ? 'border-red-500' : ''}
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                  )}
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    disabled={loading}
                    className={fieldErrors.phone ? 'border-red-500' : ''}
                  />
                  {fieldErrors.phone && (
                    <p className="text-sm text-red-600">{fieldErrors.phone}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    Optional phone number for the user
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
                  <Link href="/users">
                    <Button type="button" variant="outline" disabled={loading}>
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create User'}
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
