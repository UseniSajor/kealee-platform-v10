'use client'

import React, { useState } from 'react'

interface CancelSubscriptionButtonProps {
  orgId: string
}

export default function CancelSubscriptionButton({ orgId }: CancelSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleCancel = async () => {
    setLoading(true)
    setError(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
      const response = await fetch(`${apiUrl}/billing/subscriptions/${orgId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelImmediately: false }),
      })

      if (!response.ok) {
        throw new Error('Failed to cancel subscription')
      }

      // Refresh page to show updated status
      window.location.reload()
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {showConfirm ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-900 font-semibold mb-4">
            Are you sure you want to cancel your subscription?
          </p>
          <p className="text-red-800 text-sm mb-4">
            Your subscription will be canceled at the end of your current billing period. You'll continue to have access until then.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
            >
              {loading ? 'Canceling...' : 'Confirm Cancel'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={loading}
              className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
            >
              Keep Subscription
            </button>
          </div>
          {error && (
            <p className="text-red-600 text-sm mt-3">{error}</p>
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          className="block w-full bg-white border border-red-200 rounded-lg p-6 text-center hover:border-red-500 hover:bg-red-50 transition"
        >
          <p className="font-semibold text-red-700 mb-1">Cancel Subscription</p>
          <p className="text-sm text-red-600">End your subscription at period end</p>
        </button>
      )}
    </div>
  )
}
