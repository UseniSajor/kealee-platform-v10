'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/products', label: 'Products' },
  { href: '/milestone-pay', label: 'Milestone Pay', highlight: true },
  { href: '/auth/sign-in', label: 'Sign In' },
] as const

export function NavigationMobile() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center lg:hidden">
      <button
        type="button"
        className="rounded-lg p-2 text-navy hover:bg-slate-100"
        aria-expanded={open}
        aria-controls="mobile-primary-nav"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
        <span className="sr-only">Toggle navigation menu</span>
      </button>

      {open ? (
        <div
          id="mobile-primary-nav"
          className="absolute left-0 right-0 top-full border-b border-slate-200 bg-white shadow-lg"
        >
          <div className="flex flex-col gap-1 px-4 py-4">
            <Link href="/" className="mb-3 flex items-center gap-2" onClick={() => setOpen(false)}>
              <Image src="/logo.svg" alt="Kealee" width={112} height={28} priority />
            </Link>
            {LINKS.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    link.highlight
                      ? 'bg-teal/10 font-semibold text-teal-dark'
                      : active
                        ? 'bg-slate-100 text-navy'
                        : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              )
            })}
            <Link
              href="/concept"
              className="mt-3 rounded-xl bg-builder-orange px-4 py-3 text-center text-sm font-semibold text-white hover:bg-builder-orange-dark"
              onClick={() => setOpen(false)}
            >
              Build your project
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
