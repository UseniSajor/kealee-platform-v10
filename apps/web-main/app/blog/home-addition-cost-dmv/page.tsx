import type { Metadata } from 'next'
import Link from 'next/link'
import { CONCEPT_WHOLE_HOME_PRICE, PERMIT_STANDARD_PRICE } from '@/lib/marketing/pricing'

export const metadata: Metadata = {
  title: 'Home Addition Cost in the DMV — 2026 Guide | Kealee',
  description: `What does a home addition cost in DC, Maryland, and Virginia? Complete 2026 cost breakdown by addition type, jurisdiction, and quality tier. AI concept packages from $${CONCEPT_WHOLE_HOME_PRICE}.`,
  keywords: ['home addition cost DMV', 'house addition cost Maryland', 'home addition cost DC', 'home addition cost Virginia', 'room addition cost 2026'],
  openGraph: {
    title: 'Home Addition Cost in the DMV — 2026 Guide',
    description: 'Complete cost breakdown for home additions in DC, MD, and VA — by type, jurisdiction, and quality tier.',
    type: 'article',
    url: 'https://kealee.com/blog/home-addition-cost-dmv',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Home Addition Cost in the DMV — 2026 Guide',
  description: 'Cost breakdown for home additions in the Washington DC metro area.',
  author: { '@type': 'Organization', name: 'Kealee' },
  publisher: {
    '@type': 'Organization',
    name: 'Kealee',
    logo: { '@type': 'ImageObject', url: 'https://kealee.com/logo.png' },
  },
  datePublished: '2026-05-01',
  dateModified:  '2026-05-07',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://kealee.com/blog/home-addition-cost-dmv' },
}

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ color: '#1A2B4A', fontSize: 24, fontWeight: 700, marginTop: 36, marginBottom: 12 }}>{children}</h2>
)

const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 style={{ color: '#1A2B4A', fontSize: 19, fontWeight: 600, marginTop: 24, marginBottom: 8 }}>{children}</h3>
)

export default function HomeAdditionCostDMVPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px 80px', fontFamily: 'sans-serif', color: '#2D3748', lineHeight: 1.75 }}>

        <div style={{ marginBottom: 32 }}>
          <span style={{ background: 'rgba(232,121,58,0.1)', color: '#E8793A', borderRadius: 999, padding: '3px 12px', fontSize: 13, fontWeight: 600 }}>
            Cost Guides · DMV
          </span>
          <h1 style={{ color: '#1A2B4A', fontSize: 34, fontWeight: 800, marginTop: 12, marginBottom: 8, lineHeight: 1.2 }}>
            Home Addition Cost in the DMV — 2026 Guide
          </h1>
          <p style={{ color: '#718096', fontSize: 14 }}>
            By Kealee · Updated May 2026 · 9 min read · Cost Guides
          </p>
        </div>

        <p>
          A home addition is one of the highest-impact investments a homeowner can make — adding square footage, increasing resale value, and solving the space problem without moving. But in the Washington DC metro area (DC, Maryland, Virginia), home addition costs vary significantly based on project type, local labor markets, jurisdiction requirements, and material selections.
        </p>
        <p>
          This guide provides real cost ranges for 2026 based on Kealee&apos;s project data across the DMV, broken down by addition type, jurisdiction, and quality tier.
        </p>

        <H2>Why Home Addition Costs Vary in the DMV</H2>
        <p>
          The DC metro area has some of the highest construction costs in the Mid-Atlantic region. Key cost drivers include:
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li><strong>Labor rates:</strong> General contractors in DC and inner-ring suburbs charge 15–25% more than outer suburbs in PG County or Loudoun County.</li>
          <li><strong>Permit requirements:</strong> DC (DCRA), Montgomery County, and Arlington have some of the most rigorous permit review processes in the region, adding cost and time.</li>
          <li><strong>Material inflation:</strong> Lumber, concrete, and windows have stabilized in 2026 but remain above pre-2020 levels.</li>
          <li><strong>Zoning restrictions:</strong> Lot coverage limits, setbacks, and FAR restrictions vary by jurisdiction and can constrain addition size or scope.</li>
          <li><strong>Structural complexity:</strong> Attaching an addition to an existing structure requires foundation work, structural connections, and often waterproofing — all expensive line items.</li>
        </ul>

        <H2>Home Addition Cost by Type — DMV 2026</H2>

        <H3>1. Bump-Out Addition (50–200 sq ft)</H3>
        <p>
          A bump-out extends one room outward — typically a kitchen, bedroom, or bathroom — without adding a full story. The foundation is the most significant cost driver.
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li><strong>Entry-level (basic finish):</strong> $45,000–$75,000</li>
          <li><strong>Mid-range:</strong> $75,000–$120,000</li>
          <li><strong>Premium:</strong> $120,000–$200,000+</li>
        </ul>
        <p>
          Cost per square foot typically ranges from <strong>$350–$600/sq ft</strong> in the DMV.
        </p>

        <H3>2. Single-Story Addition (200–600 sq ft)</H3>
        <p>
          The most common home addition in the DMV — a single-story addition expanding a family room, primary suite, or in-law suite. Includes new foundation, framing, roofline tie-in, and full mechanical/electrical/plumbing.
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li><strong>Entry-level:</strong> $120,000–$180,000</li>
          <li><strong>Mid-range:</strong> $180,000–$280,000</li>
          <li><strong>Premium:</strong> $280,000–$450,000+</li>
        </ul>
        <p>
          Cost per square foot: <strong>$300–$550/sq ft</strong>.
        </p>

        <H3>3. Second-Story Addition (Full floor)</H3>
        <p>
          Adding a full second story to a ranch or cape-cod home is the most disruptive but highest-value addition type. The existing roof is removed and replaced, the first floor must be reinforced to handle the new load, and the entire home is temporarily exposed during construction.
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li><strong>Entry-level:</strong> $250,000–$350,000</li>
          <li><strong>Mid-range:</strong> $350,000–$550,000</li>
          <li><strong>Premium:</strong> $550,000–$900,000+</li>
        </ul>
        <p>
          Expect to budget for temporary relocation (3–5 months) and temporary storage — add $8,000–$20,000 for these costs.
        </p>

        <H3>4. Garage Addition</H3>
        <p>
          A detached or attached garage is among the most cost-effective additions in terms of cost per square foot, since the structure is simpler and finish requirements are lower.
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li><strong>Single-car detached (basic):</strong> $35,000–$60,000</li>
          <li><strong>Two-car attached (with HVAC and bonus room):</strong> $80,000–$150,000</li>
          <li><strong>Two-car detached with studio above:</strong> $120,000–$250,000</li>
        </ul>

        <H3>5. ADU (Accessory Dwelling Unit)</H3>
        <p>
          ADUs — detached guest houses, garage conversions, or above-garage units — are increasingly popular in the DMV due to rental income potential and multigenerational living demand. Costs vary widely:
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li><strong>Garage conversion ADU:</strong> $60,000–$120,000</li>
          <li><strong>Detached ADU (new construction):</strong> $150,000–$350,000</li>
          <li><strong>Above-garage ADU:</strong> $100,000–$220,000</li>
        </ul>

        <H2>Home Addition Costs by Jurisdiction — DMV</H2>
        <p>
          Labor and permit costs vary meaningfully across the DMV:
        </p>
        <div style={{ overflowX: 'auto', marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#F7FAFC' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700, color: '#1A2B4A', borderBottom: '2px solid #E2E8F0' }}>Jurisdiction</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, color: '#1A2B4A', borderBottom: '2px solid #E2E8F0' }}>Labor Premium</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, color: '#1A2B4A', borderBottom: '2px solid #E2E8F0' }}>Permit Timeline</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Washington DC (DCRA)', '+20–30%', '8–16 weeks'],
                ['Montgomery County, MD', '+15–20%', '6–10 weeks'],
                ['Prince George\'s County, MD', '+5–10%', '4–8 weeks'],
                ['Arlington County, VA', '+15–25%', '6–12 weeks'],
                ['Fairfax County, VA', '+10–15%', '4–8 weeks'],
                ['Alexandria, VA', '+10–20%', '6–10 weeks'],
              ].map(([j, l, p]) => (
                <tr key={j} style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '10px 12px' }}>{j}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#E8793A', fontWeight: 600 }}>{l}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>{p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H2>What&apos;s Included in a Home Addition Cost Estimate</H2>
        <p>
          A complete home addition cost estimate should include:
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li><strong>Site preparation:</strong> Excavation, grading, utility locating ($3,000–$15,000)</li>
          <li><strong>Foundation:</strong> Slab, crawl space, or full basement ($15,000–$60,000 depending on type)</li>
          <li><strong>Framing:</strong> Lumber, labor, structural steel if needed ($30–$60/sq ft)</li>
          <li><strong>Exterior:</strong> Roofing, siding, windows, doors — matched to existing ($25–$80/sq ft)</li>
          <li><strong>Insulation and drywall:</strong> ($8–$15/sq ft)</li>
          <li><strong>Mechanical, electrical, plumbing (MEP):</strong> ($40–$100/sq ft depending on scope)</li>
          <li><strong>Interior finishes:</strong> Flooring, trim, paint, cabinetry ($20–$150/sq ft depending on tier)</li>
          <li><strong>Design and permit fees:</strong> ($5,000–$25,000+)</li>
          <li><strong>Contingency (10–15%):</strong> Always budget this</li>
        </ul>

        <H2>How Kealee Helps With Home Additions</H2>
        <p>
          Kealee&apos;s AI concept packages give you a project-specific cost band before you hire a contractor or pay for architect drawings. Starting at <strong>${CONCEPT_WHOLE_HOME_PRICE}</strong>, your concept package includes:
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li>Addition scope summary and floor plan direction</li>
          <li>Itemized cost estimate with low/high ranges</li>
          <li>Permit scope identification for your jurisdiction</li>
          <li>Zoning and FAR feasibility summary</li>
          <li>Contractor-ready scope outline</li>
        </ul>
        <p>
          After the concept, our permit team can handle the building permit filing for your jurisdiction — packages start at <strong>${PERMIT_STANDARD_PRICE}</strong>.
        </p>

        <div style={{ background: '#F7FAFC', borderRadius: 12, padding: 28, textAlign: 'center', marginTop: 40 }}>
          <h3 style={{ color: '#1A2B4A', fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>
            Get a project-specific home addition cost estimate
          </h3>
          <p style={{ color: '#4A5568', margin: '0 0 20px' }}>
            AI concept with floor plan direction, permit scope, and cost band — delivered in 24–48 hours.
          </p>
          <Link
            href="/intake/interior-reno"
            style={{ display: 'inline-block', background: '#2ABFBF', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 16, padding: '14px 32px', borderRadius: 12 }}
          >
            Start My Addition Concept — from ${CONCEPT_WHOLE_HOME_PRICE} →
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
              <Link href="/blog/dc-dcra-permit-guide" style={{ color: '#2ABFBF', fontWeight: 600 }}>
                DC DCRA Permit Guide — What Homeowners Need to Know →
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
