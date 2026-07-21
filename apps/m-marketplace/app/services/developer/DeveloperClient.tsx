'use client'

import Link from 'next/link'
import './developer.css'

const phases = [
  {
    num: '01',
    title: 'Concept & Feasibility',
    desc: 'Site analysis, market research, preliminary pro forma, and go/no-go recommendation. Know if your deal works before you commit capital.',
    deliverables: ['Market Study', 'Site Constraints', 'Preliminary Budget', 'Financial Model', 'Go/No-Go Report'],
  },
  {
    num: '02',
    title: 'Pre-Development',
    desc: 'Entitlements, design coordination, financing strategy, and contractor selection. Everything needed to break ground with confidence.',
    deliverables: ['Entitlement Package', 'Design Documents', 'Financing Plan', 'GC Bid Packages', 'Pro Forma Refinement'],
  },
  {
    num: '03',
    title: 'Construction Oversight',
    desc: 'Manage GC, track budget, maintain schedule, and provide investor reporting. Professional oversight from groundbreaking to CO.',
    deliverables: ['Monthly Draw Reports', 'Schedule Updates', 'Budget Tracking', 'Investor Updates', 'Quality Reviews'],
  },
  {
    num: '04',
    title: 'Closeout & Delivery',
    desc: 'Punch list management, certificate of occupancy, lease-up or sales support, and final accounting for a clean asset transition.',
    deliverables: ['Punch List Tracking', 'Warranty Management', 'Final Accounting', 'Asset Transition', 'Post-Occupancy'],
  },
]

const projectTypes = [
  'Multi-Family Residential', 'Mixed-Use Development', 'Commercial Office', 'Retail & Hospitality',
  'Townhome Communities', 'Build-to-Rent', 'Adaptive Reuse', 'Land Development',
  'Senior Living', 'Student Housing', 'Affordable Housing', 'Industrial & Warehouse',
]

const packages = [
  {
    name: 'Feasibility Only',
    price: 'From $2,500',
    desc: 'Go/no-go analysis before you commit capital.',
    turnaround: '1\u20132 weeks',
    features: ['Site evaluation', 'Market research', 'Preliminary pro forma', 'Recommendation report', 'Presentation deck'],
  },
  {
    name: 'Pre-Development',
    price: 'From $7,500/mo',
    desc: 'Through entitlement, permitting, and GC selection.',
    turnaround: 'Ongoing monthly',
    featured: true,
    features: ['Everything in Feasibility', 'Entitlement management', 'Design coordination', 'Financing support', 'GC selection', 'Dedicated dev manager'],
  },
  {
    name: 'Full Development',
    price: 'Custom',
    desc: 'Concept to closeout \u2014 full lifecycle management.',
    turnaround: 'Project duration',
    features: ['Everything in Pre-Dev', 'Construction oversight', 'Budget management', 'Investor reporting', 'Lease-up support', 'Asset transition'],
  },
]

const ownerCards = [
  { icon: '\ud83d\udcca', title: 'Data-Driven Decisions', desc: 'Every recommendation backed by market data, comparable analysis, and financial modeling. No guesswork.' },
  { icon: '\ud83d\udcb0', title: 'Protect Your Capital', desc: 'Feasibility studies prevent bad deals. Budget tracking prevents overruns. Escrow protects payments.' },
  { icon: '\ud83d\udcc8', title: 'Investor-Ready Reporting', desc: 'Monthly reports formatted for LP updates. Draw summaries, schedule status, budget variance \u2014 all automated.' },
  { icon: '\ud83e\udd1d', title: 'Coordinated Team', desc: 'Architecture, engineering, permits, and construction \u2014 all coordinated through the Kealee platform. One point of contact.' },
  { icon: '\u26a1', title: 'Speed to Market', desc: 'Parallel-track entitlements, design, and financing. Reduce pre-development timelines by 30\u201340%.' },
  { icon: '\ud83d\udee1', title: 'Risk Mitigation', desc: 'Every milestone gated with reviews. Budget contingencies built in. Escrow-backed contractor payments.' },
]

export default function DeveloperClient() {
  return (
    <div>
      {/* ── HERO ── */}
      <section className="dev-hero">
        <div className="dev-hero-badge">
          <span className="dev-badge-dot" />
          FEASIBILITY TO CLOSEOUT &middot; FULL LIFECYCLE
        </div>
        <div className="dev-hero-layout">
          <div>
            <h1>
              Development<br />
              <em>Done Right</em>
            </h1>
            <p className="dev-hero-sub">
              End-to-end real estate development support &mdash; from feasibility studies
              and pro forma modeling through construction oversight and asset delivery.
              Protect your capital at every milestone.
            </p>
            <div className="dev-hero-actions">
              <Link href="/contact" className="dev-btn-violet">
                Schedule Consultation
              </Link>
              <Link href="/contact" className="dev-btn-outline-white">
                Request Feasibility Study
              </Link>
            </div>
          </div>
          <div className="dev-hero-stats">
            <div className="dev-hero-stat-grid">
              <div className="dev-hero-stat">
                <div className="dev-hero-stat-num">$50M+</div>
                <div className="dev-hero-stat-label">Projects under management</div>
              </div>
              <div className="dev-hero-stat">
                <div className="dev-hero-stat-num">4</div>
                <div className="dev-hero-stat-label">Development phases covered</div>
              </div>
              <div className="dev-hero-stat">
                <div className="dev-hero-stat-num">30%</div>
                <div className="dev-hero-stat-label">Faster pre-development</div>
              </div>
              <div className="dev-hero-stat">
                <div className="dev-hero-stat-num">1 Wk</div>
                <div className="dev-hero-stat-label">Feasibility turnaround</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEVELOPMENT PHASES ── */}
      <section className="dev-section" style={{ background: 'var(--dev-cream)' }}>
        <div className="dev-section-label">Development Phases</div>
        <h2 className="dev-section-title">
          Four Phases,<br />One Platform
        </h2>
        <p className="dev-section-sub">
          From initial feasibility through asset delivery &mdash; every phase managed,
          tracked, and reported through the Kealee platform.
        </p>

        <div className="dev-phases-grid">
          {phases.map((phase) => (
            <div className="dev-phase-card" key={phase.num}>
              <div className="dev-phase-num">{phase.num}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--dev-navy)', marginBottom: 10 }}>
                {phase.title}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--dev-gray-500)', marginBottom: 16 }}>
                {phase.desc}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {phase.deliverables.map((d) => (
                  <span className="dev-deliverable-chip" key={d}>{d}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST BANNER ── */}
      <div className="dev-trust-banner">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="dev-trust-icon">{'\ud83d\udcca'}</div>
          <div className="dev-trust-title">Data-Driven</div>
          <div className="dev-trust-desc">
            Every recommendation backed by market data, comparable sales, and financial
            modeling. Go/no-go decisions grounded in numbers, not gut feel.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="dev-trust-icon">{'\ud83d\udee1'}</div>
          <div className="dev-trust-title">Capital Protected</div>
          <div className="dev-trust-desc">
            Escrow-backed contractor payments, budget contingencies, and milestone-gated
            approvals. Your capital is protected at every step.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="dev-trust-icon">{'\ud83d\udcc8'}</div>
          <div className="dev-trust-title">Investor Ready</div>
          <div className="dev-trust-desc">
            Monthly investor reports, draw summaries, and schedule updates. Professional
            reporting that keeps your LPs informed and confident.
          </div>
        </div>
      </div>

      {/* ── PROJECT TYPES ── */}
      <section className="dev-section">
        <div className="dev-section-label">Project Types</div>
        <h2 className="dev-section-title">Every Asset Class</h2>
        <p className="dev-section-sub">
          From townhome communities to mixed-use developments &mdash; our team has
          experience across every major asset class and project type.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {projectTypes.map((t) => (
            <span className="dev-type-chip" key={t}>{t}</span>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="dev-section" style={{ background: 'var(--dev-cream)' }}>
        <div className="dev-section-label">Engagement Models</div>
        <h2 className="dev-section-title">Flexible Pricing</h2>
        <p className="dev-section-sub">
          From a single feasibility study to full development management. Choose the
          engagement model that fits your project.
        </p>

        <div className="dev-pricing-grid">
          {packages.map((pkg) => (
            <div
              className={`dev-pricing-card ${pkg.featured ? 'featured' : ''}`}
              key={pkg.name}
              style={{ position: 'relative' }}
            >
              {pkg.featured && <div className="dev-pricing-badge">MOST POPULAR</div>}
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: pkg.featured ? 'var(--dev-violet-light)' : 'var(--dev-violet)', marginBottom: 10 }}>
                {pkg.turnaround}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: pkg.featured ? 'white' : 'var(--dev-navy)', marginBottom: 4 }}>
                {pkg.name}
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, color: pkg.featured ? 'var(--dev-violet-light)' : 'var(--dev-navy)', fontFamily: 'monospace', margin: '12px 0 8px' }}>
                {pkg.price}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: pkg.featured ? 'rgba(255,255,255,0.7)' : 'var(--dev-gray-500)', marginBottom: 16 }}>
                {pkg.desc}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {pkg.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: pkg.featured ? 'rgba(255,255,255,0.85)' : 'var(--dev-gray-700)' }}>
                    <span style={{ color: pkg.featured ? 'var(--dev-violet-light)' : 'var(--dev-violet)', fontWeight: 700 }}>{'\u2713'}</span>
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
                  background: pkg.featured ? 'var(--dev-violet)' : 'transparent',
                  color: pkg.featured ? 'white' : 'var(--dev-navy)',
                  ...(pkg.featured ? {} : { border: '1.5px solid var(--dev-navy)' }),
                }}
              >
                {pkg.name === 'Full Development' ? 'Contact Sales' : 'Get Started'}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY KEALEE DEVELOPMENT ── */}
      <section className="dev-section">
        <div className="dev-section-label">Why Kealee Development</div>
        <h2 className="dev-section-title">
          Built for Developers<br />Who Move Fast
        </h2>
        <p className="dev-section-sub">
          Kealee Development isn&apos;t a consulting firm &mdash; it&apos;s a platform-powered
          development service that connects feasibility, design, permits, construction,
          and finance into one coordinated system.
        </p>
        <div className="dev-owner-grid">
          {ownerCards.map((card) => (
            <div className="dev-owner-card" key={card.title}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{card.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--dev-navy)', marginBottom: 8 }}>
                {card.title}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--dev-gray-500)' }}>
                {card.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="dev-cta-section">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 40, fontWeight: 700, color: 'white', lineHeight: 1.15, marginBottom: 16 }}>
            Ready to Develop<br />
            <span style={{ color: 'var(--dev-violet-light)', fontStyle: 'italic' }}>
              Your Next Project?
            </span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', marginBottom: 36, fontWeight: 300 }}>
            Start with a feasibility study. Know if your deal works before you commit capital.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/contact" className="dev-btn-violet">
              Schedule Consultation
            </Link>
            <Link href="/contact" className="dev-btn-outline-white">
              Request Feasibility Study
            </Link>
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            Feasibility studies from $2,500. Data-driven. Investor-ready reporting.
          </p>
        </div>
      </section>
    </div>
  )
}
