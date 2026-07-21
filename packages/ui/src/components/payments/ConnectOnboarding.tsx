'use client'

import { useState, useEffect } from 'react'

interface ConnectOnboardingProps {
  userId: string
  onOnboardingComplete?: () => void
}

interface ConnectStatus {
  hasAccount: boolean
  isOnboarded: boolean
  canReceivePayments: boolean
  accountId?: string
  requirements?: {
    currently_due?: string[]
    eventually_due?: string[]
    past_due?: string[]
  }
}

export function ConnectOnboarding({ userId, onOnboardingComplete }: ConnectOnboardingProps) {
  const [status, setStatus] = useState<ConnectStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStatus()
  }, [userId])

  const loadStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/payments/connect/status?userId=${userId}`)
      const data = await res.json()
      setStatus(data)
    } catch (err: any) {
      setError('Failed to load account status')
    } finally {
      setLoading(false)
    }
  }

  const handleStartOnboarding = async () => {
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (data.onboardingUrl || data.url) {
        window.location.href = data.onboardingUrl || data.url
      } else if (data.error) {
        throw new Error(data.error)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start onboarding')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <svg className="h-8 w-8 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Contractor Payment Setup</h3>

      {!status?.hasAccount ? (
        // No account — prompt to create
        <div>
          <div className="mb-4 rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              Set up your Stripe account to receive payments directly from project escrow accounts.
              You'll need to provide identity verification and banking details.
            </p>
          </div>
          <button
            onClick={handleStartOnboarding}
            disabled={actionLoading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {actionLoading ? 'Setting up...' : 'Set Up Payment Account'}
          </button>
        </div>
      ) : !status.isOnboarded ? (
        // Account exists but not onboarded
        <div>
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">Onboarding Incomplete</p>
            <p className="mt-1 text-sm text-amber-700">
              Complete your account setup to start receiving payments.
            </p>
            {status.requirements?.currently_due && status.requirements.currently_due.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-amber-800">Required information:</p>
                <ul className="mt-1 list-inside list-disc text-xs text-amber-700">
                  {status.requirements.currently_due.slice(0, 5).map((req) => (
                    <li key={req}>{req.replace(/_/g, ' ')}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button
            onClick={handleStartOnboarding}
            disabled={actionLoading}
            className="w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {actionLoading ? 'Loading...' : 'Continue Onboarding'}
          </button>
        </div>
      ) : !status.canReceivePayments ? (
        // Onboarded but restricted
        <div>
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">Account Restricted</p>
            <p className="mt-1 text-sm text-amber-700">
              Your account is set up but has restrictions. Additional verification may be needed.
            </p>
          </div>
          <button
            onClick={handleStartOnboarding}
            disabled={actionLoading}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Update Account
          </button>
        </div>
      ) : (
        // Fully set up
        <div>
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-green-800">Payment Account Active</p>
            </div>
            <p className="mt-1 text-sm text-green-700">
              You can receive payments from escrow accounts and milestone releases.
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Payouts</span>
              <span className="font-medium text-green-600">Enabled</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Account ID</span>
              <span className="font-mono text-xs text-gray-500">{status.accountId}</span>
            </div>
          </div>

          <button
            onClick={handleStartOnboarding}
            disabled={actionLoading}
            className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Update Account Details
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  )
}
