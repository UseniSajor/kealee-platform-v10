import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, CheckCircle2, ArrowRight, TrendingUp, AlertTriangle, FileText, Shield, Clock, DollarSign, Users, Home, Building2, TreePine } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Land Buildability Analysis — Know What You Can Build | Kealee',
  description:
    'Find out what you can build on your land before you waste money. Kealee checks zoning, constraints, permit path, and rough cost — then shows you the right next step. From $195.',
  openGraph: {
    title: 'Find Out What You Can Build On Your Land | Kealee',
    description: 'Fast buildability and cost analysis for your lot or parcel. Zoning, setbacks, cost band, and recommended next step. From $195.',
    url: 'https://kealee.com/land',
  },
}

const TRUST_ITEMS = [
  { icon: Clock,         text: '24–48 hr delivery' },
  { icon: Shield,        text: 'Real analyst review' },
  { icon: MapPin,        text: 'DMV area specialists' },
  { icon: DollarSign,    text: 'No hidden fees' },
]

const PROBLEMS = [
  {
    title: 'You hired a designer before checking zoning',
    body: 'Architects charge $5,000–$25,000 before they tell you the lot can\'t support what you want to build.',
  },
  {
    title: 'You assumed the lot was buildable',
    body: 'Flood overlays, setback requirements, easements, and deed restrictions can make a parcel nearly unbuildable.',
  },
  {
    title: 'You got a cost estimate from a contractor first',
    body: 'Without a zoning review, contractor estimates are meaningless. They\'re quoting a project that may not be legal.',
  },
  {
    title: 'You found out during the permit process',
    body: 'The worst time to discover a zoning problem is after you\'ve paid for plans, engineering, and permit fees.',
  },
]

const DELIVERABLES = [
  { icon: MapPin,         text: 'Parcel and address verification' },
  { icon: AlertTriangle,  text: 'Zoning classification and overlay flags' },
  { icon: Home,           text: 'Buildability assessment with constraints' },
  { icon: FileText,       text: 'Setback, height, and FAR summary' },
  { icon: TrendingUp,     text: 'Rough cost-to-build band' },
  { icon: ArrowRight,     text: 'Recommended next step — specific to your parcel' },
]

const PACKAGES = [
  {
    sku: 'LAND_FEASIBILITY_BASIC',
    name: 'Land Buildability & Cost Analysis',
    price: 'From $195',
    priceNote: 'Final price depends on parcel complexity and jurisdiction',
    tagline: 'Know what your land can support before you spend more.',
    bullets: [
      'Parcel and address review',
      'Zoning and jurisdiction screen',
      'Basic buildability assessment',
      'Setback and overlay flag review',
      'Likely permit path overview',
      'Rough cost-to-build band',
      'Recommended next step',
    ],
    cta: 'Start Basic Analysis',
    href: '/land/intake?sku=LAND_FEASIBILITY_BASIC',
    highlight: false,
  },
  {
    sku: 'LAND_FEASIBILITY_PRO',
    name: 'Land Feasibility Pro',
    price: 'From $495',
    priceNote: 'Includes deeper modeling and design direction',
    tagline: 'For serious buyers, investors, and anyone with a complex parcel.',
    bullets: [
      'Everything in Basic, plus:',
      'Build envelope analysis',
      'Use scenario modeling (ADU, SFH, duplex)',
      'Stronger cost range with quality tiers',
      'Concept-readiness package',
      'Risk flags with mitigation notes',
      'Recommended design direction',
    ],
    cta: 'Start Pro Analysis',
    href: '/land/intake?sku=LAND_FEASIBILITY_PRO',
    highlight: true,
  },
]

const WHO = [
  { icon: Home,       label: 'Land owners',         body: 'You own a lot or parcel and want to know what\'s possible before investing in design.' },
  { icon: Users,      label: 'Inherited land',       body: 'You inherited property and need to understand its development potential quickly.' },
  { icon: Building2,  label: 'Lot buyers',           body: 'You\'re under contract or evaluating a lot before closing and need a fast feasibility read.' },
  { icon: TrendingUp, label: 'Small investors',      body: 'You\'re evaluating multiple parcels for development potential and need a fast, structured answer.' },
  { icon: TreePine,   label: 'ADU owners',           body: 'You want to add an ADU to your property and need to know if zoning and lot size allow it.' },
]

const FAQ = [
  {
    q: 'Is this the same as a survey?',
    a: 'No. A land analysis reviews zoning, jurisdiction data, public records, and known constraints. A survey is a physical measurement of the lot by a licensed surveyor. You may still need a survey later, but the analysis comes first.',
  },
  {
    q: 'Can Kealee guarantee the permit will be approved?',
    a: 'No. A land analysis tells you the likely permit path and known risks. Permit approval depends on your jurisdiction, the final plans, and the review process. We flag risks so you can address them early.',
  },
  {
    q: 'What if the analysis shows my land isn\'t buildable?',
    a: 'That\'s still valuable information — and far cheaper to learn from a $195 analysis than after spending $20,000 on plans. We\'ll show you exactly what the constraint is and whether it can be resolved.',
  },
  {
    q: 'Does this replace an architect?',
    a: 'No. A land analysis is a feasibility step. If your parcel is buildable, the recommended next step may be a design concept, an architecture consultation, or a permit path review depending on your situation.',
  },
  {
    q: 'How fast is delivery?',
    a: 'Standard delivery is 24–48 hours. Complex parcels or rural jurisdictions may take up to 72 hours. You\'ll receive your report via email.',
  },
]

export default function LandPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-[#0F1A2E] px-6 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-[#2ABFBF]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#2ABFBF]">
            Land Owners &amp; Lot Buyers
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold text-white md:text-5xl lg:text-6xl leading-tight">
            Find out what you can build on your land —&nbsp;
            <span className="text-[#E8793A]">before you waste money</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70 leading-relaxed">
            Get a fast buildability and cost analysis for your lot or parcel. Kealee checks
            zoning, constraints, likely permit path, and rough cost to build — then shows you the
            right next step.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/land/intake?sku=LAND_FEASIBILITY_BASIC"
              className="inline-flex items-center gap-2 rounded-lg bg-[#E8793A] px-8 py-4 font-semibold text-white transition hover:opacity-90"
            >
              Get My Land Analysis — From $195 <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/land/intake?sku=LAND_FEASIBILITY_PRO"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-8 py-4 font-semibold text-white transition hover:bg-white/10"
            >
              View Pro Package
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust bar ─────────────────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-gray-50 px-6 py-5">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8">
          {TRUST_ITEMS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Icon className="h-4 w-4 text-[#2ABFBF]" />
              {text}
            </div>
          ))}
        </div>
      </section>

      {/* ── Problem section ───────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-[#1A2B4A]">
              Four mistakes land owners make before getting an analysis
            </h2>
            <p className="mt-3 text-gray-500">Each one costs real money. All are avoidable.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {PROBLEMS.map((p, i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-sm font-bold text-red-500">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-[#1A2B4A]">{p.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What you get ──────────────────────────────────────────────── */}
      <section className="bg-[#0F1A2E] px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-white">Every land analysis includes</h2>
            <p className="mt-3 text-white/60">Delivered in 24–48 hours, specific to your parcel and jurisdiction.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {DELIVERABLES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-5">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#2ABFBF]" />
                <span className="text-sm font-medium text-white">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────── */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-[#1A2B4A]">Choose your analysis</h2>
            <p className="mt-3 text-gray-500">Start with Basic. Upgrade to Pro for complex parcels or deeper modeling.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {PACKAGES.map((p) => (
              <div
                key={p.sku}
                className={`relative rounded-2xl border bg-white p-8 ${
                  p.highlight ? 'border-[#2ABFBF] shadow-lg ring-1 ring-[#2ABFBF]' : 'border-gray-200'
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#2ABFBF] px-4 py-1 text-xs font-bold text-white">
                    Most Complete
                  </span>
                )}
                <h3 className="font-display text-xl font-bold text-[#1A2B4A]">{p.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{p.tagline}</p>
                <p className="mt-4 font-display text-3xl font-bold text-[#E8793A]">{p.price}</p>
                <p className="mt-1 text-xs text-gray-400">{p.priceNote}</p>
                <ul className="mt-6 space-y-2.5">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2ABFBF]" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.href}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-[#E8793A] py-3.5 font-semibold text-white transition hover:opacity-90"
                >
                  {p.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ──────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-[#1A2B4A]">Who this is for</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {WHO.map(({ icon: Icon, label, body }) => (
              <div key={label} className="rounded-xl border border-gray-100 p-5 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#2ABFBF]/10">
                  <Icon className="h-5 w-5 text-[#2ABFBF]" />
                </div>
                <h3 className="font-semibold text-[#1A2B4A]">{label}</h3>
                <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-10 text-center font-display text-3xl font-bold text-[#1A2B4A]">Common questions</h2>
          <div className="space-y-4">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="font-semibold text-[#1A2B4A]">{q}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What happens after ────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold text-[#1A2B4A]">What happens after your analysis?</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Once your land analysis is complete, Kealee recommends the single best next step —
            whether that&apos;s an AI design concept, a permit path review, or a direct conversation
            with an architect. You&apos;re never shown a full catalog. Just the right next product for your parcel.
          </p>
          <Link
            href="/paths"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#2ABFBF] hover:underline"
          >
            See the full project path <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="bg-[#0F1A2E] px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-white">
            Ready to know what your land can support?
          </h2>
          <p className="mt-4 text-white/60">Get your analysis in 24–48 hours. No architect needed yet.</p>
          <Link
            href="/land/intake?sku=LAND_FEASIBILITY_BASIC"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#E8793A] px-10 py-4 font-semibold text-white transition hover:opacity-90"
          >
            Get My Land Analysis — From $195 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

    </main>
  )
}
