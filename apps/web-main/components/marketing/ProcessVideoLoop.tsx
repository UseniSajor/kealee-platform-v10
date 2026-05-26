'use client'

import { useEffect, useRef } from 'react'
import { Play } from 'lucide-react'

interface ProcessVideoLoopProps {
  src: string
  webm?: string
  poster?: string
  className?: string
  autoPlayInView?: boolean
}

export function ProcessVideoLoop({
  src,
  webm,
  poster,
  className = 'absolute inset-0 h-full w-full object-cover',
  autoPlayInView = true,
}: ProcessVideoLoopProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!autoPlayInView) return
    const el = rootRef.current
    const video = videoRef.current
    if (!el || !video) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.25 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [autoPlayInView, src])

  return (
    <div ref={rootRef} className="absolute inset-0">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
        className={className}
      >
        {webm && <source src={webm} type="video/webm" />}
        <source src={src} type="video/mp4" />
      </video>
      <div
        className="pointer-events-none absolute top-3 right-3 rounded-full bg-black/40 p-1.5 backdrop-blur-sm"
        aria-hidden
      >
        <Play className="h-3.5 w-3.5 fill-white text-white" />
      </div>
    </div>
  )
}
