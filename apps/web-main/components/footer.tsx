export function SiteFooter() {
  return (
    <>
      {/* FOOTER FAQ STRIP */}
      <div className="fqs">
        <div className="fqsi">
          <div className="fqsc">
            <h5>AI Concept Design</h5>
            <p>Starter $599 · Professional $1,299 · Enterprise CFQ · Portal delivery in 5–7 business days</p>
          </div>
          <div className="fqsc">
            <h5>Permit services</h5>
            <p>Standard $495 · Multi-Trade $895 · Full Service $1,495 · Kealee submits every tier · Biweekly updates</p>
          </div>
          <div className="fqsc">
            <h5>Contractor marketplace</h5>
            <p>Contractor network screened for licensing, insurance, and fit · Matched by trade and county</p>
          </div>
          <div className="fqsc">
            <h5>Milestone pay &amp; escrow</h5>
            <p>Free with every project · Funds held until you approve · Lien waivers automatic · 10% retainage standard</p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="fi-w">
          <div className="ft">
            <div className="fb">
              <div className="fbl">Kealee</div>
              <p>AI-powered construction management for DC, Maryland, and Virginia. Built by builders since 2002.</p>
            </div>
            <div>
              <div className="fch">Services</div>
              <a href="/concept-package" className="fca">AI Concept Design</a>
              <a href="/architect-vip" className="fca">Architect VIP</a>
              <a href="/permits" className="fca">Permit Services</a>
              <a href="/paths" className="fca">Choose Your Path</a>
              <a href="/#milestone-pay" className="fca">Milestone Pay</a>
            </div>
            <div>
              <div className="fch">Marketplace</div>
              <a href="/marketplace" className="fca">General contractors</a>
              <a href="/marketplace" className="fca">Specialty trades</a>
              <a href="/marketplace" className="fca">Landscape + garden</a>
              <a href="/marketplace" className="fca">Exterior services</a>
              <a href="/marketplace" className="fca">Per-service pricing</a>
            </div>
            <div>
              <div className="fch">Portals</div>
              <a href="/auth/sign-in" className="fca">Client login</a>
              <a href={process.env.NEXT_PUBLIC_OWNER_PORTAL_URL ?? '/auth/sign-in'} className="fca">Project owner portal</a>
              <a href={process.env.NEXT_PUBLIC_CONTRACTOR_PORTAL_URL ?? '/auth/sign-in'} className="fca">Contractor portal</a>
              <a href={process.env.NEXT_PUBLIC_DEVELOPER_PORTAL_URL ?? '/auth/sign-in'} className="fca">Developer portal</a>
            </div>
            <div>
              <div className="fch">Help</div>
              <a href="/#faq" className="fca">FAQ</a>
              <a href="/contact" className="fca">Contact</a>
              <a href="/about" className="fca">About Kealee</a>
              <a href="/terms" className="fca">Terms</a>
              <a href="/privacy" className="fca">Privacy</a>
            </div>
          </div>
          <div className="fbot">
            <span>© 2026 Kealee Platform LLC · Washington DC Metro Area</span>
            <span>Kealee Construction LLC est. 2002 · DC · MD · VA</span>
          </div>
        </div>
      </footer>
    </>
  )
}
