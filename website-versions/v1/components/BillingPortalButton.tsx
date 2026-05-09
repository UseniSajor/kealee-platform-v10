'use client'

import React, { useState } from 'react'

interface BillingPortalButtonProps {
  customerId: string
  returnUrl: string
}

export default function BillingPortalButton({ customerId, returnUrl }: BillingPortalButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenPortal = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          returnUrl,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create portal session')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (err: any) {
      setError(err.message || 'Failed to open billing portal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleOpenPortal}
        disabled={loading || !customerId}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Opening Portal...' : 'Manage Payment Method'}
      </button>
      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}
    </div>
  )
}
