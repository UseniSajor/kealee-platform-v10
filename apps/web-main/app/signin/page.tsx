import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight, Brain, ShieldCheck, HardHat, Building2, ShoppingBag, Megaphone, ExternalLink,
  type LucideIcon,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sign In | Kealee',
  description: 'Master sign-in hub for Kealee — property owners and staff, one page.',
}

const ownerUrl        = process.env.NEXT_PUBLIC_PORTAL_OWNER_URL       ?? ''
const ccUrl            = process.env.NEXT_PUBLIC_COMMAND_CENTER_URL     ?? ''
const adminUrl         = process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL      ?? ''
const contractorUrl    = process.env.NEXT_PUBLIC_PORTAL_CONTRACTOR_URL  ?? ''
const developerUrl     = process.env.NEXT_PUBLIC_PORTAL_DEVELOPER_URL   ?? ''
const marketplaceUrl   = process.env.NEXT_PUBLIC_MARKETPLACE_URL        ?? ''
const marketingOsUrl   = process.env.NEXT_PUBLIC_MARKETING_OS_URL       ?? ''

// Contractor and developer acquisition/account entry is consolidated in the Marketplace.
const ROLE_PORTALS = [
  {
    emoji:       '🏠',
    role:        'Homeowner',
    tagline:     'Owner Portal',
    description: 'Track your renovation or new build. Manage payments, milestones, and communicate with your team.',
    accent:      '#2ABFBF',
    loginUrl:    `${ownerUrl}/login`,
    signupUrl:   `${ownerUrl}/signup`,
    signupLabel: 'Create Account',
  },
  {
    emoji:       '🔨',
    role:        'Contractor',
    tagline:     'Contractor Portal',
    description: 'Manage leads, active projects, bids, field operations, and payments.',
    accent:      '#E8793A',
    loginUrl:    '/auth/login?next=/marketplace',
    signupUrl:   '/marketplace?audience=contractor',
    signupLabel: 'Apply to Join',
  },
  {
    emoji:       '🏢',
    role:        'Developer',
    tagline:     'Developer Portal',
    description: 'Land pipeline, feasibility analysis, capital stack, and multi-project portfolio analytics.',
    accent:      '#805AD5',
    loginUrl:    '/auth/login?next=/marketplace',
    signupUrl:   '/marketplace?audience=developer',
    signupLabel: 'Request Access',
  },
]

interface StaffPortal {
  Icon:        LucideIcon
  color:       string
  role:        string
  description: string
  loginUrl:    string
}

const STAFF_PORTALS: StaffPortal[] = [
  { Icon: Brain,       color: '#8B5CF6', role: 'Command Center',   description: 'Operations oversight, AI workflow queue, concept review, and integration management.', loginUrl: `${ccUrl}/login` },
  { Icon: ShieldCheck, color: '#1A2B4A', role: 'Admin Console',    description: 'Organization and user management, subscriptions, and platform configuration.',         loginUrl: `${adminUrl}/login` },
  { Icon: HardHat,     color: '#2ABFBF', role: 'Contractor Portal', description: 'Bid management, job scheduling, and payout tracking for general contractors.',        loginUrl: `${contractorUrl}/login` },
  { Icon: Building2,   color: '#0F1D34', role: 'Developer Portal', description: 'Land and multi-project pipeline management for developers and investors.',            loginUrl: `${developerUrl}/login` },
  { Icon: ShoppingBag, color: '#F59E0B', role: 'Marketplace',      description: 'Vendor and service-provider operations across the Kealee marketplace.',                loginUrl: `${marketplaceUrl}/login` },
  { Icon: Megaphone,   color: '#DC2626', role: 'Marketing OS',     description: 'Campaign automation, lead scoring, and outreach across every channel.',                loginUrl: `${marketingOsUrl}/login` },
]

export default function MasterSignInPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <div className="py-16 text-center" style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #0F1D34 100%)' }}>
        <div className="mb-2 inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: '#E8793A' }}>
            <span className="text-base font-bold text-white font-display">K</span>
          </div>
          <span className="text-2xl font-bold text-white font-display">Kealee</span>
        </div>
        <h1 className="mt-4 text-3xl font-bold text-white font-display sm:text-4xl">
          Sign in to Kealee
        </h1>
        <p className="mt-3 text-gray-400">
          Property owners and Kealee staff — everything on one page
        </p>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 space-y-16">

        {/* Section 1: Property Owner, Contractor & Developer */}
        <section>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#E8793A' }}>
            Property Owner, Contractor &amp; Developer
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            {ROLE_PORTALS.map((portal) => (
              <div
                key={portal.role}
                className="relative flex flex-col rounded-2xl border border-gray-200 bg-white p-7 shadow-sm"
              >
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl" style={{ backgroundColor: portal.accent }} />

                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl text-2xl" style={{ backgroundColor: `${portal.accent}18` }}>
                  {portal.emoji}
                </div>

                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: portal.accent }}>
                  {portal.tagline}
                </p>
                <h2 className="text-xl font-bold font-display mb-2" style={{ color: '#1A2B4A' }}>
                  {portal.role}
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-6">
                  {portal.description}
                </p>

                <div className="space-y-2">
                  <a
                    href={portal.loginUrl || '#'}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: portal.accent }}
                  >
                    Sign In <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href={portal.signupUrl || '#'}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-colors hover:bg-gray-50"
                    style={{ borderColor: portal.accent, color: portal.accent }}
                  >
                    {portal.signupLabel}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Section 2: Staff & Leadership */}
        <section>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#1A2B4A' }}>
            Staff &amp; Leadership
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {STAFF_PORTALS.map(({ Icon, color, role, description, loginUrl }) => (
              <a
                key={role}
                href={loginUrl}
                className="flex items-center gap-5 rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-sm"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}14` }}>
                  <Icon className="h-6 w-6" style={{ color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold font-display" style={{ color: '#1A2B4A' }}>{role}</p>
                  <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{description}</p>
                </div>
                <ExternalLink className="h-4 w-4 flex-shrink-0 text-gray-400" />
              </a>
            ))}
          </div>
        </section>

        <p className="text-center text-sm text-gray-500">
          New to Kealee?{' '}
          <Link href="/concept" className="font-semibold hover:underline" style={{ color: '#E8793A' }}>
            Start a project →
          </Link>
        </p>
      </div>
    </div>
  )
}
