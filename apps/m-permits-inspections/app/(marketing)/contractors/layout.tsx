"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, Phone } from "lucide-react"

export default function ContractorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: "/contractors", label: "Home" },
    { href: "/contractors/services", label: "Services" },
    { href: "/contractors/pricing", label: "Pricing" },
    { href: "/contractors/how-it-works", label: "How It Works" },
    { href: "/contractors/contact", label: "Get Started" },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/contractors" className="flex items-center space-x-2">
              <div className="font-bold text-xl text-gray-900">
                Kealee <span className="text-emerald-600">Permits</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center space-x-3">
              <a
                href="tel:+15551234567"
                className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors inline-flex items-center space-x-1"
              >
                <Phone className="h-4 w-4" />
                <span>Call Us</span>
              </a>
              <Link
                href="/contractors/contact"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-semibold transition-colors"
              >
                Get Started
              </Link>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <nav className="flex flex-col space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-base font-medium text-gray-700 hover:text-emerald-600 py-2"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-3 border-t border-gray-200">
                  <Link
                    href="/contractors/contact"
                    className="block w-full text-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold"
                  >
                    Get Started
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="font-bold text-xl text-white mb-4">
                Kealee <span className="text-emerald-600">Permits</span>
              </div>
              <p className="text-sm text-gray-400">
                Professional permit and inspection services for contractors, developers, and property owners. AI-powered compliance and automated tracking.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Services</h3>
              <ul className="space-y-2">
                <li><Link href="/contractors/services" className="text-sm hover:text-emerald-600 transition-colors">Permit Services</Link></li>
                <li><Link href="/contractors/pricing" className="text-sm hover:text-emerald-600 transition-colors">Pricing</Link></li>
                <li><Link href="/contractors/how-it-works" className="text-sm hover:text-emerald-600 transition-colors">How It Works</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">We Serve</h3>
              <ul className="space-y-2 text-sm">
                <li>General Contractors</li>
                <li>Subcontractors</li>
                <li>Developers</li>
                <li>Property Owners</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Contact</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="mailto:getstarted@kealee.com" className="hover:text-emerald-600 transition-colors">
                    getstarted@kealee.com
                  </a>
                </li>
                <li>
                  <a href="tel:+15551234567" className="hover:text-emerald-600 transition-colors">
                    (555) 123-4567
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-gray-400 text-center">
            <p>© {new Date().getFullYear()} Kealee Permits & Inspections. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
