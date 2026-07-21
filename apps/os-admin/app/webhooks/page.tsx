'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { api } from '@/lib/api'
import {
  Webhook,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  CreditCard,
  Users,
  FileText,
  Shield,
  Filter,
} from 'lucide-react'

interface WebhookEvent {
  id: string
  type: string
  entityType: string
  occurredAt: string
  payload?: any
}

// Webhook event categories and their display metadata
const EVENT_CATEGORIES: Record<string, { label: string; color: string; icon: any }> = {
  'PAYMENT': { label: 'Payment', color: 'text-emerald-600 bg-emerald-50', icon: CreditCard },
  'SUBSCRIPTION': { label: 'Subscription', color: 'text-blue-600 bg-blue-50', icon: Shield },
  'INVOICE': { label: 'Invoice', color: 'text-amber-600 bg-amber-50', icon: FileText },
  'CUSTOMER': { label: 'Customer', color: 'text-purple-600 bg-purple-50', icon: Users },
  'MILESTONE': { label: 'Milestone', color: 'text-orange-600 bg-orange-50', icon: CheckCircle2 },
}

function categorizeEvent(type: string): string {
  if (type.includes('PAYMENT') || type.includes('PAYOUT')) return 'PAYMENT'
  if (type.includes('SUBSCRIPTION')) return 'SUBSCRIPTION'
  if (type.includes('INVOICE')) return 'INVOICE'
  if (type.includes('CUSTOMER')) return 'CUSTOMER'
  if (type.includes('MILESTONE')) return 'MILESTONE'
  return 'PAYMENT'
}

function formatEventType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDays = Math.floor(diffHr / 24)
  return `${diffDays}d ago`
}

export default function WebhooksPage() {
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)

  async function fetchEvents() {
    try {
      const params: Record<string, any> = { limit: 50 }
      if (filter !== 'all') {
        params.entityType = filter
      }
      const data = await api.getEvents(params)
      setEvents(data.events || [])
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load webhook events')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    fetchEvents()
  }, [filter])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchEvents()
  }

  // Compute category counts
  const categoryCounts = events.reduce<Record<string, number>>((acc, e) => {
    const cat = categorizeEvent(e.type)
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(e => categorizeEvent(e.type) === filter)

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                <Webhook className="h-6 w-6 text-emerald-600" />
                Webhook Activity
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                Real-time Stripe webhook events processed by the platform
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Category Summary Cards */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {Object.entries(EVENT_CATEGORIES).map(([key, meta]) => {
              const Icon = meta.icon
              const count = categoryCounts[key] || 0
              return (
                <button
                  key={key}
                  onClick={() => setFilter(filter === key ? 'all' : key)}
                  className={`p-4 rounded-xl border text-left transition ${
                    filter === key
                      ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                      : 'border-zinc-200 bg-white hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`h-5 w-5 ${meta.color.split(' ')[0]}`} />
                    <span className="text-xl font-bold text-zinc-900">{count}</span>
                  </div>
                  <div className="text-xs font-medium text-zinc-600">{meta.label} Events</div>
                </button>
              )
            })}
          </div>

          {/* Handled Event Types Info */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-emerald-900 mb-2">Handled Webhook Types</h3>
            <div className="grid grid-cols-3 gap-2 text-xs text-emerald-700">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" />
                payment_intent.succeeded / failed
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" />
                customer.subscription.created / updated / deleted
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" />
                invoice.created / finalized / paid / payment_failed
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" />
                customer.updated / deleted
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" />
                payment_method.attached / detached
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" />
                transfer.created / account.updated
              </div>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-zinc-400" />
            <span className="text-sm text-zinc-500">
              {filter === 'all' ? 'Showing all events' : `Filtered: ${EVENT_CATEGORIES[filter]?.label || filter}`}
            </span>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-xs text-emerald-600 hover:underline"
              >
                Clear filter
              </button>
            )}
            <span className="ml-auto text-xs text-zinc-400">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Events Table */}
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-sm text-zinc-400">Loading webhook events...</div>
            ) : error ? (
              <div className="py-16 text-center">
                <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-600">{error}</p>
                <p className="text-xs text-zinc-400 mt-1">Ensure the API is running and webhook events are being recorded.</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="py-16 text-center">
                <Clock className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No webhook events yet</p>
                <p className="text-xs text-zinc-400 mt-1">Events will appear here as Stripe webhooks are processed.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">Event</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">Entity</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">Time</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-500">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => {
                    const cat = categorizeEvent(event.type)
                    const meta = EVENT_CATEGORIES[cat] || EVENT_CATEGORIES['PAYMENT']
                    const Icon = meta.icon
                    return (
                      <tr key={event.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-zinc-900">{formatEventType(event.type)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
                            <Icon className="h-3 w-3" />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-500">
                          {event.entityType}
                          {event.payload?.entityId && (
                            <span className="text-zinc-400 ml-1 font-mono text-xs">
                              {String(event.payload.entityId).slice(0, 8)}...
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-zinc-500">
                          <div>{timeAgo(event.occurredAt)}</div>
                          <div className="text-xs text-zinc-400">
                            {new Date(event.occurredAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-400 text-xs max-w-xs truncate">
                          {event.payload?.amount && `$${event.payload.amount}`}
                          {event.payload?.status && ` Status: ${event.payload.status}`}
                          {event.payload?.paymentIntentId && ` PI: ${String(event.payload.paymentIntentId).slice(0, 12)}...`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
