import type { Metadata } from 'next'
import Link from 'next/link'
import {
  CheckCircle2, ArrowRight, Shield, Clock, Lightbulb, FileText,
  DollarSign, BarChart2, Home, Building2, Users, AlertCircle, Info,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Design Services — Project Concept, AI Design & Full Package | Kealee',
  description:
    'Plan your project before you hire the wrong help. Kealee gives you an early concept, validation, budget direction, and permit-risk view. From $395.',
  openGraph: {
    title: 'Plan Your Project Before You Spend Money on the Wrong Help | Kealee',
    description: 'Get a concept, budget direction, and permit-risk view before hiring designers, contractors, or architects. From $395.',
    url: 'https://kealee.com/design',
  },
}

const TRUST_ITEMS = [
  { icon: Clock,         text: 'Concept in 24–48 hours' },
  { icon: Shield,        text: 'Property-specific output' },
  { icon: DollarSign,    text: 'Budget direction included' },
  { icon: AlertCircle,   text: 'Permit risk flagged upfront' },
]

const PROBLEMS = [
  {
    title: 'You hired a contractor before you had a plan',
    body: 'Contractors bid on plans. Without a concept, they\'re quoting a project that doesn\'t exist yet — and their number will change dramatically once plans arrive.',
  },
  {
    title: 'You paid for full design before validating the concept',
    body: 'Architectural fees for full construction drawings start at $15,000. Paying for full design before you\'ve validated direction is a costly sequence error.',
  },
  {
    title: 'Your budget and scope were misaligned',
    body: 'A $150,000 budget for a whole-home renovation is very different from a $150,000 budget for an addition. A concept review aligns your scope to reality early.',
  },
  {
    title: 'You found a permit problem late',
    body: 'Zoning overlays, historic district rules, and setback requirements affect design significantly. Discovering them after full plans are drawn wastes design fees.',
  },
]

const WHAT_YOU_GET = [
  { icon: Lightbulb,  text: 'Concept direction with 2–3 spatial options' },
  { icon: BarChart2,  text: 'Budget band with quality tiers' },
  { icon: AlertCircle,text: 'Permit risk and zoning flag review' },
  { icon: FileText,   text: 'Scope-to-budget alignment check' },
  { icon: CheckCircle2,text: 'Next step recommendation — specific to your project' },
  { icon: Shield,     text: 'Property-specific, not a generic template' },
]

const PACKAGES = [
  {
    sku: 'DESIGN_CONCEPT_VALIDATION',
    name: 'Project Concept + Validation',
    price: '$395',
    tagline: 'Know what you\'re building and whether it makes sense before spending more.',
    bullets: [
      'Project type and scope review',
      '2–3 concept directions',
      'Rough budget band',
      'Permit risk flag review',
      'Scope-to-budget alignment check',
      'Recommended next step',
    ],
    cta: 'Get My Project Concept',
    href: '/intake-wizard?intent=buy_concept&sku=DESIGN_CONCEPT_VALIDATION',
    highlight: false,
    badge: null,
  },
  {
    sku: 'DESIGN_ADVANCED',
    name: 'Advanced AI Concept',
    price: '$495',
    tagline: 'A richer concept with more detail, material direction, and cost clarity.',
    bullets: [
      'Everything in Concept + Validation, plus:',
      'AI-generated visual concept',
      'Material and finish direction',
      'Tighter cost band with quality tiers',
      'Comparable project references',
      'Permit path overview',
    ],
    cta: 'Start Advanced Concept',
    href: '/intake-wizard?intent=buy_concept&sku=DESIGN_ADVANCED',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    sku: 'DESIGN_FULL',
    name: 'Full Design Package',
    price: '$4,499',
    tagline: 'For projects that are moving forward and need real construction-ready design.',
    bullets: [
      'Schematic design',
      'Design development documents',
      'Material specifications',
      'Permit-ready plans (where scope allows)',
      'Contractor-ready bid package',
      'Project coordination support',
    ],
    cta: 'Start Full Design',
    href: '/intake-wizard?intent=buy_concept&sku=DESIGN_FULL',
    highlight: false,
    badge: 'Includes Permit-Ready Plans',
  },
]

const WHO = [
  { icon: Home,       label: 'Early-stage homeowners', body: 'You know you want to do something but haven\'t decided on scope, budget, or direction yet.' },
  { icon: Building2,  label: 'Renovation planners', body: 'You\'re planning a kitchen, addition, or whole-home reno and need to validate cost and scope before hiring.' },
  { icon: Users,      label: 'First-time project owners', body: 'You\'ve never done a project this size before and want a clear picture before committing.' },
  { icon: DollarSign, label: 'Budget-constrained owners', body: 'You need to know if your budget matches your vision before spending on full design or engineering.' },
]

const FAQ = [
  {
    q: 'Is a concept or AI design the same as permit-ready plans?',
    a: 'No. This is the most important thing to understand. A concept or AI design is a planning and visualization tool — it helps you clarify direction, validate scope, and understand cost. It is not permit-ready. Permit-ready construction documents are stamped drawings prepared by a licensed architect or engineer meeting your jurisdiction\'s technical requirements. The Full Design Package includes permit-ready plans where scope allows. The concept and advanced packages do not.',
  },
  {
    q: 'What\'s the difference between the $395 and $495 packages?',
    a: 'The Concept + Validation ($395) gives you scope review, 2–3 concept directions, a budget band, and a permit risk flag. The Advanced AI Concept ($495) adds a visual AI-generated concept, material direction, tighter cost banding, and comparable project references.',
  },
  {
    q: 'When do I need a licensed architect?',
    a: 'If your project requires structural changes, exceeds certain square footage thresholds, is in a historic district, or is in a jurisdiction that requires stamped drawings for any permit — you need a licensed architect. Kealee will identify this in your concept review and can refer you to qualified professionals.',
  },
  {
    q: 'What if my scope is too complex for a concept package?',
    a: 'If your project requires an architect handoff from the start, Kealee will identify that immediately and recommend the right path — including architect referral or the Full Design Package. We do not sell you a concept if the project clearly needs professional engineering from day one.',
  },
  {
    q: 'Can I use my concept to get contractor bids?',
    a: 'The concept gives contractors enough direction to provide ballpark estimates for planning purposes. For final construction bids, contractors need permit-ready plans with full specifications. We\'ll tell you exactly when you\'re ready to go to bid.',
  },
]

export default function DesignPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section
        style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #0F1D34 60%, #1A1A3A 100%)' }}
        className="px-6 py-24 md:py-32"
      >
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-[#E8793A]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#E8793A]">
            Design &amp; Concept Services
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold text-white md:text-5xl lg:text-6xl leading-tight">
            Plan your project before you hire{' '}
            <span className="text-[#E8793A]">the wrong help</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70 leading-relaxed">
            Kealee gives you an early concept, validation, budget direction, and permit-risk view
            so you can understand your project before spending more on design, consultants, or
            misaligned bids.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/intake-wizard?intent=buy_concept&sku=DESIGN_CONCEPT_VALIDATION"
              className="inline-flex items-center gap-2 rounded-lg bg-[#E8793A] px-8 py-4 font-semibold text-white transition hover:opacity-90"
            >
              Get My Project Concept — From $395 <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#packages"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-8 py-4 font-semibold text-white transition hover:bg-white/10"
            >
              Compare packages
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

      {/* ── IMPORTANT RULE ────────────────────────────────────────────── */}
      <section className="bg-amber-50 px-6 py-5">
        <div className="mx-auto flex max-w-4xl items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-900">
            <strong>Important:</strong> A design concept or AI visualization is a planning and
            communication tool — it is <strong>not</strong> permit-ready construction documents.
            If your project requires stamped drawings from a licensed architect or engineer,
            Kealee will identify that and tell you exactly what you need.
          </p>
        </div>
      </section>

      {/* ── Problem section ───────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-[#1A2B4A]">
              The four mistakes that cost project owners the most
            </h2>
            <p className="mt-3 text-gray-500">
              All of them happen before the design stage. All of them are avoidable.
            </p>
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
            <h2 className="font-display text-3xl font-bold text-white">
              What every Kealee concept includes
            </h2>
            <p className="mt-3 text-white/60">
              Specific to your project and address, not a generic output.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {WHAT_YOU_GET.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-5">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#2ABFBF]" />
                <span className="text-sm font-medium text-white">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────── */}
      <section id="packages" className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-[#1A2B4A]">
              Choose your design package
            </h2>
            <p className="mt-3 text-gray-500">
              Start with concept validation. Move to full design when you&apos;re ready.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {PACKAGES.map((p) => (
              <div
                key={p.sku}
                className={`relative flex flex-col rounded-2xl border bg-white p-8 ${
                  p.highlight
                    ? 'border-[#2ABFBF] shadow-lg ring-1 ring-[#2ABFBF]'
                    : 'border-gray-200'
                }`}
              >
                {p.badge && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold text-white ${p.highlight ? 'bg-[#2ABFBF]' : 'bg-[#1A2B4A]'}`}>
                    {p.badge}
                  </span>
                )}
                <h3 className="font-display text-xl font-bold text-[#1A2B4A]">{p.name}</h3>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">{p.tagline}</p>
                <p className="mt-4 font-display text-3xl font-bold text-[#E8793A]">{p.price}</p>
                <ul className="mt-6 flex-1 space-y-2.5">
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
          <p className="mt-6 text-center text-xs text-gray-400">
            Prices are fixed per package. No hidden fees or scope creep. If your project requires
            a licensed architect from day one, we&apos;ll tell you that immediately.
          </p>
        </div>
      </section>

      {/* ── Who it's for ──────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-[#1A2B4A]">Who this is for</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
            {WHO.map(({ icon: Icon, label, body }) => (
              <div key={label} className="rounded-xl border border-gray-100 p-5 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#E8793A]/10">
                  <Icon className="h-5 w-5 text-[#E8793A]" />
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
          <h2 className="mb-10 text-center font-display text-3xl font-bold text-[#1A2B4A]">
            Common questions
          </h2>
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

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="bg-[#0F1A2E] px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-white">
            Understand your project before you spend more
          </h2>
          <p className="mt-4 text-white/60">
            Get a concept in 24–48 hours. Budget direction, permit risk, and a clear next step.
          </p>
          <Link
            href="/intake-wizard?intent=buy_concept&sku=DESIGN_CONCEPT_VALIDATION"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#E8793A] px-10 py-4 font-semibold text-white transition hover:opacity-90"
          >
            Get My Project Concept — From $395 <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-white/40">
            <span>No architect needed yet</span>
            <span>·</span>
            <span>Property-specific output</span>
            <span>·</span>
            <span>Fixed price</span>
          </div>
        </div>
      </section>

    </main>
  )
}
