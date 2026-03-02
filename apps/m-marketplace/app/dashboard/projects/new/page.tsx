'use client'

import { useState } from 'react'
import { useProfile } from '@kealee/auth/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const categories = [
  { value: 'KITCHEN', label: 'Kitchen Remodel' },
  { value: 'BATHROOM', label: 'Bathroom Remodel' },
  { value: 'ADDITION', label: 'Home Addition' },
  { value: 'NEW_CONSTRUCTION', label: 'New Construction' },
  { value: 'RENOVATION', label: 'General Renovation' },
  { value: 'EXTERIOR', label: 'Exterior Work' },
  { value: 'OTHER', label: 'Other' },
]

const designTiers = [
  {
    value: 'BASIC',
    label: 'Basic',
    price: '$199',
    description: '2 concept options, basic floor plan, material suggestions',
  },
  {
    value: 'STANDARD',
    label: 'Standard',
    price: '$499',
    description: '3 concept options, detailed floor plans, 3D renderings, cost estimate',
    recommended: true,
  },
  {
    value: 'PREMIUM',
    label: 'Premium',
    price: '$999',
    description: '5 concept options, full architectural drawings, 3D walkthrough, permit-ready docs',
  },
]

export default function NewProjectPage() {
  const { profile, loading: authLoading } = useProfile()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    squareFootage: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    designPackageTier: 'STANDARD',
  })

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-sky-600" size={32} />
      </div>
    )
  }

  if (!profile) {
    router.push('/auth/login?redirect=/dashboard/projects/new')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.name.trim() || form.name.length < 3) {
      setError('Project name must be at least 3 characters.')
      return
    }
    if (!form.category) {
      setError('Please select a project category.')
      return
    }
    if (!form.description.trim() || form.description.length < 20) {
      setError('Description must be at least 20 characters.')
      return
    }

    setSubmitting(true)

    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim(),
        designPackageTier: form.designPackageTier,
      }

      if (form.squareFootage) payload.squareFootage = parseInt(form.squareFootage, 10)
      if (form.address) payload.address = form.address.trim()
      if (form.city) payload.city = form.city.trim()
      if (form.state) payload.state = form.state.trim().toUpperCase()
      if (form.zipCode) payload.zipCode = form.zipCode.trim()

      const res = await fetch(`${API_URL}/precon/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${profile.access_token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || data.message || 'Failed to create project')
      }

      const data = await res.json()
      router.push(`/dashboard/projects/${data.precon.id}`)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition"
      >
        <ArrowLeft size={16} /> Back to projects
      </Link>

      <div>
        <h1 className="text-2xl font-black text-gray-900">Start a New Project</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tell us about your construction project. We&apos;ll generate AI design concepts and connect you with verified contractors.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Name */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Project Details</h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Project Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g., Kitchen Renovation - Main Street"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-sm transition"
              required
              minLength={3}
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Category *
            </label>
            <select
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-sm transition bg-white"
              required
            >
              <option value="">Select a category...</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Description *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe your project — what you want done, any specific requirements, preferred style..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-sm transition resize-none"
              rows={4}
              required
              minLength={20}
              maxLength={5000}
            />
            <p className="text-xs text-gray-400 mt-1">{form.description.length}/5000</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Approximate Square Footage
            </label>
            <input
              type="number"
              value={form.squareFootage}
              onChange={(e) => updateField('squareFootage', e.target.value)}
              placeholder="e.g., 500"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-sm transition"
              min={50}
              max={100000}
            />
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Location</h2>
          <p className="text-sm text-gray-500 -mt-3">
            Optional — helps us match local contractors and check permit requirements.
          </p>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Street Address
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="123 Main Street"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-sm transition"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-sm transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">State</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => updateField('state', e.target.value)}
                placeholder="MD"
                maxLength={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-sm transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">ZIP</label>
              <input
                type="text"
                value={form.zipCode}
                onChange={(e) => updateField('zipCode', e.target.value)}
                placeholder="20850"
                maxLength={10}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none text-sm transition"
              />
            </div>
          </div>
        </div>

        {/* Design Package Tier */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Design Package</h2>
          <p className="text-sm text-gray-500 -mt-3">
            Choose the level of design detail for your AI-generated concepts.
          </p>

          <div className="space-y-3">
            {designTiers.map((tier) => (
              <label
                key={tier.value}
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${
                  form.designPackageTier === tier.value
                    ? 'border-sky-500 bg-sky-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="designPackageTier"
                  value={tier.value}
                  checked={form.designPackageTier === tier.value}
                  onChange={(e) => updateField('designPackageTier', e.target.value)}
                  className="mt-1 accent-sky-600"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{tier.label}</span>
                    <span className="text-sky-600 font-bold">{tier.price}</span>
                    {tier.recommended && (
                      <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-xs font-semibold rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{tier.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white rounded-xl font-bold text-base transition"
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Creating Project...
            </>
          ) : (
            <>
              Create Project <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
