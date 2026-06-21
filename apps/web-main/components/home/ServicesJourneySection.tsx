'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Cormorant_Garamond, Barlow } from 'next/font/google'
import { Play, Image as ImageIcon, Video } from 'lucide-react'
import { CircularServiceCard } from './CircularServiceCard'
import type { HomeJourneyService } from './home-services-data'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-home-serif',
  display: 'swap',
})

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-home-sans',
  display: 'swap',
})

/**
 * Full-viewport homepage: sub-header + 2×2 service cards + site bottom bar.
 * Layout reserves space for sticky nav (4rem) and fixed AskChatBar (~7.5rem).
 */
export function ServicesJourneySection({ services }: { services: HomeJourneyService[] }) {
  const [activeTab, setActiveTab] = useState<'video' | 'before-after'>('video')
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isSliding, setIsSliding] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || activeTab !== 'video') return
    video.muted = true
    video.play().catch((err) => {
      console.warn('AI reveal video autoplay blocked:', err)
    })
  }, [activeTab])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!sliderRef.current || (!isSliding && e.buttons !== 1)) return
    const rect = sliderRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percent)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!sliderRef.current) return
    const rect = sliderRef.current.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percent)
  }

  return (
    <section
      id="services"
      role="region"
      aria-label="Kealee core services"
      className={`${cormorant.variable} ${barlow.variable} home-cards-shell flex flex-col bg-[#F5F5F5]`}
    >
      {/* Hero Header */}
      <header className="shrink-0 border-b border-charcoal/8 bg-white/95 px-4 py-6 backdrop-blur-sm sm:py-8 lg:py-10">
        <div className="mx-auto max-w-[1200px] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: copywriting */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-4">
            <span className="inline-block rounded-full bg-slate-900/5 px-3.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[#E8724B]">
              End-to-end design-build platform · DC, MD &amp; VA
            </span>
            <h1 className="font-home-serif text-3xl font-bold leading-tight text-charcoal sm:text-4xl lg:text-[42px]">
              From First Concept to <span className="text-[#E8724B]">Final Build</span>
            </h1>
            <p className="font-home-sans max-w-xl mx-auto lg:mx-0 text-sm sm:text-base text-charcoal/75 leading-relaxed">
              Design concepts · cost estimates · permit filing · project workspace — everything your project needs, in one place
            </p>
          </div>

          {/* Right: Interactive media showcase */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            {/* Tab Selector */}
            <div className="flex bg-slate-100 rounded-xl p-1 mb-3 text-[11px] font-bold shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('video')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'video' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Video className="h-3.5 w-3.5" />
                AI Reveal Video
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('before-after')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'before-after' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Before &amp; After
              </button>
            </div>

            {/* Media showcase frame */}
            <div className="relative w-full aspect-[16/10] max-w-[460px] bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-200">
              {activeTab === 'video' ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    <source src="/media/service-videos/design-concepts.mp4" type="video/mp4" />
                  </video>
                  {/* Subtle pulsing AI overlay */}
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md rounded-lg px-2.5 py-1 flex items-center gap-1.5 border border-white/10">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider">AI Concept Walkthrough</span>
                  </div>
                </div>
              ) : (
                <div
                  ref={sliderRef}
                  onMouseMove={handleMouseMove}
                  onMouseDown={() => setIsSliding(true)}
                  onMouseUp={() => setIsSliding(false)}
                  onMouseLeave={() => setIsSliding(false)}
                  onTouchMove={handleTouchMove}
                  className="relative w-full h-full select-none cursor-ew-resize"
                >
                  {/* After Image */}
                  <img
                    src="/media/service-photos/home-design.jpg"
                    alt="After AI Design Concept"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    draggable={false}
                  />
                  <span className="absolute bottom-3 right-3 z-10 px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded text-[9px] font-bold text-white uppercase tracking-wider">
                    After (AI Design Concept)
                  </span>

                  {/* Before Image with clipPath */}
                  <img
                    src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80"
                    alt="Before Concept"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
                    draggable={false}
                  />
                  <span className="absolute bottom-3 left-3 z-10 px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded text-[9px] font-bold text-white uppercase tracking-wider">
                    Before
                  </span>

                  {/* Slider Divider Line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white z-20 pointer-events-none"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center text-[10px] text-slate-700 font-bold">
                      ↔
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Cards listed in single column */}
      <div className="flex flex-col px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12 bg-[#F5F5F5]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mx-auto flex flex-col w-full max-w-[1160px] gap-6 sm:gap-8 lg:gap-10"
          role="list"
          aria-label="Service offerings"
        >
          {services.map((service, index) => (
            <div key={service.id} role="listitem" className="w-full">
              <CircularServiceCard service={service} index={index} />
            </div>
          ))}
        </motion.div>
      </div>

    </section>
  )
}
