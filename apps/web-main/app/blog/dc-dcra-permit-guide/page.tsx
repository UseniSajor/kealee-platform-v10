import type { Metadata } from 'next'
import Link from 'next/link'
import { PERMIT_STANDARD_PRICE, PERMIT_BASIC_PRICE } from '@/lib/marketing/pricing'

export const metadata: Metadata = {
  title: 'DC DCRA Permit Guide 2026 — What Homeowners Need to Know | Kealee',
  description: `Complete guide to DC building permits through the DCRA (now DLCP). Requirements, fees, timelines, and professional permit filing from $${PERMIT_STANDARD_PRICE}. Updated for 2026.`,
  keywords: ['DC building permit', 'DCRA permit guide', 'Washington DC permit', 'DLCP permit DC', 'DC renovation permit'],
  openGraph: {
    title: 'DC DCRA Permit Guide 2026 — What Homeowners Need to Know',
    description: 'Everything DC homeowners need to know about building permits — DCRA requirements, fees, timelines, and professional filing.',
    type: 'article',
    url: 'https://kealee.com/blog/dc-dcra-permit-guide',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'DC DCRA Permit Guide 2026 — What Homeowners Need to Know',
  description: 'Complete guide to building permits in Washington DC through the DLCP (formerly DCRA).',
  author: { '@type': 'Organization', name: 'Kealee' },
  publisher: {
    '@type': 'Organization',
    name: 'Kealee',
    logo: { '@type': 'ImageObject', url: 'https://kealee.com/logo.png' },
  },
  datePublished: '2026-05-01',
  dateModified:  '2026-05-07',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://kealee.com/blog/dc-dcra-permit-guide' },
}

export default function DCDCRAPermitGuidePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px 80px', fontFamily: 'sans-serif', color: '#2D3748', lineHeight: 1.75 }}>

        <div style={{ marginBottom: 32 }}>
          <span style={{ background: 'rgba(26,43,74,0.1)', color: '#1A2B4A', borderRadius: 999, padding: '3px 12px', fontSize: 13, fontWeight: 600 }}>
            Permits · Washington DC
          </span>
          <h1 style={{ color: '#1A2B4A', fontSize: 34, fontWeight: 800, marginTop: 12, marginBottom: 8, lineHeight: 1.2 }}>
            DC Building Permit Guide 2026 — What Homeowners Need to Know
          </h1>
          <p style={{ color: '#718096', fontSize: 14 }}>
            By Kealee · Updated May 2026 · 10 min read · Permits
          </p>
        </div>

        <p>
          Getting a building permit in Washington DC is one of the more complex permit processes in the Mid-Atlantic region. The District&apos;s permitting authority — now called the <strong>Department of Licensing and Consumer Protection (DLCP)</strong>, formerly DCRA — administers building permits, plan reviews, and inspections for all renovation and construction work in the District.
        </p>
        <p>
          This guide is updated for 2026 and covers what projects require permits, how to apply, typical fees and timelines, and how to avoid the most common delays.
        </p>

        <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>
          DCRA Is Now DLCP — What Changed?
        </h2>
        <p>
          In 2023, the DC Department of Consumer and Regulatory Affairs (DCRA) was reorganized into two agencies:
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li><strong>DLCP (Department of Licensing and Consumer Protection)</strong> — now handles building permits, inspections, contractor licensing, and business licensing. This is the agency you&apos;ll interact with for home renovation permits.</li>
          <li><strong>DCRA (Department of Code Compliance)</strong> — handles code enforcement and housing code complaints.</li>
        </ul>
        <p>
          For practical purposes, DC homeowners seeking building permits should use DLCP&apos;s online portal: <strong>permits.dc.gov</strong>. Phone inquiries go to the DLCP permit center.
        </p>

        <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>
          What Requires a Building Permit in DC?
        </h2>
        <p>
          DC requires a building permit for a broad range of home renovation and construction activities. Projects that require a permit include:
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li>Structural changes — removing, adding, or modifying load-bearing walls</li>
          <li>Room additions and bump-outs</li>
          <li>Deck, porch, and patio construction (if elevated or attached)</li>
          <li>Kitchen remodels involving electrical, plumbing, or structural changes</li>
          <li>Bathroom remodels with plumbing relocation</li>
          <li>Basement finishing (egress window additions, new bedrooms, electrical)</li>
          <li>HVAC system replacement or new installation</li>
          <li>Electrical panel upgrades and new circuit additions</li>
          <li>Window and door replacements that change opening size</li>
          <li>Roofing work (replacement with structural changes, or new flat roof systems)</li>
          <li>Fence construction over 4 feet tall</li>
          <li>ADU (Accessory Dwelling Unit) construction</li>
        </ul>
        <p>
          <strong>Projects that typically do NOT require a permit in DC:</strong> Painting, wallpaper, flooring replacement (non-structural), cabinet replacements (no plumbing/electrical move), like-for-like appliance replacement.
        </p>

        <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>
          Types of DC Building Permits
        </h2>
        <p>
          DC issues several types of building permits depending on project scope:
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li>
            <strong>Building Permit (B):</strong> Required for structural work, additions, new construction, and significant renovation.
          </li>
          <li>
            <strong>Electrical Permit (E):</strong> Required for all electrical work beyond minor repairs.
          </li>
          <li>
            <strong>Mechanical Permit (M):</strong> Required for HVAC, gas piping, and mechanical systems.
          </li>
          <li>
            <strong>Plumbing Permit (P):</strong> Required for plumbing work beyond minor repairs.
          </li>
          <li>
            <strong>Raze Permit:</strong> Required for demolition of any structure.
          </li>
          <li>
            <strong>Special Inspection Permit:</strong> Required for certain structural materials and systems.
          </li>
        </ul>
        <p>
          Most home renovation projects require a Building Permit plus trade permits (Electrical, Mechanical, Plumbing) depending on the scope of work.
        </p>

        <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>
          How to Apply for a DC Building Permit
        </h2>
        <p>
          DC building permit applications are submitted through the online portal at <strong>permits.dc.gov</strong>. The process:
        </p>
        <ol style={{ paddingLeft: 24 }}>
          <li>
            <strong>Create an account</strong> on permits.dc.gov. The property owner or a licensed contractor can apply.
          </li>
          <li>
            <strong>Complete the permit application</strong> — include project description, estimated cost of work, property information (Square, Suffix, Lot from tax records), and contractor information.
          </li>
          <li>
            <strong>Upload drawings and documents:</strong>
            <ul style={{ paddingLeft: 20, marginTop: 8 }}>
              <li>Architectural/structural drawings (PDF, min 1/4&quot; = 1&apos; scale)</li>
              <li>Site plan showing property boundaries and existing structures</li>
              <li>MEP drawings (if applicable)</li>
              <li>Historic preservation approval (if property is in a historic district — very common in DC)</li>
              <li>DOEE stormwater management form (for projects disturbing 5,000+ sq ft of soil)</li>
            </ul>
          </li>
          <li>
            <strong>Pay permit fees</strong> at time of application.
          </li>
          <li>
            <strong>Wait for plan review.</strong> DC uses an over-the-counter (OTC) review for simple projects and a full plan review for complex projects.
          </li>
        </ol>

        <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>
          DC Building Permit Fees (2026)
        </h2>
        <p>
          DC permit fees are calculated as a percentage of the estimated cost of construction. The 2026 fee schedule:
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li><strong>Building permit:</strong> 1.5% of estimated construction cost (minimum $50)</li>
          <li><strong>Electrical permit:</strong> 1.5% of electrical work cost (minimum $50)</li>
          <li><strong>Mechanical permit:</strong> 1.5% of mechanical work cost</li>
          <li><strong>Plumbing permit:</strong> 1.5% of plumbing work cost</li>
          <li><strong>Plan review fee:</strong> Approximately 25–35% of permit fee</li>
          <li><strong>DC surcharge:</strong> Additional 3–5%</li>
        </ul>
        <p>
          <strong>Example:</strong> A kitchen remodel with a $60,000 estimated construction cost would generate approximately $900–$1,200 in total permit fees.
        </p>
        <p>
          For a full home addition at $300,000 estimated cost, total DC permit fees typically run <strong>$5,000–$7,500</strong>.
        </p>

        <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>
          DC Permit Review Timelines (2026)
        </h2>
        <p>
          DLCP permit review timelines in DC are among the longest in the DMV:
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li><strong>Over-the-counter (OTC) simple projects:</strong> Same-day to 5 business days</li>
          <li><strong>Standard residential plan review:</strong> 6–10 weeks</li>
          <li><strong>Complex projects (additions, structural):</strong> 10–16 weeks</li>
          <li><strong>Historic Preservation Review (HPO):</strong> Add 4–8 weeks (required in all historic districts)</li>
          <li><strong>Projects in R-5 or R-6 zones:</strong> May require Board of Zoning Adjustment (BZA) hearing — add 3–6 months</li>
        </ul>
        <p>
          DC is known for permit delays. Budget 3–4 months of permit timeline for any significant renovation in the District. For historic properties or addition projects, 6 months is more realistic.
        </p>

        <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>
          Historic Preservation in DC — A Major Consideration
        </h2>
        <p>
          Approximately 30% of DC residential properties are located in Historic Districts (Capitol Hill, Georgetown, LeDroit Park, Takoma Park, and dozens more). In historic districts, exterior changes require approval from the <strong>Historic Preservation Office (HPO)</strong> before a building permit is issued.
        </p>
        <p>
          HPO review adds time and constraints:
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li>Window and door replacements must match historic profiles and materials</li>
          <li>Additions must be setback from the historic facade (typically not visible from the street)</li>
          <li>Rooftop additions require HPO approval and often cannot exceed specific height limits</li>
          <li>Exterior materials (siding, brick, stucco) must match or complement the historic character</li>
        </ul>
        <p>
          If you don&apos;t know whether your property is in a historic district, check the DC Office of Planning&apos;s Historic Preservation map (planning.dc.gov/hpra).
        </p>

        <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>
          How Kealee Helps DC Homeowners With Permits
        </h2>
        <p>
          DC permit complexity is exactly why Kealee exists. Our permit team has filed hundreds of DC building permits across all project types — kitchen remodels, additions, basement finishes, decks, and full gut renovations.
        </p>
        <p>Our DC permit service includes:</p>
        <ul style={{ paddingLeft: 24 }}>
          <li>Permit path assessment (what permits are required for your scope)</li>
          <li>Historic district compliance review</li>
          <li>Application preparation and DLCP submission</li>
          <li>Plan reviewer comment response</li>
          <li>HPO submission if applicable</li>
          <li>Status tracking through issuance</li>
        </ul>
        <p>
          Permit assessment packages start at <strong>${PERMIT_BASIC_PRICE}</strong>. Full permit filing packages start at <strong>${PERMIT_STANDARD_PRICE}</strong>.
        </p>

        <div style={{ background: '#F7FAFC', borderRadius: 12, padding: 28, textAlign: 'center', marginTop: 40 }}>
          <h3 style={{ color: '#1A2B4A', fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>
            Need a DC building permit filed?
          </h3>
          <p style={{ color: '#4A5568', margin: '0 0 20px' }}>
            Kealee handles the entire DC permit process — from application to approval.
          </p>
          <Link
            href="/permits"
            style={{ display: 'inline-block', background: '#2ABFBF', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 16, padding: '14px 32px', borderRadius: 12 }}
          >
            Start My DC Permit — from ${PERMIT_STANDARD_PRICE} →
          </Link>
        </div>

        <div style={{ marginTop: 48 }}>
          <h3 style={{ color: '#1A2B4A', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Related Articles</h3>
          <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
            <li style={{ marginBottom: 8 }}>
              <Link href="/blog/deck-permit-pg-county" style={{ color: '#2ABFBF', fontWeight: 600 }}>
                Deck Permit in Prince George&apos;s County, MD →
              </Link>
            </li>
            <li style={{ marginBottom: 8 }}>
              <Link href="/blog/home-addition-cost-dmv" style={{ color: '#2ABFBF', fontWeight: 600 }}>
                Home Addition Cost in the DMV — 2026 →
              </Link>
            </li>
            <li>
              <Link href="/blog/basement-finish-northern-virginia" style={{ color: '#2ABFBF', fontWeight: 600 }}>
                Finishing a Basement in Northern Virginia →
              </Link>
            </li>
          </ul>
        </div>

      </article>
    </>
  )
}
