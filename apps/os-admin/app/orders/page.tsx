'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { apiRequest } from '@/lib/api'
import Link from 'next/link'
import {
  Package,
  Clock,
  CheckCircle,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  TrendingUp,
} from 'lucide-react'

interface Order {
  id: string
  packageName: string
  packageTier: string
  amount: number
  currency: string
  status: string
  deliveryStatus: string
  deliveryUrl: string | null
  deliveredAt: string | null
  createdAt: string
  user: {
    id: string
    email: string
    name: string
  }
}

const deliveryBadge: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700' },
  generating: { label: 'Generating', bg: 'bg-blue-100', text: 'text-blue-700' },
  ready: { label: 'Ready', bg: 'bg-green-100', text: 'text-green-700' },
  delivered: { label: 'Delivered', bg: 'bg-green-100', text: 'text-green-700' },
}

const statusBadge: Record<string, { label: string; bg: string; text: string }> = {
  completed: { label: 'Paid', bg: 'bg-green-100', text: 'text-green-700' },
  refunded: { label: 'Refunded', bg: 'bg-red-100', text: 'text-red-700' },
  disputed: { label: 'Disputed', bg: 'bg-orange-100', text: 'text-orange-700' },
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [deliveryFilter, setDeliveryFilter] = useState('')
  const [page, setPage] = useState(0)
  const limit = 20

  useEffect(() => {
    fetchOrders()
  }, [page, deliveryFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      params.set('limit', limit.toString())
      params.set('offset', (page * limit).toString())
      if (deliveryFilter) params.set('deliveryStatus', deliveryFilter)
      if (search.trim()) params.set('search', search.trim())

      const data = await apiRequest<{ orders: Order[]; total: number }>(
        `/admin/orders?${params.toString()}`
      )
      setOrders(data.orders || [])
      setTotal(data.total || 0)
    } catch (err: any) {
      setError(err.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    fetchOrders()
  }

  const totalPages = Math.ceil(total / limit)

  // Summary stats
  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0)
  const pendingCount = orders.filter(
    (o) => o.deliveryStatus === 'pending' || o.deliveryStatus === 'generating'
  ).length

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="text-gray-600 mt-2">
              Manage concept package orders and fulfillment
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-5 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold mt-1">{total}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Page Revenue</p>
                  <p className="text-2xl font-bold mt-1">
                    ${(totalRevenue / 100).toLocaleString()}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Fulfillment</p>
                  <p className="text-2xl font-bold mt-1">{pendingCount}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by email or name..."
                    className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </form>

              {/* Delivery status filter */}
              <select
                value={deliveryFilter}
                onChange={(e) => {
                  setDeliveryFilter(e.target.value)
                  setPage(0)
                }}
                className="border rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="generating">Generating</option>
                <option value="ready">Ready</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>

          {/* Orders table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
                  <p className="mt-4 text-gray-600 text-sm">Loading orders...</p>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Package className="mx-auto mb-3 text-gray-300" size={40} />
                <p className="font-medium">No orders found</p>
                <p className="text-sm mt-1">Orders will appear here when customers make purchases.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Package
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Delivery
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => {
                    const delivery = deliveryBadge[order.deliveryStatus] || deliveryBadge.pending
                    const payment = statusBadge[order.status] || statusBadge.completed
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <Link
                            href={`/orders/${order.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            #{order.id.slice(-8).toUpperCase()}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {order.user?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500">{order.user?.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-900">{order.packageName}</p>
                          <p className="text-xs text-gray-500 capitalize">{order.packageTier}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-gray-900">
                            ${(order.amount / 100).toLocaleString()}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${payment.bg} ${payment.text}`}
                          >
                            {payment.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${delivery.bg} ${delivery.text}`}
                          >
                            {delivery.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t px-4 py-3 flex items-center justify-between bg-gray-50">
                <p className="text-sm text-gray-600">
                  Showing {page * limit + 1}-{Math.min((page + 1) * limit, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1.5 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1.5 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
