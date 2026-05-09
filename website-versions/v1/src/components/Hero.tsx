import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-navy via-navy-light to-navy-dark px-4 py-16 text-white sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(42,191,191,0.14),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-builder-orange/25 to-transparent blur-3xl" />

      <div className="relative mx-auto flex max-w-5xl flex-col gap-10 text-center lg:text-left">
        <div className="space-y-6 lg:max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-light">
            DMV-first construction intelligence
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            See your path from concept to permitted construction.
          </h1>
          <p className="text-lg text-white/80 sm:text-xl">
            Design clarity, compliant filings, and milestone-safe payments — orchestrated in one workspace built for real builds.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
          <Link
            href="/concept"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-builder-orange px-8 py-4 text-base font-semibold text-white hover:bg-builder-orange-dark"
          >
            Build your project
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center justify-center rounded-xl border border-white/25 px-8 py-4 text-base font-semibold text-white hover:border-white/50 hover:bg-white/5"
          >
            See how it works
          </Link>
        </div>
      </div>
    </section>
  )
}
