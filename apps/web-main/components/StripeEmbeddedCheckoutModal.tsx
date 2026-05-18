'use client'

/**
 * StripeEmbeddedCheckoutModal
 *
 * Renders Stripe's embedded card form inside a modal overlay.
 * Used when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set at build time.
 *
 * The parent must supply a `clientSecret` obtained from
 * POST /api/intake/checkout with { embedded: true }.
 *
 * Promo codes are handled inside the Stripe form
 * (allow_promotion_codes: true is set server-side).
 */

import { useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js'
import { X } from 'lucide-react'

// Resolved once at module load — safe because the key is build-time constant.
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

interface Props {
  clientSecret: string
  onClose: () => void
}

export function StripeEmbeddedCheckoutModal({ clientSecret, onClose }: Props) {
  const fetchClientSecret = useCallback(
    () => Promise.resolve(clientSecret),
    [clientSecret],
  )

  if (!stripePromise) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#1A2B4A] flex items-center justify-center">
              <span className="text-white text-[10px] font-extrabold">K</span>
            </div>
            <span className="font-bold text-slate-900 text-sm">Secure Checkout</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            aria-label="Close checkout"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Embedded Stripe form — scrollable */}
        <div className="overflow-y-auto flex-1 p-4">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ fetchClientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  )
}
