import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sign In | Kealee',
  description: 'Sign in to your Kealee portal — Homeowner, Contractor, or Developer.',
}

// The owner has a dedicated portal. Contractor and developer acquisition and
// account entry are intentionally consolidated in the Marketplace.
const ownerUrl = process.env.NEXT_PUBLIC_PORTAL_OWNER_URL ?? ''

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

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { redirectTo?: string; next?: string }
}) {
  const target = searchParams?.redirectTo ?? searchParams?.next
  if (
    target?.startsWith('/') &&
    target.startsWith('/marketing/workspace')
  ) {
    redirect('/marketing/login')
  }
  if (
    target?.startsWith('/') &&
    target.startsWith('/admin/marketing')
  ) {
    redirect(`/auth/login?next=${encodeURIComponent(target)}`)
  }

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

        {/* New to Kealee */}
        <p className="mt-10 text-center text-sm text-gray-500">
          New to Kealee?{' '}
          <Link href="/concept" className="font-semibold hover:underline" style={{ color: '#E8793A' }}>
            Start a project →
          </Link>
          {' '}or{' '}
          <Link href="/contractor/register" className="font-semibold hover:underline" style={{ color: '#2ABFBF' }}>
            join as a contractor
          </Link>
        </p>

        <p className="mt-16 text-center text-xs text-gray-400">
          Kealee staff member?{' '}
          <Link href="/staff-login" className="font-medium hover:underline text-gray-500">
            Staff &amp; internal sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
