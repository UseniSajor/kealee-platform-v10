'use client'

/**
 * Project Creation Form Component
 * Allows clients (homeowners, developers, property managers) to post new projects
 * Based on Kealee_User_Responsibilities_Guide.md Section 2-4
 */

import { useState } from 'react'

interface ProjectFormData {
  propertyAddress: string
  propertyType: 'SINGLE_FAMILY' | 'CONDO' | 'TOWNHOUSE' | 'MULTI_FAMILY'
  projectDescription: string
  projectType: string
  budgetMin: number
  budgetMax: number
  desiredStartDate?: string
  desiredTimeline?: string
  specialRequirements?: string
}

type FieldErrors = Partial<Record<keyof ProjectFormData, string>>

export function ProjectCreationForm() {
  const [formData, setFormData] = useState<ProjectFormData>({
    propertyAddress: '',
    propertyType: 'SINGLE_FAMILY',
    projectDescription: '',
    projectType: '',
    budgetMin: 5000,
    budgetMax: 10000,
    desiredStartDate: '',
    desiredTimeline: '',
    specialRequirements: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [success, setSuccess] = useState(false)

  const projectTypes = [
    'Kitchen Remodel',
    'Bathroom Remodel',
    'Room Addition',
    'Roof Replacement',
    'Siding',
    'Windows & Doors',
    'Flooring',
    'Painting',
    'Deck/Patio',
    'Landscaping',
    'Other',
  ]

  const timelineOptions = [
    { value: '2_weeks', label: '2 weeks' },
    { value: '1_month', label: '1 month' },
    { value: '2_3_months', label: '2-3 months' },
    { value: '3_6_months', label: '3-6 months' },
    { value: '6_plus_months', label: '6+ months' },
  ]

  /** Validate all fields and return a map of errors (empty = valid) */
  function validate(): FieldErrors {
    const errs: FieldErrors = {}
    if (!formData.propertyAddress.trim() || formData.propertyAddress.trim().length < 10) {
      errs.propertyAddress = 'Please enter a full street address (at least 10 characters)'
    }
    if (!formData.projectType) {
      errs.projectType = 'Please select a project type'
    }
    if (formData.projectDescription.trim().length < 50) {
      errs.projectDescription = 'Description must be at least 50 characters'
    }
    if (formData.budgetMin < 1000) {
      errs.budgetMin = 'Minimum budget must be at least $1,000'
    }
    if (formData.budgetMax <= formData.budgetMin) {
      errs.budgetMax = 'Maximum budget must be greater than minimum budget'
    }
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) {
      setError('Please fix the highlighted fields before submitting.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/client/owner/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyAddress: formData.propertyAddress,
          propertyType: formData.propertyType,
          projectDescription: formData.projectDescription,
          projectType: formData.projectType,
          budgetRange: {
            min: formData.budgetMin,
            max: formData.budgetMax,
          },
          desiredStartDate: formData.desiredStartDate || undefined,
          desiredTimeline: formData.desiredTimeline || undefined,
          specialRequirements: formData.specialRequirements || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create project')
      }

      const result = await response.json()
      setSuccess(true)

      // Redirect to project page after 2 seconds
      setTimeout(() => {
        window.location.href = `/owner/projects/${result.data.id}`
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Post a New Project</h1>
        <p className="text-gray-600 mb-8">
          Tell us about your project and we'll match you with qualified contractors
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Address */}
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="propertyAddress">
              Property Address *
            </label>
            <input
              id="propertyAddress"
              type="text"
              required
              minLength={10}
              aria-invalid={!!fieldErrors.propertyAddress}
              aria-describedby={fieldErrors.propertyAddress ? 'propertyAddress-error' : undefined}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${fieldErrors.propertyAddress ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="123 Main St, San Francisco, CA 94102"
              value={formData.propertyAddress}
              onChange={(e) => {
                setFormData({ ...formData, propertyAddress: e.target.value })
                if (fieldErrors.propertyAddress) setFieldErrors((prev) => ({ ...prev, propertyAddress: undefined }))
              }}
            />
            {fieldErrors.propertyAddress && (
              <p id="propertyAddress-error" className="text-sm text-red-600 mt-1" role="alert">
                {fieldErrors.propertyAddress}
              </p>
            )}
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="propertyType">
              Property Type *
            </label>
            <select
              id="propertyType"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={formData.propertyType}
              onChange={(e) => setFormData({ ...formData, propertyType: e.target.value as any })}
            >
              <option value="SINGLE_FAMILY">Single Family Home</option>
              <option value="CONDO">Condo</option>
              <option value="TOWNHOUSE">Townhouse</option>
              <option value="MULTI_FAMILY">Multi-Family</option>
            </select>
          </div>

          {/* Project Type */}
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="projectType">
              Project Type *
            </label>
            <select
              id="projectType"
              required
              aria-invalid={!!fieldErrors.projectType}
              aria-describedby={fieldErrors.projectType ? 'projectType-error' : undefined}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${fieldErrors.projectType ? 'border-red-500' : 'border-gray-300'}`}
              value={formData.projectType}
              onChange={(e) => {
                setFormData({ ...formData, projectType: e.target.value })
                if (fieldErrors.projectType) setFieldErrors((prev) => ({ ...prev, projectType: undefined }))
              }}
            >
              <option value="">Select project type</option>
              {projectTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {fieldErrors.projectType && (
              <p id="projectType-error" className="text-sm text-red-600 mt-1" role="alert">
                {fieldErrors.projectType}
              </p>
            )}
          </div>

          {/* Project Description */}
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="projectDescription">
              Project Description *
            </label>
            <textarea
              id="projectDescription"
              required
              minLength={50}
              maxLength={5000}
              rows={6}
              aria-invalid={!!fieldErrors.projectDescription}
              aria-describedby={[fieldErrors.projectDescription ? 'projectDescription-error' : '', 'projectDescription-hint'].filter(Boolean).join(' ')}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${fieldErrors.projectDescription ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Describe your project in detail... What work needs to be done? Any specific requirements?"
              value={formData.projectDescription}
              onChange={(e) => {
                setFormData({ ...formData, projectDescription: e.target.value })
                if (fieldErrors.projectDescription) setFieldErrors((prev) => ({ ...prev, projectDescription: undefined }))
              }}
            />
            <p id="projectDescription-hint" className="text-sm text-gray-500 mt-1">
              {formData.projectDescription.length} / 5000 characters (minimum 50)
            </p>
            {fieldErrors.projectDescription && (
              <p id="projectDescription-error" className="text-sm text-red-600 mt-1" role="alert">
                {fieldErrors.projectDescription}
              </p>
            )}
          </div>

          {/* Budget Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="budgetMin">
                Minimum Budget *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500" aria-hidden="true">$</span>
                <input
                  id="budgetMin"
                  type="number"
                  required
                  min={1000}
                  step={1000}
                  aria-invalid={!!fieldErrors.budgetMin}
                  aria-describedby={fieldErrors.budgetMin ? 'budgetMin-error' : undefined}
                  className={`w-full pl-8 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${fieldErrors.budgetMin ? 'border-red-500' : 'border-gray-300'}`}
                  value={formData.budgetMin}
                  onChange={(e) => {
                    setFormData({ ...formData, budgetMin: parseInt(e.target.value) })
                    if (fieldErrors.budgetMin) setFieldErrors((prev) => ({ ...prev, budgetMin: undefined }))
                  }}
                />
              </div>
              {fieldErrors.budgetMin && (
                <p id="budgetMin-error" className="text-sm text-red-600 mt-1" role="alert">
                  {fieldErrors.budgetMin}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="budgetMax">
                Maximum Budget *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500" aria-hidden="true">$</span>
                <input
                  id="budgetMax"
                  type="number"
                  required
                  min={formData.budgetMin}
                  step={1000}
                  aria-invalid={!!fieldErrors.budgetMax}
                  aria-describedby={fieldErrors.budgetMax ? 'budgetMax-error' : undefined}
                  className={`w-full pl-8 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${fieldErrors.budgetMax ? 'border-red-500' : 'border-gray-300'}`}
                  value={formData.budgetMax}
                  onChange={(e) => {
                    setFormData({ ...formData, budgetMax: parseInt(e.target.value) })
                    if (fieldErrors.budgetMax) setFieldErrors((prev) => ({ ...prev, budgetMax: undefined }))
                  }}
                />
              </div>
              {fieldErrors.budgetMax && (
                <p id="budgetMax-error" className="text-sm text-red-600 mt-1" role="alert">
                  {fieldErrors.budgetMax}
                </p>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="desiredStartDate">
                Desired Start Date
              </label>
              <input
                id="desiredStartDate"
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                value={formData.desiredStartDate}
                onChange={(e) => setFormData({ ...formData, desiredStartDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="desiredTimeline">
                Project Timeline
              </label>
              <select
                id="desiredTimeline"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                value={formData.desiredTimeline}
                onChange={(e) => setFormData({ ...formData, desiredTimeline: e.target.value })}
              >
                <option value="">Select timeline</option>
                {timelineOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Special Requirements */}
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="specialRequirements">
              Special Requirements
            </label>
            <textarea
              id="specialRequirements"
              maxLength={2000}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Any special requirements, preferences, or constraints..."
              value={formData.specialRequirements}
              onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
            />
          </div>

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
              ✓ Project created successfully! Matching contractors...
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800" role="alert">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={() => window.history.back()}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Project...' : 'Post Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
