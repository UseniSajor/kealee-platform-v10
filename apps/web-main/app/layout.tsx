'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ArrowRight, Mail, ShoppingCart } from 'lucide-react'
import './globals.css'

const NAV_LINKS = [
  { label: 'For Homeowners', href: '/homeowners' },
  { label: 'AI Concept Engine', href: '/concept-engine' },
  { label: 'Get Permits', href: '/permits' },
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

const FOOTER_LINKS = {
  platform: [
    { label: 'Digital Twins', href: '/features#ddts' },
    { label: 'Land Intelligence', href: '/features#land' },
    { label: 'Feasibility Studies', href: '/features#feasibility' },
    { label: 'Project Management', href: '/features#pm' },
    { label: 'Payments & Escrow', href: '/features#payments' },
    { label: 'Contractor Marketplace', href: '/features#marketplace' },
    { label: 'AI Assistants', href: '/features#keabots' },
  ],
  homeowners: [
    { label: 'Exterior & Curb Appeal', href: '/homeowners/exterior' },
    { label: 'Garden & Farming', href: '/homeowners/garden-farming' },
    { label: 'Whole Home Renovation', href: '/homeowners/whole-home' },
    { label: 'Interior Reno & Additions', href: '/homeowners/interior-reno' },
    { label: 'AI Concept Engine', href: '/concept-engine' },
  ],
  portals: [
    { label: 'Owner Portal', href: '/features#owner' },
    { label: 'Contractor Portal', href: '/features#contractor' },
    { label: 'Developer Portal', href: '/features#developer' },
    { label: 'Command Center', href: '/features#command' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/contact' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ],
  legal: [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
}

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: '#E8793A' }}>
            <span className="text-sm font-bold text-white font-display">K</span>
          </div>
          <span className="text-xl font-bold font-display" style={{ color: '#1A2B4A' }}>
            Kealee
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-[#1A2B4A]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/contact"
            className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-[#1A2B4A] sm:inline-flex"
          >
            Log In
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#E8793A' }}
          >
            Get Started
          </Link>

          {/* Mobile menu button */}
          <button
            className="ml-2 rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}

function Footer() {
  const [email, setEmail] = useState('')

  return (
    <footer style={{ backgroundColor: '#1A2B4A' }}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Logo & tagline */}
          <div className="col-span-2 mb-4 md:col-span-4 lg:col-span-1 lg:mb-0">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: '#E8793A' }}>
                <span className="text-sm font-bold text-white font-display">K</span>
              </div>
              <span className="text-xl font-bold text-white font-display">Kealee</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              The complete construction platform. From land acquisition to project closeout — powered by AI.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Platform</h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.platform.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Homeowners */}
          <div>
            <h3 className="mb-4 font-semibold text-white">For Homeowners</h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.homeowners.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Portals</h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.portals.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Company</h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 border-t border-gray-700 pt-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="mb-1 font-semibold text-white">Stay up to date</h3>
              <p className="text-sm text-gray-400">Construction tips, platform updates, and industry insights.</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setEmail('') }} className="flex w-full gap-2 md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
                  required
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: '#E8793A' }}
              >
                Subscribe <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Kealee LLC. All rights reserved.</p>
          <p>Serving the DC-Baltimore Corridor &amp; Beyond</p>
        </div>
      </div>
    </footer>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body antialiased">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
