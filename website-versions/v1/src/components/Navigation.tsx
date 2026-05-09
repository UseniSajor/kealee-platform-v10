import Link from 'next/link'
import Image from 'next/image'
import { NavigationMobile } from './NavigationMobile'

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/products', label: 'Products' },
  { href: '/milestone-pay', label: 'Milestone Pay', highlight: true },
  { href: '/auth/sign-in', label: 'Sign In' },
] as const

export function Navigation() {
  return (
    <header className="sticky top-0 z-[100] border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <nav aria-label="Primary" className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Kealee" width={128} height={32} priority />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                link.highlight
                  ? 'rounded-full bg-teal/15 px-3 py-1 text-sm font-semibold text-teal-dark hover:bg-teal/25'
                  : 'text-sm font-medium text-slate-700 hover:text-builder-orange'
              }
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          <Link
            href="/concept"
            className="rounded-xl bg-builder-orange px-4 py-2 text-sm font-semibold text-white hover:bg-builder-orange-dark"
          >
            Build your project
          </Link>
        </div>

        <NavigationMobile />
      </nav>
    </header>
  )
}
