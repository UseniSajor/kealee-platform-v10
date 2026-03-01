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
  ShieldCheck,
  Phone,
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
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const deliveryBadge: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Processing', color: 'bg-amber-100 text-amber-700', icon: Clock },
  generating: { label: 'Generating', color: 'bg-blue-100 text-blue-700', icon: Sparkles },
  ready: { label: 'Ready', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700', icon: CheckCircle },
}

export default function DashboardPage() {
  const { profile, loading: authLoading } = useProfile()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push('/auth/login?redirect=/dashboard')
      return
    }
    if (profile) {
      fetchOrders()
    }
  }, [profile, authLoading, router])

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders?limit=5`, {
        headers: { Authorization: `Bearer ${profile?.access_token || ''}` },
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch {
      // silently fail — dashboard still shows without orders
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

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-black text-gray-900">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-gray-500">
          Here&apos;s what&apos;s happening with your Kealee projects.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
              <Package className="text-sky-600" size={20} />
            </div>
            <span className="text-2xl font-black text-gray-900">{orders.length}</span>
          </div>
          <p className="text-sm text-gray-500">Total Orders</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <span className="text-2xl font-black text-gray-900">
              {orders.filter((o) => o.deliveryStatus === 'delivered' || o.deliveryStatus === 'ready').length}
            </span>
          </div>
          <p className="text-sm text-gray-500">Delivered</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="text-amber-600" size={20} />
            </div>
            <span className="text-2xl font-black text-gray-900">
              {orders.filter((o) => o.deliveryStatus === 'pending' || o.deliveryStatus === 'generating').length}
            </span>
          </div>
          <p className="text-sm text-gray-500">In Progress</p>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
          {orders.length > 0 && (
            <Link
              href="/dashboard/orders"
              className="text-sm font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-gray-400" size={24} />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="text-gray-400" size={28} />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              Browse our concept packages to get an AI-generated design concept for your project.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-sm transition"
            >
              Browse Packages <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.map((order) => {
              const badge = deliveryBadge[order.deliveryStatus] || deliveryBadge.pending
              const BadgeIcon = badge.icon
              return (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                      <Package className="text-sky-600" size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{order.packageName}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                      <BadgeIcon size={12} />
                      {badge.label}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      ${(order.amount / 100).toLocaleString()}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <ShieldCheck className="text-purple-600" size={20} />
            </div>
            <h3 className="font-bold text-gray-900">Join Builder Network</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            License-verified contractors get access to project leads and fair bid rotation.
          </p>
          <Link
            href="/network/join"
            className="text-sm font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            Apply now <ArrowRight size={14} />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Phone className="text-green-600" size={20} />
            </div>
            <h3 className="font-bold text-gray-900">Need Help?</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Our team is available to answer any questions about your project or concept package.
          </p>
          <a
            href="tel:+13015758777"
            className="text-sm font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            (301) 575-8777 <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </div>
  )
}
