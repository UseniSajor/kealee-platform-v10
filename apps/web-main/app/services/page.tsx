import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { HOME_JOURNEY_SERVICES } from '@/components/home/home-services-data'

export const metadata: Metadata = {
  title: 'Services — Kealee Platform',
  description: 'Site planning, design concepts, permit services, contractor matching, and protected construction payments in one coordinated journey.',
}

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-[#1A2B4A] via-[#10233f] to-[#164b50] px-6 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">One coordinated project journey</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Know exactly what to order next.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
            Start with the plan you need. Every design concept and preliminary site plan includes a basic planning estimate. Permit-set building plans and full detailed site plans include a detailed construction estimate.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-2">
            {HOME_JOURNEY_SERVICES.map((service, index) => (
              <article key={service.id} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Step {index + 1}</p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-950">{service.shortTitle}</h2>
                    <p className="mt-1 font-semibold text-slate-600">{service.title}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{service.priceHint}</span>
                </div>

                <p className="mt-5 leading-relaxed text-slate-600">{service.description}</p>
                <p className="mt-3 rounded-xl bg-teal-50 p-4 text-sm font-medium leading-relaxed text-teal-950">{service.outcome}</p>

                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {service.includes.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-7">
                  <Link href={service.ctaLink} className="inline-flex items-center gap-2 rounded-xl bg-[#E8724B] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#D45C33]">
                    {service.ctaText} <ArrowRight className="h-4 w-4" />
                  </Link>
                  <p className="mt-3 text-xs text-slate-500">{service.deliveryHint}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
