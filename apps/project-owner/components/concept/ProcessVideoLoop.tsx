'use client'

/**
 * ProcessVideoLoop
 *
 * Muted, auto-playing loop of the AI transformation / process video.
 * Used as a "preview" teaser in the concept package — the user can also
 * open the full player or download from the parent section.
 */

import { useEffect, useRef } from 'react'

interface ProcessVideoLoopProps {
  src: string
  /** Visible label above the video. Defaults to nothing. */
  label?: string
  /** Additional Tailwind classes on the wrapper. */
  className?: string
  /** Max height in px. Defaults to 280. */
  maxHeightPx?: number
}

export function ProcessVideoLoop({
  src,
  label,
  className = '',
  maxHeightPx = 280,
}: ProcessVideoLoopProps) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    ref.current?.play().catch(() => {})
  }, [src])

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6b7280' }}>
          {label}
        </p>
      )}
      <div className="relative rounded-2xl overflow-hidden bg-black">
        <video
          ref={ref}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          className="w-full object-cover"
          style={{ maxHeight: `${maxHeightPx}px` }}
        />
        {/* Muted indicator */}
        <span
          className="absolute bottom-2 right-2 rounded-full px-2 py-0.5 text-xs text-white/70"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        >
          Preview loop
        </span>
      </div>
    </div>
  )
}
