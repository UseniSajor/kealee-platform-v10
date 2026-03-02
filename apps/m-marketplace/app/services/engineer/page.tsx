'use client'

import Link from 'next/link'
import './engineer.css'

const phases = [
  { id: 'design', label: 'Design' },
  { id: 'estimate', label: 'Estimate' },
  { id: 'permit', label: 'Permit' },
  { id: 'build', label: 'Build' },
  { id: 'closeout', label: 'Closeout' },
]

const phaseLinks: Record<string, string> = {
  design: '/services/design',
  estimate: '/services/estimation',
  permit: '/services/permits',
  build: '/services/ops',
  closeout: '/services/finance',
}

const disciplines = [
  {
    icon: '\ud83c\udfd7',
    title: 'Structural Engineering',
    desc: 'Load calculations, beam sizing, foundation design, and structural modifications. PE-stamped for permit approval.',
    services: ['Load-Bearing Wall Removal', 'Beam Design', 'Foundation Analysis', 'Seismic Evaluation'],
  },
  {
    icon: '\u26a1',
    title: 'Electrical Engineering',
    desc: 'Electrical system design, panel sizing, load calculations, and code-compliant layouts for residential and commercial.',
    services: ['Panel Upgrades', 'Load Calculations', 'Lighting Design', 'EV Charging'],
  },
  {
    icon: '\u2744\ufe0f',
    title: 'Mechanical (HVAC)',
    desc: 'HVAC system design, ductwork layout, Manual J calculations, and energy modeling for optimal comfort and efficiency.',
    services: ['HVAC Sizing', 'Duct Design', 'Ventilation', 'Energy Modeling'],
  },
  {
    icon: '\ud83d\udeb0',
    title: 'Plumbing Engineering',
    desc: 'Water supply, drainage design, fixture sizing calculations, and gas piping for residential and commercial projects.',
    services: ['Pipe Sizing', 'Drainage Design', 'Water Heater Sizing', 'Gas Piping'],
  },
  {
    icon: '\ud83c\udf0d',
    title: 'Civil Engineering',
    desc: 'Site grading, stormwater management, utility connections, and erosion control plans for permit compliance.',
    services: ['Grading Plans', 'Stormwater Design', 'Utility Design', 'Erosion Control'],
  },
  {
    icon: '\ud83d\udd25',
    title: 'Fire Protection',
    desc: 'Fire sprinkler design, egress analysis, fire alarm systems, and life safety plans for code compliance.',
    services: ['Sprinkler Design', 'Egress Analysis', 'Fire Alarm Layout', 'Code Review'],
  },
]

const pricing = [
  {
    service: 'Structural Letter',
    price: 'From $450',
    desc: 'Load-bearing analysis and beam letter for simple residential modifications.',
    turnaround: '3\u20135 business days',
  },
  {
    service: 'Structural Plans',
    price: 'From $1,500',
    desc: 'Full structural engineering drawings with PE stamp for permit submission.',
    turnaround: '1\u20132 weeks',
  },
  {
    service: 'MEP Design',
    price: 'From $2,000',
    desc: 'Mechanical, electrical, and plumbing engineering for residential or light commercial.',
    turnaround: '1\u20132 weeks',
  },
  {
    service: 'Civil / Site Plans',
    price: 'From $3,000',
    desc: 'Site grading, stormwater management, utility connections, and erosion control.',
    turnaround: '2\u20133 weeks',
  },
  {
    service: 'Full Engineering Package',
    price: 'From $5,000',
    desc: 'All engineering disciplines coordinated \u2014 structural, MEP, civil, fire protection as needed.',
    turnaround: '2\u20134 weeks',
    featured: true,
  },
  {
    service: 'Rush Service',
    price: '+50% Fee',
    desc: 'Expedited turnaround for any engineering service when your project can\u2019t wait.',
    turnaround: '50% faster',
  },
]

const ownerCards = [
  {
    icon: '\ud83c\udfe0',
    title: 'PE-Stamped Drawings',
    desc: 'Every engineering deliverable comes with a Professional Engineer stamp, ready for permit submission. No exceptions.',
  },
  {
    icon: '\u26a1',
    title: 'Fast Turnaround',
    desc: 'Structural letters in 3\u20135 days. Full packages in 2\u20134 weeks. Rush service available for time-sensitive projects.',
  },
  {
    icon: '\ud83d\udd17',
    title: 'Coordinated with Architecture',
    desc: 'If you used Kealee Design, engineering coordinates directly with your architectural drawings. No miscommunication.',
  },
  {
    icon: '\ud83d\udcb2',
    title: 'Clear, Fixed Pricing',
    desc: 'All quotes include PE stamp. No surprise fees, no hourly billing that spirals. You know the cost before you start.',
  },
  {
    icon: '\ud83d\udee1',
    title: 'Licensed & Insured',
    desc: 'All engineers on our network are licensed PEs with E&O insurance and verified credentials.',
  },
  {
    icon: '\ud83d\udce6',
    title: 'Seamless Handoff to Permits',
    desc: 'Engineering drawings auto-populate your permit applications in Kealee Permits. No re-uploading files.',
  },
]

export default function EngineerServicePage() {
  return (
    <div>
      {/* ── PHASE TABS ── */}
      <nav className="eng-phase-bar">
        {phases.map((p) => (
          <Link
            key={p.id}
            href={phaseLinks[p.id]}
            className={`eng-phase-tab ${p.id === 'design' ? 'active' : ''}`}
          >
            <span className="eng-phase-dot" />
            {p.label}
          </Link>
        ))}
      </nav>

      {/* ── HERO ── */}
      <section className="eng-hero">
        <div className="eng-hero-badge">
          <span className="eng-badge-dot" />
          PE-STAMPED &middot; 6 ENGINEERING DISCIPLINES
        </div>
        <div className="eng-hero-layout">
          <div>
            <h1>
              Engineering That<br />
              Gets <em>Approved</em>
            </h1>
            <p className="eng-hero-sub">
              Licensed professional engineers for structural, MEP, civil, and fire protection.
              PE-stamped drawings delivered fast, coordinated with your architecture, and ready
              for permit approval.
            </p>
            <div className="eng-hero-actions">
              <Link href="/contact" className="eng-btn-orange">
                Request a Quote
              </Link>
              <Link href="/contact" className="eng-btn-outline-white">
                Talk to an Engineer
              </Link>
            </div>
          </div>
          <div className="eng-hero-stats">
            <div className="eng-hero-stat-grid">
              <div className="eng-hero-stat">
                <div className="eng-hero-stat-num">6</div>
                <div className="eng-hero-stat-label">Engineering disciplines covered</div>
              </div>
              <div className="eng-hero-stat">
                <div className="eng-hero-stat-num">3 Days</div>
                <div className="eng-hero-stat-label">Structural letter turnaround</div>
              </div>
              <div className="eng-hero-stat">
                <div className="eng-hero-stat-num">PE</div>
                <div className="eng-hero-stat-label">Stamped on every deliverable</div>
              </div>
              <div className="eng-hero-stat">
                <div className="eng-hero-stat-num">24h</div>
                <div className="eng-hero-stat-label">Quote turnaround time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DISCIPLINES ── */}
      <section className="eng-section" style={{ background: 'var(--eng-cream)' }}>
        <div className="eng-section-label">Engineering Disciplines</div>
        <h2 className="eng-section-title">
          Every Discipline,<br />One Platform
        </h2>
        <p className="eng-section-sub">
          From structural letters to full MEP packages &mdash; our network of licensed
          professional engineers covers every discipline your project needs.
        </p>

        <div className="eng-disciplines-grid">
          {disciplines.map((d) => (
            <div className="eng-discipline-card" key={d.title}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{d.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--eng-navy)', marginBottom: 8 }}>
                {d.title}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--eng-gray-500)', marginBottom: 16 }}>
                {d.desc}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {d.services.map((s) => (
                  <span className="eng-service-chip" key={s}>{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST BANNER ── */}
      <div className="eng-trust-banner">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="eng-trust-icon">{'\ud83c\udfe0'}</div>
          <div className="eng-trust-title">PE Stamp Included</div>
          <div className="eng-trust-desc">
            Every engineering deliverable comes with a Professional Engineer stamp.
            Ready for permit submission. No additional fees for the stamp.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="eng-trust-icon">{'\ud83d\udd17'}</div>
          <div className="eng-trust-title">Coordinated Delivery</div>
          <div className="eng-trust-desc">
            Engineering coordinates directly with your architectural drawings.
            If you used Kealee Design, everything syncs automatically. Zero miscommunication.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="eng-trust-icon">{'\u26a1'}</div>
          <div className="eng-trust-title">Rush Available</div>
          <div className="eng-trust-desc">
            Need it fast? Rush service gets any engineering deliverable to you 50% faster.
            Because sometimes permits can&apos;t wait.
          </div>
        </div>
      </div>

      {/* ── PRICING ── */}
      <section className="eng-section">
        <div className="eng-section-label">Pricing</div>
        <h2 className="eng-section-title">Clear, Fixed Pricing</h2>
        <p className="eng-section-sub">
          All quotes include PE stamp. No surprise fees. Most quotes provided within 24 hours.
        </p>

        <div className="eng-pricing-grid">
          {pricing.map((item) => (
            <div
              className={`eng-pricing-card ${item.featured ? 'featured' : ''}`}
              key={item.service}
              style={{ position: 'relative' }}
            >
              {item.featured && <div className="eng-pricing-badge">BEST VALUE</div>}
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: item.featured ? 'var(--eng-orange-light)' : 'var(--eng-orange)', marginBottom: 10 }}>
                {item.turnaround}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: item.featured ? 'white' : 'var(--eng-navy)', marginBottom: 4 }}>
                {item.service}
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, color: item.featured ? 'var(--eng-orange-light)' : 'var(--eng-navy)', fontFamily: 'monospace', margin: '12px 0 8px' }}>
                {item.price}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: item.featured ? 'rgba(255,255,255,0.7)' : 'var(--eng-gray-500)' }}>
                {item.desc}
              </div>
              <Link
                href="/contact"
                style={{
                  display: 'block', width: '100%', padding: 12, borderRadius: 10,
                  fontSize: 14, fontWeight: 600, textAlign: 'center', cursor: 'pointer',
                  textDecoration: 'none', marginTop: 20, transition: 'all 0.2s', border: 'none',
                  background: item.featured ? 'var(--eng-orange)' : 'transparent',
                  color: item.featured ? 'white' : 'var(--eng-navy)',
                  ...(item.featured ? {} : { border: '1.5px solid var(--eng-navy)' }),
                }}
              >
                Request Quote
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY KEALEE ENGINEERING ── */}
      <section className="eng-section" style={{ background: 'var(--eng-cream)' }}>
        <div className="eng-section-label">Why Kealee Engineering</div>
        <h2 className="eng-section-title">
          Built for Projects That<br />Need to Move Fast
        </h2>
        <p className="eng-section-sub">
          Kealee Engineering isn&apos;t a marketplace of random freelancers &mdash; it&apos;s
          a coordinated network of licensed PEs who deliver fast, stamp everything, and
          integrate with your whole project.
        </p>
        <div className="eng-owner-grid">
          {ownerCards.map((card) => (
            <div className="eng-owner-card" key={card.title}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{card.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--eng-navy)', marginBottom: 8 }}>
                {card.title}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--eng-gray-500)' }}>
                {card.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="eng-cta-section">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 40, fontWeight: 700, color: 'white', lineHeight: 1.15, marginBottom: 16 }}>
            Need Engineering<br />
            <span style={{ color: 'var(--eng-orange-light)', fontStyle: 'italic' }}>
              That Gets Approved?
            </span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', marginBottom: 36, fontWeight: 300 }}>
            Get a quote within 24 hours. PE stamp included on every deliverable.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/contact" className="eng-btn-orange">
              Request a Quote
            </Link>
            <Link href="/contact" className="eng-btn-outline-white">
              Talk to an Engineer
            </Link>
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            Licensed PEs. E&O insured. Structural letters in as fast as 3 business days.
          </p>
        </div>
      </section>
    </div>
  )
}
