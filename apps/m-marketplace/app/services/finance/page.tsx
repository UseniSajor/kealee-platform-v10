'use client'

import Link from 'next/link'
import './finance.css'

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
    tagClass: 'fin-tag-owner',
    title: 'Open an Escrow Account in Minutes',
    desc: 'Create your escrow account online with no monthly fees. Define project milestones, payment amounts, and release conditions. FDIC insured up to $250,000.',
    chips: ['Free Setup', 'No Monthly Fees', 'FDIC Insured', 'Online in Minutes'],
  },
  {
    num: 2,
    circle: '',
    tag: 'Project Owner',
    tagClass: 'fin-tag-owner',
    title: 'Fund the Escrow Account',
    desc: 'Deposit funds via ACH (free) or wire transfer ($25). Funds are held securely in a separate trust account until milestones are approved.',
    chips: ['ACH Transfer Free', 'Wire Transfer $25', 'Trust Account', 'Secure Hold'],
  },
  {
    num: 3,
    circle: '',
    tag: 'Contractor',
    tagClass: 'fin-tag-contractor',
    title: 'Contractor Completes Work & Requests Release',
    desc: 'When a milestone is complete, the contractor submits a release request with documentation \u2014 photos, inspection reports, lien waivers. Everything tracked in the platform.',
    chips: ['Release Request', 'Photo Documentation', 'Inspection Reports', 'Lien Waivers'],
  },
  {
    num: 4,
    circle: '',
    tag: 'Project Owner',
    tagClass: 'fin-tag-owner',
    title: 'You Review & Approve the Release',
    desc: 'Review the contractor\u2019s submission in your dashboard. Approve the full amount, partial release, or request corrections. You control every dollar.',
    chips: ['Owner Approval', 'Partial Releases', 'Correction Requests', 'Full Control'],
  },
  {
    num: 5,
    circle: 'escrow',
    tag: 'Escrow System',
    tagClass: 'fin-tag-escrow',
    title: 'Funds Released Automatically',
    desc: 'Once approved, funds are released to the contractor via ACH (1\u20133 days, $5) or same-day wire ($35). Complete audit trail for every transaction.',
    chips: ['ACH 1\u20133 Days', 'Same-Day Wire', 'Audit Trail', 'Auto Notifications'],
  },
  {
    num: 6,
    circle: 'escrow',
    tag: 'Escrow System',
    tagClass: 'fin-tag-escrow',
    title: 'Complete Financial Record at Closeout',
    desc: 'When the project is done, you have a complete financial record \u2014 every deposit, every release, every approval timestamp. Ready for tax filing, audits, or insurance claims.',
    chips: ['Complete Records', 'Tax Ready', 'Audit Compliant', 'Export to PDF'],
  },
]

const fees = [
  { service: 'Escrow Account Setup', fee: 'Free' },
  { service: 'ACH Deposit', fee: 'Free' },
  { service: 'Wire Deposit', fee: '$25' },
  { service: 'ACH Release', fee: '$5' },
  { service: 'Same-Day Wire Release', fee: '$35' },
  { service: 'Monthly Statement', fee: 'Free' },
  { service: 'Dispute Resolution', fee: 'Free' },
]

const protections = [
  {
    title: 'For Project Owners',
    items: [
      'Funds only released when you approve',
      'Documentation required for each release',
      'Dispute resolution support included',
      'Cancel anytime \u2014 remaining funds returned',
      'Complete audit trail for every transaction',
      'FDIC insured up to $250,000',
    ],
  },
  {
    title: 'For Contractors',
    items: [
      'Guaranteed payment for approved work',
      'No more chasing owners for payment',
      'Clear milestone definitions upfront',
      'Fast ACH or same-day wire transfers',
      'Professional payment documentation',
      'Reduces payment disputes by 90%',
    ],
  },
]

const ownerCards = [
  {
    icon: '\ud83d\udd12',
    title: 'FDIC Insured Escrow',
    desc: 'Your funds are held in FDIC-insured trust accounts, separate from Kealee operating funds. Insured up to $250,000.',
  },
  {
    icon: '\ud83d\udcb8',
    title: 'Milestone-Based Releases',
    desc: 'Pay only for completed work. Define milestones upfront, approve releases as work is verified and documented.',
  },
  {
    icon: '\ud83d\udcca',
    title: 'Real-Time Financial Dashboard',
    desc: 'Track deposits, releases, pending requests, and project cash flow in real time. Export reports for tax and accounting.',
  },
  {
    icon: '\u26a1',
    title: 'Fast Transfers',
    desc: 'ACH releases in 1\u20133 business days. Need it faster? Same-day wire for $35. No hidden delays.',
  },
  {
    icon: '\ud83d\udee1',
    title: 'Dispute Resolution',
    desc: 'If there\u2019s a disagreement, our dispute resolution team mediates \u2014 included free with every escrow account.',
  },
  {
    icon: '\ud83d\udcc4',
    title: 'Complete Audit Trail',
    desc: 'Every deposit, release, and approval timestamped. SOC 2 compliant. Ready for audits, tax filing, or insurance claims.',
  },
]

export default function FinanceServicePage() {
  return (
    <div>
      {/* ── PHASE TABS ── */}
      <nav className="fin-phase-bar">
        {phases.map((p) => (
          <Link
            key={p.id}
            href={phaseLinks[p.id]}
            className={`fin-phase-tab ${p.id === 'closeout' ? 'active' : ''}`}
          >
            <span className="fin-phase-dot" />
            {p.label}
          </Link>
        ))}
      </nav>

      {/* ── HERO ── */}
      <section className="fin-hero">
        <div className="fin-hero-badge">
          <span className="fin-badge-dot" />
          FDIC INSURED &middot; SOC 2 COMPLIANT
        </div>
        <div className="fin-hero-layout">
          <div>
            <h1>
              Payments<br />
              <em>Protected</em>
            </h1>
            <p className="fin-hero-sub">
              FDIC-insured escrow accounts with milestone-based releases. Project owners
              control every dollar. Contractors get paid on time. No more payment disputes.
            </p>
            <div className="fin-hero-actions">
              <Link href="/contact" className="fin-btn-emerald">
                Open Escrow Account &mdash; Free
              </Link>
              <Link href="/contact" className="fin-btn-outline-white">
                Learn More
              </Link>
            </div>
          </div>
          <div className="fin-hero-stats">
            <div className="fin-hero-stat-grid">
              <div className="fin-hero-stat">
                <div className="fin-hero-stat-num">$100M+</div>
                <div className="fin-hero-stat-label">Processed through platform</div>
              </div>
              <div className="fin-hero-stat">
                <div className="fin-hero-stat-num">FDIC</div>
                <div className="fin-hero-stat-label">Insured up to $250,000</div>
              </div>
              <div className="fin-hero-stat">
                <div className="fin-hero-stat-num">90%</div>
                <div className="fin-hero-stat-label">Reduction in payment disputes</div>
              </div>
              <div className="fin-hero-stat">
                <div className="fin-hero-stat-num">$0</div>
                <div className="fin-hero-stat-label">Account setup and monthly fees</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW ESCROW WORKS ── */}
      <section className="fin-section" style={{ background: 'var(--fin-cream)' }}>
        <div className="fin-section-label">How Escrow Works</div>
        <h2 className="fin-section-title">
          Secure Payments,<br />Step by Step
        </h2>
        <p className="fin-section-sub">
          From account setup to project closeout &mdash; here&apos;s exactly how Kealee
          Finance protects both owners and contractors.
        </p>

        <div className="fin-workflow">
          {workflowSteps.map((step) => (
            <div className="fin-workflow-step" key={step.num}>
              <div className="fin-workflow-num">
                <div className={`fin-step-circle ${step.circle}`}>{step.num}</div>
              </div>
              <div className="fin-workflow-content">
                <div className={`fin-workflow-phase-tag ${step.tagClass}`}>{step.tag}</div>
                <div className="fin-workflow-title">{step.title}</div>
                <div className="fin-workflow-desc">{step.desc}</div>
                <div className="fin-workflow-chips">
                  {step.chips.map((c) => (
                    <span className="fin-chip" key={c}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST BANNER ── */}
      <div className="fin-trust-banner">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="fin-trust-icon">{'\ud83c\udfe6'}</div>
          <div className="fin-trust-title">FDIC Insured</div>
          <div className="fin-trust-desc">
            All escrow funds are held in FDIC-insured trust accounts, separate from Kealee
            operating funds. Your money is protected up to $250,000.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="fin-trust-icon">{'\ud83d\udd12'}</div>
          <div className="fin-trust-title">SOC 2 Type II</div>
          <div className="fin-trust-desc">
            Our platform meets SOC 2 Type II compliance standards for security, availability,
            and confidentiality. 256-bit encryption on all transactions.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="fin-trust-icon">{'\u2696\ufe0f'}</div>
          <div className="fin-trust-title">Dispute Resolution</div>
          <div className="fin-trust-desc">
            If there&apos;s a disagreement between owner and contractor, our free mediation
            service helps resolve disputes fairly and quickly.
          </div>
        </div>
      </div>

      {/* ── PROTECTIONS ── */}
      <section className="fin-section">
        <div className="fin-section-label">Built-In Protections</div>
        <h2 className="fin-section-title">
          Security for Owners.<br />Certainty for Contractors.
        </h2>
        <p className="fin-section-sub">
          Kealee Finance protects both sides of every transaction. Owners control releases.
          Contractors get guaranteed payment for approved work.
        </p>

        <div className="fin-protection-grid">
          {protections.map((group) => (
            <div className="fin-protection-card" key={group.title}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--fin-navy)', marginBottom: 24 }}>
                {group.title}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {group.items.map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, color: 'var(--fin-gray-700)', lineHeight: 1.5 }}>
                    <span className="fin-protection-check">{'\u2713'}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEE SCHEDULE ── */}
      <section className="fin-section" style={{ background: 'var(--fin-cream)' }}>
        <div className="fin-section-label">Transparent Pricing</div>
        <h2 className="fin-section-title">Clear, Simple Fees</h2>
        <p className="fin-section-sub">
          No hidden costs. No monthly fees. You only pay when funds move.
        </p>

        <div className="fin-fee-table">
          {fees.map((item) => (
            <div className="fin-fee-row" key={item.service}>
              <span style={{ fontSize: 14, color: 'var(--fin-gray-700)', fontWeight: 500 }}>{item.service}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: item.fee === 'Free' ? 'var(--fin-emerald)' : 'var(--fin-navy)' }}>
                {item.fee}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── PLATFORM FEATURES ── */}
      <section className="fin-section">
        <div className="fin-section-label">Platform Features</div>
        <h2 className="fin-section-title">
          Financial Management<br />Built for Construction
        </h2>
        <p className="fin-section-sub">
          Kealee Finance isn&apos;t generic fintech &mdash; it&apos;s built specifically for
          construction projects with milestone payments, lien waivers, and audit trails.
        </p>
        <div className="fin-owner-grid">
          {ownerCards.map((card) => (
            <div className="fin-owner-card" key={card.title}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{card.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--fin-navy)', marginBottom: 8 }}>
                {card.title}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--fin-gray-500)' }}>
                {card.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="fin-cta-section">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 40, fontWeight: 700, color: 'white', lineHeight: 1.15, marginBottom: 16 }}>
            Ready to Protect Your<br />
            <span style={{ color: 'var(--fin-emerald-light)', fontStyle: 'italic' }}>
              Project Payments?
            </span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', marginBottom: 36, fontWeight: 300 }}>
            Open an escrow account in minutes. No monthly fees. FDIC insured.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/contact" className="fin-btn-emerald">
              Open Escrow Account &mdash; Free
            </Link>
            <Link href="/contact" className="fin-btn-outline-white">
              Talk to Our Team
            </Link>
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            FDIC insured. SOC 2 compliant. 256-bit encryption. $100M+ processed.
          </p>
        </div>
      </section>
    </div>
  )
}
