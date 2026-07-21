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
    a: 'The $395 concept report is where most projects start. Every other service — cost estimate, permit filing, PM advisory — is per-service and optional. Your homeowner dashboard, permit checklist, and standard contractor assignment are included with your project.',
  },
  {
    q: 'What is the difference between AI concept and architectural services?',
    a: 'AI concept is a pre-design service: you get a floor plan sketch, cost band, zoning check, and permit scope to help you plan and budget. It is not permit-ready. Architectural services produce licensed, stamped drawings required to pull a permit for complex projects. If your project scores above DCS 41 or exceeds $65,000, we route you to a licensed architect.',
  },
  {
    q: 'Can I use my AI concept to get a permit?',
    a: 'No. AI concept is a pre-design planning tool only. Permit submissions require architect-stamped, jurisdiction-specific construction documents. See our Design Services page for permit-ready plan packages.',
  },
  {
    q: 'When do I need permit-ready plans?',
    a: 'Any structural work, additions, ADUs, finished basements, major electrical or plumbing changes, and new construction require permit-ready drawings. Simple cosmetic work (paint, flooring, cabinet refacing) generally does not. The free Permit Guidance Checklist tells you exactly what your project requires.',
  },
  {
    q: 'Can I use my existing plans for permit services?',
    a: 'Yes. If you already have architect-stamped drawings, upload them during permit intake. We review them for jurisdiction compliance, prepare the submission package, and file on your behalf.',
  },
  {
    q: 'What if I don\'t have plans yet?',
    a: 'Start with AI concept to plan and budget, then move to Design Services for permit-ready drawings. We offer a Design Starter package from $1,200 that produces stamped drawings for straightforward residential projects.',
  },
  {
    q: 'What happens after my AI concept is delivered?',
    a: 'You can move to Design Services for permit-ready plans, start the permit intake directly if you already have plans, request a detailed cost estimate, or browse the contractor marketplace. Your concept report includes a recommended next step.',
  },
  {
    q: 'How does Kealee screen contractors?',
    a: 'Every contractor in our network goes through state license verification (DC, MD, or VA), general liability insurance check, bond verification where required, identity verification, and a credentials review. Verified status is re-checked annually. Contractors are removed immediately on failed re-verification.',
  },
  {
    q: 'How does contractor verification work?',
    a: 'State license check (DC, MD, or VA), general liability insurance verification, bond verification where required, identity verification, and credentials review. Contractor network screened for licensing, insurance, and fit. Verified status re-checked annually. Contractors removed immediately on failed re-verification.',
  },
  {
    q: 'What does milestone pay / escrow protect me from?',
    a: 'Milestone pay prevents contractors from demanding large upfront payments. Funds are held in escrow and released only after you approve each completed phase. You are never required to pay for work not yet done. Each release collects a conditional lien waiver, and the final 10% retainage releases only after punch list sign-off and an unconditional lien waiver.',
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
