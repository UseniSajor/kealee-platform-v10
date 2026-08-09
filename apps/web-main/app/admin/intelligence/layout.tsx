'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { OpsAuthProvider, useOpsAuth } from '@/lib/admin/use-ops-auth'

const NAV = [
  { href: '/admin/intelligence/dashboard', label: 'Dashboard' },
  { href: '/admin/intelligence/properties', label: 'Properties' },
  { href: '/admin/intelligence/opportunities', label: 'Opportunities' },
  { href: '/admin/intelligence/assignments', label: 'Assignments' },
  { href: '/admin/intelligence/leads', label: 'Leads' },
  { href: '/admin/intelligence/capital', label: 'Capital' },
  { href: '/admin/intelligence/projects', label: 'Projects' },
  { href: '/admin/intelligence/campaigns', label: 'Campaigns' },
  { href: '/admin/intelligence/review', label: 'Review Queue' },
]

function IntelligenceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { secret, setSecret } = useOpsAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A2B4A]">Kealee Intelligence</h1>
            <p className="text-sm text-gray-500">5 Intelligence Engines · Twins · Loop orchestration</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="password"
              placeholder="Ops secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 px-4 pb-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                pathname === item.href
                  ? 'bg-[#1A2B4A] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  )
}

export default function IntelligenceLayout({ children }: { children: React.ReactNode }) {
  return (
    <OpsAuthProvider>
      <IntelligenceShell>{children}</IntelligenceShell>
    </OpsAuthProvider>
  )
}
