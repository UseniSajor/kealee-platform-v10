'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQ_ITEMS = [
  {
    q: 'What is Kealee?',
    a: 'Kealee is an AI-powered construction platform that connects homeowners, contractors, and real estate developers with the tools they need to plan, permit, and build. We handle AI concept design, building permit filing, contractor matching, and milestone-protected payments — all in one place.',
  },
  {
    q: 'How does the AI Concept Engine work?',
    a: 'You describe your project in plain language — or use our search bar. Our AI analyzes your input, identifies the project type and scope, and generates design concepts, a cost band, permit risk score, and a jurisdiction-specific checklist. Concept packages are delivered within 2–5 business days.',
  },
  {
    q: 'How do permit services work?',
    a: 'After receiving your AI concept or uploading existing drawings, our AI reviews your package against jurisdiction requirements before submission. We file on your behalf and manage responses from plan reviewers. Our first-cycle approval rate is 98% across DC, MD, and VA.',
  },
  {
    q: 'Is Kealee available outside DC/MD/VA?',
    a: 'Our permit filing services currently focus on DC, Maryland, and Virginia jurisdictions. AI Concept Engine, contractor marketplace, and construction OS tools are available nationwide. We\'re expanding to additional permit markets throughout 2026.',
  },
  {
    q: 'How do contractor payments work?',
    a: 'Payments are milestone-based and held in escrow. Before work begins on each phase, funds are deposited to escrow. When the contractor submits completion evidence (photos, lien waivers, inspection records), you review and approve. Funds release instantly upon your approval.',
  },
  {
    q: 'What is a Digital Twin?',
    a: 'A Digital Twin is a live digital model of your project — updated in real time as milestones are completed, inspections are passed, payments are released, and change orders are processed. Available for developer portfolio projects and construction OS accounts.',
  },
]

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <span className="section-label">FAQ</span>
          <h2 className="mt-3 text-3xl font-bold font-display sm:text-4xl" style={{ color: '#1A2B4A' }}>
            Common questions
          </h2>
        </div>

        <div className="divide-y" style={{ borderTop: '1px solid var(--border, #E2E1DC)', borderBottom: '1px solid var(--border, #E2E1DC)' }}>
          {FAQ_ITEMS.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between py-5 text-left transition-colors hover:text-[#C8521A]"
              >
                <span className="pr-4 text-base font-semibold" style={{ color: open === i ? '#C8521A' : '#1A1C1B' }}>
                  {item.q}
                </span>
                <ChevronDown
                  className="h-4 w-4 flex-shrink-0 transition-transform"
                  style={{ color: open === i ? '#C8521A' : '#9CA3AF', transform: open === i ? 'rotate(180deg)' : 'none' }}
                />
              </button>
              {open === i && (
                <div className="pb-5">
                  <p className="text-sm leading-relaxed text-gray-500">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
