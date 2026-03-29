import Link from 'next/link'

export default function FeaturedProductsSection() {
  return (
    <div className="sec" id="featured">
      <div className="ey">Featured products</div>
      <h2 className="h2">What homeowners are ordering now</h2>
      <p className="sub">Per-service pricing. No subscription required.</p>
      <div className="fg">
        <Link href="/products/ai-design" className="fc">
          <div className="fci">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=700&q=60&auto=format&fit=crop" alt="Concept" />
            <span className="fbg bgo">Start here</span>
          </div>
          <div className="fcb">
            <div className="fclbl">AI design engine</div>
            <h4>Concept + Validation Report</h4>
            <p>Floor plan, zoning check, cost band, and permit risk. Staff reviewed. Delivered in 24 hours.</p>
            <div className="fcp">Starting at $395 <small>one-time</small></div>
          </div>
        </Link>
        <Link href="/permits" className="fc">
          <div className="fci">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=700&q=60&auto=format&fit=crop" alt="Permit" />
            <span className="fbg bgs">DC · MD · VA</span>
          </div>
          <div className="fcb">
            <div className="fclbl">Permit services</div>
            <h4>Permit Package</h4>
            <p>Application, drawings, submission, and comment response. You do not call the permit office.</p>
            <div className="fcp">$950 <small>one-time</small></div>
          </div>
        </Link>
        <Link href="/products/cost-estimate" className="fc">
          <div className="fci">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=700&q=60&auto=format&fit=crop" alt="Estimate" />
            <span className="fbg bgs">RSMeans data</span>
          </div>
          <div className="fcb">
            <div className="fclbl">Cost estimation</div>
            <h4>Detailed Cost Estimate</h4>
            <p>Human-reviewed, RSMeans-validated, trade-by-trade breakdown. Lender-ready PDF.</p>
            <div className="fcp">$595 <small>one-time</small></div>
          </div>
        </Link>
        <Link href="/products/adu-bundle" className="fc">
          <div className="fci">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=700&q=60&auto=format&fit=crop" alt="ADU bundle" />
            <span className="fbg bgo">Bundle</span>
          </div>
          <div className="fcb">
            <div className="fclbl">Project bundle</div>
            <h4>ADU Concept + Permit Package</h4>
            <p>Floor plan, zoning check, cost band, and full permit preparation — bundled for ADU projects.</p>
            <div className="fcp">$1,345 <small>bundle</small></div>
          </div>
        </Link>
        <Link href="/homeowners/garden-farming" className="fc">
          <div className="fci">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=700&q=60&auto=format&fit=crop" alt="Landscape" />
            <span className="fbg bgg">Design + Install</span>
          </div>
          <div className="fcb">
            <div className="fclbl">Outdoor services</div>
            <h4>Landscape Design &amp; Install</h4>
            <p>Beds, hardscape, drainage, and planting — designed and installed by verified landscape contractors.</p>
            <div className="fcp">per service <small>custom quote</small></div>
          </div>
        </Link>
        <Link href="/products/pm-advisory" className="fc">
          <div className="fci">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=700&q=60&auto=format&fit=crop" alt="PM Advisory" />
            <span className="fbg bgs">One-time fee</span>
          </div>
          <div className="fcb">
            <div className="fclbl">Build your project</div>
            <h4>PM Advisory</h4>
            <p>Monthly site inspection, photo report, milestone sign-off, and issue log for your active build.</p>
            <div className="fcp">$950 <small>per project</small></div>
          </div>
        </Link>
      </div>
    </div>
  )
}
