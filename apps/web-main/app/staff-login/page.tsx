import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Brain, ShieldCheck, Home, HardHat, Building2, ShoppingBag, Megaphone, ExternalLink,
  type LucideIcon,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Executive & Staff Sign In | Kealee',
  description: 'Internal sign-in hub for Kealee leadership and staff — every service, one directory.',
  robots: { index: false, follow: false },
}

// Portal URLs configured per environment
const ccUrl          = process.env.NEXT_PUBLIC_COMMAND_CENTER_URL     ?? ''
const adminUrl        = process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL      ?? ''
const ownerUrl         = process.env.NEXT_PUBLIC_PORTAL_OWNER_URL       ?? ''
const contractorUrl   = process.env.NEXT_PUBLIC_PORTAL_CONTRACTOR_URL  ?? ''
const developerUrl    = process.env.NEXT_PUBLIC_PORTAL_DEVELOPER_URL   ?? ''
const marketplaceUrl  = process.env.NEXT_PUBLIC_MARKETPLACE_URL        ?? ''
const marketingOsUrl  = process.env.NEXT_PUBLIC_MARKETING_OS_URL       ?? ''

interface StaffPortal {
  Icon:        LucideIcon
  color:       string
  role:        string
  description: string
  loginUrl:    string
}

const STAFF_PORTALS: StaffPortal[] = [
  {
    Icon:        Brain,
    color:       '#8B5CF6',
    role:        'Command Center',
    description: 'Operations oversight, AI workflow queue, concept review, and integration management.',
    loginUrl:    `${ccUrl}/login`,
  },
  {
    Icon:        ShieldCheck,
    color:       '#1A2B4A',
    role:        'Admin Console',
    description: 'Organization and user management, subscriptions, and platform configuration.',
    loginUrl:    `${adminUrl}/login`,
  },
  {
    Icon:        Home,
    color:       '#E8793A',
    role:        'Owner Portal',
    description: 'Homeowner project delivery — concepts, permits, budgets, and milestone approvals.',
    loginUrl:    `${ownerUrl}/login`,
  },
  {
    Icon:        HardHat,
    color:       '#2ABFBF',
    role:        'Contractor Portal',
    description: 'Bid management, job scheduling, and payout tracking for general contractors.',
    loginUrl:    `${contractorUrl}/login`,
  },
  {
    Icon:        Building2,
    color:       '#0F1D34',
    role:        'Developer Portal',
    description: 'Land and multi-project pipeline management for developers and investors.',
    loginUrl:    `${developerUrl}/login`,
  },
  {
    Icon:        ShoppingBag,
    color:       '#F59E0B',
    role:        'Marketplace',
    description: 'Vendor and service-provider operations across the Kealee marketplace.',
    loginUrl:    `${marketplaceUrl}/login`,
  },
  {
    Icon:        Megaphone,
    color:       '#DC2626',
    role:        'Marketing OS',
    description: 'Campaign automation, lead scoring, and outreach across every channel.',
    loginUrl:    `${marketingOsUrl}/login`,
  },
]

export default function StaffLoginPage() {
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
          Executive &amp; Staff Access
        </h1>
        <p className="mt-3 text-gray-400">
          Every Kealee service, one directory — for leadership and team members only
        </p>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {STAFF_PORTALS.map(({ Icon, color, role, description, loginUrl }) => (
            <a
              key={role}
              href={loginUrl}
              className="flex items-center gap-5 rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-sm"
            >
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${color}14` }}
              >
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

        <p className="mt-10 text-center text-sm text-gray-500">
          Not a staff member?{' '}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: '#E8793A' }}>
            Go to customer sign in →
          </Link>
        </p>
      </div>
    </div>
  )
}
