'use client'

import Link from 'next/link'
import './estimation.css'

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

const workflowSteps = [
  {
    num: 1,
    circle: '',
    tag: 'Project Owner',
    tagClass: 'est-tag-owner',
    title: 'Submit Your Project Details',
    desc: 'Upload your plans, photos, scope of work, and project requirements through our secure portal. Our intake form covers property type, square footage, location, and special conditions.',
    chips: ['Plans & Photos', 'Scope of Work', 'Project Type', 'Special Conditions'],
  },
  {
    num: 2,
    circle: 'data',
    tag: 'Market Data',
    tagClass: 'est-tag-data',
    title: 'Real-Time Market Rate Integration',
    desc: 'Our system pulls current material pricing from supplier databases and labor rates from your local market. No stale data — every estimate reflects what contractors are actually charging today.',
    chips: ['Live Material Pricing', 'Local Labor Rates', 'Supplier Database', 'Market Adjustments'],
  },
  {
    num: 3,
    circle: 'ai',
    tag: 'AI Analysis',
    tagClass: 'est-tag-ai',
    title: 'AI Analyzes Your Project Against 10,000+ Comparables',
    desc: 'Our estimation engine — trained on thousands of completed construction projects — breaks down your scope into CSI divisions, calculates quantities, applies market rates, and generates a comprehensive cost model.',
    chips: ['CSI Division Breakdown', 'Quantity Takeoff', 'Cost Modeling', 'Timeline Projection'],
  },
  {
    num: 4,
    circle: 'review',
    tag: 'Expert Review',
    tagClass: 'est-tag-review',
    title: 'A Certified Estimator Validates Every Number',
    desc: 'Every AI-generated estimate is reviewed and validated by a certified professional estimator before delivery. They check quantities, verify rates, and add risk contingencies. No shortcuts.',
    chips: ['Quantity Verification', 'Rate Validation', 'Risk Analysis', 'Estimator Approval'],
  },
  {
    num: 5,
    circle: '',
    tag: 'Project Owner',
    tagClass: 'est-tag-owner',
    title: 'Review Your Detailed Cost Breakdown',
    desc: 'Log into your Owner Dashboard to review your estimate line by line. See labor, materials, timeline, profit margins, and cash flow projections — all in one interactive report.',
    chips: ['Owner Dashboard', 'Line-Item Detail', 'Interactive Report', 'Export Options'],
  },
  {
    num: 6,
    circle: 'data',
    tag: 'Seamless Handoff',
    tagClass: 'est-tag-data',
    title: 'Estimates Flow Into Bids & Construction',
    desc: 'Approved estimates automatically populate your bid packages and project budgets in Kealee. No re-entering data, no spreadsheet gymnastics — your numbers follow you from estimate to closeout.',
    chips: ['Auto-Generated Bid Packages', 'Budget Integration', 'Connected to Build Phase'],
  },
]

const packages = [
  {
    tier: 'BASIC',
    name: 'Quick Estimate',
    price: '$299',
    priceNote: '24-hour turnaround',
    featured: false,
    features: [
      'Labor cost breakdown',
      'Material quantity takeoff',
      'Basic timeline estimate',
      'PDF report delivery',
      '1 revision round',
      'Email support',
    ],
  },
  {
    tier: 'STANDARD',
    name: 'Full Estimate',
    price: '$799',
    priceNote: '48-hour turnaround',
    featured: false,
    features: [
      'Detailed labor analysis',
      'Material pricing with suppliers',
      'Phased timeline projection',
      'Profit margin analysis',
      'Excel + PDF deliverables',
      '2 revision rounds',
    ],
  },
  {
    tier: 'PROFESSIONAL',
    name: 'Pro Estimate',
    price: '$1,999',
    priceNote: '3\u20135 day turnaround',
    featured: true,
    badge: 'MOST POPULAR',
    features: [
      'Comprehensive BOQ',
      'Multi-vendor pricing comparison',
      'Resource allocation plan',
      'Risk contingency analysis',
      'Cash flow projection',
      'Dedicated estimator review',
      '3 revision rounds',
    ],
  },
  {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    price: '$4,999',
    priceNote: 'Custom timeline',
    featured: false,
    features: [
      'Everything in Professional',
      'Value engineering options',
      'Alternative material analysis',
      'Subcontractor bid packages',
      'On-site consultation',
      'Unlimited revisions (30 days)',
      'Dedicated project manager',
    ],
  },
]

const ownerCards = [
  {
    icon: '\ud83d\udcca',
    title: 'Interactive Cost Dashboard',
    desc: 'Drill into every line item — labor, materials, equipment, overhead. Sort by CSI division, phase, or trade.',
  },
  {
    icon: '\u26a1',
    title: '24-Hour Quick Estimates',
    desc: 'Need a ballpark fast? Get a preliminary estimate within 24 hours to make go/no-go decisions quickly.',
  },
  {
    icon: '\ud83d\udcc8',
    title: 'Market-Rate Accuracy',
    desc: 'Every estimate uses real-time material pricing and local labor rates — not last year\'s cost books.',
  },
  {
    icon: '\ud83d\udd12',
    title: 'Bid-Ready Packages',
    desc: 'Export your estimate as a professional bid package ready to send to subcontractors and suppliers.',
  },
  {
    icon: '\ud83e\udd16',
    title: 'AI + Human Validation',
    desc: 'AI does the heavy computation. Certified estimators validate every number before it reaches you.',
  },
  {
    icon: '\ud83d\udcb0',
    title: 'Profit Margin Analysis',
    desc: 'See your projected margins, cash flow timeline, and risk contingencies — all built into the report.',
  },
]

export default function EstimationClient() {
  return (
    <div>
      {/* ── PHASE TABS ── */}
      <nav className="est-phase-bar">
        {phases.map((p) => (
          <Link
            key={p.id}
            href={phaseLinks[p.id]}
            className={`est-phase-tab ${p.id === 'estimate' ? 'active' : ''}`}
          >
            <span className="est-phase-dot" />
            {p.label}
          </Link>
        ))}
      </nav>

      {/* ── HERO ── */}
      <section className="est-hero">
        <div className="est-hero-badge">
          <span className="est-badge-dot" />
          AI-POWERED &middot; EXPERT-VALIDATED ESTIMATES
        </div>
        <div className="est-hero-layout">
          <div>
            <h1>
              Know Your Costs<br />
              Before You <em>Build</em>
            </h1>
            <p className="est-hero-sub">
              AI-powered cost estimation backed by real market data and validated by certified
              estimators. Labor, materials, timeline, and profit analysis &mdash; delivered in as
              little as 24 hours.
            </p>
            <div className="est-hero-actions">
              <Link href="/get-started" className="est-btn-amber">
                Get an Estimate &mdash; From $299
              </Link>
              <Link href="/contact" className="est-btn-outline-white">
                Talk to an Estimator
              </Link>
            </div>
          </div>
          <div className="est-hero-stats">
            <div className="est-hero-stat-grid">
              <div className="est-hero-stat">
                <div className="est-hero-stat-num">24h</div>
                <div className="est-hero-stat-label">Quick estimate turnaround time</div>
              </div>
              <div className="est-hero-stat">
                <div className="est-hero-stat-num">10K+</div>
                <div className="est-hero-stat-label">Projects in our AI training database</div>
              </div>
              <div className="est-hero-stat">
                <div className="est-hero-stat-num">96%</div>
                <div className="est-hero-stat-label">Estimate-to-actual accuracy rate</div>
              </div>
              <div className="est-hero-stat">
                <div className="est-hero-stat-num">3 Days</div>
                <div className="est-hero-stat-label">Faster than traditional estimating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="est-section" style={{ background: 'var(--est-cream)' }}>
        <div className="est-section-label">How It Works</div>
        <h2 className="est-section-title">
          From Project Details<br />to Accurate Estimate
        </h2>
        <p className="est-section-sub">
          Submit your project info and get a detailed, expert-validated cost breakdown &mdash;
          here&apos;s exactly how our estimation engine works.
        </p>

        <div className="est-workflow">
          {workflowSteps.map((step) => (
            <div className="est-workflow-step" key={step.num}>
              <div className="est-workflow-num">
                <div className={`est-step-circle ${step.circle}`}>{step.num}</div>
              </div>
              <div className="est-workflow-content">
                <div className={`est-workflow-phase-tag ${step.tagClass}`}>{step.tag}</div>
                <div className="est-workflow-title">{step.title}</div>
                <div className="est-workflow-desc">{step.desc}</div>
                <div className="est-workflow-chips">
                  {step.chips.map((c) => (
                    <span className="est-chip" key={c}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST BANNER ── */}
      <div className="est-trust-banner">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="est-trust-icon">{'\u26a1'}</div>
          <div className="est-trust-title">AI Does the Heavy Lifting</div>
          <div className="est-trust-desc">
            Our AI analyzes your project scope against 10,000+ completed projects, current material
            databases, and local labor rates to generate line-item cost breakdowns in hours, not weeks.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="est-trust-icon">{'\ud83d\udcdd'}</div>
          <div className="est-trust-title">Certified Estimators Validate</div>
          <div className="est-trust-desc">
            Every estimate is reviewed by a certified professional estimator who checks quantities,
            validates rates, and adds risk contingencies. AI accelerates &mdash; humans verify.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="est-trust-icon">{'\ud83d\udcb2'}</div>
          <div className="est-trust-title">Real-Time Market Data</div>
          <div className="est-trust-desc">
            No stale cost books. Our estimates pull live material pricing from supplier databases and
            current labor rates from your local market &mdash; so your numbers reflect reality.
          </div>
        </div>
      </div>

      {/* ── PACKAGES ── */}
      <section className="est-packages-bg">
        <div className="est-section-label">Pricing</div>
        <h2 className="est-section-title">Estimation Packages</h2>
        <p className="est-section-sub">
          Choose the right level of detail for your project. All estimates include AI analysis +
          expert validation.
        </p>

        <div className="est-pkg-grid">
          {packages.map((pkg) => (
            <div className={`est-pkg-card ${pkg.featured ? 'featured' : ''}`} key={pkg.tier}>
              {pkg.badge && <div className="est-pkg-badge">{pkg.badge}</div>}
              <div className="est-pkg-tier">{pkg.tier}</div>
              <div className="est-pkg-name">{pkg.name}</div>
              <div className="est-pkg-price">{pkg.price}</div>
              <div className="est-pkg-price-note">{pkg.priceNote}</div>
              <div className="est-pkg-divider" />
              <ul className="est-pkg-features">
                {pkg.features.map((f) => (
                  <li key={f}>
                    <span className="est-pkg-check">{'\u2713'}</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/get-started"
                className={`est-btn-pkg ${pkg.featured ? 'est-btn-pkg-amber' : 'est-btn-pkg-outline'}`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROFESSIONAL REVIEW ── */}
      <section className="est-review-section">
        <div className="est-review-grid">
          <div>
            <div className="est-section-label">Quality Assurance</div>
            <h2 className="est-section-title">
              Every Estimate Is<br />Expert-Validated
            </h2>
            <p className="est-section-sub" style={{ marginBottom: 32 }}>
              AI generates the cost model. A certified estimator reviews every quantity, validates
              every rate, and ensures your estimate is accurate before delivery. No exceptions.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="est-cred-chip">
                <span className="est-cred-dot" /> Certified Professional Estimators
              </div>
              <div className="est-cred-chip">
                <span className="est-cred-dot" /> Real-Time Market Data Sources
              </div>
              <div className="est-cred-chip">
                <span className="est-cred-dot" /> 96% Estimate-to-Actual Accuracy
              </div>
            </div>
          </div>
          <div className="est-review-visual">
            <div className="est-review-flow-step">
              <div className="est-review-flow-icon est-icon-ai">{'\ud83e\udd16'}</div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--est-navy)', marginBottom: 4, fontSize: 15 }}>
                  AI Generates Cost Model
                </div>
                <div style={{ fontSize: 13, color: 'var(--est-gray-500)', lineHeight: 1.5 }}>
                  Analyzes your project against thousands of comparables, calculates quantities, and
                  applies current market rates to produce a detailed line-item estimate.
                </div>
              </div>
            </div>
            <div className="est-review-flow-step">
              <div className="est-review-flow-icon est-icon-data">{'\ud83d\udcca'}</div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--est-navy)', marginBottom: 4, fontSize: 15 }}>
                  Market Data Validation
                </div>
                <div style={{ fontSize: 13, color: 'var(--est-gray-500)', lineHeight: 1.5 }}>
                  Cross-references material pricing from supplier databases and local labor rates to
                  ensure every number reflects current market conditions.
                </div>
              </div>
            </div>
            <div className="est-review-flow-step">
              <div className="est-review-flow-icon est-icon-review">{'\u2705'}</div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--est-navy)', marginBottom: 4, fontSize: 15 }}>
                  Expert Validates & Delivers
                </div>
                <div style={{ fontSize: 13, color: 'var(--est-gray-500)', lineHeight: 1.5 }}>
                  A certified estimator reviews the complete estimate, adds risk contingencies,
                  and approves it for delivery. You receive it with full confidence.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OWNER EXPERIENCE ── */}
      <section className="est-section">
        <div className="est-section-label">Why Kealee Estimation</div>
        <h2 className="est-section-title">
          Built for Contractors &<br />Project Owners Who Win Bids
        </h2>
        <p className="est-section-sub">
          Kealee Estimation isn&apos;t just a cost report &mdash; it&apos;s a competitive advantage
          that helps you price accurately, bid confidently, and protect your margins.
        </p>
        <div className="est-owner-grid">
          {ownerCards.map((card) => (
            <div className="est-owner-card" key={card.title}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{card.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--est-navy)', marginBottom: 8 }}>
                {card.title}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--est-gray-500)' }}>
                {card.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="est-cta-section">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 40, fontWeight: 700, color: 'white', lineHeight: 1.15, marginBottom: 16 }}>
            Ready to Know Your<br />
            <span style={{ color: 'var(--est-amber-light)', fontStyle: 'italic' }}>
              True Project Costs?
            </span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', marginBottom: 36, fontWeight: 300 }}>
            Get a detailed, expert-validated estimate. As fast as 24 hours. Starting at $299.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/get-started" className="est-btn-amber">
              Get My Estimate &mdash; From $299
            </Link>
            <Link href="/contact" className="est-btn-outline-white">
              Talk to an Estimator
            </Link>
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            All estimates reviewed and validated by a certified professional estimator before delivery.
          </p>
        </div>
      </section>
    </div>
  )
}
