'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { MapPin, CheckCircle2, Loader2 } from 'lucide-react'

const SITE_VISIT_FEE = 125
const AI_CONCEPT_BASE = 385

function PriceRow({ label, amount, highlight = false }: { label: string; amount: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between text-sm ${highlight ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
      <span>{label}</span>
      <span>{amount}</span>
    </div>
  )
}

interface OrderSummaryProps {
  isSiteVisit: boolean
  totalCents: number
}

function OrderSummary({ isSiteVisit, totalCents }: OrderSummaryProps) {
  const totalDollars = (totalCents / 100).toFixed(0)

  if (!isSiteVisit) {
    return (
      <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">Order Summary</h3>
        <PriceRow label="AI Concept Package" amount={`$${totalDollars}`} />
        <div className="border-t border-gray-200 pt-3">
          <PriceRow label="Total due today" amount={`$${totalDollars}`} highlight />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 space-y-3">
      <h3 className="text-sm font-semibold text-indigo-900">Order Summary</h3>
      <PriceRow label="AI Concept Package" amount={`$${AI_CONCEPT_BASE}`} />
      <div className="flex items-center justify-between text-sm text-indigo-700">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          <span>Kealee Site Visit Scan</span>
        </div>
        <span>${SITE_VISIT_FEE}</span>
      </div>
      <div className="border-t border-indigo-200 pt-3">
        <div className="flex items-center justify-between font-bold text-indigo-900">
          <span>Total due today</span>
          <span>${AI_CONCEPT_BASE + SITE_VISIT_FEE}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-indigo-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Site visit will be scheduled within 24 hours of payment
      </div>
    </div>
  )
}

export default function IntakePaymentPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectPath = params.projectPath as string
  const intakeId = searchParams.get('intakeId') ?? ''
  const amountParam = searchParams.get('amount')
  const isSiteVisit = searchParams.get('siteVisit') === '1'
  const paymentAmount = amountParam ? parseInt(amountParam, 10) : (isSiteVisit ? 51000 : 38500)
  const [isLoading, setIsLoading] = useState(false)

  async function handleCheckout() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/intake/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeId,
          projectPath,
          amount: paymentAmount,
          siteVisitRequested: isSiteVisit,
          successUrl: `${window.location.origin}/intake/${projectPath}/success?intakeId=${intakeId}${isSiteVisit ? '&siteVisit=1' : ''}`,
          cancelUrl: `${window.location.origin}/intake/${projectPath}/payment?intakeId=${intakeId}&amount=${paymentAmount}${isSiteVisit ? '&siteVisit=1' : ''}`,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { url } = await res.json() as { url?: string }
      if (url) window.location.href = url
    } catch (err) {
      console.error(err)
      alert('Failed to start checkout. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>Complete Your Order</h1>
        <p className="mt-2 text-gray-500">Secure checkout powered by Stripe</p>
      </div>

      <div className="space-y-5">
        <OrderSummary isSiteVisit={isSiteVisit} totalCents={paymentAmount} />

        {isSiteVisit && (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2">
            <p className="text-sm font-semibold text-gray-800">After payment you&apos;ll receive:</p>
            <ul className="space-y-1.5 text-sm text-gray-600">
              {[
                'Confirmation email with visit details',
                'Our team contacts you within 24 hours',
                'Professional on-site scan performed by Kealee',
                'AI concept package delivered after scan',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: '#16A34A' }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
          style={{
            backgroundColor: isSiteVisit ? '#4F46E5' : '#E8793A',
          }}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            `Pay $${(paymentAmount / 100).toFixed(0)} — Proceed to Checkout`
          )}
        </button>

        <p className="text-center text-xs text-gray-400">
          Payments are processed securely by Stripe. No card data touches our servers.
        </p>
      </div>
    </div>
  )
}
