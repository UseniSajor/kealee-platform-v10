'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ArchitectVIPOrder {
  id: string
  tierName: string
  tier: string
  amount: number
  status: string
  deliveryStatus: string
  createdAt: string
  deliveryUrl?: string
  deliveredAt?: string
  architectId?: string
  intakeId?: string
}

const DELIVERY_STATUS_CONFIG: Record<string, { label: string; color: string; step: number }> = {
  pending:            { label: 'Submitted',         color: 'bg-yellow-50 text-yellow-700 border-yellow-200',  step: 0 },
  architect_assigned: { label: 'Architect Assigned', color: 'bg-purple-50 text-purple-700 border-purple-200', step: 1 },
  in_progress:        { label: 'Drawings In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200',     step: 2 },
  review:             { label: 'Under Review',       color: 'bg-indigo-50 text-indigo-700 border-indigo-200', step: 3 },
  delivered:          { label: 'Delivered',          color: 'bg-emerald-50 text-emerald-700 border-emerald-200', step: 4 },
}

const PROCESS_STAGES = [
  'Submitted',
  'Architect Assigned',
  'Drawings In Progress',
  'Under Review',
  'Delivered',
]

export default function ArchitectVIPPortalPage() {
  const [orders, setOrders] = useState<ArchitectVIPOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/architect-vip/orders')
      .then((r) => (r.ok ? r.json() : []))
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Architect VIP</h1>
          <p className="text-sm text-gray-500 mt-1">
            {orders.length} order{orders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/architect-vip"
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#E8793A' }}
        >
          + New Order
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="font-semibold text-gray-700 mb-2">No Architect VIP orders yet</p>
          <p className="text-sm text-gray-400 mb-6">
            Get a complete permit-ready drawing set from a licensed architect in as little as 3 business days.
          </p>
          <Link
            href="/architect-vip"
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#E8793A' }}
          >
            Start Architect VIP
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const st = DELIVERY_STATUS_CONFIG[order.deliveryStatus] ?? {
              label: order.deliveryStatus, color: 'bg-gray-100 text-gray-600 border-gray-200', step: -1,
            }
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800">{order.tierName}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Ordered {new Date(order.createdAt).toLocaleDateString()}
                      {order.architectId && ' · Architect assigned'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-800">${(order.amount / 100).toFixed(0)}</p>
                    <span className={`inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                </div>

                {/* Step progress */}
                <div className="mb-4">
                  <div className="flex gap-1 mb-2">
                    {PROCESS_STAGES.map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 h-1.5 rounded-full transition-all"
                        style={{ backgroundColor: i <= st.step ? '#E8793A' : '#E5E7EB' }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between">
                    {PROCESS_STAGES.map((stage, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-medium"
                        style={{ color: i <= st.step ? '#E8793A' : '#94A3B8' }}
                      >
                        {stage.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                </div>

                {order.deliveryUrl ? (
                  <a
                    href={order.deliveryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#E8793A' }}
                  >
                    Download Drawings →
                  </a>
                ) : (
                  <div className="rounded-lg p-3 text-xs text-gray-500" style={{ backgroundColor: '#F8FAFC' }}>
                    {st.step === 0 && 'An architect will be assigned to your project within 1 business day.'}
                    {st.step === 1 && 'Your assigned architect has started on your drawing set.'}
                    {st.step === 2 && 'Drawings are in progress. We\'ll notify you when they\'re ready for review.'}
                    {st.step === 3 && 'Your drawings are under review. Delivery is coming soon.'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-8 rounded-xl p-5" style={{ backgroundColor: 'rgba(232,121,58,0.06)', border: '1px solid rgba(232,121,58,0.2)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: '#C05621' }}>Questions about your project?</p>
        <p className="text-xs mb-2" style={{ color: '#E8793A' }}>Your Kealee project coordinator will reach out within 1 business day.</p>
        <a href="mailto:hello@kealee.com" className="text-sm font-semibold hover:underline" style={{ color: '#C05621' }}>
          hello@kealee.com →
        </a>
      </div>
    </div>
  )
}
