'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface VideoModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  videoId?: string   // YouTube video ID
  videoSrc?: string  // direct video src (fallback)
}

export function VideoModal({ isOpen, onClose, title, videoId, videoSrc }: VideoModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-black"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="Close video"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title */}
        <div className="border-b border-white/10 px-6 py-4">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>

        {/* Video */}
        <div className="relative aspect-video">
          {videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          ) : videoSrc ? (
            <video src={videoSrc} controls autoPlay className="h-full w-full" />
          ) : (
            <div className="flex h-full w-full items-center justify-center" style={{ background: '#111' }}>
              <div className="text-center">
                <div className="mb-3 text-4xl">▶</div>
                <p className="text-sm text-gray-400">Demo video coming soon</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
