import Link from 'next/link'

export default function MoreProductsSection() {
  return (
    <div className="sec-s">
      <div className="sec-s-i">
        <div className="ey">More products</div>
        <h2 className="h2">Per-service pricing on everything</h2>
        <p className="sub">Order one service at a time. No subscription required for homeowners and project owners.</p>
        <div className="fp2">
          <Link href="/homeowners/garden-farming" className="fc">
            <div className="fci">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=700&q=60&auto=format&fit=crop" alt="Garden" />
              <span className="fbg bgg">Design + Install</span>
            </div>
            <div className="fcb">
              <div className="fclbl">Outdoor services</div>
              <h4>Garden design &amp; install</h4>
              <p>Beds, hardscape, irrigation, and planting by verified landscape contractors.</p>
              <div className="fcp">per service <small>custom quote</small></div>
            </div>
          </Link>
          <Link href="/concept-engine/exterior" className="fc">
            <div className="fci">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=60&auto=format&fit=crop" alt="Exterior" />
              <span className="fbg bgs">Permit included</span>
            </div>
            <div className="fcb">
              <div className="fclbl">Exterior services</div>
              <h4>Exterior renovation</h4>
              <p>Deck, siding, roofing, windows — permit filing from $149 included in most exterior scopes.</p>
              <div className="fcp">from $149 <small>permit filing</small></div>
            </div>
          </Link>
          <Link href="/concept?q=Basement+finish" className="fc">
            <div className="fci">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=700&q=60&auto=format&fit=crop" alt="Basement" />
              <span className="fbg bgo">AI design ready</span>
            </div>
            <div className="fcb">
              <div className="fclbl">AI concept engine</div>
              <h4>Basement finish concept</h4>
              <p>Floor plan options, egress check, structural flag, and permit scope. Staff reviewed in 24 hours.</p>
              <div className="fcp">$395 <small>one-time</small></div>
            </div>
          </Link>
          <Link href="/concept?q=Certified+estimate" className="fc">
            <div className="fci">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=700&q=60&auto=format&fit=crop" alt="Certified estimate" />
              <span className="fbg bgs">Lender ready</span>
            </div>
            <div className="fcb">
              <div className="fclbl">Cost estimation</div>
              <h4>Certified Cost Estimate</h4>
              <p>Licensed estimator sign-off, RSMeans citations, investor-ready format. Accepted by most DMV lenders.</p>
              <div className="fcp">$1,850 <small>one-time</small></div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
