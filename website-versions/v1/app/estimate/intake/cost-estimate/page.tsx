'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { SERVICE_PRICING, formatPrice } from '@kealee/shared/pricing'

export default function CostEstimateIntakePage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'review'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    projectName: '',
    projectType: '',
    projectAddress: '',
    squareFootage: '',
    scopeDescription: '',
    clientName: '',
    contactEmail: '',
    contactPhone: '',
    hasConstructionDocs: false,
    docDescription: '',
  })

  const pricing = SERVICE_PRICING.estimation.cost_estimate
  const tierCode = 'cost_estimate'

  const projectTypes = [
    'Residential Remodel',
    'Kitchen Remodel',
    'Bathroom Renovation',
    'Exterior Work',
    'Structural Repair',
    'Mechanical/Electrical/Plumbing',
    'Commercial Buildout',
    'Other',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (step === 'form') {
      // Validate required fields
      if (!formData.projectName || !formData.projectType || !formData.clientName || !formData.contactEmail) {
        setError('Please fill in all required fields')
        return
      }
      setStep('review')
      return
    }

    // Step 2: Submit intake
    setLoading(true)
    try {
      const intakeRes = await fetch('/api/v1/estimation/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: {
            scopeDetail: formData.hasConstructionDocs ? 'construction_documents' : 'sketch',
            projectStage: 'design_development',
            projectScope: 'interior_remodel',
            estimatedBudget: undefined,
          },
          contact: {
            name: formData.clientName,
            email: formData.contactEmail,
            phone: formData.contactPhone,
          },
          description: formData.scopeDescription,
          hasDesignDrawings: formData.hasConstructionDocs,
          tierPreference: tierCode,
        }),
      })

      if (!intakeRes.ok) {
        const errorData = await intakeRes.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to create estimation intake')
      }

      const { intakeId } = await intakeRes.json()

      // Store email in localStorage for checkout
      localStorage.setItem('estimationEmail', formData.contactEmail)

      // Redirect to checkout
      const price = pricing.amount // Already in cents
      router.push(`/estimate/checkout?intakeId=${intakeId}&tier=${tierCode}&price=${price}`)
    } catch (err) {
      setError((err as Error).message || 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Cost Estimate</h1>
          </div>
          <p className="text-lg text-slate-600">
            Trade-by-trade cost breakdown validated against RSMeans data
          </p>
          <p className="text-xl font-bold text-blue-600 mt-2">{formatPrice(pricing.amount, 'display')}</p>
        </div>

        {/* Progress */}
        <div className="mb-8 flex justify-center items-center gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step === 'form' ? 'bg-blue-600 text-white' : 'bg-blue-200 text-blue-700'
            }`}
          >
            1
          </div>
          <div className="w-12 h-1 bg-slate-300" />
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step === 'review' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
            }`}
          >
            2
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Project Information */}
            {step === 'form' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Kitchen Remodel - 123 Main St"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Project Type *
                  </label>
                  <select
                    value={formData.projectType}
                    onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a project type</option>
                    {projectTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Project Address
                  </label>
                  <input
                    type="text"
                    value={formData.projectAddress}
                    onChange={(e) => setFormData({ ...formData, projectAddress: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Main Street, Washington DC 20001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Square Footage
                  </label>
                  <input
                    type="number"
                    value={formData.squareFootage}
                    onChange={(e) => setFormData({ ...formData, squareFootage: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Scope of Work *
                  </label>
                  <textarea
                    value={formData.scopeDescription}
                    onChange={(e) => setFormData({ ...formData, scopeDescription: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Describe the work you need estimated..."
                    required
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.hasConstructionDocs}
                    onChange={(e) => setFormData({ ...formData, hasConstructionDocs: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label className="text-sm text-slate-700">I have construction documents available</label>
                </div>

                {formData.hasConstructionDocs && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Document Details
                    </label>
                    <textarea
                      value={formData.docDescription}
                      onChange={(e) => setFormData({ ...formData, docDescription: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="What documents do you have? (plans, drawings, specs, etc.)"
                    />
                  </div>
                )}

                {/* Contact Information */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Contact Information</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={formData.clientName}
                        onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="(202) 555-0100"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Review */}
            {step === 'review' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-900">Review Your Order</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Please review the information below before proceeding to payment
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y">
                  <div>
                    <p className="text-xs text-slate-600">Project</p>
                    <p className="font-semibold text-slate-900">{formData.projectName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Type</p>
                    <p className="font-semibold text-slate-900">{formData.projectType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Contact</p>
                    <p className="font-semibold text-slate-900">{formData.clientName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Email</p>
                    <p className="font-semibold text-slate-900">{formData.contactEmail}</p>
                  </div>
                </div>

                <div className="py-4 border-b">
                  <p className="text-xs text-slate-600 mb-2">Scope of Work</p>
                  <p className="text-slate-700">{formData.scopeDescription}</p>
                </div>

                <div className="bg-slate-100 rounded-lg p-4">
                  <p className="text-sm text-slate-600 mb-2">Estimate Price</p>
                  <p className="text-3xl font-bold text-blue-600">{formatPrice(pricing.amount, 'display')}</p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-6">
              {step === 'review' && (
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="flex-1 px-6 py-3 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? 'Processing...' : step === 'form' ? 'Continue to Review' : 'Proceed to Payment'}
              </button>
            </div>
          </form>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-slate-900 mb-4">What's Included</h3>
          <ul className="space-y-3 text-sm text-slate-700">
            {pricing.features.map((feature, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-blue-600 font-bold">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
