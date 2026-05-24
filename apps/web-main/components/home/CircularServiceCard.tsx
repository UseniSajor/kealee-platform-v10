'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Calculator, FileCheck, Hammer, Palette, Play } from 'lucide-react'
import type { HomeJourneyService, HomeServiceId } from './home-services-data'
import { trackEvent } from '@/lib/analytics'

const RING_RADIUS = 45
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

const ICONS: Record<HomeServiceId, typeof Palette> = {
  design: Palette,
  permits: FileCheck,
  estimate: Calculator,
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
        hidden: { opacity: 0, scale: 0.92 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: { duration: 0.5, delay: index * 0.1, ease: 'easeOut' },
        },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="relative w-full h-full min-h-0 min-w-0 flex items-center justify-center"
      aria-labelledby={`service-${service.id}-title`}
    >
      <motion.div
        className="relative aspect-square w-full h-full max-w-full max-h-full rounded-full cursor-pointer group overflow-hidden shadow-xl ring-1 ring-black/10"
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
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
            src={service.photoSrc}
            alt={service.photoAlt}
            fill
            className={`object-cover ${service.id === 'permits' && hovered ? 'scale-105' : ''} transition-transform duration-700`}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 40vw, 360px"
            priority={index < 2}
          />
          {service.id === 'permits' && hovered && (
            <div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent animate-pulse pointer-events-none"
              aria-hidden
            />
          )}
        </div>

        {/* Readability overlays */}
        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
        <div
          className={`absolute inset-0 z-[2] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
          style={{
            background: `linear-gradient(135deg, ${service.gradientFrom}99 0%, ${service.gradientTo}66 100%)`,
          }}
        />

        {/* Progress ring */}
        <svg className="absolute inset-0 z-[3] h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={ringOffset}
            className="transition-all duration-500"
          />
        </svg>

        {useVideo && videoReady && (
          <div
            className="absolute top-3 right-3 z-[5] rounded-full bg-white/20 p-1.5 backdrop-blur-sm"
            aria-label="Video preview playing"
          >
            <Play className="h-3.5 w-3.5 fill-white text-white" aria-hidden />
          </div>
        )}

        {/* Content */}
        <div className="absolute inset-0 z-[4] flex flex-col items-center justify-end text-center text-white px-4 pb-5 sm:px-6 sm:pb-7 lg:px-8 lg:pb-9">
          <motion.div
            animate={hovered ? { y: -4, scale: 1.05 } : { y: 0, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="mb-2 sm:mb-3 drop-shadow-lg"
          >
            <Icon className="h-8 w-8 sm:h-10 sm:w-10 lg:h-11 lg:w-11" strokeWidth={1.5} aria-hidden />
          </motion.div>

          <h3
            id={`service-${service.id}-title`}
            className="font-home-serif text-lg sm:text-xl md:text-2xl lg:text-[1.65rem] font-bold leading-tight drop-shadow-md"
          >
            {service.title}
          </h3>
          <p className="font-home-sans mt-0.5 text-xs sm:text-sm lg:text-base text-white/85 drop-shadow-md">
            {service.subtitle}
          </p>

          <motion.p
            initial={false}
            animate={{
              opacity: hovered ? 1 : 0,
              maxHeight: hovered ? 96 : 0,
              marginTop: hovered ? 8 : 0,
            }}
            transition={{ duration: 0.25 }}
            className="font-home-sans max-w-[85%] overflow-hidden text-[11px] leading-snug text-white/95 sm:text-xs lg:text-sm"
          >
            {service.description}
          </motion.p>

          <p className="font-home-sans mt-2 text-[10px] text-white/75 sm:text-xs lg:text-sm">{service.priceHint}</p>

          <Link
            href={service.ctaLink}
            className="mt-3 sm:mt-4"
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
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className="inline-block rounded-full bg-white px-5 py-2 font-home-sans text-xs font-semibold text-charcoal shadow-lg hover:bg-gray-100 sm:px-6 sm:py-2.5 sm:text-sm lg:text-base"
            >
              {service.ctaText}
            </motion.span>
          </Link>
        </div>
      </motion.div>
    </motion.article>
  )
}
