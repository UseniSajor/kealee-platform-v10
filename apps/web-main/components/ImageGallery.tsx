'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { MediaImage } from '@/components/media/types'
import { useMediaAnalytics } from '@/hooks/useMediaAnalytics'

interface ImageGalleryProps {
  images: MediaImage[]
  columns?: 2 | 3 | 4
  showFilter?: boolean
  lightbox?: boolean
  context?: string
}

type FilterCategory = 'all' | 'before' | 'after' | 'detail' | 'material'

const CATEGORY_LABELS: FilterCategory[] = ['all', 'before', 'after', 'detail', 'material']

const COL_CLASSES: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}

export function ImageGallery({
  images,
  columns = 3,
  showFilter = true,
  lightbox = true,
  context = 'gallery',
}: ImageGalleryProps) {
  const analytics = useMediaAnalytics(context)
  const [filter, setFilter] = useState<FilterCategory>('all')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const filtered = filter === 'all' ? images : images.filter((img) => img.category === filter)

  // ── Lightbox helpers ─────────────────────────────────────────────────────
  const openLightbox = useCallback(
    (idx: number) => {
      setLightboxIndex(idx)
      analytics.onImageOpen(idx)
    },
    [analytics]
  )

  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  const prev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length))
  }, [filtered.length])

  const next = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % filtered.length))
  }, [filtered.length])

  // ── Keyboard navigation ──────────────────────────────────────────────────
  useEffect(() => {
    if (lightboxIndex === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, closeLightbox, prev, next])

  // ── Touch swipe ──────────────────────────────────────────────────────────
  const touchStartX = useRef(0)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (delta > 50) prev()
    else if (delta < -50) next()
  }

  const currentImage = lightboxIndex !== null ? filtered[lightboxIndex] : null

  // Determine which categories are present
  const presentCategories = CATEGORY_LABELS.filter(
    (cat) => cat === 'all' || images.some((img) => img.category === cat)
  )

  return (
    <>
      {/* ── Filter tabs ────────────────────────────────────────────────────── */}
      {showFilter && presentCategories.length > 2 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {presentCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-all"
              style={{
                backgroundColor: filter === cat ? '#1A2B4A' : '#fff',
                borderColor: filter === cat ? '#1A2B4A' : '#E5E7EB',
                color: filter === cat ? '#fff' : '#6B7280',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      <div className={`grid gap-3 ${COL_CLASSES[columns] ?? COL_CLASSES[3]}`}>
        <AnimatePresence>
          {filtered.map((img, idx) => (
            <motion.div
              key={img.src}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`relative overflow-hidden rounded-xl bg-gray-100 ${lightbox ? 'cursor-pointer' : ''}`}
              style={{ aspectRatio: '4/3' }}
              onClick={() => lightbox && openLightbox(idx)}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
                placeholder={img.blurDataUrl ? 'blur' : 'empty'}
                blurDataURL={img.blurDataUrl}
              />
              {img.category && (
                <span className="absolute top-2 left-2 rounded-md bg-black/50 px-2 py-0.5 text-xs font-semibold capitalize text-white backdrop-blur-sm">
                  {img.category}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxIndex !== null && currentImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={closeLightbox}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-h-[90vh] max-w-5xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: '4/3' }}>
                <Image
                  src={currentImage.src}
                  alt={currentImage.alt}
                  fill
                  sizes="90vw"
                  className="object-contain"
                  priority
                />
              </div>

              {/* Caption */}
              <p className="mt-3 text-center text-sm text-white/70">{currentImage.alt}</p>

              {/* Controls */}
              <button
                className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                onClick={closeLightbox}
              >
                <X className="h-4 w-4" />
              </button>

              {filtered.length > 1 && (
                <>
                  <button
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                    onClick={prev}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                    onClick={next}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Download */}
              <a
                href={currentImage.src}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-12 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="h-4 w-4" />
              </a>

              {/* Counter */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-sm">
                {lightboxIndex + 1} / {filtered.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

