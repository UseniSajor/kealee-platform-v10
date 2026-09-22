/**
 * Kealee brand lockups.
 *
 * - KealeeKeystoneIcon: the keystone "K" enclosed in the rounded orange
 *   keystone shape — favicon / app icon / social icon (navicon).
 * - KealeeLogo: the shared site and checkout lockup — the keystone "K" with
 *   the design.build.deliver. tagline beneath.
 *
 * Inline SVG so the wordmark inherits page fonts and stays crisp.
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
    <span className="flex flex-col items-center leading-none">
      <KealeeKeystoneIcon className={compact ? 'h-8 w-8' : 'h-9 w-9'} />
      <span className={`mt-1 whitespace-nowrap font-medium lowercase text-slate-500 ${compact ? 'text-[6px] tracking-[0.08em]' : 'text-[7px] tracking-[0.12em]'}`}>
        design<span className="text-orange-600">.</span> build<span className="text-orange-600">.</span> deliver<span className="text-orange-600">.</span>
      </span>
    </span>
  )
}
