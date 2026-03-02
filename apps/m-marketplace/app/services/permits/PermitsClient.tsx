'use client'

import Link from 'next/link'
import './permits.css'

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
    tagClass: 'pm-tag-owner',
    title: 'Upload Your Drawings & Project Info',
    desc: 'Submit your architectural drawings, site plans, and project details through our secure portal. If you used Kealee Design, your drawings auto-populate \u2014 no re-uploading.',
    chips: ['Architectural Drawings', 'Site Plans', 'Project Scope', 'Auto-Import from Design'],
  },
  {
    num: 2,
    circle: 'ai',
    tag: 'AI Review',
    tagClass: 'pm-tag-ai',
    title: 'AI Scans Documents for Compliance Issues',
    desc: 'Our AI reviews your drawings against local building codes, zoning ordinances, and jurisdiction-specific requirements. It catches common rejection reasons before you submit.',
    chips: ['Code Compliance Check', 'Zoning Review', 'Common Error Detection', 'Jurisdiction Rules'],
  },
  {
    num: 3,
    circle: 'review',
    tag: 'Permit Specialist',
    tagClass: 'pm-tag-review',
    title: 'A Permit Specialist Prepares Your Application',
    desc: 'Our permit specialists prepare your complete application package \u2014 forms, fees, required documents, and supporting materials \u2014 tailored to your specific jurisdiction.',
    chips: ['Application Forms', 'Fee Calculation', 'Required Documents', 'Jurisdiction-Specific'],
  },
  {
    num: 4,
    circle: 'submit',
    tag: 'Submission',
    tagClass: 'pm-tag-submit',
    title: 'We Submit & Track Your Permit',
    desc: 'Your application is submitted to the jurisdiction and tracked in real time. You get automatic status updates, revision notifications, and estimated approval timelines.',
    chips: ['Direct Submission', 'Real-Time Tracking', 'Status Alerts', 'Timeline Estimates'],
  },
  {
    num: 5,
    circle: 'review',
    tag: 'Revision Management',
    tagClass: 'pm-tag-review',
    title: 'Revisions Handled Quickly',
    desc: 'When the jurisdiction requests changes, our team manages the revision process. We coordinate with your architect, update documents, and resubmit \u2014 keeping your project on track.',
    chips: ['Architect Coordination', 'Document Updates', 'Resubmission', 'Timeline Management'],
  },
  {
    num: 6,
    circle: 'review',
    tag: 'Seamless Handoff',
    tagClass: 'pm-tag-review',
    title: 'Approved Permits Flow Into Construction',
    desc: 'Once approved, your permits and inspection schedules automatically populate your Kealee Build dashboard. No manual tracking \u2014 your project moves forward seamlessly.',
    chips: ['Auto-Populated Inspections', 'Build Dashboard Integration', 'Compliance Tracking'],
  },
]

const jurisdictions = [
  'Washington, DC', 'Montgomery County, MD', "Prince George's County, MD", 'Fairfax County, VA',
  'Arlington County, VA', 'Alexandria, VA', 'Anne Arundel County, MD', 'Howard County, MD',
  'Baltimore City, MD', 'Baltimore County, MD', 'Loudoun County, VA', 'Prince William County, VA',
]

const permitTypes = [
  'Building Permits', 'Electrical Permits', 'Plumbing Permits', 'HVAC Permits',
  'Demolition Permits', 'Fire Permits', 'Zoning Permits', 'Environmental Permits',
  'Historic Preservation', 'Grading Permits', 'Use & Occupancy',
]

const packages = [
  {
    tier: 'TRACKING',
    name: 'Permit Tracking',
    price: '$99',
    priceNote: 'per month',
    featured: false,
    features: [
      'Up to 10 active permits',
      'Real-time status tracking',
      'Email & SMS alerts',
      'Document storage',
      'Inspection scheduling',
      'Compliance dashboard',
    ],
  },
  {
    tier: 'FULL SERVICE',
    name: 'Full Service',
    price: '$325',
    priceNote: 'per permit',
    featured: true,
    badge: 'MOST POPULAR',
    features: [
      'AI document review',
      'Application preparation',
      'Direct submission handling',
      'Revision management',
      'Status tracking & alerts',
      'Inspection coordination',
      'Dedicated permit specialist',
    ],
  },
  {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    price: 'Custom',
    priceNote: 'volume pricing',
    featured: false,
    features: [
      'Everything in Full Service',
      'Unlimited permits',
      'Dedicated coordinator',
      'Priority processing',
      'API access',
      'Custom reporting',
      'Multi-project dashboard',
    ],
  },
]

const ownerCards = [
  {
    icon: '\ud83d\udcf1',
    title: 'Real-Time Status Dashboard',
    desc: 'Track every permit application, revision, and inspection from your phone or desktop. No more calling the permit office.',
  },
  {
    icon: '\ud83e\udd16',
    title: 'AI-Powered Pre-Review',
    desc: 'Our AI catches common rejection reasons before you submit. Fewer revisions, faster approvals, less wasted time.',
  },
  {
    icon: '\ud83d\udcc5',
    title: 'Inspection Scheduling',
    desc: 'Book, reschedule, and track inspections directly through the platform. Automatic reminders so you never miss one.',
  },
  {
    icon: '\ud83d\udd14',
    title: 'Instant Notifications',
    desc: 'Get alerted the moment a permit is approved, needs revision, or an inspection is scheduled. Email, SMS, or push.',
  },
  {
    icon: '\ud83d\udcc2',
    title: 'Document Management',
    desc: 'All permits, inspection reports, and compliance certificates stored securely in one place. Easy export and sharing.',
  },
  {
    icon: '\ud83d\udd17',
    title: 'Connected to Your Project',
    desc: 'Permits connect to your Design, Estimation, and Build phases. No duplicate data entry across the platform.',
  },
]

export default function PermitsClient() {
  return (
    <div>
      {/* ── PHASE TABS ── */}
      <nav className="pm-phase-bar">
        {phases.map((p) => (
          <Link
            key={p.id}
            href={phaseLinks[p.id]}
            className={`pm-phase-tab ${p.id === 'permit' ? 'active' : ''}`}
          >
            <span className="pm-phase-dot" />
            {p.label}
          </Link>
        ))}
      </nav>

      {/* ── HERO ── */}
      <section className="pm-hero">
        <div className="pm-hero-badge">
          <span className="pm-badge-dot" />
          AI-POWERED &middot; 12 JURISDICTIONS SUPPORTED
        </div>
        <div className="pm-hero-layout">
          <div>
            <h1>
              Permits Made<br />
              <em>Simple</em>
            </h1>
            <p className="pm-hero-sub">
              Stop chasing permit statuses. AI-powered document review catches errors before you
              submit, and our permit specialists handle the entire process &mdash; from application
              to approval.
            </p>
            <div className="pm-hero-actions">
              <Link href="/get-started" className="pm-btn-green">
                Start a Permit &mdash; $325
              </Link>
              <Link href="/contact" className="pm-btn-outline-white">
                Talk to a Specialist
              </Link>
            </div>
          </div>
          <div className="pm-hero-stats">
            <div className="pm-hero-stat-grid">
              <div className="pm-hero-stat">
                <div className="pm-hero-stat-num">12</div>
                <div className="pm-hero-stat-label">DC/MD/VA jurisdictions supported</div>
              </div>
              <div className="pm-hero-stat">
                <div className="pm-hero-stat-num">85%</div>
                <div className="pm-hero-stat-label">First-submission approval rate</div>
              </div>
              <div className="pm-hero-stat">
                <div className="pm-hero-stat-num">3x</div>
                <div className="pm-hero-stat-label">Faster than DIY permit filing</div>
              </div>
              <div className="pm-hero-stat">
                <div className="pm-hero-stat-num">24h</div>
                <div className="pm-hero-stat-label">AI review turnaround time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="pm-section" style={{ background: 'var(--pm-cream)' }}>
        <div className="pm-section-label">How It Works</div>
        <h2 className="pm-section-title">
          From Drawings to<br />Approved Permit
        </h2>
        <p className="pm-section-sub">
          Upload your plans, and we handle the rest &mdash; AI review, application prep,
          submission, tracking, and revisions. Here&apos;s how it works.
        </p>

        <div className="pm-workflow">
          {workflowSteps.map((step) => (
            <div className="pm-workflow-step" key={step.num}>
              <div className="pm-workflow-num">
                <div className={`pm-step-circle ${step.circle}`}>{step.num}</div>
              </div>
              <div className="pm-workflow-content">
                <div className={`pm-workflow-phase-tag ${step.tagClass}`}>{step.tag}</div>
                <div className="pm-workflow-title">{step.title}</div>
                <div className="pm-workflow-desc">{step.desc}</div>
                <div className="pm-workflow-chips">
                  {step.chips.map((c) => (
                    <span className="pm-chip" key={c}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST BANNER ── */}
      <div className="pm-trust-banner">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="pm-trust-icon">{'\ud83e\udd16'}</div>
          <div className="pm-trust-title">AI Catches Errors First</div>
          <div className="pm-trust-desc">
            Our AI reviews your documents against jurisdiction-specific building codes and zoning
            requirements, flagging common rejection reasons before you submit.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="pm-trust-icon">{'\ud83d\udcdd'}</div>
          <div className="pm-trust-title">Permit Specialists Handle It</div>
          <div className="pm-trust-desc">
            Dedicated permit specialists prepare your complete application package, submit to the
            jurisdiction, and manage revisions. You approve &mdash; we handle the paperwork.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="pm-trust-icon">{'\ud83d\udcca'}</div>
          <div className="pm-trust-title">Real-Time Tracking</div>
          <div className="pm-trust-desc">
            Your dashboard shows the live status of every permit &mdash; submitted, under review,
            approved, or needs revision. No more calling the permit office for updates.
          </div>
        </div>
      </div>

      {/* ── JURISDICTIONS & PERMIT TYPES ── */}
      <section className="pm-jurisdictions-bg">
        <div className="pm-section-label">Coverage</div>
        <h2 className="pm-section-title">Supported Jurisdictions</h2>
        <p className="pm-section-sub">
          We support permitting across the DC, Maryland, and Virginia metro area. Each
          jurisdiction has unique requirements &mdash; our specialists know them all.
        </p>

        <div className="pm-jurisdictions-grid">
          {jurisdictions.map((j) => (
            <div className="pm-jurisdiction-chip" key={j}>{j}</div>
          ))}
        </div>
        <p style={{ fontSize: 14, color: 'var(--pm-gray-500)' }}>
          Don&apos;t see your jurisdiction?{' '}
          <Link href="/contact" style={{ color: 'var(--pm-green)', fontWeight: 600, textDecoration: 'none' }}>
            Contact us
          </Link>{' '}
          to request coverage.
        </p>

        <div style={{ marginTop: 56 }}>
          <div className="pm-section-label">Permit Types</div>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: 'var(--pm-navy)', marginBottom: 24 }}>
            We Handle Every Permit Type
          </h3>
          <div className="pm-permit-types-grid">
            {permitTypes.map((type) => (
              <div className="pm-permit-type-chip" key={type}>{type}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PACKAGES ── */}
      <section className="pm-packages-bg">
        <div className="pm-section-label">Pricing</div>
        <h2 className="pm-section-title">Permit Service Packages</h2>
        <p className="pm-section-sub">
          Track permits yourself or let us handle the entire process. Choose the level of
          service that fits your project.
        </p>

        <div className="pm-pkg-grid">
          {packages.map((pkg) => (
            <div className={`pm-pkg-card ${pkg.featured ? 'featured' : ''}`} key={pkg.tier}>
              {pkg.badge && <div className="pm-pkg-badge">{pkg.badge}</div>}
              <div className="pm-pkg-tier">{pkg.tier}</div>
              <div className="pm-pkg-name">{pkg.name}</div>
              <div className="pm-pkg-price">{pkg.price}</div>
              <div className="pm-pkg-price-note">{pkg.priceNote}</div>
              <div className="pm-pkg-divider" />
              <ul className="pm-pkg-features">
                {pkg.features.map((f) => (
                  <li key={f}>
                    <span className="pm-pkg-check">{'\u2713'}</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/get-started"
                className={`pm-btn-pkg ${pkg.featured ? 'pm-btn-pkg-green' : 'pm-btn-pkg-outline'}`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI COMPLIANCE REVIEW ── */}
      <section className="pm-review-section">
        <div className="pm-review-grid">
          <div>
            <div className="pm-section-label">Quality Assurance</div>
            <h2 className="pm-section-title">
              AI Reviews Before<br />You Submit
            </h2>
            <p className="pm-section-sub" style={{ marginBottom: 32 }}>
              Our AI scans your documents against jurisdiction-specific codes and flags issues
              before submission. Combined with specialist review, this drives our 85%
              first-submission approval rate.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="pm-cred-chip">
                <span className="pm-cred-dot" /> 12 DC/MD/VA Jurisdictions
              </div>
              <div className="pm-cred-chip">
                <span className="pm-cred-dot" /> 85% First-Submission Approval
              </div>
              <div className="pm-cred-chip">
                <span className="pm-cred-dot" /> Dedicated Permit Specialists
              </div>
            </div>
          </div>
          <div className="pm-review-visual">
            <div className="pm-review-flow-step">
              <div className="pm-review-flow-icon pm-icon-ai">{'\ud83e\udd16'}</div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--pm-navy)', marginBottom: 4, fontSize: 15 }}>
                  AI Scans for Compliance
                </div>
                <div style={{ fontSize: 13, color: 'var(--pm-gray-500)', lineHeight: 1.5 }}>
                  Reviews drawings against local building codes, zoning ordinances, and
                  jurisdiction-specific requirements. Flags common rejection reasons in minutes.
                </div>
              </div>
            </div>
            <div className="pm-review-flow-step">
              <div className="pm-review-flow-icon pm-icon-review">{'\u2705'}</div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--pm-navy)', marginBottom: 4, fontSize: 15 }}>
                  Specialist Validates & Prepares
                </div>
                <div style={{ fontSize: 13, color: 'var(--pm-gray-500)', lineHeight: 1.5 }}>
                  A permit specialist reviews the AI findings, prepares the complete application
                  package, and ensures everything meets jurisdiction requirements.
                </div>
              </div>
            </div>
            <div className="pm-review-flow-step">
              <div className="pm-review-flow-icon pm-icon-submit">{'\ud83d\udce8'}</div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--pm-navy)', marginBottom: 4, fontSize: 15 }}>
                  Submit & Track to Approval
                </div>
                <div style={{ fontSize: 13, color: 'var(--pm-gray-500)', lineHeight: 1.5 }}>
                  Application is submitted directly to the jurisdiction. You get real-time tracking,
                  instant alerts, and revision management until approval.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OWNER EXPERIENCE ── */}
      <section className="pm-section">
        <div className="pm-section-label">Platform Features</div>
        <h2 className="pm-section-title">
          Everything You Need to<br />Manage Permits Effortlessly
        </h2>
        <p className="pm-section-sub">
          Kealee Permits isn&apos;t just a tracking tool &mdash; it&apos;s a complete permit
          management platform that saves you hours every week.
        </p>
        <div className="pm-owner-grid">
          {ownerCards.map((card) => (
            <div className="pm-owner-card" key={card.title}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{card.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--pm-navy)', marginBottom: 8 }}>
                {card.title}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--pm-gray-500)' }}>
                {card.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pm-cta-section">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 40, fontWeight: 700, color: 'white', lineHeight: 1.15, marginBottom: 16 }}>
            Ready to Stop Chasing<br />
            <span style={{ color: 'var(--pm-green-light)', fontStyle: 'italic' }}>
              Permit Statuses?
            </span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', marginBottom: 36, fontWeight: 300 }}>
            Let our AI and permit specialists handle the paperwork. Start with a single permit for $325.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/get-started" className="pm-btn-green">
              Start My Permit &mdash; $325
            </Link>
            <Link href="/contact" className="pm-btn-outline-white">
              Talk to a Specialist
            </Link>
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            AI-powered document review + dedicated permit specialist on every application.
          </p>
        </div>
      </section>
    </div>
  )
}
