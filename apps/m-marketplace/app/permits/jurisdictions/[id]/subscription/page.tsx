'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface SubscriptionTier {
  id: 'basic' | 'pro' | 'enterprise'
  name: string
  price: number
  features: string[]
}

const TIERS: SubscriptionTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 500,
    features: [
      'Up to 100 permits/month',
      'Up to 3 staff users',
      'Basic reporting',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 1000,
    features: [
      'Up to 500 permits/month',
      'Up to 10 staff users',
      'Advanced reporting',
      'Custom fee schedules',
      'Phone support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 2000,
    features: [
      'Unlimited permits',
      'Unlimited staff users',
      'Custom integrations',
      'GIS integration',
      'White-label options',
      'Dedicated account manager',
    ],
  },
]

export default function JurisdictionSubscriptionPage() {
  const params = useParams()
  const router = useRouter()
  const jurisdictionId = params.id as string

  const [loading, setLoading] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'basic' | 'pro' | 'enterprise' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async (tier: 'basic' | 'pro' | 'enterprise') => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/jurisdictions/${jurisdictionId}/subscription`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            jurisdictionId,
            tier,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create subscription')
      }

      const data = await response.json()

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Jurisdiction Subscription</h1>
          <p className="mt-2 text-lg text-gray-600">Choose a subscription tier for your jurisdiction</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`bg-white rounded-lg shadow-lg border-2 ${
                selectedTier === tier.id ? 'border-blue-500' : 'border-gray-200'
              } p-6`}
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">${tier.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>

              <ul className="mt-6 space-y-3">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  setSelectedTier(tier.id)
                  handleSubscribe(tier.id)
                }}
                disabled={loading}
                className={`mt-6 w-full py-2 px-4 rounded-lg font-semibold ${
                  selectedTier === tier.id
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } disabled:opacity-50`}
              >
                {loading && selectedTier === tier.id ? 'Processing...' : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            All subscriptions include secure payment processing via Stripe
          </p>
        </div>
      </div>
    </div>
  )
}

