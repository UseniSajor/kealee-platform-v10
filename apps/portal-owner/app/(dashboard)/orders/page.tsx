'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ConceptOrder {
  id: string
  packageName: string
  packageTier: string
  amount: number
  deliveryStatus: string
  createdAt: string
  deliveryUrl?: string
}

interface PermitOrder {
  id: string
  tierName: string
  tier: string
  amount: number
  deliveryStatus: string
  createdAt: string
  deliveryUrl?: string
}

interface ArchitectVIPOrder {
  id: string
  tierName: string
  tier: string
  amount: number
  deliveryStatus: string
  createdAt: string
  deliveryUrl?: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  generating: 'bg-blue-50 text-blue-700 border border-blue-200',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
  architect_assigned: 'bg-purple-50 text-purple-700 border border-purple-200',
  review: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  ready: 'bg-green-50 text-green-700 border border-green-200',
  delivered: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  completed: 'bg-gray-50 text-gray-700 border border-gray-200',
}

function statusLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function OrderRow({ label, amount, status, date, deliveryUrl, detailHref }: {
  label: string; amount: number; status: string; date: string; deliveryUrl?: string; detailHref?: string
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-semibold text-gray-800 truncate">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{new Date(date).toLocaleDateString()}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
          {statusLabel(status)}
        </span>
        <span className="text-sm font-bold text-gray-700">${(amount / 100).toFixed(0)}</span>
        {deliveryUrl ? (
          <a href={deliveryUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-teal-600 font-semibold hover:underline">View</a>
        ) : detailHref ? (
          <Link href={detailHref} className="text-xs text-gray-400 hover:text-gray-600">Details</Link>
        ) : null}
      </div>
    </div>
  )
}

export default function OrdersPage() {
  const [concepts, setConcepts] = useState<ConceptOrder[]>([])
  const [permits, setPermits] = useState<PermitOrder[]>([])
  const [archVip, setArchVip] = useState<ArchitectVIPOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [cRes, pRes, aRes] = await Promise.all([
          fetch('/api/concepts/orders'),
          fetch('/api/permits/orders'),
          fetch('/api/architect-vip/orders'),
        ])
        if (cRes.ok) setConcepts(await cRes.json())
        if (pRes.ok) setPermits(await pRes.json())
        if (aRes.ok) setArchVip(await aRes.json())
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const total = concepts.length + permits.length + archVip.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Orders</h1>
        <p className="text-sm text-gray-500 mt-1">{total} order{total !== 1 ? 's' : ''} across all services</p>
      </div>

      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-400 mb-4">No orders yet</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/concepts/new" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors">
              Start a Concept Package
            </Link>
            <Link href="/permits" className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Get a Permit Package
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Concept Orders */}
          {concepts.length > 0 && (
            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
                AI Concept Design
              </h2>
              {concepts.map((o) => (
                <OrderRow
                  key={o.id}
                  label={o.packageName}
                  amount={o.amount}
                  status={o.deliveryStatus}
                  date={o.createdAt}
                  deliveryUrl={o.deliveryUrl}
                />
              ))}
            </section>
          )}

          {/* Permit Orders */}
          {permits.length > 0 && (
            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
                Permit Services
              </h2>
              {permits.map((o) => (
                <OrderRow
                  key={o.id}
                  label={o.tierName}
                  amount={o.amount}
                  status={o.deliveryStatus}
                  date={o.createdAt}
                  deliveryUrl={o.deliveryUrl}
                  detailHref={`/permits/${o.id}`}
                />
              ))}
            </section>
          )}

          {/* Architect VIP Orders */}
          {archVip.length > 0 && (
            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
                Architect VIP
              </h2>
              {archVip.map((o) => (
                <OrderRow
                  key={o.id}
                  label={o.tierName}
                  amount={o.amount}
                  status={o.deliveryStatus}
                  date={o.createdAt}
                  deliveryUrl={o.deliveryUrl}
                  detailHref={`/architect-vip/${o.id}`}
                />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  )
}
