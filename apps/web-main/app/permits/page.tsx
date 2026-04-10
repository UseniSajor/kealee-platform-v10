import type { Metadata } from 'next'
import Link from 'next/link'
import {
  CheckCircle2, ArrowRight, Shield, Clock, FileText, AlertTriangle,
  Search, ClipboardList, Phone, Zap, Users, Home, Building2, HardHat, Info,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Permit Services — See Your Path to Approval | Kealee',
  description:
    'Kealee helps you understand what permit you need, what may block approval, what documents are missing, and the right next move — then executes the permit process. DC, MD & VA.',
  openGraph: {
    title: 'See Your Exact Path to Permit Approval | Kealee',
    description: 'From simple filing to full coordination. Kealee handles the permit process — jurisdiction research, submission, status tracking, and escalation.',
    url: 'https://kealee.com/permits',
  },
}

const TRUST_ITEMS = [
  { icon: Clock,        text: 'All DMV jurisdictions' },
  { icon: Shield,       text: 'Permit specialist review' },
  { icon: FileText,     text: 'Jurisdiction-specific guidance' },
  { icon: CheckCircle2, text: 'Status tracking included' },
]

const PROBLEMS = [
  {
    title: 'You don\'t know which permit you actually need',
    body: 'There are building permits, mechanical permits, electrical permits, zoning approvals, and HOA overlays. The wrong application wastes months.',
  },
  {
    title: 'Your plans weren\'t permit-ready',
    body: 'An AI concept or early sketch is not the same as permit-stamped construction documents. Submitting too early triggers rejection and restarts the clock.',
  },
  {
    title: 'You\'re waiting with no visibility',
    body: 'Most jurisdictions don\'t proactively notify applicants of status changes. Permits stall in review with no one following up.',
  },
  {
    title: 'You hired the wrong help for the jurisdiction',
    body: 'A contractor who pulls permits in Virginia may not understand DC\'s DCRA process. Jurisdiction-specific knowledge is not generic.',
  },
]

const WHAT_YOU_GET = [
  { icon: Search,        text: 'Permit type identification — what you actually need' },
  { icon: AlertTriangle, text: 'Blocker and risk flag review before submission' },
  { icon: ClipboardList, text: 'Document checklist — what\'s missing and what\'s required' },
  { icon: FileText,      text: 'Application preparation and submission' },
  { icon: Clock,         text: 'Status tracking with biweekly updates' },
  { icon: Phone,         text: 'Jurisdiction follow-up and escalation' },
]

const PACKAGES = [
  {
    sku: 'PERMIT_SIMPLE',
    name: 'Simple Filing',
    price: '$395',
    icon: FileText,
    tagline: 'For straightforward permits where you already have the documents.',
    bullets: [
      'Permit type confirmation',
      'Application review and submission',
      'Jurisdiction fee identification',
      'Status tracking (30 days)',
      'Single trade / single jurisdiction',
    ],
    cta: 'Start Simple Filing',
    href: '/permits/intake?sku=PERMIT_SIMPLE',
    highlight: false,
  },
  {
    sku: 'PERMIT_PACKAGE',
    name: 'Permit Package',
    price: '$695',
    icon: ClipboardList,
    tagline: 'For projects that need document prep and risk review before filing.',
    bullets: [
      'Permit type and scope review',
      'Blocker and risk analysis',
      'Document checklist and gap audit',
      'Application prep and submission',
      'Status tracking (60 days)',
      'One revision round',
    ],
    cta: 'Get Permit Package',
    href: '/permits/intake?sku=PERMIT_PACKAGE',
    highlight: true,
  },
  {
    sku: 'PERMIT_COORDINATION',
    name: 'Permit Coordination',
    price: '$1,495',
    icon: Phone,
    tagline: 'Full-service coordination for multi-trade or complex permit paths.',
    bullets: [
      'Everything in Permit Package, plus:',
      'Multi-trade coordination',
      'Jurisdiction liaison and escalation',
      'Inspector scheduling',
      'Status tracking (120 days)',
      'Unlimited revisions',
    ],
    cta: 'Start Coordination',
    href: '/permits/intake?sku=PERMIT_COORDINATION',
    highlight: false,
  },
  {
    sku: 'PERMIT_EXPEDITING',
    name: 'Permit Expediting',
    price: '$2,495',
    icon: Zap,
    tagline: 'For time-sensitive projects that need to move as fast as possible.',
    bullets: [
      'Everything in Coordination, plus:',
      'Dedicated permit expeditor',
      'Expedited review request where available',
      'Direct reviewer contact',
      'Weekly status calls',
      'Full permit lifecycle management',
    ],
    cta: 'Start Expediting',
    href: '/permits/intake?sku=PERMIT_EXPEDITING',
    highlight: false,
  },
]

const WHO = [
  { icon: Home,      label: 'Homeowners',  body: 'Adding a room, finishing a basement, or doing a kitchen remodel that requires a permit.' },
  { icon: Building2, label: 'Property owners', body: 'Managing a commercial renovation, tenant build-out, or multifamily upgrade.' },
  { icon: HardHat,   label: 'Contractors', body: 'Pulling permits across jurisdictions where you need local knowledge and faster processing.' },
  { icon: Users,     label: 'Developers',  body: 'Running multiple permit tracks simultaneously and need coordination support.' },
]

const FAQ = [
  {
    q: 'Is an AI concept or floor plan the same as permit-ready plans?',
    a: 'No — and this is the most common and expensive mistake in the process. An AI concept or early-stage floor plan is a planning and communication tool. Permit-ready construction documents are stamped drawings prepared by a licensed architect or engineer, meeting your jurisdiction\'s technical requirements. If your permit requires stamped plans and you don\'t have them, Kealee will tell you exactly what\'s needed and can connect you with the right professional.',
  },
  {
    q: 'What jurisdictions do you cover?',
    a: 'We cover all DMV jurisdictions: Washington DC (DCRA), all Maryland counties including Montgomery, Prince George\'s, Howard, Anne Arundel, and more, plus all Virginia jurisdictions including Fairfax, Arlington, Alexandria, Prince William, Loudoun, and beyond.',
  },
  {
    q: 'Can Kealee guarantee permit approval?',
    a: 'No. Permit approval is controlled by the local jurisdiction and depends on your project\'s compliance with applicable codes and regulations. Kealee ensures you submit correctly, completely, and with the right documents — which significantly improves approval odds and timelines.',
  },
  {
    q: 'What if plans or professional handoff are required?',
    a: 'If your project scope requires stamped architectural or engineering drawings, Kealee will identify that clearly, explain what type of professional you need, and can refer you to qualified professionals in our network. We do not file permits without the required documentation.',
  },
  {
    q: 'How long does a permit take?',
    a: 'It depends on jurisdiction and project type. Simple residential permits in Virginia can take 2–4 weeks. DC DCRA reviews can take 4–16+ weeks. We give you realistic timelines for your specific jurisdiction and project type, and follow up proactively throughout.',
  },
]

export default function PermitsPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section
        style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #0F1D34 60%, #0F2A2A 100%)' }}
        className="px-6 py-24 md:py-32"
      >
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-[#2ABFBF]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#2ABFBF]">
            Permit Services — DC, MD &amp; VA
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold text-white md:text-5xl lg:text-6xl leading-tight">
            See your exact path to{' '}
            <span className="text-[#E8793A]">permit approval</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70 leading-relaxed">
            Kealee helps you understand what permit you need, what may block approval, what
            documents are missing, and what the right next move is — then we help execute the
            permit process.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/permits/intake?sku=PERMIT_PACKAGE"
              className="inline-flex items-center gap-2 rounded-lg bg-[#E8793A] px-8 py-4 font-semibold text-white transition hover:opacity-90"
            >
              See My Path to Approval <ArrowRight className="h-4 w-4" />
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
      <section className="bg-amber-50 border-b border-amber-100 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-900">
            <strong>Important:</strong> An AI concept, floor plan sketch, or early design rendering
            is <strong>not</strong> the same as permit-ready construction documents. Permit-ready
            plans are stamped drawings from a licensed architect or engineer. If your project
            requires stamped plans and you don&apos;t have them, Kealee will identify that and tell
            you exactly what to do next — including professional referral if needed.
          </p>
        </div>
      </section>

      {/* ── Problem section ───────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-[#1A2B4A]">
              Why permits stall — and how to avoid it
            </h2>
            <p className="mt-3 text-gray-500">Most permit delays are predictable. Most are preventable.</p>
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
              What Kealee does on every permit engagement
            </h2>
            <p className="mt-3 text-white/60">Scope depends on your tier. All tiers include the full picture upfront.</p>
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
            <h2 className="font-display text-3xl font-bold text-[#1A2B4A]">Choose your permit tier</h2>
            <p className="mt-3 text-gray-500">Start with what matches your project. Upgrade at any time.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {PACKAGES.map((p) => {
              const PkgIcon = p.icon
              return (
                <div
                  key={p.sku}
                  className={`relative flex flex-col rounded-2xl border bg-white p-6 ${
                    p.highlight ? 'border-[#2ABFBF] shadow-lg ring-1 ring-[#2ABFBF]' : 'border-gray-200'
                  }`}
                >
                  {p.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#2ABFBF] px-3 py-1 text-xs font-bold text-white">
                      Most Popular
                    </span>
                  )}
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#2ABFBF]/10">
                    <PkgIcon className="h-5 w-5 text-[#2ABFBF]" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#1A2B4A]">{p.name}</h3>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">{p.tagline}</p>
                  <p className="mt-4 font-display text-2xl font-bold text-[#E8793A]">{p.price}</p>
                  <ul className="mt-5 flex-1 space-y-2">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-1.5 text-xs text-gray-700">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2ABFBF]" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={p.href}
                    className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#E8793A] py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    {p.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )
            })}
          </div>
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

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="bg-[#0F1A2E] px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-white">
            Ready to move your permit forward?
          </h2>
          <p className="mt-4 text-white/60">
            Start with a clear picture of your path to approval.
            No guessing, no wasted submissions.
          </p>
          <Link
            href="/permits/intake?sku=PERMIT_PACKAGE"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#E8793A] px-10 py-4 font-semibold text-white transition hover:opacity-90"
          >
            See My Path to Approval <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-4 text-sm text-white/40">All DMV jurisdictions covered · DC, Maryland, Virginia</p>
        </div>
      </section>

    </main>
  )
}
