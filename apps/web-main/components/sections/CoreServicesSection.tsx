'use client'

import Link from 'next/link'
import { useVideoModal } from '@/context/video-modal-context'

export default function CoreServicesSection() {
  const { openModal } = useVideoModal()
  return (
    <div className="sec-s" id="concept">
      <div className="sec-s-i">
        <div className="ey">How Kealee works</div>
        <h2 className="h2">Three things we do for you</h2>
        <p className="sub">Free tools are always available. Paid services add professional review and execution. You choose what you need.</p>
        <div className="tg">

          {/* AI CONCEPT */}
          <div className="sc">
            <div className="scimg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=700&q=60&auto=format&fit=crop" alt="AI Concept" />
              <button className="scvp" onClick={() => openModal({ tag: 'AI design engine', title: 'AI Design + Validation — how it works', description: 'You upload photos of your space or lot. Our AI generates a concept floor plan, a design brief, and a room-by-room scope. A staff member checks zoning, structural risk, permit complexity, and cost band. The full report lands in your inbox within 24 hours.', thumbUrl: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=900&q=60&auto=format&fit=crop' })}>
                <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" fill="white" /></svg>
              </button>
            </div>
            <div className="scb">
              <div className="sctag">AI design engine</div>
              <h3>Upload photos.<br />Get a floor plan in 24 hours.</h3>
              <div className="exec">You send photos. We send back a concept layout, zoning check, structural risk flag, cost band, and permit scope. Staff-reviewed before delivery.</div>
              <div className="tl">
                <div className="tr pop"><span className="trn b">AI Concept Report <span className="pp">Start here</span></span><span className="trp">$475</span></div>
                <div className="tr"><span className="trn">Advanced AI Concept — 3 options</span><span className="trp">$595</span></div>
                <div className="tr"><span className="trn">Full Design Package</span><span className="trp">starting at $5,395</span></div>
              </div>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>Pre-design concept only — not a permit-ready plan. <Link href="/design-services" style={{ color: 'var(--o)' }}>Need permit-ready plans?</Link></p>
              <Link href="/concept-engine" className="scta">Start your design</Link>
            </div>
          </div>

          {/* PERMITS */}
          <div className="sc" id="permits">
            <div className="scimg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=700&q=60&auto=format&fit=crop" alt="Permits" />
              <button className="scvp" onClick={() => openModal({ tag: 'Permit services', title: 'Permits — what we file and track', description: 'We fill out your application, prepare your drawings package, and submit to the right agency. If the reviewer sends comments, we respond. You get a tracking link and a notification when it is approved. You do not call the permit office.', thumbUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=900&q=60&auto=format&fit=crop' })}>
                <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" fill="white" /></svg>
              </button>
            </div>
            <div className="scb">
              <div className="sctag">Permit services</div>
              <h3>We file your permit.<br />You get a tracking link.</h3>
              <div className="exec">We know Montgomery DPS, Fairfax LDS, DC DOB, and every other DMV agency. We file, track, respond to comments, and notify you when it is approved.</div>
              <div className="tl">
                <div className="tr"><span className="trn">Permit Guidance + Checklist</span><span className="trp">Free</span></div>
                <div className="tr"><span className="trn">Simple Permit Filing</span><span className="trp">$149</span></div>
                <div className="tr pop"><span className="trn b">Permit Package <span className="pp">Most common</span></span><span className="trp">$1,095</span></div>
                <div className="tr"><span className="trn">Permit Coordination</span><span className="trp">$1,195</span></div>
              </div>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>Requires existing plans or architectural documents. <Link href="/design-services" style={{ color: 'var(--o)' }}>Get plans first →</Link></p>
              <Link href="/permits" className="scta">View permit services</Link>
            </div>
          </div>

          {/* COST ESTIMATES */}
          <div className="sc">
            <div className="scimg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=700&q=60&auto=format&fit=crop" alt="Cost Estimates" />
              <button className="scvp" onClick={() => openModal({ tag: 'Cost estimation', title: 'Cost Estimates — how we calculate your budget', description: 'We generate detailed line-item estimates using RSMeans cost data adjusted for 2026 DMV construction inflation. Every estimate includes a hard cost breakdown, soft cost summary, risk buffer, and contractor overhead. Know what your project should cost before you take a single bid.', thumbUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=900&q=60&auto=format&fit=crop' })}>
                <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" fill="white" /></svg>
              </button>
            </div>
            <div className="scb">
              <div className="sctag">Cost estimation</div>
              <h3>Know your budget<br />before you hire anyone.</h3>
              <div className="exec">Line-item estimates using RSMeans data with 2026 DMV inflation adjustment. Hard cost, soft cost, risk buffer, and contractor overhead — all broken out so you can evaluate every bid.</div>
              <div className="tl">
                <div className="tr pop"><span className="trn b">Detailed Cost Estimate <span className="pp">Most common</span></span><span className="trp">$695</span></div>
                <div className="tr"><span className="trn">Certified Estimate — lender ready</span><span className="trp">$2,195</span></div>
                <div className="tr"><span className="trn">PM Advisory — during construction</span><span className="trp">Starting at $1,150</span></div>
              </div>
              <Link href="/products/detailed-estimate" className="scta">View estimate services</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
