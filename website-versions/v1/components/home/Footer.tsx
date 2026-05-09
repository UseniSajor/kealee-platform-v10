'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Mail, Twitter, Linkedin, Youtube } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { FOOTER_NAV } from '@/config/navigation'

export function Footer() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setEmail('')
  }

  return (
    <footer style={{ backgroundColor: '#1A2B4A' }}>
      <Container>
        <div className="py-14 lg:py-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
            {/* Brand */}
            <div className="col-span-2 lg:col-span-1">
              <Link href="/" className="mb-4 flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: '#E8793A' }}
                >
                  <span className="font-display text-sm font-bold text-white">K</span>
                </div>
                <span className="font-display text-xl font-bold text-white">Kealee</span>
              </Link>
              <p className="text-sm leading-relaxed text-gray-400">
                The complete construction platform. From land acquisition to project closeout — powered by AI.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <a
                  href="https://twitter.com/kealee"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="https://linkedin.com/company/kealee"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="https://youtube.com/@kealee"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="YouTube"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Platform */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">
                Platform
              </h3>
              <ul className="space-y-2.5">
                {FOOTER_NAV.platform.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Portals */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">
                Portals
              </h3>
              <ul className="space-y-2.5">
                {FOOTER_NAV.portals.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">
                Company
              </h3>
              <ul className="space-y-2.5">
                {FOOTER_NAV.company.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter */}
          <div className="mt-12 border-t border-white/10 pt-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-semibold text-white">Stay up to date</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Construction tips, platform updates, and industry insights.
                </p>
              </div>
              {submitted ? (
                <p className="text-sm font-medium" style={{ color: '#2ABFBF' }}>
                  Thanks! You&apos;re subscribed.
                </p>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex w-full gap-2 md:w-auto"
                >
                  <div className="relative flex-1 md:w-64">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#E8793A' }}
                  >
                    Subscribe <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </Container>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <Container>
          <div className="flex flex-col gap-3 py-5 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; {new Date().getFullYear()} Kealee LLC. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-4">
              {FOOTER_NAV.legal.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition-colors hover:text-gray-300"
                >
                  {link.label}
                </Link>
              ))}
              <span>Serving the DC-Baltimore Corridor &amp; Beyond</span>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  )
}
