'use client'

import { useState, useEffect } from 'react'
import { useProfile } from '@kealee/auth/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Package,
  Clock,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Loader2,
  Search,
} from 'lucide-react'

interface Order {
  id: string
  packageName: string
  packageTier: string
  amount: number
  currency: string
  status: string
  deliveryStatus: string
  createdAt: string
  deliveredAt: string | null
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const deliveryBadge: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Processing', color: 'bg-amber-100 text-amber-700', icon: Clock },
  generating: { label: 'Generating', color: 'bg-blue-100 text-blue-700', icon: Sparkles },
  ready: { label: 'Ready', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700', icon: CheckCircle },
}

const tierLabel: Record<string, string> = {
  essential: 'Essential',
  professional: 'Professional',
  premium: 'Premium',
  'white-glove': 'White Glove',
}

export default function OrdersPage() {
  const { profile, loading: authLoading } = useProfile()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'delivered'>('all')

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push('/auth/login?redirect=/dashboard/orders')
      return
    }
    if (profile) fetchOrders()
  }, [profile, authLoading, router])

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${profile?.access_token || ''}` },
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-sky-600" size={32} />
      </div>
    )
  }

  const filtered = orders.filter((o) => {
    if (filter === 'pending') return o.deliveryStatus === 'pending' || o.deliveryStatus === 'generating'
    if (filter === 'delivered') return o.deliveryStatus === 'ready' || o.deliveryStatus === 'delivered'
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">My Orders</h1>
        <p className="mt-1 text-gray-500">Track your concept packages and deliveries.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'pending', 'delivered'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              filter === f
                ? 'bg-sky-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'All' : f === 'pending' ? 'In Progress' : 'Delivered'}
          </button>
        ))}
      </div>

      {/* Order list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-gray-400" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 text-center py-16 px-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-gray-400" size={28} />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">
            {filter === 'all' ? 'No orders yet' : 'No matching orders'}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {filter === 'all'
              ? 'Browse our concept packages to get started.'
              : 'Try a different filter.'}
          </p>
          {filter === 'all' && (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-sm transition"
            >
              Browse Packages <ArrowRight size={16} />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const badge = deliveryBadge[order.deliveryStatus] || deliveryBadge.pending
            const BadgeIcon = badge.icon
            return (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="block bg-white rounded-2xl border border-gray-200 hover:border-sky-300 hover:shadow-md transition p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center shrink-0">
                      <Package className="text-sky-600" size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{order.packageName}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {tierLabel[order.packageTier] || order.packageTier} &middot;{' '}
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                      <BadgeIcon size={12} />
                      {badge.label}
                    </span>
                    <p className="text-lg font-black text-gray-900 mt-1">
                      ${(order.amount / 100).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
