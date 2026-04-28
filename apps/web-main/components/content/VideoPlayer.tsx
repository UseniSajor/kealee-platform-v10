'use client'

import { useRef, useState } from 'react'
import { Download, Share2, Maximize2, Volume2, VolumeX } from 'lucide-react'

interface VideoPlayerProps {
  videoUrl: string
  duration?: number
  tier: 1 | 2 | 3
  poster?: string
}

export function VideoPlayer({ videoUrl, duration = 60, tier, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState('60s')

  const totalTime = videoRef.current?.duration || duration

  function togglePlay() {
    if (!videoRef.current) return
    if (isPlaying) videoRef.current.pause()
    else videoRef.current.play()
  }

  function handleFullscreen() {
    if (!videoRef.current) return
    videoRef.current.requestFullscreen?.()
  }

  function handleDownload() {
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `kealee-concept-${Date.now()}.mp4`
    a.click()
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: 'My Kealee Concept', url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl overflow-hidden bg-black shadow-xl">
      {/* Video */}
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          poster={poster}
          className="w-full h-full object-cover"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          muted={muted}
        />

        {/* Play overlay */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group"
          >
            <div className="w-20 h-20 rounded-full bg-[#E8724B] shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </button>
        )}

        {/* Click to play/pause */}
        {isPlaying && (
          <button onClick={togglePlay} className="absolute inset-0" aria-label="Pause" />
        )}
      </div>

      {/* Controls */}
      <div className="bg-slate-900 px-4 py-3 space-y-2">
        {/* Progress */}
        <input
          type="range"
          min={0}
          max={totalTime}
          step={0.1}
          value={currentTime}
          onChange={(e) => {
            const t = parseFloat(e.target.value)
            if (videoRef.current) videoRef.current.currentTime = t
            setCurrentTime(t)
          }}
          className="w-full h-1.5 rounded-full bg-slate-700 accent-[#E8724B] cursor-pointer"
        />

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="text-white hover:text-[#E8724B] transition-colors">
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Mute */}
            <button onClick={() => setMuted(!muted)} className="text-slate-400 hover:text-white transition-colors">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Volume */}
            <input
              type="range"
              min={0} max={1} step={0.05}
              value={volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                setVolume(v)
                if (videoRef.current) videoRef.current.volume = v
              }}
              className="w-16 h-1 rounded-full bg-slate-700 accent-[#E8724B] hidden sm:block"
            />

            <span className="text-slate-400 text-xs">{fmt(currentTime)} / {fmt(totalTime)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleDownload} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded hover:bg-slate-800" title="Download">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={handleShare} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded hover:bg-slate-800" title="Share">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={handleFullscreen} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded hover:bg-slate-800" title="Fullscreen">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tier 3: Video version switcher */}
      {tier === 3 && (
        <div className="bg-slate-900 border-t border-slate-800 px-4 py-3">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">Video Versions</p>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: '60s Full', desc: 'YouTube/email' },
              { label: '30s Mobile', desc: 'Facebook/Instagram' },
              { label: '15s Social', desc: 'TikTok/Reels' },
              { label: '10s Preview', desc: 'Stories' },
            ].map((v) => (
              <button
                key={v.label}
                onClick={() => setSelectedVersion(v.label)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedVersion === v.label
                    ? 'bg-[#E8724B] text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {v.label}
                <span className="block text-[10px] opacity-70">{v.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
