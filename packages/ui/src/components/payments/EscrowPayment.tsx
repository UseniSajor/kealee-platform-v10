'use client'

import { useState } from 'react'

interface EscrowPaymentProps {
  escrowId: string
  projectName: string
  escrowAccountNumber: string
  totalAmount: number
  currentBalance: number
  availableBalance: number
  onPaymentComplete?: () => void
}

export function EscrowPayment({
  escrowId,
  projectName,
  escrowAccountNumber,
  totalAmount,
  currentBalance,
  availableBalance,
  onPaymentComplete,
}: EscrowPaymentProps) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remainingBalance = totalAmount - currentBalance
  const progressPercent = totalAmount > 0 ? Math.min((currentBalance / totalAmount) * 100, 100) : 0

  const handleFundEscrow = async () => {
    const amountCents = Math.round(parseFloat(amount) * 100)
    if (!amountCents || amountCents <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/payments/escrow/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escrowId, amount: amountCents }),
      })

      const data = await res.json()
      if (data.clientSecret) {
        // In production, use Stripe Elements to confirm payment
        // For now, redirect to Stripe-hosted page
        window.location.href = data.url || '/payments/success'
      } else if (data.error) {
        throw new Error(data.error)
      }

      onPaymentComplete?.()
    } catch (err: any) {
      setError(err.message || 'Failed to process payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Escrow Account</h3>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
          {escrowAccountNumber}
        </span>
      </div>

      <p className="mb-4 text-sm text-gray-600">{projectName}</p>

      {/* Balance Overview */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total Contract</span>
          <span className="font-semibold text-gray-900">${totalAmount.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Funded</span>
          <span className="font-semibold text-green-600">${currentBalance.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Available for Release</span>
          <span className="font-semibold text-blue-600">${availableBalance.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Remaining</span>
          <span className="font-semibold text-amber-600">${remainingBalance.toLocaleString()}</span>
        </div>

        {/* Progress Bar */}
        <div className="pt-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-1 text-right text-xs text-gray-500">{progressPercent.toFixed(0)}% funded</p>
        </div>
      </div>

      {/* Fund Escrow Form */}
      {remainingBalance > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Fund Amount
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="1"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-7 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleFundEscrow}
              disabled={loading || !amount}
              className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Fund'}
            </button>
          </div>

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setAmount((remainingBalance * 0.1).toFixed(2))}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
            >
              10% Deposit
            </button>
            <button
              onClick={() => setAmount((remainingBalance * 0.5).toFixed(2))}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
            >
              50%
            </button>
            <button
              onClick={() => setAmount(remainingBalance.toFixed(2))}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
            >
              Full Balance
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
