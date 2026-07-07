'use client'

import Link from 'next/link'
import { Play, ChevronLeft, ChevronRight } from 'lucide-react'
import { V30HeroCta } from '@/components/v30/V30HeroCta'
import { useRef, useEffect, useState } from 'react'

interface HeroVideo {
  src: string
  poster: string
  label: string
  description: string
}

export default function HomeHero() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [autoRotate, setAutoRotate] = useState(true)

  const heroVideos: HeroVideo[] = [
    {
      src: process.env.NEXT_PUBLIC_HERO_VIDEO_KITCHEN || '',
      poster: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1400&q=60&auto=format&fit=crop',
      label: 'Kitchen Remodel',
      description: 'designed using AI tools kitchen concepts with professional renderings',
    },
    {
      src: process.env.NEXT_PUBLIC_HERO_VIDEO_ADDITION || '',
      poster: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&q=60&auto=format&fit=crop',
      label: 'Home Addition',
      description: 'New construction & expansion designs with cost estimates',
    },
    {
      src: process.env.NEXT_PUBLIC_HERO_VIDEO_GARDEN || '',
      poster: 'https://images.unsplash.com/photo-1576486213369-148396e848e6?w=1400&q=60&auto=format&fit=crop',
      label: 'Garden & Landscaping',
      description: 'Outdoor living spaces transformed with AI visualization',
    },
  ]

  const currentVideo = heroVideos[currentVideoIndex]

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {/* autoplay blocked — poster shows */})
    }
  }, [currentVideoIndex])

  // Auto-rotate videos every 8 seconds
  useEffect(() => {
    if (!autoRotate) return
    const interval = setInterval(() => {
      setCurrentVideoIndex(prev => (prev + 1) % heroVideos.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [autoRotate, heroVideos.length])

  const handlePrevVideo = () => {
    setAutoRotate(false)
    setCurrentVideoIndex(prev => (prev - 1 + heroVideos.length) % heroVideos.length)
    setTimeout(() => setAutoRotate(true), 10000)
  }

  const handleNextVideo = () => {
    setAutoRotate(false)
    setCurrentVideoIndex(prev => (prev + 1) % heroVideos.length)
    setTimeout(() => setAutoRotate(true), 10000)
  }

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#1A2B4A]">
      {/* Video background with carousel */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-30"
        autoPlay
        muted
        loop
        playsInline
        poster={currentVideo.poster}
        src={currentVideo.src}
        key={currentVideoIndex}
        aria-hidden="true"
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1A2B4A]/90 via-[#1A2B4A]/70 to-[#E8724B]/30" />
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-white to-transparent" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-8 py-32 text-center">
        <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-orange-400 mb-6">
          powered by AI tools Construction Design
        </p>

        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-[1.08] tracking-tight">
          {currentVideo.label}.
          <br className="hidden sm:block" />
          <span className="text-[#E8724B]"> Visualized</span> with AI.
        </h1>

        <p className="mt-6 text-lg sm:text-xl lg:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {currentVideo.description}
        </p>

        {/* Stats row */}
        <div className="mt-10 flex flex-wrap justify-center gap-8">
          {[
            { value: '3–5 days', label: 'Concept delivery' },
            { value: '$99+', label: 'Starting price' },
            { value: 'powered by AI tools', label: 'Design Engine' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-extrabold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-0.5 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <V30HeroCta />
          <a
            href="#services"
            className="flex items-center gap-2 border-2 border-white/30 hover:border-white/60 text-white font-semibold text-base px-8 py-4 rounded-xl transition-all duration-200 hover:bg-white/10"
          >
            <Play className="w-4 h-4 fill-white" />
            Explore Services
          </a>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          No commitment · Delivered in days · Includes permits + cost estimate
        </p>
      </div>

      {/* Video carousel controls */}
      <div className="absolute bottom-20 inset-x-0 flex justify-center gap-3 z-20">
        {heroVideos.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setAutoRotate(false)
              setCurrentVideoIndex(index)
              setTimeout(() => setAutoRotate(true), 10000)
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentVideoIndex
                ? 'bg-white w-8'
                : 'bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`View ${heroVideos[index].label}`}
          />
        ))}
      </div>

      {/* Carousel navigation */}
      <button
        onClick={handlePrevVideo}
        className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition"
        aria-label="Previous project"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={handleNextVideo}
        className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition"
        aria-label="Next project"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 inset-x-0 flex justify-center">
        <a href="#services" aria-label="Scroll to services" className="animate-bounce text-white/40 hover:text-white/70 transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </a>
      </div>
    </section>
  )
}
