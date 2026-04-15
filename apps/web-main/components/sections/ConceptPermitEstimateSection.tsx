'use client'

import Link from 'next/link'

const STEPS = [
  {
    num: '01',
    tag: 'AI Concept',
    heading: 'Floor plan + zoning check in 24 hours',
    body: 'Upload photos of your space or lot. Our AI generates concept layouts, flags structural risk, identifies permit requirements, and delivers a cost band — staff-reviewed before it reaches you.',
    price: '$475',
    priceLabel: 'AI Concept Report',
    turnaround: '24-hour delivery',
    cta: 'Start AI Concept',
    href: '/concept-engine',
    color: '#E8793A',
    img: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=600&q=60&auto=format&fit=crop',
  },
  {
    num: '02',
    tag: 'Permits',
    heading: 'We file, track, and respond to comments',
    body: 'We handle the paperwork for DC DOB, Montgomery DPS, Fairfax LDS, and every other DMV agency. Submit your documents, we prepare the package, file it, and notify you when it is approved.',
    price: '$1,095',
    priceLabel: 'Permit Package',
    turnaround: 'We file everything',
    cta: 'View Permit Services',
    href: '/permits',
    color: '#4A8FA8',
    img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=60&auto=format&fit=crop',
  },
  {
    num: '03',
    tag: 'Cost Estimates',
    heading: 'Know your budget before you take a bid',
    body: 'Line-item estimates using RSMeans data adjusted for 2026 DMV construction costs. Hard cost, soft cost, risk buffer, and contractor overhead — broken out so you can evaluate every bid you receive.',
    price: '$695',
    priceLabel: 'Detailed Cost Estimate',
    turnaround: 'Know your numbers',
    cta: 'Get Cost Estimate',
    href: '/products/detailed-estimate',
    color: '#2D6A4F',
    img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=60&auto=format&fit=crop',
  },
]

export default function ConceptPermitEstimateSection() {
  return (
    <section className="cpe-section" aria-label="AI Concept, Permits, and Estimates">
      <div className="cpe-inner">
        <div className="cpe-header">
          <div className="ey">The Kealee journey</div>
          <h2 className="h2">Concept → Permit → Estimate</h2>
          <p className="sub">Three professional services. One platform. Every DMV jurisdiction covered.</p>
        </div>

        <div className="cpe-steps">
          {STEPS.map((step) => (
            <div key={step.num} className="cpe-step">
              <div className="cpe-step-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={step.img} alt={step.tag} />
                <div className="cpe-step-num" style={{ background: step.color }}>{step.num}</div>
              </div>
              <div className="cpe-step-body">
                <div className="cpe-step-tag" style={{ color: step.color }}>{step.tag}</div>
                <h3 className="cpe-step-h">{step.heading}</h3>
                <p className="cpe-step-p">{step.body}</p>
                <div className="cpe-step-price-row">
                  <div className="cpe-step-price">
                    <span className="cpe-price-num" style={{ color: step.color }}>{step.price}</span>
                    <span className="cpe-price-label">{step.priceLabel}</span>
                  </div>
                  <div className="cpe-step-badge">{step.turnaround}</div>
                </div>
                <Link href={step.href} className="cpe-step-cta" style={{ background: step.color }}>
                  {step.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="cpe-bundle-bar">
          <span className="cpe-bundle-text">
            Need all three? The <strong>ADU Concept + Permit Bundle</strong> combines AI Concept + full permit filing.
          </span>
          <Link href="/products/adu-bundle" className="cpe-bundle-cta">See ADU Bundle — $1,595</Link>
        </div>
      </div>
    </section>
  )
}
