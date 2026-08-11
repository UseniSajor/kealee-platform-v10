'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Calculator, FileCheck, Hammer, Palette, Play, ArrowRight } from 'lucide-react'
import type { HomeJourneyService, HomeServiceId } from './home-services-data'
import { trackEvent } from '@/lib/analytics'

const RING_RADIUS = 35
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

const ICONS: Record<HomeServiceId, typeof Palette> = {
  design: Palette,
  estimate: Calculator,
  permits: FileCheck,
  build: Hammer,
}

interface CircularServiceCardProps {
  service: HomeJourneyService
  index: number
}

export function CircularServiceCard({ service, index }: CircularServiceCardProps) {
  const [hovered, setHovered] = useState(false)
  const [showVideo, setShowVideo] = useState(service.mediaType === 'video')
  const [videoReady, setVideoReady] = useState(false)
  const [showBefore, setShowBefore] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const Icon = ICONS[service.id]
  const ringOffset = RING_CIRCUMFERENCE - (service.progress / 100) * RING_CIRCUMFERENCE
  const useVideo = service.mediaType === 'video' && showVideo

  useEffect(() => {
    const el = rootRef.current
    if (!el || !useVideo) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current
        if (!video) return
        if (entry?.isIntersecting) {
          video.play().catch(() => setShowVideo(false))
        } else {
          video.pause()
        }
      },
      { threshold: 0.35 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [useVideo])

  return (
    <motion.article
      ref={rootRef}
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, delay: index * 0.1, ease: 'easeOut' },
        },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="relative w-full h-[300px] sm:h-[360px] lg:h-[400px] flex items-center justify-center"
      aria-labelledby={`service-${service.id}-title`}
    >
      <motion.div
        className="relative w-full h-full rounded-3xl lg:rounded-full cursor-pointer group overflow-hidden shadow-lg border-2 border-teal-300/70 bg-white ring-4 ring-yellow-300/15"
        whileHover={{ y: -4, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
        transition={{ type: 'spring', stiffness: 350, damping: 26 }}
        onMouseEnter={() => {
          setHovered(true)
          trackEvent('cta_click', {
            context: 'home_journey',
            label: `${service.id}_hover`,
            href: service.ctaLink,
          })
        }}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Gradient fallback behind media */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `linear-gradient(135deg, ${service.gradientFrom} 0%, ${service.gradientTo} 100%)`,
          }}
        />

        {/* Video */}
        {useVideo && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload={index < 2 ? 'metadata' : 'none'}
            className="absolute inset-0 z-[1] h-full w-full object-cover"
            onLoadedData={() => setVideoReady(true)}
            onError={() => setShowVideo(false)}
          >
            {service.videoWebM && <source src={service.videoWebM} type="video/webm" />}
            {service.videoSrc && <source src={service.videoSrc} type="video/mp4" />}
          </video>
        )}

        {/* Photo (fallback or primary) */}
        <div
          className={`absolute inset-0 z-[1] transition-opacity duration-500 ${
            useVideo && videoReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <Image
            src={showBefore && service.beforePhotoSrc ? service.beforePhotoSrc : service.photoSrc}
            alt={showBefore && service.beforePhotoSrc ? `${service.photoAlt} — before` : service.photoAlt}
            fill
            className={`object-cover group-hover:scale-[1.03] transition-transform duration-700`}
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 550px"
            priority={index < 2}
          />
        </div>

        {/* Before/After toggle — sits above the readability overlay, clear of the bottom text block.
            Hidden once the video takes over, since the video already shows the transformation. */}
        {service.beforePhotoSrc && !(useVideo && videoReady) && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 sm:top-10 lg:top-12 z-10 flex rounded-full bg-black/55 p-0.5 backdrop-blur-sm">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowBefore(true)
              }}
              className={`rounded-full px-3 py-1 text-[10px] font-semibold transition-colors ${
                showBefore ? 'bg-white text-slate-900' : 'text-white/90 hover:text-white'
              }`}
            >
              Before
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowBefore(false)
              }}
              className={`rounded-full px-3 py-1 text-[10px] font-semibold transition-colors ${
                !showBefore ? 'bg-white text-slate-900' : 'text-white/90 hover:text-white'
              }`}
            >
              After
            </button>
          </div>
        )}

        {/* Readability overlays */}
        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-slate-950 via-slate-900/60 to-black/35" />
        <div
          className={`absolute inset-0 z-[2] opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none`}
          style={{
            background: `linear-gradient(135deg, ${service.gradientFrom} 0%, ${service.gradientTo} 100%)`,
          }}
        />

        {/* Step Badge */}
        <span className="absolute top-8 left-8 sm:top-10 sm:left-16 lg:top-12 lg:left-24 z-10 rounded-lg bg-yellow-300 backdrop-blur-md border border-yellow-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#3f321f] shadow-sm">
          Step 0{index + 1}
        </span>

        {/* Progress Ring Corner Badge */}
        <div className="absolute top-8 right-8 sm:top-10 sm:right-16 lg:top-12 lg:right-24 z-10 flex items-center justify-center bg-slate-950/65 backdrop-blur-md rounded-full p-1.5 border border-white/15 h-10 w-10 shadow-md">
          <svg className="absolute h-8.5 w-8.5 -rotate-90" viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r={RING_RADIUS}
              fill="none"
              stroke="#2DD4BF"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
              className="transition-all duration-500"
            />
          </svg>
          <span className="text-[9px] font-bold text-white tracking-tighter">{service.progress}%</span>
        </div>

        {useVideo && videoReady && (
          <div
            className="absolute bottom-8 right-8 sm:bottom-10 sm:right-16 lg:bottom-12 lg:right-24 z-[5] rounded-full bg-slate-900/50 p-1.5 backdrop-blur-sm border border-white/10"
            aria-label="Video preview playing"
          >
            <Play className="h-3 w-3 fill-white text-white" aria-hidden />
          </div>
        )}

        {/* Content Container */}
        <div className="absolute inset-0 z-[4] flex flex-col justify-end text-left px-8 pb-8 sm:px-16 sm:pb-12 lg:px-24 lg:pb-16">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="rounded-lg bg-[#7a563d] p-2 text-yellow-200 shadow-md">
              <Icon className="h-4.5 w-4.5 lg:h-5 lg:w-5" strokeWidth={2} aria-hidden />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                {service.subtitle}
              </span>
            </div>
          </div>

          <h3
            id={`service-${service.id}-title`}
            className="font-home-serif text-xl sm:text-2xl font-bold leading-tight text-white drop-shadow-md"
          >
            {service.title}
          </h3>

          <p className="font-home-sans mt-3 text-xs lg:text-sm text-slate-200 line-clamp-3 max-w-[90%] sm:max-w-[75%] lg:max-w-[60%] leading-relaxed">
            {service.description}
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 sm:max-w-[75%] lg:max-w-[60%]">
            <span className="font-home-sans text-[11px] lg:text-xs font-semibold text-[#E8724B] tracking-wide">
              {service.priceHint}
            </span>
            <Link
              href={service.ctaLink}
              aria-label={`${service.ctaText} — ${service.title}`}
              onClick={() =>
                trackEvent('cta_click', {
                  context: 'home_journey',
                  label: service.id,
                  href: service.ctaLink,
                })
              }
            >
              <motion.span
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-1 text-[11px] lg:text-xs font-bold text-white hover:text-[#E8724B] transition-colors"
              >
                {service.ctaText} <ArrowRight className="w-3.5 h-3.5" />
              </motion.span>
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.article>
  )
}
