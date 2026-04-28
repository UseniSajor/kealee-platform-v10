'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'

export interface GalleryImage {
  src: string
  alt: string
  category?: string
  width?: number
  height?: number
}

interface Props {
  images: GalleryImage[]
  columns?: 2 | 3 | 4
  showFilter?: boolean
}

const COL_CLASS: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
}

export function ImageGallery({ images, columns = 3, showFilter = false }: Props) {
  const [active, setActive] = useState<string>('all')
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  // Derive unique categories
  const categories = ['all', ...Array.from(new Set(images.map((i) => i.category).filter(Boolean) as string[]))]

  const filtered = active === 'all' ? images : images.filter((i) => i.category === active)

  function openLightbox(idx: number) {
    setLightboxIdx(idx)
  }
  function closeLightbox() {
    setLightboxIdx(null)
  }
  const prev = useCallback(() => {
    setLightboxIdx((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length))
  }, [filtered.length])
  const next = useCallback(() => {
    setLightboxIdx((i) => (i === null ? null : (i + 1) % filtered.length))
  }, [filtered.length])

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIdx === null) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxIdx, prev, next])

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (lightboxIdx !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [lightboxIdx])

  return (
    <div>
      {/* Filter tabs */}
      {showFilter && categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`capitalize rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                active === cat
                  ? 'bg-[#E8724B] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className={`grid ${COL_CLASS[columns]} gap-3`}>
        {filtered.map((img, i) => (
          <button
            key={i}
            onClick={() => openLightbox(i)}
            className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#E8724B]"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
              <ZoomIn className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition drop-shadow-lg" />
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white transition z-10"
            onClick={closeLightbox}
            aria-label="Close"
          >
            <X className="w-7 h-7" />
          </button>

          {/* Prev */}
          {filtered.length > 1 && (
            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition z-10 p-2"
              onClick={(e) => { e.stopPropagation(); prev() }}
              aria-label="Previous"
            >
              <ChevronLeft className="w-9 h-9" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-w-4xl w-full max-h-[85vh] aspect-[4/3] rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={filtered[lightboxIdx].src}
              alt={filtered[lightboxIdx].alt}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Next */}
          {filtered.length > 1 && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition z-10 p-2"
              onClick={(e) => { e.stopPropagation(); next() }}
              aria-label="Next"
            >
              <ChevronRight className="w-9 h-9" />
            </button>
          )}

          {/* Counter */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm tabular-nums">
            {lightboxIdx + 1} / {filtered.length}
          </p>
        </div>
      )}
    </div>
  )
}
