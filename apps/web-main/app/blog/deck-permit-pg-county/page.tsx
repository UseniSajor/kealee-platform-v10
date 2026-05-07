import type { Metadata } from 'next'
import Link from 'next/link'
import { PERMIT_STANDARD_PRICE, CONCEPT_KITCHEN_PRICE } from '@kealee/core-rules'

export const metadata: Metadata = {
  title: 'Deck Permit in Prince George\'s County, MD — Complete 2026 Guide | Kealee',
  description: `Everything homeowners need to know about getting a deck permit in Prince George's County, MD — requirements, costs, timelines, and how Kealee files permits from $${PERMIT_STANDARD_PRICE}.`,
  keywords: ['deck permit Prince Georges County', 'PG County deck permit', 'Maryland deck permit', 'deck building permit MD'],
  openGraph: {
    title: 'Deck Permit in Prince George\'s County, MD — 2026 Guide',
    description: `Step-by-step guide to deck permits in PG County. Requirements, fees, timelines, and professional filing from $${PERMIT_STANDARD_PRICE}.`,
    type: 'article',
    url: 'https://kealee.com/blog/deck-permit-pg-county',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Deck Permit in Prince George\'s County, MD — Complete 2026 Guide',
  description: `Complete guide to obtaining a deck permit in Prince George's County, Maryland in 2026.`,
  author: { '@type': 'Organization', name: 'Kealee' },
  publisher: {
    '@type': 'Organization',
    name: 'Kealee',
    logo: { '@type': 'ImageObject', url: 'https://kealee.com/logo.png' },
  },
  datePublished: '2026-05-01',
  dateModified:  '2026-05-07',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://kealee.com/blog/deck-permit-pg-county' },
}

export default function DeckPermitPGCountyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px 80px', fontFamily: 'sans-serif', color: '#2D3748', lineHeight: 1.75 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <span style={{ background: 'rgba(42,191,191,0.1)', color: '#2ABFBF', borderRadius: 999, padding: '3px 12px', fontSize: 13, fontWeight: 600 }}>
            Permits · Prince George&apos;s County
          </span>
          <h1 style={{ color: '#1A2B4A', fontSize: 34, fontWeight: 800, marginTop: 12, marginBottom: 8, lineHeight: 1.2 }}>
            Deck Permit in Prince George&apos;s County, MD — Complete 2026 Guide
          </h1>
          <p style={{ color: '#718096', fontSize: 14 }}>
            By Kealee · Updated May 2026 · 8 min read · Permits
          </p>
        </div>

        {/* Intro */}
        <p>
          Building or replacing a deck in Prince George&apos;s County (PG County), Maryland requires a building permit in almost every case. Whether you&apos;re adding a new deck, expanding an existing one, or replacing structural members, the PG County Department of Permitting, Inspections, and Enforcement (DPIE) requires a permit before any work begins.
        </p>
        <p>
          This guide covers everything you need to know: when a permit is required, what documents you&apos;ll need, fees, timelines, and how to avoid the most common mistakes that delay approvals.
        </p>

        {/* When a permit is required */}
        <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>
          When Is a Deck Permit Required in PG County?
        </h2>
        <p>
          In Prince George&apos;s County, a building permit is required for any deck that:
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li>Is attached to the house (ledger-mounted decks always require a permit)</li>
          <li>Is elevated more than 30 inches above grade at any point</li>
          <li>Has a total area greater than 200 square feet</li>
          <li>Includes structural elements such as posts, beams, or footings</li>
          <li>Has a roof, pergola, or overhead structure attached</li>
          <li>Includes electrical outlets, lighting circuits, or fans</li>
        </ul>
        <p>
          <strong>Exception:</strong> A ground-level platform deck under 200 sq ft that is not attached to the house and is no more than 30 inches above grade at any point typically does not require a permit in PG County. However, this is uncommon — most homeowners building a functional deck will need a permit.
        </p>

        {/* What you need */}
        <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>
          What You Need to Apply for a Deck Permit in PG County
        </h2>
        <p>
          The PG County DPIE requires the following documents for a residential deck permit application:
        </p>
        <ol style={{ paddingLeft: 24 }}>
          <li>
            <strong>Building permit application form</strong> — completed with property address, owner information, contractor information (license number required), and scope of work description.
          </li>
          <li>
            <strong>Site plan (plot plan)</strong> — shows the property boundaries, existing structures, and location of the proposed deck. A survey or tax map with the deck location drawn to scale is typically acceptable.
          </li>
          <li>
            <strong>Construction drawings</strong> — plan view (top-down), elevation views (front and side), and a cross-section showing framing, connections, and footing details. Drawings must be signed by the property owner or a licensed contractor.
          </li>
          <li>
            <strong>Structural calculations</strong> — required for elevated decks with spans or loads that exceed standard prescriptive tables in the International Residential Code (IRC). Often required for decks over 200 sq ft or with unusual span configurations.
          </li>
          <li>
            <strong>HOA approval letter</strong> — if your property is governed by an HOA, you&apos;ll need written approval before DPIE will issue the permit. Get this first — it can take 2–4 weeks.
          </li>
          <li>
            <strong>Contractor license and insurance</strong> — the contractor must be licensed in Maryland. A certificate of general liability insurance is required.
          </li>
        </ol>

        {/* Fees */}
        <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>
          Deck Permit Fees in Prince George&apos;s County
        </h2>
        <p>
          PG County permit fees are calculated based on the estimated cost of construction. As of 2026, the fee schedule is approximately:
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li><strong>Base fee:</strong> $50–$100 (application processing)</li>
          <li><strong>Construction valuation fee:</strong> Approximately $8–$12 per $1,000 of estimated construction cost</li>
          <li><strong>State surcharge:</strong> $10–$25</li>
        </ul>
        <p>
          For a typical 400 sq ft deck costing $20,000–$30,000 to construct, total permit fees generally range from <strong>$300 to $600</strong>.
        </p>
        <p>
          Note: Fees are subject to change. Always verify the current fee schedule directly with PG County DPIE at dpie.co.pg.md.us.
        </p>

        {/* Timeline */}
        <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>
          How Long Does a Deck Permit Take in PG County?
        </h2>
        <p>
          PG County permit review timelines vary based on application volume and the complexity of your project. Typical ranges in 2026:
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li><strong>Standard residential deck:</strong> 3–6 weeks from complete application to permit issuance</li>
          <li><strong>Over-the-counter (simple decks):</strong> Same-day approval is sometimes available for simple, pre-engineered deck designs</li>
          <li><strong>Complex or large decks with structural calculations:</strong> 6–10 weeks</li>
          <li><strong>HOA approval delay:</strong> Add 2–4 weeks before submitting if HOA approval is required</li>
        </ul>
        <p>
          <strong>Important:</strong> Do not begin any construction — including digging footings — until your permit is issued and posted at the job site. Unpermitted work in PG County can result in stop-work orders, fines, and required demolition.
        </p>

        {/* Common mistakes */}
        <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>
          Common Deck Permit Mistakes in PG County
        </h2>
        <p>
          Based on our permit filing experience in PG County, these are the most common reasons applications are rejected or delayed:
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li><strong>Missing HOA approval:</strong> DPIE will not review applications without HOA sign-off if the property is in an HOA. Always get this first.</li>
          <li><strong>Insufficient structural drawings:</strong> Hand-sketched drawings without dimensions, connection details, or footing specifications are routinely rejected.</li>
          <li><strong>Unlicensed contractor:</strong> The contractor must hold a valid Maryland contractor license. Out-of-state or unlicensed contractors are a common rejection reason.</li>
          <li><strong>Incorrect property information:</strong> Address, tax ID, or owner name mismatches cause delays. Verify against the property deed before submitting.</li>
          <li><strong>Starting work before permit issuance:</strong> If DPIE inspectors observe construction activity before permit posting, a stop-work order is issued immediately.</li>
        </ul>

        {/* Inspections */}
        <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>
          Required Inspections for a PG County Deck
        </h2>
        <p>
          After your permit is issued and work begins, PG County requires the following inspections:
        </p>
        <ol style={{ paddingLeft: 24 }}>
          <li><strong>Footing inspection:</strong> Required before concrete is poured into footing holes. The inspector verifies hole depth, diameter, and soil conditions.</li>
          <li><strong>Framing inspection:</strong> Required after all structural framing is complete but before any decking, fascia, or skirting is installed. Inspects post sizes, beam spans, joist spacing, ledger connections, and railing post attachment.</li>
          <li><strong>Final inspection:</strong> Required after all work is complete. Inspects guardrails, balusters, stair dimensions, landing, and overall completeness.</li>
        </ol>
        <p>
          Each inspection must be scheduled with DPIE in advance. Allow 2–5 business days for scheduling.
        </p>

        {/* How Kealee helps */}
        <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>
          How Kealee Can Help With Your PG County Deck Permit
        </h2>
        <p>
          Kealee&apos;s permit team handles the entire deck permit process for homeowners in Prince George&apos;s County:
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li>Permit application preparation with all required documents</li>
          <li>Coordination with your contractor for license and insurance documents</li>
          <li>Submission to PG County DPIE (in person or online)</li>
          <li>Status tracking and response to plan reviewer comments</li>
          <li>Inspection coordination and scheduling</li>
        </ul>
        <p>
          Permit packages start at <strong>${PERMIT_STANDARD_PRICE}</strong>. If you don&apos;t yet have a deck design, our AI concept packages start at <strong>${CONCEPT_KITCHEN_PRICE}</strong> and include permit scope identification — so you know exactly what you&apos;ll need before you hire a contractor.
        </p>

        {/* CTA */}
        <div style={{ background: '#F7FAFC', borderRadius: 12, padding: 28, textAlign: 'center', marginTop: 40 }}>
          <h3 style={{ color: '#1A2B4A', fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>
            Ready to get your PG County deck permit filed?
          </h3>
          <p style={{ color: '#4A5568', margin: '0 0 20px' }}>
            Our permit team handles everything — from application prep to final approval.
          </p>
          <Link
            href="/permits"
            style={{
              display: 'inline-block',
              background: '#2ABFBF',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 16,
              padding: '14px 32px',
              borderRadius: 12,
            }}
          >
            Start My Deck Permit — from ${PERMIT_STANDARD_PRICE} →
          </Link>
        </div>

        {/* Related */}
        <div style={{ marginTop: 48 }}>
          <h3 style={{ color: '#1A2B4A', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Related Articles</h3>
          <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
            <li style={{ marginBottom: 8 }}>
              <Link href="/blog/dc-dcra-permit-guide" style={{ color: '#2ABFBF', fontWeight: 600 }}>
                DC DCRA Permit Guide — What Homeowners Need to Know →
              </Link>
            </li>
            <li style={{ marginBottom: 8 }}>
              <Link href="/blog/home-addition-cost-dmv" style={{ color: '#2ABFBF', fontWeight: 600 }}>
                Home Addition Cost in the DMV — 2026 Guide →
              </Link>
            </li>
            <li>
              <Link href="/blog/basement-finish-northern-virginia" style={{ color: '#2ABFBF', fontWeight: 600 }}>
                Finishing a Basement in Northern Virginia — Permits, Costs & Timeline →
              </Link>
            </li>
          </ul>
        </div>

      </article>
    </>
  )
}
