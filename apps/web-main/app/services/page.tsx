import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SERVICES } from '@/lib/services-config'

export const metadata: Metadata = {
  title: 'All Services — Kealee Platform',
  description: 'Concept design, permit coordination, cost planning, contractor matching, and project support in one platform.',
}

const ACCENTS: Record<string, string> = {
  remodel: '#E8793A',
  addition: '#7C3AED',
  landscape: '#38A169',
  design: '#2563EB',
  construction: '#1A2B4A',
}

const money = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)

export default function ServicesPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-[#1A2B4A] via-[#0F1D34] to-[#1A3B3B] px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="rounded-full bg-orange-500/20 px-4 py-1 text-xs font-bold uppercase tracking-widest text-orange-300">Platform services</span>
          <h1 className="mt-5 font-display text-4xl font-black text-white sm:text-5xl">Plan the project before you build it.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/65">
            Select a property-specific concept or feasibility service. Your verified project data can carry forward into estimates,
            permits, professional review, and contractor execution.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/get-started" className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-7 py-3.5 font-bold text-white hover:bg-orange-500">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="rounded-xl border border-white/20 px-7 py-3.5 font-semibold text-white hover:bg-white/10">View price reference</Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold text-slate-950">Preconstruction services</h2>
            <p className="mt-3 text-slate-600">Displayed tier prices come from the same server-trusted price book used by project intake and checkout.</p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {SERVICES.map(service => {
              const accent = ACCENTS[service.category]
              const href = service.usesConceptIntake
                ? `/intake/${service.intakePath}`
                : service.customIntakePath ?? `/services/${service.slug}`
              return (
                <article key={service.slug} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="relative h-48 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={service.heroImage} alt="" className="h-full w-full object-cover" />
                    <span className="absolute bottom-3 left-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white" style={{ backgroundColor: accent }}>
                      {service.deliverableLabel}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-display text-xl font-bold text-slate-950">{service.label}</h3>
                      <span className="shrink-0 text-sm font-bold" style={{ color: accent }}>{service.priceDisplay}</span>
                    </div>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{service.description}</p>
                    <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                      {service.tiers.filter(tier => tier.available).map(tier => (
                        <div key={tier.tier} className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-600">{tier.name}</span>
                          <span className="font-bold text-slate-900">{money(tier.price)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
                      <span>{service.deliveryDays}</span>
                      <span>{service.phase === 'precon' ? 'One-time project fee' : 'Custom engagement'}</span>
                    </div>
                    <Link href={href} className="mt-5 flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white" style={{ backgroundColor: accent }}>
                      {service.usesConceptIntake ? 'Start project intake' : 'Request a consultation'} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>

          <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-slate-500">
            Preliminary feasibility and concepts are not for construction and are subject to licensed professional review.
            Agency fees, surveys, engineering, and other third-party services are quoted separately when required.
          </p>
        </div>
      </section>
    </>
  )
}
