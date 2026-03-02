'use client'

import Link from 'next/link'
import './ops.css'

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
    tagClass: 'ops-tag-owner',
    title: 'Tell Us About Your Workload',
    desc: 'Share your active projects, team size, and pain points. Our operations manager does a free assessment to recommend the right package and coverage level.',
    chips: ['Project Portfolio', 'Team Assessment', 'Pain Points', 'Free Consultation'],
  },
  {
    num: 2,
    circle: 'ops',
    tag: 'Operations Team',
    tagClass: 'ops-tag-ops',
    title: 'We Assign Your Dedicated Ops Team',
    desc: 'Based on your package, we assign project managers, coordinators, and admin specialists who learn your processes, tools, and team preferences.',
    chips: ['Dedicated PM', 'Coordinators', 'Admin Specialists', 'Onboarding'],
  },
  {
    num: 3,
    circle: 'ops',
    tag: 'Operations Team',
    tagClass: 'ops-tag-ops',
    title: 'Your Team Handles Day-to-Day Operations',
    desc: 'Permit tracking, vendor coordination, sub follow-ups, scheduling, reporting, change orders, and client communication \u2014 handled by your ops team so you can focus on building.',
    chips: ['Permit Tracking', 'Vendor Coordination', 'Scheduling', 'Client Updates'],
  },
  {
    num: 4,
    circle: 'review',
    tag: 'Quality Review',
    tagClass: 'ops-tag-review',
    title: 'Weekly Reports & Budget Tracking',
    desc: 'Every week you get a status report covering all active projects \u2014 milestones hit, issues flagged, budget tracking, and upcoming deadlines. Full transparency, zero guesswork.',
    chips: ['Weekly Status Reports', 'Budget Tracking', 'Issue Flagging', 'Deadline Alerts'],
  },
  {
    num: 5,
    circle: 'ops',
    tag: 'Operations Team',
    tagClass: 'ops-tag-ops',
    title: 'Scale Up or Down Anytime',
    desc: 'Add projects, change packages, or pause service at any time. No long-term contracts. Your operations team flexes with your workload.',
    chips: ['No Contracts', 'Flexible Scaling', 'Pause Anytime', '14-Day Free Trial'],
  },
]

const packages = [
  {
    tier: 'STARTER',
    name: 'Package A',
    price: '$1,750',
    priceNote: '/mo \u00b7 5\u201310 hrs/week \u00b7 1 project',
    featured: false,
    features: [
      'Permit tracking & follow-up',
      'Basic vendor coordination',
      'Weekly status email',
      'Document management',
      'Email support',
    ],
  },
  {
    tier: 'PROFESSIONAL',
    name: 'Package B',
    price: '$3,750',
    priceNote: '/mo \u00b7 15\u201320 hrs/week \u00b7 3 projects',
    featured: true,
    badge: 'MOST POPULAR',
    features: [
      'Everything in Package A',
      'Sub coordination & follow-up',
      'Client communication',
      'Schedule management',
      'Change order support',
      'Dedicated project coordinator',
    ],
  },
  {
    tier: 'PREMIUM',
    name: 'Package C',
    price: '$9,500',
    priceNote: '/mo \u00b7 30\u201340 hrs/week \u00b7 up to 20 projects',
    featured: false,
    features: [
      'Everything in Package B',
      'Dedicated PM team',
      'Budget tracking & reporting',
      'Quality control oversight',
      'Custom reporting dashboard',
      'Priority response SLA',
    ],
  },
  {
    tier: 'ENTERPRISE',
    name: 'Package D',
    price: '$16,500',
    priceNote: '/mo \u00b7 40+ hrs/week \u00b7 portfolio',
    featured: false,
    features: [
      'Everything in Package C',
      'Portfolio management',
      'Executive reporting',
      'Custom SLAs',
      'On-site support available',
      'Dedicated account executive',
      'API integrations',
    ],
  },
]

const individualServices = [
  {
    category: 'Permits & Field Ops',
    services: ['Site visit coordination \u2014 $200', 'Inspection scheduling \u2014 $250', 'Permit follow-up \u2014 $300', 'Code review prep \u2014 $400'],
  },
  {
    category: 'Coordination & Admin',
    services: ['Vendor management \u2014 $250', 'Weekly reporting \u2014 $300', 'Schedule updates \u2014 $350', 'Change order processing \u2014 $500'],
  },
  {
    category: 'Estimating & Pre-Con',
    services: ['Scope review \u2014 $300/hr', 'Material takeoff \u2014 $500', 'Bid tabulation \u2014 $750', 'Value engineering \u2014 $1,250'],
  },
]

const ownerCards = [
  {
    icon: '\u23f0',
    title: 'Save 22+ Hours/Week',
    desc: 'Free up your time by offloading admin, coordination, and reporting to a dedicated operations team.',
  },
  {
    icon: '\ud83d\udcc8',
    title: 'Scale Without Hiring',
    desc: 'Get a full operations department without W-2 overhead, benefits, or HR headaches. Pay monthly, cancel anytime.',
  },
  {
    icon: '\ud83d\udcb0',
    title: 'Improve Margins',
    desc: 'Professional oversight reduces cost overruns, missed deadlines, and change order disputes that eat your profit.',
  },
  {
    icon: '\ud83d\udcca',
    title: 'Weekly Reporting',
    desc: 'Every project tracked, every issue flagged, every deadline visible. No more surprises on Monday morning.',
  },
  {
    icon: '\ud83e\udd1d',
    title: '14-Day Free Trial',
    desc: 'Try any package risk-free for 14 days. No contracts, no commitments. See the difference before you pay.',
  },
  {
    icon: '\ud83d\udd17',
    title: 'Connected to Kealee',
    desc: 'Your ops team works inside the Kealee platform. Permits, estimates, and build phases all connected.',
  },
]

export default function OpsClient() {
  return (
    <div>
      {/* ── PHASE TABS ── */}
      <nav className="ops-phase-bar">
        {phases.map((p) => (
          <Link
            key={p.id}
            href={phaseLinks[p.id]}
            className={`ops-phase-tab ${p.id === 'build' ? 'active' : ''}`}
          >
            <span className="ops-phase-dot" />
            {p.label}
          </Link>
        ))}
      </nav>

      {/* ── HERO ── */}
      <section className="ops-hero">
        <div className="ops-hero-badge">
          <span className="ops-badge-dot" />
          MANAGED SERVICES &middot; 14-DAY FREE TRIAL
        </div>
        <div className="ops-hero-layout">
          <div>
            <h1>
              Your Operations<br />
              Team, <em>On Demand</em>
            </h1>
            <p className="ops-hero-sub">
              Professional PM teams handle permits, coordination, reporting, and admin &mdash;
              so you can focus on building. Scale up or down anytime. No contracts.
            </p>
            <div className="ops-hero-actions">
              <Link href="/contact" className="ops-btn-sky">
                Start 14-Day Free Trial
              </Link>
              <Link href="/contact" className="ops-btn-outline-white">
                Talk to Sales
              </Link>
            </div>
          </div>
          <div className="ops-hero-stats">
            <div className="ops-hero-stat-grid">
              <div className="ops-hero-stat">
                <div className="ops-hero-stat-num">22h</div>
                <div className="ops-hero-stat-label">Hours saved per week on average</div>
              </div>
              <div className="ops-hero-stat">
                <div className="ops-hero-stat-num">14</div>
                <div className="ops-hero-stat-label">Day free trial, no contracts</div>
              </div>
              <div className="ops-hero-stat">
                <div className="ops-hero-stat-num">20+</div>
                <div className="ops-hero-stat-label">Projects managed per team</div>
              </div>
              <div className="ops-hero-stat">
                <div className="ops-hero-stat-num">30%</div>
                <div className="ops-hero-stat-label">Reduction in cost overruns</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="ops-section" style={{ background: 'var(--ops-cream)' }}>
        <div className="ops-section-label">How It Works</div>
        <h2 className="ops-section-title">
          From Assessment to<br />Full Operations Coverage
        </h2>
        <p className="ops-section-sub">
          Tell us about your workload, and we assign a dedicated team that handles your
          day-to-day operations. Here&apos;s how it works.
        </p>

        <div className="ops-workflow">
          {workflowSteps.map((step) => (
            <div className="ops-workflow-step" key={step.num}>
              <div className="ops-workflow-num">
                <div className={`ops-step-circle ${step.circle}`}>{step.num}</div>
              </div>
              <div className="ops-workflow-content">
                <div className={`ops-workflow-phase-tag ${step.tagClass}`}>{step.tag}</div>
                <div className="ops-workflow-title">{step.title}</div>
                <div className="ops-workflow-desc">{step.desc}</div>
                <div className="ops-workflow-chips">
                  {step.chips.map((c) => (
                    <span className="ops-chip" key={c}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST BANNER ── */}
      <div className="ops-trust-banner">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="ops-trust-icon">{'\ud83d\udc65'}</div>
          <div className="ops-trust-title">Dedicated Teams, Not Freelancers</div>
          <div className="ops-trust-desc">
            Your ops team learns your processes, your tools, and your team. They work
            as an extension of your company &mdash; not a revolving door of contractors.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="ops-trust-icon">{'\ud83d\udcca'}</div>
          <div className="ops-trust-title">Full Transparency</div>
          <div className="ops-trust-desc">
            Weekly reports, budget tracking, and issue flagging. You always know what&apos;s
            happening across every project. No surprises.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="ops-trust-icon">{'\u26a1'}</div>
          <div className="ops-trust-title">No Contracts</div>
          <div className="ops-trust-desc">
            Start with a 14-day free trial. Scale up, scale down, or pause anytime.
            Month-to-month billing with no long-term commitments.
          </div>
        </div>
      </div>

      {/* ── PACKAGES ── */}
      <section className="ops-packages-bg">
        <div className="ops-section-label">Pricing</div>
        <h2 className="ops-section-title">PM Managed Service Packages</h2>
        <p className="ops-section-sub">
          Choose the package that matches your workload. All packages include a 14-day free
          trial and month-to-month billing.
        </p>

        <div className="ops-pkg-grid">
          {packages.map((pkg) => (
            <div className={`ops-pkg-card ${pkg.featured ? 'featured' : ''}`} key={pkg.tier}>
              {pkg.badge && <div className="ops-pkg-badge">{pkg.badge}</div>}
              <div className="ops-pkg-tier">{pkg.tier}</div>
              <div className="ops-pkg-name">{pkg.name}</div>
              <div className="ops-pkg-price">{pkg.price}</div>
              <div className="ops-pkg-price-note">{pkg.priceNote}</div>
              <div className="ops-pkg-divider" />
              <ul className="ops-pkg-features">
                {pkg.features.map((f) => (
                  <li key={f}>
                    <span className="ops-pkg-check">{'\u2713'}</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className={`ops-btn-pkg ${pkg.featured ? 'ops-btn-pkg-sky' : 'ops-btn-pkg-outline'}`}
              >
                Start Free Trial
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── INDIVIDUAL SERVICES ── */}
      <section className="ops-section" style={{ background: 'var(--ops-cream)' }}>
        <div className="ops-section-label">A La Carte</div>
        <h2 className="ops-section-title">Individual Services</h2>
        <p className="ops-section-sub">
          Don&apos;t need a full package? Order individual services as needed. No minimums,
          no commitments.
        </p>
        <div className="ops-services-grid">
          {individualServices.map((cat) => (
            <div className="ops-service-card" key={cat.category}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ops-navy)', marginBottom: 20 }}>
                {cat.category}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cat.services.map((s) => (
                  <li key={s} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--ops-gray-700)', lineHeight: 1.4 }}>
                    <span className="ops-pkg-check">{'\u2713'}</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY KEALEE OPS ── */}
      <section className="ops-section">
        <div className="ops-section-label">Why Kealee Ops</div>
        <h2 className="ops-section-title">
          Built for Contractors Who<br />Want to Build, Not Manage
        </h2>
        <p className="ops-section-sub">
          Kealee Ops isn&apos;t a staffing agency &mdash; it&apos;s a managed operations service
          built on the same platform that handles your design, estimation, and permits.
        </p>
        <div className="ops-owner-grid">
          {ownerCards.map((card) => (
            <div className="ops-owner-card" key={card.title}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{card.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ops-navy)', marginBottom: 8 }}>
                {card.title}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ops-gray-500)' }}>
                {card.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="ops-cta-section">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 40, fontWeight: 700, color: 'white', lineHeight: 1.15, marginBottom: 16 }}>
            Ready to Get Your<br />
            <span style={{ color: 'var(--ops-sky-light)', fontStyle: 'italic' }}>
              Time Back?
            </span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', marginBottom: 36, fontWeight: 300 }}>
            Start your 14-day free trial. No contracts, no commitments. See the difference.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/contact" className="ops-btn-sky">
              Start 14-Day Free Trial
            </Link>
            <Link href="/contact" className="ops-btn-outline-white">
              Talk to Sales
            </Link>
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            Dedicated operations teams. Month-to-month billing. Cancel anytime.
          </p>
        </div>
      </section>
    </div>
  )
}
