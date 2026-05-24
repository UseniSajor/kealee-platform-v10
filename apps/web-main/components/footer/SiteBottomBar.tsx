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
      : 'border-t border-charcoal/10 bg-white/90 backdrop-blur-sm'
  const text = variant === 'dark' ? 'text-slate-500' : 'text-charcoal/55'

  return (
    <div className={`${shell} ${className}`}>
      <div className="mx-auto max-w-7xl px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className={`text-[11px] sm:text-xs ${text} text-center sm:text-left`}>
          © 2026 Kealee Platform LLC · Washington DC Metro Area
        </p>
        <p className={`text-[11px] sm:text-xs ${text} text-center sm:text-right`}>
          Kealee Construction LLC est. 2002 · DC · MD · VA
        </p>
      </div>
    </div>
  )
}
