'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { api } from '@/lib/api'
import {
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  CreditCard,
  Building2,
  XCircle,
} from 'lucide-react'

interface SubscriptionMetrics {
  mrr: number
  activeCount: number
  trialCount: number
  churnRate: number
  planBreakdown: Array<{ plan: string; count: number; mrr: number }>
}

interface Subscription {
  id: string
  orgId: string
  orgName?: string
  planSlug: string
  status: string
  currentPeriodEnd?: string
  createdAt: string
  cancelAtPeriodEnd?: boolean
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  trialing: 'bg-blue-100 text-blue-700',
  past_due: 'bg-amber-100 text-amber-700',
  canceled: 'bg-red-100 text-red-700',
  incomplete: 'bg-zinc-100 text-zinc-700',
}

const PLAN_COLORS: Record<string, string> = {
  S1: 'bg-zinc-100 text-zinc-700',
  S2: 'bg-emerald-100 text-emerald-700',
  S3: 'bg-blue-100 text-blue-700',
  S4: 'bg-purple-100 text-purple-700',
  PACKAGE_A: 'bg-amber-100 text-amber-700',
  PACKAGE_B: 'bg-orange-100 text-orange-700',
  PACKAGE_C: 'bg-rose-100 text-rose-700',
  PACKAGE_D: 'bg-pink-100 text-pink-700',
}

export default function SubscriptionsPage() {
  const [metrics, setMetrics] = useState<SubscriptionMetrics | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  async function fetchData() {
    try {
      const [metricsData, subsData] = await Promise.allSettled([
        api.getSubscriptionMetrics(),
        api.getSubscriptions({ limit: 100 }),
      ])

      if (metricsData.status === 'fulfilled') {
        setMetrics(metricsData.value.metrics || metricsData.value as any)
      }
      if (subsData.status === 'fulfilled') {
        setSubscriptions(subsData.value.subscriptions || [])
      }
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const filteredSubs = statusFilter === 'all'
    ? subscriptions
    : subscriptions.filter(s => s.status === statusFilter)

  // Compute status breakdown
  const statusCounts = subscriptions.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1
    return acc
  }, {})

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-emerald-600" />
                Subscription Analytics
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                Real-time subscription metrics from Stripe webhook data
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

          {loading ? (
            <div className="py-16 text-center text-sm text-zinc-400">Loading subscription data...</div>
          ) : error ? (
            <div className="py-16 text-center">
              <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-zinc-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    <span className="flex items-center text-xs text-emerald-600 font-medium">
                      <ArrowUpRight className="h-3 w-3" /> Live
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-zinc-900">
                    {formatCurrency(metrics?.mrr || 0)}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">Monthly Recurring Revenue</div>
                </div>

                <div className="bg-white rounded-xl border border-zinc-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-zinc-900">
                    {metrics?.activeCount || subscriptions.filter(s => s.status === 'active').length}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">Active Subscriptions</div>
                </div>

                <div className="bg-white rounded-xl border border-zinc-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <BarChart3 className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="text-2xl font-bold text-zinc-900">
                    {metrics?.trialCount || subscriptions.filter(s => s.status === 'trialing').length}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">Active Trials</div>
                </div>

                <div className="bg-white rounded-xl border border-zinc-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <TrendingUp className="h-5 w-5 text-red-500" />
                    {(metrics?.churnRate || 0) > 5 && (
                      <span className="flex items-center text-xs text-red-600 font-medium">
                        <ArrowDownRight className="h-3 w-3" /> High
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-zinc-900">
                    {(metrics?.churnRate || 0).toFixed(1)}%
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">Churn Rate</div>
                </div>
              </div>

              {/* Plan Breakdown + Status Breakdown */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                {/* Plan Breakdown */}
                <div className="bg-white rounded-xl border border-zinc-200 p-6">
                  <h2 className="text-sm font-semibold text-zinc-900 mb-4">Plan Distribution</h2>
                  {metrics?.planBreakdown && metrics.planBreakdown.length > 0 ? (
                    <div className="space-y-3">
                      {metrics.planBreakdown.map((plan) => (
                        <div key={plan.plan} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${PLAN_COLORS[plan.plan] || 'bg-zinc-100 text-zinc-700'}`}>
                              {plan.plan}
                            </span>
                            <span className="text-sm text-zinc-600">{plan.count} subscriber{plan.count !== 1 ? 's' : ''}</span>
                          </div>
                          <span className="text-sm font-medium text-zinc-900">{formatCurrency(plan.mrr)}/mo</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-400">No plan data available yet. Subscriptions created via Stripe webhooks will appear here.</p>
                  )}
                </div>

                {/* Status Breakdown */}
                <div className="bg-white rounded-xl border border-zinc-200 p-6">
                  <h2 className="text-sm font-semibold text-zinc-900 mb-4">Status Breakdown</h2>
                  {Object.keys(statusCounts).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(statusCounts).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-zinc-100 text-zinc-700'}`}>
                            {status}
                          </span>
                          <span className="text-sm font-medium text-zinc-900">{count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-400">No subscriptions yet. Data flows in via Stripe webhook handlers.</p>
                  )}
                </div>
              </div>

              {/* Webhook Integration Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Powered by Stripe Webhooks</h3>
                <p className="text-xs text-blue-700">
                  Subscription data is automatically synced via webhook handlers:
                  customer.subscription.created, customer.subscription.updated, customer.subscription.deleted,
                  invoice.paid, invoice.payment_failed, payment_method.attached/detached.
                </p>
              </div>

              {/* Subscriptions Table */}
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                  <h2 className="text-sm font-semibold text-zinc-900">All Subscriptions</h2>
                  <div className="flex items-center gap-2">
                    {['all', 'active', 'trialing', 'past_due', 'canceled'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-2 py-1 text-xs rounded font-medium transition ${
                          statusFilter === s
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'text-zinc-500 hover:bg-zinc-100'
                        }`}
                      >
                        {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredSubs.length === 0 ? (
                  <div className="py-12 text-center">
                    <Building2 className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                    <p className="text-sm text-zinc-500">No subscriptions found</p>
                    <p className="text-xs text-zinc-400 mt-1">Subscriptions will appear as customers sign up through Stripe.</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50">
                        <th className="text-left px-4 py-3 font-medium text-zinc-500">Organization</th>
                        <th className="text-left px-4 py-3 font-medium text-zinc-500">Plan</th>
                        <th className="text-left px-4 py-3 font-medium text-zinc-500">Status</th>
                        <th className="text-left px-4 py-3 font-medium text-zinc-500">Created</th>
                        <th className="text-left px-4 py-3 font-medium text-zinc-500">Period End</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubs.map((sub) => (
                        <tr key={sub.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-zinc-900">{sub.orgName || sub.orgId?.slice(0, 8) + '...'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${PLAN_COLORS[sub.planSlug] || 'bg-zinc-100 text-zinc-700'}`}>
                              {sub.planSlug}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[sub.status] || 'bg-zinc-100 text-zinc-700'}`}>
                              {sub.status}
                              {sub.cancelAtPeriodEnd && ' (canceling)'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-zinc-500">{formatDate(sub.createdAt)}</td>
                          <td className="px-4 py-3 text-zinc-500">
                            {sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
