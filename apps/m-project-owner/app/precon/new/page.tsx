'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CATEGORIES = [
  { value: 'KITCHEN', label: 'Kitchen Remodel', icon: '🍳', description: 'Complete kitchen renovation' },
  { value: 'BATHROOM', label: 'Bathroom Remodel', icon: '🚿', description: 'Full bathroom upgrade' },
  { value: 'ADDITION', label: 'Room Addition', icon: '🏠', description: 'Add new living space' },
  { value: 'NEW_CONSTRUCTION', label: 'New Construction', icon: '🏗️', description: 'Build from ground up' },
  { value: 'RENOVATION', label: 'Whole Home Renovation', icon: '🔨', description: 'Major interior renovation' },
  { value: 'EXTERIOR', label: 'Exterior Work', icon: '🏡', description: 'Roofing, siding, landscaping' },
  { value: 'OTHER', label: 'Other', icon: '📋', description: 'Custom project type' },
]

const DESIGN_PACKAGES = [
  {
    tier: 'BASIC',
    price: 199,
    name: 'Basic',
    description: 'Essential design concepts',
    features: ['2 concept options', 'Basic floor plan', 'Material suggestions', 'Email support'],
    recommended: false,
  },
  {
    tier: 'STANDARD',
    price: 499,
    name: 'Standard',
    description: 'Detailed professional designs',
    features: [
      '3 concept options',
      'Detailed floor plans',
      '3D renderings',
      'Material specifications',
      'Cost estimate',
      'Phone & email support',
    ],
    recommended: true,
  },
  {
    tier: 'PREMIUM',
    price: 999,
    name: 'Premium',
    description: 'Full architectural package',
    features: [
      '5 concept options',
      'Full architectural drawings',
      'Interactive 3D walkthrough',
      'Complete material specs',
      'Detailed cost breakdown',
      'Permit-ready documents',
      'Priority support',
    ],
    recommended: false,
  },
]

const COMPLEXITY_OPTIONS = [
  { value: 'BASIC', label: 'Basic', description: 'Simple, straightforward project' },
  { value: 'STANDARD', label: 'Standard', description: 'Average complexity' },
  { value: 'PREMIUM', label: 'Premium', description: 'High-end finishes and features' },
  { value: 'LUXURY', label: 'Luxury', description: 'Top-tier custom work' },
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function NewPreConPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    squareFootage: '',
    rooms: '',
    floors: '1',
    features: [] as string[],
    complexity: 'STANDARD',
    designPackageTier: 'STANDARD',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategorySelect = (category: string) => {
    setFormData((prev) => ({ ...prev, category }))
  }

  const handlePackageSelect = (tier: string) => {
    setFormData((prev) => ({ ...prev, designPackageTier: tier }))
  }

  const handleFeatureToggle = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }))
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.category !== ''
      case 2:
        return formData.name.length >= 3 && formData.description.length >= 20
      case 3:
        return formData.city && formData.state
      case 4:
        return true // Design package selection
      default:
        return true
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      // In production, this would call the API
      // const response = await fetch('/api/precon/projects', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...formData,
      //     squareFootage: formData.squareFootage ? parseInt(formData.squareFootage) : undefined,
      //     rooms: formData.rooms ? parseInt(formData.rooms) : undefined,
      //     floors: formData.floors ? parseInt(formData.floors) : undefined,
      //   }),
      // })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Redirect to payment or project page
      router.push('/precon?created=true')
    } catch (err) {
      setError('Failed to create project. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/precon" className="text-gray-500 hover:text-gray-700">
                ← Back
              </Link>
              <h1 className="text-lg font-semibold text-gray-900">New Pre-Construction Project</h1>
            </div>
            <div className="text-sm text-gray-500">Step {step} of 4</div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex-1 flex items-center">
                <div
                  className={`h-2 flex-1 rounded-full ${
                    s <= step ? 'bg-indigo-500' : 'bg-gray-200'
                  }`}
                />
                {s < 4 && <div className="w-2" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: Category */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">What type of project?</h2>
            <p className="text-gray-600 mb-6">Select the category that best describes your project.</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => handleCategorySelect(cat.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    formData.category === cat.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <h3 className="font-semibold text-gray-900">{cat.label}</h3>
                  <p className="text-sm text-gray-500 mt-1">{cat.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Project Details */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about your project</h2>
            <p className="text-gray-600 mb-6">Help us understand the scope and vision for your project.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Modern Kitchen Renovation"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description * <span className="text-gray-400">(min 20 characters)</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe your project goals, must-haves, and any specific requirements..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">{formData.description.length} / 20 characters</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Square Footage
                  </label>
                  <input
                    type="number"
                    name="squareFootage"
                    value={formData.squareFootage}
                    onChange={handleChange}
                    placeholder="e.g., 200"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rooms
                  </label>
                  <input
                    type="number"
                    name="rooms"
                    value={formData.rooms}
                    onChange={handleChange}
                    placeholder="e.g., 1"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Floors
                  </label>
                  <select
                    name="floors"
                    value={formData.floors}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complexity Level
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {COMPLEXITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, complexity: opt.value }))}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        formData.complexity === opt.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium text-sm text-gray-900">{opt.label}</span>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Location</h2>
            <p className="text-gray-600 mb-6">Where is the project located?</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main Street"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Los Angeles"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="CA"
                    maxLength={2}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="90210"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Design Package Selection */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Design Package</h2>
            <p className="text-gray-600 mb-6">
              Select the design package that fits your needs. This one-time fee covers professional design concepts for your project.
            </p>

            <div className="space-y-4">
              {DESIGN_PACKAGES.map((pkg) => (
                <button
                  key={pkg.tier}
                  onClick={() => handlePackageSelect(pkg.tier)}
                  className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                    formData.designPackageTier === pkg.tier
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                        {pkg.recommended && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500 text-white rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(pkg.price)}</p>
                      <p className="text-xs text-gray-500">one-time</p>
                    </div>
                  </div>

                  <ul className="mt-4 grid grid-cols-2 gap-2">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-green-500">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> The platform commission (3.5% of contract value) is paid by the contractor when the contract is signed, not by you.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 text-gray-700 font-medium hover:bg-gray-100 rounded-lg"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className={`px-6 py-3 font-medium rounded-lg transition-colors ${
                canProceed()
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`px-8 py-3 font-medium rounded-lg transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </span>
              ) : (
                `Create Project & Pay ${formatCurrency(DESIGN_PACKAGES.find(p => p.tier === formData.designPackageTier)?.price || 499)}`
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
