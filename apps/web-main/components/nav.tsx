'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Search } from 'lucide-react'
import { useState } from 'react'
import ProjectSearchBar from './ProjectSearchBar'

export function SiteNav() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Primary CTAs shown left of center
  const primaryLinks = [
    { href: '/intake/exterior_concept', label: 'Concept' },
    { href: '/intake/cost_estimate', label: 'Estimate' },
    { href: '/intake/permit_path_only', label: 'Permit' },
    { href: '/marketplace', label: 'Marketplace' },
  ]

  // Secondary info links shown right of center, lighter style
  const secondaryLinks = [
    { href: '/faq', label: 'FAQ' },
    { href: '/milestone-pay', label: 'Milestone Pay' },
  ]

  // Full list for mobile menu
  const allLinks = [
    ...primaryLinks,
    ...secondaryLinks,
    { href: '/homeowners', label: 'Homeowners' },
    { href: '/contractors', label: 'Contractors' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            K
          </div>
          <span className="font-bold text-xl text-slate-900 hidden sm:inline">Kealee</span>
        </Link>

        {/* Primary desktop links */}
        <div className="hidden lg:flex items-center gap-5 flex-1">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap font-medium text-sm transition ${
                pathname === link.href
                  ? 'text-orange-600'
                  : 'text-slate-600 hover:text-orange-600'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Secondary links — always visible at lg */}
        <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
          {secondaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold transition ${
                pathname === link.href
                  ? 'border-orange-200 bg-orange-50 text-orange-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Search — only at xl to prevent overflow */}
        <div className="hidden xl:block w-52 flex-shrink-0">
          <ProjectSearchBar size="sm" />
        </div>

        {/* Auth */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0 ml-auto">
          <Link href="/auth/sign-in" className="text-slate-700 hover:text-slate-900 font-medium text-sm transition whitespace-nowrap">
            Sign in
          </Link>
          <Link href="/intake/exterior_concept">
            <button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition whitespace-nowrap">
              Get Started
            </button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 ml-auto"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-4 space-y-1">
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-lg px-3 py-2.5 font-medium text-sm transition ${
                  pathname === link.href
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-slate-200 space-y-3 mt-2">
              <ProjectSearchBar size="sm" />
              <Link href="/auth/sign-in" className="block w-full text-center py-2 text-slate-700 font-medium">
                Sign in
              </Link>
              <Link href="/intake/exterior_concept" className="block w-full">
                <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded-lg transition">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
