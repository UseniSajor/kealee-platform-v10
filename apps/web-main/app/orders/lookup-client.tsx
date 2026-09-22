'use client'

import { useState } from 'react'
import Link from 'next/link'

export function OrdersLookupClient() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setState('sending')
    setError(null)
    try {
      const response = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const body = (await response.json().catch(() => ({}))) as { message?: string; error?: string }
      if (!response.ok) throw new Error(body.error ?? 'Try again in a moment.')
      setMessage(body.message ?? 'Check your inbox.')
      setState('sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Try again in a moment.')
      setState('idle')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-orange-50 px-4 py-20">
      <div className="mx-auto w-full max-w-lg">
        <h1 className="text-3xl font-bold text-slate-900">Find your order</h1>
        <p className="mt-3 text-slate-600">
          Your order is safe. Enter the email you used at checkout and Kealee will send the link to
          your order — its current status, anything still needed from you, and your deliverables as
          they are released.
        </p>

        {state === 'sent' ? (
          <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
            <p className="font-semibold">Sent</p>
            <p className="mt-1">{message}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block text-sm font-semibold text-slate-800" htmlFor="order-email">
              Email used at checkout
            </label>
            <input
              id="order-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-orange-500"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={state === 'sending' || !email.includes('@')}
              className="w-full rounded-xl bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {state === 'sending' ? 'Sending your link…' : 'Email me my order link'}
            </button>
          </form>
        )}

        <p className="mt-8 text-sm text-slate-500">
          Still stuck? <Link href="/contact" className="font-medium text-slate-700 underline">Contact Kealee</Link> with
          the email you paid with and we will find the order for you.
        </p>
      </div>
    </div>
  )
}
