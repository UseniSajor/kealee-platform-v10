import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'All Services — Kealee Platform',
  description: 'AI design concepts, permit filing, design services, cost estimates, contractor matching, and project management — all in one platform.',
}

const SERVICES = [
  {
    tag: 'AI Design Engine',
    title: 'AI Concept & Design',
    description: 'Upload photos of your space. Get a concept floor plan, design brief, cost band, and permit scope in 24 hours. Staff-reviewed before delivery.',
    price: 'From $395',
    note: 'Pre-design concept only — not a permit-ready plan.',
    href: '/concept-engine',
    cta: 'Start your design',
    accent: '#E8793A',
    imgUrl: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=700&q=60&auto=format&fit=crop',
    tiers: [
      { name: 'Design + Validation', price: '$395', pop: true },
      { name: 'Advanced AI Concept — 3 options', price: '$695' },
      { name: 'Full Design Package', price: 'from $4,499' },
    ],
  },
  {
    tag: 'Permit Services',
    title: 'Permit Filing & Tracking',
    description: 'We know Montgomery DPS, Fairfax LDS, DC DOB, and every DMV agency. We file, track, respond to comments, and notify you when approved.',
    price: 'From $149',
    note: 'Requires existing plans or architectural documents.',
    href: '/permits',
    cta: 'View permit services',
    accent: '#2563EB',
    imgUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=700&q=60&auto=format&fit=crop',
    tiers: [
      { name: 'Permit Guidance', price: 'Free' },
      { name: 'Simple Permit Filing', price: '$149' },
      { name: 'Permit Package', price: '$950', pop: true },
      { name: 'Permit Coordination', price: '$2,750' },
    ],
  },
  {
    tag: 'Design Services',
    title: 'Architect-Stamped Plans',
    description: 'Licensed architects provide permit-ready construction drawings. Ideal after an AI concept, or if you need plans before permit filing.',
    price: 'From $895',
    note: 'Required before permit filing for most projects.',
    href: '/design-services',
    cta: 'Get permit-ready plans',
    accent: '#7C3AED',
    imgUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=700&q=60&auto=format&fit=crop',
    tiers: [
      { name: 'Design Starter', price: '$895' },
      { name: 'Design + Visualization', price: '$1,895', pop: true },
      { name: 'Full Pre-Design Package', price: 'from $3,995' },
    ],
  },
  {
    tag: 'Cost Estimation',
    title: 'Project Cost Estimates',
    description: 'AI-powered cost ranges based on real DMV project data. Certified estimates from licensed estimators for financing and bid review.',
    price: 'From $95',
    note: 'AI estimates are ranges — certified estimates are for financing.',
    href: '/estimate',
    cta: 'Get an estimate',
    accent: '#38A169',
    imgUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=700&q=60&auto=format&fit=crop',
    tiers: [
      { name: 'AI Design + Cost Estimate', price: '$395' },
      { name: 'Standalone Cost Estimate', price: '$95', pop: true },
      { name: 'Certified Estimate', price: '$595' },
    ],
  },
  {
    tag: 'Contractor Marketplace',
    title: 'Find Vetted Contractors',
    description: 'Browse GCs, builders, and specialty contractors screened for licensing, insurance, and project fit. Matched by trade and county.',
    price: 'Free to browse',
    note: 'Milestone payment protection included on all platform projects.',
    href: '/marketplace',
    cta: 'Browse contractors',
    accent: '#0891B2',
    imgUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=700&q=60&auto=format&fit=crop',
    tiers: [
      { name: 'Browse + Get Matched', price: 'Free' },
      { name: 'AI Concept + Contractor Match', price: '$395', pop: true },
      { name: 'Managed Bid Process', price: 'Included with PM' },
    ],
  },
  {
    tag: 'Project Management',
    title: 'PM Advisory & Oversight',
    description: 'Every milestone, document, and payment in one dashboard. Your contractor cannot receive funds until you approve the milestone.',
    price: 'From $950',
    note: 'Self-managed dashboard always free.',
    href: '/products/pm-advisory',
    cta: 'View PM services',
    accent: '#DC2626',
    imgUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=60&auto=format&fit=crop',
    tiers: [
      { name: 'Self-Managed Dashboard', price: 'Free' },
      { name: 'PM Advisory', price: '$950', pop: true },
      { name: 'PM Oversight', price: '$2,950' },
    ],
  },
  {
    tag: 'Milestone Payments',
    title: 'Protected Escrow Payments',
    description: 'Funds are held in escrow and released only when you approve each milestone. Every lien waiver, inspection photo, and pay app is logged.',
    price: 'Free with project',
    note: 'Available on all projects managed through Kealee.',
    href: '/milestone-pay',
    cta: 'How it works',
    accent: '#D97706',
    imgUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=700&q=60&auto=format&fit=crop',
    tiers: [
      { name: 'Milestone escrow', price: 'Included' },
      { name: 'Lien waiver tracking', price: 'Included' },
      { name: 'Dispute protection', price: 'Included' },
    ],
  },
]

const BUNDLES = [
  { name: 'Design + Permit Starter', desc: 'AI concept + simple permit filing', price: '$495', href: '/products/design-permit-starter' },
  { name: 'Concept + Estimate', desc: 'AI design + cost estimate in one package', price: '$449', href: '/products/concept-estimate' },
  { name: 'Permit + PM Advisory', desc: 'Permit filing + milestone payment oversight', price: '$1,799', href: '/products/permit-pm-advisory' },
  { name: 'Full Owner Package', desc: 'Concept, permit, PM, and contractor match', price: 'From $1,995', href: '/get-started' },
]

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #0F1D34 60%, #1A3B3B 100%)', padding: '80px 0 64px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(232,121,58,.18)', color: '#E8793A', borderRadius: 999, padding: '4px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
            Platform Services
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 20 }}>
            Everything your project needs.<br />One platform.
          </h1>
          <p style={{ fontSize: 18, color: '#9CA3AF', maxWidth: 560, margin: '0 auto 32px' }}>
            AI design concepts, permit filing, cost estimates, vetted contractors, and milestone payment protection — from first idea to final inspection.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/get-started" style={{ background: '#E8793A', color: '#fff', padding: '12px 28px', borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Get Started <ArrowRight size={16} />
            </Link>
            <Link href="/pricing" style={{ background: 'rgba(255,255,255,.1)', color: '#fff', padding: '12px 28px', borderRadius: 8, fontWeight: 600, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,.2)' }}>
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section style={{ background: '#F9FAFB', padding: '72px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#111827', marginBottom: 12 }}>All platform services</h2>
            <p style={{ color: '#6B7280', fontSize: 17 }}>Use what you need. Skip what you don't. Every service works standalone or together.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
            {SERVICES.map(svc => (
              <div key={svc.tag} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={svc.imgUrl} alt={svc.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                    <span style={{ background: svc.accent, color: '#fff', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {svc.tag}
                    </span>
                  </div>
                </div>
                <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{svc.title}</h3>
                    <span style={{ color: svc.accent, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', marginLeft: 8 }}>{svc.price}</span>
                  </div>
                  <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.6, marginBottom: 16, flex: 1 }}>{svc.description}</p>

                  <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 14, marginBottom: 16 }}>
                    {svc.tiers.map(t => (
                      <div key={t.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                        <span style={{ fontSize: 13, color: t.pop ? '#111827' : '#6B7280', fontWeight: t.pop ? 600 : 400 }}>
                          {t.name}{t.pop ? <span style={{ marginLeft: 6, background: svc.accent + '20', color: svc.accent, borderRadius: 999, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>Popular</span> : null}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{t.price}</span>
                      </div>
                    ))}
                  </div>

                  <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 14 }}>{svc.note}</p>

                  <Link href={svc.href} style={{ background: svc.accent, color: '#fff', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none', textAlign: 'center', display: 'block' }}>
                    {svc.cta} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bundle packages */}
      <section style={{ background: '#fff', padding: '72px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 800, color: '#111827', marginBottom: 10 }}>Bundle packages</h2>
            <p style={{ color: '#6B7280', fontSize: 16 }}>Common service combinations at a reduced rate.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {BUNDLES.map(b => (
              <Link key={b.name} href={b.href} style={{ display: 'block', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 22px', textDecoration: 'none', transition: 'box-shadow .2s' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{b.name}</div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>{b.desc}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#E8793A' }}>{b.price}</span>
                  <ArrowRight size={14} color="#9CA3AF" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#1A2B4A', padding: '64px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 800, color: '#fff', marginBottom: 12 }}>Not sure where to start?</h2>
        <p style={{ color: '#9CA3AF', fontSize: 17, marginBottom: 28, maxWidth: 520, margin: '0 auto 28px' }}>
          Answer a few questions and we'll recommend the right path for your project.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/get-started" style={{ background: '#E8793A', color: '#fff', padding: '14px 32px', borderRadius: 8, fontWeight: 700, fontSize: 16, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Get Started <ArrowRight size={16} />
          </Link>
          <Link href="/contact" style={{ background: 'transparent', color: '#fff', padding: '14px 32px', borderRadius: 8, fontWeight: 600, fontSize: 16, textDecoration: 'none', border: '1px solid rgba(255,255,255,.25)' }}>
            Talk to a human
          </Link>
        </div>
      </section>
    </>
  )
}
