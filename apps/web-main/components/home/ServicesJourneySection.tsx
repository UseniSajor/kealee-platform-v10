'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cormorant_Garamond, Barlow } from 'next/font/google'
import { Play, Image as ImageIcon, Video } from 'lucide-react'
import Link from 'next/link'
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

const HERO_VIDEOS = [
  '/media/hero-videos/hero-new-construction.mp4',
  '/media/hero-videos/hero-facade-transformation.mp4',
  '/media/hero-videos/hero-interior-renovation.mp4',
  '/media/hero-videos/hero-living-remodel.mp4',
  '/media/hero-videos/hero-landscaping.mp4',
  '/media/hero-videos/hero-kitchen.mp4',
  '/media/hero-videos/hero-floorplan.mp4',
]

/**
 * Full-viewport homepage: Full-screen video hero + 2×2 service cards + site bottom bar.
 * Layout reserves space for sticky nav (4rem) and fixed AskChatBar (~7.5rem).
 */
export function ServicesJourneySection({ services }: { services: HomeJourneyService[] }) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const handleVideoEnded = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % HERO_VIDEOS.length)
  }

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load()
      videoRef.current.play().catch((err) => {
        console.warn('Hero video autoplay blocked:', err)
      })
    }
  }, [currentVideoIndex])

  return (
    <section
      id="services"
      role="region"
      aria-label="Kealee core services"
      className={`${cormorant.variable} ${barlow.variable} home-cards-shell flex flex-col bg-[#F5F5F5] relative`}
    >
      {/* Full Screen Hero Header */}
      <header className="relative w-full h-[100svh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0 bg-kealee-black">
          <video
            ref={videoRef}
            muted
            playsInline
            onEnded={handleVideoEnded}
            className="w-full h-full object-cover opacity-60"
            poster="/media/service-photos/home-design.jpg" // Optional fallback poster
          >
            <source src={HERO_VIDEOS[currentVideoIndex]} type="video/mp4" />
          </video>
        </div>

        {/* Overlay gradient for readability */}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-kealee-black/80 via-transparent to-kealee-black/40" />

        <div className="relative z-10 mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 text-center w-full flex flex-col items-center gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-block rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white border border-white/20"
          >
            End-to-end design-build platform · DC, MD &amp; VA
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-home-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white max-w-4xl drop-shadow-lg"
          >
            From First Concept to <br className="hidden sm:block" />
            <span className="text-[#E8724B]">Final Build</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="font-home-sans max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-white/90 leading-relaxed drop-shadow-md font-medium"
          >
            Design concepts · cost estimates · permit filing · project workspace — everything your project needs, in one place.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-4"
          >
            <Link
              href="/concept"
              className="bg-[#E8724B] hover:bg-[#d65f39] text-white px-8 py-3.5 rounded-xl font-home-sans font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 inline-block"
            >
              Start Your Project
            </Link>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-70 animate-bounce">
          <span className="text-white text-xs font-bold uppercase tracking-widest">Scroll to Explore</span>
          <div className="w-px h-8 bg-white/50" />
        </div>
      </header>

      {/* Cards listed in single column */}
      <div className="flex flex-col px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24 bg-[#F5F5F5] relative z-20">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="font-home-serif text-3xl sm:text-4xl font-bold text-kealee-black">
            Explore Our Services
          </h2>
          <div className="w-16 h-1 bg-[#E8724B] mx-auto mt-6 rounded-full" />
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto flex flex-col w-full max-w-[1160px] gap-8 sm:gap-10 lg:gap-12"
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

