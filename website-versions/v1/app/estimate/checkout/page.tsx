'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function EstimateCheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const intakeId = searchParams.get('intakeId')
  const tier = searchParams.get('tier')
  const price = searchParams.get('price')

  useEffect(() => {
    if (!intakeId || !tier || !price) {
      setError('Missing checkout parameters. Please start again.')
      setLoading(false)
      return
    }

    // Create Stripe checkout session
    const createCheckout = async () => {
      try {
        const checkoutRes = await fetch('/api/v1/estimation/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intakeId,
            tier,
            email: localStorage.getItem('estimationEmail') || undefined,
          }),
        })

        if (!checkoutRes.ok) {
          const errorData = await checkoutRes.json().catch(() => ({}))
          throw new Error(errorData.message || 'Failed to create checkout session')
        }

        const { url } = await checkoutRes.json()
        if (url) {
          window.location.href = url
        } else {
          throw new Error('No checkout URL returned')
        }
      } catch (err) {
        setError((err as Error).message)
        setLoading(false)
      }
    }

    createCheckout()
  }, [intakeId, tier, price])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {error ? (
          <>
            <div className="flex items-center justify-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 text-center mb-4">Checkout Error</h1>
            <p className="text-slate-600 text-center mb-6">{error}</p>
            <button
              onClick={() => router.push('/estimate')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Back to Estimation
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 text-center mb-4">Preparing Checkout</h1>
            <p className="text-slate-600 text-center">Redirecting you to payment...</p>
          </>
        )}
      </div>
    </div>
  )
}
