'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

// ── Row 1: Role navigation ────────────────────────────────────────────────────
const ROLES = [
  { label: 'Homeowners',           href: '/homeowners' },
  { label: 'Contractors & GC',     href: '/contractors' },
  { label: 'Architects',           href: '/architects' },
  { label: 'Engineers',            href: '/engineers' },
  { label: 'Developers',           href: '/developers' },
  { label: 'Design Professionals', href: '/design-professionals' },
  { label: 'Government',           href: '/government' },
]

// ── Row 2: Marketplace utility links ─────────────────────────────────────────
const UTILITY_LINKS = [
  { label: 'How It Works',    href: '/marketplace#how-it-works' },
  { label: 'Pricing',         href: '/pricing' },
  { label: 'FAQ',             href: '/#faq' },
  { label: 'Join as Contractor', href: '/contractor/register' },
]

export function MarketplaceTopbar() {
  return (
    <div className="bg-white border-b border-gray-200">
      {/* Row 1 — brand + roles */}
      <div className="border-b border-gray-100">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-2 px-4 py-2.5 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mr-4">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: '#E8793A' }}
            >
              <span className="text-xs font-bold text-white">K</span>
            </div>
            <span className="text-base font-bold font-display" style={{ color: '#1A2B4A' }}>
              Kealee
            </span>
          </Link>

          {/* Role links */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-gray-500">
            {ROLES.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="whitespace-nowrap transition-colors hover:text-[#1A2B4A]"
              >
                {r.label}
              </Link>
            ))}
          </div>

          {/* Auth CTAs */}
          <div className="flex items-center gap-2 ml-auto pl-4">
            <Link
              href="/portal"
              className="text-xs font-medium text-gray-600 hover:text-[#1A2B4A]"
            >
              Sign In
            </Link>
            <Link
              href="/intake"
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E8793A' }}
            >
              Request Design Consult <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Row 2 — utility links */}
      <div>
        <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-2 sm:px-6 lg:px-8">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#E8793A' }}>
            Contractor Marketplace
          </span>
          <div className="mx-2 h-4 w-px bg-gray-200" />
          {UTILITY_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-xs font-medium text-gray-500 transition-colors hover:text-[#1A2B4A]"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
