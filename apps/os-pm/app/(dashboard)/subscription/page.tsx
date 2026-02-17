'use client'

import { useState, useEffect } from 'react'
import { useRole } from '@/lib/role-context'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  Crown,
  Zap,
  Shield,
  Building2,
  ChevronRight,
  AlertTriangle,
  Loader2,
  CreditCard,
  ArrowUpRight,
  Users,
  FolderKanban,
} from 'lucide-react'
import Link from 'next/link'

// ── Tier metadata ───────────────────────────────────────────────────

const TIER_META: Record<string, { label: string; icon: any; color: string; bgColor: string; borderColor: string; badgeBg: string }> = {
  S1: { label: 'Starter', icon: Zap, color: 'text-neutral-700', bgColor: 'bg-neutral-50', borderColor: 'border-neutral-200', badgeBg: 'bg-neutral-100' },
  S2: { label: 'Builder', icon: Shield, color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', badgeBg: 'bg-emerald-100' },
  S3: { label: 'Pro', icon: Crown, color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', badgeBg: 'bg-blue-100' },
  S4: { label: 'Enterprise', icon: Building2, color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', badgeBg: 'bg-purple-100' },
}

const PM_TIER_META: Record<string, string> = {
  PACKAGE_A: 'Package A',
  PACKAGE_B: 'Package B',
  PACKAGE_C: 'Package C',
  PACKAGE_D: 'Package D',
}

// Feature counts per tier
const FEATURE_COUNTS: Record<string, number> = { S1: 8, S2: 20, S3: 35, S4: 50 }

export default function SubscriptionPage() {
  const { isInternal, tier: roleTier } = useRole()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  const [usage, setUsage] = useState<any>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  // Check for success query param
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('success') === 'true') {
        toast.success('Subscription activated! Welcome to Kealee.')
        window.history.replaceState({}, '', '/subscription')
      }
    }
  }, [])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [subRes, usageRes] = await Promise.allSettled([
          api.subscription.getSubscription(),
          api.subscription.getUsage(),
        ])

        if (subRes.status === 'fulfilled') setSubscription(subRes.value?.subscription || null)
        if (usageRes.status === 'fulfilled') setUsage(usageRes.value?.usage || null)
      } catch (err) {
        console.warn('Failed to load subscription data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleManageBilling = async () => {
    setPortalLoading(true)
    try {
      const res = await api.subscription.createPortalSession(`${window.location.origin}/subscription`)
      if (res?.url) {
        window.location.href = res.url
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to open billing portal')
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  // Internal staff view
  if (isInternal) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription</h1>
          <p className="text-gray-600">You have full platform access as an internal team member.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3">
            <Crown className="text-purple-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Internal Access</h2>
          </div>
          <p className="mt-4 text-gray-600">
            As a Kealee team member, you have access to all 50 platform features across all tiers.
            No subscription required.
          </p>
        </div>
      </div>
    )
  }

  // No subscription
  if (!subscription && (!usage || usage.status === 'NONE')) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription</h1>
          <p className="text-gray-600">Choose a plan to get started with Kealee</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <CreditCard className="text-blue-600" size={28} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Active Subscription</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Start your 14-day free trial today and unlock powerful project management tools.
          </p>
          <Link
            href="/subscription/pricing"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            View Plans & Pricing
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>
    )
  }

  // Active subscription view
  const tierKey = subscription?.tier || usage?.tier
  const meta = TIER_META[tierKey] || TIER_META.S1
  const TierIcon = meta.icon
  const featureCount = FEATURE_COUNTS[tierKey] || 0
  const isPmService = subscription?.type === 'PM_SERVICE' || usage?.packageType === 'PM_SERVICE'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription</h1>
          <p className="text-gray-600">Manage your plan, usage, and billing</p>
        </div>
        <Link
          href="/subscription/pricing"
          className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
        >
          View All Plans
          <ArrowUpRight size={16} />
        </Link>
      </div>

      {/* Current Plan Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${meta.badgeBg} rounded-xl flex items-center justify-center`}>
              <TierIcon className={meta.color} size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isPmService ? PM_TIER_META[subscription?.tier] || 'PM Services' : `${meta.label} Plan`}
              </h2>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${meta.bgColor} ${meta.color} ${meta.borderColor}`}>
                {isPmService ? 'Full-Service' : `Software ${tierKey}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {portalLoading ? <Loader2 className="animate-spin" size={16} /> : <CreditCard size={16} />}
              Manage Billing
            </button>
          </div>
        </div>

        {/* Plan details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                subscription?.status === 'ACTIVE' ? 'bg-green-500' :
                subscription?.cancelAtPeriodEnd ? 'bg-yellow-500' : 'bg-gray-400'
              }`} />
              <span className="font-medium text-gray-900">
                {subscription?.cancelAtPeriodEnd ? 'Cancelling' :
                 subscription?.status === 'ACTIVE' ? 'Active' :
                 subscription?.status || 'Active'}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Features Included</p>
            <p className="font-medium text-gray-900">{isPmService ? '50 (All)' : `${featureCount} of 50`}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Current Period Ends</p>
            <p className="font-medium text-gray-900">
              {subscription?.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : 'N/A'}
            </p>
          </div>
        </div>

        {subscription?.cancelAtPeriodEnd && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 mt-0.5 shrink-0" size={18} />
            <div>
              <p className="text-sm font-medium text-yellow-800">Subscription will cancel at the end of this billing period</p>
              <p className="text-sm text-yellow-700 mt-1">You can reactivate from the Stripe billing portal before the period ends.</p>
            </div>
          </div>
        )}
      </div>

      {/* Usage Cards */}
      {usage && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UsageCard
            icon={FolderKanban}
            label="Projects"
            used={usage.projects?.used || 0}
            max={usage.projects?.max || 0}
            percentage={usage.projects?.percentage || 0}
          />
          <UsageCard
            icon={Users}
            label="Team Members"
            used={usage.users?.used || 0}
            max={usage.users?.max || 0}
            percentage={usage.users?.percentage || 0}
          />
        </div>
      )}

      {/* Upgrade CTA (for non-enterprise software tiers) */}
      {!isPmService && tierKey !== 'S4' && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Ready to grow?</h3>
              <p className="text-blue-100">
                Upgrade your plan to unlock more features, projects, and team members.
              </p>
            </div>
            <Link
              href="/subscription/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors shrink-0"
            >
              Upgrade Plan
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Full-Service Upsell (for software-only users) */}
      {!isPmService && (
        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-dashed border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="text-gray-600" size={24} />
            <h3 className="text-lg font-bold text-gray-900">Unlock Full-Service Project Management</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Get dedicated PM hours, expert consulting, contractor coordination, and more.
            Full-service packages include everything in your software plan plus hands-on project management.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/subscription/pricing#full-service"
              className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-gray-800 text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              Compare Full-Service Plans
              <ChevronRight size={16} />
            </Link>
            <span className="text-sm text-gray-500">Starting at $1,750/month</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Usage Card Component ─────────────────────────────────────────────

function UsageCard({
  icon: Icon,
  label,
  used,
  max,
  percentage,
}: {
  icon: any
  label: string
  used: number
  max: number
  percentage: number
}) {
  const isWarning = percentage >= 80 && percentage < 100
  const isLimit = percentage >= 100

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon className="text-gray-600" size={20} />
          <h3 className="font-semibold text-gray-900">{label}</h3>
        </div>
        <span className={`text-sm font-medium ${
          isLimit ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-gray-500'
        }`}>
          {used} / {max === 999 ? 'Unlimited' : max}
        </span>
      </div>

      {/* Progress bar */}
      {max !== 999 && (
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isLimit ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}

      {isWarning && !isLimit && (
        <div className="mt-3 flex items-center gap-2 text-sm text-yellow-700">
          <AlertTriangle size={14} />
          <span>Approaching limit ({percentage}% used)</span>
        </div>
      )}
      {isLimit && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle size={14} />
          <span>Limit reached. Upgrade to add more.</span>
        </div>
      )}
    </div>
  )
}
