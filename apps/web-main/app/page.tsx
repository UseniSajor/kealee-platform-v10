import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Zap, Clock, DollarSign } from 'lucide-react'
import { HeroSearch } from '@/components/HeroSearch'

export const metadata: Metadata = {
  title: 'Kealee — Your Construction Execution Engine',
  description:
    'See your path to approval. Design, cost, permits, and build—mapped instantly. AI-powered project analysis for construction professionals.',
}

export default function HomePage() {
  const ctaButtons = [
    {
      label: 'Get a Concept',
      href: '/intake/concept',
      icon: '🎨',
      description: 'Design concept & plan',
    },
    {
      label: 'Price My Project',
      href: '/intake/cost_estimate',
      icon: '💰',
      description: 'Detailed cost estimate',
    },
    {
      label: 'Get My Permit',
      href: '/intake/permit_path_only',
      icon: '📋',
      description: 'Permit roadmap & filing',
    },
  ]

  const howItWorks = [
    { step: 1, label: 'Tell us your project', icon: '💬' },
    { step: 2, label: 'See your plan instantly', icon: '⚡' },
    { step: 3, label: 'Move forward with confidence', icon: '✅' },
  ]

  const benefits = [
    'Instant project insight',
    'Permit-ready direction',
    'Built for real construction',
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-white to-slate-50 px-4 py-20 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-display text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            See Your Path to Approval
          </h1>
          <p className="mt-6 text-xl text-slate-600 leading-relaxed">
            Design, cost, permits, and build—mapped instantly.
          </p>

          {/* SEARCH-STYLE INPUT */}
          <div className="mt-12 mx-auto max-w-2xl">
            <HeroSearch />
            <p className="mt-3 text-sm text-slate-500">Try: "exterior renovation" or "permit phase"</p>
          </div>

          {/* PRIMARY ACTION BUTTONS */}
          <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
            {ctaButtons.map((btn) => (
              <Link key={btn.href} href={btn.href}>
                <div className="group relative h-full rounded-xl border-2 border-slate-200 bg-white p-6 hover:border-orange-400 hover:shadow-lg transition duration-300 cursor-pointer">
                  <div className="text-4xl mb-4">{btn.icon}</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{btn.label}</h3>
                  <p className="text-sm text-slate-600 mb-4">{btn.description}</p>
                  <div className="flex items-center text-orange-600 font-semibold text-sm group-hover:gap-2 transition">
                    Start <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* VALUE STRIP */}
      <section className="bg-slate-900 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 text-white">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                <span className="text-lg font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 py-20 bg-white">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-16">How It Works</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center">
                <div className="mb-6 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                    <span className="text-3xl">{item.icon}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Step {item.step}</h3>
                <p className="text-slate-600">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE HIGHLIGHTS */}
      <section className="bg-slate-50 px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-16">Why Kealee</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-8 shadow-sm border border-slate-200">
              <Zap className="w-10 h-10 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Instant Insight</h3>
              <p className="text-slate-600">AI analyzes your project in seconds. See risks, opportunities, and next steps immediately.</p>
            </div>
            <div className="rounded-xl bg-white p-8 shadow-sm border border-slate-200">
              <Clock className="w-10 h-10 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Fast Delivery</h3>
              <p className="text-slate-600">Most deliverables ready in 1-5 business days. Track progress in real-time.</p>
            </div>
            <div className="rounded-xl bg-white p-8 shadow-sm border border-slate-200">
              <DollarSign className="w-10 h-10 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Transparent Pricing</h3>
              <p className="text-slate-600">No surprises. See the price before you pay. One-time payment, full access.</p>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="bg-white px-4 py-20 border-t border-slate-200">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Ready to Start?</h2>
          <p className="text-lg text-slate-600 mb-12">Choose your first step above, or explore all service options.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/intake/exterior_concept">
              <button className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-8 transition">
                Get Started Free
              </button>
            </Link>
            <Link href="/gallery">
              <button className="rounded-xl border-2 border-slate-300 hover:border-orange-400 text-slate-900 font-bold py-4 px-8 transition">
                Learn More
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
