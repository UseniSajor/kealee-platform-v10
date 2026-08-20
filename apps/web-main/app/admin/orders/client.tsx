'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  Download,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  UserPlus,
} from 'lucide-react'
import { ADMIN_SETTABLE_STATUSES, ORDER_STATUS_META, type OrderStatus } from '@/lib/order-status'

interface OrderRow {
  id: string
  productKey: string
  productLabel: string
  clientName: string | null
  contactEmail: string | null
  projectAddress: string | null
  state: string | null
  county: string | null
  coverage: string | null
  status: OrderStatus
  statusLabel: string
  waitingOn: 'kealee' | 'customer' | 'none'
  createdAt: string | null
  ageDays: number | null
  missingCount: number
  missingItems: string[]
  fulfillmentStatus: string | null
  requiresHumanFulfillment: boolean
  fulfillmentFallbackReason: string | null
  assignedReviewer: string | null
}

const PRODUCTS = [
  ['', 'All products'],
  ['whole_home_concept', 'Design Concept'],
  ['cost_estimate', 'Detailed Estimate'],
  ['certified_estimate', 'Certified Estimate'],
  ['preliminary_site_plan', 'Preliminary Site Plan'],
  ['verified_site_feasibility', 'Verified Site Feasibility'],
  ['permit_site_plan', 'Permit Site Plan'],
  ['permit_path_only', 'Permit Readiness'],
] as const

export function AdminOrdersClient() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [filters, setFilters] = useState({
    product: '',
    state: '',
    status: '',
    olderThanDays: '',
    needsAttention: false,
    q: '',
  })

  const queryString = useCallback(() => {
    const params = new URLSearchParams()
    if (filters.product) params.set('product', filters.product)
    if (filters.state) params.set('state', filters.state)
    if (filters.status) params.set('status', filters.status)
    if (filters.olderThanDays) params.set('olderThanDays', filters.olderThanDays)
    if (filters.needsAttention) params.set('needsAttention', 'true')
    if (filters.q) params.set('q', filters.q)
    return params.toString()
  }, [filters])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/orders?${queryString()}`, { cache: 'no-store' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Failed to load orders')
      setOrders(body.orders ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [queryString])

  useEffect(() => {
    void load()
  }, [load])

  async function patchOrder(id: string, body: Record<string, unknown>) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        setError(payload.error ?? 'Update failed')
        return
      }
      await load()
    } finally {
      setBusyId('')
    }
  }

  async function retry(id: string) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/orders/${id}/retry`, { method: 'POST' })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) setError(payload.error ?? 'Retry failed')
      await load()
    } finally {
      setBusyId('')
    }
  }

  const attentionCount = orders.filter(
    order => order.requiresHumanFulfillment || order.status === 'failed',
  ).length

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Orders</h1>
            <p className="mt-1 text-sm text-slate-500">
              {orders.length} shown
              {attentionCount > 0 && (
                <span className="ml-2 font-semibold text-amber-700">
                  · {attentionCount} need a human
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <a
              href={`/api/admin/orders?${queryString()}&format=csv`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              <Download className="h-4 w-4" /> Export CSV
            </a>
          </div>
        </header>

        <section className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
            Product
            <select
              value={filters.product}
              onChange={event => setFilters(f => ({ ...f, product: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            >
              {PRODUCTS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
            State
            <input
              value={filters.state}
              onChange={event => setFilters(f => ({ ...f, state: event.target.value }))}
              placeholder="MD"
              maxLength={2}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase text-slate-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
            Status
            <select
              value={filters.status}
              onChange={event => setFilters(f => ({ ...f, status: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            >
              <option value="">All statuses</option>
              {ADMIN_SETTABLE_STATUSES.map(status => (
                <option key={status} value={status}>{ORDER_STATUS_META[status].label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
            Older than (days)
            <input
              type="number"
              min={0}
              value={filters.olderThanDays}
              onChange={event => setFilters(f => ({ ...f, olderThanDays: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
            Search
            <span className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={filters.q}
                onChange={event => setFilters(f => ({ ...f, q: event.target.value }))}
                placeholder="name, email, address"
                className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm text-slate-900"
              />
            </span>
          </label>
          <label className="flex items-end gap-2 text-xs font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={filters.needsAttention}
              onChange={event => setFilters(f => ({ ...f, needsAttention: event.target.checked }))}
              className="mb-2.5"
            />
            <span className="mb-2">Needs attention only</span>
          </label>
        </section>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertTriangle className="h-4 w-4" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading orders…
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="font-semibold text-slate-700">No orders match these filters.</p>
            <p className="mt-1 text-sm text-slate-500">
              Clear a filter, or check back after the next intake comes in.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Missing</th>
                  <th className="px-4 py-3">Fulfillment</th>
                  <th className="px-4 py-3">Age</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(order => (
                  <tr key={order.id} className={order.requiresHumanFulfillment ? 'bg-amber-50/60' : ''}>
                    <td className="px-4 py-3 align-top">
                      <p className="font-semibold text-slate-900">{order.clientName ?? 'Unnamed'}</p>
                      <p className="text-xs text-slate-500">{order.contactEmail}</p>
                      <a
                        href={`/orders/${order.id}`}
                        className="text-[11px] text-orange-700 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        customer view
                      </a>
                    </td>
                    <td className="px-4 py-3 align-top text-slate-700">{order.productLabel}</td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-slate-700">{order.projectAddress ?? '—'}</p>
                      <p className="text-xs text-slate-500">
                        {[order.county, order.state].filter(Boolean).join(', ') || 'jurisdiction pending'}
                        {order.coverage && ` · ${order.coverage}`}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <select
                        value={order.status}
                        disabled={busyId === order.id}
                        onChange={event => void patchOrder(order.id, { status: event.target.value })}
                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-semibold text-slate-900"
                      >
                        {ADMIN_SETTABLE_STATUSES.map(status => (
                          <option key={status} value={status}>
                            {ORDER_STATUS_META[status].label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-[11px] text-slate-500">waiting on {order.waitingOn}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {order.missingCount > 0 ? (
                        <details>
                          <summary className="cursor-pointer text-xs font-bold text-amber-700">
                            {order.missingCount} item{order.missingCount === 1 ? '' : 's'}
                          </summary>
                          <ul className="mt-1 space-y-0.5">
                            {order.missingItems.map(item => (
                              <li key={item} className="text-[11px] text-slate-600">• {item}</li>
                            ))}
                          </ul>
                        </details>
                      ) : (
                        <span className="text-xs text-emerald-700">complete</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-xs text-slate-700">{order.fulfillmentStatus ?? '—'}</p>
                      {order.fulfillmentFallbackReason && (
                        <p className="text-[11px] text-amber-700">{order.fulfillmentFallbackReason}</p>
                      )}
                      {order.assignedReviewer && (
                        <p className="text-[11px] text-slate-500">→ {order.assignedReviewer}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-slate-600">
                      {order.ageDays == null ? '—' : `${order.ageDays}d`}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => void retry(order.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        >
                          {busyId === order.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                          Retry
                        </button>
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => {
                            const reviewer = window.prompt('Assign reviewer (email or name):', order.assignedReviewer ?? '')
                            if (reviewer !== null) void patchOrder(order.id, { assignedReviewer: reviewer || null })
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        >
                          <UserPlus className="h-3 w-3" /> Assign
                        </button>
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => {
                            const note = window.prompt('Internal note:')
                            if (note) void patchOrder(order.id, { note })
                          }}
                          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        >
                          Add note
                        </button>
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => {
                            if (window.confirm(`Email ${order.contactEmail ?? 'the customer'} their order link?`)) {
                              void patchOrder(order.id, { notifyCustomer: true })
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        >
                          <Mail className="h-3 w-3" /> Notify
                        </button>
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => {
                            const items = window.prompt('What do you need from the customer? (separate with ;)')
                            if (items) {
                              void patchOrder(order.id, {
                                requestInformation: items.split(';').map(s => s.trim()).filter(Boolean),
                              })
                            }
                          }}
                          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        >
                          Request info
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
