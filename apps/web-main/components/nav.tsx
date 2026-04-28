'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { SERVICES } from '@/lib/services-config'

// Group services by category for dropdown
const SERVICE_GROUPS = [
  {
    label: 'Remodels',
    services: SERVICES.filter((s) => s.category === 'remodel'),
  },
  {
    label: 'Additions & Outdoor',
    services: SERVICES.filter((s) => s.category === 'addition' || s.category === 'landscape'),
  },
  {
    label: 'Design & Build',
    services: SERVICES.filter((s) => s.category === 'design' || s.category === 'construction'),
  },
]

function ServicesDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 font-medium text-sm text-slate-600 hover:text-orange-600 transition whitespace-nowrap"
      >
        Services <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[600px] bg-white rounded-2xl shadow-xl border border-slate-200 p-5 z-50">
          <div className="grid grid-cols-3 gap-5">
            {SERVICE_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">{group.label}</p>
                <ul className="space-y-1">
                  {group.services.map((svc) => (
                    <li key={svc.slug}>
                      <Link
                        href={`/services/${svc.slug}`}
                        onClick={() => setOpen(false)}
                        className="block rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition"
                      >
                        {svc.label}
                        <span className="block text-[11px] text-slate-400">{svc.priceDisplay}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">10 services · Delivered in 2–6 days</p>
            <Link
              href="/gallery"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              Browse all →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export function SiteNav() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: '/gallery', label: 'Gallery' },
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/faq', label: 'FAQ' },
  ]

  const actionLinks = [
    { href: '/concept', label: 'Design Concept' },
    { href: '/estimate', label: 'What does it Cost' },
    { href: '/permits', label: 'Get Permits' },
    { href: '/new-construction', label: 'Build Now' },
    { href: '/milestone-pay', label: 'Milestone Pay' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="mx-auto max-w-screen-2xl px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 bg-[#E8724B] rounded-lg flex items-center justify-center text-white font-bold text-sm">
            K
          </div>
          <span className="font-bold text-xl text-slate-900 hidden sm:inline">Kealee</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-4 flex-1 overflow-x-auto">
          <ServicesDropdown />
          {navLinks.map((link) => (
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

          {/* Divider */}
          <span className="w-px h-4 bg-slate-200 flex-shrink-0" />

          {/* Action links */}
          {actionLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap font-medium text-sm transition ${
                pathname === link.href || pathname?.startsWith(link.href + '/')
                  ? 'text-[#E8724B]'
                  : 'text-[#1A2B4A] hover:text-[#E8724B]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth + CTA */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0 ml-auto">
          <Link href="/auth/sign-in" className="text-slate-600 hover:text-slate-900 font-medium text-sm transition whitespace-nowrap">
            Sign in
          </Link>
          <Link href="/concept">
            <button className="bg-[#E8724B] hover:bg-[#D45C33] text-white font-semibold px-4 py-2 rounded-lg text-sm transition whitespace-nowrap shadow-sm shadow-orange-200">
              Get Started
            </button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 ml-auto"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            {/* Services list */}
            <p className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Services</p>
            {SERVICES.map((svc) => (
              <Link
                key={svc.slug}
                href={`/services/${svc.slug}`}
                className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                {svc.label}
                <span className="text-xs text-slate-400 ml-2">{svc.priceDisplay}</span>
              </Link>
            ))}

            <div className="border-t border-slate-100 my-2 pt-2">
              {navLinks.map((link) => (
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
            </div>

            <div className="border-t border-slate-100 my-2 pt-2">
              <p className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Get Started</p>
              {actionLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-lg px-3 py-2.5 font-semibold text-sm transition ${
                    pathname === link.href || pathname?.startsWith(link.href + '/')
                      ? 'bg-orange-50 text-[#E8724B]'
                      : 'text-[#1A2B4A] hover:bg-orange-50 hover:text-[#E8724B]'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-2 mt-2">
              <Link href="/auth/sign-in" className="block w-full text-center py-2 text-slate-700 font-medium text-sm">
                Sign in
              </Link>
              <Link href="/concept" className="block w-full" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold py-3 rounded-xl transition">
                  Get Started — Build Your Concept
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
