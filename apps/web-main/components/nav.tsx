'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function SiteNav() {
  const pathname = usePathname()
  const isHome = pathname === '/'

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 300,
        background: 'rgba(255,255,255,.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(26,28,27,.1)',
        height: 60,
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          fontFamily: 'var(--font-syne, Syne, sans-serif)',
          fontWeight: 800,
          fontSize: 20,
          letterSpacing: '-.04em',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
          color: 'var(--ink)',
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            background: 'var(--o)',
            borderRadius: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          K
        </span>
        Kealee
      </Link>

      {/* Center links */}
      <ul className="nl" style={{ flex: 1, justifyContent: 'center' }}>
        <li><Link href="/concept" className="hi">Start AI design</Link></li>
        <li><Link href="/permits" className="hi">Get permits</Link></li>
        <li><Link href="/#milestone-pay" className="hi">Milestone Pay</Link></li>
        {!isHome && <li><Link href="/marketplace" className="tab">Marketplace</Link></li>}
        <li><Link href="/#how-it-works" className="tab">How it works</Link></li>
        <li><Link href="/#concept" className="tab">Services</Link></li>
        <li><Link href="/contractors" className="tab">Contractors</Link></li>
        <li><Link href="/developers" className="tab">Developers</Link></li>
        <li><Link href="/#faq" className="tab">FAQ</Link></li>
      </ul>

      {/* Right buttons */}
      <div className="nr">
        <Link href="/auth/sign-in" className="btn bg">Sign in</Link>
        <Link href="/concept" className="btn bo">Build your project →</Link>
      </div>
    </nav>
  )
}
