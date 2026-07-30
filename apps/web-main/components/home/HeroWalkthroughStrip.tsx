'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { HomeJourneyService } from './home-services-data'

const TRANSFORMATIONS = [
  {
    title: 'Kitchen renovation',
    src: '/media/service-photos/kealee-kitchen-before-after-v2.png',
    alt: 'Kealee concept visualization comparing a dated kitchen with a renovated kitchen',
  },
  {
    title: 'Landscape & garden',
    src: '/media/service-photos/kealee-garden-before-after-v2.png',
    alt: 'Kealee concept visualization comparing an underused backyard with a landscaped garden',
  },
] as const

/**
 * High-level "how it works" walkthrough + original before/after concepts,
 * placed directly under the full-viewport hero. The stage previews reuse
 * live service media; the transformation panels are Kealee-generated
 * concept visualizations and are labeled accordingly.
 */
export function HeroWalkthroughStrip({ services }: { services: HomeJourneyService[] }) {
  return (
    <div className="relative z-20 bg-white border-b border-slate-100">
      <div className="mx-auto max-w-[1160px] px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* How it works — high-level walkthrough */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#E8724B]">
              How it works
            </span>
            <h2 className="mt-2 font-home-serif text-2xl sm:text-3xl font-bold text-kealee-black">
              One platform, start to finish
            </h2>

            <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-4">
              {services.map((service, index) => (
                <Link
                  key={service.id}
                  href={service.ctaLink}
                  className="group flex flex-1 items-center gap-3 sm:flex-col sm:items-start sm:gap-2"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 sm:h-20 sm:w-full sm:rounded-2xl">
                    <Image
                      src={service.photoSrc}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 56px, 200px"
                    />
                    <div className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/10" />
                    <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {index + 1}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-kealee-black group-hover:text-[#E8724B] transition-colors">
                      {service.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{service.subtitle}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {TRANSFORMATIONS.map((item, index) => (
              <motion.figure
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-sm"
              >
                <div className="relative aspect-[3/2] w-full overflow-hidden">
                  <motion.div
                    className="absolute inset-0"
                    animate={{ scale: [1, 1.035, 1] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: index * 1.5 }}
                  >
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 480px"
                    />
                  </motion.div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-12 text-white">
                    <div className="flex items-end justify-between gap-3">
                      <figcaption className="text-sm font-bold">{item.title}</figcaption>
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-white/75">
                        Kealee concept visualization
                      </span>
                    </div>
                  </div>
                  <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white backdrop-blur">
                    Before
                  </span>
                  <span className="absolute right-3 top-3 rounded-full bg-[#E8724B] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white">
                    After
                  </span>
                </div>
              </motion.figure>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
