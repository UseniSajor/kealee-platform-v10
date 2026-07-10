import Link from 'next/link'

export function SiteBottomBar({
  className = '',
  variant = 'light',
}: {
  className?: string
  variant?: 'light' | 'dark'
}) {
  const shell =
    variant === 'dark'
      ? 'border-t border-white/10 bg-[#1A2B4A]'
      : 'border-t border-kealee-black/10 bg-white/90 backdrop-blur-sm'
  const text = variant === 'dark' ? 'text-slate-500' : 'text-kealee-black/55'

  return (
    <div className={`${shell} ${className}`}>
      <div className="mx-auto max-w-7xl px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className={`text-[11px] sm:text-xs ${text} text-center sm:text-left`}>
          © {new Date().getFullYear()} Kealee Services LLC. All rights reserved.
        </p>
        <nav
          className={`flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-1 text-[11px] sm:text-xs ${text}`}
          aria-label="Legal"
        >
          <Link href="/privacy" className="hover:underline underline-offset-2">Privacy Policy</Link>
          <Link href="/terms" className="hover:underline underline-offset-2">Terms of Service</Link>
          <span>Serving the Washington DC Metro Area · DC · MD · VA</span>
        </nav>
      </div>
    </div>
  )
}
