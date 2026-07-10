/**
 * Kealee primary logo lockup — keystone "K" icon (enclosed in the rounded
 * keystone shape) + wordmark. Inline SVG so it stays crisp at any size and
 * inherits no font issues. Matches /public/brand/kealee-keystone-icon.svg.
 */

export function KealeeKeystoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <polygon points="11,15 91,7 85,93 15,93" fill="#EE7326" stroke="#EE7326" strokeWidth="12" strokeLinejoin="round" />
      <polygon points="14,17.5 87.5,10.5 82,89.5 18,89.5" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinejoin="round" opacity="0.9" />
      <g transform="translate(20.5,21) scale(0.60)" fill="#FFFFFF">
        <polygon points="12,4 40,4 32,96 16,96" />
        <polygon points="86,4 56,4 40,46 64,46" />
        <polygon points="60,54 40,54 62,96 88,96" />
      </g>
    </svg>
  )
}

export function KealeeLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <KealeeKeystoneIcon className={compact ? 'h-8 w-8 shrink-0' : 'h-9 w-9 shrink-0'} />
      <span className="flex flex-col leading-none">
        <span className={`font-display font-extrabold tracking-tight text-slate-900 ${compact ? 'text-xl' : 'text-2xl'}`}>
          Kealee
        </span>
        <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.32em] text-slate-500">
          Construction
        </span>
      </span>
    </span>
  )
}
