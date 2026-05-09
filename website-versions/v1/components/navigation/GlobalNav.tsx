'use client'

/**
 * GlobalNav.tsx
 *
 * Kealee primary navigation bar.
 * - Desktop: sticky top bar with dropdowns
 * - Mobile: hamburger → MobileNav drawer
 * - Scroll-aware: adds shadow after 20px scroll
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Menu, ArrowRight, ChevronDown } from 'lucide-react'
import { NavItem } from './NavItem'
import { MobileNav } from './MobileNav'
import { PRIMARY_NAV, NAV_CTA_PRIMARY, NAV_LOGIN_OPTIONS } from '@/config/navigation'

export function GlobalNav() {
  const [mobileOpen,    setMobileOpen]    = useState(false)
  const [openDropdown,  setOpenDropdown]  = useState<string | null>(null)
  const [loginOpen,     setLoginOpen]     = useState(false)
  const [scrolled,      setScrolled]      = useState(false)
  const navRef    = useRef<HTMLElement>(null)
  const loginRef  = useRef<HTMLDivElement>(null)

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdowns on outside click
  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (navRef.current && !navRef.current.contains(e.target as Node)) {
      setOpenDropdown(null)
      setLoginOpen(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [handleOutsideClick])

  // Close dropdowns on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null)
        setLoginOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Lock body scroll when mobile nav open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  function toggleDropdown(label: string) {
    setOpenDropdown(s => s === label ? null : label)
    setLoginOpen(false)
  }

  function toggleLogin() {
    setLoginOpen(s => !s)
    setOpenDropdown(null)
  }

  return (
    <>
      <header
        ref={navRef}
        className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md transition-shadow duration-200 ${scrolled ? 'shadow-md' : 'border-b border-gray-100'}`}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link
            href="/"
            className="flex flex-shrink-0 items-center gap-2.5"
            onClick={() => { setOpenDropdown(null); setLoginOpen(false) }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: '#C8521A' }}
            >
              <span className="text-sm font-bold text-white font-display">K</span>
            </div>
            <span className="text-xl font-bold font-display" style={{ color: '#1A2B4A' }}>Kealee</span>
          </Link>

          {/* Desktop nav items — center */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {PRIMARY_NAV.map(item => (
              <NavItem
                key={item.label}
                item={item}
                isOpen={openDropdown === item.label}
                onToggle={() => toggleDropdown(item.label)}
                onClose={() => setOpenDropdown(null)}
              />
            ))}
          </nav>

          {/* Desktop right — login dropdown + CTA */}
          <div className="hidden items-center gap-2 lg:flex">

            {/* Login dropdown */}
            <div className="relative" ref={loginRef}>
              <button
                onClick={toggleLogin}
                className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-[#1A2B4A]"
                aria-expanded={loginOpen}
              >
                Log In
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${loginOpen ? 'rotate-180' : ''}`} />
              </button>

              {loginOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                  {NAV_LOGIN_OPTIONS.map(opt => (
                    <Link
                      key={opt.href}
                      href={opt.href}
                      onClick={() => setLoginOpen(false)}
                      className="block px-4 py-3 transition-colors hover:bg-gray-50"
                    >
                      <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{opt.description}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Primary CTA */}
            <Link
              href={NAV_CTA_PRIMARY.href}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#C8521A' }}
            >
              {NAV_CTA_PRIMARY.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile nav drawer */}
      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}
