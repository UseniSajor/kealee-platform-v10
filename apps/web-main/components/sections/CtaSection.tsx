import Link from 'next/link'
import { ArrowRight, MessageCircle } from 'lucide-react'

export function CtaSection() {
  return (
    <section className="py-24" style={{ background: '#1A2B4A' }}>
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        {/* Badge */}
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
          style={{ background: 'rgba(42,191,191,.12)', color: '#2ABFBF' }}
        >
          Ready to build?
        </div>

        <h2 className="text-3xl font-bold font-display text-white sm:text-5xl">
          Ready to build smarter?
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-gray-400">
          Start with a free AI concept, get permits filed in days, and manage your entire build on one platform.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/concept"
            className="inline-flex items-center gap-2 rounded-xl px-7 py-4 text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ background: '#C8521A' }}
          >
            Start Your Project <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-white/20 px-7 py-4 text-sm font-semibold text-white transition-all hover:border-white/40 hover:bg-white/5"
          >
            <MessageCircle className="h-4 w-4" />
            Talk to a Human
          </Link>
        </div>

        <p className="mt-8 text-xs text-gray-500">
          No credit card required to start. AI concept delivered in 2–5 business days.
        </p>
      </div>
    </section>
  )
}
