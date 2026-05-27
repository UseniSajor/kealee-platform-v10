'use client'

import { motion } from 'framer-motion'
import { Cormorant_Garamond, Barlow } from 'next/font/google'
import { CircularServiceCard } from './CircularServiceCard'
import type { HomeJourneyService } from './home-services-data'
import { SiteBottomBar } from '@/components/footer/SiteBottomBar'

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
  return (
    <section
      id="services"
      role="region"
      aria-label="Kealee core services"
      className={`${cormorant.variable} ${barlow.variable} home-cards-shell flex flex-col bg-[#F5F5F5]`}
    >
      {/* Sub-header */}
      <header className="shrink-0 border-b border-charcoal/8 bg-white/80 px-4 py-3 text-center backdrop-blur-sm sm:py-4">
        <p className="font-home-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-copper sm:text-xs">
          End-to-end design-build platform · DC, MD &amp; VA
        </p>
        <h1 className="font-home-serif mt-1 text-2xl font-bold leading-tight text-charcoal sm:text-3xl lg:text-4xl">
          From First Concept to Final Build
        </h1>
        <p className="font-home-sans mx-auto mt-1 max-w-xl text-xs text-charcoal/65 sm:text-sm">
          Design concepts · cost estimates · permit filing · project workspace — everything your project needs, in one place
        </p>
      </header>

      {/* Cards fill remaining viewport */}
      <div className="flex min-h-0 flex-1 flex-col px-2 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mx-auto grid h-full min-h-0 w-full max-w-[1200px] flex-1 grid-cols-1 grid-rows-4 gap-2 sm:grid-cols-2 sm:grid-rows-2 sm:gap-3 lg:gap-5"
          role="list"
          aria-label="Service offerings"
        >
          {services.map((service, index) => (
            <div key={service.id} role="listitem" className="min-h-0 min-w-0">
              <CircularServiceCard service={service} index={index} />
            </div>
          ))}
        </motion.div>
      </div>

      <SiteBottomBar className="shrink-0" />
    </section>
  )
}
