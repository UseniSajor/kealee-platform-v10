import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Clock, FileText, Layers, Shield, Star } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Heading } from '@/components/ui/Heading'

export const metadata: Metadata = {
  title: 'Architect VIP — Permit-Ready Drawings in Days | Kealee',
  description:
    'Get a complete permit-ready drawing set from a licensed architect. Kealee coordinates everything — from intake to stamped drawings. Standard $3,099 · Expedited $3,799.',
  openGraph: {
    title: 'Architect VIP — Permit-Ready Drawings | Kealee',
    description: 'Full permit-ready drawing set with a licensed architect. Standard $3,099 · Expedited $3,799. Kealee coordinates everything.',
    url: 'https://kealee.com/architect-vip',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Architect VIP — Permit-Ready Drawings | Kealee',
    description: 'Full permit-ready drawing set with a licensed architect. Standard $3,099 · Expedited $3,799.',
  },
}

const DELIVERABLES = [
  {
    icon: FileText,
    title: 'Full Permit-Ready Drawing Set',
    desc: 'Architectural drawings that meet jurisdiction requirements and are stamped by a licensed architect.',
    items: [
      'Site plan and plot survey integration',
      'Floor plans (existing + proposed)',
      'Elevations (all applicable sides)',
      'Building section + detail drawings',
      'Notes and specifications sheet',
    ],
  },
  {
    icon: Layers,
    title: 'Jurisdiction-Specific Package',
    desc: 'Everything formatted for your specific county or city\'s plan review process.',
    items: [
      'Formatted for your jurisdiction\'s requirements',
      'Cover sheet with project summary',
      'Code compliance checklist',
      'Permit application pre-filled',
    ],
  },
  {
    icon: Shield,
    title: 'Licensed Architect Stamp',
    desc: 'All drawings signed and stamped by a licensed architect — required for permit filing in most jurisdictions.',
    items: [
      'Licensed in your state (DC, MD, or VA)',
      'Professional stamp on all applicable sheets',
      'Available for plan review questions',
      'Corrections handled within scope',
    ],
  },
  {
    icon: Star,
    title: 'Kealee Coordination',
    desc: 'We manage the entire process so you don\'t have to chase anyone.',
    items: [
      'Single point of contact throughout',
      'Status updates at each milestone',
      'Document collection assistance',
      'Optional: transition directly to Permit Filing',
    ],
  },
]

const TIERS = [
  {
    key: 'standard',
    name: 'Standard',
    price: '$3,099',
    turnaround: '7–10 business days',
    features: [
      'Full permit-ready drawing set',
      'Licensed architect stamp',
      'Jurisdiction-specific formatting',
      'Kealee coordination',
      '1 round of revisions included',
    ],
    highlight: false,
    href: '/contact?service=architect-vip-standard',
  },
  {
    key: 'expedited',
    name: 'Expedited',
    price: '$3,799',
    turnaround: '3–5 business days',
    features: [
      'Everything in Standard',
      'Priority architect assignment',
      'Same-day project start',
      'Daily status updates',
      '2 rounds of revisions included',
    ],
    highlight: true,
    href: '/contact?service=architect-vip-expedited',
  },
]

const PROCESS_STEPS = [
  { n: '01', title: 'Submit intake', desc: 'Tell us about your project. Upload any existing plans, photos, or survey documents.' },
  { n: '02', title: 'Architect assigned', desc: 'A licensed architect in your state is assigned within 1 business day.' },
  { n: '03', title: 'Drawing set prepared', desc: 'Your permit-ready drawing set is created, reviewed, and stamped.' },
  { n: '04', title: 'You review', desc: 'Review your drawings. Revisions are included within scope.' },
  { n: '05', title: 'Delivered + ready to file', desc: 'Receive your stamped drawing set. Optionally add Kealee Permit Filing.' },
]

export default function ArchitectVIPPage() {
  return (
    <div className="bg-white">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="py-20 md:py-28"
        style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #0F1D34 60%, #1A3B3B 100%)' }}
      >
        <Container width="lg">
          <div className="max-w-2xl">
            <div
              className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-5"
              style={{ backgroundColor: '#E8793A20', color: '#E8793A' }}
            >
              Architect VIP
            </div>
            <Heading as="h1" size="xl" color="white" className="mb-5">
              Permit-Ready Drawings from a Licensed Architect
            </Heading>
            <p className="text-lg text-gray-300 leading-relaxed mb-8">
              Stop waiting months to get stamped drawings. Kealee connects you with a licensed
              architect, coordinates the full process, and delivers a permit-ready drawing set
              in as little as 3 business days.
            </p>

            {/* Quick tier strip */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {TIERS.map((tier) => (
                <div
                  key={tier.key}
                  className="flex-1 rounded-xl p-4"
                  style={{
                    backgroundColor: tier.highlight ? 'rgba(232,121,58,0.12)' : 'rgba(255,255,255,0.06)',
                    border: tier.highlight ? '1.5px solid rgba(232,121,58,0.5)' : '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <p className="font-bold text-white">{tier.name}</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: '#E8793A' }}>{tier.price}</p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {tier.turnaround}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/contact?service=architect-vip"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#E8793A' }}
              >
                Start Your Project <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="#process"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 font-semibold border border-gray-500 text-gray-300 transition-colors hover:border-white hover:text-white"
              >
                See how it works
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Who it's for ─────────────────────────────────────────────────── */}
      <section className="py-14 bg-white border-b border-gray-100">
        <Container width="lg">
          <div className="max-w-3xl mx-auto text-center">
            <Heading as="h2" size="md" color="navy" className="mb-4">
              Built for projects that require stamped drawings
            </Heading>
            <p className="text-gray-600 leading-relaxed mb-8">
              Most residential additions, ADUs, structural changes, and new construction projects
              require a licensed architect&apos;s stamp before a permit can be filed. Kealee
              Architect VIP gives you a complete, permit-ready package — not just drawings.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              {['Additions & ADUs', 'Structural changes', 'New construction', 'Commercial TI'].map((use) => (
                <div key={use} className="rounded-lg border border-gray-200 px-4 py-3 font-medium text-gray-700">
                  {use}
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── What's included ──────────────────────────────────────────────── */}
      <section className="py-20" style={{ backgroundColor: '#F8FAFC' }}>
        <Container width="lg">
          <Heading as="h2" size="lg" color="navy" className="text-center mb-3">
            What&apos;s included
          </Heading>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            A complete permit-ready package — not just drawings
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            {DELIVERABLES.map((d) => (
              <div key={d.title} className="bg-white rounded-2xl border border-gray-100 p-6">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl mb-4"
                  style={{ backgroundColor: 'rgba(232,121,58,0.1)' }}
                >
                  <d.icon className="h-5 w-5" style={{ color: '#E8793A' }} />
                </div>
                <h3 className="font-bold text-base mb-1" style={{ color: '#1A2B4A' }}>{d.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{d.desc}</p>
                <ul className="space-y-1.5">
                  {d.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Process ──────────────────────────────────────────────────────── */}
      <section id="process" className="py-20 bg-white">
        <Container width="lg">
          <Heading as="h2" size="lg" color="navy" className="text-center mb-12">
            How it works
          </Heading>
          <div className="max-w-2xl mx-auto space-y-6">
            {PROCESS_STEPS.map((step) => (
              <div key={step.n} className="flex gap-5">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: '#1A2B4A' }}
                >
                  {step.n}
                </div>
                <div className="pt-1.5">
                  <p className="font-semibold" style={{ color: '#1A2B4A' }}>{step.title}</p>
                  <p className="mt-0.5 text-sm text-gray-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Tiers ────────────────────────────────────────────────────────── */}
      <section className="py-20" style={{ backgroundColor: '#F8FAFC' }}>
        <Container width="lg">
          <Heading as="h2" size="lg" color="navy" className="text-center mb-3">
            Choose your tier
          </Heading>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            Both tiers include a full permit-ready drawing set, licensed architect stamp, and Kealee coordination
          </p>

          <div className="grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
            {TIERS.map((tier) => (
              <div
                key={tier.key}
                className="bg-white rounded-2xl p-8 flex flex-col"
                style={{
                  border: tier.highlight ? '2px solid #E8793A' : '1px solid #E5E7EB',
                  boxShadow: tier.highlight ? '0 0 0 4px rgba(232,121,58,0.08)' : undefined,
                }}
              >
                {tier.highlight && (
                  <span
                    className="self-start rounded-full px-3 py-1 text-xs font-bold text-white mb-4"
                    style={{ backgroundColor: '#E8793A' }}
                  >
                    Fastest turnaround
                  </span>
                )}
                <h3 className="text-xl font-bold mb-1" style={{ color: '#1A2B4A' }}>{tier.name}</h3>
                <p className="text-3xl font-bold mb-1" style={{ color: '#E8793A' }}>{tier.price}</p>
                <p className="text-sm text-gray-400 mb-6 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {tier.turnaround}
                </p>
                <ul className="space-y-2 flex-1 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className="flex items-center justify-center gap-2 rounded-xl py-3 px-6 font-semibold text-sm transition-all hover:opacity-90"
                  style={{
                    backgroundColor: tier.highlight ? '#E8793A' : 'transparent',
                    color: tier.highlight ? '#FFFFFF' : '#E8793A',
                    border: tier.highlight ? 'none' : '2px solid #E8793A',
                  }}
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: '#1A2B4A' }}>
        <Container width="lg">
          <div className="text-center">
            <Heading as="h2" size="lg" color="white" className="mb-4">
              Ready to get your stamped drawings?
            </Heading>
            <p className="text-gray-300 mb-8 max-w-xl mx-auto">
              Tell us about your project. We&apos;ll assign a licensed architect and start immediately.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact?service=architect-vip"
                className="px-8 py-4 rounded-xl font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#E8793A' }}
              >
                Start Architect VIP
              </Link>
              <Link
                href="/permits"
                className="px-8 py-4 rounded-xl font-bold border-2 border-gray-500 text-gray-300 transition-colors hover:border-white hover:text-white"
              >
                View Permit Services
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  )
}
