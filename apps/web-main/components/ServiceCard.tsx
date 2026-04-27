'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, CheckCircle } from 'lucide-react'
import type { ServiceConfig } from '@/config/services'

interface ServiceCardProps {
  service: ServiceConfig
  className?: string
}

export function ServiceCard({ service, className = '' }: ServiceCardProps) {
  const thumbnail = service.media.galleryImages[0]
  const CATEGORY_COLORS: Record<string, string> = {
    design: '#7C3AED',
    development: '#1A2B4A',
    permit: '#2563EB',
    estimate: '#38A169',
    match: '#0891B2',
  }
  const catColor = CATEGORY_COLORS[service.category] ?? '#1A2B4A'

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:border-[#2ABFBF] hover:shadow-md transition-shadow ${className}`}
    >
      {/* Thumbnail */}
      <div className="relative h-44 overflow-hidden bg-gray-100">
        {thumbnail ? (
          <Image
            src={thumbnail.src}
            alt={thumbnail.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            placeholder={thumbnail.blurDataUrl ? 'blur' : 'empty'}
            blurDataURL={thumbnail.blurDataUrl}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <span className="text-3xl">🏗️</span>
          </div>
        )}
        {/* Category badge */}
        <span
          className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white"
          style={{ backgroundColor: catColor }}
        >
          {service.category}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold text-gray-900 mb-1">{service.label}</h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-3 flex-1">{service.tagline}</p>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {service.deliveryDays}
          </span>
          {service.permitRequired && (
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-blue-500" />
              Permit scope included
            </span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold" style={{ color: '#1A2B4A' }}>
            {service.priceDisplay}
          </span>
          <Link
            href={service.intakePath}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#E8793A' }}
          >
            Get Started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
