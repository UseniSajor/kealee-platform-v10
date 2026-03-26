'use client'

import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Lock } from 'lucide-react'

type ProjectType = 'exterior' | 'interior' | 'landscape'

const TYPE_LABELS: Record<ProjectType, string> = {
  exterior: 'Exterior Facade',
  interior: 'Interior Addition',
  landscape: 'Landscape & Outdoor',
}

const TYPE_COLORS: Record<ProjectType, string> = {
  exterior: '#E8793A',
  interior: '#7C3AED',
  landscape: '#38A169',
}

const TIER_LABELS: Record<string, string> = {
  starter: 'Starter',
  visualization: 'Visualization',
  'pre-design': 'Pre-Design',
}

const TIER_PRICES: Record<string, number> = {
  starter: 149,
  visualization: 395,
  'pre-design': 950,
}

const TIER_INCLUDES: Record<string, string[]> = {
  starter: ['3 AI concept images', 'Style + materials brief', 'PDF package'],
  visualization: ['3 AI concept images', 'Zoning + buildability', 'Feasibility brief', 'Consultation call', 'PDF package'],
  'pre-design': ['Everything in Visualization', 'Detailed scope of work', 'Systems impact analysis', 'Architect-ready export', 'Architect handoff'],
}

export default function PreDesignCheckoutPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const typeKey = (params?.type as string) || 'exterior'
  const tierKey = searchParams?.get('tier') || 'visualization'

  const color = TYPE_COLORS[typeKey as ProjectType] ?? '#E8793A'
  const typeLabel = TYPE_LABELS[typeKey as ProjectType] ?? 'Exterior Facade'
  const tierLabel = TIER_LABELS[tierKey] ?? 'Visualization'
  const price = TIER_PRICES[tierKey] ?? 395
  const includes = TIER_INCLUDES[tierKey] ?? []

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout() {
    if (!name.trim() || !email.trim() || !address.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/pre-design/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectType: typeKey,
          tier: tierKey,
          contactName: name,
          contactEmail: email,
          propertyAddress: address,
          notes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else if (data.sessionId) {
        router.push(`/pre-design/processing/${data.sessionId}`)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7FAFC' }}>
      {/* Back nav */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <Link href={`/pre-design/${typeKey}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" /> Back to tier selection
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left: form */}
          <div className="lg:col-span-3">
            <h1 className="text-2xl font-bold font-display mb-6" style={{ color: '#1A2B4A' }}>
              Tell us about your project
            </h1>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': color } as any}
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2"
                  placeholder="jane@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property address *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2"
                  placeholder="123 Main St, Washington DC 20001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none"
                  placeholder="Describe what you're hoping to achieve, any specific areas of focus, budget range, or constraints..."
                />
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="mt-6 w-full rounded-xl py-4 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: color }}
            >
              {loading ? (
                <span className="animate-pulse">Creating your session...</span>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Pay ${price} — Continue to Stripe
                </>
              )}
            </button>

            <p className="mt-3 text-xs text-center text-gray-400">
              Secure payment via Stripe · No subscription · One-time fee
            </p>
          </div>

          {/* Right: order summary */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="mb-4 pb-4 border-b border-gray-100">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
                  Your package
                </div>
                <div className="text-xl font-bold font-display" style={{ color: '#1A2B4A' }}>
                  {typeLabel}
                </div>
                <div className="text-sm text-gray-500">{tierLabel} tier</div>
              </div>

              <div className="mb-4 space-y-2">
                {includes.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color }} />
                    {item}
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total</span>
                  <span className="text-2xl font-bold" style={{ color }}>${price}</span>
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  Delivered in 2–5 business days
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 text-xs text-gray-500 space-y-2">
              <p>After payment, you can upload photos of your property to help our AI generate property-specific concepts.</p>
              <p>All packages include a satisfaction review period — if your concepts miss the mark, we'll revise.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
