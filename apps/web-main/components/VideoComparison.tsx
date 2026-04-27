'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Play, Pause, Maximize2, Minimize2 } from 'lucide-react'

export interface VideoComparisonProps {
  beforeVideoUrl: string
  afterVideoUrl: string
  projectType: 'kitchen' | 'bathroom' | 'garden' | 'landscape' | string
  projectTitle: string
  duration?: number
}

// ─── Fallback placeholder when no video is available ─────────────────────────

function VideoPlaceholder({ label, type }: { label: string; type: 'before' | 'after' }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
      <div className="text-5xl mb-3">{type === 'before' ? '📷' : '✨'}</div>
      <p className="text-sm font-semibold text-gray-600">{label}</p>
      <p className="text-xs text-gray-400 mt-1">
        {type === 'before' ? 'Current space' : 'AI concept render'}
      </p>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VideoComparison({
  beforeVideoUrl,
  afterVideoUrl,
  projectType: _projectType,
  projectTitle,
  duration,
}: VideoComparisonProps) {
  const [sliderPos, setSliderPos] = useState(50)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [beforeError, setBeforeError] = useState(!beforeVideoUrl)
  const [afterError, setAfterError] = useState(!afterVideoUrl)

  const containerRef = useRef<HTMLDivElement>(null)
  const fullscreenRef = useRef<HTMLDivElement>(null)
  const beforeVideoRef = useRef<HTMLVideoElement>(null)
  const afterVideoRef = useRef<HTMLVideoElement>(null)

  // ── Fullscreen listener ────────────────────────────────────────────────────
  useEffect(() => {
    function onChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // ── Play / Pause ───────────────────────────────────────────────────────────
  function togglePlay() {
    const b = beforeVideoRef.current
    const a = afterVideoRef.current
    if (!b && !a) return
    if (isPlaying) {
      b?.pause(); a?.pause()
    } else {
      b?.play(); a?.play()
    }
    setIsPlaying(v => !v)
  }

  // ── Fullscreen ─────────────────────────────────────────────────────────────
  function toggleFullscreen() {
    const el = fullscreenRef.current
    if (!el) return
    if (!isFullscreen) {
      el.requestFullscreen?.().catch(() => null)
    } else {
      document.exitFullscreen?.()
    }
  }

  // ── Slider position ────────────────────────────────────────────────────────
  const updateSlider = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const pos = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100))
    setSliderPos(pos)
  }, [])

  // ── Mouse drag ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isDragging) return
    function onMove(e: MouseEvent) { updateSlider(e.clientX) }
    function onUp() { setIsDragging(false) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isDragging, updateSlider])

  // ── Touch drag ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isDragging) return
    function onMove(e: TouchEvent) { updateSlider(e.touches[0].clientX) }
    function onEnd() { setIsDragging(false) }
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [isDragging, updateSlider])

  // Container click → move slider (unless clicking a control)
  function onContainerPointerDown(e: React.PointerEvent) {
    const target = e.target as HTMLElement
    if (target.closest('[data-no-drag]')) return
    setIsDragging(true)
    updateSlider(e.clientX)
  }

  return (
    <div ref={fullscreenRef} className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-950 shadow-lg">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#2ABFBF]" />
          <p className="text-sm font-semibold text-white">Before / After Concept</p>
          <span className="text-xs text-gray-500 hidden sm:inline">— {projectTitle}</span>
        </div>
        {duration && (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-400">
            {duration}s
          </span>
        )}
      </div>

      {/* ── Comparison Viewport ─────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative select-none overflow-hidden"
        style={{ aspectRatio: '16/9', cursor: isDragging ? 'col-resize' : 'col-resize' }}
        onPointerDown={onContainerPointerDown}
      >
        {/* After side (full-width base) */}
        <div className="absolute inset-0 bg-gray-800">
          {afterError ? (
            <VideoPlaceholder label="AI Concept Render" type="after" />
          ) : (
            <video
              ref={afterVideoRef}
              src={afterVideoUrl}
              className="h-full w-full object-cover"
              muted
              loop
              playsInline
              onError={() => setAfterError(true)}
            />
          )}
          <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-[#2ABFBF] backdrop-blur-sm">
            After
          </span>
        </div>

        {/* Before side (clipped) */}
        <div
          className="absolute inset-0 bg-gray-700 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          {beforeError ? (
            <VideoPlaceholder label="Current Space" type="before" />
          ) : (
            <video
              ref={beforeVideoRef}
              src={beforeVideoUrl}
              className="h-full w-full object-cover"
              muted
              loop
              playsInline
              onError={() => setBeforeError(true)}
            />
          )}
          <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            Before
          </span>
        </div>

        {/* Divider line */}
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]"
          style={{ left: `${sliderPos}%` }}
        >
          {/* Drag handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-black/50 backdrop-blur-sm shadow-lg pointer-events-auto cursor-col-resize">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l-6-6 6-6M15 6l6 6-6 6" />
            </svg>
          </div>
        </div>

        {/* Play / Pause */}
        <button
          data-no-drag
          className="absolute bottom-3 left-1/2 z-20 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/80"
          onClick={togglePlay}
        >
          {isPlaying
            ? <Pause className="h-4 w-4" />
            : <Play className="h-4 w-4 translate-x-0.5" />
          }
        </button>

        {/* Fullscreen toggle */}
        <button
          data-no-drag
          className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/80"
          onClick={toggleFullscreen}
        >
          {isFullscreen
            ? <Minimize2 className="h-3.5 w-3.5" />
            : <Maximize2 className="h-3.5 w-3.5" />
          }
        </button>
      </div>

      {/* ── Instruction Bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-t border-white/5">
        <p className="text-xs text-gray-500">
          Drag the slider to compare before &amp; after
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
            Before
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2ABFBF]" />
            After
          </span>
        </div>
      </div>
    </div>
  )
}
