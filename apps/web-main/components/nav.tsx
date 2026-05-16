'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { SERVICES } from '@/lib/services-config'

// Services dropdown shows precon (design/planning) services only
// Build services live under the Build button → /build
const PRECON_SERVICES = SERVICES.filter((s) => s.phase === 'precon')

const SERVICE_GROUPS = [
  {
    label: 'Remodels',
    services: PRECON_SERVICES.filter((s) => s.category === 'remodel'),
  },
  {
    label: 'Additions & Outdoor',
    services: PRECON_SERVICES.filter((s) => s.category === 'addition' || s.category === 'landscape'),
  },
  {
    label: 'Design',
    services: PRECON_SERVICES.filter((s) => s.category === 'design'),
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
        className="flex items-center gap-1 font-medium text-sm text-slate-600 hover:text-slate-900 transition whitespace-nowrap"
      >
        Services <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-[600px] bg-white rounded-2xl shadow-xl border border-slate-200 p-5 z-50">
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
                        <span className="block text-[11px] text-slate-400">{svc.deliverableLabel} · {svc.deliveryDays}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">Delivered in 2–6 days</p>
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

// Color config per nav tab
const NAV_TABS = [
  {
    href: '/concept',
    label: 'Design Concept',
    hoverColor: 'hover:text-orange-500',
    activeColor: 'text-orange-500 border-b-2 border-orange-500',
  },
  {
    href: '/estimate',
    label: 'What does it Cost',
    hoverColor: 'hover:text-blue-500',
    activeColor: 'text-blue-500 border-b-2 border-blue-500',
  },
  {
    href: '/permits',
    label: 'Get Permits',
    hoverColor: 'hover:text-green-600',
    activeColor: 'text-green-600 border-b-2 border-green-600',
  },
  {
    href: '/marketplace',
    label: 'Marketplace',
    hoverColor: 'hover:text-orange-500',
    activeColor: 'text-orange-500 border-b-2 border-orange-500',
  },
  {
    href: '/faq',
    label: 'FAQ',
    hoverColor: 'hover:text-orange-500',
    activeColor: 'text-orange-500 border-b-2 border-orange-500',
  },
]

function MobileServicesAccordion({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        Services
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-0.5">
          {PRECON_SERVICES.map((svc) => (
            <Link
              key={svc.slug}
              href={`/services/${svc.slug}`}
              onClick={onClose}
              className="block rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
            >
              {svc.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function SiteNav() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  function isActive(href: string) {
    return pathname === href || (href !== '/' && pathname?.startsWith(href + '/'))
  }

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* LEFT: Logo + Desktop Nav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-[#E8724B] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                K
              </div>
              <span className="hidden sm:inline font-bold text-xl text-slate-900">Kealee</span>
            </Link>

            {/* Build button — desktop left section */}
            <Link
              href="/build"
              className="hidden lg:flex items-center px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-semibold rounded-lg text-sm transition-all shadow-sm hover:shadow-md whitespace-nowrap"
            >
              Build
            </Link>

            {/* Desktop tabs */}
            <div className="hidden lg:flex items-center gap-1">
              <ServicesDropdown />

              {NAV_TABS.map((tab) => {
                const active = isActive(tab.href)
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`whitespace-nowrap px-3 py-1 font-medium text-sm transition-colors ${
                      active
                        ? tab.activeColor
                        : `text-slate-600 ${tab.hoverColor} hover:underline`
                    }`}
                  >
                    {tab.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* RIGHT: Divider + Account */}
          <div className="flex items-center gap-4">
            {/* Divider (desktop only) */}
            <div className="hidden lg:block w-px h-6 bg-gray-300" />

            <Link
              href="/auth/sign-in"
              className="hidden sm:block text-sm text-slate-600 hover:text-slate-900 font-medium transition whitespace-nowrap"
            >
              Sign in
            </Link>

            <Link
              href="/concept"
              className="hidden sm:flex items-center px-5 py-2 bg-[#E8724B] hover:bg-[#D45C33] active:bg-[#C04820] text-white font-semibold rounded-lg text-sm transition-all shadow-sm hover:shadow-md whitespace-nowrap"
            >
              Get Started
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            {/* Services accordion */}
            <MobileServicesAccordion onClose={() => setMobileMenuOpen(false)} />

            {/* Main tabs */}
            {NAV_TABS.map((tab) => {
              const active = isActive(tab.href)
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block rounded-lg px-3 py-2.5 font-medium text-sm transition ${
                    active ? 'bg-orange-50 text-[#E8724B]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}

            {/* Account */}
            <div className="border-t border-slate-200 mt-3 pt-3 space-y-2">
              <Link
                href="/auth/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Sign in
              </Link>
              <Link href="/build" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-3 rounded-xl text-sm transition mb-2">
                  Build
                </button>
              </Link>
              <Link href="/concept" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold py-3.5 rounded-xl text-base transition">
                  Get Started — Design Your Concept
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
