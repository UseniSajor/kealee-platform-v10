'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle } from 'lucide-react'

const ESTIMATION_PRICES = {
  cost_estimate: { name: 'Detailed Cost Estimate', price: 59500, turnaround: 3 },
  certified_estimate: { name: 'Certified Cost Estimate', price: 185000, turnaround: 5 },
  bundle: { name: 'Estimate + Permit Bundle', price: 110000, turnaround: 5 },
}

export default function EstimationReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [intake, setIntake] = useState<Record<string, any> | null>(null)
  const [selectedTier, setSelectedTier] = useState<string>('cost_estimate')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [priceInfo, setPriceInfo] = useState<any>(null)

  useEffect(() => {
    // Load intake from sessionStorage
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('kealee_estimation_intake')
      if (stored) {
        setIntake(JSON.parse(stored))
      }
    }

    // Get tier from query param
    const tier = searchParams.get('tier') as string
    if (tier && tier in ESTIMATION_PRICES) {
      setSelectedTier(tier)
      setPriceInfo(ESTIMATION_PRICES[tier as keyof typeof ESTIMATION_PRICES])
    } else {
      setPriceInfo(ESTIMATION_PRICES.cost_estimate)
    }
  }, [searchParams])

  const handleCheckout = async () => {
    if (!intake) return
    setIsSubmitting(true)

    try {
      // Submit intake to /estimation/intake endpoint
      const intakeResponse = await fetch('/api/estimation/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intake),
      })

      if (!intakeResponse.ok) {
        throw new Error('Failed to submit intake')
      }

      const { intakeId } = await intakeResponse.json()

      // Get contact email from intake
      const contactEmail = intake.contact?.email || ''

      // Create checkout session
      const checkoutResponse = await fetch('/api/estimation/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeId,
          tier: selectedTier,
          email: contactEmail,
        }),
      })

      if (!checkoutResponse.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await checkoutResponse.json()

      // Redirect to Stripe
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to proceed to checkout. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (!intake || !priceInfo) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="py-12 border-b border-gray-100">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold font-display" style={{ color: '#1A2B4A' }}>
            Review Your Estimate Order
          </h1>
          <p className="mt-2 text-gray-600">Confirm your project details and choose your estimate package.</p>
        </div>
      </section>

      {/* Main content */}
      <section className="py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          {/* Summary card */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 mb-8">
            <h2 className="font-semibold text-lg mb-4" style={{ color: '#1A2B4A' }}>
              Project Summary
            </h2>
            <dl className="space-y-3">
              <div className="flex justify-between text-sm">
                <dt className="text-gray-600">Project Type</dt>
                <dd className="font-medium text-gray-900">{intake.project?.projectScope || 'Not specified'}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-600">Scope Detail</dt>
                <dd className="font-medium text-gray-900">{intake.project?.scopeDetail || 'Not specified'}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-600">Project Stage</dt>
                <dd className="font-medium text-gray-900">{intake.project?.projectStage || 'Not specified'}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-600">Contact</dt>
                <dd className="font-medium text-gray-900">{intake.contact?.email || 'Not specified'}</dd>
              </div>
            </dl>
          </div>

          {/* Tier selection */}
          <div className="mb-8">
            <h2 className="font-semibold text-lg mb-4" style={{ color: '#1A2B4A' }}>
              Choose Your Estimate Package
            </h2>
            <div className="space-y-3">
              {Object.entries(ESTIMATION_PRICES).map(([key, tier]) => (
                <label key={key} className="flex items-center p-4 rounded-lg border-2 cursor-pointer transition" style={{
                  borderColor: selectedTier === key ? '#4A8FA8' : '#E5E7EB',
                  backgroundColor: selectedTier === key ? '#F0F9FF' : 'white',
                }}>
                  <input
                    type="radio"
                    name="tier"
                    value={key}
                    checked={selectedTier === key}
                    onChange={e => {
                      setSelectedTier(e.target.value)
                      setPriceInfo(ESTIMATION_PRICES[e.target.value as keyof typeof ESTIMATION_PRICES])
                    }}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold" style={{ color: '#1A2B4A' }}>{tier.name}</h3>
                    <p className="text-sm text-gray-600">Turnaround: {tier.turnaround} business days</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg" style={{ color: '#4A8FA8' }}>
                      ${(tier.price / 100).toFixed(2)}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-lg font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#4A8FA8' }}
            >
              {isSubmitting ? 'Processing...' : `Proceed to Payment (${priceInfo ? '$' + (priceInfo.price / 100).toFixed(2) : '...'})`}
            </button>
            <Link
              href="/estimate"
              className="block text-center text-sm text-gray-600 hover:text-gray-900 transition"
            >
              Back to estimates
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
