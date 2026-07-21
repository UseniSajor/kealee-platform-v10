'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@owner/lib/api'

type PaymentReleasePanelProps = {
  milestoneId: string
  milestoneName: string
  milestoneAmount: number
  onPaymentReleased: () => void
}

export default function PaymentReleasePanel({
  milestoneId,
  milestoneName,
  milestoneAmount,
  onPaymentReleased,
}: PaymentReleasePanelProps) {
  const [canRelease, setCanRelease] = useState(false)
  const [reasons, setReasons] = useState<string[]>([])
  const [releasing, setReleasing] = useState(false)
  const [releaseNotes, setReleaseNotes] = useState('')
  const [isFinalPayment, setIsFinalPayment] = useState(false)

  useEffect(() => {
    loadCanRelease()
  }, [milestoneId, loadCanRelease])

  const loadCanRelease = useCallback(async () => {
    try {
      const res = await api.canReleasePayment(milestoneId)
      setCanRelease(res.canRelease)
      setReasons(res.reasons || [])
    } catch (e: unknown) {
      console.error('Failed to check payment release status:', e)
    }
  }, [milestoneId])

  const handleReleasePayment = useCallback(async () => {
    if (!canRelease) return

    const confirmed = confirm(
      `Release payment of $${milestoneAmount.toLocaleString()} for "${milestoneName}"?\n\n${
        isFinalPayment
          ? 'This is the final payment (no holdback).'
          : `10% holdback ($${(milestoneAmount * 0.1).toLocaleString()}) will be retained.`
      }`
    )

    if (!confirmed) return

    setReleasing(true)
    try {
      await api.releasePayment(milestoneId, {
        skipHoldback: isFinalPayment,
        notes: releaseNotes || undefined,
      })
      alert('Payment released successfully! Contractor will be notified.')
      onPaymentReleased()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to release payment')
    } finally {
      setReleasing(false)
    }
  }, [canRelease, milestoneId, milestoneName, milestoneAmount, isFinalPayment, releaseNotes, onPaymentReleased])

  const holdbackAmount = milestoneAmount * 0.1
  const releaseAmount = milestoneAmount - holdbackAmount

  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-green-900">Payment Release</h3>

      {canRelease ? (
        <div className="mt-4 space-y-4">
          {/* Payment Summary */}
          <div className="rounded-lg border border-green-300 bg-white p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700">Milestone Amount:</span>
                <span className="text-sm font-semibold text-neutral-900">
                  ${milestoneAmount.toLocaleString()}
                </span>
              </div>
              {!isFinalPayment ? (
                <>
                  <div className="flex items-center justify-between border-t border-neutral-200 pt-2">
                    <span className="text-sm text-neutral-600">Holdback (10%):</span>
                    <span className="text-sm text-neutral-700">-${holdbackAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-green-200 pt-2">
                    <span className="text-sm font-medium text-green-900">Amount to Release:</span>
                    <span className="text-lg font-bold text-green-700">
                      ${releaseAmount.toLocaleString()}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between border-t border-green-200 pt-2">
                  <span className="text-sm font-medium text-green-900">Final Payment (No Holdback):</span>
                  <span className="text-lg font-bold text-green-700">
                    ${milestoneAmount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Final Payment Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="final-payment"
              checked={isFinalPayment}
              onChange={(e) => setIsFinalPayment(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-green-600 focus:ring-green-500"
            />
            <label htmlFor="final-payment" className="text-sm font-medium text-neutral-700">
              This is the final payment (release holdback)
            </label>
          </div>

          {/* Release Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Release Notes (optional)
            </label>
            <textarea
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              rows={2}
              placeholder="Add any notes about this payment..."
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          {/* Release Button */}
          <button
            type="button"
            onClick={handleReleasePayment}
            disabled={releasing}
            className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {releasing ? 'Releasing Payment...' : 'Release Payment'}
          </button>

          <p className="text-xs text-neutral-600">
            Payment will be processed via Stripe and contractor will be notified via email.
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">Payment cannot be released</p>
            {reasons.length > 0 ? (
              <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-amber-800">
                {reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <button
            type="button"
            onClick={loadCanRelease}
            className="mt-3 text-xs text-blue-600 underline underline-offset-4 hover:text-blue-700"
          >
            Refresh Status
          </button>
        </div>
      )}
    </div>
  )
}
