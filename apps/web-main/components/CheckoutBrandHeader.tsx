import Link from 'next/link'
import { LockKeyhole } from 'lucide-react'
import { KealeeLogo } from '@/components/KealeeLogo'

interface CheckoutBrandHeaderProps {
  compact?: boolean
}

/**
 * Distraction-free checkout branding that uses the same primary logo as the
 * public website navigation. Checkout routes intentionally hide the full nav.
 */
export function CheckoutBrandHeader({ compact = false }: CheckoutBrandHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className={`mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 ${compact ? 'py-3' : 'py-4'}`}>
        <Link href="/" className="inline-flex items-center" aria-label="Kealee home">
          <KealeeLogo compact={compact} />
        </Link>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <LockKeyhole className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
          Secure checkout
        </span>
      </div>
    </header>
  )
}
