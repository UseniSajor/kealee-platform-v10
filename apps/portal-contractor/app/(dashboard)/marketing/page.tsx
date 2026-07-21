'use client'

/**
 * /marketing — Contractor Growth Hub
 *
 * Surfaces the contractor_growth revenue hook (Grow tier upgrades)
 * alongside actionable marketing metrics: profile views, lead match rate,
 * bid win rate.  The RevenueHookInline renders the tiered upsell inline
 * so contractors can upgrade without leaving the page.
 */

import { useState } from 'react'
import { TrendingUp, Eye, Target, Trophy, Zap } from 'lucide-react'
import { RevenueHookInline, RevenueHookModal, type HookTier } from '@kealee/core-hooks'

const MOCK_STATS = [
  { label: 'Profile Views',  value: '142',  delta: '+18%',  icon: Eye,     color: '#2ABFBF' },
  { label: 'Lead Match Rate', value: '34%', delta: '+6 pts', icon: Target,  color: '#38A169' },
  { label: 'Bid Win Rate',   value: '22%',  delta: '+3 pts', icon: Trophy,  color: '#E8793A' },
  { label: 'Active Leads',   value: '8',    delta: '+2',     icon: Zap,     color: '#1A2B4A' },
]

export default function ContractorMarketingPage() {
  const [showModal, setShowModal] = useState(false)
  const [selectedTier, setSelectedTier] = useState<HookTier | null>(null)

  const handleSelect = (tier: HookTier) => {
    setSelectedTier(tier)
    if (tier.price === 0) {
      // Free tier — just close
      setShowModal(false)
    }
    // Paid tiers redirect to Stripe checkout via the component itself
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-5 w-5" style={{ color: '#E8793A' }} />
            <h1 className="text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>
              Grow Your Business
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Boost visibility, win more bids, and unlock premium lead matching.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#E8793A' }}
        >
          View Plans
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {MOCK_STATS.map(s => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div
              className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${s.color}15`, color: s.color }}
            >
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
            <p className="mt-0.5 text-xs text-gray-500">{s.label}</p>
            <p className="mt-1 text-xs font-medium" style={{ color: '#38A169' }}>{s.delta} this month</p>
          </div>
        ))}
      </div>

      {/* Revenue Hook — contractor_growth inline */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>
            Growth Plans
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Upgrade to reach more owners and win higher-value projects
          </p>
        </div>
        <div className="p-6">
          <RevenueHookInline
            stage="contractor_growth"
            onSelect={handleSelect}
          />
        </div>
      </div>

      {/* What's included section */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#1A2B4A' }}>
          What growth tools are included?
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: 'Priority Lead Matching',   desc: 'Appear first in project owner searches matching your trades' },
            { title: 'Verified Badge',            desc: 'Stand out with a platform-verified contractor badge on your profile' },
            { title: 'Bid Analytics',             desc: 'See exactly where you win and lose — and why' },
            { title: 'Direct Owner Messaging',    desc: 'Contact shortlisted project owners before bids are posted' },
            { title: 'Performance Reports',       desc: 'Monthly PDF summary of your activity, win rate, and revenue earned' },
            { title: 'SEO Profile Page',          desc: 'Public profile indexed by search engines with your specialties and reviews' },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-3">
              <span className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#2ABFBF' }}>✓</span>
              <div>
                <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>{f.title}</p>
                <p className="text-xs text-gray-400">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal triggered by "View Plans" button */}
      {showModal && (
        <RevenueHookModal
          stage="contractor_growth"
          onSelect={handleSelect}
          onDismiss={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
