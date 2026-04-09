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
                <div className="tr pop"><span className="trn b">Starter — up to 800 sq ft <span className="pp">Start here</span></span><span className="trp">$599</span></div>
                <div className="tr"><span className="trn">Professional — up to 3,000 sq ft</span><span className="trp">$1,299</span></div>
                <div className="tr"><span className="trn">Enterprise — 3,000+ sq ft</span><span className="trp">CFQ</span></div>
              </div>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>Pre-design concept only — not a permit-ready plan. <Link href="/architect-vip" style={{ color: 'var(--o)' }}>Need permit-ready drawings?</Link></p>
              <Link href="/intake-wizard" className="scta">Start your design</Link>
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
                <div className="tr"><span className="trn">Standard — Kealee files + biweekly updates</span><span className="trp">$495</span></div>
                <div className="tr pop"><span className="trn b">Multi-Trade <span className="pp">Most common</span></span><span className="trp">$895</span></div>
                <div className="tr"><span className="trn">Full Service — unlimited revisions</span><span className="trp">$1,495</span></div>
                <div className="tr"><span className="trn">Expedited add-on</span><span className="trp">+$495</span></div>
              </div>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>Requires existing plans or architectural documents. <Link href="/design-services" style={{ color: 'var(--o)' }}>Get plans first →</Link></p>
              <Link href="/permits" className="scta">View permit services</Link>
            </div>
          </div>

          {/* BUILD */}
          <div className="sc">
            <div className="scimg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=700&q=60&auto=format&fit=crop" alt="Build" />
              <button className="scvp" onClick={() => openModal({ tag: 'Build your project', title: 'Build your project — what the platform tracks', description: 'Every milestone, document, pay application, and site photo lives in your project dashboard. You approve each milestone before any payment releases. Your contractor cannot receive funds without your sign-off.', thumbUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=60&auto=format&fit=crop' })}>
                <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" fill="white" /></svg>
              </button>
            </div>
            <div className="scb">
              <div className="sctag">Build your project</div>
              <h3>Every milestone, payment,<br />and document in one place.</h3>
              <div className="exec">Your contractor cannot receive payment until you approve the milestone. Every document, inspection photo, and pay application is logged automatically.</div>
              <div className="tl">
                <div className="tr"><span className="trn">Self-managed dashboard</span><span className="trp">Free</span></div>
                <div className="tr pop"><span className="trn b">PM Advisory <span className="pp">Most common</span></span><span className="trp">$950</span></div>
                <div className="tr"><span className="trn">PM Oversight</span><span className="trp">$2,950</span></div>
              </div>
              <Link href="/products/pm-advisory" className="scta">View PM services</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
