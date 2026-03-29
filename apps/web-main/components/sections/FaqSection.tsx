'use client'

import { useState } from 'react'

const FAQS = [
  {
    q: 'What is in the $395 report?',
    a: 'AI floor plan sketch, design brief, room-by-room scope notes, zoning check, structural risk rating, cost band (low–high), permit risk rating, and contractor scope outline. Staff-reviewed before delivery. In your inbox within 24 hours of photo upload.',
  },
  {
    q: 'Do I need a permit for my project?',
    a: 'Most construction in DC, Maryland, and Virginia requires a permit — remodels that touch plumbing or electrical, additions, ADUs, finished basements, decks over a certain size. Simple cosmetic work typically does not. The free Permit Guidance Checklist tells you exactly what your project requires in your county.',
  },
  {
    q: 'How long does a permit take in the DMV?',
    a: 'Fairfax County simple residential: 2–4 weeks. Montgomery County DPS residential: 4–8 weeks. DC Department of Buildings with plan review: 2–5 months. Commercial projects take longer across all jurisdictions. We include current average timelines for your specific jurisdiction in the $395 concept report.',
  },
  {
    q: 'What if my project needs an architect?',
    a: 'We score every project with a Design Complexity Score (DCS). Projects at DCS 41 or above, or with a budget of $65,000 or more, are routed to a licensed architect. Your $395 report still includes a reference sketch, cost band, and zoning notes. AI design alone cannot produce permit-ready drawings for complex projects — we are direct about this.',
  },
  {
    q: 'What is free? What costs money?',
    a: 'Always free: your homeowner or project owner dashboard, the AI estimate, the permit checklist, standard contractor assignment, and self-managed project tracking. The $395 concept report is where most projects start. Every other service — detailed estimate, permit filing, PM advisory — is per-service and optional.',
  },
  {
    q: 'How does contractor verification work?',
    a: 'State license check (DC, MD, or VA), general liability insurance verification, bond verification where required, identity verification, and credentials review. We turned down 40% of applicants in our last intake cycle. Verified status re-checked annually. Contractors removed immediately on failed re-verification.',
  },
  {
    q: 'How does milestone escrow work?',
    a: 'Your project funds are held in escrow from project start. They release to the contractor only after you approve a completed milestone. Each release collects a conditional lien waiver. Final 10% retainage releases after punch list sign-off and unconditional lien waiver receipt. Escrow is standard on all Kealee-coordinated projects at no extra cost.',
  },
  {
    q: 'What areas do you cover?',
    a: "Washington DC, Montgomery County MD, Prince George's County MD, Fairfax County VA, Arlington VA, Alexandria VA, Prince William County VA, Loudoun County VA, Howard County MD, and Anne Arundel County MD. Permit services and contractor matching available across all these jurisdictions.",
  },
]

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="sec-s" id="faq">
      <div className="sec-s-i">
        <div className="ey">FAQ</div>
        <h2 className="h2">Common questions</h2>
        <p className="sub">
          If it is not here, <a href="/contact" style={{ color: 'var(--o)' }}>contact us</a>.
        </p>
        <div className="faq-g">
          {FAQS.map((item, i) => (
            <div key={i} className={`fi${open === i ? ' open' : ''}`}>
              <button className="fq" onClick={() => setOpen(open === i ? null : i)}>
                {item.q}
                <span className="fchev">▾</span>
              </button>
              <div className="fa">{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
