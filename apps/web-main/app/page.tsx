import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Star, Building2 } from 'lucide-react'
import HomeHero from '@/components/HomeHero'
import { SERVICES } from '@/lib/services-config'

const PRECON_SERVICES = SERVICES.filter((s) => s.phase === 'precon')

export const metadata: Metadata = {
  title: 'Kealee — Transform Your Home with AI Design',
  description:
    'AI-designed concepts with professional videos, cost estimates, and permit roadmaps. Kitchen, bathroom, addition, whole house — delivered in days.',
}

// ── Service Gallery ────────────────────────────────────────────────────────────

function ServiceGallery() {
  return (
    <section id="services" className="py-24 bg-white scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-[#E8724B] mb-3">Design &amp; Planning</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">What We Can Transform</h2>
          <p className="mt-3 text-slate-500 max-w-xl mx-auto">
            AI-generated concepts, cost estimates, and permit packages — delivered in days, not months.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {PRECON_SERVICES.map((service) => {
            const href = service.usesConceptIntake
              ? `/services/${service.slug}`
              : service.customIntakePath ?? `/services/${service.slug}`

            return (
              <Link key={service.slug} href={href}>
                <div className="group relative rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer h-full">
                  {/* Image */}
                  <div className="relative h-44 overflow-hidden bg-slate-100">
                    <Image
                      src={service.heroImage}
                      alt={service.label}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                    />
                    {/* Category badge */}
                    <span className="absolute top-3 left-3 rounded-full bg-black/40 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-semibold text-white capitalize">
                      {service.category}
                    </span>
                  </div>
                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-[15px] font-bold text-slate-900 leading-tight mb-1">{service.label}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{service.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">{service.deliveryDays} delivery</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        Explore <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Build CTA — separate from precon services */}
        <div className="mt-10 rounded-2xl bg-[#1A2B4A] px-8 py-7 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#2563EB]/20 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-[#2563EB]" />
            </div>
            <div>
              <p className="font-bold text-white text-base">Ready to Build?</p>
              <p className="text-slate-400 text-sm">New construction, GC coordination, and full build management across DMV.</p>
            </div>
          </div>
          <Link
            href="/build"
            className="shrink-0 flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-6 py-3 rounded-xl transition-all text-sm whitespace-nowrap"
          >
            Explore Build Services <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ── Process Section ────────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, icon: '💬', title: 'Choose Your Project', desc: 'Select from 10 renovation and design types' },
  { n: 2, icon: '📐', title: 'Tell Us Your Vision', desc: 'Share your budget, scope, location, and goals' },
  { n: 3, icon: '⚡', title: 'Get Your Concept', desc: 'AI-designed visuals, cost estimate, and permits' },
  { n: 4, icon: '🚀', title: 'Move Forward', desc: 'Download, share, or hire a vetted contractor' },
]

function ProcessSection() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-[#E8724B] mb-3">Simple Process</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">How It Works</h2>
        </div>

        <div className="relative">
          {/* Connecting line — desktop only */}
          <div className="hidden lg:block absolute top-9 left-[12.5%] right-[12.5%] h-0.5 border-t-2 border-dashed border-slate-300 z-0" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {STEPS.map((step) => (
              <div key={step.n} className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center w-[72px] h-[72px] rounded-full bg-[#E8724B] text-white text-xl font-black shadow-lg shadow-orange-200 mb-5">
                  {step.n}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 text-center">
          <Link href="/concept">
            <button className="inline-flex items-center gap-2 bg-[#E8724B] hover:bg-[#D45C33] text-white font-bold px-8 py-4 rounded-xl shadow-md shadow-orange-200 transition-all duration-200 hover:-translate-y-0.5">
              Start Your Concept <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ── Featured Transformations ───────────────────────────────────────────────────

const FEATURED = [
  {
    slug: 'kitchen',
    title: 'Kitchen Remodel',
    before: 'https://images.unsplash.com/photo-1556909014-0284a50fc0c3?w=700&q=80&auto=format&fit=crop',
    after: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=700&q=80&auto=format&fit=crop',
    highlight: 'Open-concept with quartz island',
  },
  {
    slug: 'bathroom',
    title: 'Bathroom Remodel',
    before: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=700&q=80&auto=format&fit=crop',
    after: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=700&q=80&auto=format&fit=crop',
    highlight: 'Spa-level primary suite',
  },
  {
    slug: 'addition',
    title: 'Home Addition',
    before: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=700&q=80&auto=format&fit=crop',
    after: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=700&q=80&auto=format&fit=crop',
    highlight: 'Primary suite + outdoor living',
  },
]

function FeaturedSection() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-[#E8724B] mb-3">Real Results</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">See Transformations in Action</h2>
          <p className="mt-3 text-slate-500">AI-generated before/after concepts — your home, your vision.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURED.map((item) => (
            <Link key={item.slug} href={`/services/${item.slug}`}>
              <div className="group relative rounded-2xl overflow-hidden bg-slate-900 aspect-[4/3] cursor-pointer">
                <Image
                  src={item.after}
                  alt={item.title}
                  fill
                  className="object-cover opacity-80 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                {/* Bottom overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-1">Concept</p>
                  <h3 className="text-lg font-bold text-white leading-tight">{item.title}</h3>
                  <p className="text-sm text-slate-300 mt-1">{item.highlight}</p>
                </div>
                {/* View video badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-semibold text-white">View Concept</span>
                  <ArrowRight className="w-3 h-3 text-white" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Testimonials ───────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote: "Working with Kealee transformed what felt like an overwhelming renovation into a clear, exciting project. The AI concept was spot-on and saved us weeks of back-and-forth with contractors.",
    author: 'Sarah M.',
    project: 'Kitchen Remodel — Bethesda, MD',
    stars: 5,
  },
  {
    quote: "I got a permit roadmap I actually understood in 24 hours. My contractor couldn't believe I came prepared with zoning data and a full cost breakdown. Kealee made me look like a pro.",
    author: 'Marcus T.',
    project: 'Home Addition — Arlington, VA',
    stars: 5,
  },
  {
    quote: "The before/after concept video was incredible. I showed it to my HOA and got approval on the first try. The whole process — from intake to delivery — took less than a week.",
    author: 'Jennifer L.',
    project: 'Exterior Facade — Washington, DC',
    stars: 5,
  },
]

function Testimonials() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-[#E8724B] mb-3">Homeowner Stories</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">What Homeowners Say</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 border-l-4 border-l-[#E8724B]"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-600 italic leading-relaxed mb-5">"{t.quote}"</p>
              <div>
                <p className="font-bold text-slate-900 text-sm">{t.author}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t.project}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Value Props ────────────────────────────────────────────────────────────────

const VALUE_PROPS = [
  { icon: '⚡', title: 'Fast Delivery', desc: 'Concepts in 2–6 days, not months' },
  { icon: '🤖', title: 'AI-Powered', desc: 'Photorealistic renders + cost data' },
  { icon: '📋', title: 'Permit-Ready', desc: 'Jurisdiction analysis included' },
  { icon: '💰', title: 'Transparent Pricing', desc: 'From $99 — no surprises' },
]

function ValueProps() {
  return (
    <section className="py-16 bg-white border-y border-slate-100">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {VALUE_PROPS.map((v) => (
            <div key={v.title} className="text-center">
              <div className="text-3xl mb-3">{v.icon}</div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">{v.title}</h3>
              <p className="text-xs text-slate-500">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Final CTA ──────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="py-24 bg-gradient-to-r from-[#E8724B] to-[#D45C33]">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to Transform Your Home?
        </h2>
        <p className="text-orange-100 text-lg mb-10">
          Get a professional AI concept with video, cost estimate, and permit roadmap — in days.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/concept">
            <button className="bg-white text-[#E8724B] hover:bg-orange-50 font-bold text-base px-8 py-4 rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5">
              Start Now
            </button>
          </Link>
          <Link href="/gallery">
            <button className="border-2 border-white/50 hover:border-white text-white font-semibold text-base px-8 py-4 rounded-xl transition-all duration-200">
              Browse All Services
            </button>
          </Link>
        </div>
        <div className="mt-8 flex justify-center gap-6 flex-wrap">
          {['No commitment required', 'Multiple service types', 'Delivered in days'].map(item => (
            <span key={item} className="flex items-center gap-1.5 text-sm text-orange-100">
              <CheckCircle2 className="w-4 h-4 text-white" /> {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HomeHero />
      <ValueProps />
      <ServiceGallery />
      <ProcessSection />
      <FeaturedSection />
      <Testimonials />
      <FinalCTA />
    </div>
  )
}
