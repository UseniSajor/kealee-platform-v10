'use client'

import { useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Search, X, Building2 } from 'lucide-react'
import { SERVICES } from '@/lib/services-config'
import type { Service } from '@/lib/services-config'

// Precon = AI concepts, estimates, permits (digital deliverables)
// Build = construction execution (separate flow)
const PRECON_SERVICES = SERVICES.filter((s) => s.phase === 'precon')
const BUILD_SERVICES = SERVICES.filter((s) => s.phase === 'build')

const CATEGORIES = [
  { key: '', label: 'All' },
  { key: 'remodel', label: 'Remodels' },
  { key: 'addition', label: 'Additions' },
  { key: 'landscape', label: 'Landscape' },
  { key: 'design', label: 'Design' },
]

function ServiceCard({ svc }: { svc: Service }) {
  const hasVideo = svc.tiers.some((t) => t.video)

  return (
    <Link href={`/services/${svc.slug}`}>
      <div className="group rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative h-44 overflow-hidden bg-slate-100 flex-shrink-0">
          <Image
            src={svc.heroImage}
            alt={svc.label}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-semibold text-white capitalize">
              {svc.category}
            </span>
            {hasVideo && (
              <span className="rounded-full bg-[#E8724B]/90 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-semibold text-white">
                + Video
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="text-[15px] font-bold text-slate-900 leading-tight mb-1">{svc.label}</h3>
          <p className="text-xs text-slate-500 line-clamp-2 mb-3 flex-1">{svc.description}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#E8724B]">{svc.priceDisplay}</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-400">{svc.deliverableLabel} · {svc.deliveryDays}</p>
            {svc.timeline && svc.timeline !== 'Custom' && svc.timeline !== 'Design fee only' && (
              <p className="text-[11px] text-slate-400">Renovation: {svc.timeline}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    // Filter within precon services only (build has its own section)
    let results = [...PRECON_SERVICES]
    if (activeCategory) {
      results = results.filter((s) => s.category === activeCategory)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      results = results.filter(
        (s) =>
          s.label.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      )
    }
    return results
  }, [activeCategory, searchQuery])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-[#1A2B4A] py-16 px-4 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-4">Design &amp; Planning Packages</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Plan Your Project. Then Build It.
          </h1>
          <p className="text-lg text-slate-300 max-w-xl mx-auto">
            Design packages delivered in 2–6 days — renders, cost estimates, permit scope. The renovation itself takes weeks; the planning starts here.
          </p>
        </div>
      </section>

      {/* Sticky filter bar */}
      <div className="sticky top-16 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Category chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeCategory === cat.key
                    ? 'bg-[#E8724B] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative sm:ml-auto w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#E8724B] focus:outline-none focus:ring-2 focus:ring-[#E8724B]/20 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <span className="text-xs text-slate-400 whitespace-nowrap hidden sm:block">
            {filtered.length} service{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 py-10">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-slate-400 text-lg mb-2">No services match your search.</p>
            <button
              onClick={() => { setActiveCategory(''); setSearchQuery('') }}
              className="text-[#E8724B] font-semibold text-sm"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filtered.map((svc) => (
                <motion.div
                  key={svc.slug}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ServiceCard svc={svc} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Build Services section */}
      <div className="bg-[#0F1E35] py-14 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-5 h-5 text-[#2563EB]" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">Build Services</p>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Ready to Break Ground?</h2>
          <p className="text-slate-400 text-sm mb-8 max-w-lg">
            Full construction execution — architectural management, permit coordination, and GC oversight from lot to certificate of occupancy.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BUILD_SERVICES.map((svc) => (
              <Link
                key={svc.slug}
                href={svc.customIntakePath ?? `/services/${svc.slug}`}
                className="group flex gap-4 items-start rounded-xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 hover:border-[#2563EB]/40 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-[#2563EB]/20 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white mb-1">{svc.label}</p>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{svc.description}</p>
                  <p className="text-xs text-[#2563EB] font-semibold mt-2 flex items-center gap-1">
                    {svc.priceDisplay} <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <Link
              href="/build"
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-6 py-3 rounded-xl transition-all text-sm"
            >
              View All Build Services <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* CTA strip */}
      <div className="bg-[#1A2B4A] py-12 px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Not sure where to start?</h2>
        <p className="text-slate-400 mb-6">Get an AI-designed concept first — then move to permits or build management when you're ready.</p>
        <Link
          href="/concept"
          className="inline-flex items-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold px-7 py-3.5 rounded-xl transition-all duration-200"
        >
          Start with Design Concept <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
