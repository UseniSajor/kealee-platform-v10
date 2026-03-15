'use client'

import { useEffect, useState } from 'react'
import { DollarSign, Plus, Pencil, Tag } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'

interface Plan {
  id: string
  name: string
  tier: string
  monthlyPriceCents: number
  annualPriceCents: number
  active: boolean
  leadCreditsPerMonth: number | null
  maxProjects: number | null
}

interface LeadPrice {
  id: string
  tradeCategory: string
  jurisdictionCode: string
  strategy: string
  flatPriceCents: number | null
  active: boolean
}

const TIER_COLORS: Record<string, string> = {
  FREE: '#38A169',
  STARTER: '#2ABFBF',
  PROFESSIONAL: '#E8793A',
  ENTERPRISE: '#1A2B4A',
}

export default function RevenueDashboard() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [prices, setPrices] = useState<LeadPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'plans' | 'lead-pricing'>('plans')

  useEffect(() => {
    Promise.all([
      apiFetch<{ plans: Plan[] }>('/revenue/plans?includeInactive=true').catch(() => ({ plans: [] })),
      apiFetch<{ prices: LeadPrice[] }>('/revenue/lead-pricing').catch(() => ({ prices: [] })),
    ]).then(([planRes, priceRes]) => {
      setPlans((planRes as any).plans ?? [])
      setPrices((priceRes as any).prices ?? [])
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>
            Revenue Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">Subscription plans and lead pricing configuration</p>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: '#2ABFBF' }}
        >
          <Plus className="h-4 w-4" />
          {tab === 'plans' ? 'New Plan' : 'New Price'}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-gray-200">
        {(['plans', 'lead-pricing'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-medium transition-colors ${
              tab === t
                ? 'border-b-2 text-teal-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={tab === t ? { borderBottomColor: '#2ABFBF' } : {}}
          >
            {t === 'plans' ? 'Subscription Plans' : 'Lead Pricing'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : tab === 'plans' ? (
        <div className="space-y-3">
          {plans.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-400">
              No subscription plans yet. Create your first plan to get started.
            </div>
          ) : (
            plans.map(plan => (
              <div key={plan.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: TIER_COLORS[plan.tier] ?? '#1A2B4A' }}
                  >
                    {plan.tier[0]}
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: '#1A2B4A' }}>{plan.name}</p>
                    <p className="text-xs text-gray-400">
                      ${(plan.monthlyPriceCents / 100).toFixed(0)}/mo · ${(plan.annualPriceCents / 100).toFixed(0)}/yr
                      {plan.leadCreditsPerMonth != null && ` · ${plan.leadCreditsPerMonth} leads/mo`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={plan.active
                      ? { backgroundColor: '#38A16915', color: '#38A169' }
                      : { backgroundColor: '#E8793A15', color: '#E8793A' }
                    }
                  >
                    {plan.active ? 'Active' : 'Inactive'}
                  </span>
                  <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {prices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-400">
              No lead pricing rules yet.
            </div>
          ) : (
            prices.map(price => (
              <div key={price.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
                    <Tag className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: '#1A2B4A' }}>
                      {price.tradeCategory.replace(/_/g, ' ')} — {price.jurisdictionCode}
                    </p>
                    <p className="text-xs text-gray-400">
                      {price.strategy === 'FLAT' && price.flatPriceCents != null
                        ? `$${(price.flatPriceCents / 100).toFixed(2)} flat`
                        : price.strategy}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: '#38A16915', color: '#38A169' }}
                  >
                    Active
                  </span>
                  <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
