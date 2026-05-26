'use client'

/**
 * BeforeAfterMedia
 *
 * Toggle between the user's original photos (intake uploads stored in
 * conceptOutput.beforeUrls) and the AI concept renders, with an index strip
 * when multiple images exist.
 */

import { useState } from 'react'

interface BeforeAfterMediaProps {
  beforeUrls: string[]
  afterUrls: string[]
  projectType: string
}

export function BeforeAfterMedia({ beforeUrls, afterUrls, projectType }: BeforeAfterMediaProps) {
  const [showBefore, setShowBefore] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const currentBefore = beforeUrls[Math.min(activeIndex, beforeUrls.length - 1)]
  const currentAfter  = afterUrls[Math.min(activeIndex, afterUrls.length - 1)]
  const displayUrl    = showBefore ? currentBefore : currentAfter
  const stripUrls     = showBefore ? beforeUrls : afterUrls
  const count         = Math.max(beforeUrls.length, afterUrls.length)

  if (!currentBefore || !currentAfter) return null

  return (
    <div className="space-y-3">
      {/* Before / After toggle */}
      <div className="flex items-center justify-between">
        <div
          className="flex rounded-xl overflow-hidden border"
          style={{ borderColor: '#E8E6DF' }}
        >
          <button
            onClick={() => setShowBefore(false)}
            className="px-4 py-1.5 text-sm font-semibold transition-colors"
            style={{
              backgroundColor: !showBefore ? '#E8793A' : 'transparent',
              color: !showBefore ? '#fff' : '#6b7280',
            }}
          >
            After (concept)
          </button>
          <button
            onClick={() => setShowBefore(true)}
            className="px-4 py-1.5 text-sm font-semibold transition-colors"
            style={{
              backgroundColor: showBefore ? '#1A2B4A' : 'transparent',
              color: showBefore ? '#fff' : '#6b7280',
            }}
          >
            Before (existing)
          </button>
        </div>
        <span className="text-xs text-gray-400">
          {showBefore ? 'Your current space' : `AI ${projectType} concept`}
        </span>
      </div>

      {/* Main image */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={displayUrl}
          src={displayUrl}
          alt={showBefore ? `Existing ${projectType}` : `AI ${projectType} concept`}
          className="w-full h-full object-cover transition-opacity duration-200"
        />
        {/* Badge */}
        <span
          className="absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-bold text-white backdrop-blur-sm"
          style={{ backgroundColor: showBefore ? 'rgba(26,43,74,0.85)' : 'rgba(232,121,58,0.88)' }}
        >
          {showBefore ? 'Before' : 'After'}
        </span>
      </div>

      {/* Thumbnail strip (when multiple images) */}
      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {stripUrls.map((url, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className="flex-shrink-0 h-12 w-16 rounded-lg overflow-hidden border-2 transition-all"
              style={{
                borderColor: activeIndex === i ? '#E8793A' : 'transparent',
                opacity: activeIndex === i ? 1 : 0.65,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
