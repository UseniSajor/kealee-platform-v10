'use client'

import Image from 'next/image'
import { useState } from 'react'

interface BeforeAfterMediaProps {
  beforeUrl?: string
  afterUrl: string
  alt: string
  className?: string
  sizes?: string
  priority?: boolean
}

export function BeforeAfterMedia({
  beforeUrl,
  afterUrl,
  alt,
  className = 'relative h-full w-full',
  sizes = '100vw',
  priority = false,
}: BeforeAfterMediaProps) {
  const [showBefore, setShowBefore] = useState(false)
  const hasBefore = Boolean(beforeUrl)

  return (
    <div className={className}>
      <Image
        src={showBefore && beforeUrl ? beforeUrl : afterUrl}
        alt={hasBefore && showBefore ? `${alt} — before` : `${alt} — after`}
        fill
        className="object-cover"
        sizes={sizes}
        priority={priority}
      />
      {hasBefore && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 rounded-full bg-black/55 p-0.5 backdrop-blur-sm">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowBefore(true)
            }}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
              showBefore ? 'bg-white text-slate-900' : 'text-white/90 hover:text-white'
            }`}
          >
            Before
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowBefore(false)
            }}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
              !showBefore ? 'bg-white text-slate-900' : 'text-white/90 hover:text-white'
            }`}
          >
            After
          </button>
        </div>
      )}
    </div>
  )
}
