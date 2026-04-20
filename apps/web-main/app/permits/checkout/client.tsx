'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function PermitsCheckoutClient() {
  const params = useSearchParams()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const intakeId = params.get('intakeId')
    const tier = params.get('tier')
    const submissionMethod = params.get('submissionMethod') || 'ASSISTED'

    if (!intakeId || !tier) {
      setError('Missing permit intake information. Please go back and try again.')
      setIsLoading(false)
      return
    }

    const createCheckout = async () => {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const successUrl = `${appUrl}/permits/success?session_id={CHECKOUT_SESSION_ID}`
        const cancelUrl = `${appUrl}/permits?canceled=true`

        const response = await fetch('/api/permits/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intakeId,
            tier,
            successUrl,
            cancelUrl,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to create checkout session')
          setIsLoading(false)
          return
        }

        const data = await response.json()
        if (data.url) {
          window.location.href = data.url
        } else {
          setError('No checkout URL returned. Please try again.')
          setIsLoading(false)
        }
      } catch (err) {
        setError('Unable to create checkout session. Please try again.')
        setIsLoading(false)
      }
    }

    createCheckout()
  }, [params])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Checkout Error</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <a
            href="/permits"
            className="inline-block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
          >
            Return to Permits
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-6 animate-spin" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Processing Your Order</h1>
        <p className="text-slate-600">Redirecting to secure checkout...</p>
      </div>
    </div>
  )
}
