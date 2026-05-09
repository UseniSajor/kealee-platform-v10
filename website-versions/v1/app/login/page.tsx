import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sign In | Kealee',
  description: 'Sign in to your Kealee portal — Homeowner, Contractor, Developer, or Command Center.',
}

// Portal URLs configured per environment
const ownerUrl      = process.env.NEXT_PUBLIC_PORTAL_OWNER_URL      ?? ''
const contractorUrl = process.env.NEXT_PUBLIC_PORTAL_CONTRACTOR_URL ?? ''
const developerUrl  = process.env.NEXT_PUBLIC_PORTAL_DEVELOPER_URL  ?? ''
const ccUrl         = process.env.NEXT_PUBLIC_COMMAND_CENTER_URL     ?? ''
const adminUrl      = process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL      ?? ''

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
    loginUrl:    `${contractorUrl}/login`,
    signupUrl:   `${contractorUrl}/signup`,
    signupLabel: 'Apply to Join',
  },
  {
    emoji:       '🏢',
    role:        'Developer',
    tagline:     'Developer Portal',
    description: 'Land pipeline, feasibility analysis, capital stack, and multi-project portfolio analytics.',
    accent:      '#805AD5',
    loginUrl:    `${developerUrl}/login`,
    signupUrl:   `${developerUrl}/signup`,
    signupLabel: 'Request Access',
  },
]

const STAFF_PORTALS = [
  {
    emoji:       '🧠',
    role:        'Command Center',
    description: 'Operations oversight, AI workflow queue, concept review, and integration management.',
    loginUrl:    `${ccUrl}/login`,
  },
  {
    emoji:       '⚙️',
    role:        'Admin Console',
    description: 'Organization and user management, subscriptions, and platform configuration.',
    loginUrl:    `${adminUrl}/login`,
  },
]

export default function LoginPage() {
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
          Select your role to access your portal
        </p>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">

        {/* Role portals */}
        <div className="grid gap-5 sm:grid-cols-3">
          {ROLE_PORTALS.map((portal) => (
            <div
              key={portal.role}
              className="relative flex flex-col rounded-2xl border border-gray-200 bg-white p-7 shadow-sm"
            >
              {/* Top accent bar */}
              <div
                className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
                style={{ backgroundColor: portal.accent }}
              />

              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl text-2xl"
                style={{ backgroundColor: `${portal.accent}18` }}>
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

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Staff &amp; Internal Access
          </span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* Staff portals */}
        <div className="grid gap-4 sm:grid-cols-2">
          {STAFF_PORTALS.map((portal) => (
            <a
              key={portal.role}
              href={portal.loginUrl || '#'}
              className="flex items-center gap-5 rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-sm"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-xl"
                style={{ backgroundColor: '#1A2B4A14' }}>
                {portal.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold font-display" style={{ color: '#1A2B4A' }}>{portal.role}</p>
                <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{portal.description}</p>
              </div>
              <ExternalLink className="h-4 w-4 flex-shrink-0 text-gray-400" />
            </a>
          ))}
        </div>

        {/* New to Kealee */}
        <p className="mt-10 text-center text-sm text-gray-500">
          New to Kealee?{' '}
          <Link href="/intake" className="font-semibold hover:underline" style={{ color: '#E8793A' }}>
            Start a project →
          </Link>
          {' '}or{' '}
          <Link href="/contractor/register" className="font-semibold hover:underline" style={{ color: '#2ABFBF' }}>
            join as a contractor
          </Link>
        </p>
      </div>
    </div>
  )
}
