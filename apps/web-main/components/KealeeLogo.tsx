/**
 * Kealee brand lockups.
 *
 * - KealeeKeystoneIcon: the keystone "K" enclosed in the rounded orange
 *   keystone shape — favicon / app icon / social icon (navicon).
 * - KealeeLogo: the PRIMARY logo — the "Kealee" wordmark in white inside
 *   the orange keystone shape, with CONSTRUCTION + tagline beneath.
 *   Matches the brand sheet's top-left "PRIMARY LOGO".
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
      {/* Wordmark inside the orange keystone shape */}
      <svg
        viewBox="0 0 230 74"
        xmlns="http://www.w3.org/2000/svg"
        className={compact ? 'h-7 w-auto' : 'h-8 w-auto'}
        aria-hidden="true"
      >
        <polygon points="10,16 220,6 214,66 16,68" fill="#EE7326" stroke="#EE7326" strokeWidth="11" strokeLinejoin="round" />
        <text
          x="115"
          y="51"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="var(--font-nunito-display), 'Nunito', ui-rounded, system-ui, sans-serif"
          fontWeight="800"
          fontSize="42"
          letterSpacing="-0.5"
        >
          Kealee
        </text>
      </svg>
      {/* CONSTRUCTION + tagline */}
      <span className={`mt-1 font-semibold uppercase text-slate-600 ${compact ? 'text-[7px] tracking-[0.3em]' : 'text-[8px] tracking-[0.34em]'}`}>
        Construction
      </span>
      {!compact && (
        <span className="mt-0.5 text-[7px] font-medium lowercase tracking-[0.14em] text-slate-400">
          design<span className="text-orange-600">.</span> build<span className="text-orange-600">.</span> deliver<span className="text-orange-600">.</span>
        </span>
      )}
    </span>
  )
}
