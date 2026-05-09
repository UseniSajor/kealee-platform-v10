'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type GCPlanSlug = 'package-a' | 'package-b' | 'package-c' | 'package-d'

const PLANS: Array<{
  slug: GCPlanSlug
  name: string
  monthlyPrice: number
  annualPrice: number
  description: string
  features: string[]
  popular?: boolean
}> = [
  {
    slug: 'package-a',
    name: 'Starter',
    monthlyPrice: 1750,
    annualPrice: 1750 * 12 * 0.85,
    description: 'Perfect for new GC operations',
    features: [
      'Up to 5 projects',
      'Basic project management',
      'Email support',
      '14-day free trial',
      'Core integrations',
    ],
  },
  {
    slug: 'package-b',
    name: 'Growth',
    monthlyPrice: 3500,
    annualPrice: 3500 * 12 * 0.85,
    description: 'For growing GC firms',
    features: [
      'Up to 20 projects',
      'Advanced project management',
      'Priority email support',
      '14-day free trial',
      'All Starter features',
      'Contractor marketplace access',
    ],
    popular: true,
  },
  {
    slug: 'package-c',
    name: 'Professional',
    monthlyPrice: 7500,
    annualPrice: 7500 * 12 * 0.85,
    description: 'For established firms',
    features: [
      'Unlimited projects',
      'Full project management suite',
      'Phone & email support',
      '14-day free trial',
      'All Growth features',
      'Advanced analytics',
      'Custom workflows',
    ],
  },
  {
    slug: 'package-d',
    name: 'Enterprise',
    monthlyPrice: 16500,
    annualPrice: 16500 * 12 * 0.85,
    description: 'For large operations',
    features: [
      'Unlimited everything',
      'Dedicated account manager',
      '24/7 priority support',
      '14-day free trial',
      'All Professional features',
      'Custom integrations',
      'SLA guarantee',
      'White-label options',
    ],
  },
]

export default function CheckoutPage() {
  const [interval, setInterval] = useState<'month' | 'year'>('month')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleChoosePlan = async (planSlug: GCPlanSlug) => {
    setLoading(true)
    setError(null)

    try {
      // For this MVP, we'll redirect to Stripe without requiring login
      // In production, you'd want to ensure the user is logged in or capture email
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug,
          interval,
          orgId: `new-org-${Date.now()}`, // Temp org ID - will be created server-side
          successUrl: `${window.location.origin}/dashboard/billing?success=true`,
          cancelUrl: `${window.location.origin}/checkout`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (err: any) {
      setError(err.message || 'Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Kealee GC Operations Platform</h1>
          <p className="text-xl text-blue-100 mb-2">
            Comprehensive tools for general contractors to manage projects, operations, and growth
          </p>
          <p className="text-blue-100">All plans include a 14-day free trial. No credit card required to start.</p>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center gap-4">
            <span className={`text-lg font-medium ${interval === 'month' ? 'text-gray-900' : 'text-gray-600'}`}>
              Monthly
            </span>
            <button
              onClick={() => setInterval(interval === 'month' ? 'year' : 'month')}
              className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{
                backgroundColor: interval === 'year' ? '#2ABFBF' : '#d1d5db',
              }}
            >
              <span
                className="inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform"
                style={{
                  transform: interval === 'year' ? 'translateX(1.75rem)' : 'translateX(0.25rem)',
                }}
              />
            </button>
            <span className={`text-lg font-medium ${interval === 'year' ? 'text-gray-900' : 'text-gray-600'}`}>
              Annual <span className="text-sm text-green-600">(Save 15%)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
            {error}
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PLANS.map((plan) => {
            const isAnnual = interval === 'year'
            const displayPrice = isAnnual ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice
            const totalPrice = isAnnual ? Math.round(plan.annualPrice) : plan.monthlyPrice * 12

            return (
              <div
                key={plan.slug}
                className={`rounded-lg border-2 p-8 flex flex-col ${
                  plan.popular
                    ? 'border-blue-500 bg-white shadow-xl relative'
                    : 'border-gray-200 bg-white hover:border-gray-300 transition'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-8 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}

                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-6">{plan.description}</p>

                <div className="mb-6">
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    ${displayPrice.toLocaleString()}
                    <span className="text-lg text-gray-600 font-normal">/mo</span>
                  </div>
                  {isAnnual && (
                    <p className="text-sm text-gray-600">
                      ${totalPrice.toLocaleString()} billed annually
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleChoosePlan(plan.slug)}
                  disabled={loading}
                  className={`w-full mb-8 py-3 rounded-lg font-semibold transition ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-50'
                  }`}
                >
                  {loading ? 'Loading...' : 'Choose Plan'}
                </button>

                <div className="space-y-3 flex-1">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white border-t border-gray-200 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Frequently Asked Questions</h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What's included in the 14-day free trial?</h3>
              <p className="text-gray-700">
                Full access to all features of your selected plan. No credit card required to start, and you can cancel anytime.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I upgrade or downgrade my plan?</h3>
              <p className="text-gray-700">
                Yes! You can change your plan anytime from your billing dashboard. Changes take effect at your next billing cycle.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-700">
                We accept all major credit and debit cards through Stripe. Additional payment methods may be available depending on your location.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is there a contract or long-term commitment?</h3>
              <p className="text-gray-700">
                No contracts. You're on a month-to-month or year-to-year subscription (based on your billing cycle) and can cancel anytime with no penalties.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I get support?</h3>
              <p className="text-gray-700">
                All plans include email support. Professional and Enterprise plans include priority support and, for Enterprise, a dedicated account manager.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-700 mb-4">
            Not sure which plan is right for you?{' '}
            <Link href="/" className="text-blue-600 hover:underline font-semibold">
              Learn more about Kealee
            </Link>
          </p>
          <Link
            href="/contact"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Contact Sales
          </Link>
        </div>
      </div>
    </div>
  )
}
