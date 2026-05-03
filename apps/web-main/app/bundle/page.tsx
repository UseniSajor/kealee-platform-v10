'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DELIVERABLES = [
  {
    icon: '🎨',
    title: 'Design Concept',
    desc: 'AI-generated renders, concept PDF, and 3–5 high-res visualisations — delivered within 24 hours.',
    color: 'border-orange-200 bg-orange-50',
    badge: 'bg-orange-100 text-orange-700',
    label: 'Design',
  },
  {
    icon: '📊',
    title: 'Cost Estimation',
    desc: 'Detailed line-item cost breakdown calibrated to your region and project scope.',
    color: 'border-blue-200 bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
    label: 'Estimation',
  },
  {
    icon: '📋',
    title: 'Permit Roadmap',
    desc: 'Jurisdiction-specific permit checklist, typical timelines, and step-by-step filing guide.',
    color: 'border-green-200 bg-green-50',
    badge: 'bg-green-100 text-green-700',
    label: 'Permits',
  },
]

export default function BundlePage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cancelled] = useState(
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('cancelled') === '1'
      : false
  )

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/bundle/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail: email, customerName: name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed')
      router.push(data.url)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <span className="inline-block mb-4 rounded-full bg-gray-900 px-4 py-1 text-xs font-semibold text-white tracking-wider uppercase">
            Full-Stack Design Bundle
          </span>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Everything you need to start your project
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-6">
            Design concept, cost estimate, and permit roadmap — three AI-powered deliverables in one package.
          </p>
          <div className="inline-flex items-baseline gap-2">
            <span className="text-5xl font-bold text-gray-900">$10</span>
            <span className="text-gray-400 text-lg line-through">$249</span>
            <span className="text-sm text-green-600 font-medium">Launch price</span>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-10">
        {/* Left — deliverables */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">
            What you get
          </h2>
          <div className="space-y-4">
            {DELIVERABLES.map(({ icon, title, desc, color, badge, label }) => (
              <div key={title} className={`rounded-xl border p-5 ${color}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge}`}>
                        {label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-gray-100 p-4 text-sm text-gray-500">
            <strong className="text-gray-700">Promo code?</strong> Enter{' '}
            <code className="bg-white px-2 py-0.5 rounded font-mono text-gray-800">
              KEALEE-BUNDLE-TEST
            </code>{' '}
            at checkout for 100% off (testing only).
          </div>
        </div>

        {/* Right — checkout form */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Get started</h2>
            <p className="text-sm text-gray-400 mb-6">
              We&rsquo;ll email your deliverables as they&rsquo;re ready.
            </p>

            {cancelled && (
              <div className="mb-5 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
                Checkout was cancelled. No charge was made.
              </div>
            )}

            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 rounded-lg bg-red-50 px-4 py-3 border border-red-200">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-xl bg-gray-900 px-6 py-3.5 text-sm font-semibold text-white
                  hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Redirecting to checkout…' : 'Get the bundle — $10'}
              </button>

              <p className="text-center text-xs text-gray-400">
                Secured by Stripe. Cancel anytime from checkout.
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
