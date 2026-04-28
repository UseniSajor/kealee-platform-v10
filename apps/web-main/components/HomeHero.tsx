'use client'

import Link from 'next/link'
import { ArrowRight, Play } from 'lucide-react'
import { useRef, useEffect } from 'react'

export default function HomeHero() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {/* autoplay blocked — poster shows */})
    }
  }, [])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#1A2B4A]">
      {/* Video background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-30"
        autoPlay
        muted
        loop
        playsInline
        poster="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1400&q=60&auto=format&fit=crop"
        src=""
        aria-hidden="true"
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1A2B4A]/90 via-[#1A2B4A]/70 to-[#E8724B]/30" />
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-white to-transparent" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-8 py-32 text-center">
        <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-orange-400 mb-6">
          AI-Powered Construction Design
        </p>

        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-[1.08] tracking-tight">
          Transform Your Home.
          <br className="hidden sm:block" />
          <span className="text-[#E8724B]"> Visualize</span> Your Future.
        </h1>

        <p className="mt-6 text-lg sm:text-xl lg:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Get AI-designed concepts with professional videos, cost estimates, and permit roadmaps — in days, not months.
        </p>

        {/* Stats row */}
        <div className="mt-10 flex flex-wrap justify-center gap-8">
          {[
            { value: '3–5 days', label: 'Concept delivery' },
            { value: '$99+', label: 'Starting price' },
            { value: 'AI-Powered', label: 'Design Engine' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-extrabold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-0.5 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/concept">
            <button className="group flex items-center gap-3 bg-[#E8724B] hover:bg-[#D45C33] active:bg-[#B84A28] text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-200 hover:-translate-y-0.5">
              Build Your Project
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
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
