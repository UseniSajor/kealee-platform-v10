"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, Phone, ShoppingCart } from "lucide-react"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/pricing", label: "Pricing" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/contact", label: "Get Started" },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="font-bold text-xl text-gray-900">
                Kealee <span className="text-blue-600">Estimation</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center space-x-3">
              <Link href="https://marketplace.kealee.com/cart" className="relative text-gray-700 hover:text-blue-600 transition" aria-label="Cart">
                <ShoppingCart className="h-5 w-5" />
              </Link>
              <a
                href="tel:+13015758777"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors inline-flex items-center space-x-1"
              >
                <Phone className="h-4 w-4" />
                <span>(301) 575-8777</span>
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-semibold transition-colors"
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
                    className="text-base font-medium text-gray-700 hover:text-blue-600 py-2"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-3 border-t border-gray-200">
                  <Link
                    href="/contact"
                    className="block w-full text-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold"
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
                Kealee <span className="text-blue-500">Estimation</span>
              </div>
              <p className="text-sm text-gray-400">
                Professional construction cost estimation with AI-powered analysis, automated takeoff, and industry-standard cost databases.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Services</h3>
              <ul className="space-y-2">
                <li><Link href="/services" className="text-sm hover:text-blue-400 transition-colors">Estimation Services</Link></li>
                <li><Link href="/pricing" className="text-sm hover:text-blue-400 transition-colors">Pricing</Link></li>
                <li><Link href="/how-it-works" className="text-sm hover:text-blue-400 transition-colors">How It Works</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">We Serve</h3>
              <ul className="space-y-2 text-sm">
                <li>General Contractors</li>
                <li>Subcontractors</li>
                <li>Developers</li>
                <li>Property Owners</li>
                <li>Architects</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Contact</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="mailto:getstarted@kealee.com" className="hover:text-blue-400 transition-colors">
                    getstarted@kealee.com
                  </a>
                </li>
                <li>
                  <a href="tel:+13015758777" className="hover:text-blue-400 transition-colors">
                    (301) 575-8777
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-gray-400 text-center">
            <p>&copy; {new Date().getFullYear()} Kealee Estimation. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
