import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Building2, FileCheck, Users, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Build — Kealee',
  description: 'Full-service construction management from design to build in DC, MD, VA.',
}

const SERVICES = [
  {
    icon: Zap,
    title: 'Design Concept',
    desc: 'AI-generated renders, floor plans, and material specs delivered in days.',
    href: '/concept',
    color: '#E8724B',
  },
  {
    icon: FileCheck,
    title: 'Permits',
    desc: 'Permit preparation and submission across all DMV jurisdictions.',
    href: '/permits',
    color: '#16A34A',
  },
  {
    icon: Users,
    title: 'Contractor Match',
    desc: 'Matched to 3 vetted, insured local contractors ready to bid.',
    href: '/marketplace',
    color: '#2563EB',
  },
  {
    icon: Building2,
    title: 'New Construction',
    desc: 'Full ground-up build management from lot to certificate of occupancy.',
    href: '/new-construction/intake',
    color: '#1A2B4A',
  },
]

export default function BuildPage() {
  return (
    <div className="min-h-screen bg-warm-50">

      {/* Hero */}
      <div className="bg-[#2563EB] pt-20 pb-24 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-4">Full-Service Construction</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5 leading-tight">
            Ready to Build?
          </h1>
          <p className="text-blue-100 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            From concept to certificate of occupancy — Kealee manages design, permits,
            and construction across DC, Maryland, and Virginia.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/concept"
              className="inline-flex items-center gap-2 bg-white text-[#2563EB] font-bold px-7 py-3.5 rounded-xl transition hover:bg-blue-50 shadow-lg text-base"
            >
              Start with Design <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/new-construction/intake"
              className="inline-flex items-center gap-2 border border-white/30 hover:border-white/60 text-white font-semibold px-6 py-3.5 rounded-xl transition text-sm"
            >
              New Construction
            </Link>
          </div>
        </div>
      </div>

      {/* Services grid */}
      <div className="mx-auto max-w-5xl px-4 py-16">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 text-center mb-10">
          Everything you need to build
        </p>
        <div className="grid sm:grid-cols-2 gap-5">
          {SERVICES.map(({ icon: Icon, title, desc, href, color }) => (
            <Link
              key={title}
              href={href}
              className="group flex gap-5 items-start rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${color}15` }}
              >
                <Icon className="h-6 w-6" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 mb-1">{title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
              <ArrowRight
                className="h-4 w-4 shrink-0 mt-1 text-gray-300 group-hover:text-gray-500 transition-colors"
              />
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#1A2B4A] py-16 px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-3">Not sure where to start?</h2>
        <p className="text-slate-400 mb-8 text-sm max-w-md mx-auto">
          Tell us about your project and we&apos;ll recommend the right path — design, permits, or full build.
        </p>
        <Link
          href="/concept"
          className="inline-flex items-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold px-8 py-4 rounded-xl transition shadow-lg text-base"
        >
          Get Started <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  )
}
