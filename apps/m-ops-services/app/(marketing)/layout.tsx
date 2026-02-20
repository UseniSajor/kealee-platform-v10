'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Phone, ShoppingCart } from 'lucide-react'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/packages' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Case Studies', href: '/case-studies' },
    { label: 'For Contractors', href: '/contractors' },
  ]

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-zinc-200 z-50">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-sky-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-lg font-bold text-zinc-900">
                Kealee <span className="text-sky-500">Ops</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-sm font-medium text-zinc-700 hover:text-sky-600 transition">
                  {link.label}
                </Link>
              ))}
              <a href="tel:+13015758777" className="flex items-center gap-1 text-sm text-zinc-600 hover:text-sky-600 transition">
                <Phone className="h-4 w-4" />
                (301) 575-8777
              </a>
              <Link href="https://marketplace.kealee.com/cart" className="relative text-zinc-700 hover:text-sky-600 transition" aria-label="Cart">
                <ShoppingCart className="h-5 w-5" />
              </Link>
              <Link href="/login" className="text-sm font-medium text-zinc-700 hover:text-sky-600 transition">
                Portal Login
              </Link>
              <Link href="/contact" className="inline-flex items-center px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold transition">
                Get Started
              </Link>
            </div>

            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-3 border-t border-zinc-100">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block text-sm font-medium text-zinc-700 hover:text-sky-600" onClick={() => setMobileMenuOpen(false)}>
                  {link.label}
                </Link>
              ))}
              <Link href="/login" className="block text-sm font-medium text-zinc-700 hover:text-sky-600" onClick={() => setMobileMenuOpen(false)}>
                Portal Login
              </Link>
              <Link href="/contact" className="block bg-sky-500 text-white px-5 py-2 rounded-xl text-center text-sm font-semibold hover:bg-sky-600" onClick={() => setMobileMenuOpen(false)}>
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </header>

      {/* Main content */}
      <main className="pt-16 min-h-screen">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">K</span>
                </div>
                <span className="text-lg font-bold text-white">Kealee <span className="text-sky-400">Ops</span></span>
              </div>
              <p className="text-sm text-zinc-400">
                Professional operations management for GCs, builders, and contractors. Save 20+ hours per week with our PM managed service packages.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/packages" className="hover:text-white transition">PM Packages</Link></li>
                <li><Link href="/pm-software" className="hover:text-white transition">PM Software</Link></li>
                <li><Link href="/individual-services" className="hover:text-white transition">Individual Services</Link></li>
                <li><Link href="/escrow" className="hover:text-white transition">Escrow & Finance</Link></li>
                <li><Link href="/developer" className="hover:text-white transition">Developer Services</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/how-it-works" className="hover:text-white transition">How It Works</Link></li>
                <li><Link href="/case-studies" className="hover:text-white transition">Case Studies</Link></li>
                <li><Link href="/contractors" className="hover:text-white transition">For Contractors</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-white transition">Book a Demo</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Contact</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="mailto:ops@kealee.com" className="hover:text-white transition">ops@kealee.com</a></li>
                <li><a href="tel:+13015758777" className="hover:text-white transition">(301) 575-8777</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-zinc-400">
            <p>&copy; {new Date().getFullYear()} Kealee Platform. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="/legal/terms" className="hover:text-white transition">Terms of Service</Link>
              <Link href="/legal/privacy" className="hover:text-white transition">Privacy Policy</Link>
              <Link href="/legal/acceptable-use" className="hover:text-white transition">Acceptable Use</Link>
              <a href="https://kealee.com" className="hover:text-white transition">kealee.com</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
