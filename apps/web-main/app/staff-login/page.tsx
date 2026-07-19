import type { Metadata } from 'next'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Staff Sign In | Kealee',
  description: 'Internal sign-in for Kealee staff — Command Center and Admin Console.',
  robots: { index: false, follow: false },
}

// Portal URLs configured per environment
const ccUrl    = process.env.NEXT_PUBLIC_COMMAND_CENTER_URL ?? ''
const adminUrl = process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL  ?? ''

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
          Staff &amp; Internal Access
        </h1>
        <p className="mt-3 text-gray-400">
          For Kealee team members only
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
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
