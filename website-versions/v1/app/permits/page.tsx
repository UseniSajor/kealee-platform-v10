'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, MapPin, DollarSign, Shield, Clock, Zap } from 'lucide-react'
import { SERVICE_PRICING, PERMIT_SUBMISSION_MULTIPLIERS, formatPrice } from '@kealee/shared/pricing'

export default function PermitsPage() {
  const router = useRouter()
  const [step, setStep] = useState<'select' | 'intake' | 'checkout'>('select')
  const [formData, setFormData] = useState({
    jurisdictionCode: '',
    projectType: '',
    projectAddress: '',
    clientName: '',
    contactEmail: '',
    contactPhone: '',
    budgetRange: '',
    timeline: '',
    permitTypes: [] as string[],
    submissionMethod: 'SELF' as 'SELF' | 'ASSISTED' | 'KEALEE_MANAGED',
    estimatedValuation: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const jurisdictions = [
    { code: 'dc_dob', name: 'Washington DC - Department of Buildings', abbr: 'DC' },
    { code: 'pg_county_dps', name: 'Prince George\'s County, MD - DPS', abbr: 'PG' },
    { code: 'montgomery_county_deid', name: 'Montgomery County, MD - DEID', abbr: 'MoCo' },
    { code: 'arlington_county_pzm', name: 'Arlington County, VA - PZM', abbr: 'ARL' },
    { code: 'alexandria_dna', name: 'Alexandria, VA - DNA', abbr: 'ALX' },
    { code: 'fairfax_county_zea', name: 'Fairfax County, VA - ZEA', abbr: 'FFX' },
    { code: 'baltimore_dop', name: 'Baltimore City, MD - DOP', abbr: 'BAL' },
  ]

  // Build permit tiers from shared pricing configuration
  const buildPermitTiers = () => {
    const pricing = SERVICE_PRICING.permits
    return [
      {
        code: 'document_assembly',
        name: pricing.document_assembly.name,
        price: Math.round(pricing.document_assembly.amount / 100),
        description: pricing.document_assembly.description,
        features: pricing.document_assembly.features,
        submissionMethods: Object.keys(pricing.document_assembly.submissionMethods),
      },
      {
        code: 'simple_permit',
        name: pricing.simple_permit.name,
        price: Math.round(pricing.simple_permit.amount / 100),
        description: pricing.simple_permit.description,
        features: pricing.simple_permit.features,
        submissionMethods: Object.keys(pricing.simple_permit.submissionMethods),
      },
      {
        code: 'complex_permit',
        name: pricing.complex_permit.name,
        price: Math.round(pricing.complex_permit.amount / 100),
        description: pricing.complex_permit.description,
        features: pricing.complex_permit.features,
        submissionMethods: Object.keys(pricing.complex_permit.submissionMethods),
      },
      {
        code: 'expedited',
        name: pricing.expedited.name,
        price: Math.round(pricing.expedited.amount / 100),
        description: pricing.expedited.description,
        features: pricing.expedited.features,
        submissionMethods: Object.keys(pricing.expedited.submissionMethods),
      },
    ]
  }

  const permitTiers = buildPermitTiers()

  const submissionOptions = {
    SELF: {
      label: 'Self Submission',
      description: 'You handle the permit submission to the jurisdiction',
      icon: Shield,
      price: '-20%',
    },
    ASSISTED: {
      label: 'Assisted Submission',
      description: 'We guide you through submission; you submit documents',
      icon: Zap,
      price: 'Standard',
    },
    KEALEE_MANAGED: {
      label: 'Kealee-Managed Submission',
      description: 'We handle complete submission & follow-up (requires review)',
      icon: Clock,
      price: '+30%',
    },
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 1. Create permit intake record
      const intakeRes = await fetch('/api/v1/permits/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jurisdictionCode: formData.jurisdictionCode,
          projectType: formData.projectType,
          projectAddress: formData.projectAddress,
          clientName: formData.clientName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          budgetRange: formData.budgetRange,
          timelineGoal: formData.timeline,
          permitTypes: formData.permitTypes,
          submissionMethod: formData.submissionMethod,
          estimatedValuation: formData.estimatedValuation ? parseInt(formData.estimatedValuation) : undefined,
        }),
      })

      if (!intakeRes.ok) {
        throw new Error('Failed to create permit intake')
      }

      const { intakeId } = await intakeRes.json()

      // 2. Redirect to checkout with intakeId
      const tier = permitTiers.find(t => t.code === formData.budgetRange) || permitTiers[0]
      const basePrice = tier.price
      const multiplier = PERMIT_SUBMISSION_MULTIPLIERS[formData.submissionMethod] || 1.0

      const finalPrice = Math.round(basePrice * multiplier * 100) // Convert to cents

      router.push(
        `/permits/checkout?intakeId=${intakeId}&tier=${tier.code}&price=${finalPrice}&submissionMethod=${formData.submissionMethod}`
      )
    } catch (err) {
      setError((err as Error).message || 'An error occurred')
      setLoading(false)
    }
  }

  const selectedJurisdiction = jurisdictions.find(j => j.code === formData.jurisdictionCode)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">Permit Services</h1>
          </div>
          <p className="text-lg text-slate-600">
            Professional permit preparation and submission services for DC, MD, and VA projects
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8 flex justify-between items-center">
          {['select', 'intake', 'checkout'].map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step === s
                    ? 'bg-blue-600 text-white'
                    : ['select', 'intake', 'checkout'].indexOf(step) >= i
                      ? 'bg-blue-200 text-blue-700'
                      : 'bg-slate-200 text-slate-500'
                }`}
              >
                {i + 1}
              </div>
              {i < 2 && <div className="flex-1 h-1 mx-2 bg-slate-200" />}
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Jurisdiction & Tier Selection */}
            {step === 'select' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-4">
                    <MapPin className="inline w-4 h-4 mr-2" />
                    Select Your Jurisdiction
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {jurisdictions.map(j => (
                      <button
                        key={j.code}
                        type="button"
                        onClick={() => setFormData({ ...formData, jurisdictionCode: j.code })}
                        className={`p-3 rounded-lg border-2 text-left transition ${
                          formData.jurisdictionCode === j.code
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="font-semibold text-slate-900">{j.abbr}</div>
                        <div className="text-sm text-slate-600">{j.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {formData.jurisdictionCode && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-4">
                        <DollarSign className="inline w-4 h-4 mr-2" />
                        Select Service Tier
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {permitTiers.map(tier => (
                          <button
                            key={tier.code}
                            type="button"
                            onClick={() => setFormData({ ...formData, budgetRange: tier.code })}
                            className={`p-4 rounded-lg border-2 text-left transition ${
                              formData.budgetRange === tier.code
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-semibold text-slate-900">{tier.name}</div>
                              <div className="text-lg font-bold text-blue-600">${tier.price}</div>
                            </div>
                            <div className="text-sm text-slate-600 mb-3">{tier.description}</div>
                            <ul className="text-xs text-slate-500 space-y-1">
                              {tier.features.map((f, i) => (
                                <li key={i}>✓ {f}</li>
                              ))}
                            </ul>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep('intake')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
                    >
                      Continue to Details
                    </button>
                  </>
                )}
              </>
            )}

            {/* Step 2: Intake Form */}
            {step === 'intake' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.clientName}
                      onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.contactEmail}
                      onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Project Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.projectAddress}
                      onChange={e => setFormData({ ...formData, projectAddress: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Project Type *
                    </label>
                    <select
                      required
                      value={formData.projectType}
                      onChange={e => setFormData({ ...formData, projectType: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select project type</option>
                      <option value="renovation">Renovation</option>
                      <option value="addition">Addition</option>
                      <option value="new_construction">New Construction</option>
                      <option value="hvac">HVAC System</option>
                      <option value="electrical">Electrical</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Estimated Project Value
                    </label>
                    <input
                      type="number"
                      value={formData.estimatedValuation}
                      onChange={e => setFormData({ ...formData, estimatedValuation: e.target.value })}
                      placeholder="$0"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Timeline Goal
                    </label>
                    <select
                      value={formData.timeline}
                      onChange={e => setFormData({ ...formData, timeline: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select timeline</option>
                      <option value="asap">ASAP (1-2 weeks)</option>
                      <option value="month">Within 1 month</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Budget Range *
                    </label>
                    <select
                      required
                      value={formData.budgetRange}
                      onChange={e => setFormData({ ...formData, budgetRange: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select range</option>
                      <option value="under_50k">Under $50K</option>
                      <option value="50k_100k">$50K - $100K</option>
                      <option value="100k_250k">$100K - $250K</option>
                      <option value="250k_plus">$250K+</option>
                    </select>
                  </div>
                </div>

                {/* Submission Method */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-4">
                    How should we handle submission?
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(submissionOptions).map(([key, option]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, submissionMethod: key as any })}
                        className={`p-4 rounded-lg border-2 text-left transition ${
                          formData.submissionMethod === key
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <option.icon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                          <div>
                            <div className="font-semibold text-slate-900">{option.label}</div>
                            <div className="text-xs text-blue-600 font-medium">{option.price}</div>
                          </div>
                        </div>
                        <div className="text-sm text-slate-600">{option.description}</div>
                      </button>
                    ))}
                  </div>
                  {formData.submissionMethod === 'KEALEE_MANAGED' && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                      <strong>Note:</strong> Kealee-managed submission requires identity verification. You'll be guided through this after checkout.
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep('select')}
                    className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-lg transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('checkout')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
                  >
                    Review & Pay
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Checkout Summary */}
            {step === 'checkout' && (
              <>
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Order Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Jurisdiction:</span>
                      <span className="font-medium text-slate-900">{selectedJurisdiction?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Service Tier:</span>
                      <span className="font-medium text-slate-900">
                        {permitTiers.find(t => t.code === formData.budgetRange)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Submission Method:</span>
                      <span className="font-medium text-slate-900">
                        {submissionOptions[formData.submissionMethod].label}
                      </span>
                    </div>
                    <div className="border-t border-slate-300 pt-3 mt-3 flex justify-between">
                      <span className="font-semibold text-slate-900">Final Price:</span>
                      <span className="text-lg font-bold text-blue-600">
                        $
                        {(() => {
                          const tier = permitTiers.find(t => t.code === formData.budgetRange)
                          if (!tier) return '0'
                          const multiplier = {
                            SELF: 0.8,
                            ASSISTED: 1.0,
                            KEALEE_MANAGED: 1.3,
                          }[formData.submissionMethod]
                          return Math.round(tier.price * multiplier)
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-semibold py-4 rounded-lg transition"
                >
                  {loading ? 'Processing...' : 'Proceed to Payment'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('intake')}
                  className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2 rounded-lg transition"
                >
                  Edit Details
                </button>
              </>
            )}
          </form>
        </div>

        {/* Service Features */}
        {step === 'select' && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'Expert Preparation',
                description: 'Licensed professionals prepare complete permit applications',
              },
              {
                icon: Zap,
                title: 'Fast Turnaround',
                description: 'Most applications ready within 5-7 business days',
              },
              {
                icon: Clock,
                title: 'Full Support',
                description: 'We handle follow-ups and coordinate with agencies',
              },
            ].map((feature, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow text-center">
                <feature.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
