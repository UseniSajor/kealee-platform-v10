'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

const HERO_SLIDES = [
  {
    id: 'new-construction',
    videoSrc: '/media/hero-videos/hero-new-construction.mp4',
    title: 'New Construction',
    subtitle: 'From empty lot to a masterpiece built specifically for you.',
  },
  {
    id: 'kitchen-bath',
    videoSrc: '/media/hero-videos/hero-kitchen.mp4',
    title: 'Kitchen & Bath Renovations',
    subtitle: 'Elevate your daily routines with modern, functional spaces.',
  },
  {
    id: 'home-addition',
    videoSrc: '/media/hero-videos/hero-addition.mp4',
    title: 'Home Additions',
    subtitle: 'Expand your living space seamlessly with your existing home.',
  },
  {
    id: 'landscaping',
    videoSrc: '/media/hero-videos/hero-landscaping.mp4',
    title: 'Garden & Landscaping',
    subtitle: 'Transform your outdoor spaces into beautiful, living environments.',
  }
]

export function VideoHeroSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  useEffect(() => {
    // Attempt to auto-play the active video
    const activeVideo = videoRefs.current[activeIndex]
    if (activeVideo) {
      activeVideo.currentTime = 0
      activeVideo.play().catch(e => console.log('Video autoplay blocked:', e))
    }
  }, [activeIndex])

  const handleVideoEnded = () => {
    // Advance to next video
    setActiveIndex((prev) => (prev + 1) % HERO_SLIDES.length)
  }

  return (
    <section className="relative w-[100vw] left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-black">
      {/* Video Backgrounds */}
      {HERO_SLIDES.map((slide, index) => (
        <video
          key={slide.id}
          ref={(el) => {
            videoRefs.current[index] = el
          }}
          src={slide.videoSrc}
          autoPlay={index === activeIndex}
          muted
          playsInline
          onEnded={handleVideoEnded}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            index === activeIndex ? 'opacity-70' : 'opacity-0 z-[-1]'
          }`}
        />
      ))}

      {/* Dark Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 flex flex-col items-start justify-center h-full pt-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-6">
          <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Powered by Kealee AI Concept Engine
        </div>

        <div className="min-h-[140px] md:min-h-[160px] flex flex-col justify-end">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl"
            >
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
                {HERO_SLIDES[activeIndex].title}
              </h1>
              <p className="text-xl md:text-2xl text-gray-200">
                {HERO_SLIDES[activeIndex].subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/get-started"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-kealee-orange rounded-lg hover:bg-kealee-orange-dark transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Start Your Project
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/concept"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/20 transition-all"
          >
            Try the Concept Engine
          </Link>
        </div>

        {/* Progress Indicators */}
        <div className="absolute bottom-10 left-6 lg:left-8 flex gap-3">
          {HERO_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className="group py-2 relative flex items-center justify-center"
              aria-label={`Go to slide ${index + 1}`}
            >
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  index === activeIndex
                    ? 'w-12 bg-white'
                    : 'w-6 bg-white/40 group-hover:bg-white/60'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
