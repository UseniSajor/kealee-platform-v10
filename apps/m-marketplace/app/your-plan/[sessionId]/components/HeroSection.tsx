'use client'

import Link from 'next/link'
import { ArrowRight, MapPin, Briefcase } from 'lucide-react'

interface HeroData {
  headline: string
  subheadline: string
  ctaText: string
  ctaHref: string
  projectTypeLabel: string
  locationLabel: string
}

export function HeroSection({ data }: { data: HeroData }) {
  return (
    <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className="relative z-10">
        <div className="flex flex-wrap gap-3 mb-6">
          <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
            <Briefcase className="w-3.5 h-3.5" />
            {data.projectTypeLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
            <MapPin className="w-3.5 h-3.5" />
            {data.locationLabel}
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
          {data.headline}
        </h1>
        <p className="text-lg text-indigo-100 mb-8 max-w-2xl">
          {data.subheadline}
        </p>

        <Link
          href={data.ctaHref}
          className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-8 py-4 rounded-xl hover:bg-indigo-50 transition-all shadow-lg active:scale-95"
        >
          {data.ctaText}
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  )
}
