import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Professional Permit Services | Kealee',
  description: 'Expert permit coordination for homeowners and contractors. Fast approvals, full code compliance, inspection coordination.',
}

const TIERS = [
  {
    name: 'Basic',
    price: '$99–$299',
    description: 'DIY with expert guidance',
    features: [
      'Permit requirements checklist',
      'Code summary overview',
      'Inspection schedule outline',
      'You submit the applications',
      'Email support',
    ],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Professional',
    price: '$349',
    description: 'We handle everything',
    features: [
      'Complete permit applications',
      'Full code compliance review',
      'We file with the building dept',
      'Inspection coordination',
      'Plan review follow-up',
      'Phone & email support',
    ],
    cta: 'Get Started',
    highlight: true,
  },
  {
    name: 'Premium',
    price: '$599',
    description: 'White-glove service',
    features: [
      'Everything in Professional',
      'Expedited processing',
      'Inspector relationship used',
      'Construction administration',
      'Inspection day presence',
      '90-day premium support',
    ],
    cta: 'Get Started',
    highlight: false,
  },
]

const STEPS = [
  {
    n: '1',
    title: 'Submit Your Plans',
    body: 'Upload floor plans and any existing design docs. Takes 5 minutes.',
  },
  {
    n: '2',
    title: 'We Analyze & Review',
    body: 'Our AI analyzes permits, codes, and zoning. A human permit expert reviews for accuracy and completeness.',
  },
  {
    n: '3',
    title: 'We File & Coordinate',
    body: 'We submit to the building department, track plan reviews, and schedule inspections.',
  },
  {
    n: '4',
    title: 'Approved & Ready',
    body: 'Permits approved. You receive your inspection schedule and can start construction.',
  },
]

export default function PermitsOnlyPage() {
  return (
    <main>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)', color: '#fff', padding: '80px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: 100, padding: '4px 16px', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>
            Permit Services
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.15, margin: '0 0 16px' }}>
            You have plans.<br />We'll navigate the permits.
          </h1>
          <p style={{ fontSize: 18, opacity: 0.85, margin: '0 0 36px', maxWidth: 540, marginLeft: 'auto', marginRight: 'auto' }}>
            Already working with a designer or contractor? Get permits approved faster with our expert coordination.
          </p>
          <Link
            href="/permits-only/intake"
            style={{ display: 'inline-block', background: '#fff', color: '#15803d', fontWeight: 700, fontSize: 16, padding: '14px 36px', borderRadius: 12, textDecoration: 'none' }}
          >
            Start Your Application →
          </Link>
        </div>
      </section>

      {/* Why Kealee */}
      <section style={{ padding: '72px 24px', background: '#f0fdf4' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, textAlign: 'center', margin: '0 0 48px', color: '#14532d' }}>Why Kealee Permits?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
            {[
              { icon: '⚡', title: 'Faster Approvals', body: 'Our relationships with building departments mean fewer rejections and faster review cycles. Average approval: 2–3 weeks.' },
              { icon: '🎯', title: 'Code Compliant', body: 'Every application reviewed by permit experts before submission. No surprises, no rejections.' },
              { icon: '📋', title: 'Full Coordination', body: 'We handle inspections, follow-ups, and all communication with building departments.' },
            ].map(f => (
              <div key={f.title} style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#14532d' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6, margin: 0 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '72px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, textAlign: 'center', margin: '0 0 12px', color: '#111' }}>Choose Your Service</h2>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 48, fontSize: 15 }}>All tiers include AI-powered roadmap generation with human specialist review before submission.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {TIERS.map(t => (
              <div
                key={t.name}
                style={{
                  border: t.highlight ? '2px solid #16a34a' : '1px solid #e5e7eb',
                  borderRadius: 20,
                  padding: 32,
                  position: 'relative',
                  background: t.highlight ? '#f0fdf4' : '#fff',
                }}
              >
                {t.highlight && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 16px', borderRadius: 100 }}>
                    Most Popular
                  </div>
                )}
                <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: '#111' }}>{t.name}</h3>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>{t.description}</p>
                <p style={{ fontSize: 36, fontWeight: 800, color: '#16a34a', margin: '0 0 20px' }}>{t.price}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {t.features.map(f => (
                    <li key={f} style={{ fontSize: 14, color: '#374151', display: 'flex', gap: 8 }}>
                      <span style={{ color: '#16a34a', flexShrink: 0 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/permits-only/intake?tier=${t.name.toLowerCase()}`}
                  style={{
                    display: 'block', textAlign: 'center', padding: '12px 0', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none',
                    background: t.highlight ? '#16a34a' : 'transparent',
                    color: t.highlight ? '#fff' : '#16a34a',
                    border: t.highlight ? 'none' : '2px solid #16a34a',
                  }}
                >
                  {t.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section style={{ padding: '72px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, textAlign: 'center', margin: '0 0 48px', color: '#111' }}>How It Works</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {STEPS.map(s => (
              <div key={s.n} style={{ display: 'flex', gap: 20 }}>
                <div style={{ width: 48, height: 48, flexShrink: 0, background: '#16a34a', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>
                  {s.n}
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px', color: '#111' }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.65 }}>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '72px 24px', background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)', color: '#fff', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 12px' }}>Ready to Get Your Permits?</h2>
        <p style={{ fontSize: 16, opacity: 0.85, margin: '0 0 32px' }}>
          Join homeowners and contractors who get permits approved faster with Kealee.
        </p>
        <Link
          href="/permits-only/intake"
          style={{ display: 'inline-block', background: '#fff', color: '#15803d', fontWeight: 700, fontSize: 16, padding: '14px 36px', borderRadius: 12, textDecoration: 'none' }}
        >
          Start Your Permit Application
        </Link>
      </section>
    </main>
  )
}
