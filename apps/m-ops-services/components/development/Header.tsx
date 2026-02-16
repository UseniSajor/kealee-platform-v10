"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui"
import { Menu, X, Download } from "lucide-react"

interface HeaderProps {
  onRequestReview: () => void
}

export function Header({ onRequestReview }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { href: "/development", label: "Home" },
    { href: "/development/services", label: "Services" },
    { href: "/development/how-it-works", label: "How It Works" },
    { href: "/development/experience", label: "Experience" },
    { href: "/development/contact", label: "Contact" },
  ]

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-sm shadow-sm"
          : "bg-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/development" className="flex items-center">
            <img
              src="/kealee-logo-300w.png"
              alt="Kealee Construction"
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <a
              href="/kealee-development-1pager.pdf"
              download
              className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors inline-flex items-center space-x-1"
            >
              <Download className="h-4 w-4" />
              <span>1-Pager</span>
            </a>
            <Button
              onClick={onRequestReview}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-2xl"
            >
              Request a Project Review
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
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
                  className="text-base font-medium text-gray-700 hover:text-orange-600 transition-colors py-2"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-gray-200 space-y-3">
                <a
                  href="/kealee-development-1pager.pdf"
                  download
                  className="inline-flex items-center space-x-2 text-base font-medium text-gray-700 hover:text-orange-600 transition-colors py-2"
                >
                  <Download className="h-5 w-5" />
                  <span>Download 1-Pager</span>
                </a>
                <Button
                  onClick={() => {
                    onRequestReview()
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-2xl"
                >
                  Request a Project Review
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
