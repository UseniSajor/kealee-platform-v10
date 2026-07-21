'use client'

import Link from 'next/link'
import './network.css'

const forOwners = [
  { title: 'Verified Contractors', desc: 'Every contractor is license-verified, insurance-checked, and reviewed by real project owners.' },
  { title: 'Competitive Bids', desc: 'Post your project and receive standardized bids from qualified contractors. Easy side-by-side comparison.' },
  { title: 'Escrow Protection', desc: 'Pay through Kealee Finance with milestone-based escrow. Your money is protected until work is approved.' },
  { title: 'Project Tracking', desc: 'Track progress, communicate with contractors, and manage payments \u2014 all in one platform.' },
]

const forContractors = [
  { title: 'Quality Leads', desc: 'Get matched with serious project owners who are ready to hire. No tire-kickers, no wasted time.' },
  { title: 'Build Your Profile', desc: 'Showcase your work, certifications, reviews, and project history. Stand out from the competition.' },
  { title: 'Guaranteed Payment', desc: 'Escrow-backed milestone payments mean you get paid for approved work. No more chasing checks.' },
  { title: 'Grow Your Business', desc: 'Access tools to manage bids, contracts, and client communication. Scale without more overhead.' },
]

const subscriptions = [
  {
    name: 'Basic Listing',
    price: '$299/mo',
    desc: 'Get found and start receiving leads.',
    features: ['Profile listing', '5 leads per month', 'Basic analytics', 'Email support', 'Standard placement'],
  },
  {
    name: 'Pro Listing',
    price: '$599/mo',
    desc: 'Priority matching and featured placement.',
    featured: true,
    features: ['Featured profile', '15 leads per month', 'Priority matching', 'Advanced analytics', 'Phone support', 'Badge of distinction'],
  },
  {
    name: 'Enterprise',
    price: '$999/mo',
    desc: 'Maximum visibility and dedicated support.',
    features: ['Premium placement', 'Unlimited leads', 'Dedicated account manager', 'Custom branding', 'API access', 'Multi-location support'],
  },
]

const leadPricing = [
  { size: 'Under $25K', price: '$50' },
  { size: '$25K \u2013 $75K', price: '$150' },
  { size: '$75K \u2013 $250K', price: '$300' },
  { size: 'Over $250K', price: '$500' },
]

const ownerCards = [
  { icon: '\u2705', title: 'Verified Network', desc: 'Every contractor is license-verified, insurance-checked, and background-screened before joining the network.' },
  { icon: '\ud83d\udcb0', title: 'Fair Pricing', desc: 'Standardized bid format means you compare apples to apples. No hidden costs, no surprise line items.' },
  { icon: '\ud83d\udd12', title: 'Payment Protection', desc: 'All payments flow through Kealee Finance escrow. Milestone-based releases. FDIC insured up to $250,000.' },
  { icon: '\u2b50', title: 'Ratings & Reviews', desc: 'Real reviews from real project owners. Detailed ratings on quality, communication, timeline, and budget adherence.' },
  { icon: '\u26a1', title: '48-Hour Response', desc: 'Contractors on the network commit to a 48-hour response SLA. No ghosting, no weeks of waiting.' },
  { icon: '\ud83d\udcca', title: 'Performance Tracking', desc: 'Track contractor performance across projects. On-time delivery, budget adherence, and quality scores.' },
]

export default function NetworkClient() {
  return (
    <div>
      {/* ── HERO ── */}
      <section className="net-hero">
        <div className="net-hero-badge">
          <span className="net-badge-dot" />
          VERIFIED CONTRACTORS &middot; ESCROW PROTECTED
        </div>
        <div className="net-hero-layout">
          <div>
            <h1>
              The Right Contractor,<br />
              <em>Every Time</em>
            </h1>
            <p className="net-hero-sub">
              A verified network of licensed contractors matched to your project. Standardized
              bids, escrow-backed payments, and real reviews from real project owners.
            </p>
            <div className="net-hero-actions">
              <Link href="/contact" className="net-btn-blue">
                Find Contractors
              </Link>
              <Link href="/contact" className="net-btn-outline-white">
                Join as Contractor
              </Link>
            </div>
          </div>
          <div className="net-hero-stats">
            <div className="net-hero-stat-grid">
              <div className="net-hero-stat">
                <div className="net-hero-stat-num">5K+</div>
                <div className="net-hero-stat-label">Verified contractors</div>
              </div>
              <div className="net-hero-stat">
                <div className="net-hero-stat-num">$250M+</div>
                <div className="net-hero-stat-label">Projects completed</div>
              </div>
              <div className="net-hero-stat">
                <div className="net-hero-stat-num">4.8</div>
                <div className="net-hero-stat-label">Average contractor rating</div>
              </div>
              <div className="net-hero-stat">
                <div className="net-hero-stat-num">48h</div>
                <div className="net-hero-stat-label">Average response time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR OWNERS / FOR CONTRACTORS ── */}
      <section className="net-section" style={{ background: 'var(--net-cream)' }}>
        <div className="net-section-label">Two Sides, One Platform</div>
        <h2 className="net-section-title">
          Built for Owners<br />and Contractors
        </h2>
        <p className="net-section-sub">
          Whether you are hiring or looking for work, the Kealee Network connects both
          sides with verification, standardized bids, and payment protection.
        </p>

        <div className="net-split-grid">
          <div className="net-split-card">
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--net-blue)', marginBottom: 20 }}>
              For Project Owners
            </div>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {forOwners.map((item) => (
                <li key={item.title}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--net-navy)', marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--net-gray-500)' }}>{item.desc}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="net-split-card">
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--net-blue)', marginBottom: 20 }}>
              For Contractors
            </div>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {forContractors.map((item) => (
                <li key={item.title}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--net-navy)', marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--net-gray-500)' }}>{item.desc}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── TRUST BANNER ── */}
      <div className="net-trust-banner">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="net-trust-icon">{'\u2705'}</div>
          <div className="net-trust-title">Triple Verified</div>
          <div className="net-trust-desc">
            Every contractor is license-verified, insurance-checked, and background-screened.
            We verify credentials annually.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="net-trust-icon">{'\ud83d\udd12'}</div>
          <div className="net-trust-title">Escrow Protected</div>
          <div className="net-trust-desc">
            All payments flow through Kealee Finance escrow. Owners release funds only
            when milestones are approved. FDIC insured.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="net-trust-icon">{'\u2b50'}</div>
          <div className="net-trust-title">Real Reviews</div>
          <div className="net-trust-desc">
            Every review is from a verified project owner. Detailed ratings on quality,
            communication, timeline adherence, and budget accuracy.
          </div>
        </div>
      </div>

      {/* ── SUBSCRIPTIONS ── */}
      <section className="net-section">
        <div className="net-section-label">Contractor Subscriptions</div>
        <h2 className="net-section-title">Grow Your Business</h2>
        <p className="net-section-sub">
          Choose a plan that fits your business. All plans include profile features,
          bid management, and payment processing.
        </p>

        <div className="net-pricing-grid">
          {subscriptions.map((plan) => (
            <div
              className={`net-pricing-card ${plan.featured ? 'featured' : ''}`}
              key={plan.name}
              style={{ position: 'relative' }}
            >
              {plan.featured && <div className="net-pricing-badge">MOST POPULAR</div>}
              <div style={{ fontSize: 20, fontWeight: 700, color: plan.featured ? 'white' : 'var(--net-navy)', marginBottom: 4 }}>
                {plan.name}
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, color: plan.featured ? 'var(--net-blue-light)' : 'var(--net-navy)', fontFamily: 'monospace', margin: '12px 0 8px' }}>
                {plan.price}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: plan.featured ? 'rgba(255,255,255,0.7)' : 'var(--net-gray-500)', marginBottom: 16 }}>
                {plan.desc}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: plan.featured ? 'rgba(255,255,255,0.85)' : 'var(--net-gray-700)' }}>
                    <span style={{ color: plan.featured ? 'var(--net-blue-light)' : 'var(--net-blue)', fontWeight: 700 }}>{'\u2713'}</span>
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
                  background: plan.featured ? 'var(--net-blue)' : 'transparent',
                  color: plan.featured ? 'white' : 'var(--net-navy)',
                  ...(plan.featured ? {} : { border: '1.5px solid var(--net-navy)' }),
                }}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── PAY PER LEAD ── */}
      <section className="net-section" style={{ background: 'var(--net-cream)' }}>
        <div className="net-section-label">Pay Per Lead</div>
        <h2 className="net-section-title">No Subscription? No Problem.</h2>
        <p className="net-section-sub">
          Only pay for leads you are interested in. No subscription required, no minimums.
          Lead pricing based on project size.
        </p>
        <div className="net-lead-grid">
          {leadPricing.map((item) => (
            <div className="net-lead-card" key={item.size}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--net-blue)', fontFamily: 'monospace', marginBottom: 6 }}>
                {item.price}
              </div>
              <div style={{ fontSize: 13, color: 'var(--net-gray-500)', fontWeight: 500 }}>
                {item.size}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY KEALEE NETWORK ── */}
      <section className="net-section">
        <div className="net-section-label">Why Kealee Network</div>
        <h2 className="net-section-title">
          Trust Built Into<br />Every Connection
        </h2>
        <p className="net-section-sub">
          The Kealee Network isn&apos;t a directory of names &mdash; it&apos;s a verified,
          performance-tracked marketplace with payment protection built in.
        </p>
        <div className="net-owner-grid">
          {ownerCards.map((card) => (
            <div className="net-owner-card" key={card.title}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{card.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--net-navy)', marginBottom: 8 }}>
                {card.title}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--net-gray-500)' }}>
                {card.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="net-cta-section">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 40, fontWeight: 700, color: 'white', lineHeight: 1.15, marginBottom: 16 }}>
            Ready to Find the<br />
            <span style={{ color: 'var(--net-blue-light)', fontStyle: 'italic' }}>
              Right Contractor?
            </span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', marginBottom: 36, fontWeight: 300 }}>
            Post your project and receive verified bids. Or join as a contractor and grow your business.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/contact" className="net-btn-blue">
              Find Contractors
            </Link>
            <Link href="/contact" className="net-btn-outline-white">
              Join as Contractor
            </Link>
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            5,000+ verified contractors. Escrow-protected payments. 48-hour response SLA.
          </p>
        </div>
      </section>
    </div>
  )
}
