import type { Metadata } from 'next'
import Link from 'next/link'
import { CONCEPT_KITCHEN_PRICE, PERMIT_STANDARD_PRICE } from '@/lib/marketing/pricing'

export const metadata: Metadata = {
  title: 'Finishing a Basement in Northern Virginia — Permits, Costs & Timeline 2026 | Kealee',
  description: `Complete guide to basement finishing projects in Fairfax County, Arlington, and Northern Virginia — permit requirements, costs ($25k–$80k), and timelines. Concept packages from $${CONCEPT_KITCHEN_PRICE}.`,
  keywords: ['basement finishing Northern Virginia', 'basement permit Fairfax County', 'basement remodel Virginia', 'finished basement cost VA', 'basement bedroom egress Northern Virginia'],
  openGraph: {
    title: 'Finishing a Basement in Northern Virginia — 2026 Guide',
    description: 'Permits, costs, timelines, and egress requirements for basement finishing projects in Fairfax County, Arlington, and Northern VA.',
    type: 'article',
    url: 'https://kealee.com/blog/basement-finish-northern-virginia',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Finishing a Basement in Northern Virginia — Permits, Costs & Timeline 2026',
  description: 'Guide to basement finishing projects in Northern Virginia including permits, costs, and egress requirements.',
  author: { '@type': 'Organization', name: 'Kealee' },
  publisher: {
    '@type': 'Organization',
    name: 'Kealee',
    logo: { '@type': 'ImageObject', url: 'https://kealee.com/logo.png' },
  },
  datePublished: '2026-05-01',
  dateModified:  '2026-05-07',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://kealee.com/blog/basement-finish-northern-virginia' },
}

export default function BasementFinishNorthernVirginiaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px 80px', fontFamily: 'sans-serif', color: '#2D3748', lineHeight: 1.75 }}>

        <div style={{ marginBottom: 32 }}>
          <span style={{ background: 'rgba(56,161,105,0.1)', color: '#38A169', borderRadius: 999, padding: '3px 12px', fontSize: 13, fontWeight: 600 }}>
            Cost Guides · Northern Virginia
          </span>
          <h1 style={{ color: '#1A2B4A', fontSize: 34, fontWeight: 800, marginTop: 12, marginBottom: 8, lineHeight: 1.2 }}>
            Finishing a Basement in Northern Virginia — Permits, Costs &amp; Timeline 2026
          </h1>
          <p style={{ color: '#718096', fontSize: 14 }}>
            By Kealee · Updated May 2026 · 9 min read · Cost Guides
          </p>
        </div>

        <p>
          Finishing an unfinished basement is one of the highest-ROI home improvement projects in Northern Virginia. With median home sizes in Fairfax County, Arlington, and Loudoun County offering 800–1,500 sq ft of unfinished basement space, a well-executed basement finish can add a bedroom, bathroom, home office, media room, or rental unit — and meaningfully increase home value.
        </p>
        <p>
          But basement finishing in Northern Virginia is not a permit-free project. This guide covers what permits are required, typical costs in 2026, egress requirements for basement bedrooms, and how to avoid the most common mistakes.
        </p>

        <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>
          Does Finishing a Basement in Northern Virginia Require a Permit?
        </h2>
        <p>
          <strong>Yes, in virtually every case.</strong> In Fairfax County, Arlington, Loudoun County, Prince William County, Alexandria, and other Northern Virginia jurisdictions, finishing an unfinished basement requires a building permit whenever the work includes:
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li>Framing new interior walls</li>
          <li>Adding or extending electrical circuits</li>
          <li>Adding or modifying plumbing (for a basement bathroom or wet bar)</li>
          <li>Installing HVAC supply or return in newly finished space</li>
          <li>Adding egress windows for bedroom use</li>
          <li>Installing insulation and drywall in previously unfinished space</li>
          <li>Adding or modifying a smoke detection system</li>
        </ul>
        <p>
          Essentially: if it&apos;s more than paint and flooring on an already-finished space, a permit is required. Attempting to finish a basement without permits in Northern Virginia creates significant liability at resale — lenders and buyers will spot unpermitted basement space.
        </p>

        <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>
          Basement Finishing Permit Requirements by Jurisdiction
        </h2>

        <h3 style={{ color: '#1A2B4A', fontSize: 19, fontWeight: 600, marginTop: 24, marginBottom: 8 }}>Fairfax County</h3>
        <p>
          Fairfax County Department of Land Development Services (DLDS) requires a <strong>Building Permit (Residential Alteration)</strong> for basement finishing. Applications are submitted online through the Fairfax County Land Development Portal (ldpfairfaxcountyva.gov). Trade permits (electrical, plumbing, mechanical) are pulled separately by licensed subcontractors.
        </p>
        <p>
          Fairfax County review timelines in 2026: <strong>4–8 weeks</strong> for standard residential alterations.
        </p>

        <h3 style={{ color: '#1A2B4A', fontSize: 19, fontWeight: 600, marginTop: 24, marginBottom: 8 }}>Arlington County</h3>
        <p>
          Arlington County Department of Community Planning, Housing and Development (CPHD) handles building permits. Arlington is one of the more involved Northern Virginia jurisdictions — expect <strong>6–10 weeks</strong> for plan review and strict compliance with the Virginia Uniform Statewide Building Code (USBC).
        </p>

        <h3 style={{ color: '#1A2B4A', fontSize: 19, fontWeight: 600, marginTop: 24, marginBottom: 8 }}>Loudoun County</h3>
        <p>
          Loudoun County Department of Building and Development (DBD) processes residential alteration permits. Review times are generally faster than inner suburbs — <strong>3–6 weeks</strong> for most basement finishing projects.
        </p>

        <h3 style={{ color: '#1A2B4A', fontSize: 19, fontWeight: 600, marginTop: 24, marginBottom: 8 }}>City of Alexandria</h3>
        <p>
          Alexandria has its own permitting department. Historic districts in Old Town create additional review steps. Timeline: <strong>6–10 weeks</strong> depending on scope and location.
        </p>

        <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>
          Egress Requirements for Basement Bedrooms in Virginia
        </h2>
        <p>
          Adding a bedroom in a basement in Northern Virginia requires a code-compliant egress window. Under the Virginia USBC (based on the IRC), basement sleeping rooms require:
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li><strong>Minimum opening:</strong> 5.7 square feet net clear opening</li>
          <li><strong>Minimum width:</strong> 20 inches</li>
          <li><strong>Minimum height:</strong> 24 inches</li>
          <li><strong>Maximum sill height:</strong> 44 inches above the finished floor</li>
          <li><strong>Window well:</strong> Required if the opening is below grade; minimum 9 sq ft and 36&quot; wide</li>
          <li><strong>Window well cover:</strong> Required; must be openable from inside without tools</li>
        </ul>
        <p>
          Installing an egress window typically costs <strong>$3,000–$7,000</strong> including excavation, window, window well, and waterproofing. This is one of the most commonly underestimated line items in basement finishing projects.
        </p>

        <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>
          Basement Finishing Costs in Northern Virginia — 2026
        </h2>
        <p>
          Finished basement costs in Northern Virginia vary widely based on the level of finish, bathroom addition, egress windows, and contractor market conditions. Here are typical ranges for 2026:
        </p>

        <div style={{ overflowX: 'auto', marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#F7FAFC' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700, color: '#1A2B4A', borderBottom: '2px solid #E2E8F0' }}>Scope</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, color: '#1A2B4A', borderBottom: '2px solid #E2E8F0' }}>Entry</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, color: '#1A2B4A', borderBottom: '2px solid #E2E8F0' }}>Mid-Range</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, color: '#1A2B4A', borderBottom: '2px solid #E2E8F0' }}>Premium</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Open rec room (no bath)', '$18,000', '$30,000', '$50,000'],
                ['With half bath', '$28,000', '$45,000', '$70,000'],
                ['Bedroom + full bath', '$40,000', '$60,000', '$95,000'],
                ['Full basement suite + egress', '$55,000', '$80,000', '$130,000+'],
                ['ADU-ready (kitchen + bath + egress)', '$75,000', '$110,000', '$180,000+'],
              ].map(([s, e, m, p]) => (
                <tr key={s} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '10px 12px' }}>{s}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{e}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#1A2B4A' }}>{m}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Cost per square foot for a typical mid-range basement finish in Northern Virginia: <strong>$50–$90/sq ft</strong>.
        </p>

        <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>
          Key Line Items to Budget For
        </h2>
        <ul style={{ paddingLeft: 24 }}>
          <li><strong>Framing and drywall:</strong> $8–$15/sq ft</li>
          <li><strong>Insulation (walls and ceiling):</strong> $3–$6/sq ft</li>
          <li><strong>Electrical (new circuits + panel upgrade if needed):</strong> $5,000–$15,000</li>
          <li><strong>Plumbing (bathroom rough-in and finish):</strong> $8,000–$18,000</li>
          <li><strong>HVAC extension:</strong> $3,000–$8,000</li>
          <li><strong>Flooring (LVP or carpet):</strong> $4–$12/sq ft installed</li>
          <li><strong>Egress window:</strong> $3,000–$7,000</li>
          <li><strong>Permits:</strong> $500–$2,000 depending on jurisdiction and scope</li>
          <li><strong>Contingency (10–15%):</strong> Always include this</li>
        </ul>

        <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>
          Required Inspections for Basement Finishing in Northern Virginia
        </h2>
        <ol style={{ paddingLeft: 24 }}>
          <li><strong>Rough-in inspection:</strong> After framing, rough electrical, rough plumbing, and rough mechanical — before insulation or drywall goes up. This is the most important inspection; get it right before closing walls.</li>
          <li><strong>Insulation inspection:</strong> Required in some Northern Virginia jurisdictions before drywall.</li>
          <li><strong>Electrical inspection:</strong> May be separate from the building inspection.</li>
          <li><strong>Final inspection:</strong> After all work is complete, including flooring, trim, fixtures, and egress window installation.</li>
        </ol>

        <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>
          How Kealee Can Help With Your Basement Project
        </h2>
        <p>
          Kealee&apos;s AI concept packages are a fast, low-cost way to nail down your basement scope, cost band, and permit requirements before hiring a contractor. Starting at <strong>${CONCEPT_KITCHEN_PRICE}</strong>, your concept package includes:
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li>Basement layout options with room configuration direction</li>
          <li>Egress window requirement identification</li>
          <li>Permit scope assessment for your Northern Virginia jurisdiction</li>
          <li>Cost estimate with low/high range by scope tier</li>
          <li>Contractor-ready scope brief</li>
        </ul>
        <p>
          After the concept, our permit team can handle the permit filing — packages start at <strong>${PERMIT_STANDARD_PRICE}</strong>.
        </p>

        <div style={{ background: '#F7FAFC', borderRadius: 12, padding: 28, textAlign: 'center', marginTop: 40 }}>
          <h3 style={{ color: '#1A2B4A', fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>
            Get your basement concept and cost estimate
          </h3>
          <p style={{ color: '#4A5568', margin: '0 0 20px' }}>
            AI layout options, egress assessment, permit scope, and cost band — delivered in 24–48 hours.
          </p>
          <Link
            href="/marketplace/bath-remodel"
            style={{ display: 'inline-block', background: '#2ABFBF', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 16, padding: '14px 32px', borderRadius: 12 }}
          >
            Start My Basement Concept — from ${CONCEPT_KITCHEN_PRICE} →
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
              <Link href="/blog/dc-dcra-permit-guide" style={{ color: '#2ABFBF', fontWeight: 600 }}>
                DC DCRA Permit Guide — What Homeowners Need to Know →
              </Link>
            </li>
          </ul>
        </div>

      </article>
    </>
  )
}
