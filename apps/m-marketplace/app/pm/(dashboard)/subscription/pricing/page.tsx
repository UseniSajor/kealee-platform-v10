'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@pm/lib/api'
import { useRole } from '@pm/lib/role-context'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Check,
  X,
  Zap,
  Shield,
  Crown,
  Building2,
  ChevronLeft,
  Loader2,
  Star,
  ArrowRight,
  Phone,
  Users,
  FolderKanban,
} from 'lucide-react'

// â”€â”€ Tier definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface PricingTier {
  label: string
  monthlyPrice: number
  annualPrice: number
  projects: number | string
  users: number
}

interface SoftwarePackage {
  key: string
  name: string
  tagline: string
  icon: any
  popular: boolean
  color: string
  borderColor: string
  buttonColor: string
  buttonHover: string
  pricingTiers: PricingTier[]
  featureCount: number
  features: string[]
  support: string
  onboarding: string
}

const SOFTWARE_PACKAGES: SoftwarePackage[] = [
  {
    key: 'S1',
    name: 'Starter',
    tagline: 'For solo GCs and small subs getting organized',
    icon: Zap,
    popular: false,
    color: 'text-neutral-700',
    borderColor: 'border-neutral-200',
    buttonColor: 'bg-neutral-800 text-white',
    buttonHover: 'hover:bg-neutral-900',
    pricingTiers: [
      { label: 'Basic', monthlyPrice: 29, annualPrice: 23, projects: 1, users: 1 },
      { label: 'Standard', monthlyPrice: 49, annualPrice: 39, projects: 2, users: 1 },
      { label: 'Plus', monthlyPrice: 79, annualPrice: 63, projects: 3, users: 1 },
    ],
    featureCount: 8,
    features: [
      'Bid Tracker',
      'Daily Reports',
      'Punch List',
      'Progress Reports',
      'Mobile Field Access',
      'Change Order Tracking',
      'Contract Manager',
      'Safety Manager',
    ],
    support: 'Help center + community forum',
    onboarding: 'Self-serve (video tutorials + templates)',
  },
  {
    key: 'S2',
    name: 'Builder',
    tagline: 'For growing GCs and established subcontractors',
    icon: Shield,
    popular: true,
    color: 'text-emerald-700',
    borderColor: 'border-emerald-400',
    buttonColor: 'bg-emerald-600 text-white',
    buttonHover: 'hover:bg-emerald-700',
    pricingTiers: [
      { label: 'Basic', monthlyPrice: 149, annualPrice: 119, projects: 5, users: 3 },
      { label: 'Standard', monthlyPrice: 249, annualPrice: 199, projects: 7, users: 4 },
      { label: 'Plus', monthlyPrice: 349, annualPrice: 279, projects: 10, users: 5 },
    ],
    featureCount: 20,
    features: [
      'Everything in Starter',
      'Owner Dashboard',
      'Schedule Manager',
      'Lien Waiver Workflow',
      'Budget Reports',
      'Scope Matrix',
      'Permit Wizard',
      'Inspection Scheduler',
      'RFI Portal',
      'Submittal Manager',
      'COI Tracker',
      'QC Inspections',
      'Document Control',
    ],
    support: 'Email support (48hr response)',
    onboarding: 'Self-serve + 1 onboarding call (30 min)',
  },
  {
    key: 'S3',
    name: 'Pro',
    tagline: 'For mid-size GCs and multi-crew operations',
    icon: Crown,
    popular: false,
    color: 'text-blue-700',
    borderColor: 'border-blue-300',
    buttonColor: 'bg-blue-600 text-white',
    buttonHover: 'hover:bg-blue-700',
    pricingTiers: [
      { label: 'Basic', monthlyPrice: 599, annualPrice: 479, projects: 15, users: 8 },
      { label: 'Standard', monthlyPrice: 899, annualPrice: 719, projects: 20, users: 10 },
      { label: 'Plus', monthlyPrice: 1299, annualPrice: 1039, projects: 30, users: 15 },
    ],
    featureCount: 35,
    features: [
      'Everything in Builder',
      'AIA Pay Applications',
      'Retention Manager',
      'Sub Prequalification',
      'Look-Ahead Scheduler',
      'Cash Flow Dashboard',
      'Job Cost Reports',
      'Back-Charge Manager',
      'Sub Ratings',
      'AI Takeoff Analysis',
      'Labor Analytics',
      'As-Built Manager',
      'Selection Manager',
      'Warranty Portal',
    ],
    support: 'Priority email + chat (24hr response)',
    onboarding: '2 onboarding calls + data migration assistance',
  },
  {
    key: 'S4',
    name: 'Enterprise',
    tagline: 'For large GCs and multi-project operations',
    icon: Building2,
    popular: false,
    color: 'text-purple-700',
    borderColor: 'border-purple-300',
    buttonColor: 'bg-purple-600 text-white',
    buttonHover: 'hover:bg-purple-700',
    pricingTiers: [
      { label: 'Basic', monthlyPrice: 1999, annualPrice: 1599, projects: 50, users: 25 },
      { label: 'Standard', monthlyPrice: 3499, annualPrice: 2799, projects: 75, users: 35 },
      { label: 'Plus', monthlyPrice: 4999, annualPrice: 3999, projects: '100+', users: 50 },
    ],
    featureCount: 50,
    features: [
      'Everything in Pro',
      'Supplier Connect',
      'AI Meeting Minutes',
      'Weather Tracking',
      'AP Manager',
      'Code Monitor',
      'Cost Intelligence',
      'License Manager',
      'AI Scope Analyzer',
      'Bid Analytics',
      'Bonding Dashboard',
      'Tax Manager',
      'Capacity Tracker',
      'Integration Hub / API',
    ],
    support: 'Dedicated account manager + phone support',
    onboarding: 'Full onboarding program + custom training + data migration',
  },
]

const PM_PACKAGES = [
  { tier: 'A', name: 'Package A', price: 1750, hours: '5-10 hrs/week', projects: '1 project', features: ['Single project PM', 'Email support (48hr)', 'Weekly reports', 'Task tracking'] },
  { tier: 'B', name: 'Package B', price: 3750, hours: '15-20 hrs/week', projects: 'Up to 5 projects', features: ['Multi-project PM', 'Priority support', 'Bi-weekly reports', 'Contractor coordination'] },
  { tier: 'C', name: 'Package C', price: 9500, hours: '30-40 hrs/week', projects: 'Up to 20 projects', features: ['Dedicated PM', '24/7 support', 'Daily reports', 'Full contractor management', 'Budget optimization'] },
  { tier: 'D', name: 'Package D', price: 16500, hours: '40+ hrs/week', projects: 'Unlimited projects', features: ['Portfolio management', 'Dedicated account manager', 'Custom reporting', 'Strategic planning', 'White-glove service'] },
]

export default function PricingPage() {
  const router = useRouter()
  const { isInternal } = useRole()
  const [isAnnual, setIsAnnual] = useState(false)
  const [selectedPricingTier, setSelectedPricingTier] = useState<Record<string, number>>({
    S1: 1, S2: 1, S3: 1, S4: 1, // Default to "Standard" (index 1)
  })
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  const handleGetStarted = async (pkg: SoftwarePackage) => {
    const tierIndex = selectedPricingTier[pkg.key] || 1
    const pricingTier = ['basic', 'standard', 'plus'][tierIndex]

    setCheckoutLoading(pkg.key)
    try {
      const result = await api.subscription.createCheckoutSession({
        tier: pkg.key,
        pricingTier,
        interval: isAnnual ? 'year' : 'month',
        successUrl: `${window.location.origin}/pm/subscription?success=true`,
        cancelUrl: `${window.location.origin}/pm/subscription/pricing`,
      })

      if (result?.url) {
        window.location.href = result.url
      } else {
        toast.error('Failed to start checkout. Please try again.')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create checkout session')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const formatPrice = (price: number) => {
    return price >= 1000 ? `$${(price / 1000).toFixed(price % 1000 === 0 ? 0 : 1)}k` : `$${price}`
  }

  return (
    <div className="space-y-12 pb-16">
      {/* Back link */}
      <Link
        href="/pm/subscription"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ChevronLeft size={16} />
        Back to Subscription
      </Link>

      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Software-only â€” pure platform access, no professional services. Designed for contractors who want the tools and can self-manage. All plans include a 14-day free trial.
        </p>
        <p className="text-sm text-gray-400 mt-2 max-w-xl mx-auto">
          Packages Aâ€“D are full-service bundles (software + consulting + human expertise). The packages below are software-only.
        </p>

        {/* Billing Toggle */}
        <div className="mt-8 inline-flex items-center gap-3 bg-gray-100 p-1 rounded-full">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              !isAnnual ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              isAnnual ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annual
            <span className="ml-1.5 text-xs text-emerald-600 font-semibold">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Software Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {SOFTWARE_PACKAGES.map((pkg) => {
          const tierIdx = selectedPricingTier[pkg.key] || 1
          const pricing = pkg.pricingTiers[tierIdx]
          const price = isAnnual ? pricing.annualPrice : pricing.monthlyPrice
          const Icon = pkg.icon
          const isLoading = checkoutLoading === pkg.key

          return (
            <div
              key={pkg.key}
              className={`relative bg-white rounded-2xl border-2 ${
                pkg.popular ? pkg.borderColor : 'border-gray-200'
              } shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col`}
            >
              {/* Popular badge */}
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-4 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full shadow-md">
                    <Star size={12} />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-6 flex flex-col flex-1">
                {/* Tier header */}
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={pkg.color} size={20} />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{pkg.key}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{pkg.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{pkg.tagline}</p>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">${price}</span>
                    <span className="text-gray-500">/mo</span>
                  </div>
                  {isAnnual && (
                    <p className="text-xs text-gray-400 mt-1">
                      Billed annually (${price * 12}/yr)
                    </p>
                  )}
                </div>

                {/* Pricing tier selector */}
                <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg">
                  {pkg.pricingTiers.map((pt, idx) => (
                    <button
                      key={pt.label}
                      onClick={() => setSelectedPricingTier((prev) => ({ ...prev, [pkg.key]: idx }))}
                      className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                        tierIdx === idx
                          ? 'bg-white shadow-sm text-gray-900'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {pt.label}
                    </button>
                  ))}
                </div>

                {/* Limits */}
                <div className="flex items-center gap-4 mb-3 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <FolderKanban size={14} />
                    <span>{typeof pricing.projects === 'string' ? pricing.projects : pricing.projects} projects</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Users size={14} />
                    <span>{pricing.users} users</span>
                  </div>
                </div>

                {/* Support & onboarding */}
                <div className="text-xs text-gray-500 space-y-1 mb-5">
                  <p><span className="font-medium text-gray-600">Support:</span> {pkg.support}</p>
                  <p><span className="font-medium text-gray-600">Onboarding:</span> {pkg.onboarding}</p>
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleGetStarted(pkg)}
                  disabled={isLoading}
                  className={`w-full py-3 px-4 ${pkg.buttonColor} ${pkg.buttonHover} font-semibold rounded-lg shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Starting...
                    </>
                  ) : (
                    <>
                      Start Free Trial
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                {/* Feature list */}
                <div className="border-t border-gray-100 pt-5 flex-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    {pkg.featureCount} Features
                  </p>
                  <ul className="space-y-2">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="text-emerald-500 mt-0.5 shrink-0" size={14} />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Full-Service Section */}
      <div id="full-service" className="scroll-mt-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Full-Service Project Management</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Need hands-on PM expertise? Our full-service packages include everything in the software plans plus dedicated project managers, consulting, and contractor coordination.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {PM_PACKAGES.map((pkg) => (
            <div key={pkg.tier} className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-6">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Package {pkg.tier}</span>
              <h3 className="text-xl font-bold text-gray-900 mt-1 mb-2">{pkg.name}</h3>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-gray-900">${pkg.price.toLocaleString()}</span>
                <span className="text-gray-500">/mo</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">{pkg.hours} PM time</p>

              <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-5">
                <FolderKanban size={14} />
                <span>{pkg.projects}</span>
              </div>

              <ul className="space-y-2 border-t border-gray-100 pt-4">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="text-blue-500 mt-0.5 shrink-0" size={14} />
                  <span className="text-gray-700 font-medium">All 50 software features</span>
                </li>
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="text-blue-500 mt-0.5 shrink-0" size={14} />
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                className="mt-6 w-full py-3 px-4 border-2 border-gray-800 text-gray-800 font-semibold rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Software vs Full-Service comparison */}
      <div className="bg-gray-50 rounded-2xl p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Software-Only vs Full-Service</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Capability</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Software (S1-S4)</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Full-Service (A-D)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Platform Access', true, true],
                ['Mobile Field Access', true, true],
                ['AI-Powered Tools', 'S3+', 'B+'],
                ['API Access', 'S4 only', 'D only'],
                ['Dedicated PM', false, true],
                ['Consulting Services', false, true],
                ['Contractor Coordination', false, true],
                ['Permit Filing Services', false, 'B+'],
                ['Estimation Services', false, 'C+'],
                ['Custom Integrations', false, 'D only'],
              ].map(([capability, software, fullService], idx) => (
                <tr key={idx} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 px-4 text-gray-700">{capability as string}</td>
                  <td className="py-3 px-4 text-center">
                    {software === true ? <Check className="mx-auto text-emerald-500" size={16} /> :
                     software === false ? <X className="mx-auto text-gray-300" size={16} /> :
                     <span className="text-gray-600 text-xs">{software as string}</span>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {fullService === true ? <Check className="mx-auto text-emerald-500" size={16} /> :
                     fullService === false ? <X className="mx-auto text-gray-300" size={16} /> :
                     <span className="text-gray-600 text-xs">{fullService as string}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center py-8">
        <p className="text-sm text-gray-400">
          All plans include a 14-day free trial. No credit card required to start.
        </p>
      </div>
    </div>
  )
}

