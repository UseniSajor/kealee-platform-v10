'use client'

import { useState } from 'react'

interface SubscriptionInfo {
  id: string
  status: string
  planName: string
  amount: number
  currency: string
  interval: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  paymentMethod?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  } | null
}

interface ManageSubscriptionProps {
  subscription: SubscriptionInfo
  onCancel?: () => void
  onManage?: () => void
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  trialing: 'bg-blue-100 text-blue-700',
  past_due: 'bg-amber-100 text-amber-700',
  canceled: 'bg-red-100 text-red-700',
  incomplete: 'bg-gray-100 text-gray-700',
}

export function ManageSubscription({
  subscription,
  onCancel,
  onManage,
}: ManageSubscriptionProps) {
  const [loading, setLoading] = useState(false)

  const handleManageBilling = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/payments/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
      onManage?.()
    } catch (err: any) {
      console.error('Portal error:', err)
      alert('Failed to open billing portal')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return
    }

    setLoading(true)
    try {
      await fetch('/api/payments/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subscription.id }),
      })
      onCancel?.()
    } catch (err: any) {
      console.error('Cancel error:', err)
      alert('Failed to cancel subscription')
    } finally {
      setLoading(false)
    }
  }

  const periodEnd = new Date(subscription.currentPeriodEnd)
  const statusColor = STATUS_COLORS[subscription.status] || 'bg-gray-100 text-gray-700'

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Your Subscription</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusColor}`}>
          {subscription.status}
        </span>
      </div>

      {/* Plan Details */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Plan</span>
          <span className="text-sm font-semibold text-gray-900">{subscription.planName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Price</span>
          <span className="text-sm font-semibold text-gray-900">
            ${(subscription.amount / 100).toFixed(2)}/{subscription.interval}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {subscription.cancelAtPeriodEnd ? 'Access Until' : 'Next Billing'}
          </span>
          <span className="text-sm text-gray-900">
            {periodEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Payment Method */}
        {subscription.paymentMethod && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Payment</span>
            <span className="text-sm text-gray-900">
              {subscription.paymentMethod.brand.charAt(0).toUpperCase() + subscription.paymentMethod.brand.slice(1)}{' '}
              ****{subscription.paymentMethod.last4}
            </span>
          </div>
        )}
      </div>

      {subscription.cancelAtPeriodEnd && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm text-amber-800">
            Your subscription is set to cancel on{' '}
            {periodEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleManageBilling}
          disabled={loading}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Manage Billing'}
        </button>
        {!subscription.cancelAtPeriodEnd && subscription.status === 'active' && (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
