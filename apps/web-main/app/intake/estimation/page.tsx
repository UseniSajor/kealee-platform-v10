'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { DynamicIntakeForm } from '@kealee/ui/components/intake/dynamic-intake-form'
import { useState, useEffect } from 'react'

export default function EstimationIntakePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedTier, setSelectedTier] = useState<string>('')

  useEffect(() => {
    // Get tier from query param if provided
    const tier = searchParams.get('tier')
    if (tier) {
      setSelectedTier(tier)
    }
  }, [searchParams])

  function handleComplete(data: Record<string, unknown>) {
    // Persist full form data to sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        'kealee_estimation_intake',
        JSON.stringify({
          ...data,
          selectedTier,
          submittedAt: new Date().toISOString(),
        })
      )
    }
    // Go to review/checkout
    router.push('/estimation/review?tier=' + (selectedTier || 'cost_estimate'))
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="py-12 border-b border-gray-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold font-display" style={{ color: '#1A2B4A' }}>
              Get Your Cost Estimate
            </h1>
            <p className="mt-3 text-gray-600">
              Tell us about your project. We'll ask a few questions to understand scope and complexity.
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <DynamicIntakeForm
            projectPath="estimation"
            onComplete={handleComplete}
          />
        </div>
      </section>
    </div>
  )
}
