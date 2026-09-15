'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { ArrowRight, Calculator, FileCheck2, Hammer, Landmark, Map, Palette, ShieldCheck, Sparkles } from 'lucide-react'
import type { HomeJourneyService, HomeServiceId } from './home-services-data'
import { trackEvent } from '@/lib/analytics'

const ICONS: Record<HomeServiceId, typeof Map> = {
  siteplan: Map,
  design: Palette,
  estimate: Calculator,
  permits: FileCheck2,
  contractor: Hammer,
  escrow: Landmark,
}

export function ServicesJourneySection({ services }: { services: HomeJourneyService[] }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    videoRef.current?.play().catch(() => undefined)
  }, [])

  return (
    <section id="services" aria-labelledby="home-heading" className="bg-[#f6f5f0] text-[#10233e]">
      <div className="relative min-h-[660px] overflow-hidden bg-[#0c1d32]">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/media/hero-videos/hero-new-construction.jpg"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
          aria-hidden="true"
        >
          <source src="/media/hero-videos/hero-new-construction.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,23,40,.96)_0%,rgba(8,23,40,.78)_52%,rgba(8,23,40,.35)_100%)]" />

        <div className="relative mx-auto flex min-h-[660px] max-w-7xl items-center px-5 py-20 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[.16em] text-white backdrop-blur">
              <Sparkles className="h-4 w-4 text-[#ff9b68]" /> One clear path from idea to construction
            </div>
            <h1 id="home-heading" className="mt-7 text-5xl font-black leading-[.98] tracking-[-.045em] text-white sm:text-6xl lg:text-7xl">
              Your project.
              <span className="mt-2 block text-[#ff8a51]">Six simple steps.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
              Choose what you need. Kealee asks a few useful questions, reuses what you already shared, and keeps every product and decision in one owner workspace.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a href="#choose-service" className="inline-flex items-center gap-2 rounded-xl bg-[#f36b2b] px-6 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-[#df581f]">
                Choose a service <ArrowRight className="h-4 w-4" />
              </a>
              <Link href="/request-service?service=project-clarity&name=Project%20Clarity" className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur hover:bg-white/15">
                Not sure? Get a recommendation
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-white/80">
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Clear scope before payment</span>
              <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#ff9b68]" /> AI-assisted intake</span>
              <span className="flex items-center gap-2"><Landmark className="h-4 w-4 text-sky-300" /> Protected construction payments</span>
            </div>
          </div>
        </div>
      </div>

      <div id="choose-service" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[.2em] text-[#c8521a]">Choose one service</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">What do you need right now?</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">Each service has one purpose, a clear deliverable, and one button to begin. Start anywhere; we will show you what comes before and after.</p>
          </div>

          <ol className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service, index) => {
              const Icon = ICONS[service.id]
              return (
                <li key={service.id}>
                  <Link
                    href={`/services/${service.slug}`}
                    onClick={() => trackEvent('cta_click', { context: 'six_service_home', label: service.id, href: `/services/${service.slug}` })}
                    className="group flex min-h-[245px] h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2abfbf]/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${service.gradientFrom}, ${service.gradientTo})` }}>
                        <Icon className="h-6 w-6" aria-hidden />
                      </span>
                      <span className="text-xs font-black text-slate-400">0{index + 1}</span>
                    </div>
                    <h3 className="mt-6 text-2xl font-black tracking-tight text-[#10233e]">{service.shortTitle}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{service.description}</p>
                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-xs font-bold text-slate-500">{service.priceHint}</span>
                      <span className="inline-flex items-center gap-1 text-sm font-black text-[#c8521a]">See service <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ol>

          <div className="mt-10 rounded-2xl bg-[#10233e] p-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#70d5cd]">One project memory</p>
              <h3 className="mt-2 text-2xl font-black">Answer once. Keep moving.</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Your address, goals, uploads, selections, and completed products carry forward. Kealee uses automation to reduce repeated questions; qualified people remain accountable wherever professional review is required.</p>
            </div>
            <Link href="/get-concept" className="mt-5 inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-[#10233e] sm:mt-0">Start with a concept <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    </section>
  )
}
