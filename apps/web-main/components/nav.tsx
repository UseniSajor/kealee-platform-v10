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

  const navLinks = [
    { href: '/intake/exterior_concept', label: 'Plan Project' },
    { href: '/intake/permit_path_only', label: 'Get Permit' },
    { href: '/intake/cost_estimate', label: 'Price Project' },
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/homeowners', label: 'Homeowners' },
    { href: '/contractors', label: 'Contractors' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            K
          </div>
          <span className="font-bold text-xl text-slate-900 hidden sm:inline">Kealee</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8 flex-1 ml-12">
          {navLinks.slice(0, 4).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-slate-600 hover:text-orange-600 font-medium text-sm transition"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Search & Auth */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="w-64">
            <ProjectSearchBar size="sm" />
          </div>
          <Link href="/auth/sign-in">
            <button className="text-slate-700 hover:text-slate-900 font-medium text-sm transition">
              Sign in
            </button>
          </Link>
          <Link href="/intake/exterior_concept">
            <button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition">
              Get Started
            </button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-slate-600 hover:text-orange-600 font-medium transition py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div>
                <ProjectSearchBar size="sm" />
              </div>
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
