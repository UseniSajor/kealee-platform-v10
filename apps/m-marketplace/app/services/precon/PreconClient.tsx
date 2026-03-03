'use client'

import Link from 'next/link'
import './precon.css'

const processSteps = [
  { num: 1, title: 'Design Intake', desc: 'Submit your project requirements \u2014 photos, measurements, wishlist. Our team reviews and prepares a tailored design brief.', deliverables: ['Project Questionnaire', 'Site Analysis', 'Budget Alignment'] },
  { num: 2, title: 'Concept Development', desc: 'Work with our design team to develop initial concepts. Choose from 2\u20134 options, then refine your preferred direction.', deliverables: ['2D Floor Plans', 'Design Revisions', 'Material Selections'] },
  { num: 3, title: 'SRP Generation', desc: 'We generate a detailed Scope of Requirements Package \u2014 trade specs, material schedules, and quality standards for accurate bidding.', deliverables: ['Trade Specifications', 'Material Schedules', 'Quality Standards'] },
  { num: 4, title: 'Contractor Matching', desc: 'Your SRP is sent to verified contractors from our network. Every contractor is license-verified, insured, and reviewed.', deliverables: ['Verified Contractors', 'License Verification', 'Insurance Validation'] },
  { num: 5, title: 'Bid Collection', desc: 'Receive standardized bids with clear pricing breakdowns. Side-by-side comparison makes it easy to evaluate options.', deliverables: ['Standardized Bids', 'Side-by-Side Comparison', 'Direct Messaging'] },
  { num: 6, title: 'Contract & Escrow', desc: 'Award the contract and set up escrow-backed milestone payments. Your money is protected until work is approved.', deliverables: ['Contract Generation', 'Escrow Setup', 'Payment Schedule'] },
]

const packages = [
  {
    name: 'Basic',
    price: '$199',
    desc: 'Simple projects with standard scope.',
    turnaround: '5\u20137 business days',
    features: ['2 design concepts', '2 revision rounds', 'Floor plans', 'Basic SRP', 'Contractor matching'],
  },
  {
    name: 'Standard',
    price: '$499',
    desc: 'Full design and bidding package.',
    turnaround: '1\u20132 weeks',
    featured: true,
    features: ['4 design concepts', '4 revision rounds', 'Floor plans + elevations', 'Detailed SRP', 'Material board', 'Priority matching'],
  },
  {
    name: 'Premium',
    price: '$999',
    desc: 'Maximum flexibility and dedicated support.',
    turnaround: '2\u20133 weeks',
    features: ['Unlimited concepts', 'Unlimited revisions', 'Full drawing set', 'Comprehensive SRP', '3D renderings', 'Dedicated designer'],
  },
]

const ownerCards = [
  { icon: '\ud83c\udfaf', title: 'One Workflow', desc: 'From design intake to contractor award \u2014 one connected workflow. No juggling multiple platforms or spreadsheets.' },
  { icon: '\ud83d\udcb2', title: 'Clear Pricing Upfront', desc: 'Standardized bids based on your SRP mean you compare apples to apples. No hidden costs or surprise line items.' },
  { icon: '\u2705', title: 'Verified Contractors', desc: 'Every contractor is license-verified, insurance-checked, and background-screened. Real reviews from real project owners.' },
  { icon: '\ud83d\udd12', title: 'Escrow Protection', desc: 'All payments flow through FDIC-insured escrow. Milestone-based releases. You control every dollar.' },
  { icon: '\u26a1', title: 'Fast Turnaround', desc: 'Basic packages in 5\u20137 days. Premium in 2\u20133 weeks. Design, SRP, and contractor matching all included.' },
  { icon: '\ud83d\udce6', title: 'Seamless Handoff', desc: 'When you award the contract, everything transfers to Kealee PM Software. Schedule, milestones, and payments \u2014 ready to go.' },
]

export default function PreconClient() {
  return (
    <div>
      {/* ── HERO ── */}
      <section className="pre-hero">
        <div className="pre-hero-badge">
          <span className="pre-badge-dot" />
          DESIGN TO CONTRACT &middot; ESCROW BACKED
        </div>
        <div className="pre-hero-layout">
          <div>
            <h1>
              Pre-Construction<br />
              <em>Simplified</em>
            </h1>
            <p className="pre-hero-sub">
              From initial design to contractor award &mdash; with verified contractors,
              standardized bids, and escrow-backed payments. Start your project right
              with clear pricing from day one.
            </p>
            <div className="pre-hero-actions">
              <Link href="/contact" className="pre-btn-emerald">
                Start Your Project
              </Link>
              <Link href="/contact" className="pre-btn-outline-white">
                See How It Works
              </Link>
            </div>
          </div>
          <div className="pre-hero-stats">
            <div className="pre-hero-stat-grid">
              <div className="pre-hero-stat">
                <div className="pre-hero-stat-num">6</div>
                <div className="pre-hero-stat-label">Steps from design to contract</div>
              </div>
              <div className="pre-hero-stat">
                <div className="pre-hero-stat-num">$199</div>
                <div className="pre-hero-stat-label">Starting price for basic package</div>
              </div>
              <div className="pre-hero-stat">
                <div className="pre-hero-stat-num">5K+</div>
                <div className="pre-hero-stat-label">Verified contractors in network</div>
              </div>
              <div className="pre-hero-stat">
                <div className="pre-hero-stat-num">FDIC</div>
                <div className="pre-hero-stat-label">Insured escrow on every contract</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="pre-section" style={{ background: 'var(--pre-cream)' }}>
        <div className="pre-section-label">The Pre-Con Process</div>
        <h2 className="pre-section-title">
          Six Steps From Design<br />to Contractor Award
        </h2>
        <p className="pre-section-sub">
          A structured workflow that takes your project from initial requirements through
          design, bidding, and contract award &mdash; with escrow protection built in.
        </p>

        <div className="pre-process-grid">
          {processSteps.map((step) => (
            <div className="pre-process-card" key={step.num}>
              <div className="pre-process-num">{step.num}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--pre-navy)', marginBottom: 8 }}>
                {step.title}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--pre-gray-500)', marginBottom: 16 }}>
                {step.desc}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {step.deliverables.map((d) => (
                  <span className="pre-deliverable-chip" key={d}>{d}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST BANNER ── */}
      <div className="pre-trust-banner">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="pre-trust-icon">{'\ud83d\udccb'}</div>
          <div className="pre-trust-title">Standardized SRP</div>
          <div className="pre-trust-desc">
            Your Scope of Requirements Package ensures every contractor bids on the same
            specifications. No confusion, no scope creep.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="pre-trust-icon">{'\u2705'}</div>
          <div className="pre-trust-title">Verified Contractors</div>
          <div className="pre-trust-desc">
            Every contractor is license-verified, insurance-checked, and reviewed by real
            project owners. No unvetted strangers.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="pre-trust-icon">{'\ud83d\udd12'}</div>
          <div className="pre-trust-title">Escrow Protected</div>
          <div className="pre-trust-desc">
            When you award the contract, payments flow through FDIC-insured escrow.
            Milestone-based releases. You control every dollar.
          </div>
        </div>
      </div>

      {/* ── PACKAGES ── */}
      <section className="pre-section">
        <div className="pre-section-label">Design Packages</div>
        <h2 className="pre-section-title">Choose Your Package</h2>
        <p className="pre-section-sub">
          All packages include SRP generation and contractor matching. Choose the design
          depth that fits your project.
        </p>

        <div className="pre-pricing-grid">
          {packages.map((pkg) => (
            <div
              className={`pre-pricing-card ${pkg.featured ? 'featured' : ''}`}
              key={pkg.name}
              style={{ position: 'relative' }}
            >
              {pkg.featured && <div className="pre-pricing-badge">RECOMMENDED</div>}
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: pkg.featured ? 'var(--pre-emerald-light)' : 'var(--pre-emerald)', marginBottom: 10 }}>
                {pkg.turnaround}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: pkg.featured ? 'white' : 'var(--pre-navy)', marginBottom: 4 }}>
                {pkg.name}
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, color: pkg.featured ? 'var(--pre-emerald-light)' : 'var(--pre-navy)', fontFamily: 'monospace', margin: '12px 0 8px' }}>
                {pkg.price}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: pkg.featured ? 'rgba(255,255,255,0.7)' : 'var(--pre-gray-500)', marginBottom: 16 }}>
                {pkg.desc}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {pkg.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: pkg.featured ? 'rgba(255,255,255,0.85)' : 'var(--pre-gray-700)' }}>
                    <span style={{ color: pkg.featured ? 'var(--pre-emerald-light)' : 'var(--pre-emerald)', fontWeight: 700 }}>{'\u2713'}</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                style={{
                  display: 'block', width: '100%', padding: 12, borderRadius: 10,
                  fontSize: 14, fontWeight: 600, textAlign: 'center', cursor: 'pointer',
                  textDecoration: 'none', transition: 'all 0.2s', border: 'none',
                  background: pkg.featured ? 'var(--pre-emerald)' : 'transparent',
                  color: pkg.featured ? 'white' : 'var(--pre-navy)',
                  ...(pkg.featured ? {} : { border: '1.5px solid var(--pre-navy)' }),
                }}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY KEALEE PRECON ── */}
      <section className="pre-section" style={{ background: 'var(--pre-cream)' }}>
        <div className="pre-section-label">Why Kealee Pre-Con</div>
        <h2 className="pre-section-title">
          Start Your Project<br />the Right Way
        </h2>
        <p className="pre-section-sub">
          Kealee Pre-Con isn&apos;t a matchmaker &mdash; it&apos;s a structured workflow
          that ensures your project starts with clear scope, verified contractors,
          and protected payments.
        </p>
        <div className="pre-owner-grid">
          {ownerCards.map((card) => (
            <div className="pre-owner-card" key={card.title}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{card.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--pre-navy)', marginBottom: 8 }}>
                {card.title}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--pre-gray-500)' }}>
                {card.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pre-cta-section">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 40, fontWeight: 700, color: 'white', lineHeight: 1.15, marginBottom: 16 }}>
            Ready to Start<br />
            <span style={{ color: 'var(--pre-emerald-light)', fontStyle: 'italic' }}>
              Your Project Right?
            </span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', marginBottom: 36, fontWeight: 300 }}>
            Design, SRP, contractor matching, and escrow &mdash; from $199.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/contact" className="pre-btn-emerald">
              Start Your Project
            </Link>
            <Link href="/contact" className="pre-btn-outline-white">
              See Packages
            </Link>
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            Escrow-backed contracts. Verified contractors. Clear pricing from day one.
          </p>
        </div>
      </section>
    </div>
  )
}
