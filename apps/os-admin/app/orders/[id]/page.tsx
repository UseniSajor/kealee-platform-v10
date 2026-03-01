'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { apiRequest } from '@/lib/api'
import Link from 'next/link'
import {
  ArrowLeft,
  Package,
  CreditCard,
  User,
  Calendar,
  CheckCircle,
  Clock,
  Sparkles,
  Save,
  ExternalLink,
  Mail,
  Phone,
} from 'lucide-react'

interface OrderDetail {
  id: string
  userId: string
  packageName: string
  packageTier: string
  amount: number
  currency: string
  status: string
  deliveryStatus: string
  deliveryUrl: string | null
  deliveredAt: string | null
  stripeSessionId: string
  stripePaymentIntentId: string | null
  funnelSessionId: string | null
  metadata: any
  createdAt: string
  updatedAt: string
  user: {
    id: string
    email: string
    name: string
    phone: string | null
    createdAt: string
  }
}

const deliveryOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'generating', label: 'Generating' },
  { value: 'ready', label: 'Ready for Download' },
  { value: 'delivered', label: 'Delivered' },
]

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Editable fields
  const [deliveryStatus, setDeliveryStatus] = useState('')
  const [deliveryUrl, setDeliveryUrl] = useState('')
  const [orderStatus, setOrderStatus] = useState('')

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const data = await apiRequest<{ order: OrderDetail }>(
        `/admin/orders/${orderId}`
      )
      setOrder(data.order)
      setDeliveryStatus(data.order.deliveryStatus)
      setDeliveryUrl(data.order.deliveryUrl || '')
      setOrderStatus(data.order.status)
    } catch (err: any) {
      setError(err.message || 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setSaved(false)
      setError(null)

      await apiRequest(`/admin/orders/${orderId}`, {
        method: 'PATCH',
        body: {
          deliveryStatus,
          deliveryUrl: deliveryUrl.trim() || null,
          status: orderStatus,
        },
      })

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      // Refresh order data
      await fetchOrder()
    } catch (err: any) {
      setError(err.message || 'Failed to update order')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          {/* Back link */}
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 mb-6 transition"
          >
            <ArrowLeft size={16} /> Back to Orders
          </Link>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                <p className="mt-4 text-gray-600 text-sm">Loading order...</p>
              </div>
            </div>
          ) : error && !order ? (
            <div className="rounded-md bg-red-50 p-6 text-center">
              <p className="text-red-800 font-medium">{error}</p>
              <button
                onClick={() => router.push('/orders')}
                className="mt-4 text-sm text-red-600 hover:underline"
              >
                Back to orders
              </button>
            </div>
          ) : order ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-3xl font-bold">
                    Order #{order.id.slice(-8).toUpperCase()}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">
                    ${(order.amount / 100).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">{order.currency.toUpperCase()}</p>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>
              )}

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left column — order info + customer */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Order details */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Package size={18} className="text-gray-400" />
                      Order Details
                    </h2>
                    <dl className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm text-gray-500">Package</dt>
                        <dd className="text-sm font-semibold text-gray-900 mt-0.5">
                          {order.packageName}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Tier</dt>
                        <dd className="text-sm font-semibold text-gray-900 mt-0.5 capitalize">
                          {order.packageTier}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Stripe Session</dt>
                        <dd className="text-sm font-mono text-gray-700 mt-0.5 break-all">
                          {order.stripeSessionId}
                        </dd>
                      </div>
                      {order.stripePaymentIntentId && (
                        <div>
                          <dt className="text-sm text-gray-500">Payment Intent</dt>
                          <dd className="text-sm font-mono text-gray-700 mt-0.5 break-all">
                            {order.stripePaymentIntentId}
                          </dd>
                        </div>
                      )}
                      {order.funnelSessionId && (
                        <div>
                          <dt className="text-sm text-gray-500">Funnel Session</dt>
                          <dd className="text-sm font-mono text-gray-700 mt-0.5 break-all">
                            {order.funnelSessionId}
                          </dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-sm text-gray-500">Last Updated</dt>
                        <dd className="text-sm text-gray-700 mt-0.5">
                          {new Date(order.updatedAt).toLocaleString()}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Customer info */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User size={18} className="text-gray-400" />
                      Customer
                    </h2>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
                        {(order.user?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">
                          {order.user?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1.5">
                          <Mail size={13} /> {order.user?.email}
                        </p>
                        {order.user?.phone && (
                          <p className="text-sm text-gray-600 flex items-center gap-1.5">
                            <Phone size={13} /> {order.user.phone}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 flex items-center gap-1.5">
                          <Calendar size={12} /> Account created{' '}
                          {new Date(order.user?.createdAt).toLocaleDateString()}
                        </p>
                        <Link
                          href={`/users/${order.userId}`}
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                        >
                          View user profile <ExternalLink size={11} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column — fulfillment controls */}
                <div className="space-y-6">
                  {/* Fulfillment panel */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Sparkles size={18} className="text-gray-400" />
                      Fulfillment
                    </h2>

                    <div className="space-y-4">
                      {/* Payment status */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Payment Status
                        </label>
                        <select
                          value={orderStatus}
                          onChange={(e) => setOrderStatus(e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="completed">Paid</option>
                          <option value="refunded">Refunded</option>
                          <option value="disputed">Disputed</option>
                        </select>
                      </div>

                      {/* Delivery status */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Delivery Status
                        </label>
                        <select
                          value={deliveryStatus}
                          onChange={(e) => setDeliveryStatus(e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          {deliveryOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Delivery URL */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Delivery URL
                        </label>
                        <input
                          type="url"
                          value={deliveryUrl}
                          onChange={(e) => setDeliveryUrl(e.target.value)}
                          placeholder="https://storage.kealee.com/concepts/..."
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          File URL for customer download
                        </p>
                      </div>

                      {/* Save button */}
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                            Saving...
                          </>
                        ) : saved ? (
                          <>
                            <CheckCircle size={16} />
                            Saved!
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            Update Order
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Clock size={18} className="text-gray-400" />
                      Timeline
                    </h2>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <CreditCard size={14} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Payment received</p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {order.deliveryStatus !== 'pending' && (
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <Sparkles size={14} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Concept generation started
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.updatedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                      {order.deliveredAt && (
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <CheckCircle size={14} className="text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Delivered</p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.deliveredAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
