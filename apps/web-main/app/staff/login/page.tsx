import type { Metadata } from 'next'
import Link from 'next/link'
import { ExternalLink, ShieldCheck } from 'lucide-react'

/**
 * Staff sign-in — Command Center and Admin Console.
 *
 * These used to sit under "Staff & Internal Access" on the customer /login
 * page, where every homeowner saw two internal tools they could not use.
 * They live here now: linked from nowhere public, excluded from search, and
 * reached by staff who know the address.
 */
export const metadata: Metadata = {
  title: 'Staff Sign In | Kealee',
  robots: { index: false, follow: false },
}

const ccUrl    = process.env.NEXT_PUBLIC_COMMAND_CENTER_URL ?? ''
const adminUrl = process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL  ?? ''

const STAFF_PORTALS = [
  {
    emoji:       '🧠',
    role:        'Command Center',
    description: 'Operations oversight, AI workflow queue, concept review, and integration management.',
    loginUrl:    ccUrl ? `${ccUrl}/login` : '',
    envVar:      'NEXT_PUBLIC_COMMAND_CENTER_URL',
  },
  {
    emoji:       '⚙️',
    role:        'Admin Console',
    description: 'Organization and user management, subscriptions, and platform configuration.',
    loginUrl:    adminUrl ? `${adminUrl}/login` : '',
    envVar:      'NEXT_PUBLIC_ADMIN_CONSOLE_URL',
  },
]

const INTERNAL_PAGES = [
  { href: '/admin/orders',           label: 'Orders desk' },
  { href: '/admin/site-plan',        label: 'Site plan desk' },
  { href: '/admin/engineer-reviews', label: 'Engineer credential verification' },
  { href: '/engineer/review',        label: 'Engineer review queue' },
  { href: '/marketing/login',        label: 'Marketing workspace' },
]

export default function StaffLoginPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="py-14 text-center" style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #0F1D34 100%)' }}>
        <div className="mb-2 inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: '#E8793A' }}>
            <span className="text-base font-bold text-white font-display">K</span>
          </div>
          <span className="text-2xl font-bold text-white font-display">Kealee</span>
        </div>
        <h1 className="mt-4 flex items-center justify-center gap-2 text-3xl font-bold text-white font-display">
          <ShieldCheck className="h-7 w-7 text-emerald-300" /> Staff sign in
        </h1>
        <p className="mt-3 text-gray-400">Internal tools. Customers sign in at <Link href="/login" className="underline">kealee.com/login</Link>.</p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {STAFF_PORTALS.map((portal) => (
            <a
              key={portal.role}
              href={portal.loginUrl || undefined}
              aria-disabled={!portal.loginUrl}
              className={`flex items-center gap-5 rounded-xl border border-gray-200 bg-white p-5 transition-all ${portal.loginUrl ? 'hover:border-gray-300 hover:shadow-sm' : 'opacity-60 cursor-not-allowed'}`}
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-xl"
                style={{ backgroundColor: '#1A2B4A14' }}>
                {portal.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold font-display" style={{ color: '#1A2B4A' }}>{portal.role}</p>
                <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{portal.description}</p>
                {!portal.loginUrl && (
                  <p className="mt-1 text-[11px] text-amber-700">Not configured on this deployment ({portal.envVar}).</p>
                )}
              </div>
              <ExternalLink className="h-4 w-4 flex-shrink-0 text-gray-400" />
            </a>
          ))}
        </div>

        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">On this site</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {INTERNAL_PAGES.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="block rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium hover:border-gray-300" style={{ color: '#1A2B4A' }}>
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-gray-500">Each page checks its own role; this list is a directory, not access.</p>
        </div>
      </div>
    </div>
  )
}
