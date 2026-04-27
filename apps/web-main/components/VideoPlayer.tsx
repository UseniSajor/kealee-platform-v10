'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react'
import type { MediaVideo } from '@/components/media/types'
import { useMediaAnalytics } from '@/hooks/useMediaAnalytics'

interface VideoPlayerProps {
  video: MediaVideo
  className?: string
  autoPlayOnScroll?: boolean
  showControls?: boolean
  context?: string
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// ─── Placeholder shown when src is empty ────────────────────────────────────
function VideoPlaceholder({ label }: { label?: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 mb-4">
        <Play className="h-7 w-7 text-white/60 translate-x-0.5" />
      </div>
      <p className="text-sm font-semibold text-white/80">{label ?? 'Video Preview'}</p>
      <p className="text-xs text-white/40 mt-1">Video coming soon</p>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export function VideoPlayer({
  video,
  className = '',
  autoPlayOnScroll = false,
  showControls = true,
  context = 'video_player',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const analytics = useMediaAnalytics(context)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [error, setError] = useState(false)

  const isEmpty = !video.src

  // ── Auto-play on scroll (muted only) ────────────────────────────────────
  useEffect(() => {
    if (!autoPlayOnScroll || isEmpty) return
    const el = containerRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(() => null)
          setPlaying(true)
        } else {
          videoRef.current?.pause()
          setPlaying(false)
        }
      },
      { threshold: 0.5 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [autoPlayOnScroll, isEmpty])

  // ── Fullscreen change listener ───────────────────────────────────────────
  useEffect(() => {
    function onChange() {
      setFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = containerRef.current
      if (!el?.contains(document.activeElement) && document.activeElement !== el) return
      if (e.code === 'Space') { e.preventDefault(); togglePlay() }
      if (e.code === 'ArrowLeft') { seek(-10) }
      if (e.code === 'ArrowRight') { seek(10) }
      if (e.code === 'KeyF') { toggleFullscreen() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play().then(() => {
        setPlaying(true)
        analytics.onVideoPlay(video.label ?? context)
      }).catch(() => null)
    } else {
      v.pause()
      setPlaying(false)
    }
  }, [analytics, context, video.label])

  const seek = useCallback((delta: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta))
  }, [])

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  const toggleFullscreen = () => {
    const el = containerRef.current
    if (!el) return
    if (!fullscreen) {
      el.requestFullscreen?.().catch(() => null)
    } else {
      document.exitFullscreen?.()
    }
  }

  const onTimeUpdate = () => {
    const v = videoRef.current
    if (!v || !v.duration) return
    setCurrentTime(v.currentTime)
    setProgress((v.currentTime / v.duration) * 100)
    if (v.currentTime >= v.duration - 0.5) {
      analytics.onVideoComplete(video.label ?? context, 100)
    }
  }

  const onLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration)
  }

  const seekToClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = progressRef.current?.getBoundingClientRect()
    const v = videoRef.current
    if (!rect || !v || !v.duration) return
    const pct = (e.clientX - rect.left) / rect.width
    v.currentTime = pct * v.duration
  }

  // Touch tap to toggle play
  const onTap = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('[data-control]')) return
    if (!isEmpty) togglePlay()
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`relative overflow-hidden rounded-2xl bg-slate-900 outline-none ${className}`}
      style={{ aspectRatio: '16/9' }}
      onClick={onTap}
    >
      {/* ── Video or placeholder ─────────────────────────────────────────── */}
      {isEmpty || error ? (
        <VideoPlaceholder label={video.label} />
      ) : (
        <video
          ref={videoRef}
          src={video.src}
          poster={video.posterUrl}
          muted={muted}
          playsInline
          loop
          className="absolute inset-0 h-full w-full object-cover"
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => setError(true)}
        />
      )}

      {/* ── Controls overlay ─────────────────────────────────────────────── */}
      {showControls && !isEmpty && !error && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8">
          {/* Progress bar */}
          <div
            ref={progressRef}
            data-control
            className="mb-2 h-1 w-full cursor-pointer rounded-full bg-white/20"
            onClick={seekToClick}
          >
            <div
              className="h-full rounded-full bg-[#2ABFBF] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              data-control
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition"
              onClick={togglePlay}
            >
              {playing
                ? <Pause className="h-3.5 w-3.5" />
                : <Play className="h-3.5 w-3.5 translate-x-px" />
              }
            </button>

            {/* Time */}
            <span className="text-xs text-white/70 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="ml-auto flex items-center gap-2">
              {/* Mute */}
              <button
                data-control
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition"
                onClick={toggleMute}
              >
                {muted
                  ? <VolumeX className="h-3.5 w-3.5" />
                  : <Volume2 className="h-3.5 w-3.5" />
                }
              </button>

              {/* Fullscreen */}
              <button
                data-control
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition"
                onClick={toggleFullscreen}
              >
                {fullscreen
                  ? <Minimize2 className="h-3.5 w-3.5" />
                  : <Maximize2 className="h-3.5 w-3.5" />
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Play button overlay when paused and not empty ───────────────── */}
      {!isEmpty && !error && !playing && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
            <Play className="h-6 w-6 translate-x-0.5 text-white" />
          </div>
        </div>
      )}
    </div>
  )
}
