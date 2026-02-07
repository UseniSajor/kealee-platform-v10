"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui"
import { Menu, X, Phone } from "lucide-react"

export default function GCServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: "/gc-services", label: "Home" },
    { href: "/gc-services/services", label: "Services" },
    { href: "/gc-services/pricing", label: "Pricing" },
    { href: "/gc-services/how-it-works", label: "How It Works" },
    { href: "/gc-services/contact", label: "Get Started" },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/gc-services" className="flex items-center space-x-2">
              <div className="font-bold text-xl text-gray-900">
                Kealee <span className="text-blue-600">Operations Services</span>
              </div>
            </Link>

            {/* Desktop Nav */}
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

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center space-x-3">
              <a
                href="tel:+13015758777"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors inline-flex items-center space-x-1"
              >
                <Phone className="h-4 w-4" />
                <span>(301) 575-8777</span>
              </a>
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl"
              >
                <Link href="/gc-services/contact">Start Free Trial</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <nav className="flex flex-col space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-base font-medium text-gray-700 hover:text-blue-600 transition-colors py-2"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-3 border-t border-gray-200">
                  <Button
                    asChild
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl"
                  >
                    <Link href="/gc-services/contact">Start Free Trial</Link>
                  </Button>
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
            <div className="col-span-1">
              <div className="font-bold text-xl text-white mb-4">
                Kealee <span className="text-blue-600">Operations</span>
              </div>
              <p className="text-sm text-gray-400">
                Professional operations support for general contractors and builders.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Services</h3>
              <ul className="space-y-2">
                <li><Link href="/gc-services/services" className="text-sm hover:text-blue-600 transition-colors">Operations Packages</Link></li>
                <li><Link href="/gc-services/pricing" className="text-sm hover:text-blue-600 transition-colors">Pricing</Link></li>
                <li><Link href="/gc-services/how-it-works" className="text-sm hover:text-blue-600 transition-colors">How It Works</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/terms" className="text-sm hover:text-blue-600 transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="text-sm hover:text-blue-600 transition-colors">Privacy</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Contact</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="mailto:getstarted@kealee.com" className="hover:text-blue-600 transition-colors">
                    getstarted@kealee.com
                  </a>
                </li>
                <li>
                  <a href="tel:+13015758777" className="hover:text-blue-600 transition-colors">
                    (301) 575-8777
                  </a>
                </li>
                <li className="pt-2">
                  <Button
                    asChild
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                  >
                    <Link href="/gc-services/contact">Start Free Trial</Link>
                  </Button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-gray-400 text-center">
            <p>© {new Date().getFullYear()} Kealee Operations Services. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
