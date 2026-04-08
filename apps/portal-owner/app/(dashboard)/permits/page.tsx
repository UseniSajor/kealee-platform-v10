'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface PermitOrder {
  id: string
  tierName: string
  tier: string
  amount: number
  status: string
  deliveryStatus: string
  createdAt: string
  deliveryUrl?: string
  deliveredAt?: string
  intakeId?: string
}

const DELIVERY_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Pending',     color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  in_progress: { label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  ready:       { label: 'Ready',       color: 'bg-green-50 text-green-700 border-green-200' },
  delivered:   { label: 'Delivered',   color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

const TIER_DESCRIPTIONS: Record<string, string> = {
  research:     'Jurisdiction requirements, fee schedule, document checklist',
  filing:       'Complete permit-ready submission package',
  full_service: 'Full submission management + comment response',
  expedited:    'Priority queue, direct examiner contact',
}

export default function PermitsPage() {
  const [orders, setOrders] = useState<PermitOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/permits/orders')
      .then((r) => (r.ok ? r.json() : []))
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permit Orders</h1>
          <p className="text-sm text-gray-500 mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/permits"
          className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
        >
          + New Permit Order
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="font-semibold text-gray-700 mb-2">No permit orders yet</p>
          <p className="text-sm text-gray-400 mb-6">
            Start with a Permit Research package to understand what your jurisdiction requires.
          </p>
          <Link href="/permits" className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors">
            Start a Permit Order
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const st = DELIVERY_STATUS_LABELS[order.deliveryStatus] ?? { label: order.deliveryStatus, color: 'bg-gray-100 text-gray-600 border-gray-200' }
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800">{order.tierName}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {TIER_DESCRIPTIONS[order.tier] ?? order.tier}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Ordered {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-800">${(order.amount / 100).toFixed(0)}</p>
                    <span className={`inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  {(() => {
                    const stages = ['pending', 'in_progress', 'ready', 'delivered']
                    const current = stages.indexOf(order.deliveryStatus)
                    return (
                      <div className="flex gap-1">
                        {stages.map((stage, i) => (
                          <div
                            key={stage}
                            className="flex-1 h-1.5 rounded-full"
                            style={{
                              backgroundColor: i <= current ? '#2ABFBF' : '#E5E7EB',
                            }}
                          />
                        ))}
                      </div>
                    )
                  })()}
                </div>

                {order.deliveryUrl && (
                  <a
                    href={order.deliveryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                  >
                    View Deliverable →
                  </a>
                )}
                {!order.deliveryUrl && order.deliveryStatus === 'pending' && (
                  <p className="mt-3 text-xs text-gray-400">
                    Our team will begin work within 1 business day. You&apos;ll receive an email update.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-8 rounded-xl p-5" style={{ backgroundColor: 'rgba(42,191,191,0.06)', border: '1px solid rgba(42,191,191,0.2)' }}>
        <p className="text-sm font-semibold text-teal-800 mb-1">Questions about your permit order?</p>
        <p className="text-xs text-teal-600 mb-2">Our permit specialists are available by email.</p>
        <a href="mailto:permits@kealee.com" className="text-sm font-semibold text-teal-700 hover:underline">
          permits@kealee.com →
        </a>
      </div>
    </div>
  )
}
