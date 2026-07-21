'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PermitApiService as PermitAPI } from '@permits/src/lib/api/permits'

export default function PermitPaymentSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const permitId = params.id as string
  const sessionId = searchParams.get('session_id')
  const feeType = searchParams.get('fee_type') || 'permit_fee'

  const [confirming, setConfirming] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sessionId) {
      confirmPayment()
    } else {
      setError('No session ID provided')
      setConfirming(false)
    }
  }, [sessionId])

  const confirmPayment = async () => {
    try {
      await PermitAPI.confirmPayment(permitId, sessionId!, feeType)
      setConfirmed(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Confirming payment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Payment Confirmation Failed</h2>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <div className="mt-6 space-y-3">
              <Link
                href={`/permits/${permitId}`}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Back to Permit
              </Link>
              <button
                onClick={() => router.push(`/permits/permits/${permitId}/payment`)}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Payment Successful!</h2>
          <p className="mt-2 text-sm text-gray-600">
            Your {feeType === 'expedited' ? 'expedited processing' : feeType === 'document_prep' ? 'document preparation' : 'permit'} payment has been confirmed.
          </p>
          <div className="mt-6 space-y-3">
            <Link
              href={`/permits/status/${permitId}`}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              View Permit Status
            </Link>
            <Link
              href="/permits"
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Permits
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

