'use client'

import { useState, useMemo, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SERVICES } from '@/config/services'
import { ServiceCard } from '@/components/ServiceCard'
import { FilterBar } from '@/components/FilterBar'

const ALL_CATEGORIES = ['design', 'development', 'permit', 'estimate', 'match']

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = useCallback((q: string) => setSearchQuery(q), [])

  const filtered = useMemo(() => {
    let results = [...SERVICES]
    if (activeCategory) {
      results = results.filter((s) => s.category === activeCategory)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      results = results.filter(
        (s) =>
          s.label.toLowerCase().includes(q) ||
          s.tagline.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      )
    }
    return results
  }, [activeCategory, searchQuery])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section
        className="py-16 px-4 text-center"
        style={{
          background: 'linear-gradient(135deg, #1A2B4A 0%, #0F1D34 60%, #1A3B3B 100%)',
        }}
      >
        <div className="mx-auto max-w-3xl">
          <span className="inline-block rounded-full bg-[#E8793A]/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#E8793A] mb-5">
            Service Gallery
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Every service. Every project type.
          </h1>
          <p className="text-lg text-white/60 max-w-xl mx-auto">
            Browse AI-powered design packages, permit services, cost estimates, and contractor matching—all in one place.
          </p>
        </div>
      </section>

      {/* Filters */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <FilterBar
          categories={ALL_CATEGORIES}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onSearch={handleSearch}
          resultCount={filtered.length}
        />
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-400 text-lg mb-2">No services match your search.</p>
            <button
              onClick={() => { setActiveCategory(''); setSearchQuery('') }}
              className="text-[#E8793A] font-semibold text-sm underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filtered.map((service) => (
                <motion.div
                  key={service.key}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link href={`/services/${service.slug}`} className="block mb-2">
                    <ServiceCard service={service} />
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* CTA strip */}
      <div className="bg-[#1A2B4A] py-12 px-4 text-center">
        <h2 className="text-2xl font-extrabold text-white mb-3">Not sure which service you need?</h2>
        <p className="text-white/60 mb-6">Answer a few questions and we'll recommend the right package.</p>
        <Link
          href="/get-started"
          className="inline-flex items-center gap-2 rounded-xl bg-[#E8793A] px-7 py-3.5 text-sm font-bold text-white hover:bg-orange-500 transition"
        >
          Get Started <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
